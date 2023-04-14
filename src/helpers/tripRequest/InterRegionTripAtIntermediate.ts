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
import { InterRegionTrip } from './interRegionTrip';
import { InterRegionTripAtDestination } from './InterRegionTripAtDestination';
import {
  generateTripRequestForPassiveSystem,
  getTripResponse,
} from './regionInternalTrip';

export class InterRegionTripAtIntermediate extends InterRegionTrip {
  private bestTrips: indexedTripWrapper[];
  private readonly tripsToExchangePointsWrappers: tripsToExchangePointsWrapper[];
  public constructor(
    tripServiceRequest: TripServiceRequest,
    system1: PASSIVE_SYSTEM,
    system2: PASSIVE_SYSTEM,
    bestTrips: indexedTripWrapper[],
    tripsToExchangePointsWrappers: tripsToExchangePointsWrapper[],
  ) {
    super(tripServiceRequest, system1, system2);
    this.bestTrips = bestTrips;
    this.tripsToExchangePointsWrappers = tripsToExchangePointsWrappers;
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
    ).flatMap(f =>
      f && f.tripFromEP.trips.length > 0 && f.tripFromEP.trips[0] ? [f] : [],
    );
    return new InterRegionTripAtDestination(
      this.tripServiceRequest,
      this.system1,
      this.system2,
      this.tripsToExchangePointsWrappers,
      completeTripWrappers,
    );
  }

  private static departureIsMin3MinsEarlierThanArrival(
    trip: OJP.Trip,
    arrivalTimeTripBefore: Date,
  ): boolean {
    return (
      (trip.computeDepartureTime()?.getTime() ?? 0) >
      arrivalTimeTripBefore.getTime() + 3 * 60000
    );
  }

  private async requestTripFromEP(place: tripReqPlace, arrivalTimeAtEP: Date) {
    const tripRequest = generateTripRequestForPassiveSystem(
      this.tripServiceRequest,
      this.system2,
      undefined,
      OJP.Location.initWithStopPlaceRef(place.stopPointRef, place.locationName),
      // 3 minutes min to change train
      new Date(arrivalTimeAtEP.getTime() + 3 * 60000),
    );
    const tripResponse = await getTripResponse(tripRequest);
    const filteredTrips = tripResponse.trips.filter(trip => {
      return InterRegionTripAtIntermediate.departureIsMin3MinsEarlierThanArrival(
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
