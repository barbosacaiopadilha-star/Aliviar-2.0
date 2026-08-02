import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * RELATÓRIO E DEVOLUTIVA — a persistência que faltava.
 *
 * @metodo Ontologia §3.12 — o Relatório nunca contém score interno nem linguagem de ranking
 * @metodo Engine §4.6 — as justificativas de opção e composição são escritas pelo Curador, nunca pelo Motor
 * @metodo Experience §2.5 — a entrega é sempre humana
 *
 * Por que existe: `curadoria_reports`, `curadoria_report_options` e
 * `devolutiva_records` existiam no banco, com RLS, e **nada no código escrevia
 * nelas** — só `cos/repository.ts` lia. Como os critérios de saída da fase
 * RELATORIO leem justamente essas tabelas, a fase era matematicamente
 * inalcançável: nenhum Curador poderia concluí-la por nenhum caminho.
 *
 * Nada aqui inventa conceito nem duplica capacidade: a seleção continua em
 * `curated_selections` (repository.ts, `saveSelection`), e este módulo cuida do
 * documento que nasce dela. As duas coisas são artefatos distintos da Ontologia
 * — a seleção é a escolha; o Relatório é o que o paciente relê sozinho.
 *
 * Nenhuma migração foi necessária: as tabelas e as policies já estavam lá.
 */

export type ReportOptionInput = {
  professionalProfileId: string;
  /** Por que esta opção está na Curadoria. */
  justification: string;
  /** Como ela conversa com os pesos que o paciente validou. */
  relationToWeights: string;
  /** O que esta opção custa. Nunca vazio: opção só com virtudes é recomendação. */
  attentionPoints: string[];
  favorablePoints: string[];
  suggestedQuestions: string[];
  curatorObservations: string | null;
};

/**
 * Cria ou atualiza o Relatório de uma seleção.
 *
 * Idempotente por `curated_selection_id`: reescrever é revisar, nunca duplicar.
 * Um Relatório já entregue não é alterado — corrigir depois da entrega seria
 * mudar o documento que o paciente já tem nas mãos.
 */
