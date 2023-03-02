// OJP reference - these are the same?
//  - 8.4.5.2 StopPoint Structure
//  - 8.4.5.3 StopPlace Structure
import { XPathOJP } from './xpath-ojp';
import { PrivateCode, PrivateCodeSystems } from './PrivateCode';

type StopType = 'StopPlace' | 'StopPoint';

export class StopPlace {
  public stopPlaceRef: string;
  public stopPlaceName: string;
  public topographicPlaceRef: string | null;
  public stopType: StopType;
  public privateCodes: Map<PrivateCodeSystems, PrivateCode>;

  constructor(
    stopPlaceRef: string,
    stopPlaceName: string,
    topographicPlaceRef: string | null,
    privateCodes: Map<PrivateCodeSystems, PrivateCode>,
    stopType: StopType = 'StopPlace',
  ) {
    this.stopPlaceRef = stopPlaceRef;
    this.stopPlaceName = stopPlaceName;
    this.topographicPlaceRef = topographicPlaceRef;
    this.stopType = stopType;
    this.privateCodes = privateCodes;
  }

  public static initFromContextNode(contextNode: Node): StopPlace | null {
    let stopPlaceRef = XPathOJP.queryText(
      'ojp:StopPlace/ojp:StopPlaceRef',
      contextNode,
    );
    let stopPlaceName = XPathOJP.queryText(
      'ojp:StopPlace/ojp:StopPlaceName/ojp:Text',
      contextNode,
    );
    let privateCodeNodes = XPathOJP.queryNodes(
      'ojp:StopPlace/ojp:PrivateCode',
      contextNode,
    );

    if (!(stopPlaceRef && stopPlaceName && privateCodeNodes)) {
      stopPlaceRef = XPathOJP.queryText(
        'ojp:StopPoint/siri:StopPointRef',
        contextNode,
      );
      stopPlaceName = XPathOJP.queryText(
        'ojp:StopPoint/ojp:StopPointName/ojp:Text',
        contextNode,
      );
      privateCodeNodes = XPathOJP.queryNodes(
        'ojp:StopPoint/ojp:PrivateCode',
        contextNode,
      );
    }

    if (!(stopPlaceRef && stopPlaceName && privateCodeNodes)) {
      return null;
    }

    const topographicPlaceRef = XPathOJP.queryText(
      'ojp:StopPlace/ojp:TopographicPlaceRef',
      contextNode,
    );

    const privateCodes = new Map<PrivateCodeSystems, PrivateCode>();

    privateCodeNodes.forEach(node => {
      const system = XPathOJP.queryText('ojp:System', node);
      const value = XPathOJP.queryText('ojp:Value', node);
      if (system && value) {
        const privateCodeSystem = system as PrivateCodeSystems;
        privateCodes.set(
          privateCodeSystem,
          new PrivateCode(privateCodeSystem, value),
        );
      }
    });

    return new StopPlace(
      stopPlaceRef,
      stopPlaceName,
      topographicPlaceRef,
      privateCodes,
    );
  }
}
