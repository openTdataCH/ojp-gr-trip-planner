import * as OJP from 'ojp-sdk';
import { TripServiceRequest } from '../../types/serviceRequests';
import { PASSIVE_SYSTEM } from '../../config/passiveSystems';
import { ExchangePoints } from '../../utils/exchangePoints';
import {
  indexedTripWrapper,
  isTripReqPlace,
  tripReqPlace,
  tripsToExchangePointsWrapper,
} from '../../types/tripRequests';
import { InterRegionTrip } from './interRegionTrip';
import { InterRegionTripAtIntermediate } from './InterRegionTripAtIntermediate';
import {
  generateTripRequestForPassiveSystem,
  getTripResponse,
} from './regionInternalTrip';

export class InterRegionTripAtStart extends InterRegionTrip {
  public constructor(
    tripServiceRequest: TripServiceRequest,
    system1: PASSIVE_SYSTEM,
    system2: PASSIVE_SYSTEM,
  ) {
    super(tripServiceRequest, system1, system2);
  }

  public async selectExchangePointsAndTripsToThem(): Promise<InterRegionTripAtIntermediate> {
    const tripsToExchangePointsWrappers: tripsToExchangePointsWrapper[] = (
      await Promise.all(
        ExchangePoints.getBestExchangePoints(
          this.tripServiceRequest.body.origin.placeRef.stopPointRef,
          this.tripServiceRequest.body.destination.placeRef.stopPointRef,
        ).map(async exchangePoint => {
          try {
            const place = exchangePoint.getPlaceForSystem(this.system1);
            return isTripReqPlace(place)
              ? {
                  tripResponse: await this.requestTripToEP(place),
                  exchangePoint,
                }
              : null;
          } catch (e) {
            console.log(e);
            return null;
          }
        }),
      )
    ).flatMap(f => (f ? [f] : []));
    const bestTrips = this.findBestTrips(tripsToExchangePointsWrappers);
    return new InterRegionTripAtIntermediate(
      this.tripServiceRequest,
      this.system1,
      this.system2,
      bestTrips,
      tripsToExchangePointsWrappers.map(t => t.tripResponse.contextLocations),
    );
  }

  private findBestTrips(
    tripsToExchangePointWrapper: tripsToExchangePointsWrapper[],
    limit = 5,
  ) {
    return tripsToExchangePointWrapper
      .flatMap(this.indexTripsToExchangePoint)
      .sort(InterRegionTripAtStart.sortOnArrivalTime)
      .slice(0, limit);
  }

  private async requestTripToEP(place: tripReqPlace) {
    const tripRequest = generateTripRequestForPassiveSystem(
      this.tripServiceRequest,
      this.system1,
      OJP.Location.initWithStopPlaceRef(place.stopPointRef, place.locationName),
    );
    return await getTripResponse(tripRequest);
  }

  private indexTripsToExchangePoint(
    tripsToEPWrapper: tripsToExchangePointsWrapper,
    tripsResponsesIndex: number,
  ) {
    return tripsToEPWrapper.tripResponse.trips.map(trip => {
      return {
        trip,
        exchangePoint: tripsToEPWrapper.exchangePoint,
        tripsResponsesIndex,
      };
    });
  }

  private static sortOnArrivalTime(
    tripWrapper1: indexedTripWrapper,
    tripWrapper2: indexedTripWrapper,
  ) {
    return (
      (tripWrapper1.trip.computeArrivalTime()?.getTime() ?? 0) -
      (tripWrapper2.trip.computeArrivalTime()?.getTime() ?? 0)
    );
  }
}
