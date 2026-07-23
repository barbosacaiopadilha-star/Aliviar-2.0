import { attachmentReferencedEvent, timelineAppendedEvent } from "../events/memory-events";
import type { AttachmentReference, ReferenceAttachmentInput } from "../model/attachment-reference";
import type { MemoryAudience } from "../model/memory-audience";
import type {
  ClockPort,
  AttachmentReferenceRepositoryPort,
  IdGeneratorPort,
  MemoryAccessPort,
  TimelineEntryRepositoryPort,
} from "../ports/journey-memory-ports";
import type { JourneyMemoryServiceResult } from "./build-journey-memory";

export interface ReferenceAttachmentServiceInput extends ReferenceAttachmentInput {
  audience: MemoryAudience;
}

export interface ReferenceAttachmentDependencies {
  attachmentRepository: AttachmentReferenceRepositoryPort;
  timelineRepository: TimelineEntryRepositoryPort;
  access: MemoryAccessPort;
  clock: ClockPort;
  idGenerator: IdGeneratorPort;
}

export async function referenceAttachment(
  deps: ReferenceAttachmentDependencies,
  input: ReferenceAttachmentServiceInput,
): Promise<JourneyMemoryServiceResult<AttachmentReference>> {
  const allowed = await deps.access.canWrite(input.journeyId, input.audience, input.referencedBy);
  if (!allowed) {
    return {
      ok: false,
      error: { code: "FORBIDDEN", message: "Sem permissão para referenciar documento." },
    };
  }

  if (!input.externalRef.trim() || !input.displayName.trim()) {
    return {
      ok: false,
      error: { code: "DOMAIN_ERROR", message: "Referência e nome do documento são obrigatórios." },
    };
  }

  const referencedAt = deps.clock.now();
  const reference: AttachmentReference = {
    id: deps.idGenerator.nextId(),
    journeyId: input.journeyId,
    externalRef: input.externalRef.trim(),
    displayName: input.displayName.trim(),
    mimeType: input.mimeType ?? null,
    category: input.category ?? null,
    referencedBy: input.referencedBy,
    referencedAt,
    note: input.note?.trim() ?? null,
  };

  const saved = await deps.attachmentRepository.save(reference);

  const timelineEntry = await deps.timelineRepository.append(
    {
      journeyId: input.journeyId,
      kind: "ATTACHMENT",
      source: "MEMORY",
      title: "Documento referenciado",
      body: saved.displayName,
      occurredAt: referencedAt,
      actorId: input.referencedBy,
      originId: saved.id,
    },
    referencedAt,
    deps.idGenerator.nextId(),
  );

  void attachmentReferencedEvent(input.journeyId, saved.id, referencedAt);
  void timelineAppendedEvent(input.journeyId, timelineEntry.id, referencedAt);

  return { ok: true, value: saved };
}
