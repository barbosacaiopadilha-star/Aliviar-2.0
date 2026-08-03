import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * FACTORY CANÔNICA DO MAPA PARA SEEDS E2E — B-2 (ADR-065).
 *
 * Os seeds de `connection-choice` e `relationship-status` validavam o Perfil
 * sem nunca preencher o Mapa — violação exposta de propósito na remediação
 * (commit "expose current invariant violations"); com as guardas do banco
 * vigentes, a validação é recusada. Esta factory produz o estado LEGÍTIMO
 * mínimo, sem contornar guarda nenhuma:
 *
 *   1. Mapa de Prioridades completo — os 29 conceitos ativos classificados
 *      (RELEVANTE: participa do cruzamento sem dominar a leitura);
 *   2. Bloco relacional respondido — SEM_PREFERENCIA explícito nos conceitos
 *      do eixo MODELO_DE_ATENDIMENTO (o gate do reconhecimento cobra
 *      registro, não conteúdo — ADR-065 §12.2).
 *
 * Espelha `preencherMapaCompleto`/`preencherBlocoRelacional` da suíte de
 * remediação (tests/remediacao/imutabilidade-frente1) — mesma semântica,
 * cliente de sessão em vez de service key.
 */
export async function preencherMapaEBlocoRelacional(
  cliente: SupabaseClient,
  caseId: string,
  declaradoPor: string,
): Promise<void> {
  const { data: conceitos, error } = await cliente
    .from("method_subcriteria")
    .select("id, code, axis")
    .eq("active", true);
  if (error) throw new Error(`catálogo (seed E2E): ${error.message}`);

  const { error: mapError } = await cliente.from("case_priority_map").upsert(
    (conceitos ?? []).map((conceito) => ({
      case_id: caseId,
      subcriterion_id: conceito.id as string,
      importance: "RELEVANTE",
    })),
    { onConflict: "case_id,subcriterion_id" },
  );
  if (mapError) throw new Error(`Mapa completo (seed E2E): ${mapError.message}`);

  const relacionais = (conceitos ?? []).filter((c) => c.axis === "MODELO_DE_ATENDIMENTO");
  const { error: needsError } = await cliente.from("case_needs").upsert(
    relacionais.map((conceito) => ({
      case_id: caseId,
      subcriterion_code: conceito.code as string,
      options: [],
      degree: "SEM_PREFERENCIA",
      origin: "DIRETO",
      acknowledgment: "PENDENTE",
      declared_by: declaradoPor,
    })),
    { onConflict: "case_id,subcriterion_code" },
  );
  if (needsError) throw new Error(`Bloco relacional (seed E2E): ${needsError.message}`);
}
