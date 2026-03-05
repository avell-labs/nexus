import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ChevronsUpDown, Copy, Search } from "lucide-react";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  findNearestAssistance,
  findNearestAssistanceInCity,
} from "@/services/assistance-service";
import {
  geocodeSearchQuery,
  normalizeSearchQuery,
} from "@/services/geocoding-service";
import type { NearestAssistanceResult } from "@/types/assistance";

type SearchStatus = "idle" | "loading" | "success" | "empty" | "error";

interface SearchState {
  status: SearchStatus;
  errorMessage: string | null;
  nearestResult: NearestAssistanceResult | null;
  hasCityMatch: boolean;
}

function SearchAssistancePage() {
  const { t } = useTranslation();
  const [query, setQuery] = React.useState("");
  const [debouncedQuery, setDebouncedQuery] = React.useState("");
  const [isOpen, setIsOpen] = React.useState(false);
  const [copyState, setCopyState] = React.useState<"idle" | "copied">("idle");
  const [searchState, setSearchState] = React.useState<SearchState>({
    status: "idle",
    errorMessage: null,
    nearestResult: null,
    hasCityMatch: false,
  });

  const requestIdRef = React.useRef(0);
  const lastSearchKeyRef = React.useRef("");
  const copyTimeoutRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    const timeoutId = window.setTimeout(() => setDebouncedQuery(query), 450);
    return () => window.clearTimeout(timeoutId);
  }, [query]);

  React.useEffect(() => {
    const normalized = normalizeSearchQuery(debouncedQuery);
    if (!normalized) {
      lastSearchKeyRef.current = "";
      setSearchState({
        status: "idle",
        errorMessage: null,
        nearestResult: null,
        hasCityMatch: false,
      });
      setIsOpen(false);
      return;
    }

    if (lastSearchKeyRef.current === normalized) return;
    lastSearchKeyRef.current = normalized;

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    setSearchState((prev) => ({
      ...prev,
      status: "loading",
      errorMessage: null,
    }));

    const run = async () => {
      try {
        const geocodingResult = await geocodeSearchQuery(normalized);
        const nearestInCity = geocodingResult.city
          ? findNearestAssistanceInCity(
              geocodingResult.coordinates,
              geocodingResult.city,
            )
          : null;
        const nearestResult =
          nearestInCity ?? findNearestAssistance(geocodingResult.coordinates);

        if (requestId !== requestIdRef.current) return;

        if (!nearestResult) {
          setSearchState({
            status: "empty",
            errorMessage: t("searchNoResults"),
            nearestResult: null,
            hasCityMatch: false,
          });
          setIsOpen(false);
          return;
        }

        setSearchState({
          status: "success",
          errorMessage: null,
          nearestResult,
          hasCityMatch: Boolean(nearestInCity),
        });
        setIsOpen(true);
      } catch (error) {
        if (requestId !== requestIdRef.current) return;

        const isInvalid =
          error instanceof Error && error.message === "INVALID_QUERY";
        setSearchState({
          status: "error",
          errorMessage: isInvalid ? t("searchInvalid") : t("searchError"),
          nearestResult: null,
          hasCityMatch: false,
        });
      }
    };

    void run();
  }, [debouncedQuery, t]);

  const nearestResult =
    searchState.status === "success" ? searchState.nearestResult : null;
  const hasResult = nearestResult !== null;

  React.useEffect(
    () => () => {
      if (copyTimeoutRef.current) {
        window.clearTimeout(copyTimeoutRef.current);
      }
    },
    [],
  );

  function formatDistance(distanceKm: number): string {
    if (distanceKm < 1) return `${Math.round(distanceKm * 1000)} m`;
    return `${distanceKm.toFixed(1)} km`;
  }

  async function copyAssistanceDetails() {
    if (!hasResult) return;

    const { assistance } = nearestResult;
    const copyText = [
      assistance.name,
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

  return (
    <div className="relative flex h-full min-h-0 justify-center overflow-auto p-4 sm:p-6">
      <div className="flex w-full max-w-3xl flex-col gap-5">
        <section className="bg-card space-y-3 rounded-2xl border p-4 shadow-sm sm:p-5">
          <InputGroup className="w-full">
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

          {searchState.status === "loading" && (
            <p className="text-muted-foreground inline-flex items-center gap-2 text-sm">
              <Spinner />
              {t("searchLoading")}
            </p>
          )}
          {searchState.status === "error" && (
            <p className="text-destructive text-sm">{searchState.errorMessage}</p>
          )}
          {searchState.status === "empty" && (
            <p className="text-muted-foreground text-sm">
              {searchState.errorMessage ?? t("searchNoResults")}
            </p>
          )}
          {searchState.status === "success" && !searchState.hasCityMatch && (
            <p
              className="text-muted-foreground text-sm"
              data-testid="search-no-city-results"
            >
              {t("searchNoCityResults")}
            </p>
          )}
        </section>

        {hasResult && (
          <Collapsible
            data-testid="nearest-assistance-card"
            open={isOpen}
            onOpenChange={setIsOpen}
            className="bg-card flex w-full flex-col gap-2 rounded-2xl border p-3 shadow-sm sm:p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  {t("nearestAssistanceTitle")}
                </p>
                <h3 className="text-foreground text-base font-semibold sm:text-lg">
                  {nearestResult.assistance.name}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <Badge>{nearestResult.assistance.type}</Badge>
                <CollapsibleTrigger
                  render={
                    <Button variant="ghost" size="icon" className="size-8">
                      <ChevronsUpDown />
                      <span className="sr-only">{t("toggleDetails")}</span>
                    </Button>
                  }
                />
              </div>
            </div>
            <CollapsibleContent className="flex flex-col gap-3">
              <div className="bg-muted/30 space-y-2 rounded-xl border px-4 py-3 text-sm">
                <p className="font-medium">{t("assistanceAddress")}</p>
                <p className="text-muted-foreground">
                  {nearestResult.assistance.address}, {nearestResult.assistance.city} -{" "}
                  {nearestResult.assistance.state}, {nearestResult.assistance.zipCode}
                </p>
                <p className="font-medium">{t("assistanceContact")}</p>
                <p className="text-muted-foreground">
                  {nearestResult.assistance.phone} | {nearestResult.assistance.email}
                </p>
                <p className="font-medium">{t("assistanceData")}</p>
                <p className="text-muted-foreground">
                  CNPJ: {nearestResult.assistance.cnpj} | CRM: {nearestResult.assistance.crm}
                </p>
                <p className="font-medium">{t("distanceLabel")}</p>
                <p className="text-muted-foreground font-medium">
                  {formatDistance(nearestResult.distanceKm)}
                </p>
              </div>
              <Button
                variant={copyState === "copied" ? "default" : "outline"}
                size="sm"
                onClick={copyAssistanceDetails}
                className="w-full cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] sm:w-fit"
              >
                <Copy />
                {copyState === "copied" ? t("copyDoneBtn") : t("copyBtn")}
              </Button>
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>
    </div>
  );
}

export const Route = createFileRoute("/search_assistance")({
  component: SearchAssistancePage,
});
