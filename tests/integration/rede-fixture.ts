// FIXTURE DA REDE — um profissional que o Curador pode de fato oferecer
//
// Antes da política de fontes, "apresentável" era só existir e estar ativo.
// Deixou de ser: a Rede operacional agora exige publicado, e publicar exige
// CRM, registro consultado no conselho e área de atuação verificada, com
// fonte, autor e data em cada uma.
//
// A fixture percorre esse caminho inteiro em vez de contorná-lo. Um atalho
// aqui — gravar `publicado` direto, afrouxar o gatilho — faria as suítes
// passarem sobre uma Rede que a produção nunca aceitaria, e o dia em que a
// regra falhasse de verdade nenhum teste avisaria.

import type { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createProfessionalProfile } from "@/modules/profiles/professional-repository";

type AdminClient = ReturnType<typeof createAdminSupabaseClient>;

let contador = 0;

function unico(prefixo: string): string {
  contador += 1;
  return `${prefixo}-${Date.now()}-${contador}`;
}

/**
 * Cria um profissional real, verificado e publicado — o único tipo que
 * `listApprovedProviders` devolve.
 */
export async function seedPublishedProfessional(
  adminClient: AdminClient,
  adminUserId: string,
  labelPrefix = "Profissional",
): Promise<string> {
  const professional = await createProfessionalProfile(adminClient, {
    displayName: `${labelPrefix} ${unico("p")}`,
    professionalIdentifier: unico("ident"),
    crm: unico("CRM").slice(0, 20),
    crmUf: "SP",
    professionalSummary: "Profissional com experiência em acolhimento e escuta ativa.",
    institutionName: null,
    createdBy: adminUserId,
  });

  const agora = new Date().toISOString();

  await adminClient
    .from("professional_profiles")
    .update({
      experience_level: "experiente",
      intake_approach: "ambos",
      offers_continuous_care: true,
      availability_window: "flexible",
      practical_considerations: ["Atende também por telemedicina."],
      registration_status: "regular",
      registration_source: "Consulta ao conselho profissional (fixture de teste)",
      registration_verified_at: agora,
      registration_verified_by: adminUserId,
    })
    .eq("id", professional.id);

  await adminClient.from("professional_competency_areas").insert({
    professional_profile_id: professional.id,
    domain: "nao_determinado",
    focus: "avaliacao",
  });

  await adminClient.from("professional_practice_areas").insert({
    professional_profile_id: professional.id,
    raw_text: "Área declarada para exercício do fluxo de teste.",
    tags: [],
    source: "Fixture de integração",
    verification_status: "verificado",
    verified_at: agora,
    verified_by: adminUserId,
  });

  // Só agora. O gatilho de publicação confere tudo o que está acima, e é essa
  // conferência que a fixture existe para exercitar.
  const { error } = await adminClient
    .from("professional_profiles")
    .update({ publication_status: "publicado" })
    .eq("id", professional.id);

  if (error) {
    throw new Error(`fixture não conseguiu publicar o profissional: ${error.message}`);
  }

  return professional.id;
}
