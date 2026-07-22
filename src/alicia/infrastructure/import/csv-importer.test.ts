import { describe, expect, it } from "vitest";

import { importCatalogFromCsv, parseCsvToCatalogPayload } from "@/alicia/infrastructure/import/csv-importer";

const csv = `id,name,specialty,lat,lng,city,state,mainInstitution,whoTheyAre,trajectory,graduation,residency,fellowships,practiceAreas,institutions,scientificProductionPlaceholder,transparency
dr-csv,Dr. CSV,Neurologia,-30.0,-51.2,Porto Alegre,RS,HCPA,Neurologista.,Formou-se na UFRGS.,"{""institution"":""UFRGS"",""program"":""Medicina"",""verified"":true}","[]","[]","[""Cefaleia""]","[{""name"":""HCPA"",""role"":""Neurologista"",""city"":""Porto Alegre""}]","Placeholder","{""lastUpdated"":""2026-01-01"",""sources"":[{""name"":""CRM-RS"",""type"":""Conselho""}],""unverifiedFields"":[]}"`;

describe("csv importer", () => {
  it("parses csv payload", () => {
    const payload = parseCsvToCatalogPayload(csv);
    expect(payload.doctors).toHaveLength(1);
    expect(payload.doctors[0].name).toBe("Dr. CSV");
  });

  it("rejects csv without data rows", () => {
    expect(() => parseCsvToCatalogPayload("id,name")).toThrow(/cabeçalho/i);
  });

  it("imports normalized catalog from csv", () => {
    const snapshot = importCatalogFromCsv(csv);
    expect(snapshot.doctors[0].id).toBe("dr-csv");
    expect(snapshot.specialties.size).toBe(1);
  });
});
