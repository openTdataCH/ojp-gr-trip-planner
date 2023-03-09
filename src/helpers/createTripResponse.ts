import * as xmlbuilder from 'xmlbuilder2';
import OJP, { TripContinousLeg, TripTimedLeg } from 'ojp-sdk';
import { Duration } from 'ojp-sdk/lib/shared/duration';
import { StopPoint } from 'ojp-sdk/lib/trip/leg/timed-leg/stop-point';
import { JourneyService } from 'ojp-sdk/lib/journey/journey-service';

export function createTripResponse(tripsResponse: OJP.TripsResponse) {
  const xmlContent = {
    'siri:OJP': {
      '@xmlns:siri': 'http://www.siri.org.uk/siri',
      '@xmlns:ojp': 'http://www.vdv.de/ojp',
      '@version': '1.0',
      'siri:OJPResponse': {
        'siri:ServiceDelivery': {
          'siri:ResponseTimestamp': new Date().toISOString(),
          'siri:ProducerRef': 'EFAController10.5.20.21-OJP-EFA01-P',
          'siri:Status': 'true',
          'ojp:OJPTripDelivery': {
            'siri:ResponseTimestamp': new Date().toISOString(),
            'siri:Status': 'true',
            'ojp:TripResponseContext': createTripResponseContext(
              tripsResponse.contextLocations,
            ),
            'ojp:TripResult': createTripResult(tripsResponse.trips),
          },
        },
      },
    },
  };
  const xmlTemplate = xmlbuilder.create(xmlContent);

  return xmlTemplate.toString({ prettyPrint: true });
}

function createTripResponseContext(locations: OJP.Location[]) {
  return {
    'ojp:Places': {
      'ojp:Location': locations.map(location => {
        return {
          ...insertStopPlace(location),
          ...insertTopographicPlace(location),
          ...insertLocationName(location),
          ...insertGeoPosition(location),
        };
      }),
    },
  };
}

function insertStopPlace(location: OJP.Location) {
  const placeOrPointString =
    location.stopPlace?.stopType === 'StopPlace' ? 'Place' : 'Point';
  return location.stopPlace
    ? {
        ['ojp:Stop' + placeOrPointString]: {
          [(placeOrPointString === 'Point' ? 'siri' : 'ojp') +
          ':Stop' +
          placeOrPointString +
          'Ref']: location.stopPlace.stopPlaceRef,
          'ojp:TopographicPlaceRef': location.stopPlace.topographicPlaceRef,
          ['ojp:Stop' + placeOrPointString + 'Name']: {
            'ojp:Text': {
              '@xml:lang': 'de',
              '#text': location.stopPlace.stopPlaceName,
            },
          },
        },
      }
    : {};
}

function insertGeoPosition(location: OJP.Location) {
  return location.geoPosition
    ? {
        'ojp:GeoPosition': {
          'siri:Longitude': location.geoPosition?.longitude,
          'siri:Latitude': location.geoPosition?.latitude,
        },
      }
    : {};
}

function insertLocationName(location: OJP.Location) {
  return location.locationName
    ? {
        'ojp:LocationName': {
          'ojp:Text': {
            '@xml:lang': 'de',
            '#text': location.locationName,
          },
        },
      }
    : {};
}

function insertTopographicPlace(location: OJP.Location) {
  return location.topographicPlace
    ? {
        'ojp:TopographicPlace': {
          'ojp:TopographicPlaceCode': location.topographicPlace.code,
          'ojp:TopographicPlaceName': {
            'ojp:Text': {
              '@xml:lang': 'de',
              '#text': location.topographicPlace.name,
            },
          },
        },
      }
    : {};
}

function createTripResult(trips: OJP.Trip[]) {
  return trips.map(trip => {
    return {
      'ojp:ResultId': trip.id,
      'ojp:Trip': {
        'ojp:TripId': trip.id,
        'ojp:Duration': durationFormatter(trip.stats.duration),
        'ojp:StartTime': trip.stats.startDatetime.toISOString(),
        'ojp:EndTime': trip.stats.endDatetime.toISOString(),
        'ojp:Transfers': trip.stats.transferNo,
        'ojp:Distance': trip.stats.distanceMeters,
        'ojp:TripLeg': createTripLeg(trip.legs),
      },
    };
  });
}

function createTripLeg(legs: OJP.TripLeg[]) {
  return legs.map(leg => {
    return {
      'ojp:LegId': leg.legID,
      ...createSpecificLeg(leg),
    };
  });
}

function createSpecificLeg(leg: OJP.TripLeg) {
  switch (leg.legType) {
    case 'ContinousLeg':
      return createContinousLeg(leg as TripContinousLeg);
    case 'TimedLeg':
      return createTimedLeg(leg as TripTimedLeg);
    case 'TransferLeg':
      return createTransferLeg(leg as TripContinousLeg);
  }
}

