import type {
  CatalogImportPayload,
  CsvDoctorRow,
  DoctorImportRecord,
} from "@/alicia/infrastructure/import/import-types";
import { normalizeCatalogImportPayload } from "@/alicia/infrastructure/import/normalizer";

function parseJsonArray<T>(value: string | undefined, fallback: T[] = []): T[] {
  if (!value?.trim()) {
    return fallback;
  }
  return JSON.parse(value) as T[];
}

function rowToDoctorImportRecord(row: CsvDoctorRow): DoctorImportRecord {
  return {
    id: row.id,
    name: row.name,
    specialty: row.specialty,
    location: {
      lat: Number(row.lat),
      lng: Number(row.lng),
      city: row.city,
      state: row.state,
    },
    mainInstitution: row.mainInstitution,
    whoTheyAre: row.whoTheyAre,
    trajectory: row.trajectory,
    graduation: JSON.parse(row.graduation),
    residency: parseJsonArray(row.residency),
    fellowships: parseJsonArray(row.fellowships),
    practiceAreas: parseJsonArray<string>(row.practiceAreas),
    institutions: parseJsonArray(row.institutions),
    scientificProductionPlaceholder: row.scientificProductionPlaceholder,
    transparency: JSON.parse(row.transparency),
  };
}

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      if (inQuotes && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }
    current += char;
  }

  values.push(current);
  return values;
}

export function parseCsvToCatalogPayload(csv: string): CatalogImportPayload {
  const lines = csv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    throw new Error("CSV deve conter cabeçalho e ao menos uma linha de dados.");
  }

  const headers = parseCsvLine(lines[0]);
  const doctors = lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const row = Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
    return rowToDoctorImportRecord(row);
  });

  return { doctors };
}

export function importCatalogFromCsv(csv: string): ReturnType<typeof normalizeCatalogImportPayload> {
  return normalizeCatalogImportPayload(parseCsvToCatalogPayload(csv));
}
