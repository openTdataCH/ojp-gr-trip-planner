import {
  isTripRequest,
  LocationInformationServiceRequest,
  OJP_TripRequest,
  TripServiceRequest,
  XMLRequest,
} from '../types/xmlRequest';
import { ServiceRequest } from '../types/serviceRequests';
import OnlyOneElementException from './error/OnlyOneElementException';

declare global {
  interface Array<T> {
    pickOnlyOrThrow(): T;
  }
}

Array.prototype.pickOnlyOrThrow = function <T>(): T {
  if (this.length !== 1) {
    throw new OnlyOneElementException();
  }
  return this[0];
};

export function xmlToServiceRequest(xmlRequest: XMLRequest): ServiceRequest {
  const ojpServiceRequest = xmlRequest.ojp.ojprequest
    .pickOnlyOrThrow()
    .servicerequest.pickOnlyOrThrow();
  if (isTripRequest(ojpServiceRequest)) {
    return generateTripRequest(ojpServiceRequest);
  } else {
    return generateLocationInformationRequest(ojpServiceRequest);
  }
}

function generateTripRequest(
  ojpTripServiceRequest: TripServiceRequest,
): ServiceRequest {
  const ojpTripRequest: OJP_TripRequest = ojpTripServiceRequest[
    'ojp:ojptriprequest'
  ].pickOnlyOrThrow() as OJP_TripRequest;
  const origin = ojpTripRequest['ojp:origin'].pickOnlyOrThrow();
  const placeRefOrigin = origin['ojp:placeref'].pickOnlyOrThrow();
  const destination = ojpTripRequest['ojp:destination'].pickOnlyOrThrow();
  const placeRefDestination = destination['ojp:placeref'].pickOnlyOrThrow();
  const params = ojpTripRequest['ojp:params'].pickOnlyOrThrow();
  return {
    error: false,
    requesterRef: ojpTripServiceRequest.requestorref.pickOnlyOrThrow(),
    requestType: 'TripRequest',
    requestTimestamp: ojpTripServiceRequest.requesttimestamp.pickOnlyOrThrow(),
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
          locationName: placeRefDestination['ojp:locationname']
            .pickOnlyOrThrow()
            ['ojp:text'].pickOnlyOrThrow(),
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
}

function generateLocationInformationRequest(
  ojpLocationInformationServiceRequest: LocationInformationServiceRequest,
): ServiceRequest {
  const NO_LOCATION_NAME = 'NO_LOCATION_NAME';
  const ojpLocationInformationRequest =
    ojpLocationInformationServiceRequest[
      'ojp:ojplocationinformationrequest'
    ].pickOnlyOrThrow();
  let initialInput;
  try {
    initialInput =
      ojpLocationInformationRequest['ojp:initialinput']
        ?.pickOnlyOrThrow()
        ['ojp:locationname']?.pickOnlyOrThrow() ?? NO_LOCATION_NAME;
  } catch (e) {
    if (!(e instanceof OnlyOneElementException)) {
      throw e;
    }
    initialInput = NO_LOCATION_NAME;
  }
  return {
    error: initialInput === NO_LOCATION_NAME,
    requesterRef:
      ojpLocationInformationServiceRequest.requestorref.pickOnlyOrThrow(),
    requestTimestamp:
      ojpLocationInformationServiceRequest.requesttimestamp.pickOnlyOrThrow(),
    requestType: 'LocationInformationRequest',
    body: {
      initialInput,
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
