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

const { Location, TripLocationPoint, TripsRequestParams } = OJP;

const { JSDOM } = jsdom;
global.DOMParser = new JSDOM().window.DOMParser;

export const postOJPXML = async (req: Request, res: Response) => {
  const obj = {
    user: {
      name: 'Max Mustermann',
      email: 'max.mustermann@example.com',
      age: 30,
    },
  };
  const xmlRequest: XMLRequest = req.body;
  const serviceRequest = xmlToServiceRequest(xmlRequest);

  if (serviceRequest.error) {
    return res.status(400).send();
  }

  if (serviceRequest.requestType === 'LocationInformationRequest') {
    try {
      const resultXML =
        await createLocationInformationResponseFromPassiveSystems(
          serviceRequest.body.initialInput,
        );
      return res.status(200).send(resultXML);
    } catch (e) {
      console.error(e);
      throw e;
    }
  } else if (serviceRequest.requestType === 'TripRequest') {
    const originRef = serviceRequest.body.origin;
    const departTimeString = originRef.departTime;
    const destinationRef = serviceRequest.body.destination.placeRef;
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
    const tripRequest = new OJP.TripRequest(
      passiveSystemsConfig.SBB,
      tripRequestParams!,
    );
    return res.status(200).send(await getTripRespons(tripRequest));
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
          return NameToSystemMapper.add(
            location,
            passiveSystem.key as PASSIVE_SYSTEM,
          );
        });
      }),
    );
    return createLocationInfoResponse(
      makeDistinctLocations(responseFromPassiveSystems.flat()),
    );
  } catch (e) {
    console.error(e);
  }
  return 'error';
}

async function getTripRespons(tripRequest: OJP.TripRequest): Promise<string> {
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
