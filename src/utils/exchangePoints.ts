import { PASSIVE_SYSTEM, passiveSystemsConfig } from '../config/passiveSystems';
import { ExchangePoint } from '../types/ExchangePoint';
import { ExchangePointRequest } from '../ojp-sdk-extension/ExchangePointRequest';
import { Place } from '../ojp-sdk-extension/Place';

export abstract class ExchangePoints {
  private static unavailableSystems: PASSIVE_SYSTEM[] = [];
  private static exchangePoints: ExchangePoint[] = [];

  public static async init(system1: PASSIVE_SYSTEM, system2: PASSIVE_SYSTEM) {
    const system1ExchangePointRequest =
      ExchangePointRequest.initWithNumberOfResults(
        passiveSystemsConfig[system1],
        100,
      );
    const system2ExchangePointRequest =
      ExchangePointRequest.initWithNumberOfResults(
        passiveSystemsConfig[system2],
        100,
      );
    const [hashMap, places] = await Promise.all([
      await ExchangePoints.fillHashmap(system1ExchangePointRequest, system1),
      await ExchangePoints.getPlaces(system2ExchangePointRequest, system2),
    ]);

    places.forEach(place => {
      const privateCode = place.stopPlace?.privateCodes.get(
        'LA-ExchangePoint-ID',
      )?.value;
      if (privateCode) {
        const otherPlace = hashMap.get(privateCode);
        if (otherPlace) {
          this.exchangePoints.push(
            new ExchangePoint(otherPlace, system1, place, system2),
          );
        }
      }
    });
    console.log('Mapping EP completed');
  }

  private static async fillHashmap(
    request1: ExchangePointRequest,
    system: PASSIVE_SYSTEM,
  ): Promise<Map<string, Place>> {
    const hashMap = new Map<string, Place>();
    try {
      while (!request1.isFinished()) {
        (await request1.fetchResponse()).forEach(place => {
          const privateCode = place.stopPlace?.privateCodes.get(
            'LA-ExchangePoint-ID',
          )?.value;
          if (privateCode) {
            hashMap.set(privateCode, place);
          }
        });
      }
    } catch (e) {
      console.error(e);
      ExchangePoints.unavailableSystems.push(system);
    }
    return hashMap;
  }

  private static async getPlaces(
    request2: ExchangePointRequest,
    system: PASSIVE_SYSTEM,
  ): Promise<Place[]> {
    const places: Place[] = [];
    try {
      while (!request2.isFinished()) {
        const newPlaces = await request2.fetchResponse();
        places.push(...newPlaces);
      }
    } catch (e) {
      console.error(e);
      ExchangePoints.unavailableSystems.push(system);
    }
    return places;
  }

  public static getUnavailableSystems() {
    return ExchangePoints.unavailableSystems;
  }
}
