import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class GeocodingService {
  private mapboxApiKey: string;

  constructor(@Inject('MAPBOX_API_KEY') apiKey: string) {
    this.mapboxApiKey = apiKey;
  }

  async reverseGeocode({
    lat,
    lng,
  }: {
    lat: number;
    lng: number;
  }): Promise<Feature | undefined> {
    if (!lat || !lng) return;

    const endpoint = `https://api.mapbox.com/search/geocode/v6/reverse?longitude=${lng}&latitude=${lat}&types=address&access_token=${this.mapboxApiKey}`;

    const response = await fetch(endpoint);
    if (!response.ok) {
      throw new Error(`Mapbox API returned status ${response.status}`);
    }

    const results = (await response.json()) as MapboxResponse;
    const features = results?.features || [];
    if (!features.length) return;

    return features[0];
  }

  async getAddressComponents({
    lat,
    lng,
  }: {
    lat: number;
    lng: number;
  }): Promise<
    | {
        street: string | undefined;
        city: string | undefined;
        state: string | undefined;
        zip: string | undefined;
      }
    | undefined
  > {
    const feature = await this.reverseGeocode({ lat, lng });
    if (!feature) return;

    const context = feature.properties.context;

    const street = context.address?.name || context.street?.name;
    const city = context.place?.name;
    const state = context.region?.region_code || context.region?.name;
    const zip = context.postcode?.name;

    return { street, city, state, zip };
  }
}

// Types
export type MapboxResponse = {
  type: 'FeatureCollection';
  features: Feature[];
  attribution: string;
};

export type Feature = {
  type: 'Feature';
  id: string;
  geometry: Geometry;
  properties: Properties;
};

export type Geometry = {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
};

export type Properties = {
  mapbox_id: string;
  feature_type: string;
  full_address: string;
  name: string;
  name_preferred: string;
  coordinates: Coordinates;
  place_formatted: string;
  context: Context;
};

export type Coordinates = {
  longitude: number;
  latitude: number;
  accuracy: string;
  routable_points: RoutablePoint[];
};

export type RoutablePoint = {
  name: string;
  latitude: number;
  longitude: number;
};

export type Context = {
  address?: ItemContext;
  street?: ItemContext;
  neighborhood?: ItemContext;
  postcode?: ItemContext;
  locality?: ItemContext;
  place?: ItemContext;
  district?: ItemContext;
  region?: ItemContext;
  country?: ItemContext;
};

export type ItemContext = {
  region_code?: string;
  region_code_full?: string;
  mapbox_id?: string;
  name?: string;
  wikidata_id?: string;
  country_code?: string;
  country_code_alpha_3?: string;
};
