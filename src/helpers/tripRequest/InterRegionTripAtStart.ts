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
import CONFIG from '../../config';
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
          CONFIG.NUMBER_OF_PRESELECTED_EPS,
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
    const bestTrips = InterRegionTripAtStart.findBestTrips(
      tripsToExchangePointsWrappers,
    );
    return new InterRegionTripAtIntermediate(
      this.tripServiceRequest,
      this.system1,
      this.system2,
      bestTrips,
      tripsToExchangePointsWrappers,
    );
  }

  private static findBestTrips(
    tripsToExchangePointWrapper: tripsToExchangePointsWrapper[],
    limit = 5,
  ) {
    return tripsToExchangePointWrapper
      .map(this.sortAndFilterTrips)
      .flatMap(InterRegionTripAtStart.indexTripsToExchangePoint)
      .sort(InterRegionTrip.sortWrapperOnArrivalTime)
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

  private static sortAndFilterTrips(wrapper: tripsToExchangePointsWrapper) {
    return {
      ...wrapper,
      tripResponse: {
        ...wrapper.tripResponse,
        trips: wrapper.tripResponse.trips
          .sort(InterRegionTrip.sortOnArrivalTime)
          .filter(x => !!x),
      },
    };
  }

  private static indexTripsToExchangePoint(
    tripsToEPWrapper: tripsToExchangePointsWrapper,
    tripsResponsesIndex: number,
  ): indexedTripWrapper[] {
    return tripsToEPWrapper.tripResponse.trips[0]
      ? [
          {
            trip: tripsToEPWrapper.tripResponse.trips[0],
            exchangePoint: tripsToEPWrapper.exchangePoint,
            tripsResponsesIndex,
          },
        ]
      : [];
  }
}
