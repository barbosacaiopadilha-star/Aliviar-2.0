import "server-only";

import { redirect } from "next/navigation";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getAuthState } from "@/modules/auth/session";

import { carregarEstadoDeGovernanca } from "./repository";
import type { PendenciaDeAceite } from "./documentos";

/**
 * O GATE DE ACEITE — no servidor, nunca no cliente.
 *
 * Enquanto houver documento obrigatório sem aceite vigente, a pessoa não entra
 * nas superfícies protegidas do papel dela: é desviada para a tela de aceite.
 *
 * DUAS EXCEÇÕES DELIBERADAS, e elas são o que torna o bloqueio legítimo:
 *
 *  1. a própria tela de aceite e a área "Documentos e Consentimentos" — senão
 *     o bloqueio se fecharia sobre si mesmo;
 *  2. o exercício de direitos LGPD — bloquear alguém de acessar, corrigir ou
 *     excluir os próprios dados por não aceitar uma política NOVA seria
 *     coagir consentimento, e consentimento coagido é nulo. O direito não
 *     depende do aceite.
 *
 * Também ficam livres as rotas públicas (o portal legal precisa ser legível
 * sem sessão — é onde a pessoa lê ANTES de decidir).
 */

/** Prefixos que o gate nunca bloqueia. Ver as duas exceções acima. */
export const ROTAS_LIVRES_DO_GATE: readonly string[] = [
  "/aceites",
  // MERGE DE 23/08 · os consentimentos moram dentro da central de Documentos
  // — a liberdade do gate segue o conteúdo: bloquear o exercício de direitos
  // (ou o acesso dela ao que é dela) por falta de aceite seria coagir
  // consentimento. A rota antiga fica livre também: ela redireciona para cá.
  "/paciente/documentos",
  "/paciente/documentos-e-consentimentos",
  "/profissional/documentos-e-consentimentos",
  "/conta/meus-dados",
  "/conta/direitos",
  "/privacidade",
  "/termos",
  "/consentimentos",
  "/legal",
  "/cookies",
  "/login",
  "/logout",
];

export function rotaEstaLivreDoGate(pathname: string): boolean {
  return ROTAS_LIVRES_DO_GATE.some(
    (prefixo) => pathname === prefixo || pathname.startsWith(`${prefixo}/`),
  );
}

export type EstadoDoGate = {
  pendencias: PendenciaDeAceite[];
  liberado: boolean;
};

/**
 * Consulta o estado do gate para a sessão corrente. Sem sessão, não há o que
 * cobrar: quem não entrou ainda não aceita nada.
 */
export async function estadoDoGate(): Promise<EstadoDoGate> {
  const state = await getAuthState();
  if (!state) return { pendencias: [], liberado: true };

  const supabase = await createServerSupabaseClient();
  const { pendencias } = await carregarEstadoDeGovernanca(
    supabase,
    state.user.id,
    state.roles,
  );
  return { pendencias, liberado: pendencias.length === 0 };
}

/**
 * A guarda que as superfícies protegidas chamam. Desvia para /aceites quando
 * houver pendência — o mesmo formato de `requireRole`, para que o ponto de
 * uso continue sendo uma linha no topo do layout.
 */
export async function requireAceitesEmDia(pathnameAtual?: string): Promise<void> {
  if (pathnameAtual && rotaEstaLivreDoGate(pathnameAtual)) return;

  const { liberado } = await estadoDoGate();
  if (!liberado) redirect("/aceites");
}
