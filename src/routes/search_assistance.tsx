import { useTranslation } from "react-i18next";
import { createFileRoute } from "@tanstack/react-router";
import NavigationMenu from "@/components/navigation-menu";
import * as React from "react";
import { Search, Copy, Wrench, User } from "lucide-react";
import { useMap } from "react-leaflet";

import {
  Map,
  MapCircle,
  MapMarker,
  MapPolyline,
  MapTileLayer,
  MapFullscreenControl,
  MapZoomControl,
} from "@/components/ui/map";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronsUpDown } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  findNearestAssistance,
  findNearestAssistanceInCity,
} from "@/services/assistance-service";
import {
  geocodeSearchQuery,
  normalizeSearchQuery,
} from "@/services/geocoding-service";
import { getDrivingRoute } from "@/services/route-service";
import type { Coordinates, NearestAssistanceResult } from "@/types/assistance";

type SearchStatus = "idle" | "loading" | "success" | "empty" | "error";

interface SearchState {
  status: SearchStatus;
  errorMessage: string | null;
  geocodedLocation: Coordinates | null;
  nearestResult: NearestAssistanceResult | null;
  hasCityMatch: boolean;
}

const DEFAULT_CENTER: [number, number] = [-26.3044, -48.8464];

function MapViewportController({
  searchCoordinates,
  assistanceCoordinates,
  routeCoordinates,
}: {
  searchCoordinates: [number, number] | null;
  assistanceCoordinates: [number, number] | null;
  routeCoordinates: [number, number][];
}) {
  const map = useMap();

  React.useEffect(() => {
    if (routeCoordinates.length > 1) {
      map.fitBounds(routeCoordinates, { animate: true, padding: [40, 40] });
      return;
    }

    if (assistanceCoordinates) {
      map.setView(assistanceCoordinates, 15, { animate: true });
      return;
    }

    if (searchCoordinates) {
      map.setView(searchCoordinates, 14, { animate: true });
      return;
    }

    map.setView(DEFAULT_CENTER, 6, { animate: true });
  }, [map, searchCoordinates, assistanceCoordinates, routeCoordinates]);

  return null;
}