export async function saveReport(
  supabase: SupabaseClient,
  caseId: string,
  curatedSelectionId: string,
  compositionRationale: string,
  options: ReportOptionInput[],
): Promise<string> {
  const { data: existing } = await supabase
    .from("curadoria_reports")
    .select("id, delivered_at")
    .eq("curated_selection_id", curatedSelectionId)
    .maybeSingle();

  if (existing?.delivered_at) {
    throw new Error(
      "Este Relatório já foi entregue e não pode mais ser alterado. Para mudar algo, converse com o paciente e registre a correção na Devolutiva.",
    );
  }

  let reportId = existing?.id as string | undefined;

  if (reportId) {
    const { error } = await supabase
      .from("curadoria_reports")
      .update({ composition_rationale: compositionRationale, updated_at: new Date().toISOString() })
      .eq("id", reportId);
    if (error) throw new Error(error.message);

    await supabase.from("curadoria_report_options").delete().eq("report_id", reportId);
  } else {
    const { data, error } = await supabase
      .from("curadoria_reports")
      .insert({
        case_id: caseId,
        curated_selection_id: curatedSelectionId,
        composition_rationale: compositionRationale,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    reportId = data.id as string;
  }

  // A posição é ordem de APRESENTAÇÃO, nunca colocação (Ontologia §3.13).
  const { error: optionsError } = await supabase.from("curadoria_report_options").insert(
    options.map((option, index) => ({
      report_id: reportId,
      professional_profile_id: option.professionalProfileId,
      position: index + 1,
      justification: option.justification,
      relation_to_weights: option.relationToWeights,
      favorable_points: option.favorablePoints,
      attention_points: option.attentionPoints,
      suggested_questions: option.suggestedQuestions,
      curator_observations: option.curatorObservations,
    })),
  );
  if (optionsError) throw new Error(optionsError.message);

  return reportId!;
}

/**
 * O Curador assume a autoria da versão final. Salvar não é aprovar; aprovar
 * é o ato explícito que separa "texto em revisão" de "documento meu". Sem
 * isto, emitir é impossível — o banco recusa (trigger assert_report_lifecycle).
 */
export async function approveReport(
  supabase: SupabaseClient,
  reportId: string,
  approvedBy: string,
): Promise<void> {
  const { error } = await supabase
    .from("curadoria_reports")
    .update({ approved_at: new Date().toISOString(), approved_by: approvedBy, updated_at: new Date().toISOString() })
    .eq("id", reportId);
  if (error) throw new Error(error.message);
}

/** Marca que o Curador tocou no documento — salvar não é aprovar. */
export async function markReportReviewed(
  supabase: SupabaseClient,
  reportId: string,
  reviewedBy: string,
): Promise<void> {
  const { error } = await supabase
    .from("curadoria_reports")
    .update({ reviewed_at: new Date().toISOString(), reviewed_by: reviewedBy, updated_at: new Date().toISOString() })
    .eq("id", reportId);
  if (error) throw new Error(error.message);
}

/**
 * Emite o Relatório — o documento passa a existir como versão fechada.
 *
 * Emitir não é entregar: emitir é o Curador dizer "está pronto"; entregar é o
 * paciente receber. Separados de propósito, porque entre um e outro existe
 * uma conversa a ser combinada. Exige aprovação prévia — um rascunho
 * (assistido ou não) nunca vira documento sem autoria assumida.
 */
export async function emitReport(supabase: SupabaseClient, reportId: string): Promise<void> {
  const { error } = await supabase
    .from("curadoria_reports")
    .update({ emitted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", reportId);
  if (error) throw new Error(error.message);
}

/**
 * Marca o Relatório como entregue, junto da entrega da seleção.
 *
 * BLOCO B: a via de PRODUÇÃO da entrega é a RPC `deliver_curadoria`
 * (deliverSelectionAction) — esta função permanece apenas para cenários de
 * teste que montam a cadeia passo a passo. Ela exige Relatório já emitido
 * (constraint `report_delivery_requires_emission`) e NUNCA toca `emitted_at`:
 * a versão anterior sobrescrevia o carimbo de emissão com o instante da
 * entrega, destruindo o registro real de quando o Curador emitiu (IM-03).
 *
 * BLOCO B.6 (B1, gate B17): a guarda é do BANCO, não desta função — o
 * trigger `enforce_report_delivery_requires_delivered_selection` (migration
 * 20260802154000) recusa gravar `delivered_at` com a seleção fora de
 * DELIVERED. Nem esta função, nem um caller novo de produção, nem PostgREST
 * direto alcançam mais o par invertido (Relatório entregue com seleção não
 * entregue). Por isso ela foi MANTIDA em vez de removida: os testes que a
 * usam entregam a seleção antes (o caminho honesto) e continuam passando; o
 * caminho desonesto agora falha aqui com o erro de domínio do trigger.
 */
export async function markReportDelivered(supabase: SupabaseClient, reportId: string): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("curadoria_reports")
    .update({ delivered_at: now, updated_at: now })
    .eq("id", reportId)
    .is("delivered_at", null);
  if (error) throw new Error(error.message);
}

export async function getReportBySelection(
  supabase: SupabaseClient,
  curatedSelectionId: string,
): Promise<{ id: string; emittedAt: string | null; deliveredAt: string | null } | null> {
  const { data } = await supabase
    .from("curadoria_reports")
    .select("id, emitted_at, delivered_at")
    .eq("curated_selection_id", curatedSelectionId)
    .maybeSingle();

  if (!data) return null;
  return {
    id: data.id as string,
    emittedAt: (data.emitted_at as string | null) ?? null,
    deliveredAt: (data.delivered_at as string | null) ?? null,
  };
}

/**
 * Registra a apresentação — o encontro em que o Curador mostrou as três opções.
 *
 * @metodo Experience §2.5 — a entrega é sempre humana, nunca uma notificação com anexo
 *
 * Isto NÃO é a decisão do paciente: a decisão é ato dele, e a RLS de
 * `patient_curadoria_decisions` só aceita a própria pessoa. Aqui fica o que o
 * Curador viveu no encontro — as dúvidas que ela trouxe, o que ele observou e
 * o que ficou combinado. Nenhum prazo é imposto a ela.
 */
export async function registerDevolutiva(
  supabase: SupabaseClient,
  input: {
    caseId: string;
    reportId: string;
    presentedBy: string;
    patientQuestions: string[];
    observations: string[];
    nextSteps: string[];
  },
): Promise<void> {
  const { data: existing } = await supabase
    .from("devolutiva_records")
    .select("id")
    .eq("report_id", input.reportId)
    .maybeSingle();

  const payload = {
    case_id: input.caseId,
    report_id: input.reportId,
    presented_by: input.presentedBy,
    presented_at: new Date().toISOString(),
    patient_questions: input.patientQuestions,
    observations: input.observations,
    next_steps: input.nextSteps,
    updated_at: new Date().toISOString(),
  };

  const { error } = existing
    ? await supabase.from("devolutiva_records").update(payload).eq("id", existing.id as string)
    : await supabase.from("devolutiva_records").insert(payload);

  if (error) throw new Error(error.message);
}
