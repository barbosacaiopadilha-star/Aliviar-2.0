import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { POST } from "@/app/api/crm/leads/route";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

/**
 * FRENTE D2 — ampliação do gate D20 (FUN-01/SEG-05): o gate da suíte de
 * remediação prova só que `/api/crm/leads` é rota pública; ESTE arquivo prova
 * o comportamento do endpoint em si, chamando o handler real (importado
 * direto — padrão viável no Vitest; um fetch exigiria um `next` servindo).
 *
 * Contrato certificado:
 *   - segredo obrigatório em TODO ambiente: sem CRM_SITE_LEAD_SECRET → 503;
 *   - sem header ou com segredo errado → 401, nada é gravado;
 *   - com o segredo → 201 e o contato nasce em crm_contacts, com o rastro
 *     `contact_created` em crm_audit_log (actor nulo = escrita de sistema);
 *   - erro interno → 500 genérico com referência, NUNCA a mensagem crua.
 *
 * O segredo de teste chega por env injetada (scripts/with-local-supabase.mjs);
 * o fallback abaixo cobre execuções diretas do vitest sem o runner.
 */

const SEGREDO_DE_TESTE = "segredo-local-de-teste-crm-leads";

function leadValido(email: string) {
  return {
    fullName: "Lead Do Site Teste D20",
    email,
    phone: "+55 11 90000-0000",
    city: "São Paulo",
    state: "SP",
    message: "Mensagem de teste do endpoint público de leads.",
    consentGranted: true,
  };
}

function requisicao(body: unknown, headers: Record<string, string> = {}): Request {
  return new Request("http://127.0.0.1/api/crm/leads", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

const contatosCriados: string[] = [];

beforeAll(() => {
  process.env.CRM_SITE_LEAD_SECRET ??= SEGREDO_DE_TESTE;
});

afterAll(async () => {
  // A limpeza automática da suíte não inventaria crm_contacts — o que este
  // arquivo cria, ele mesmo devolve (auditoria primeiro: aponta o contato).
  if (contatosCriados.length === 0) return;
  const admin = createAdminSupabaseClient();
  await admin.from("crm_audit_log").delete().in("entity_id", contatosCriados);
  await admin.from("crm_contacts").delete().in("id", contatosCriados);
});

describe("POST /api/crm/leads — segredo obrigatório em todo ambiente", () => {
  it("sem CRM_SITE_LEAD_SECRET configurado responde 503 sempre — nunca endpoint aberto", async () => {
    const original = process.env.CRM_SITE_LEAD_SECRET;
    delete process.env.CRM_SITE_LEAD_SECRET;
    try {
      const resposta = await POST(
        requisicao(leadValido("d20.sem-segredo@aliviar-teste.local"), {
          "x-crm-lead-secret": SEGREDO_DE_TESTE,
        }),
      );
      expect(resposta.status).toBe(503);
    } finally {
      process.env.CRM_SITE_LEAD_SECRET = original;
    }
  });

  it("sem o header do segredo responde 401 e não grava nada", async () => {
    const email = `d20.sem-header.${randomUUID()}@aliviar-teste.local`;
    const resposta = await POST(requisicao(leadValido(email)));
    expect(resposta.status).toBe(401);

    const admin = createAdminSupabaseClient();
    const { count, error } = await admin
      .from("crm_contacts")
      .select("*", { count: "exact", head: true })
      .eq("email", email);
    expect(error).toBeNull();
    expect(count).toBe(0);
  });

  it("com segredo errado (inclusive de outro tamanho) responde 401", async () => {
    const errado = await POST(
      requisicao(leadValido("d20.errado@aliviar-teste.local"), {
        "x-crm-lead-secret": `${process.env.CRM_SITE_LEAD_SECRET}-alterado`,
      }),
    );
    expect(errado.status).toBe(401);

    const curto = await POST(
      requisicao(leadValido("d20.curto@aliviar-teste.local"), { "x-crm-lead-secret": "x" }),
    );
    expect(curto.status).toBe(401);
  });
});

describe("POST /api/crm/leads — ingestão com o segredo correto", () => {
  it("responde 201, cria o contato e deixa o rastro de auditoria da ingestão", async () => {
    const email = `d20.sucesso.${randomUUID()}@aliviar-teste.local`;
    const resposta = await POST(
      requisicao(leadValido(email), { "x-crm-lead-secret": process.env.CRM_SITE_LEAD_SECRET! }),
    );
    expect(resposta.status).toBe(201);

    const corpo = (await resposta.json()) as { success: boolean; contactId: string };
    expect(corpo.success).toBe(true);
    expect(corpo.contactId).toMatch(/^[0-9a-f-]{36}$/);
    contatosCriados.push(corpo.contactId);

    const admin = createAdminSupabaseClient();
    const contato = await admin
      .from("crm_contacts")
      .select("id, full_name, email, source, pipeline_stage, consent_status")
      .eq("id", corpo.contactId)
      .maybeSingle();
    expect(contato.error).toBeNull();
    expect(contato.data).toMatchObject({
      email,
      source: "site",
      pipeline_stage: "new_contact",
      consent_status: "concedido",
    });

    // Rastro mínimo de ingestão: o próprio domínio grava contact_created com
    // actor nulo (escrita de sistema) — o endpoint não inventa contagem nova.
    const rastro = await admin
      .from("crm_audit_log")
      .select("action, actor_id")
      .eq("entity_id", corpo.contactId)
      .eq("action", "contact_created")
      .maybeSingle();
    expect(rastro.error).toBeNull();
    expect(rastro.data).toMatchObject({ action: "contact_created", actor_id: null });
  });
});

describe("POST /api/crm/leads — erro interno nunca vaza detalhe técnico", () => {
  it("falha de infraestrutura responde 500 genérico com referência, sem a mensagem crua", async () => {
    // Sem a service role, createAdminSupabaseClient lança com uma mensagem
    // que cita nomes de variáveis de ambiente — exatamente o que NÃO pode
    // chegar ao integrador externo.
    const original = process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    try {
      const resposta = await POST(
        requisicao(leadValido("d20.erro-interno@aliviar-teste.local"), {
          "x-crm-lead-secret": process.env.CRM_SITE_LEAD_SECRET!,
        }),
      );
      expect(resposta.status).toBe(500);

      const corpo = (await resposta.json()) as { error: string };
      expect(corpo.error).toContain("ref. ERR-");
      expect(corpo.error).not.toMatch(/SUPABASE|SERVICE_ROLE|obrigatórias/i);
    } finally {
      process.env.SUPABASE_SERVICE_ROLE_KEY = original;
    }
  });
});
