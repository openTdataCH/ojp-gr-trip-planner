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
import { createXMLTripResponse } from '../helpers/createXMLTripResponse';
import { TripServiceRequest } from '../types/serviceRequests';
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
  let serviceRequest;
  try {
    serviceRequest = xmlToServiceRequest(xmlRequest);
  } catch (e) {
    return res.status(400).send();
  }

  if (serviceRequest.error) {
    return res.status(400).send();
  }

  try {
    if (serviceRequest.requestType === 'LocationInformationRequest') {
      return res
        .status(200)
        .send(
          await handleLocationInformationRequest(
            serviceRequest.body.initialInput,
          ),
        );
    } else if (serviceRequest.requestType === 'TripRequest') {
      return res.status(200).send(await handleTripRequest(serviceRequest));
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

async function handleTripRequest(tripServiceRequest: TripServiceRequest) {
  const [system1, system2] = selectPassiveSystems(tripServiceRequest);
  const tripResponse: OJP.TripsResponse = system2
    ? await generateInterSystemTripResponse(
        tripServiceRequest,
        system1,
        system2,
      )
    : await generateSingleSystemTripResponse(tripServiceRequest, system1);
  return createXMLTripResponse(tripResponse);
}

async function handleLocationInformationRequest(initialInput: string) {
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
  return createLocationInfoResponse(responseFromPassiveSystems.flat());
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

async function generateInterSystemTripResponse(
  tripServiceRequest: TripServiceRequest,
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

async function generateSingleSystemTripResponse(
  tripServiceRequest: TripServiceRequest,
  system1: PASSIVE_SYSTEM,
) {
  const tripRequest: OJP.TripRequest = generateTripRequestForPassiveSystem(
    tripServiceRequest,
    system1,
  );
  return await getTripResponse(tripRequest);
}

function selectPassiveSystems(
  tripServiceRequest: TripServiceRequest,
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
