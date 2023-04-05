/** source/controllers/postOJPXML.ts */
import { Request, Response } from 'express';
import * as xml2js from 'xml2js';
import jsdom from 'jsdom';
import * as OJP from 'ojp-sdk';
import {
  createLocationInfoResponse,
  NameToSystemMapper,
  xmlToServiceRequest,
} from '../helpers';
import { XMLRequest } from '../types/xmlRequest';
import CONFIG from '../config';
import { locationInformationRequest } from '../passiveSystems/locationInformationRequest';
import { PASSIVE_SYSTEM } from '../config/passiveSystems';
import { createTripResponse } from '../helpers/createTripResponse';
import { ServiceRequest } from '../types/serviceRequests';
import { InterRegionTripAtStart } from '../helpers/tripRequest/InterRegionTripAtStart';
import { generateTripRequestForPassiveSystem } from '../helpers/tripRequest/regionInternalTrip';

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
      const [system1, system2] = selectPassiveSystems(serviceRequest);
      if (system2) {
        const tripResponse: OJP.TripsResponse =
          await generateInterSystemTripResponse(
            serviceRequest,
            system1,
            system2,
          );
        return res.status(200).send(createTripResponse(tripResponse));
      } else {
        const tripRequest = generateTripRequestForPassiveSystem(
          serviceRequest,
          system1,
        );
        return res.status(200).send(await getCastedTripResponse(tripRequest));
      }
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

async function getTripResponse(
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

async function getCastedTripResponse(
  tripRequest: OJP.TripRequest,
): Promise<string> {
  return createTripResponse(await getTripResponse(tripRequest));
}

async function generateInterSystemTripResponse(
  tripServiceRequest: ServiceRequest & { requestType: 'TripRequest' },
  system1: PASSIVE_SYSTEM,
  system2: PASSIVE_SYSTEM,
) {
  const tripAtStart = new InterRegionTripAtStart(
    tripServiceRequest,
    system1,
    system2,
  );
  const tripAtEPs = await tripAtStart.selectExchangePointsAndTripsToThem();
  const tripAtDestination = await tripAtEPs.findBestTrip();
  return tripAtDestination.getTripResponse();
}

function selectPassiveSystems(
  tripServiceRequest: ServiceRequest & { requestType: 'TripRequest' },
): PASSIVE_SYSTEM[] {
  const system1 = NameToSystemMapper.getSystems(
    tripServiceRequest.body.origin.placeRef.stopPointRef,
  );
  const system2 = NameToSystemMapper.getSystems(
    tripServiceRequest.body.destination.placeRef.stopPointRef,
  );
  if (system1 && system2 && system1 === system2) return [system1];
  if (system1 && system2) return [system1, system2];
  throw new Error('One system is not defined');
}
