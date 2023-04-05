import * as OJP from 'ojp-sdk';
import { ServiceRequest } from '../../types/serviceRequests';
import {
  PASSIVE_SYSTEM,
  passiveSystemsConfig,
} from '../../config/passiveSystems';

export function generateTripRequestForPassiveSystem(
  tripServiceRequest: ServiceRequest & { requestType: 'TripRequest' },
  system: PASSIVE_SYSTEM,
  destinationInput?: OJP.Location | undefined,
  originInput?: OJP.Location | undefined,
  departTimeInput?: Date | undefined,
) {
  const originRef = tripServiceRequest.body.origin;
  const departTimeString = originRef.departTime;
  const destinationRef = tripServiceRequest.body.destination.placeRef;
  const destination =
    destinationInput ??
    OJP.Location.initWithStopPlaceRef(
      destinationRef.stopPointRef,
      destinationRef.locationName,
    );
  const departTime = departTimeInput ?? new Date(departTimeString);
  const origin =
    originInput ??
    OJP.Location.initWithStopPlaceRef(
      originRef.placeRef.stopPointRef,
      originRef.placeRef.locationName,
    );
  const tripRequestParams = OJP.TripsRequestParams.initWithLocationsAndDate(
    new OJP.TripLocationPoint(origin),
    new OJP.TripLocationPoint(destination),
    departTime,
  );
  return new OJP.TripRequest(passiveSystemsConfig[system], tripRequestParams!);
}

export async function getTripResponse(
  tripRequest: OJP.TripRequest,
): Promise<OJP.TripsResponse> {
  return new Promise<OJP.TripsResponse>((resolve, reject) => {
    tripRequest.fetchResponse((responseText, errorData) => {
      if (errorData) {
        console.error(errorData);
      }
      try {
        resolve(responseText);
      } catch (e) {
        console.error(e);
        reject(e);
      }
    });
  });
}
