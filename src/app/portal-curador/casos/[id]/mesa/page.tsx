import Link from "next/link";
import { notFound } from "next/navigation";

import type { Metadata } from "next";

import { EligibilityPanel } from "@/components/curadoria/cruzamento-mesa";
import { MesaEvidenciasPanel } from "@/components/curadoria/mesa-evidencias-panel";
import { ClassificarImportancia } from "@/components/curadoria/mesa-preocupacoes/classificar-importancia";
import { ComparacaoPorPreocupacoes } from "@/components/curadoria/mesa-preocupacoes/comparacao-por-preocupacoes";
import { ComporOsTres } from "@/components/curadoria/mesa-preocupacoes/compor-os-tres";
import { EmitirEEntregar } from "@/components/curadoria/mesa-preocupacoes/emitir-e-entregar";
import { EscreverORelatorio } from "@/components/curadoria/mesa-preocupacoes/escrever-o-relatorio";
import { requireAnyRole } from "@/modules/auth/guard";
import { getAuthState } from "@/modules/auth/session";
import { falhaParaUsuario } from "@/lib/observability/erros";
import {
  listOpenUpdateRequests,
  loadCurrentPracticeEvidence,
  loadEvidenceDivergences,
} from "@/modules/curadoria/evidencias-pratica-repository";
import { loadMesaCruzamento } from "@/modules/curadoria/mesa-cruzamento";
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

  // ------------------------------------------------------------------
  // A REDE — LIDA DE ONDE ELA MORA, NUNCA MONTADA AQUI. `SIM-42`.
  //
  // @metodo ADR-088 — só fato verificado elimina; autodeclarado vira ressalva
  // @metodo ADR-066/11-08 — duas superfícies para o mesmo ato é segunda fonte
  //
  // O que havia aqui: uma consulta própria a `professional_profiles` por
  // `publication_status = 'publicado'`. A Rede canônica exige
  // `ciclo_de_vida = 'PUBLICADO_ATIVO'`, recusa `is_demo`, casa
  // `is_test_fixture` com a certificação e **subtrai a lista de bloqueio por
  // divergência crítica em aberto**. Duas consultas, dois universos, a mesma
  // pergunta.
  //
  // Não era hipótese: esta Mesa já compõe os três e já emite. Um profissional
  // com divergência crítica aberta, um perfil de demonstração ou uma fixture
  // de teste entrava como coluna e podia chegar ao relatório da paciente —
  // e `validateSelection` só confere "três, sem repetido".
  //
  // É o `NC-22` de novo, e foi para impedi-lo que `rede-policy.ts` nasceu.
  // A regra existe uma vez. Quem monta Rede pergunta lá.
  // ------------------------------------------------------------------
  let view;
  try {
    view = await loadMesaCruzamento(supabase, id, 0);
  } catch (erro) {
    // FAIL-CLOSED (gate D17): blocklist inacessível LANÇA, e a falha aparece
    // como erro dito, com referência. Nunca uma Rede inflada — nem uma Rede
    // vazia mentirosa.
    const mensagem = falhaParaUsuario("mesa.preocupacoes.rede", erro, {
      mensagem: "Não foi possível montar a Mesa deste Case agora.",
      contexto: { caseId: id },
    });
    return (
      <main className="mx-auto max-w-reading px-6 py-10">
        <h1 className="text-2xl font-medium text-ink">A Mesa pelas preocupações dela</h1>
        <p role="alert" className="mt-4 text-sm leading-relaxed text-ink">
          {mensagem} A Rede deste Case não pôde ser lida — nada foi decidido nem perdido.
          Recarregue a página; se persistir, informe a referência acima.
        </p>
      </main>
    );
  }

  // AS COLUNAS SÃO OS ELEGÍVEIS, NÃO A REDE INTEIRA.
  //
  // A área é a porta (`applyAreaGate`) e o filtro obrigatório é o único
  // mecanismo que elimina (ADR-088). Comparar quem não passou pela porta
  // produziria uma comparação sobre a qual o Curador poderia agir — e a
  // ADR-042 já fixou que quem aparece para ser selecionado é exatamente quem
  // a Mesa declarou elegível.
  //
  // Quem ainda não passou não some: aparece no painel acima, com o estado, a
  // razão em uma frase e o ato que falta. É a lacuna virando tarefa.
  const profissionais = view.professionals
    .filter((profissional) => profissional.eligibility.state === "ELEGIVEL")
    .map((profissional) => ({
      id: profissional.professionalProfileId,
      display_name: profissional.displayName,
    }));

  // ------------------------------------------------------------------
  // A BASE DE EVIDÊNCIAS — sobre a REDE INTEIRA, não só sobre os elegíveis.
  //
  // A diferença de recorte é de propósito e não é detalhe: a comparação é
  // sobre quem já passou pela porta, mas a VERIFICAÇÃO é o que às vezes
  // permite abrir a porta. Um profissional aguardando declaração de área pode
  // estar esperando exatamente uma fonte conferida — restringi-la aos
  // elegíveis esconderia o trabalho de quem ainda não é um.
  //
  // A RLS decide o alcance; o papel decide as ações. O Curador lê, abre
  // divergência e pede atualização; assinar verificação e resolver
  // divergência são do Administrador — é a ADR-060 ("quem avalia não atesta")
  // com superfície.
  // ------------------------------------------------------------------
  const authState = await getAuthState();
  const ehAdministrador = authState?.roles.includes("administrador") ?? false;
  const idsDaRede = view.professionals.map((p) => p.professionalProfileId);
  const [evidencias, divergencias, pedidosDeAtualizacao] = await Promise.all([
    loadCurrentPracticeEvidence(supabase, idsDaRede),
    loadEvidenceDivergences(supabase, idsDaRede),
    listOpenUpdateRequests(supabase, idsDaRede),
  ]);

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
    profissionais.map((p) => ({ id: p.id, nome: p.display_name })),
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

  // Os itens a classificar saem da própria Mesa, com o título que a linha já
  // tem: a frase DELA quando existe, a pergunta quando ela ainda não
  // respondeu. Na Mesa antiga este painel mostrava o código do subcritério, e
  // o Curador classificava "MODELO_COMUNICACAO" sem a frase por perto.
  const paraClassificar = [
    ...mesa.linhas.map((linha) => ({
      subcriterionCode: linha.subcriterionCode,
      titulo: linha.resposta ?? linha.pergunta,
      atual: linha.importancia,
    })),
    ...mesa.orfaos.map((orfao) => ({
      subcriterionCode: orfao.subcriterionCode,
      // `SIM-45`: o rótulo do Catálogo, não o código com os underscores
      // trocados por espaço. O Curador classificava "experiencia volume de
      // atuacao" — código cru fantasiado de prosa.
      titulo: orfao.rotulo,
      atual: orfao.importancia,
    })),
  ];

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
          Em construção. Aqui já dá para registrar o que ela disse, julgar, compor os três
          caminhos, escrever o relatório e entregar.
        </p>

        {/* O que AINDA não mora aqui, dito por nome — e não como "algumas
            funções". Quem chega e não acha o que procura precisa saber onde
            está, e não desconfiar que quebrou. */}
        <p className="max-w-3xl text-sm text-ink-muted">
          Uma coisa continua só na Mesa atual: o painel de atenção.{" "}
          <Link
            href={`/coa/curadoria/casos/${id}/curadoria_tecnica`}
            className="text-ink underline underline-offset-2"
          >
            Ir para a Mesa atual
          </Link>
          .
        </p>
      </header>

      {/* QUEM PODE PARTICIPAR — a porta, antes de tudo o que vem depois.
          A área é a porta; o filtro obrigatório é o único mecanismo que
          elimina alguém desta Curadoria (ADR-088), e é o único cujo efeito ela
          nunca poderá auditar: jamais fica sabendo do caminho que não lhe foi
          apresentado. Por isso ele fica em cima, à vista, com a procedência de
          cada fato ao lado do fato.

          O painel é o MESMO da Mesa antiga, de propósito: duas superfícies
          para o mesmo ato é a segunda fonte que a ADR-066/11-08 proíbe — e foi
          exatamente assim que o `SIM-42` nasceu. */}
      <section className="flex flex-col gap-4">
        <header className="flex flex-col gap-1">
          <h2 className="text-lg font-medium text-ink">Quem pode participar desta Curadoria</h2>
          <p className="max-w-3xl text-sm text-ink-muted">{view.nextStep}</p>
        </header>
        <EligibilityPanel view={view} />
      </section>

      {/* A classificação vem ANTES da comparação, porque sem ela o Motor não
          cruza nada — e a tabela abaixo mostraria "falta você declarar" em
          cada célula. A ordem da tela é a ordem do trabalho. */}
      <ClassificarImportancia caseId={id} itens={paraClassificar} />

      <ComparacaoPorPreocupacoes caseId={id} {...mesa} />

      {/* A BASE DE EVIDÊNCIAS vem DEPOIS da comparação, e a ordem é o
          raciocínio: é a comparação que revela as lacunas — as células que
          dizem "Falta descobrir", cuja cor aponta a operação — e é aqui que
          se vai descobrir. Antes da comparação, ela seria um arquivo; depois,
          é a resposta a uma pergunta que acabou de aparecer.

          E vem ANTES de compor os três: não se escolhe um caminho para
          alguém sem ter fechado o que dava para fechar.

          O painel é o MESMO da Mesa antiga. Ele nunca diz "atende" ou "não
          atende" — estado da informação e correspondência não se confundem
          (GRAMATICA_DAS_PERGUNTAS §6), e o juízo mora na célula, lá em cima. */}
      <section className="flex flex-col gap-4 border-t border-border pt-6">
        <header className="flex flex-col gap-1">
          <h2 className="text-lg font-medium text-ink">Base de Evidências de Prática</h2>
          <p className="max-w-3xl text-sm text-ink-muted">
            O que se sabe sobre cada profissional, com a fonte e a idade do fato. É por aqui
            que uma autodeclaração vira informação verificada — e a Rede inteira aparece, não
            só quem já é elegível: às vezes é a verificação que abre a porta.
          </p>
        </header>
        <MesaEvidenciasPanel
          caseId={id}
          professionals={view.professionals.map((p) => ({
            professionalProfileId: p.professionalProfileId,
            displayName: p.displayName,
          }))}
          rows={Object.fromEntries(evidencias)}
          divergences={divergencias}
          updateRequests={pedidosDeAtualizacao}
          can={{
            // ADR-060 — quem avalia não atesta. Assinar verificação, resolver
            // divergência e marcar desatualização são do Administrador.
            verify: ehAdministrador,
            resolveDivergence: ehAdministrador,
            markOutdated: ehAdministrador,
            // Apontar que as fontes discordam e pedir atualização são atos de
            // quem está investigando — o Curador precisa deles para trabalhar.
            openDivergence: true,
            requestUpdate: true,
          }}
          nowIso={new Date().toISOString()}
        />
      </section>

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
