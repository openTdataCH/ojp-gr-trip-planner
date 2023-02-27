import { Location } from 'ojp-sdk';
import { PASSIVE_SYSTEM } from '@/config/passiveSystems';

export abstract class NameToSystemMapper {
  private static nameToSystemMap = new Map();

  public static add(location: Location, system: PASSIVE_SYSTEM) {
    this.nameToSystemMap.set(location.computeLocationName(), system);
    return location;
  }

  public static getSystem(name: string): PASSIVE_SYSTEM {
    return this.nameToSystemMap.get(name);
  }
}
