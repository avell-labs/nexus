import type {
  AuthorizedAssistance,
  Coordinates,
  NearestAssistanceResult,
} from "@/types/assistance";
import { z } from "zod";

const authorizedAssistanceSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: z.string().min(1),
  address: z.string().min(1),
  city: z.string().min(1),
  state: z.string().length(2),
  zipCode: z.string().min(1),
  phone: z.string().min(1),
  email: z.email(),
  cnpj: z.string().min(1),
  crm: z.string().min(1),
  location: z.object({
    lat: z.number().gte(-90).lte(90),
    lng: z.number().gte(-180).lte(180),
  }),
});

const authorizedAssistanceCollectionSchema = z.array(
  authorizedAssistanceSchema,
);

function loadRawAuthorizedAssistances(): unknown {
  const dataModules = import.meta.glob("../data/authorized_assistances.json", {
    eager: true,
    import: "default",
  }) as Record<string, unknown>;

  const loadedData = Object.values(dataModules)[0];
  return loadedData ?? [];
}

const parsedAuthorizedAssistances = authorizedAssistanceCollectionSchema.parse(
  loadRawAuthorizedAssistances(),
);

function getAuthorizedAssistances(): readonly AuthorizedAssistance[] {
  return parsedAuthorizedAssistances;
}

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

function calculateDistanceInKm(
  origin: Coordinates,
  destination: Coordinates,
): number {
  const earthRadiusKm = 6371;
  const deltaLat = toRadians(destination.lat - origin.lat);
  const deltaLng = toRadians(destination.lng - origin.lng);
  const originLatRad = toRadians(origin.lat);
  const destinationLatRad = toRadians(destination.lat);

  const haversineTerm =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(originLatRad) *
      Math.cos(destinationLatRad) *
      Math.sin(deltaLng / 2) ** 2;
  const centralAngle =
    2 * Math.atan2(Math.sqrt(haversineTerm), Math.sqrt(1 - haversineTerm));

  return earthRadiusKm * centralAngle;
}

function normalizeCity(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

function findNearestAssistance(
  origin: Coordinates,
): NearestAssistanceResult | null {
  const assistances = getAuthorizedAssistances();
  if (assistances.length === 0) {
    return null;
  }

  let nearestAssistance = assistances[0];
  let nearestDistance = calculateDistanceInKm(
    origin,
    nearestAssistance.location,
  );

  for (const assistance of assistances.slice(1)) {
    const currentDistance = calculateDistanceInKm(origin, assistance.location);
    if (currentDistance < nearestDistance) {
      nearestAssistance = assistance;
      nearestDistance = currentDistance;
    }
  }

  return {
    assistance: nearestAssistance,
    distanceKm: nearestDistance,
  };
}

function findNearestAssistanceInCity(
  origin: Coordinates,
  city: string,
): NearestAssistanceResult | null {
  const normalizedTargetCity = normalizeCity(city);
  const assistancesInCity = getAuthorizedAssistances().filter(
    (assistance) => normalizeCity(assistance.city) === normalizedTargetCity,
  );

  if (assistancesInCity.length === 0) {
    return null;
  }

  let nearestAssistance = assistancesInCity[0];
  let nearestDistance = calculateDistanceInKm(
    origin,
    nearestAssistance.location,
  );

  for (const assistance of assistancesInCity.slice(1)) {
    const currentDistance = calculateDistanceInKm(origin, assistance.location);
    if (currentDistance < nearestDistance) {
      nearestAssistance = assistance;
      nearestDistance = currentDistance;
    }
  }

  return {
    assistance: nearestAssistance,
    distanceKm: nearestDistance,
  };
}

export {
  findNearestAssistance,
  findNearestAssistanceInCity,
  getAuthorizedAssistances,
};
