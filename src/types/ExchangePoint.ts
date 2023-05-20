import * as OJP from 'ojp-sdk';
import { PASSIVE_SYSTEM } from '../config/passiveSystems';
import { Place } from '../ojp-sdk-extension/Place';

export class ExchangePoint {
  place1;
  place2;
  system1;
  system2;
  private systemPlaceMap = new Map<PASSIVE_SYSTEM, Place>();
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
    this.systemPlaceMap.set(system1, location1);
    this.systemPlaceMap.set(system2, location2);
  }

  public getPlaceForSystem(system: PASSIVE_SYSTEM) {
    return this.systemPlaceMap.get(system);
  }

  public getManhattanDistance(origin: OJP.GeoPosition, destination: OJP.GeoPosition) {
    const exchangePoint = (this.place1.geoPosition ??
      this.place2.geoPosition) as OJP.GeoPosition;
    if (!exchangePoint) return Number.MAX_VALUE;
    return (
      origin.distanceFrom(exchangePoint) +
      destination.distanceFrom(exchangePoint)
    );
  }
}
