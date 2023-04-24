import * as OJP from 'ojp-sdk';
import { TripServiceRequest } from '../../types/serviceRequests';
import { PASSIVE_SYSTEM } from '../../config/passiveSystems';
import {
  completeTripWrapper,
  indexedTripWrapper,
  isTripReqPlace,
  tripReqPlace,
  tripsToExchangePointsWrapper,
} from '../../types/tripRequests';
import CONFIG from '../../config';
import { InterRegionTrip } from './interRegionTrip';
import { InterRegionTripAtDestination } from './InterRegionTripAtDestination';
import {
  generateTripRequestForPassiveSystem,
  getTripResponse,
} from './regionInternalTrip';

export class InterRegionTripAtIntermediate extends InterRegionTrip {
  private bestTrips: indexedTripWrapper[];
  private readonly tripsToExchangePointWrappers: tripsToExchangePointsWrapper[];
  public constructor(
    tripServiceRequest: TripServiceRequest,
    system1: PASSIVE_SYSTEM,
    system2: PASSIVE_SYSTEM,
    bestTrips: indexedTripWrapper[],
    tripsToExchangePointWrappers: tripsToExchangePointsWrapper[],
  ) {
    super(tripServiceRequest, system1, system2);
    this.bestTrips = bestTrips;
    this.tripsToExchangePointWrappers = tripsToExchangePointWrappers;
  }

  public async findBestTrip(): Promise<InterRegionTripAtDestination> {
    const completeTripWrappers: completeTripWrapper[] = (
      await Promise.all(
        this.bestTrips.map(async tripWrapper => {
          try {
            const place = tripWrapper.exchangePoint.getPlaceForSystem(
              this.system2,
            );
            const arrivalTimeTripBefore = tripWrapper.trip.computeArrivalTime();
            if (isTripReqPlace(place) && arrivalTimeTripBefore) {
              return {
                tripFromEP: await this.requestTripFromEP(
                  place,
                  arrivalTimeTripBefore,
                ),
                tripToEP: tripWrapper,
              };
            }
            return null;
          } catch (e) {
            console.log(e);
            return null;
          }
        }),
      )
    )
      .flatMap(f =>
        f && f.tripFromEP.trips.length > 0 && f.tripFromEP.trips[0] ? [f] : [],
      )
      .map(wrapper => {
        const departureAtEP =
          wrapper.tripFromEP.trips[0].computeDepartureTime();
        const exchangePoint = wrapper.tripToEP.exchangePoint;
        const tripResponseToEP = this.tripsToExchangePointWrappers.find(
          x => x.exchangePoint === exchangePoint,
        );
        if (departureAtEP && tripResponseToEP) {
          wrapper.tripToEP.trip =
            tripResponseToEP.tripResponse.trips
              .filter(
                x =>
                  (x.computeArrivalTime() ?? Number.MAX_VALUE) <=
                    departureAtEP &&
                  InterRegionTripAtIntermediate.departureIsMinXMinsEarlierThanArrival(
                    x,
                    departureAtEP,
                  ),
              )
              .sort(
                (a, b) =>
                  (b.computeArrivalTime()?.getTime() ?? 0) -
                  (a.computeArrivalTime()?.getTime() ?? 0),
              )[0] ?? wrapper.tripToEP.trip;
        }
        return wrapper;
      });
    return new InterRegionTripAtDestination(
      this.tripServiceRequest,
      this.system1,
      this.system2,
      this.tripsToExchangePointWrappers.map(
        t => t.tripResponse.contextLocations,
      ),
      completeTripWrappers,
    );
  }

  private static departureIsMinXMinsEarlierThanArrival(
    trip: OJP.Trip,
    arrivalTimeTripBefore: Date,
  ): boolean {
    return (
      (trip.computeDepartureTime()?.getTime() ?? 0) >=
      arrivalTimeTripBefore.getTime() + CONFIG.MIN_MINS_AT_EP * 60000
    );
  }

  private async requestTripFromEP(place: tripReqPlace, arrivalTimeAtEP: Date) {
    const tripRequest = generateTripRequestForPassiveSystem(
      this.tripServiceRequest,
      this.system2,
      undefined,
      OJP.Location.initWithStopPlaceRef(place.stopPointRef, place.locationName),
      // 3 minutes min to change train
      new Date(arrivalTimeAtEP.getTime() + CONFIG.MIN_MINS_AT_EP * 60000),
    );
    const tripResponse = await getTripResponse(tripRequest);
    const filteredTrips = tripResponse.trips.filter(trip => {
      return InterRegionTripAtIntermediate.departureIsMinXMinsEarlierThanArrival(
        trip,
        arrivalTimeAtEP,
      );
    });
    return {
      responseXMLText: tripResponse.responseXMLText,
      contextLocations: tripResponse.contextLocations,
      hasValidResponse: tripResponse.hasValidResponse,
      trips: [filteredTrips[0]],
    };
  }
}
