import { ServiceRequest } from '../../types/serviceRequests';
import { PASSIVE_SYSTEM } from '../../config/passiveSystems';

export abstract class InterRegionTrip {
  protected tripServiceRequest: ServiceRequest & { requestType: 'TripRequest' };
  protected system1: PASSIVE_SYSTEM;
  protected system2: PASSIVE_SYSTEM;
  protected constructor(
    tripServiceRequest: ServiceRequest & { requestType: 'TripRequest' },
    system1: PASSIVE_SYSTEM,
    system2: PASSIVE_SYSTEM,
  ) {
    this.tripServiceRequest = tripServiceRequest;
    this.system1 = system1;
    this.system2 = system2;
  }
}
