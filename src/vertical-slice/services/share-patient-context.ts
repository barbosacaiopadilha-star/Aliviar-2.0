import { addNote, appendTimelineEntry, referenceAttachment } from "@/journey-memory";

import type { SharePatientContextInput, SharePatientContextResult } from "../model/share-context-input";
import type { VerticalSliceStack } from "../composition/vertical-slice-stack";
import { PatientSharingMemoryAccess } from "../infrastructure/patient-sharing-memory-access";

export type SharePatientContextError =
  | { code: "FORBIDDEN"; message: string }
  | { code: "DOMAIN_ERROR"; message: string };

export type SharePatientContextServiceResult =
  | { ok: true; value: SharePatientContextResult }
  | { ok: false; error: SharePatientContextError };

function sharingDeps(stack: VerticalSliceStack) {
  const access = new PatientSharingMemoryAccess();
  return {
    noteRepository: stack.memory.noteRepository,
    timelineRepository: stack.memory.timelineRepository,
    attachmentRepository: stack.memory.attachmentRepository,
    access,
    clock: stack.memory.clock,
    idGenerator: stack.memory.idGenerator,
  };
}

export async function sharePatientContext(
  stack: VerticalSliceStack,
  input: SharePatientContextInput,
): Promise<SharePatientContextServiceResult> {
  const hasObservation = Boolean(input.observation?.trim());
  const hasDocument = Boolean(input.document?.name?.trim() && input.document?.where?.trim());
  const hasReference = Boolean(input.reference?.label?.trim() && input.reference?.url?.trim());

  if (!hasObservation && !hasDocument && !hasReference) {
    return {
      ok: false,
      error: { code: "DOMAIN_ERROR", message: "Compartilhe ao menos uma observação, documento ou referência." },
    };
  }

  const deps = sharingDeps(stack);
  let sharedItems = 0;

  if (hasObservation && input.observation) {
    const note = await addNote(deps, {
      journeyId: input.journeyId,
      audience: "PORTAL",
      createdBy: input.actorId,
      content: input.observation,
      visibility: ["CURATORIA"],
    });
    if (!note.ok) return { ok: false, error: { code: "FORBIDDEN", message: note.error.message } };
    sharedItems += 1;
  }

  if (hasDocument && input.document) {
    const doc = await referenceAttachment(deps, {
      journeyId: input.journeyId,
      audience: "PORTAL",
      referencedBy: input.actorId,
      externalRef: input.document.where,
      displayName: input.document.name,
      note: input.document.note,
      category: "DOCUMENTO",
    });
    if (!doc.ok) return { ok: false, error: { code: "FORBIDDEN", message: doc.error.message } };
    sharedItems += 1;
  }

  if (hasReference && input.reference) {
    const ref = await referenceAttachment(deps, {
      journeyId: input.journeyId,
      audience: "PORTAL",
      referencedBy: input.actorId,
      externalRef: input.reference.url,
      displayName: input.reference.label,
      category: "REFERENCIA",
    });
    if (!ref.ok) return { ok: false, error: { code: "FORBIDDEN", message: ref.error.message } };
    sharedItems += 1;
  }

  await appendTimelineEntry(deps, {
    journeyId: input.journeyId,
    audience: "PORTAL",
    actorId: input.actorId,
    kind: "EVENT",
    source: "MEMORY",
    category: "OBSERVATION",
    title: "Contexto compartilhado",
    body: "O paciente trouxe mais elementos para compreender sua história.",
    occurredAt: stack.clock.now(),
  });

  return {
    ok: true,
    value: {
      sharedItems,
      acknowledgement: "Isso ajuda muito. Agora conseguimos ver sua história com mais clareza.",
    },
  };
}
