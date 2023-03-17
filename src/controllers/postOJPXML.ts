/** source/controllers/postOJPXML.ts */
import { Request, Response } from 'express';
import * as xml2js from 'xml2js';
import jsdom from 'jsdom';
import { Location } from 'ojp-sdk';
import {
  createLocationInfoResponse,
  NameToSystemMapper,
  xmlToServiceRequest,
} from '../helpers';
import { XMLRequest } from '../types/xmlRequest';
import CONFIG from '../config';
import { locationInformationRequest } from '../passiveSystems/locationInformationRequest';
import { PASSIVE_SYSTEM } from '../config/passiveSystems';

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
      throw e;
    }
  }

  const builder = new xml2js.Builder();
  const xml = builder.buildObject(obj);

  res.set('Content-Type', 'application/xml');
  return res.status(200).send(xml);
};

function makeDistinctLocations(locations: Location[]) {
  return [
    ...new Map(
      locations.map(location => [location.computeLocationName(), location]),
    ).values(),
  ];
}

async function createLocationInformationResponseFromPassiveSystems(
  initialInput: string,
) {
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
  );
  return createLocationInfoResponse(
    makeDistinctLocations(responseFromPassiveSystems.flat()),
  );
}
