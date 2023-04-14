import * as OJP from 'ojp-sdk';
import { TripServiceRequest } from '../../types/serviceRequests';
import { PASSIVE_SYSTEM } from '../../config/passiveSystems';
import {
  completeTripWrapper,
  indexedTripWrapper,
  tripsToExchangePointsWrapper,
} from '../../types/tripRequests';
import { InterRegionTrip } from './interRegionTrip';

export class InterRegionTripAtDestination extends InterRegionTrip {
  private tripsToExchangePointsWrappers: tripsToExchangePointsWrapper[];
  private completeTripWrappers: completeTripWrapper[];

  public constructor(
    tripServiceRequest: TripServiceRequest,
    system1: PASSIVE_SYSTEM,
    system2: PASSIVE_SYSTEM,
    tripsToExchangePointsWrappers: tripsToExchangePointsWrapper[],
    completeTripWrappers: completeTripWrapper[],
  ) {
    super(tripServiceRequest, system1, system2);
    this.tripsToExchangePointsWrappers = tripsToExchangePointsWrappers;
    this.completeTripWrappers = completeTripWrappers;
  }

  public getTripResponse(): OJP.TripsResponse {
    return this.prepareTripResponses().reduce(
      InterRegionTripAtDestination.reduceTripResponses,
    );
  }

  private prepareTripResponses() {
    return this.completeTripWrappers
      .sort(InterRegionTripAtDestination.sortOnArrivalTime)
      .map(tripWrapper => {
        return new OJP.TripsResponse(
          true,
          '',
          this.aggregateContextLocations(tripWrapper),
          [
            InterRegionTripAtDestination.createCompleteTrip(
              tripWrapper.tripToEP,
              tripWrapper.tripFromEP,
            ),
          ],
        );
      });
  }

  private static sortOnArrivalTime(
    tripWrapper1: completeTripWrapper,
    tripWrapper2: completeTripWrapper,
  ) {
    return (
      (tripWrapper1.tripFromEP.trips[0].computeArrivalTime()?.getTime() ?? 0) -
      (tripWrapper2.tripFromEP.trips[0].computeArrivalTime()?.getTime() ?? 0)
    );
  }

  private static createTripStats(
    tripToEP: indexedTripWrapper,
    tripFromEP: OJP.TripsResponse,
  ) {
    return {
      duration: tripToEP.trip.stats.duration.plus(
        tripFromEP.trips[0].stats.duration,
      ),
      distanceMeters:
        tripToEP.trip.stats.distanceMeters +
        tripFromEP.trips[0].stats.distanceMeters,
      transferNo:
        tripToEP.trip.stats.transferNo +
        tripFromEP.trips[0].stats.transferNo +
        1,
      startDatetime: tripToEP.trip.stats.startDatetime,
      endDatetime: tripFromEP.trips[0].stats.endDatetime,
    };
  }

  private static createCompleteTrip(
    tripToEP: indexedTripWrapper,
    tripFromEP: OJP.TripsResponse,
  ) {
    const tripStats = InterRegionTripAtDestination.createTripStats(
      tripToEP,
      tripFromEP,
    );
    const intermediateLeg = new OJP.TripContinousLeg(
      'TransferLeg',
      -1,
      20,
      tripToEP.trip.legs[tripToEP.trip.legs.length - 1].toLocation,
      tripFromEP.trips[0].legs[0].fromLocation,
    );
    return new OJP.Trip(
      tripToEP.trip.id + '::' + tripFromEP.trips[0].id,
      [...tripToEP.trip.legs, intermediateLeg, ...tripFromEP.trips[0].legs],
      tripStats,
    );
  }

  private aggregateContextLocations(tripWrapper: completeTripWrapper) {
    return [
      ...this.tripsToExchangePointsWrappers[
        tripWrapper.tripToEP.tripsResponsesIndex
      ].tripResponse.contextLocations,
      ...tripWrapper.tripFromEP.contextLocations,
    ];
  }

  private static reduceTripResponses(
    aggregatedResponse: OJP.TripsResponse,
    tripResponse: OJP.TripsResponse,
  ) {
    return {
      ...aggregatedResponse,
      contextLocations: aggregatedResponse.contextLocations.concat(
        tripResponse.contextLocations,
      ),
      trips: aggregatedResponse.trips.concat(tripResponse.trips),
    };
  }
}
