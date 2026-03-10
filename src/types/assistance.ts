export interface Coordinates {
  lat: number;
  lng: number;
}

export interface AuthorizedAssistance {
  id: string;
  score: number;
  name: string;
  type: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email: string;
  cnpj: string;
  crm: string;
  location: Coordinates;
}

export interface GeocodingResult {
  displayName: string;
  coordinates: Coordinates;
  city: string | null;
}

export interface NearestAssistanceResult {
  assistance: AuthorizedAssistance;
  distanceKm: number;
}
