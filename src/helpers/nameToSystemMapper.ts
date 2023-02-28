import { Location } from 'ojp-sdk';
import { PASSIVE_SYSTEM } from '../config/passiveSystems';

export abstract class NameToSystemMapper {
  private static nameToSystemMap = new Map<string, PASSIVE_SYSTEM[]>();

  public static add(location: Location, system: PASSIVE_SYSTEM) {
    const name = location.computeLocationName() ?? '';
    const systems = new Set(this.getSystems(name));
    systems.add(system);
    this.nameToSystemMap.set(name, [...systems]);
    return location;
  }

  public static getSystems(name: string): PASSIVE_SYSTEM[] {
    return this.nameToSystemMap.get(name) ?? [];
  }
}
