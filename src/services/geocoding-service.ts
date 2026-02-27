import type { GeocodingResult } from "@/types/assistance";
import { z } from "zod";

const geocodingResponseSchema = z.array(
  z.object({
    lat: z.string(),
    lon: z.string(),
    display_name: z.string().min(1),
  }),
);

const geocodingCache = new Map<string, GeocodingResult>();

function normalizeSearchQuery(rawQuery: string): string {
  return rawQuery
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[^\p{L}\p{N}\s,.-]/gu, "");
}

function isValidSearchQuery(query: string): boolean {
  return query.length >= 3;
}

async function geocodeSearchQuery(query: string): Promise<GeocodingResult> {
  if (!isValidSearchQuery(query)) {
    throw new Error("INVALID_QUERY");
  }

  const normalizedQuery = normalizeSearchQuery(query);
  if (!isValidSearchQuery(normalizedQuery)) {
    throw new Error("INVALID_QUERY");
  }

  const cachedResult = geocodingCache.get(normalizedQuery);
  if (cachedResult) {
    return cachedResult;
  }

  const searchParams = new URLSearchParams({
    q: normalizedQuery,
    format: "jsonv2",
    limit: "1",
    countrycodes: "br",
  });

  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?${searchParams.toString()}`,
  );
  if (!response.ok) {
    throw new Error("GEOCODING_REQUEST_FAILED");
  }

  const parsedResponse = geocodingResponseSchema.safeParse(
    await response.json(),
  );
  if (!parsedResponse.success) {
    throw new Error("GEOCODING_INVALID_RESPONSE");
  }

  const [firstResult] = parsedResponse.data;
  if (!firstResult) {
    throw new Error("GEOCODING_NOT_FOUND");
  }

  const geocodingResult: GeocodingResult = {
    displayName: firstResult.display_name,
    coordinates: {
      lat: Number(firstResult.lat),
      lng: Number(firstResult.lon),
    },
  };

  geocodingCache.set(normalizedQuery, geocodingResult);
  return geocodingResult;
}

export { geocodeSearchQuery, isValidSearchQuery, normalizeSearchQuery };
