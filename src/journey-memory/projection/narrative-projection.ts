import type { AttachmentReference } from "../model/attachment-reference";
import type { MemoryAudience } from "../model/memory-audience";
import type { JourneyMemory } from "../model/journey-memory";
import type { NoteVisibility } from "../model/memory-note";
import type { MemoryTimelineEntry } from "../model/memory-timeline-entry";
import type { CommitmentsViewItem } from "./commitments-view";

export type NarrativeProvenance = "timeline" | "note" | "attachment" | "commitment";

export interface NarrativeSegment {
  id: string;
  occurredAt: string;
  headline: string;
  body: string | null;
  tags: string[];
  provenance: NarrativeProvenance;
  actorId?: string;
}

export interface AttachmentReferenceSummary {
  id: string;
  displayName: string;
  externalRef: string;
  referencedAt: string;
}

export interface NarrativeProjection {
  journeyId: string;
  audience: MemoryAudience;
  title: string;
  summary: string;
  segments: NarrativeSegment[];
  openCommitments: CommitmentsViewItem[];
  referencedAttachments: AttachmentReferenceSummary[];
  generatedAt: string;
}

const PORTAL_CATEGORIES = new Set([
  "JOURNEY",
  "CONTACT",
  "CONSULTATION",
  "EXAM",
  "DOCUMENT",
  "DECISION",
]);

const OPERATIONAL_CATEGORIES = new Set([
  "JOURNEY",
  "CONTACT",
  "CONSULTATION",
  "EXAM",
  "DOCUMENT",
  "DECISION",
  "OPERATIONAL",
]);

function noteVisibleToAudience(visibility: NoteVisibility[], audience: MemoryAudience): boolean {
  if (audience === "GOVERNANCA") return true;
  if (audience === "CURATORIA") {
    return visibility.some((v) => v === "CURATORIA" || v === "INTERNAL");
  }
  if (audience === "OPERACAO") {
    return visibility.some((v) => v === "OPERACAO" || v === "INTERNAL");
  }
  return false;
}

function timelineVisible(entry: MemoryTimelineEntry, audience: MemoryAudience): boolean {
  if (audience === "GOVERNANCA" || audience === "CURATORIA") return true;
  if (audience === "OPERACAO") {
    return entry.category === null || OPERATIONAL_CATEGORIES.has(entry.category);
  }
  if (audience === "PORTAL") {
    if (entry.kind === "NOTE" || entry.kind === "COMMITMENT") return false;
    return entry.category === null || PORTAL_CATEGORIES.has(entry.category);
  }
  return false;
}

function timelineToSegment(entry: MemoryTimelineEntry, audience: MemoryAudience): NarrativeSegment {
  return {
    id: entry.id,
    occurredAt: entry.occurredAt,
    headline: entry.title,
    body: entry.body,
    tags: [entry.kind, ...(entry.category ? [entry.category] : [])],
    provenance: "timeline",
    actorId: audience === "GOVERNANCA" ? entry.actorId : undefined,
  };
}

function noteToSegment(note: { id: string; content: string; createdAt: string; createdBy: string }, audience: MemoryAudience): NarrativeSegment {
  return {
    id: note.id,
    occurredAt: note.createdAt,
    headline: "Nota registrada",
    body: note.content,
    tags: ["note"],
    provenance: "note",
    actorId: audience === "GOVERNANCA" ? note.createdBy : undefined,
  };
}

function attachmentToSegment(ref: AttachmentReference, audience: MemoryAudience): NarrativeSegment {
  const body =
    audience === "GOVERNANCA"
      ? `${ref.displayName} (${ref.externalRef})`
      : ref.displayName;

  return {
    id: ref.id,
    occurredAt: ref.referencedAt,
    headline: "Documento referenciado",
    body,
    tags: ["attachment", ...(ref.category ? [ref.category] : [])],
    provenance: "attachment",
    actorId: audience === "GOVERNANCA" ? ref.referencedBy : undefined,
  };
}

function buildSummary(memory: JourneyMemory, audience: MemoryAudience): string {
  const eventCount = memory.timeline.filter((e) => timelineVisible(e, audience)).length;
  const noteCount = memory.notes.filter((n) => noteVisibleToAudience(n.visibility, audience)).length;
  const attachmentCount = memory.attachmentReferences.length;
  const openCount = memory.commitments.open.length;

  const parts = [`${eventCount} evento(s) na linha do tempo`];
  if (noteCount > 0) parts.push(`${noteCount} nota(s)`);
  if (attachmentCount > 0 && audience !== "PORTAL") {
    parts.push(`${attachmentCount} referência(s) documental`);
  }
  if (openCount > 0 && audience !== "PORTAL") {
    parts.push(`${openCount} compromisso(s) em aberto`);
  }

  return parts.join(" · ");
}

export function projectNarrative(
  memory: JourneyMemory,
  audience: MemoryAudience,
  generatedAt: string,
): NarrativeProjection {
  const timelineSegments = memory.timeline
    .filter((entry) => timelineVisible(entry, audience))
    .map((entry) => timelineToSegment(entry, audience));

  const noteSegments = memory.notes
    .filter((note) => noteVisibleToAudience(note.visibility, audience))
    .map((note) => noteToSegment(note, audience));

  const attachmentSegments =
    audience === "PORTAL"
      ? []
      : memory.attachmentReferences.map((ref) => attachmentToSegment(ref, audience));

  const segments = [...timelineSegments, ...noteSegments, ...attachmentSegments].sort(
    (a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime(),
  );

  const openCommitments =
    audience === "PORTAL" ? [] : memory.commitments.open;

  const referencedAttachments: AttachmentReferenceSummary[] =
    audience === "PORTAL"
      ? []
      : memory.attachmentReferences.map((ref) => ({
          id: ref.id,
          displayName: ref.displayName,
          externalRef: audience === "GOVERNANCA" ? ref.externalRef : "[referência]",
          referencedAt: ref.referencedAt,
        }));

  return {
    journeyId: memory.journeyId,
    audience,
    title: `História da jornada`,
    summary: buildSummary(memory, audience),
    segments,
    openCommitments,
    referencedAttachments,
    generatedAt,
  };
}
