export type NoteVisibility = "INTERNAL" | "CURATORIA" | "OPERACAO" | "AUDIT";

export interface MemoryNote {
  id: string;
  journeyId: string;
  content: string;
  visibility: NoteVisibility[];
  createdBy: string;
  createdAt: string;
}

export interface AddNoteInput {
  journeyId: string;
  content: string;
  visibility: NoteVisibility[];
  createdBy: string;
}
