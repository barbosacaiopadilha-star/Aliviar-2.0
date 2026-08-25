import { notFound } from "next/navigation";

import type { Metadata } from "next";

import { ComparacaoPorPreocupacoes } from "@/components/curadoria/mesa-preocupacoes/comparacao-por-preocupacoes";
import { ComporOsTres } from "@/components/curadoria/mesa-preocupacoes/compor-os-tres";
import { EmitirEEntregar } from "@/components/curadoria/mesa-preocupacoes/emitir-e-entregar";
import { EscreverORelatorio } from "@/components/curadoria/mesa-preocupacoes/escrever-o-relatorio";
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

  // A seleção já composta, se houver: o relatório escreve SOBRE ela, e a
  // ordem em que ela lê é a que o Curador decidiu ao compor.
  const { data: selecao } = await supabase
    .from("curated_selections")
    .select("id, composition_rationale, curated_selection_options(professional_profile_id, rationale, position)")
    .eq("case_id", id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: relatorio } = await supabase
    .from("curadoria_reports")
    .select("id, emitted_at, delivered_at")
    .eq("case_id", id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // O nome dela vem do Case — a tela de entrega diz a quem está entregando, e
  // "a paciente" não é ninguém.
  const { data: pessoa } = await supabase
    .from("cases")
    .select("profiles:patient_profile_id(display_name)")
    .eq("id", id)
    .maybeSingle();

  const mesa = await carregarMesaPorPreocupacoes(
    supabase,
    id,
    ((profissionais ?? []) as { id: string; display_name: string }[]).map((p) => ({
      id: p.id,
      nome: p.display_name,
    })),
  );

  const composta = selecao as
    | {
        composition_rationale: string | null;
        curated_selection_options: {
          professional_profile_id: string;
          rationale: string;
          position: number;
        }[];
      }
    | null;

  const perfilDela = (pessoa as { profiles: { display_name: string } | { display_name: string }[] | null } | null)?.profiles;
  const nomeDaPaciente =
    (Array.isArray(perfilDela) ? perfilDela[0]?.display_name : perfilDela?.display_name) ?? "ela";

  const nomes = new Map(mesa.profissionais.map((p) => [p.id, p.nome]));
  const escolhidos = [...(composta?.curated_selection_options ?? [])]
    .sort((a, b) => a.position - b.position)
    .map((opcao) => ({
      id: opcao.professional_profile_id,
      nome: nomes.get(opcao.professional_profile_id) ?? "profissional",
      rationale: opcao.rationale,
    }));

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

      <EscreverORelatorio
        priorityProfileId={(perfil as { id: string } | null)?.id ?? null}
        linhas={mesa.linhas}
        profissionais={mesa.profissionais}
        escolhidos={escolhidos}
        composicaoJaEscrita={composta?.composition_rationale ?? ""}
      />

      <EmitirEEntregar
        priorityProfileId={(perfil as { id: string } | null)?.id ?? null}
        curatedSelectionId={(selecao as { id: string } | null)?.id ?? null}
        nomeDaPaciente={nomeDaPaciente}
        emitido={Boolean((relatorio as { emitted_at: string | null } | null)?.emitted_at)}
        entregue={Boolean((relatorio as { delivered_at: string | null } | null)?.delivered_at)}
        temRelatorio={Boolean(relatorio)}
      />
    </main>
  );
}
