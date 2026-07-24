import type {
  ContactResolutionResult,
  InboundMessage,
  MessageDeliveryStatus,
  WhatsAppProvider,
  WhatsAppProviderStatus,
} from "./types";

export class DisabledWhatsAppProvider implements WhatsAppProvider {
  readonly status: WhatsAppProviderStatus = "not_configured";

  async resolveContactByPhone(): Promise<ContactResolutionResult> {
    return { kind: "unresolved" };
  }

  async sendMessage(): Promise<{ externalId: string; status: MessageDeliveryStatus }> {
    throw new Error("Integração WhatsApp não configurada.");
  }

  async handleInboundWebhook(): Promise<InboundMessage[]> {
    return [];
  }
}

export function createWhatsAppProvider(): WhatsAppProvider {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!token) {
    return new DisabledWhatsAppProvider();
  }
  // Futuro: retornar adapter oficial quando credenciais estiverem presentes.
  return new DisabledWhatsAppProvider();
}
