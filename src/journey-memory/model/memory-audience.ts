/** Consumidor da memória — cada superfície da plataforma projeta a mesma fonte. */
export type MemoryAudience = "PORTAL" | "CURATORIA" | "OPERACAO" | "GOVERNANCA";

export type MemoryConsumerRole = "PATIENT" | "CURATOR" | "OPERATOR" | "AUDITOR" | "ADMIN";

export const MEMORY_AUDIENCE_LABELS: Record<MemoryAudience, string> = {
  PORTAL: "Portal do paciente",
  CURATORIA: "Curadoria",
  OPERACAO: "Operação",
  GOVERNANCA: "Governança",
};

export function roleToMemoryAudience(role: MemoryConsumerRole): MemoryAudience {
  switch (role) {
    case "PATIENT":
      return "PORTAL";
    case "CURATOR":
      return "CURATORIA";
    case "OPERATOR":
      return "OPERACAO";
    case "AUDITOR":
    case "ADMIN":
      return "GOVERNANCA";
    default:
      return "GOVERNANCA";
  }
}
