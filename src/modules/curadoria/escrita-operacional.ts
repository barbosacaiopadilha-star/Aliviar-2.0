import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * ESCRITA OPERACIONAL NA BASE — o ponto único onde o service role é usado.
 *
 * A RLS de `practice_evidence` concede INSERT ao administrador. Dois caminhos
 * legítimos não cabem nessa policy e precisam do service role:
 *
 *   * o PROFISSIONAL submetendo o próprio Protocolo (ele não é admin, e a
 *     Base é append-only da operação);
 *   * o CURADOR abrindo divergência, que vira estado novo da evidência.
 *
 * Nos dois, a autorização deixa de ser garantida pelo banco e passa a ser
 * garantida aqui. Este módulo existe para que essa garantia seja UMA função
 * auditável, e não uma checagem reescrita em cada action — que foi como a
 * lista de revalidação divergiu, no defeito histórico do `revalidatePath`.
 *
 * O que ele NÃO faz: mudar política de negócio. Quem podia escrever antes
 * continua podendo; quem não podia continua não podendo.
 */

export class EscritaNaoAutorizadaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EscritaNaoAutorizadaError";
  }
}

/**
 * Confirma, contra o banco e com a sessão do próprio usuário, que o perfil
 * profissional alvo pertence a ele. Devolve o id do perfil.
 *
 * É a trava do caminho do profissional: o `professionalProfileId` nunca vem
 * do input — é derivado da sessão. Assim, mesmo com o service role adiante,
 * ninguém escreve na Base de outra pessoa.
 */
export async function resolveOwnProfessionalProfile(
  sessionClient: SupabaseClient,
  userId: string,
): Promise<string> {
  const { data, error } = await sessionClient
    .from("professional_profiles")
    .select("id")
    .eq("profile_id", userId)
    .maybeSingle();

  if (error) throw new EscritaNaoAutorizadaError(`Perfil profissional: ${error.message}`);
  if (!data) {
    throw new EscritaNaoAutorizadaError(
      "Perfil profissional não encontrado para esta conta — escrita na Base recusada.",
    );
  }
  return data.id as string;
}

/**
 * Confirma que o profissional alvo é ALCANÇÁVEL pela sessão de quem escreve.
 *
 * É a trava do caminho do Curador: a RLS de `professional_profiles` já
 * recorta o que cada papel enxerga; se a sessão dele não lê aquele perfil, o
 * service role não escreve sobre ele. Verificação positiva antes do
 * privilégio, em vez de confiar no id que veio do formulário.
 */
export async function assertProfessionalReachableBySession(
  sessionClient: SupabaseClient,
  professionalProfileId: string,
): Promise<void> {
  const { data, error } = await sessionClient
    .from("professional_profiles")
    .select("id")
    .eq("id", professionalProfileId)
    .maybeSingle();

  if (error) throw new EscritaNaoAutorizadaError(`Perfil profissional: ${error.message}`);
  if (!data) {
    throw new EscritaNaoAutorizadaError(
      "Este perfil profissional não é alcançável por esta sessão — escrita na Base recusada.",
    );
  }
}
