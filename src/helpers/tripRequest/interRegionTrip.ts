import * as OJP from 'ojp-sdk';
import { TripServiceRequest } from '../../types/serviceRequests';
import { PASSIVE_SYSTEM } from '../../config/passiveSystems';
import { indexedTripWrapper } from '../../types/tripRequests';

export abstract class InterRegionTrip {
  protected tripServiceRequest: TripServiceRequest;
  protected system1: PASSIVE_SYSTEM;
  protected system2: PASSIVE_SYSTEM;
  protected constructor(
    tripServiceRequest: TripServiceRequest,
    system1: PASSIVE_SYSTEM,
    system2: PASSIVE_SYSTEM,
  ) {
    this.tripServiceRequest = tripServiceRequest;
    this.system1 = system1;
    this.system2 = system2;
  }

  protected static sortWrapperOnArrivalTime(
    tripWrapper1: indexedTripWrapper,
    tripWrapper2: indexedTripWrapper,
  ) {
    return InterRegionTrip.sortOnArrivalTime(
      tripWrapper1.trip,
      tripWrapper2.trip,
    );
  }

  protected static sortOnArrivalTime(trip1: OJP.Trip, trip2: OJP.Trip) {
    return (
      (trip1.computeArrivalTime()?.getTime() ?? 0) -
      (trip2.computeArrivalTime()?.getTime() ?? 0)
    );
  }
}
