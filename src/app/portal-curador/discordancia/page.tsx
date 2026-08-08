import { PainelDeDiscordanciaMesa } from "@/components/curadoria/painel-de-discordancia";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { requireAnyRole } from "@/modules/auth/guard";
import { loadPainelDeDiscordancia } from "@/modules/curadoria/painel-de-discordancia-repository";

// ITEM 1.11 — O PAINEL DE DISCORDÂNCIA, dentro da Mesa e só nela.
//
// Qual pergunta do Curador esta tela responde?
//   "Com que frequência as propostas derivadas estão sendo recusadas — por
//    conceito e por versão de regra?"
//
// É calibração de MÉTODO: discordância alta corrige a tabela de
// correspondência, nunca o Curador (R-02). Por isso não há aqui pessoa,
// Case, proposta individual, ordenação por taxa ou qualquer eixo que
// permita ranking — essas dimensões não existem na capability que alimenta
// a página (CONTRATO_1_11 §3/§7).
//
// O cliente administrativo é deliberado: a capability agregada executa só
// como `service_role`, e o gate humano é o papel exigido acima — o mesmo
// desenho de fronteira do restante do portal.

export default async function PainelDeDiscordanciaPage() {
  await requireAnyRole(["curador_medico", "administrador"]);
  const supabase = createAdminSupabaseClient();
  const painel = await loadPainelDeDiscordancia(supabase);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Discordância das derivações</h1>
        <p className="text-ink-muted">
          Observação por conceito e por versão exata da regra. A ordem é a
          neutra do Catálogo.
        </p>
      </div>
      <PainelDeDiscordanciaMesa painel={painel} />
    </div>
  );
}
