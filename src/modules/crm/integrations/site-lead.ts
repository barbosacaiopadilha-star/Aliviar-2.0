import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createContact, createTask } from "../repository";
import type { SiteLeadInput } from "../schema";

export async function ingestSiteLead(
  supabase: SupabaseClient,
  input: SiteLeadInput,
): Promise<{ contactId: string }> {
  if (input.honeypot?.trim()) {
    throw new Error("Requisição rejeitada.");
  }

  if (!input.consentGranted) {
    throw new Error("É necessário consentimento para prosseguir.");
  }

  return createContact(
    supabase,
    {
      fullName: input.fullName,
      phone: input.phone,
      email: input.email,
      city: input.city,
      state: input.state,
      source: "site",
      sourceDetail: "Formulário do site",
      initialReason: input.message,
      consentStatus: "concedido",
      acknowledgeDuplicates: true,
      assignedTo: null,
      priority: "alta",
    },
    // Auditoria de lead externo — sem ator humano autenticado no fluxo público.
    null,
  );
}

export async function createFirstContactTaskForLead(
  supabase: SupabaseClient,
  contactId: string,
  actorId: string,
): Promise<void> {
  const dueAt = new Date();
  dueAt.setHours(dueAt.getHours() + 4);

  await createTask(
    supabase,
    {
      contactId,
      title: "Primeiro contato — lead do site",
      type: "retorno",
      priority: "alta",
      dueAt: dueAt.toISOString(),
    },
    actorId,
  );
}
