import * as xmlbuilder from 'xmlbuilder2';
import * as OJP from 'ojp-sdk';

export function createLocationInfoResponse(locations: OJP.Location[]) {
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
          'ojp:OJPLocationInformationDelivery': {
            'siri:ResponseTimestamp': new Date().toISOString(),
            'siri:Status': 'true',
            'ojp:Location': createXMLForLocations(locations),
          },
        },
      },
    },
  };

  const xmlTemplate = xmlbuilder.create(xmlContent);

  return xmlTemplate.toString({ prettyPrint: true });
}

function createXMLForLocations(locations: OJP.Location[]): object[] {
  return locations
    .sort((a, b) => {
      return (b.probability ?? 0) - (a.probability ?? 0);
    })
    .map(location => {
      return {
        'ojp:Location': {
          ...insertTopographicPlace(location),
          ...insertStopPlace(location),
          ...insertLocationName(location),
          ...insertGeoPosition(location),
          ...insertAddress(location),
        },
        'ojp:Complete': 'true',
        'ojp:Probability': location.probability,
        'ojp:OriginSystem': location.originSystem,
      };
    });
}

function insertStopPlace(location: OJP.Location) {
  return location.stopPlace
    ? {
        'ojp:StopPlace': {
          'ojp:StopPlaceRef': location.stopPlace.stopPlaceRef,
          'ojp:TopographicPlaceRef': location.stopPlace.topographicPlaceRef,
          'ojp:StopPlaceName': {
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

function insertAddress(location: OJP.Location) {
  return location.address
    ? {
        'ojp:Adress': {
          'ojp:AddressCode': location.address.addressCode,
          'ojp:TopographicPlaceRef': location.address.topographicPlaceRef,
          'ojp:AddressName': {
            'ojp:Text': {
              '@xml:lang': 'de',
              '#text': location.address.addressName,
            },
          },
        },
      }
    : {};
}
