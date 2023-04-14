import * as OJP from 'ojp-sdk';
import { Place } from '../ojp-sdk-extension/Place';
import { ExchangePoint } from './ExchangePoint';

export type tripReqPlace = Place & {
  stopPointRef: string;
  locationName: string;
};

export function isTripReqPlace(
  place: Place | undefined,
): place is tripReqPlace {
  return !!(place && place.stopPointRef && place.locationName);
}

export type tripsToExchangePointsWrapper = {
  tripResponse: OJP.TripsResponse;
  exchangePoint: ExchangePoint;
};

export type indexedTripWrapper = {
  trip: OJP.Trip;
  exchangePoint: ExchangePoint;
  tripsResponsesIndex: number;
  tripsResponseIndex: number;
};

export type completeTripWrapper = {
  tripToEP: indexedTripWrapper;
  tripFromEP: OJP.TripsResponse;
};
