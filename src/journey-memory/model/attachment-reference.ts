/** Referência a documento externo — nunca armazena conteúdo binário. */
export interface AttachmentReference {
  id: string;
  journeyId: string;
  /** URI, chave de storage ou identificador externo. */
  externalRef: string;
  displayName: string;
  mimeType: string | null;
  category: string | null;
  referencedBy: string;
  referencedAt: string;
  note: string | null;
}

export interface ReferenceAttachmentInput {
  journeyId: string;
  externalRef: string;
  displayName: string;
  mimeType?: string | null;
  category?: string | null;
  referencedBy: string;
  note?: string | null;
}
