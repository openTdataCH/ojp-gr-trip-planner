import {
  isTripRequest,
  LocationInformationServiceRequest,
  OJP_TripRequest,
  TripServiceRequest,
  XMLRequest,
} from '../types/xmlRequest';
import { ServiceRequest } from '../types/serviceRequests';

declare global {
  interface Array<T> {
    pickOnlyOrThrow(): T;
  }
}

Array.prototype.pickOnlyOrThrow = function <T>(): T {
  if (this.length !== 1) {
    throw new Error('Array must have exactly one element.');
  }
  return this[0];
};

export function xmlToServiceRequest(xmlRequest: XMLRequest): ServiceRequest {
  const ojpServiceRequest = xmlRequest.ojp.ojprequest
    .pickOnlyOrThrow()
    .servicerequest.pickOnlyOrThrow();
  if (isTripRequest(ojpServiceRequest)) {
    const ojpTripServiceRequest = ojpServiceRequest as TripServiceRequest;
    const ojpTripRequest: OJP_TripRequest = ojpTripServiceRequest[
      'ojp:ojptriprequest'
    ].pickOnlyOrThrow() as OJP_TripRequest;
    const origin = ojpTripRequest['ojp:origin'].pickOnlyOrThrow();
    const placeRefOrigin = origin['ojp:placeref'].pickOnlyOrThrow();
    const destination = ojpTripRequest['ojp:destination'].pickOnlyOrThrow();
    const placeRefDestination = destination['ojp:placeref'].pickOnlyOrThrow();
    const params = ojpTripRequest['ojp:params'].pickOnlyOrThrow();
    return {
      requesterRef: ojpServiceRequest.requestorref.pickOnlyOrThrow(),
      requestType: 'TripRequest',
      requestTimestamp: ojpServiceRequest.requesttimestamp.pickOnlyOrThrow(),
      body: {
        origin: {
          placeRef: {
            stopPointRef: +placeRefOrigin.stoppointref.pickOnlyOrThrow(),
            locationName: placeRefOrigin['ojp:locationname']
              .pickOnlyOrThrow()
              ['ojp:text'].pickOnlyOrThrow(),
          },
          departTime: origin['ojp:deparrtime'].pickOnlyOrThrow(),
        },
        destination: {
          placeRef: {
            stopPointRef: +placeRefDestination.stoppointref.pickOnlyOrThrow(),
            locationName:
              placeRefDestination['ojp:locationname'].length <= 1
                ? placeRefDestination['ojp:locationname']
                    .at(0)
                    ?.['ojp:text'].pickOnlyOrThrow() ?? ''
                : '',
          },
        },
        params: {
          numberOfResults: +params['ojp:numberofresults'].pickOnlyOrThrow(),
          includeTrackSections:
            params['ojp:includetracksections'].pickOnlyOrThrow() === 'true',
          includeLegProjection:
            params['ojp:includelegprojection'].pickOnlyOrThrow() === 'true',
          includeTurnDescription:
            params['ojp:includeturndescription'].pickOnlyOrThrow() === 'true',
          includeIntermediateStops:
            params['ojp:includeintermediatestops'].pickOnlyOrThrow() === 'true',
        },
      },
    };
  } else {
    const ojpLocationInformationServiceRequest =
      ojpServiceRequest as LocationInformationServiceRequest;
    const ojpLocationInformationRequest =
      ojpLocationInformationServiceRequest[
        'ojp:ojplocationinformationrequest'
      ].pickOnlyOrThrow();
    return {
      requesterRef: ojpServiceRequest.requestorref.pickOnlyOrThrow(),
      requestTimestamp: ojpServiceRequest.requesttimestamp.pickOnlyOrThrow(),
      requestType: 'LocationInformationRequest',
      body: {
        initialInput: ojpLocationInformationRequest['ojp:initialinput']
          .pickOnlyOrThrow()
          ['ojp:locationname'].pickOnlyOrThrow(),
        restrictions: [
          {
            numberOfResults: +ojpLocationInformationRequest['ojp:restrictions']
              .pickOnlyOrThrow()
              ['ojp:numberofresults'].pickOnlyOrThrow(),
          },
        ],
      },
    };
  }
}
