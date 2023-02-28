export type XMLRequest = {
  ojp: {
    $: {
      xmlns: string;
      'xmlns:xsi': string;
      'xmlns:xsd': string;
      'xmlns:ojp': string;
      'xsi:schemaLocation': string;
      version: string;
    };
    ojprequest: [OJPRequest];
  };
};

export type OJPRequest = {
  servicerequest: [OJP_ServiceRequest];
};

export type OJP_ServiceRequest =
  | TripServiceRequest
  | LocationInformationServiceRequest;

type OJP_ServiceRequestBase = {
  requestorref: ['OJP SDK v1.0'];
  requesttimestamp: ['2023-02-20T09:14:36.205Z'];
};

export type TripServiceRequest = OJP_ServiceRequestBase & {
  'ojp:ojptriprequest': [OJP_TripRequest];
};

export type LocationInformationServiceRequest = OJP_ServiceRequestBase & {
  'ojp:ojplocationinformationrequest': [OJP_LocationInformationRequest];
};

export type OJP_LocationInformationRequest = {
  requesttimestamp: [string];
  'ojp:initialinput': [LocationNames];
  'ojp:restrictions': [NumberOfResults];
};

export type LocationNames = {
  'ojp:locationname': [string];
};

export type NumberOfResults = {
  'ojp:numberofresults': [string];
};

export type OJP_TripRequest = {
  requesttimestamp: [string];
  'ojp:origin': [Origin];
  'ojp:destination': [Destination];
  'ojp:params': [Params];
};

export type Origin = {
  'ojp:placeref': [PlaceRef];
  'ojp:deparrtime': [string];
};

export type Destination = {
  'ojp:placeref': [PlaceRef];
};

export type Params = {
  'ojp:numberofresults': [string];
  'ojp:includetracksections': [string];
  'ojp:includelegprojection': [string];
  'ojp:includeturndescription': [string];
  'ojp:includeintermediatestops': [string];
};

export type PlaceRef = {
  stoppointref: [string];
  'ojp:locationname': [OJP_Text];
};

export type OJP_Text = {
  'ojp:text': [string];
};

export function isTripRequest(
  serviceRequest: OJP_ServiceRequest,
): serviceRequest is TripServiceRequest {
  return !!(serviceRequest as any)['ojp:ojptriprequest'];
}
