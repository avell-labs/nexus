import {
  findNearestAssistanceFromList,
  findNearestAssistanceInCityFromList,
  findNearestRecommendedAssistanceFromList,
  findNearestRecommendedAssistanceInCityFromList,
} from "@/services/assistance-service";
import type { AuthorizedAssistance } from "@/types/assistance";

const mockAssistances: AuthorizedAssistance[] = [
  {
    id: "joinville-a",
    score: 2,
    name: "Joinville A",
    type: "Centro de Reparo",
    address: "Rua A, 100",
    city: "Joinville",
    state: "SC",
    zipCode: "89200-000",
    phone: "47999999999",
    email: "joinville-a@example.com",
    cnpj: "00.000.000/0001-00",
    crm: "C000001",
    location: { lat: -26.25349, lng: -48.84021 },
  },
  {
    id: "joinville-b",
    score: 4,
    name: "Joinville B",
    type: "Posto Autorizado",
    address: "Rua B, 200",
    city: "Joinville",
    state: "SC",
    zipCode: "89200-001",
    phone: "47999999998",
    email: "joinville-b@example.com",
    cnpj: "00.000.000/0001-01",
    crm: "C000002",
    location: { lat: -26.3044, lng: -48.8464 },
  },
  {
    id: "curitiba-a",
    score: 5,
    name: "Curitiba A",
    type: "Centro de Reparo",
    address: "Rua C, 300",
    city: "Curitiba",
    state: "PR",
    zipCode: "80000-000",
    phone: "41999999999",
    email: "curitiba-a@example.com",
    cnpj: "00.000.000/0001-02",
    crm: "C000003",
    location: { lat: -25.4444, lng: -49.28518 },
  },
];

describe("assistance-service", () => {
  it("finds nearest assistance within city when available", () => {
    const result = findNearestAssistanceInCityFromList(
      { lat: -26.25349, lng: -48.84021 },
      "Joinville",
      mockAssistances,
    );

    expect(result).not.toBeNull();
    expect(result?.assistance.id).toBe("joinville-a");
  });

  it("returns null when city has no assistance", () => {
    const result = findNearestAssistanceInCityFromList(
      { lat: -10.0, lng: -55.0 },
      "Cidade Sem Assistencia",
      mockAssistances,
    );

    expect(result).toBeNull();
  });

  it("finds nearest assistance globally as fallback", () => {
    const result = findNearestAssistanceFromList(
      { lat: -10.0, lng: -55.0 },
      mockAssistances,
    );

    expect(result).not.toBeNull();
    expect(result!.distanceKm).toBeGreaterThanOrEqual(0);
  });

  it("skips low score assistances when recommending", () => {
    const result = findNearestRecommendedAssistanceFromList(
      { lat: -26.25349, lng: -48.84021 },
      mockAssistances,
    );

    expect(result).not.toBeNull();
    expect(result?.assistance.id).toBe("joinville-b");
  });

  it("returns null when city has only low score assistances", () => {
    const result = findNearestRecommendedAssistanceInCityFromList(
      { lat: -26.25349, lng: -48.84021 },
      "Joinville",
      [
        {
          ...mockAssistances[0],
          score: 1,
        },
      ],
    );

    expect(result).toBeNull();
  });
});
