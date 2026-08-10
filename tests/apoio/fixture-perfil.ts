import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * FIXTURE DE TESTE — **não pertence ao runtime de produção.**
 *
 * Escreve `status = VALIDATED` direto em `priority_profiles` para montar
 * cenário. Isto **não é** a via oficial de reconhecimento do Perfil: a via
 * oficial é ato da PACIENTE (ADR-042) e passa por
 * `acknowledge_priority_profile`, com gate `is_patient_for_case` e log de
 * auditoria com `actor_role = paciente`.
 *
 * Por que existe aqui, e não no repositório de produto: enquanto morava em
 * `src/modules/curadoria/repository.ts`, esta capacidade era um **writer órfão
 * de produção** — nenhum chamador legítimo, e ainda assim alcançável. Foi ela
 * que permitiu ao seed produzir um Perfil `VALIDATED` sem encontro agendado,
 * sem encontro realizado e sem história reconhecida, e foi esse estado que a
 * auditoria D-11 encontrou.
 *
 * O bypass não era do produto. Era do seed. Mover para cá torna isso
 * estrutural: quem monta cenário sintético declara que está montando cenário.
 *
 * **Nunca importar isto de `src/`.** Há guarda que reprova.
 */
export async function fixtureValidarPerfil(
  supabase: SupabaseClient,
  priorityProfileId: string,
  validationNote: string,
): Promise<void> {
  const { error } = await supabase
    .from("priority_profiles")
    .update({
      status: "VALIDATED",
      validated_at: new Date().toISOString(),
      validation_note: validationNote,
    })
    .eq("id", priorityProfileId);

  if (error) throw new Error(error.message);
}
