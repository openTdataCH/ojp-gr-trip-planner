import * as OJP from 'ojp-sdk';

export async function locationInformationRequest(
  passiveSystem: OJP.StageConfig,
  initialInput: string,
): Promise<OJP.Location[]> {
  const locationInformationRequest1 =
    OJP.LocationInformationRequest.initWithLocationName(
      passiveSystem,
      initialInput,
    );
  locationInformationRequest1.requestParams.geoRestrictionType = 'stop';
  return locationInformationRequest1.fetchResponse();
}
