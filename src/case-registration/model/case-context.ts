/** Origem do caso na plataforma. */
export type CaseSource = "INTAKE" | "STAFF" | "REFERRAL";

export type CaseStatus = "OPEN" | "ACTIVE" | "CLOSED";

/** Contexto declarado do caso ÔÇö necessidade e inten├º├úo. */
export interface CaseContext {
  title: string;
  objective: string | null;
  declaredNeed: string | null;
  source: CaseSource;
}

export function createCaseContext(input: {
  title: string;
  objective?: string | null;
  declaredNeed?: string | null;
  source?: CaseSource;
}): CaseContext {
  return {
    title: input.title.trim(),
    objective: input.objective?.trim() ?? null,
    declaredNeed: input.declaredNeed?.trim() ?? null,
    source: input.source ?? "INTAKE",
  };
}
