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
import { PASSIVE_SYSTEM, passiveSystemsConfig } from '../config/passiveSystems';
import { createTripResponse } from '../helpers/createTripResponse';
import { ServiceRequest } from '../types/serviceRequests';
import { ExchangePoints } from '../utils/exchangePoints';
import { ExchangePoint } from '../types/ExchangePoint';

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
): Promise<TripsResponse> {
  return new Promise<TripsResponse>((resolve, reject) => {
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
  const tripsToExchangePoints: {
    tripResponse: TripsResponse;
    exchangePoint: ExchangePoint;
  }[] = (
    await Promise.all(
      ExchangePoints.getExchangePoints().map(async exchangePoint => {
        try {
          const place = exchangePoint.getPlaceForSystem(system1);
          if (place && place.stopPointRef && place.locationName) {
            const tripRequest = generateTripRequestForPassiveSystem(
              tripServiceRequest,
              system1,
              Location.initWithStopPlaceRef(
                place.stopPointRef,
                place.locationName,
              ),
            );
            return {
              tripResponse: await getTripResponse(tripRequest),
              exchangePoint,
            };
          }
          return null;
        } catch (e) {
          console.log(e);
          return null;
        }
      }),
    )
  ).flatMap(f => (f ? [f] : []));
  const bestTrips = findBestTrips(tripsToExchangePoints);
  const tripsFromExchangePoints = (
    await Promise.all(
      bestTrips.map(async tripWrapper => {
        try {
          const place = tripWrapper.exchangePoint.getPlaceForSystem(system2);
          const arrivalTimeTripBefore = tripWrapper.trip.computeArrivalTime();
          if (
            place &&
            place.stopPointRef &&
            place.locationName &&
            arrivalTimeTripBefore
          ) {
            const tripRequest = generateTripRequestForPassiveSystem(
              tripServiceRequest,
              system2,
              undefined,
              Location.initWithStopPlaceRef(
                place.stopPointRef,
                place.locationName,
              ),
              // 3 minutes min to change train
              new Date(arrivalTimeTripBefore.getTime() + 3 * 60000),
            );
            return {
              tripResponse: await getTripResponse(tripRequest),
              ...tripWrapper,
            };
          }
          return null;
        } catch (e) {
          console.log(e);
          return null;
        }
      }),
    )
  ).flatMap(f => (f ? [f] : []));
  tripsFromExchangePoints.slice(0, 2).forEach(tripWrapper => {
    console.log('Origin to EP');
    console.log(tripWrapper.trip);
    console.log('Arrival Time: ' + tripWrapper.trip.computeArrivalTime());
    console.log('EP');
    console.log(tripWrapper.exchangePoint);
    console.log('Possible second leg');
    console.log(tripWrapper.tripResponse.trips[0]);
  });
  const firstTripWarapper = tripsFromExchangePoints[0];
  const tripStats: TripStats = {
    duration: firstTripWarapper.trip.stats.duration,
    distanceMeters:
      firstTripWarapper.trip.stats.distanceMeters +
      firstTripWarapper.tripResponse.trips[1].stats.distanceMeters,
    transferNo:
      firstTripWarapper.trip.stats.transferNo +
      firstTripWarapper.tripResponse.trips[1].stats.transferNo +
      1,
    startDatetime: firstTripWarapper.trip.stats.startDatetime,
    endDatetime: firstTripWarapper.tripResponse.trips[1].stats.endDatetime,
  };
  const trip = new Trip(
    '0',
    [
      ...firstTripWarapper.trip.legs,
      ...firstTripWarapper.tripResponse.trips[1].legs,
    ],
    tripStats,
  );
  return {
    contextLocations: [
      ...tripsToExchangePoints[firstTripWarapper.tripsResponsesIndex]
        .tripResponse.contextLocations,
      ...firstTripWarapper.tripResponse.contextLocations,
    ],
    hasValidResponse: true,
    trips: [trip],
    responseXMLText: '',
  } as TripsResponse;
}

function generateTripRequestForPassiveSystem(
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
    Location.initWithStopPlaceRef(
      destinationRef.stopPointRef,
      destinationRef.locationName,
    );
  const departTime = departTimeInput ?? new Date(departTimeString);
  const origin =
    originInput ??
    Location.initWithStopPlaceRef(
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

function findBestTrips(
  tripsResponses: {
    tripResponse: TripsResponse;
    exchangePoint: ExchangePoint;
  }[],
  limit = 5,
) {
  return tripsResponses
    .flatMap((tripsResponse, tripsResponsesIndex) =>
      tripsResponse.tripResponse.trips.map((trip, tripsResponseIndex) => {
        return {
          trip,
          exchangePoint: tripsResponse.exchangePoint,
          tripsResponsesIndex,
          tripsResponseIndex,
        };
      }),
    )
    .sort(
      (trip1, trip2) =>
        (trip1.trip.computeArrivalTime()?.getTime() ?? 0) -
        (trip2.trip.computeArrivalTime()?.getTime() ?? 0),
    )
    .slice(0, limit);
}
