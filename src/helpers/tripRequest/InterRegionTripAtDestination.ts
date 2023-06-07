import * as OJP from 'ojp-sdk';
import { Duration } from 'ojp-sdk/lib/shared/duration';
import { TripServiceRequest } from '../../types/serviceRequests';
import { PASSIVE_SYSTEM } from '../../config/passiveSystems';
import {
  completeTripWrapper,
  indexedTripWrapper,
} from '../../types/tripRequests';
import { InterRegionTrip } from './interRegionTrip';

export class InterRegionTripAtDestination extends InterRegionTrip {
  private readonly contextLocations: OJP.Location[][];
  private completeTripWrappers: completeTripWrapper[];

  public constructor(
    tripServiceRequest: TripServiceRequest,
    system1: PASSIVE_SYSTEM,
    system2: PASSIVE_SYSTEM,
    contextLocations: OJP.Location[][],
    completeTripWrappers: completeTripWrapper[],
  ) {
    super(tripServiceRequest, system1, system2);
    this.contextLocations = contextLocations;
    this.completeTripWrappers = completeTripWrappers;
  }

  public getTripResponse(): OJP.TripsResponse {
    const tripResponse = this.prepareTripResponses().reduce(
      InterRegionTripAtDestination.reduceTripResponses,
      new OJP.TripsResponse(true, '', [], []),
    );
    return {
      ...tripResponse,
      contextLocations: this.makeDistinctLocations(
        tripResponse.contextLocations,
      ),
    };
  }

  private prepareTripResponses() {
    return this.completeTripWrappers
      .sort((wrapper1, wrapper2) => {
        return InterRegionTrip.sortOnArrivalTime(
          wrapper1.tripFromEP.trips[0],
          wrapper2.tripFromEP.trips[0],
        );
      })
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
      })
      .reduce(InterRegionTripAtDestination.filterDuplicates, []);
  }

  private static filterDuplicates(
    accumulator: OJP.TripsResponse[],
    currentValue: OJP.TripsResponse,
  ) {
    if (accumulator.length === 0) return [currentValue];
    const tripBefore = accumulator[accumulator.length - 1].trips[0];
    if (
      tripBefore.stats.startDatetime.getTime() ===
        currentValue.trips[0].stats.startDatetime.getTime() &&
      tripBefore.stats.endDatetime.getTime() ===
        currentValue.trips[0].stats.endDatetime.getTime()
    ) {
      if (
        tripBefore.stats.transferNo > currentValue.trips[0].stats.transferNo
      ) {
        accumulator[accumulator.length - 1] = currentValue;
      }
    } else {
      accumulator.push(currentValue);
    }
    return accumulator;
  }

  private static createTripStats(
    tripToEP: indexedTripWrapper,
    tripFromEP: OJP.TripsResponse,
    intermediateLegDuration: Duration,
  ) {
    return {
      duration: tripToEP.trip.stats.duration
        .plus(tripFromEP.trips[0].stats.duration)
        .plus(intermediateLegDuration),
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
    const intermediateLegDuration =
      InterRegionTripAtDestination.computeIntermediateTripDuration(
        tripToEP,
        tripFromEP,
      );
    const tripStats = InterRegionTripAtDestination.createTripStats(
      tripToEP,
      tripFromEP,
      intermediateLegDuration,
    );
    const intermediateLeg = new OJP.TripContinousLeg(
      'TransferLeg',
      -1,
      20,
      tripToEP.trip.legs[tripToEP.trip.legs.length - 1].toLocation,
      tripFromEP.trips[0].legs[0].fromLocation,
    );
    intermediateLeg.legDuration = intermediateLegDuration;
    return new OJP.Trip(
      tripToEP.trip.id + '::' + tripFromEP.trips[0].id,
      [...tripToEP.trip.legs, intermediateLeg, ...tripFromEP.trips[0].legs],
      tripStats,
    );
  }

  private aggregateContextLocations(tripWrapper: completeTripWrapper) {
    return [
      ...this.contextLocations[tripWrapper.tripToEP.tripsResponsesIndex],
      ...tripWrapper.tripFromEP.contextLocations,
    ];
  }

  private static computeIntermediateTripDuration(
    tripToEP: indexedTripWrapper,
    tripFromEP: OJP.TripsResponse,
  ) {
    const arrivalTimeAtEP = tripToEP.trip.computeArrivalTime()?.getTime();
    const departureAtEP = tripFromEP.trips[0].computeDepartureTime()?.getTime();
    return Duration.initFromTotalMinutes(
      arrivalTimeAtEP && departureAtEP
        ? (departureAtEP - arrivalTimeAtEP) / 60000
        : 0,
    );
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

  private makeDistinctLocations(locations: OJP.Location[]) {
    const distinctMap = new Map<string, OJP.Location>();
    locations.forEach(location => {
      const stopPointRef = location.stopPointRef;
      if (stopPointRef) {
        distinctMap.set(stopPointRef, location);
      }
    });
    return [...distinctMap.values()];
  }
}
