import { createHash, timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

import { registrarErro } from "@/lib/observability/erros";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { ingestSiteLead } from "@/modules/crm/integrations/site-lead";
import { siteLeadInputSchema } from "@/modules/crm/schema";

// FUN-01 / SEG-05 (gate D20): o segredo é obrigatório em TODO ambiente —
// acabou o "só em produção". Sem CRM_SITE_LEAD_SECRET configurado, o endpoint
// responde 503 sempre: um ambiente sem segredo é um endpoint indisponível,
// nunca um endpoint aberto. Local/testes recebem um valor de teste por env
// injetada (scripts/with-local-supabase.mjs); ver .env.example.
//
// Rate-limit NÃO entra aqui de propósito: pertence ao Bloco I/H (infra de
// borda), registrado no relatório da FRENTE D2 — este handler cuida só de
// autenticação do integrador e rastreabilidade.

/**
 * Comparação em tempo constante (SEG-05, item timing): os dois lados passam
 * por SHA-256 antes do `timingSafeEqual`, que exige buffers do mesmo tamanho
 * — o hash iguala os comprimentos sem vazar o tamanho do segredo real pela
 * própria recusa, e a comparação nunca curto-circuita byte a byte.
 */
function segredoConfere(fornecido: string, esperado: string): boolean {
  const hashFornecido = createHash("sha256").update(fornecido).digest();
  const hashEsperado = createHash("sha256").update(esperado).digest();
  return timingSafeEqual(hashFornecido, hashEsperado);
}

export async function POST(request: Request) {
  const secret = process.env.CRM_SITE_LEAD_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Endpoint indisponível." }, { status: 503 });
  }

  const provided = request.headers.get("x-crm-lead-secret");
  if (!provided || !segredoConfere(provided, secret)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const parsed = siteLeadInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos." }, { status: 400 });
  }

  try {
    const supabase = createAdminSupabaseClient();
    // O rastro de sucesso já existe no domínio: createContact grava
    // `contact_created` em crm_audit_log (actor nulo = escrita de sistema) —
    // nenhuma contagem nova é inventada aqui.
    const created = await ingestSiteLead(supabase, parsed.data);
    return NextResponse.json({ success: true, contactId: created.contactId }, { status: 201 });
  } catch (error) {
    // Nunca a mensagem crua da exceção (SEG-05): o detalhe completo vai para
    // o log do servidor com referência curta; a resposta carrega só a
    // referência.
    const referencia = registrarErro("crm.leads.ingestao", error, {
      origem: "site",
    });
    return NextResponse.json(
      { error: `Não foi possível registrar o lead. (ref. ${referencia})` },
      { status: 500 },
    );
  }
}