function createContinousLeg(leg: TripContinousLeg) {
  console.log(leg);
  return {};
}

function createTransferLeg(leg: TripContinousLeg) {
  return {
    'ojp:TransferLeg': {
      'ojp:TransferMode': leg.legTransportMode,
      'ojp:Duration': durationFormatter(leg.legDuration),
      'ojp:LegStart': {
        ...insertLegStopPoint(leg.fromLocation),
      },
      'ojp:LegEnd': {
        ...insertLegStopPoint(leg.toLocation),
      },
      'ojp:WalkDuration': durationFormatter(leg.walkDuration),
    },
  };
}

function createTimedLeg(leg: OJP.TripTimedLeg) {
  return {
    'ojp:TimedLeg': {
      'ojp:LegBoard': {
        ...insertRealStopPoint(leg.fromStopPoint),
      },
      'ojp:LegIntermediates': leg.intermediateStopPoints.map(stopPoint => {
        return insertRealStopPoint(stopPoint);
      }),
      'ojp:LegAlight': {
        ...insertRealStopPoint(leg.toStopPoint),
      },
      'ojp:Service': {
        ...insertService(leg.service),
      },
      'ojp:LegTrack': leg.legTrack?.trackSections.map(trackSection => {
        return {
          'ojp:TrackSection': {
            'ojp:TrackStart': {
              ...insertLegStopPoint(
                trackSection.fromLocation,
                'ojp:LocationName',
              ),
            },
            'ojp:TrackEnd': {
              ...insertLegStopPoint(
                trackSection.toLocation,
                'ojp:LocationName',
              ),
            },
            'ojp:Duration': durationFormatter(trackSection.duration),
            'ojp:Length': trackSection.length,
            'ojp:LinkProjection': {
              'ojp:Position': trackSection.linkProjection?.coordinates.map(
                geoPosition => {
                  return {
                    'siri:Longitude': geoPosition.longitude,
                    'siri:Latitude': geoPosition.latitude,
                  };
                },
              ),
            },
          },
        };
      }),
    },
  };
}

function insertLegStopPoint(
  location: OJP.Location,
  stopPointName = 'ojp:StopPointName',
) {
  return {
    'siri:StopPointRef': location.stopPointRef,
    [stopPointName]: {
      'ojp:Text': {
        '@xml:lang': 'de',
        '#text': location.locationName,
      },
    },
  };
}

function durationFormatter(duration: Duration | null) {
  if (duration === null) return null;
  const hours = duration.hours > 0 ? duration.hours + 'H' : '';
  return `PT${hours}${duration.minutes}M`;
}

function insertRealStopPoint(stopPlace: StopPoint) {
  const departure =
    stopPlace.stopPointType === 'To'
      ? {}
      : {
          'ojp:ServiceDeparture': {
            'ojp:TimetabledTime':
              stopPlace.departureData?.timetableTime.toISOString(),
            'ojp:EstimatedTime':
              stopPlace.departureData?.estimatedTime?.toISOString(),
          },
        };
  const arrival =
    stopPlace.stopPointType === 'From'
      ? {}
      : {
          'ojp:ServiceArrival': {
            'ojp:TimetabledTime':
              stopPlace.arrivalData?.timetableTime.toISOString(),
            'ojp:EstimatedTime':
              stopPlace.arrivalData?.estimatedTime?.toISOString(),
          },
        };
  return {
    ...insertLegStopPoint(stopPlace.location),
    'ojp:PlannedQuay': {
      'ojp:Text': {
        '@xml:lang': 'de',
        '#text': stopPlace.plannedPlatform,
      },
    },
    'ojp:Order': stopPlace.sequenceOrder,
    ...departure,
    ...arrival,
  };
}

function insertService(service: JourneyService) {
  return {
    'ojp:OperatingDayRef': service.serviceLineNumber,
    'ojp:OperatorRef': 'ojp:' + service.agencyID,
    'ojp:JourneyRef': service.journeyRef,
    'ojp:Mode': {
      'ojp:PtMode': service.ptMode.ptMode,
      'ojp:Name': {
        'ojp:Text': {
          '@xml:lang': 'de',
          '#text': service.ptMode.name,
        },
      },
      'ojp:ShortName': {
        'ojp:Text': {
          '@xml:lang': 'de',
          '#text': service.ptMode.shortName,
        },
      },
    },
    'ojp:DestinationStopPointRef': service.destinationStopPlace?.stopPlaceRef,
    'ojp:DestinationText': {
      'ojp:Text': {
        '@xml:lang': 'de',
        '#text': service.destinationStopPlace?.stopPlaceName,
      },
    },
  };
}
