import { notFound } from "next/navigation";

import type { Metadata } from "next";

import { ComparacaoPorPreocupacoes } from "@/components/curadoria/mesa-preocupacoes/comparacao-por-preocupacoes";
import { ComporOsTres } from "@/components/curadoria/mesa-preocupacoes/compor-os-tres";
import { requireAnyRole } from "@/modules/auth/guard";
import { carregarMesaPorPreocupacoes } from "@/modules/curadoria/mesa-por-preocupacoes-repository";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Mesa — pelas preocupações dela",
};

/**
 * A MESA NOVA, EM CONSTRUÇÃO — rota separada, de propósito.
 *
 * @metodo ADR-093 — as linhas são as preocupações dela
 *
 * Ela vive ao lado da Mesa antiga enquanto está incompleta, e some quando a
 * nova a substituir: duas superfícies para o mesmo ato é a segunda fonte que a
 * ADR-066/11-08 proíbe. A convivência é andaime de obra, não arquitetura — e a
 * remoção da antiga é o último passo da ADR-093, não o primeiro.
 *
 * Só leitura por enquanto. Registrar juízo, compor os três caminhos e emitir o
 * relatório continuam na Mesa antiga.
 */
export default async function MesaPorPreocupacoesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireAnyRole(["curador_medico", "administrador"]);
  const supabase = await createServerSupabaseClient();

  const { data: caso } = await supabase
    .from("cases")
    .select("id")
    .eq("id", id)
    .maybeSingle();

  if (!caso) notFound();

  // A Rede deste Case. Enquanto a seleção não existe, são os publicados —
  // que é o universo que a Mesa antiga também considera antes da triagem.
  const { data: profissionais } = await supabase
    .from("professional_profiles")
    .select("id, display_name")
    .eq("publication_status", "publicado")
    .order("display_name");

  // A seleção pende do Perfil de Prioridades: é ele que carrega a autoridade
  // do que ela declarou, e sem ele a Curadoria seria a Aliviar decidindo com
  // aparência de método.
  const { data: perfil } = await supabase
    .from("priority_profiles")
    .select("id")
    .eq("case_id", id)
    .maybeSingle();

  const mesa = await carregarMesaPorPreocupacoes(
    supabase,
    id,
    ((profissionais ?? []) as { id: string; display_name: string }[]).map((p) => ({
      id: p.id,
      nome: p.display_name,
    })),
  );

  return (
    <main className="mx-auto flex max-w-[80rem] flex-col gap-8 px-6 py-10">
      <header className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-wide text-ink-muted">
          Mesa em construção · ADR-093
        </p>
        <h1 className="text-2xl font-medium text-ink">A Mesa pelas preocupações dela</h1>
        <p className="max-w-3xl text-sm text-ink-muted">
          Em construção. Já dá para registrar o que ela disse, julgar e compor os três
          caminhos; a emissão do relatório e a entrega continuam na Mesa atual.
        </p>
      </header>

      <ComparacaoPorPreocupacoes caseId={id} {...mesa} />

      <ComporOsTres
        priorityProfileId={(perfil as { id: string } | null)?.id ?? null}
        linhas={mesa.linhas}
        profissionais={mesa.profissionais}
      />
    </main>
  );
}
