/** source/controllers/postOJPXML.ts */
import { Request, Response } from 'express';
import * as xml2js from 'xml2js';
import jsdom from 'jsdom';
import { Location } from 'ojp-sdk';
import { xmlToServiceRequest } from '../helpers/XMLToObjectMapper';
import { XMLRequest } from '../types/xmlRequest';
import { createLocationInfoResponse } from '../helpers/createLocationInfoResponse';
import CONFIG from '../config';
import { locationInformationRequest } from '../passiveSystems/locationInformationRequest';
import { NameToSystemMapper } from '../helpers/nameToSystemMapper';
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

  if (serviceRequest.requestType === 'LocationInformationRequest') {
    try {
      const responseFromPassiveSystems = await Promise.all(
        Object.values(CONFIG.PASSIVE_SYSTEMS).map(async passiveSystem => {
          return (
            await locationInformationRequest(
              passiveSystem,
              serviceRequest.body.initialInput,
            )
          ).map(location =>
            NameToSystemMapper.add(
              location,
              passiveSystem.key as PASSIVE_SYSTEM,
            ),
          );
        }),
      );
      const resultXML = createLocationInfoResponse(
        makeDistinctLocations(responseFromPassiveSystems.flat()),
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

export default {
  getTestXML: postOJPXML,
};

function makeDistinctLocations(locations: Location[]) {
  return [
    ...new Map(
      locations.map(location => [location.computeLocationName(), location]),
    ).values(),
  ];
}
