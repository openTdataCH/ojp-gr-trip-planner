import OJP from 'ojp-sdk';
import { XPathOJP } from './xpath-ojp';
import { StopPlace } from './stop-place';

const { GeoPosition } = OJP;

export class Place {
  public locationName: string | null;
  public geoPosition: any | null;
  public stopPointRef: string | null;
  public stopPlace: StopPlace | null;

  constructor() {
    this.locationName = null;
    this.geoPosition = null;
    this.stopPointRef = null;
    this.stopPlace = null;
  }

  public static initWithOJPContextNode(contextNode: Node): Place {
    const place = new Place();

    let locationName = XPathOJP.queryText(
      'ojp:LocationName/ojp:Text',
      contextNode,
    );
    if (locationName === null) {
      locationName = XPathOJP.queryText(
        'ojp:StopPointName/ojp:Text',
        contextNode,
      );
    }
    place.locationName = locationName;
    place.stopPointRef = XPathOJP.queryText('siri:StopPointRef', contextNode);
    place.stopPlace = StopPlace.initFromContextNode(contextNode);
    place.geoPosition = GeoPosition.initFromContextNode(contextNode);

    if (place.stopPointRef === null && place.stopPlace?.stopPlaceRef) {
      place.stopPointRef = place.stopPlace.stopPlaceRef;
    }

    return place;
  }
}
