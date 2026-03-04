import type { Coordinates } from "@/types/assistance";
import { z } from "zod";

const routeResponseSchema = z.object({
  routes: z.array(
    z.object({
      geometry: z.object({
        coordinates: z.array(z.tuple([z.number(), z.number()])),
      }),
    }),
  ),
});

async function getDrivingRoute(
  origin: Coordinates,
  destination: Coordinates,
): Promise<[number, number][]> {
  const response = await fetch(
    `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=simplified&geometries=geojson`,
  );

  if (!response.ok) {
    throw new Error("ROUTE_REQUEST_FAILED");
  }

  const parsedResponse = routeResponseSchema.safeParse(await response.json());
  if (!parsedResponse.success || parsedResponse.data.routes.length === 0) {
    throw new Error("ROUTE_INVALID_RESPONSE");
  }

  return parsedResponse.data.routes[0].geometry.coordinates.map(
    ([lng, lat]) => [lat, lng] as [number, number],
  );
}

export { getDrivingRoute };
