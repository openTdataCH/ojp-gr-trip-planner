export type ServiceRequest = {
  error: boolean;
  requesterRef: string;
  requestTimestamp: string;
} & (
  | {
      requestType: 'TripRequest';
      body: TripRequest;
    }
  | {
      requestType: 'LocationInformationRequest';
      body: LocationInformationRequest;
    }
);

type TripRequest = {
  origin: {
    placeRef: PlaceRef;
    departTime: string;
  };
  destination: {
    placeRef: PlaceRef;
  };
  params: Params;
};

type LocationInformationRequest = {
  initialInput: string;
  restrictions: [Restriction];
};

type Restriction = NumberOfResults;

type NumberOfResults = {
  numberOfResults: number;
};

type Params = {
  numberOfResults: number;
  includeTrackSections: boolean;
  includeLegProjection: boolean;
  includeTurnDescription: boolean;
  includeIntermediateStops: boolean;
};

type PlaceRef = {
  stopPointRef: string;
  locationName: string;
};
