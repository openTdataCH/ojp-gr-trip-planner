import * as OJP from 'ojp-sdk';
import { ExchangePointRequestParams } from './ExchangePointRequestParams';
import { XPathOJP } from './xpath-ojp';
import { Place } from './Place';

export class ExchangePointRequest extends OJP.OJPBaseRequest {
  public requestParams: ExchangePointRequestParams;
  private finished = false;

  constructor(
    stageConfig: OJP.StageConfig,
    requestParams: ExchangePointRequestParams,
  ) {
    super(stageConfig);
    this.requestParams = requestParams;
  }

  public isFinished() {
    return this.finished;
  }

  public static initWithNumberOfResults(
    stageConfig: OJP.StageConfig,
    numberOfResults: number,
  ): ExchangePointRequest {
    const requestParams = {
      numberOfResults,
      continueAt: 0,
    } as ExchangePointRequestParams;

    return new ExchangePointRequest(stageConfig, requestParams);
  }

  public fetchResponse(): Promise<Place[]> {
    this.buildRequestNode();
    const bodyXMLS = this.serviceRequestNode.end();

    return new Promise<Place[]>((resolve, reject) => {
      super.fetchOJPResponse(bodyXMLS, (responseText, errorData) => {
        const responseXML = new DOMParser().parseFromString(
          responseText,
          'application/xml',
        );

        const statusText = XPathOJP.queryText(
          '//siri:OJPResponse/siri:ServiceDelivery/siri:Status',
          responseXML,
        );
        const hasServiceStatusOK = statusText === 'true';

        const places: Place[] = [];

        if (!hasServiceStatusOK) {
          if (errorData === null && !hasServiceStatusOK) {
            errorData = {
              error: 'ParseLocationInformationRequestXMLError',
              message: 'Invalid LocationInformationRequest Response XML',
            };
          }

          reject(errorData);
          return;
        }

        const continueAt = XPathOJP.queryText(
          '//ojp:OJPExchangePointsDelivery/ojp:ContinueAt',
          responseXML,
        );

        this.finished = continueAt == null;

        this.requestParams.continueAt = +(continueAt ?? 0);

        const searchPlaceNodes = XPathOJP.queryNodes(
          '//ojp:OJPExchangePointsDelivery/ojp:Place',
          responseXML,
        );
        searchPlaceNodes.forEach(searchPlaceNode => {
          const placeNode = XPathOJP.queryNode('ojp:Place', searchPlaceNode);
          if (placeNode === null) {
            return;
          }

          const place = Place.initWithOJPContextNode(placeNode);
          places.push(place);
        });

        resolve(places);
      });
    });
  }

  private buildRequestNode() {
    this.serviceRequestNode.children = [];
    this.serviceRequestNode.ele('RequestorRef', 'OJP GR v1.0');
    const now = new Date();
    const dateF = now.toISOString();
    this.serviceRequestNode.ele('RequestTimestamp', dateF);

    const requestNode = this.serviceRequestNode.ele(
      'ojp:OJPExchangePointsRequest',
    );
    requestNode.ele('RequestTimestamp', dateF);

    const paramsNode = requestNode.ele('ojp:Params');

    const continueAt = this.requestParams.continueAt;

    const numberOfResults = this.requestParams.numberOfResults;
    if (numberOfResults) {
      paramsNode.ele('ojp:NumberOfResults', numberOfResults);
      paramsNode.ele('ojp:ContinueAt', continueAt);
    }
  }
}
