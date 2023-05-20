import * as OJP from 'ojp-sdk';
import { PASSIVE_SYSTEM } from '../config/passiveSystems';

export abstract class NameToSystemMapper {
  private static nameToSystemMap = new Map<string, PASSIVE_SYSTEM>();
  private static nameToLocationMap = new Map<string, OJP.Location>();

  public static add(location: OJP.Location, system: PASSIVE_SYSTEM) {
    const stopPointRef = location.stopPointRef;
    if (!stopPointRef) return;
    this.nameToSystemMap.set(stopPointRef, system);
    this.nameToLocationMap.set(stopPointRef, location);
  }

  public static getSystems(name: string): PASSIVE_SYSTEM | undefined {
    return this.nameToSystemMap.get(name);
  }

  public static getLocation(name: string): OJP.Location | undefined {
    return this.nameToLocationMap.get(name);
  }
}
