import { redirect } from "next/navigation";

import { getAuthState } from "@/modules/auth/session";
import { resolveCoaHomePath } from "@/modules/coa/permissions";

/**
 * `/coa` deixou de ser tela (fusão fila×contatos, 21/08 — sugestão aceita no
 * fecho da ADR-075/076): era um saguão que só apontava portas, e só aparecia
 * para quem tinha mais de um nível. Agora TODO MUNDO é levado direto à casa do
 * próprio papel — a mesma autoridade (`resolveCoaHomePath`) que o login e o
 * ROLE_HOME já usam, nunca um segundo mapa que possa divergir.
 *
 * COA-H1 continua fechado: quem não resolve nível nenhum — paciente,
 * profissional, atendente sem nível COA — termina em /acesso-negado, e o
 * conteúdo operacional nunca renderiza (não há mais o que renderizar).
 */
export default async function CoaHubPage() {
  const auth = await getAuthState();
  if (!auth) redirect("/login?next=/coa");

  redirect(resolveCoaHomePath(auth.roles));
}
