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
        selectPassiveSystem(serviceRequest),
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
  const distinctMap = new Map<string, OJP.Location>();
  locations.forEach(location => {
    const name = location.computeLocationName();
    if (name) {
      const otherLocation = distinctMap.get(name);
      if (otherLocation === undefined) {
        distinctMap.set(name, location);
      } else {
        if (location.stopPointRef && otherLocation.stopPointRef) {
          NameToSystemMapper.addDuplicate(
            otherLocation.stopPointRef,
            location.stopPointRef,
          );
        }
      }
    }
  });
  return [...distinctMap.values()];
}

async function createLocationInformationResponseFromPassiveSystems(
  initialInput: string,
) {
  const responseFromPassiveSystems = await Promise.all(
    Object.values(CONFIG.PASSIVE_SYSTEMS).map(async passiveSystem => {
      try {
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
      } catch (e) {
        console.error(e);
        return [];
      }
    }),
  );
  return createLocationInfoResponse(
    makeDistinctLocations(responseFromPassiveSystems.flat()),
  );
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
    destinationRef.stopPointRef,
    destinationRef.locationName,
  );
  const departTime = new Date(departTimeString);
  const origin = Location.initWithStopPlaceRef(
    originRef.placeRef.stopPointRef,
    originRef.placeRef.locationName,
  );
  const tripRequestParams = TripsRequestParams.initWithLocationsAndDate(
    new TripLocationPoint(origin),
    new TripLocationPoint(destination),
    departTime,
  );
  return new OJP.TripRequest(passiveSystemsConfig[system], tripRequestParams!);
}

function selectPassiveSystem(
  tripServiceRequest: ServiceRequest & { requestType: 'TripRequest' },
): PASSIVE_SYSTEM {
  const originRef = tripServiceRequest.body.origin.placeRef;
  const destinationRef = tripServiceRequest.body.destination.placeRef;
  const system1 = NameToSystemMapper.getSystems(
    tripServiceRequest.body.origin.placeRef.stopPointRef,
  );
  const system2 = NameToSystemMapper.getSystems(
    tripServiceRequest.body.destination.placeRef.stopPointRef,
  );
  if (system1 && system2 && system1 === system2) return system1;
  if (
    system2 &&
    NameToSystemMapper.getDuplicate(originRef.stopPointRef) !== undefined
  )
    return system2;
  if (
    system1 &&
    NameToSystemMapper.getDuplicate(destinationRef.stopPointRef) !== undefined
  )
    return system1;
  throw Error();
}
