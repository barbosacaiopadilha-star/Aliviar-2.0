import type { AttachmentReference } from "@/journey-memory/model/attachment-reference";
import type { MemoryNote } from "@/journey-memory/model/memory-note";
import type { MemoryTimelineEntry } from "@/journey-memory/model/memory-timeline-entry";

import type {
  ContextHistoryEntry,
  ContextOrganizationGroup,
  SharedContextItemView,
} from "../model/compartilhar-contexto-view";
import { STORY_RECEPTION_CURADORIA_TITLE, STORY_RECEPTION_PORTAL_TITLE, CURADORIA_READY_TITLE, CURADORIA_STARTED_PORTAL_TITLE } from "../labels";

function isDocumentRef(ref: AttachmentReference): boolean {
  return ref.category === "DOCUMENTO" || Boolean(ref.mimeType);
}

function isReferenceRef(ref: AttachmentReference): boolean {
  return ref.category === "REFERENCIA" || ref.externalRef.startsWith("http");
}

export function organizeSharedContext(
  notes: MemoryNote[],
  attachments: AttachmentReference[],
): ContextOrganizationGroup[] {
  const documentos: SharedContextItemView[] = attachments
    .filter(isDocumentRef)
    .map((ref) => ({
      id: ref.id,
      label: ref.displayName,
      detail: ref.note,
      sharedAt: ref.referencedAt,
    }));

  const referencias: SharedContextItemView[] = attachments
    .filter((ref) => !isDocumentRef(ref) && isReferenceRef(ref))
    .map((ref) => ({
      id: ref.id,
      label: ref.displayName,
      detail: ref.externalRef,
      sharedAt: ref.referencedAt,
    }));

  const observacoes: SharedContextItemView[] = notes.map((note) => ({
    id: note.id,
    label: "Observação",
    detail: note.content,
    sharedAt: note.createdAt,
  }));

  return [
    { title: "Documentos", items: documentos },
    { title: "Referências", items: referencias },
    { title: "Observações", items: observacoes },
  ].filter((group) => group.items.length > 0);
}

export function buildContextHistory(
  timeline: MemoryTimelineEntry[],
  notes: MemoryNote[],
  attachments: AttachmentReference[],
): ContextHistoryEntry[] {
  const fromTimeline = timeline
    .filter((entry) => entry.kind === "NOTE" || entry.kind === "ATTACHMENT" || entry.title.includes("Contexto"))
    .map((entry) => ({
      id: entry.id,
      headline: entry.title,
      occurredAt: entry.occurredAt,
    }));

  const fromNotes = notes.map((note) => ({
    id: note.id,
    headline: "Observação compartilhada",
    occurredAt: note.createdAt,
  }));

  const fromAttachments = attachments.map((ref) => ({
    id: ref.id,
    headline: `Referência: ${ref.displayName}`,
    occurredAt: ref.referencedAt,
  }));

  return [...fromTimeline, ...fromNotes, ...fromAttachments]
    .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());
}

export function hasStoryReceptionConfirmed(timeline: MemoryTimelineEntry[]): boolean {
  return timeline.some((entry) => entry.title === STORY_RECEPTION_PORTAL_TITLE);
}

export function hasNovoContextoParaCuradoria(timeline: MemoryTimelineEntry[]): boolean {
  return timeline.some((entry) => entry.title === STORY_RECEPTION_CURADORIA_TITLE);
}

export function hasCuradoriaIniciada(timeline: MemoryTimelineEntry[]): boolean {
  return timeline.some((entry) => entry.title === CURADORIA_STARTED_PORTAL_TITLE);
}

export function hasCasoProntoParaAnalise(timeline: MemoryTimelineEntry[]): boolean {
  return timeline.some((entry) => entry.title === CURADORIA_READY_TITLE);
}

export function countSharedItems(groups: ContextOrganizationGroup[]): number {
  return groups.reduce((total, group) => total + group.items.length, 0);
}
