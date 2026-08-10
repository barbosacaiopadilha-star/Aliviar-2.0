import type { SupabaseClient } from "@supabase/supabase-js";

import type { FatosDoCaso } from "@/foundation/contrato-de-estado";
import type { StoryStatus } from "@/modules/story/types";

/**
 * TRILHA A · os fatos da paciente, lidos uma vez e entregues à Fundação.
 *
 * A Home tinha motor próprio de macroestado (`derivePatientHomeState`) que não
 * sabia nada sobre entrega, emissão ou cancelamento: havendo Caso dizia *"seu
 * cuidado está em andamento"*; não havendo, caía em *"conte sua história"* —
 * mesmo com a Curadoria entregue. É o defeito que a auditoria registrou, e é
 * dele que este módulo tira a Home.
 *
 * Aqui não se interpreta nada. Lê-se **coluna real** e monta-se o input do
 * contrato congelado, que é quem decide:
 *
 * | fato | origem real | RLS |
 * |---|---|---|
 * | história existe / enviada | histórias que a página já carrega | do próprio perfil |
 * | Caso encerrado | `cases.closed_at` | `cases_select_paciente` |
 * | Caso cancelado | `cases.status = 'CANCELLED'` | idem |
 * | Caso assumido | `cases.assigned_curator_id` | idem |
 * | Curadoria entregue | contrato de leitura da paciente | só devolve com `delivered_at` |
 *
 * **Por que ler `cases` direto, e não a view.** `patient_case_overview` expõe
 * apenas `case_id`, `status_label` e `updated_at`; ampliá-la seria migration.
 * A política `cases_select_paciente` (`is_patient_for_case(id)`) já autoriza a
 * paciente a ler a própria linha — o fato existe, é dela, e não precisou de
 * nada novo. **Sem service role: a leitura passa pela sessão dela e pela RLS.**
 */

/** O que a página já tem em mãos antes de consultar o Caso. */
export type EntradaDeFatos = {
  /** `null` = não carregamos, e isso não autoriza dizer que não há história. */
  storyStatuses: readonly StoryStatus[] | null;
  caseId: string | null;
  /**
   * Do contrato de leitura da paciente: **não-nulo ⟹ entregue**. Ele já se
   * recusa a devolver Curadoria sem `delivered_at`, então serve de prova.
   */
  curadoriaEntregueEm: string | null;
};

/** Só o que a Fundação precisa saber do Caso. Nada além desce para a UI. */
type LinhaDoCaso = {
  status: string;
  closed_at: string | null;
  assigned_curator_id: string | null;
};

export async function lerFatosDoCaso(
  supabase: SupabaseClient,
  entrada: EntradaDeFatos,
): Promise<FatosDoCaso> {
  const historia = fatoDaHistoria(entrada.storyStatuses);
  const relatorio = entrada.curadoriaEntregueEm
    ? { existe: true, emitidoEm: null, entregueEm: entrada.curadoriaEntregueEm }
    : null;

  if (!entrada.caseId) {
    return { historia, caso: null, relatorio, pendencia: null };
  }

  const { data, error } = await supabase
    .from("cases")
    .select("status, closed_at, assigned_curator_id")
    .eq("id", entrada.caseId)
    .maybeSingle<LinhaDoCaso>();

  if (error || !data) {
    // Leitura falhou ou a RLS recusou: não sabemos o estado do Caso. `null` é
    // a resposta honesta, e o contrato devolve fallback seguro a partir dela.
    return { historia, caso: null, relatorio, pendencia: null };
  }

  return {
    historia,
    caso: {
      curadorResponsavel: data.assigned_curator_id,
      encerradoEm: data.closed_at,
      // Fato do estado real — nunca inferido de `closed_at`, que o gatilho
      // grava tanto para CLOSED quanto para CANCELLED.
      cancelado: data.status === "CANCELLED",
    },
    relatorio,
    // Pendência estruturada com destinatário ainda não existe no domínio.
    // `null` = não sabemos, que é diferente de "não há". GAP registrado.
    pendencia: null,
  };
}

function fatoDaHistoria(statuses: readonly StoryStatus[] | null): FatosDoCaso["historia"] {
  if (statuses === null) return null;
  // O contrato só pergunta SE foi enviada; a data exata não muda o estado.
  if (statuses.includes("enviada")) return { existe: true, enviadaEm: "enviada" };
  if (statuses.includes("rascunho")) return { existe: true, enviadaEm: null };
  return { existe: false, enviadaEm: null };
}
