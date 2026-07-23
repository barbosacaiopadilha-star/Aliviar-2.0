import type { Identity } from "../model/identity";
import type { JourneyScope } from "../projection/journey-scope";

/** Resolve escopo de jornadas vis├¡veis para uma identidade. */
export interface JourneyScopePort {
  resolveScope(identity: Identity): Promise<JourneyScope>;
}
