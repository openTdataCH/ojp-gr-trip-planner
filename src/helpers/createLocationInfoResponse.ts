import * as xmlbuilder from 'xmlbuilder2';
import pkg from 'ojp-sdk';

export function createLocationInfoResponse(locations: pkg.Location[]) {
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

  console.log(JSON.stringify(xmlContent));
  const xmlTemplate = xmlbuilder.create(xmlContent);

  return xmlTemplate.toString({ prettyPrint: true });
}

function createXMLForLocations(locations: pkg.Location[]): object[] {
  return locations.map(location => {
    return {
      'ojp:Location': {
        ...insertTopographicPlace(location),
        ...insertStopPlace(location),
        ...insertLocationName(location),
        ...insertGeoPosition(location),
        ...insertAddress(location),
      },
      'ojp:Complete': 'true',
    };
  });
}

function insertStopPlace(location: pkg.Location) {
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

function insertGeoPosition(location: pkg.Location) {
  return location.geoPosition
    ? {
        'ojp:GeoPosition': {
          'siri:Longitude': location.geoPosition?.longitude,
          'siri:Latitude': location.geoPosition?.latitude,
        },
      }
    : {};
}

function insertLocationName(location: pkg.Location) {
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

function insertTopographicPlace(location: pkg.Location) {
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

function insertAddress(location: pkg.Location) {
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
