import "server-only";

/**
 * CONTRATO CANÔNICO DE ENTREGA — "existe uma Curadoria validamente entregue
 * para este Case?"
 *
 * @metodo Fundamentos §13 — P14: a seleção dos três é exclusivamente do Curador
 * @metodo Ontologia §3.13 — a ordem é de apresentação, nunca colocação
 * @metodo Engine §11 — Barreira 4: exatamente três, com autoria humana
 *
 * Por que existe: o jusante da Curadoria — Connection, Concierge,
 * Relationship — precisava saber se a entrega aconteceu, e perguntava isso à
 * tabela de entrega do ACE. Enquanto essa fosse a única prova aceita, a
 * Curadoria do Método podia ser entregue ao paciente sem que nada a jusante
 * reconhecesse: o paciente lia as três opções e não tinha como seguir adiante.
 *
 * Este contrato é a única resposta àquela pergunta. Quem está a jusante não
 * conhece — e não deve conhecer — `curated_selections`, `curadoria_reports`,
 * P008, P009, P010, nem o ACE. Conhece o Case, as três opções, quando foi
 * entregue e de onde veio.
 *
 * O que nunca faz: decidir, selecionar, reordenar, ou combinar opções de duas
 * origens diferentes.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * De onde veio a entrega reconhecida.
 *
 * `ACE_LEGADO` existe apenas pela janela de compatibilidade: casos entregues
 * antes desta mudança continuam válidos e não são reescritos. Nenhuma entrega
 * nova nasce por esse caminho.
 */
export type DeliverySource = "METODO" | "ACE_LEGADO";

export type DeliveredOption = {
  readonly professionalProfileId: string;
  /** Ordem de apresentação, 1 a 3. Nunca colocação. */
  readonly position: number;
};

export type DeliveredCuradoria = {
  readonly caseId: string;
  readonly deliveredAt: string;
  readonly source: DeliverySource;
  readonly version: number;
  /** Exatamente três. Menos que isso não é entrega. */
  readonly options: readonly DeliveredOption[];
  /** Quais registros sustentam esta entrega — para auditoria, não para lógica. */
  readonly provenance: Readonly<Record<string, string>>;
  /**
   * O que a Connection precisa citar para nascer desta entrega.
   *
   * Tipada como união porque as duas fontes ancoram em registros diferentes, e
   * quem consome não deve descobrir isso lendo um `id` solto. O caminho
   * canônico ancora no Relatório; o legado, no registro histórico do motor
   * antigo. Nunca as duas.
   */
  readonly anchor: ConnectionAnchor;
};

/** Onde a Connection se prende. Uma fonte, sempre exatamente uma. */
export type ConnectionAnchor =
  | { readonly source: "METODO"; readonly reportId: string }
  | { readonly source: "ACE_LEGADO"; readonly finalDeliveryId: string };

/** Barreira 4 do Motor: entrega é sempre de três opções distintas. */
function hasThreeDistinctOptions(options: readonly DeliveredOption[]): boolean {
  if (options.length !== 3) return false;
  return new Set(options.map((option) => option.professionalProfileId)).size === 3;
}

/**
 * A entrega do Método: Relatório entregue, sobre uma seleção entregue, com as
 * três opções.
 *
 * Cada condição abaixo recusa um estado que parece entrega e não é. Um
 * rascunho de seleção não habilita nada. Um Relatório emitido e não entregue
 * também não — emitir é fechar o documento, entregar é dar acesso à pessoa, e
 * o jusante só existe depois do segundo.
 */
async function findMethodDelivery(
  supabase: SupabaseClient,
  caseId: string,
): Promise<DeliveredCuradoria | null> {
  const { data: selection } = await supabase
    .from("curated_selections")
    .select("id, case_id, status, delivered_at")
    .eq("case_id", caseId)
    .eq("status", "DELIVERED")
    .maybeSingle();

  if (!selection?.delivered_at) return null;

  const { data: report } = await supabase
    .from("curadoria_reports")
    .select("id, case_id, emitted_at, delivered_at")
    .eq("curated_selection_id", selection.id as string)
    .maybeSingle();

  // `emitted_at` é verificado explicitamente mesmo havendo constraint no banco:
  // a regra de negócio não deve depender de o leitor conhecer o schema.
  if (!report?.delivered_at || !report.emitted_at) return null;

  // Uma entrega jamais vale para outro Case, ainda que os registros existam.
  if ((report.case_id as string) !== caseId) return null;

  const { data: optionRows } = await supabase
    .from("curadoria_report_options")
    .select("professional_profile_id, position")
    .eq("report_id", report.id as string)
    .order("position");

  const options: DeliveredOption[] = (optionRows ?? []).map((row) => ({
    professionalProfileId: row.professional_profile_id as string,
    position: row.position as number,
  }));

  if (!hasThreeDistinctOptions(options)) return null;

  return {
    caseId,
    deliveredAt: report.delivered_at as string,
    source: "METODO",
    version: 1,
    options,
    provenance: {
      curatedSelectionId: selection.id as string,
      reportId: report.id as string,
    },
    anchor: { source: "METODO", reportId: report.id as string },
  };
}

