import * as OJP from 'ojp-sdk';
import { ExchangePoint } from '../../types/ExchangePoint';
import { ServiceRequest } from '../../types/serviceRequests';
import { PASSIVE_SYSTEM } from '../../config/passiveSystems';
import { InterRegionTrip } from './interRegionTrip';

export class InterRegionTripAtDestination extends InterRegionTrip {
  private tripsToExchangePoints: {
    tripResponse: OJP.TripsResponse;
    exchangePoint: ExchangePoint;
  }[];
  private tripsFromExchangePoints: {
    trip: OJP.Trip;
    exchangePoint: ExchangePoint;
    tripsResponsesIndex: number;
    tripsResponseIndex: number;
    tripResponse: OJP.TripsResponse;
  }[];

  public constructor(
    tripServiceRequest: ServiceRequest & { requestType: 'TripRequest' },
    system1: PASSIVE_SYSTEM,
    system2: PASSIVE_SYSTEM,
    tripsToExchangePoints: {
      tripResponse: OJP.TripsResponse;
      exchangePoint: ExchangePoint;
    }[],
    tripsFromExchangePoints: {
      trip: OJP.Trip;
      exchangePoint: ExchangePoint;
      tripsResponsesIndex: number;
      tripsResponseIndex: number;
      tripResponse: OJP.TripsResponse;
    }[],
  ) {
    super(tripServiceRequest, system1, system2);
    this.tripsToExchangePoints = tripsToExchangePoints;
    this.tripsFromExchangePoints = tripsFromExchangePoints;
  }

  public getTripResponse(): OJP.TripsResponse {
    return this.prepareTripResponses().reduce(
      (aggregatedResponse, tripResponse) => {
        return {
          ...aggregatedResponse,
          contextLocations: aggregatedResponse.contextLocations.concat(
            tripResponse.contextLocations,
          ),
          trips: aggregatedResponse.trips.concat(tripResponse.trips),
        };
      },
    );
  }

  private prepareTripResponses() {
    return this.tripsFromExchangePoints
      .sort((tripWrapper1, tripWrapper2) => {
        return (
          (tripWrapper1.tripResponse.trips[0].computeArrivalTime()?.getTime() ??
            0) -
          (tripWrapper2.tripResponse.trips[0].computeArrivalTime()?.getTime() ??
            0)
        );
      })
      .map(tripWrapper => {
        const tripStats = {
          duration: tripWrapper.trip.stats.duration.plus(
            tripWrapper.tripResponse.trips[0].stats.duration,
          ),
          distanceMeters:
            tripWrapper.trip.stats.distanceMeters +
            tripWrapper.tripResponse.trips[0].stats.distanceMeters,
          transferNo:
            tripWrapper.trip.stats.transferNo +
            tripWrapper.tripResponse.trips[0].stats.transferNo +
            1,
          startDatetime: tripWrapper.trip.stats.startDatetime,
          endDatetime: tripWrapper.tripResponse.trips[0].stats.endDatetime,
        };
        const intermediateLeg = new OJP.TripContinousLeg(
          'TransferLeg',
          -1,
          20,
          tripWrapper.trip.legs[tripWrapper.trip.legs.length - 1].toLocation,
          tripWrapper.tripResponse.trips[0].legs[0].fromLocation,
        );
        const trip = new OJP.Trip(
          tripWrapper.trip.id + '::' + tripWrapper.tripResponse.trips[0].id,
          [
            ...tripWrapper.trip.legs,
            intermediateLeg,
            ...tripWrapper.tripResponse.trips[0].legs,
          ],
          tripStats,
        );
        return {
          contextLocations: [
            ...this.tripsToExchangePoints[tripWrapper.tripsResponsesIndex]
              .tripResponse.contextLocations,
            ...tripWrapper.tripResponse.contextLocations,
          ],
          hasValidResponse: true,
          trips: [trip],
          responseXMLText: '',
        } as OJP.TripsResponse;
      });
  }
}
