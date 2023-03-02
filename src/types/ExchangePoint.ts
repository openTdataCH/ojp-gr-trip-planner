import { PASSIVE_SYSTEM } from '../config/passiveSystems';
import { Place } from '../ojp-sdk-extension/Place';

export class ExchangePoint {
  place1;
  place2;
  system1;
  system2;
  constructor(
    location1: Place,
    system1: PASSIVE_SYSTEM,
    location2: Place,
    system2: PASSIVE_SYSTEM,
  ) {
    this.place1 = location1;
    this.place2 = location2;
    this.system1 = system1;
    this.system2 = system2;
  }
}
