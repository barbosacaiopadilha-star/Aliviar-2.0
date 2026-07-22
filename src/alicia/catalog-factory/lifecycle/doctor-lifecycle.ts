import type { DoctorLifecycleState, LifecycleRecord, LifecycleTransition } from "../types";

const VALID_TRANSITIONS: Record<DoctorLifecycleState, DoctorLifecycleState[]> = {
  discovered: ["imported", "archived"],
  imported: ["normalized", "archived"],
  normalized: ["auto_verified", "archived"],
  auto_verified: ["human_verified", "published", "archived"],
  human_verified: ["published", "updated", "archived"],
  published: ["updated", "archived"],
  updated: ["published", "archived"],
  archived: [],
};

export function createLifecycleRecord(
  initialState: DoctorLifecycleState = "discovered",
  at: string = new Date().toISOString(),
): LifecycleRecord {
  return {
    state: initialState,
    stateChangedAt: at,
    history: [],
  };
}

export function canTransitionLifecycle(
  current: DoctorLifecycleState,
  next: DoctorLifecycleState,
): boolean {
  return VALID_TRANSITIONS[current].includes(next);
}

export function transitionLifecycle(
  record: LifecycleRecord,
  next: DoctorLifecycleState,
  at: string,
  reason?: string,
): LifecycleRecord {
  if (!canTransitionLifecycle(record.state, next)) {
    throw new Error(`Transição inválida de "${record.state}" para "${next}".`);
  }

  const transition: LifecycleTransition = {
    from: record.state,
    to: next,
    at,
    reason,
  };

  return {
    state: next,
    stateChangedAt: at,
    history: [...record.history, transition],
  };
}

export function advanceLifecycleThroughIngestion(
  record: LifecycleRecord,
  at: string,
): LifecycleRecord {
  let current = record;

  if (current.state === "discovered") {
    current = transitionLifecycle(current, "imported", at, "Registro recebido pela ingestão.");
  }

  if (current.state === "imported") {
    current = transitionLifecycle(current, "normalized", at, "Domínio normalizado.");
  }

  return current;
}

export function advanceLifecycleThroughAutoVerification(
  record: LifecycleRecord,
  at: string,
  hasBlockingIssues: boolean,
): LifecycleRecord {
  if (record.state !== "normalized") {
    return record;
  }

  if (hasBlockingIssues) {
    return record;
  }

  return transitionLifecycle(
    record,
    "auto_verified",
    at,
    "Validação automática concluída sem erros bloqueantes.",
  );
}

export function advanceLifecycleToPublished(
  record: LifecycleRecord,
  at: string,
): LifecycleRecord {
  if (record.state === "auto_verified" || record.state === "human_verified") {
    return transitionLifecycle(record, "published", at, "Perfil apto para publicação.");
  }

  if (record.state === "updated") {
    return transitionLifecycle(record, "published", at, "Perfil republicado após atualização.");
  }

  throw new Error(`Estado "${record.state}" não pode ser publicado diretamente.`);
}

export function markLifecycleUpdated(record: LifecycleRecord, at: string): LifecycleRecord {
  if (record.state === "published") {
    return transitionLifecycle(record, "updated", at, "Dados do perfil atualizados.");
  }

  return record;
}