/**
 * A entrega legada do ACE — reconhecida somente quando não existe entrega do
 * Método para o mesmo Case.
 *
 * Lê a tabela diretamente, sem passar pelo repositório do ACE: reconhecer um
 * registro histórico não deve arrastar o P010, o modelo de linguagem nem a
 * cadeia de artefatos para o caminho quente do Concierge.
 */
async function findLegacyAceDelivery(
  supabase: SupabaseClient,
  caseId: string,
): Promise<DeliveredCuradoria | null> {
  const { data } = await supabase
    .from("final_curadoria_deliveries")
    .select("id, case_id, delivered_at, provider_presentations, version")
    .eq("case_id", caseId)
    .maybeSingle();

  if (!data?.delivered_at) return null;

  const presentations = (data.provider_presentations ?? []) as Array<{ providerId?: string }>;
  const options: DeliveredOption[] = presentations
    .map((presentation, index) => ({
      professionalProfileId: presentation.providerId ?? "",
      position: index + 1,
    }))
    .filter((option) => option.professionalProfileId !== "");

  if (!hasThreeDistinctOptions(options)) return null;

  return {
    caseId,
    deliveredAt: data.delivered_at as string,
    source: "ACE_LEGADO",
    version: (data.version as number) ?? 1,
    options,
    provenance: { finalCuradoriaDeliveryId: data.id as string },
    anchor: { source: "ACE_LEGADO", finalDeliveryId: data.id as string },
  };
}

/**
 * A única pergunta que o jusante faz.
 *
 * Precedência explícita: a entrega do Método vence sempre. A legada só é
 * consultada quando não existe entrega canônica para o Case — nunca as duas,
 * nunca opções misturadas. Um Case tem no máximo uma entrega reconhecida, e
 * portanto no máximo uma Connection possível.
 */
export async function findDeliveredCuradoria(
  supabase: SupabaseClient,
  caseId: string,
): Promise<DeliveredCuradoria | null> {
  const canonical = await findMethodDelivery(supabase, caseId);
  if (canonical) return canonical;

  return findLegacyAceDelivery(supabase, caseId);
}

/**
 * A mesma pergunta, para quem só precisa do sim ou não.
 *
 * Existe porque um quadro de acompanhamento quer saber se o Case foi entregue,
 * não quem são os três nem de onde veio a entrega. Delega para a mesma
 * verificação — as regras de entrega válida moram num lugar só, e quem só
 * precisa do booleano não fica tentado a reimplementá-las com um `select` mais
 * curto.
 */
export async function hasDeliveredCuradoria(
  supabase: SupabaseClient,
  caseId: string,
): Promise<boolean> {
  // Vai ao banco em vez de reusar `findDeliveredCuradoria` de propósito: aquela
  // função lê o conteúdo da Curadoria e, portanto, responde conforme a RLS de
  // quem pergunta. Quem acompanha um Case precisa saber que houve entrega sem
  // ter acesso às três opções, aos critérios ou ao texto do Relatório — e é
  // isso que `case_has_delivered_curadoria` isola. As regras de entrega válida
  // continuam num lugar só: a função do banco reusa `canonical_delivery_matches`.
  const { data, error } = await supabase
    .schema("curadoria")
    .rpc("case_has_delivered_curadoria", { _case_id: caseId });

  if (error) return false;
  return data === true;
}

/** Os profissionais que o paciente pode escolher — e nenhum outro. */
export function eligibleProfessionalProfileIds(
  delivery: DeliveredCuradoria,
): readonly string[] {
  return delivery.options.map((option) => option.professionalProfileId);
}
