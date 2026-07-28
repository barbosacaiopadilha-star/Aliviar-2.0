import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { loadCasePriorityMap } from "@/modules/curadoria/mapa-prioridades-repository";
import { isProfileAcknowledged } from "@/modules/curadoria/reconhecimento-do-perfil";
import type { PriorityProfileStatus } from "@/modules/curadoria/types";

import { buildPerfilView, type PerfilView } from "./experiencia";

/**
 * O Perfil da pessoa, vindo do Mapa de Prioridades — ADR-042.
 *
 * Antes vinha de `cruzamento_weights`, o orçamento de 100 pontos. Aquele
 * modelo deixou de ser autoridade: o Mapa é a representação oficial das
 * prioridades do Case, e é dele que sai o que ela lê.
 *
 * Sem adaptador e sem derivar pontos: se o Mapa está vazio, o cartão diz que
 * o Perfil ainda está sendo construído — que é a verdade.
 */
export async function loadPatientPerfil(
  supabase: SupabaseClient,
  caseId: string,
): Promise<PerfilView> {
  const [mapa, { data: profile }] = await Promise.all([
    loadCasePriorityMap(supabase, caseId),
    supabase.from("priority_profiles").select("status").eq("case_id", caseId).maybeSingle(),
  ]);

  // A validação do Perfil PELA PESSOA continua (ADR-042): ela nunca foi etapa
  // do modelo antigo — é o consentimento dela. A Curadoria só abre depois que
  // ela reconhece o Perfil como seu.
  return buildPerfilView(mapa.items, isProfileAcknowledged(profile?.status as PriorityProfileStatus));
}