function SecondPage() {
  const { t } = useTranslation();
  const [query, setQuery] = React.useState("");
  const [debouncedQuery, setDebouncedQuery] = React.useState("");
  const [isOpen, setIsOpen] = React.useState(false);
  const [copyState, setCopyState] = React.useState<"idle" | "copied">("idle");
  const [routeCoordinates, setRouteCoordinates] = React.useState<
    [number, number][]
  >([]);
  const [searchState, setSearchState] = React.useState<SearchState>({
    status: "idle",
    errorMessage: null,
    geocodedLocation: null,
    nearestResult: null,
    hasCityMatch: false,
  });
  const latestRequestId = React.useRef(0);
  const copyTimeoutRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedQuery(query);
    }, 500);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [query]);

  const runSearch = React.useCallback(
    async (rawQuery: string) => {
      const normalizedQuery = normalizeSearchQuery(rawQuery);
      if (!normalizedQuery) {
        setSearchState({
          status: "idle",
          errorMessage: null,
          geocodedLocation: null,
          nearestResult: null,
          hasCityMatch: false,
        });
        return;
      }

      const requestId = latestRequestId.current + 1;
      latestRequestId.current = requestId;

      setSearchState((previousState) => ({
        ...previousState,
        status: "loading",
        errorMessage: null,
      }));

      try {
        const geocodingResult = await geocodeSearchQuery(normalizedQuery);
        const nearestInCity = geocodingResult.city
          ? findNearestAssistanceInCity(
              geocodingResult.coordinates,
              geocodingResult.city,
            )
          : null;
        const nearestResult =
          nearestInCity ?? findNearestAssistance(geocodingResult.coordinates);

        if (requestId !== latestRequestId.current) {
          return;
        }

        if (!nearestResult) {
          setSearchState({
            status: "empty",
            errorMessage: t("searchNoResults"),
            geocodedLocation: geocodingResult.coordinates,
            nearestResult: null,
            hasCityMatch: false,
          });
          setRouteCoordinates([]);
          setIsOpen(false);
          return;
        }

        setSearchState({
          status: "success",
          errorMessage: null,
          geocodedLocation: geocodingResult.coordinates,
          nearestResult,
          hasCityMatch: Boolean(nearestInCity),
        });
        setIsOpen(true);
      } catch (error) {
        if (requestId !== latestRequestId.current) {
          return;
        }

        if (error instanceof Error && error.message === "INVALID_QUERY") {
          setSearchState({
            status: "error",
            errorMessage: t("searchInvalid"),
            geocodedLocation: null,
            nearestResult: null,
            hasCityMatch: false,
          });
          setRouteCoordinates([]);
          return;
        }

        setSearchState({
          status: "error",
          errorMessage: t("searchError"),
          geocodedLocation: null,
          nearestResult: null,
          hasCityMatch: false,
        });
        setRouteCoordinates([]);
      }
    },
    [t],
  );

  React.useEffect(() => {
    void runSearch(debouncedQuery);
  }, [debouncedQuery, runSearch]);

  const nearestResult =
    searchState.status === "success" ? searchState.nearestResult : null;
  const hasResult = nearestResult !== null;
  const mapCenter: [number, number] = searchState.geocodedLocation
    ? [searchState.geocodedLocation.lat, searchState.geocodedLocation.lng]
    : DEFAULT_CENTER;

  const nearestCoordinates: [number, number] | null = hasResult
    ? [
        nearestResult.assistance.location.lat,
        nearestResult.assistance.location.lng,
      ]
    : null;

  React.useEffect(() => {
    if (!searchState.geocodedLocation || !nearestResult) {
      setRouteCoordinates([]);
      return;
    }

    if (!searchState.hasCityMatch) {
      setRouteCoordinates([]);
      return;
    }

    let active = true;
    const origin = searchState.geocodedLocation;
    const destination = nearestResult.assistance.location;

    const loadRoute = async () => {
      try {
        const route = await getDrivingRoute(origin, destination);
        if (!active) return;
        setRouteCoordinates(route);
      } catch {
        if (!active) return;
        setRouteCoordinates([
          [origin.lat, origin.lng],
          [destination.lat, destination.lng],
        ]);
      }
    };

    void loadRoute();

    return () => {
      active = false;
    };
  }, [searchState.geocodedLocation, nearestResult, searchState.hasCityMatch]);

  function formatDistance(distanceKm: number): string {
    if (distanceKm < 1) {
      return `${Math.round(distanceKm * 1000)} m`;
    }
    return `${distanceKm.toFixed(1)} km`;
  }

  async function copyAssistanceDetails(): Promise<void> {
    if (!hasResult) {
      return;
    }

    const { assistance } = nearestResult;
    const copyText = [
      `${assistance.name}`,
      `${t("assistanceAddress")}: ${assistance.address}, ${assistance.city} - ${assistance.state}, ${assistance.zipCode}`,
      `${t("assistanceContact")}: ${assistance.phone} | ${assistance.email}`,
    ].join("\n");

    await navigator.clipboard.writeText(copyText);
    setCopyState("copied");

    if (copyTimeoutRef.current) {
      window.clearTimeout(copyTimeoutRef.current);
    }

    copyTimeoutRef.current = window.setTimeout(() => {
      setCopyState("idle");
      copyTimeoutRef.current = null;
    }, 1800);
  }

  React.useEffect(
    () => () => {
      if (copyTimeoutRef.current) {
        window.clearTimeout(copyTimeoutRef.current);
      }
    },
    [],
  );

  function renderStateText() {
    if (searchState.status === "idle") {
      return <p className="text-muted-foreground text-sm">{t("searchHint")}</p>;
    }

    if (searchState.status === "loading") {
      return (
        <p className="text-muted-foreground inline-flex items-center gap-2 text-sm">
          <Spinner />
          {t("searchLoading")}
        </p>
      );
    }

    if (searchState.status === "error") {
      return (
        <p className="text-destructive text-sm">{searchState.errorMessage}</p>
      );
    }

    if (searchState.status === "empty") {
      return (
        <p className="text-muted-foreground text-sm">
          {searchState.errorMessage ?? t("searchNoResults")}
        </p>
      );
    }

    return null;
  }

  return (
    <>
      <NavigationMenu />
      <div className="flex h-full flex-col">
        <div className="flex flex-1 flex-col items-center justify-center gap-3">
          <InputGroup className="max-w-xs">
            <InputGroupInput
              data-testid="search-assistance-input"
              placeholder={t("searchPlaceholder")}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  setDebouncedQuery(query);
                }
              }}
            />
            <InputGroupAddon>
              <InputGroupButton
                data-testid="search-assistance-submit"
                size="icon-xs"
                aria-label={t("searchPage")}
                onClick={() => setDebouncedQuery(query)}
              >
                <Search />
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>

          {renderStateText()}
          {searchState.status === "success" && !searchState.hasCityMatch && (
            <p
              className="text-muted-foreground text-sm"
              data-testid="search-no-city-results"
            >
              {t("searchNoCityResults")}
            </p>
          )}

          {hasResult && (
            <Collapsible
              data-testid="nearest-assistance-card"
              open={isOpen}
              onOpenChange={setIsOpen}
              className="flex w-[350px] flex-col gap-2"
            >
              <div className="flex items-center justify-between gap-4 px-4">
                <h4 className="text-sm font-semibold">
                  {nearestResult.assistance.name}
                </h4>
                <Badge>{nearestResult.assistance.type}</Badge>
                <CollapsibleTrigger
                  render={
                    <Button variant="ghost" size="icon" className="size-8">
                      <ChevronsUpDown />
                      <span className="sr-only">Toggle details</span>
                    </Button>
                  }
                />
              </div>
              <CollapsibleContent className="flex flex-col gap-2">
                <div className="rounded-md border px-4 py-2 text-sm">
                  <p className="font-medium">{t("assistanceAddress")}</p>
                  <p className="text-muted-foreground">
                    {nearestResult.assistance.address},{" "}
                    {nearestResult.assistance.city} -{" "}
                    {nearestResult.assistance.state},{" "}
                    {nearestResult.assistance.zipCode}
                  </p>
                  <p className="font-medium">{t("assistanceContact")}</p>
                  <p className="text-muted-foreground">
                    {nearestResult.assistance.phone} |{" "}
                    {nearestResult.assistance.email}
                  </p>
                  <p className="font-medium">{t("assistanceData")}</p>
                  <p className="text-muted-foreground">
                    CNPJ: {nearestResult.assistance.cnpj} | CRM:{" "}
                    {nearestResult.assistance.crm}
                  </p>
                  <p className="font-medium">{t("distanceLabel")}</p>
                  <p className="text-muted-foreground">
                    {formatDistance(nearestResult.distanceKm)}
                  </p>
                </div>
                <Button
                  variant={copyState === "copied" ? "default" : "outline"}
                  size="sm"
                  onClick={copyAssistanceDetails}
                  className="cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99]"
                >
                  <Copy />
                  {copyState === "copied" ? t("copyDoneBtn") : t("copyBtn")}
                </Button>
              </CollapsibleContent>
            </Collapsible>
          )}

          <Map className="mx-auto w-full" center={mapCenter}>
            <MapViewportController
              searchCoordinates={
                searchState.geocodedLocation ? mapCenter : null
              }
              assistanceCoordinates={nearestCoordinates}
              routeCoordinates={routeCoordinates}
            />
            <MapTileLayer
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"
              darkUrl="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"
            />
            <MapZoomControl />
            <MapFullscreenControl />

            {searchState.geocodedLocation && (
              <>
                <MapMarker
                  position={mapCenter}
                  icon={<User className="size-5 text-sky-500 drop-shadow-sm" />}
                />
                <MapCircle
                  center={mapCenter}
                  radius={120}
                  className="fill-sky-500/40 stroke-sky-500 stroke-2"
                />
              </>
            )}

            {routeCoordinates.length > 1 && (
              <MapPolyline
                positions={routeCoordinates}
                className="stroke-primary fill-transparent stroke-[3]"
              />
            )}

            {nearestCoordinates && (
              <>
                <MapMarker
                  position={nearestCoordinates}
                  iconAnchor={[10, 10]}
                  icon={
                    <Wrench className="size-5 text-amber-500 drop-shadow-sm" />
                  }
                />
                <MapCircle
                  center={nearestCoordinates}
                  radius={100}
                  className="fill-amber-500/40 stroke-amber-500 stroke-2"
                />
              </>
            )}
          </Map>
        </div>
      </div>
    </>
  );
}

export const Route = createFileRoute("/search_assistance")({
  component: SecondPage,
});
