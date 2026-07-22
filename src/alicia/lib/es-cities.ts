export type EsCityPriority = "metro" | "regional" | "other";

export type EsCity = {
  name: string;
  lat: number;
  lng: number;
  priority: EsCityPriority;
};

/** Cidades capixabas priorizadas para descoberta e cobertura estadual. */
export const ES_CITIES: EsCity[] = [
  { name: "Vitória", lat: -20.3155, lng: -40.3128, priority: "metro" },
  { name: "Vila Velha", lat: -20.3297, lng: -40.2925, priority: "metro" },
  { name: "Serra", lat: -20.1286, lng: -40.3078, priority: "metro" },
  { name: "Cariácica", lat: -20.2639, lng: -40.4165, priority: "metro" },
  { name: "Guarapari", lat: -20.6736, lng: -40.5029, priority: "metro" },
  { name: "Viana", lat: -20.3903, lng: -40.4962, priority: "metro" },
  { name: "Colatina", lat: -19.5383, lng: -40.6309, priority: "regional" },
  { name: "Linhares", lat: -19.3945, lng: -40.0643, priority: "regional" },
  { name: "Aracruz", lat: -19.82, lng: -40.2734, priority: "regional" },
  { name: "São Mateus", lat: -18.7163, lng: -39.8589, priority: "regional" },
  {
    name: "Cachoeiro de Itapemirim",
    lat: -20.8489,
    lng: -41.1128,
    priority: "regional",
  },
  { name: "Nova Venécia", lat: -18.7081, lng: -40.4003, priority: "other" },
  { name: "Barra de São Francisco", lat: -18.755, lng: -40.8908, priority: "other" },
  { name: "Alegre", lat: -20.7636, lng: -41.5331, priority: "other" },
  { name: "Castelo", lat: -20.6036, lng: -41.1847, priority: "other" },
  { name: "Marataízes", lat: -21.0433, lng: -40.8244, priority: "other" },
  { name: "Domingos Martins", lat: -20.3633, lng: -40.6592, priority: "other" },
  { name: "Santa Teresa", lat: -19.935, lng: -40.6003, priority: "other" },
];

export const ES_STATE_CENTER = { lat: -19.85, lng: -40.45 };

export const ES_PRIORITY_CITY_NAMES = ES_CITIES.filter(
  (city) => city.priority === "metro" || city.priority === "regional",
).map((city) => city.name);
