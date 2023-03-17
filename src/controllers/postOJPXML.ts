/** source/controllers/postOJPXML.ts */
import { Request, Response } from 'express';
import * as xml2js from 'xml2js';
import jsdom from 'jsdom';
import OJP from 'ojp-sdk';
import {
  createLocationInfoResponse,
  NameToSystemMapper,
  xmlToServiceRequest,
} from '../helpers';
import { XMLRequest } from '../types/xmlRequest';
import CONFIG from '../config';
import { locationInformationRequest } from '../passiveSystems/locationInformationRequest';
import { PASSIVE_SYSTEM, passiveSystemsConfig } from '../config/passiveSystems';
import { createTripResponse } from '../helpers/createTripResponse';
import { ServiceRequest } from '../types/serviceRequests';

const { Location, TripLocationPoint, TripsRequestParams } = OJP;

const { JSDOM } = jsdom;
global.DOMParser = new JSDOM().window.DOMParser;

export const postOJPXML = async (req: Request, res: Response) => {
  const obj = {
    Error: {
      message: 'Internal Server Error',
      code: 500,
    },
  };

  const xmlRequest: XMLRequest = req.body;
  const serviceRequest = xmlToServiceRequest(xmlRequest);

  if (serviceRequest.error) {
    return res.status(400).send();
  }

  try {
    if (serviceRequest.requestType === 'LocationInformationRequest') {
      const resultXML =
        await createLocationInformationResponseFromPassiveSystems(
          serviceRequest.body.initialInput,
        );
      return res.status(200).send(resultXML);
    } else if (serviceRequest.requestType === 'TripRequest') {
      const tripRequest = generateTripRequestForPassiveSystem(
        serviceRequest,
        'SBB',
      );
      return res.status(200).send(await getTripResponse(tripRequest));
    }
  } catch (e) {
    console.error(e);
    throw e;
  }

  const builder = new xml2js.Builder();
  const xml = builder.buildObject(obj);

  res.set('Content-Type', 'application/xml');
  return res.status(200).send(xml);
};

function makeDistinctLocations(locations: OJP.Location[]) {
  return [
    ...new Map(
      locations.map(location => [location.computeLocationName(), location]),
    ).values(),
  ];
}

async function createLocationInformationResponseFromPassiveSystems(
  initialInput: string,
) {
  try {
    const responseFromPassiveSystems = await Promise.all(
    Object.values(CONFIG.PASSIVE_SYSTEMS).map(async passiveSystem => {
      return (
        await locationInformationRequest(passiveSystem, initialInput)
      ).map(location => {
        location.originSystem = passiveSystem.key;
        if (passiveSystem.key === 'STA' && location.probability) {
          location.probability += CONFIG.STA_SEARCH_TWEAK;
        }
        NameToSystemMapper.add(location, passiveSystem.key as PASSIVE_SYSTEM);
        return location;
      });
    }),
    return createLocationInfoResponse(
      makeDistinctLocations(responseFromPassiveSystems.flat()),
    );
  } catch (e) {
    console.error(e);
  }
  return 'error';
}

async function getTripResponse(tripRequest: OJP.TripRequest): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    tripRequest.fetchResponse((responseText, errorData) => {
      if (errorData) {
        console.error(errorData);
      }
      try {
        resolve(createTripResponse(responseText));
      } catch (e) {
        console.error(e);
        reject(e);
      }
    });
  });
}

function generateTripRequestForPassiveSystem(
  tripServiceRequest: ServiceRequest & { requestType: 'TripRequest' },
  system: PASSIVE_SYSTEM,
) {
  const originRef = tripServiceRequest.body.origin;
  const departTimeString = originRef.departTime;
  const destinationRef = tripServiceRequest.body.destination.placeRef;
  const destination = Location.initWithStopPlaceRef(
    String(destinationRef.stopPointRef),
    destinationRef.locationName,
  );
  const departTime = new Date(departTimeString);
  const origin = Location.initWithStopPlaceRef(
    String(originRef.placeRef.stopPointRef),
    originRef.placeRef.locationName,
  );
  const tripRequestParams = TripsRequestParams.initWithLocationsAndDate(
    new TripLocationPoint(origin),
    new TripLocationPoint(destination),
    departTime,
  );
  return new OJP.TripRequest(passiveSystemsConfig[system], tripRequestParams!);
}
