import * as OJP from 'ojp-sdk';
import { ExchangePoint } from '../../types/ExchangePoint';
import { ServiceRequest } from '../../types/serviceRequests';
import { PASSIVE_SYSTEM } from '../../config/passiveSystems';
import { ExchangePoints } from '../../utils/exchangePoints';
import { InterRegionTrip } from './interRegionTrip';
import { InterRegionTripAtIntermediate } from './InterRegionTripAtIntermediate';
import {
  generateTripRequestForPassiveSystem,
  getTripResponse,
} from './regionInternalTrip';

export class InterRegionTripAtStart extends InterRegionTrip {
  public constructor(
    tripServiceRequest: ServiceRequest & { requestType: 'TripRequest' },
    system1: PASSIVE_SYSTEM,
    system2: PASSIVE_SYSTEM,
  ) {
    super(tripServiceRequest, system1, system2);
  }

  public async selectExchangePointsAndTripsToThem(): Promise<InterRegionTripAtIntermediate> {
    const tripsToExchangePoints: {
      tripResponse: OJP.TripsResponse;
      exchangePoint: ExchangePoint;
    }[] = (
      await Promise.all(
        ExchangePoints.getExchangePoints().map(async exchangePoint => {
          try {
            const place = exchangePoint.getPlaceForSystem(this.system1);
            if (place && place.stopPointRef && place.locationName) {
              const tripRequest = generateTripRequestForPassiveSystem(
                this.tripServiceRequest,
                this.system1,
                OJP.Location.initWithStopPlaceRef(
                  place.stopPointRef,
                  place.locationName,
                ),
              );
              return {
                tripResponse: await getTripResponse(tripRequest),
                exchangePoint,
              };
            }
            return null;
          } catch (e) {
            console.log(e);
            return null;
          }
        }),
      )
    ).flatMap(f => (f ? [f] : []));
    const bestTrips = this.findBestTrips(tripsToExchangePoints);
    return new InterRegionTripAtIntermediate(
      this.tripServiceRequest,
      this.system1,
      this.system2,
      bestTrips,
      tripsToExchangePoints,
    );
  }

  private findBestTrips(
    tripsResponses: {
      tripResponse: OJP.TripsResponse;
      exchangePoint: ExchangePoint;
    }[],
    limit = 5,
  ) {
    return tripsResponses
      .flatMap((tripsResponse, tripsResponsesIndex) =>
        tripsResponse.tripResponse.trips.map((trip, tripsResponseIndex) => {
          return {
            trip,
            exchangePoint: tripsResponse.exchangePoint,
            tripsResponsesIndex,
            tripsResponseIndex,
          };
        }),
      )
      .sort(
        (trip1, trip2) =>
          (trip1.trip.computeArrivalTime()?.getTime() ?? 0) -
          (trip2.trip.computeArrivalTime()?.getTime() ?? 0),
      )
      .slice(0, limit);
  }
}
