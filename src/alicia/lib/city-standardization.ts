import { ES_CITIES } from "./es-cities";

const CITY_ALIASES: Record<string, string> = {
  cariacica: "Cariácica",
  "cachoeiro": "Cachoeiro de Itapemirim",
  "cachoeiro de itapemirim": "Cachoeiro de Itapemirim",
  "sao mateus": "São Mateus",
  "vila velha": "Vila Velha",
  vitoria: "Vitória",
  guarapari: "Guarapari",
  viana: "Viana",
  colatina: "Colatina",
  linhares: "Linhares",
  aracruz: "Aracruz",
  serra: "Serra",
};

function normalizeKey(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

const CANONICAL_BY_KEY = new Map(
  ES_CITIES.map((city) => [normalizeKey(city.name), city.name]),
);

export function canonicalizeCityName(city: string): string {
  const trimmed = city.trim();
  if (!trimmed) {
    return trimmed;
  }

  const alias = CITY_ALIASES[normalizeKey(trimmed)];
  if (alias) {
    return alias;
  }

  return CANONICAL_BY_KEY.get(normalizeKey(trimmed)) ?? trimmed;
}

export function isEspiritoSantoCity(city: string): boolean {
  return CANONICAL_BY_KEY.has(normalizeKey(city));
}
