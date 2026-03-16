import type {
  AuthorizedAssistance,
  Coordinates,
  NearestAssistanceResult,
} from "@/types/assistance";
import { z } from "zod";
import localAuthorizedAssistancesData from "@/data/authorized_assistances.json";

const authorizedAssistanceSchema = z.object({
  id: z.string().min(1),
  score: z.number().int().min(1).max(5).optional().default(3),
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

const MIN_RECOMMENDED_SCORE = 3;
const MIN_SEARCH_QUERY_LENGTH = 3;

const localAuthorizedAssistances = authorizedAssistanceCollectionSchema.parse(
  localAuthorizedAssistancesData,
);

async function getAuthorizedAssistances(): Promise<
  readonly AuthorizedAssistance[]
> {
  return localAuthorizedAssistances;
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

function normalizeSearchValue(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^\p{L}\p{N}]+/gu, "")
    .toLowerCase()
    .trim();
}

function isRecommendedAssistance(assistance: AuthorizedAssistance): boolean {
  return assistance.score >= MIN_RECOMMENDED_SCORE;
}

function findNearestAssistance(
  origin: Coordinates,
): Promise<NearestAssistanceResult | null> {
  return getAuthorizedAssistances().then((assistances) =>
    findNearestAssistanceFromList(origin, assistances),
  );
}

function findNearestAssistanceFromList(
  origin: Coordinates,
  assistances: readonly AuthorizedAssistance[],
): NearestAssistanceResult | null {
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
): Promise<NearestAssistanceResult | null> {
  return getAuthorizedAssistances().then((assistances) =>
    findNearestAssistanceInCityFromList(origin, city, assistances),
  );
}

function findNearestAssistanceInCityFromList(
  origin: Coordinates,
  city: string,
  assistances: readonly AuthorizedAssistance[],
): NearestAssistanceResult | null {
  const normalizedTargetCity = normalizeCity(city);
  const assistancesInCity = assistances.filter(
    (assistance) => normalizeCity(assistance.city) === normalizedTargetCity,
  );

  return findNearestAssistanceFromList(origin, assistancesInCity);
}

function findNearestRecommendedAssistance(
  origin: Coordinates,
): Promise<NearestAssistanceResult | null> {
  return getAuthorizedAssistances().then((assistances) =>
    findNearestRecommendedAssistanceFromList(origin, assistances),
  );
}

function findNearestRecommendedAssistanceFromList(
  origin: Coordinates,
  assistances: readonly AuthorizedAssistance[],
): NearestAssistanceResult | null {
  const recommendedAssistances = assistances.filter(isRecommendedAssistance);
  return findNearestAssistanceFromList(origin, recommendedAssistances);
}

function findNearestRecommendedAssistanceInCity(
  origin: Coordinates,
  city: string,
): Promise<NearestAssistanceResult | null> {
  return getAuthorizedAssistances().then((assistances) =>
    findNearestRecommendedAssistanceInCityFromList(origin, city, assistances),
  );
}

function findNearestRecommendedAssistanceInCityFromList(
  origin: Coordinates,
  city: string,
  assistances: readonly AuthorizedAssistance[],
): NearestAssistanceResult | null {
  const normalizedTargetCity = normalizeCity(city);
  const assistancesInCity = assistances.filter(
    (assistance) => normalizeCity(assistance.city) === normalizedTargetCity,
  );

  const recommendedAssistances = assistancesInCity.filter(
    isRecommendedAssistance,
  );

  return findNearestAssistanceFromList(origin, recommendedAssistances);
}

type AssistanceSearchMatch = {
  assistance: AuthorizedAssistance;
  matchScore: number;
  fieldRank: number;
};

const assistanceSearchFields: Array<{
  field: keyof AuthorizedAssistance;
  fieldRank: number;
}> = [
  { field: "name", fieldRank: 0 },
  { field: "id", fieldRank: 1 },
  { field: "cnpj", fieldRank: 2 },
  { field: "crm", fieldRank: 3 },
  { field: "email", fieldRank: 4 },
  { field: "phone", fieldRank: 5 },
];

function getAssistanceSearchMatch(
  assistance: AuthorizedAssistance,
  normalizedQuery: string,
): AssistanceSearchMatch | null {
  let bestMatch: AssistanceSearchMatch | null = null;

  for (const { field, fieldRank } of assistanceSearchFields) {
    const rawValue = assistance[field];
    if (typeof rawValue !== "string") continue;

    const normalizedValue = normalizeSearchValue(rawValue);
    if (!normalizedValue) continue;

    let matchScore = 0;
    if (normalizedValue === normalizedQuery) {
      matchScore = 3;
    } else if (normalizedValue.startsWith(normalizedQuery)) {
      matchScore = 2;
    }

    if (matchScore === 0) continue;

    const candidate: AssistanceSearchMatch = {
      assistance,
      matchScore,
      fieldRank,
    };

    if (
      !bestMatch ||
      candidate.matchScore > bestMatch.matchScore ||
      (candidate.matchScore === bestMatch.matchScore &&
        candidate.fieldRank < bestMatch.fieldRank)
    ) {
      bestMatch = candidate;
    }
  }

  return bestMatch;
}

function findAssistanceByQueryFromList(
  query: string,
  assistances: readonly AuthorizedAssistance[],
): AuthorizedAssistance | null {
  const normalizedQuery = normalizeSearchValue(query);
  if (normalizedQuery.length < MIN_SEARCH_QUERY_LENGTH) {
    return null;
  }

  let bestMatch: AssistanceSearchMatch | null = null;
  let hasTie = false;

  for (const assistance of assistances) {
    const match = getAssistanceSearchMatch(assistance, normalizedQuery);
    if (!match) continue;

    if (
      !bestMatch ||
      match.matchScore > bestMatch.matchScore ||
      (match.matchScore === bestMatch.matchScore &&
        match.fieldRank < bestMatch.fieldRank)
    ) {
      bestMatch = match;
      hasTie = false;
      continue;
    }

    if (
      bestMatch &&
      match.assistance.id !== bestMatch.assistance.id &&
      match.matchScore === bestMatch.matchScore &&
      match.fieldRank === bestMatch.fieldRank
    ) {
      hasTie = true;
    }
  }

  if (!bestMatch || hasTie) {
    return null;
  }

  return bestMatch.assistance;
}

function findAssistanceByQuery(
  query: string,
): Promise<AuthorizedAssistance | null> {
  return getAuthorizedAssistances().then((assistances) =>
    findAssistanceByQueryFromList(query, assistances),
  );
}

export {
  getAuthorizedAssistances,
  findNearestAssistance,
  findNearestAssistanceFromList,
  findNearestAssistanceInCity,
  findNearestAssistanceInCityFromList,
  findNearestRecommendedAssistance,
  findNearestRecommendedAssistanceFromList,
  findNearestRecommendedAssistanceInCity,
  findNearestRecommendedAssistanceInCityFromList,
  findAssistanceByQuery,
  findAssistanceByQueryFromList,
};
