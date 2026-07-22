import { ES_CITIES, ES_STATE_CENTER } from "./es-cities";
import { canonicalizeCityName } from "./city-standardization";

const EARTH_RADIUS_KM = 6371;

export function haversineDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export const BRAZIL_MAP_CENTER = { lat: -14.235, lng: -51.9253 };

export const VITORIA_METRO_CENTER = { lat: -20.3155, lng: -40.3128 };

export { ES_STATE_CENTER };

export type MapBounds = {
  north: number;
  south: number;
  east: number;
  west: number;
};

export const CITY_CENTERS: Record<string, { lat: number; lng: number }> = {
  ...Object.fromEntries(ES_CITIES.map((city) => [city.name, { lat: city.lat, lng: city.lng }])),
  Cariacica: { lat: -20.2639, lng: -40.4165 },
  "São Paulo": { lat: -23.5505, lng: -46.6333 },
  "Rio de Janeiro": { lat: -22.9068, lng: -43.1729 },
  "Belo Horizonte": { lat: -19.9167, lng: -43.9345 },
  "Porto Alegre": { lat: -30.0346, lng: -51.2177 },
  Salvador: { lat: -12.9777, lng: -38.5016 },
  Curitiba: { lat: -25.4284, lng: -49.2733 },
  Brasília: { lat: -15.7942, lng: -47.8822 },
  Recife: { lat: -8.0476, lng: -34.877 },
  Fortaleza: { lat: -3.7319, lng: -38.5267 },
  Florianópolis: { lat: -27.5954, lng: -48.548 },
};

export function getRadiusCenter(city: string): { lat: number; lng: number } {
  const canonical = canonicalizeCityName(city);
  return CITY_CENTERS[canonical] ?? ES_STATE_CENTER;
}
