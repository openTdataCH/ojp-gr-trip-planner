import { Location } from 'ojp-sdk';
import { PASSIVE_SYSTEM } from '../config/passiveSystems';

export abstract class NameToSystemMapper {
  private static nameToSystemMap = new Map<string, PASSIVE_SYSTEM>();
  private static duplicates = new Map<string, string>();

  public static add(location: Location, system: PASSIVE_SYSTEM) {
    const stopPointRef = location.stopPointRef;
    if (!stopPointRef) return;
    this.nameToSystemMap.set(stopPointRef, system);
  }

  public static getSystems(name: string): PASSIVE_SYSTEM | undefined {
    return this.nameToSystemMap.get(name);
  }

  public static addDuplicate(refDuplicate: string, refOriginal: string) {
    this.duplicates.set(refDuplicate, refOriginal);
  }

  public static getDuplicate(refDuplicate: string): string | undefined {
    return this.duplicates.get(refDuplicate);
  }
}
