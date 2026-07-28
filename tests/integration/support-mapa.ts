import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Completa o Mapa de Prioridades de um Case — ADR-042.
 *
 * Por que as fixtures precisam disto agora: o reconhecimento do Perfil deixou
 * de depender da soma de 100 pontos em `priority_weights` e passou a depender
 * da completude do `case_priority_map`. Fixture que só distribuía pontos e
 * chamava a validação passava a bater no gate novo — que é exatamente o
 * comportamento desejado, e é por isso que a fixture é que muda, não o gate.
 *
 * O nível usado é irrelevante para estes testes: o que o gate exige é que
 * TODO subcritério ativo tenha sido classificado, não qual nível recebeu.
 */
export async function completarMapaDePrioridades(
  client: SupabaseClient,
  priorityProfileId: string,
): Promise<void> {
  const { data: perfil, error: erroPerfil } = await client
    .from("priority_profiles")
    .select("case_id")
    .eq("id", priorityProfileId)
    .single();

  if (erroPerfil) throw new Error(`Perfil não encontrado: ${erroPerfil.message}`);

  const { data: subcriterios, error: erroCatalogo } = await client
    .from("method_subcriteria")
    .select("id")
    .eq("active", true);

  if (erroCatalogo) throw new Error(`Catálogo indisponível: ${erroCatalogo.message}`);

  const { error } = await client.from("case_priority_map").upsert(
    (subcriterios ?? []).map((sub) => ({
      case_id: perfil.case_id as string,
      subcriterion_id: sub.id as string,
      importance: "IMPORTANTE",
    })),
    { onConflict: "case_id,subcriterion_id" },
  );

  if (error) throw new Error(`Não foi possível completar o Mapa: ${error.message}`);
}
