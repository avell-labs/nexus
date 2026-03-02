import {
  findNearestAssistance,
  findNearestAssistanceInCity,
  getAuthorizedAssistances,
} from "@/services/assistance-service";

describe("assistance-service", () => {
  it("loads authorized assistances dataset", () => {
    expect(getAuthorizedAssistances().length).toBeGreaterThan(0);
  });

  it("finds nearest assistance within city when available", () => {
    const result = findNearestAssistanceInCity(
      { lat: -26.25349, lng: -48.84021 },
      "Joinville",
    );

    expect(result).not.toBeNull();
    expect(result?.assistance.city).toBe("Joinville");
  });

  it("returns null when city has no assistance", () => {
    const result = findNearestAssistanceInCity(
      { lat: -10.0, lng: -55.0 },
      "Cidade Sem Assistencia",
    );

    expect(result).toBeNull();
  });

  it("finds nearest assistance globally as fallback", () => {
    const result = findNearestAssistance({ lat: -10.0, lng: -55.0 });

    expect(result).not.toBeNull();
    expect(result!.distanceKm).toBeGreaterThanOrEqual(0);
  });
});
