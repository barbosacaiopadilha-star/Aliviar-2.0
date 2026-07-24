// Contrato de integração WhatsApp — adapter desativado até credenciais oficiais.

export type MessageDeliveryStatus = "queued" | "sent" | "delivered" | "read" | "failed";

export type InboundMessage = {
  externalId: string;
  fromPhone: string;
  body: string;
  receivedAt: string;
  mediaUrls?: string[];
};

export type OutboundMessage = {
  toPhone: string;
  body: string;
  templateName?: string;
};

export type ContactResolutionResult =
  | { kind: "matched"; contactId: string }
  | { kind: "created"; contactId: string }
  | { kind: "ambiguous"; candidates: string[] }
  | { kind: "unresolved" };

export type WhatsAppProviderStatus = "not_configured" | "pending" | "connected" | "error";

export interface WhatsAppProvider {
  readonly status: WhatsAppProviderStatus;
  resolveContactByPhone(phone: string): Promise<ContactResolutionResult>;
  sendMessage(message: OutboundMessage): Promise<{ externalId: string; status: MessageDeliveryStatus }>;
  handleInboundWebhook(payload: unknown): Promise<InboundMessage[]>;
}

export const WHATSAPP_ENV_VARS = [
  "WHATSAPP_BUSINESS_ACCOUNT_ID",
  "WHATSAPP_PHONE_NUMBER_ID",
  "WHATSAPP_ACCESS_TOKEN",
  "WHATSAPP_WEBHOOK_VERIFY_TOKEN",
  "WHATSAPP_API_BASE_URL",
] as const;
