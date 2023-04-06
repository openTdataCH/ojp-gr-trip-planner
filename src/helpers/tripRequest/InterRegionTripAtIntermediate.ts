import * as OJP from 'ojp-sdk';
import { ExchangePoint } from '../../types/ExchangePoint';
import { ServiceRequest } from '../../types/serviceRequests';
import { PASSIVE_SYSTEM } from '../../config/passiveSystems';
import { InterRegionTrip } from './interRegionTrip';
import { InterRegionTripAtDestination } from './InterRegionTripAtDestination';
import {
  generateTripRequestForPassiveSystem,
  getTripResponse,
} from './regionInternalTrip';

export class InterRegionTripAtIntermediate extends InterRegionTrip {
  private bestTrips: {
    trip: OJP.Trip;
    exchangePoint: ExchangePoint;
    tripsResponsesIndex: number;
    tripsResponseIndex: number;
  }[];
  private tripsToExchangePoints: {
    tripResponse: OJP.TripsResponse;
    exchangePoint: ExchangePoint;
  }[];
  public constructor(
    tripServiceRequest: ServiceRequest & { requestType: 'TripRequest' },
    system1: PASSIVE_SYSTEM,
    system2: PASSIVE_SYSTEM,
    bestTrips: {
      trip: OJP.Trip;
      exchangePoint: ExchangePoint;
      tripsResponsesIndex: number;
      tripsResponseIndex: number;
    }[],
    tripsToExchangePoints: {
      tripResponse: OJP.TripsResponse;
      exchangePoint: ExchangePoint;
    }[],
  ) {
    super(tripServiceRequest, system1, system2);
    this.bestTrips = bestTrips;
    this.tripsToExchangePoints = tripsToExchangePoints;
  }

  public async findBestTrip(): Promise<InterRegionTripAtDestination> {
    const tripsFromExchangePoints = (
      await Promise.all(
        this.bestTrips.map(async tripWrapper => {
          try {
            const place = tripWrapper.exchangePoint.getPlaceForSystem(
              this.system2,
            );
            const arrivalTimeTripBefore = tripWrapper.trip.computeArrivalTime();
            if (
              place &&
              place.stopPointRef &&
              place.locationName &&
              arrivalTimeTripBefore
            ) {
              const tripRequest = generateTripRequestForPassiveSystem(
                this.tripServiceRequest,
                this.system2,
                undefined,
                OJP.Location.initWithStopPlaceRef(
                  place.stopPointRef,
                  place.locationName,
                ),
                // 3 minutes min to change train
                new Date(arrivalTimeTripBefore.getTime() + 3 * 60000),
              );
              const tripResponse = await getTripResponse(tripRequest);
              return {
                tripResponse: {
                  responseXMLText: tripResponse.responseXMLText,
                  contextLocations: tripResponse.contextLocations,
                  hasValidResponse: tripResponse.hasValidResponse,
                  trips: [
                    tripResponse.trips.filter(trip => {
                      return (
                        (trip.computeDepartureTime()?.getTime() ?? 0) >
                        arrivalTimeTripBefore.getTime() + 3 * 60000
                      );
                    })[0],
                  ],
                },
                ...tripWrapper,
              };
            }
            return null;
          } catch (e) {
            console.log(e);
            return null;
          }
        }),
      )
    ).flatMap(f =>
      f && f.tripResponse.trips.length > 0 && f.tripResponse.trips[0]
        ? [f]
        : [],
    );
    return new InterRegionTripAtDestination(
      this.tripServiceRequest,
      this.system1,
      this.system2,
      this.tripsToExchangePoints,
      tripsFromExchangePoints,
    );
  }
}
