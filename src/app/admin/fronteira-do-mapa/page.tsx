import type { Metadata } from "next";

import { PainelDaFronteira } from "@/components/curadoria/fronteira/painel-da-fronteira";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { requireAnyRole } from "@/modules/auth/guard";
import { loadFronteiraDoMapa } from "@/modules/curadoria/fronteira-do-mapa-repository";

export const metadata: Metadata = {
  title: "Fronteira do Mapa do Profissional",
  robots: { index: false, follow: false },
};

/**
 * A FRONTEIRA DO MAPA DO PROFISSIONAL (Item 2.C §10) — painel interno da
 * operação, gate `administrador` (ADR-068 §14.2). A leitura vem do caminho
 * servidor autorizado; os ATOS saem daqui com a sessão real de quem decide —
 * a autoridade final é sempre o gate interno da capability.
 */
export default async function FronteiraDoMapaPage() {
  await requireAnyRole(["administrador"]);
  const service = createAdminSupabaseClient();
  const itens = await loadFronteiraDoMapa(service);

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-6 py-10">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold">Fronteira do Mapa do Profissional</h1>
        <p className="text-sm text-ink-muted">
          Cada item traz a proveniência inteira — declaração original, regra e versão, emissão —
          e os dois atos com o mesmo custo. Um item por ato; nada se decide em bloco.
        </p>
      </header>
      <PainelDaFronteira itens={itens} />
    </main>
  );
}
