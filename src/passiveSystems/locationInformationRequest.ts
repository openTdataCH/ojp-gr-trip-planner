import OJP, { Location, StageConfig } from 'ojp-sdk';

const { LocationInformationRequest } = OJP;

export async function locationInformationRequest(
  passiveSystem: StageConfig,
  initialInput: string,
): Promise<Location[]> {
  const locationInformationRequest1 =
    LocationInformationRequest.initWithLocationName(
      passiveSystem,
      initialInput,
    );
  locationInformationRequest1.requestParams.geoRestrictionType = 'stop';
  return locationInformationRequest1.fetchResponse();
}
