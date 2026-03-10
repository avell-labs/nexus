import type {
  AuthorizedAssistance,
  Coordinates,
  NearestAssistanceResult,
} from "@/types/assistance";
import { z } from "zod";
import { collection, getDocs } from "firebase/firestore";
import { getFirestoreDb } from "@/services/firebase-client";
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

const localAuthorizedAssistances = authorizedAssistanceCollectionSchema.parse(
  localAuthorizedAssistancesData,
);

let cachedAuthorizedAssistances: AuthorizedAssistance[] | null = null;
let authorizedAssistancesPromise: Promise<AuthorizedAssistance[]> | null = null;

async function fetchAuthorizedAssistancesFromFirebase(): Promise<
  AuthorizedAssistance[] | null
> {
  const db = getFirestoreDb();
  if (!db) {
    return null;
  }

  const snapshot = await getDocs(collection(db, "authorized_assistances"));
  if (snapshot.empty) {
    throw new Error("EMPTY_DATASET");
  }

  const items = snapshot.docs.map((doc) => {
    const data = doc.data() as Record<string, unknown>;
    const id = typeof data.id === "string" ? data.id : doc.id;
    return { id, ...data };
  });

  return authorizedAssistanceCollectionSchema.parse(items);
}

async function getAuthorizedAssistances(): Promise<
  readonly AuthorizedAssistance[]
> {
  if (cachedAuthorizedAssistances) {
    return cachedAuthorizedAssistances;
  }

  if (authorizedAssistancesPromise) {
    return authorizedAssistancesPromise;
  }

  authorizedAssistancesPromise = (async () => {
    try {
      const remoteAssistances = await fetchAuthorizedAssistancesFromFirebase();
      if (remoteAssistances) {
        cachedAuthorizedAssistances = remoteAssistances;
        return remoteAssistances;
      }
    } catch (error) {
      console.warn(
        "Failed to load authorized assistances from Firebase. Falling back to local JSON.",
        error,
      );
    }

    cachedAuthorizedAssistances = localAuthorizedAssistances;
    return localAuthorizedAssistances;
  })();

  return authorizedAssistancesPromise;
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
};
