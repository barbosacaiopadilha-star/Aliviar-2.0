import Link from "next/link";
import { notFound } from "next/navigation";

import type { Metadata } from "next";

import { EligibilityPanel } from "@/components/curadoria/cruzamento-mesa";
import { MandatoryFilters } from "@/components/curadoria/mandatory-filters";
import { MesaEvidenciasPanel } from "@/components/curadoria/mesa-evidencias-panel";
import { StartPriorityProfile } from "@/components/curadoria/start-priority-profile";
import { ClassificarImportancia } from "@/components/curadoria/mesa-preocupacoes/classificar-importancia";
import { ComparacaoPorPreocupacoes } from "@/components/curadoria/mesa-preocupacoes/comparacao-por-preocupacoes";
import { ComporOsTres } from "@/components/curadoria/mesa-preocupacoes/compor-os-tres";
import { EmitirEEntregar } from "@/components/curadoria/mesa-preocupacoes/emitir-e-entregar";
import { EscreverORelatorio } from "@/components/curadoria/mesa-preocupacoes/escrever-o-relatorio";
import { OQueDependeDeVoce } from "@/components/curadoria/mesa-preocupacoes/o-que-depende-de-voce";
import { requireAnyRole } from "@/modules/auth/guard";
import { getAuthState } from "@/modules/auth/session";
import { falhaParaUsuario } from "@/lib/observability/erros";
import {
  listOpenUpdateRequests,
  loadCurrentPracticeEvidence,
  loadEvidenceDivergences,
} from "@/modules/curadoria/evidencias-pratica-repository";
import { juizosVigentesPorConceito, lacunasDeJuizo } from "@/modules/curadoria/julgamentos";
import { loadJulgamentosDaAvaliacao } from "@/modules/curadoria/julgamentos-repository";
import { getActivePriorityProfile } from "@/modules/curadoria/repository";
import { MANDATORY_FILTER_LABELS, type MandatoryFilterKind } from "@/modules/curadoria/types";
import { loadMesaCruzamento } from "@/modules/curadoria/mesa-cruzamento";
import { itensDeAtencao, type InvestigacaoProfissional } from "@/modules/curadoria/mesa-investigacao";
import { crossCaseRelationalForProfessionals } from "@/modules/curadoria/motor-relacional-repository";
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
    .select("id, composition_rationale, curated_selection_options(professional_profile_id, rationale, trade_off, position)")
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
          trade_off: string | null;
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

  // ------------------------------------------------------------------
  // O QUE AINDA DEPENDE DE VOCÊ — derivado, nunca digitado.
  //
  // @metodo ADR-067 §5 — H8–H10 sempre; H11 quando o Case declarou o grau
  // @metodo ADR-093 — a lacuna vira tarefa nomeada, não "23 lacunas"
  //
  // O motor de alertas (`itensDeAtencao`) é o mesmo da Mesa antiga. O que
  // NÃO é o mesmo é o alimento — e foi por isto que este painel não era
  // ligação de fio:
  //
  // A Mesa antiga alimenta `criteriosPendentes` com `criterion_declarations`,
  // do regime `LEGADO_6XN`, que hoje vive atrás de flag. No regime padrão
  // (`JUIZO`) quem conclui a etapa são os JUÍZOS da ADR-067 §5 — e é deles
  // que a paciente lê o resultado. Somar as duas coisas no mesmo número
  // repetiria o erro do `SIM-40`, que confundiu conceito com juízo e ensinou
  // "três" onde o Método exige seis.
  //
  // Aqui a Mesa nova conta o que ela própria mostra: os juízos que faltam, e
  // as células que dizem "Falta descobrir".
  // ------------------------------------------------------------------
  const idsElegiveis = profissionais.map((p) => p.id);

  // O H11 só é exigido quando o Case declarou grau para o conceito relacional
  // (ADR-065). Cobrá-lo sem isso seria inventar pendência.
  const relacional =
    idsElegiveis.length > 0
      ? await crossCaseRelationalForProfessionals(supabase, id, idsElegiveis)
      : { byProfessional: [], relationalNeedsCount: 0 };
  const relacionalPorId = new Map(
    relacional.byProfessional.map((leitura) => [leitura.professionalProfileId, leitura]),
  );

  // Uma leitura só, dois consumidores. `SIM-53`: a página já carregava os
  // julgamentos para CONTAR as pendências do painel de atenção, e jogava fora
  // o conteúdo — então a célula continuava pedindo o juízo que já estava dado,
  // enquanto o painel ao lado sabia que não estava. Duas verdades sobre o
  // mesmo fato, na mesma tela, por falta de passar adiante o que já se tinha.
  const juizosPorProfissional = await Promise.all(
    idsElegiveis.map(async (professionalProfileId) => {
      const julgamentos = await loadJulgamentosDaAvaliacao(supabase, id, professionalProfileId);
      const declarados = (relacionalPorId.get(professionalProfileId)?.readings ?? [])
        .filter((reading) => reading.kind === "JUIZO_HUMANO")
        .map((reading) => reading.code);
      return { professionalProfileId, julgamentos, declarados };
    }),
  );

  const juizosPendentesPorId = new Map(
    juizosPorProfissional.map(({ professionalProfileId, julgamentos, declarados }) => [
      professionalProfileId,
      lacunasDeJuizo(julgamentos, declarados).length,
    ]),
  );

  // O juízo VIGENTE por (profissional × conceito) — o que a célula precisa
  // para dizer "Rever juízo" em vez de "Registrar juízo", e para mostrar o que
  // já foi dito. `SUPERADO` e `RETIRADO` não entram: o que vale é o vigente.
  const juizoVigente: Record<string, Record<string, string>> = Object.fromEntries(
    juizosPorProfissional.map(({ professionalProfileId, julgamentos }) => [
      professionalProfileId,
      juizosVigentesPorConceito(julgamentos),
    ]),
  );

  // "Falta descobrir" — a célula cuja cor aponta a operação. Sai da própria
  // Mesa, sem segunda consulta: é literalmente o que a tabela está exibindo.
  const semEstadoPorId = new Map<string, number>();
  for (const celula of [...mesa.linhas, ...mesa.orfaos].flatMap((entrada) => entrada.celulas)) {
    if (celula.motivo !== "SEM_ESTADO_DECLARADO") continue;
    semEstadoPorId.set(celula.profissionalId, (semEstadoPorId.get(celula.profissionalId) ?? 0) + 1);
  }

  const paraOAlerta: InvestigacaoProfissional[] = view.professionals.map((profissional) => ({
    id: profissional.professionalProfileId,
    nome: profissional.displayName,
    estado: profissional.eligibility.state,
    areaDeclarada: Boolean(profissional.declaration),
    temDivergencia: profissional.areaVerificationStatus === "divergente",
    filtrosSemInformacao: profissional.eligibility.filters.filter((f) => f.passes === null).length,
    // O regime 6×N não vive nesta Mesa: zero não é omissão, é a ausência de
    // um regime que ela nunca implementou.
    criteriosPendentes: 0,
    criteriosInsuficientes: semEstadoPorId.get(profissional.professionalProfileId) ?? 0,
    juizosPendentes: juizosPendentesPorId.get(profissional.professionalProfileId) ?? 0,
  }));

  const atencao = itensDeAtencao(paraOAlerta);

  // ------------------------------------------------------------------
  // O QUE ELIMINA — os filtros obrigatórios do Perfil desta pessoa.
  //
  // @metodo Ontologia §3.7 — restrição elimina opções e nunca recebe peso
  // @metodo Fundamentos §13 — P5: nenhum filtro é inferido; vem da fala dela
  // @metodo ADR-088 — só fato verificado elimina; a proveniência é lida acima
  //
  // Esta superfície veio da Mesa antiga na remoção dela, e não por inércia:
  // é a ÚNICA do produto onde um requisito inegociável é registrado. Sem ela,
  // toda a maquinaria da ADR-088 que o painel de elegibilidade lê não teria o
  // que avaliar — e a fase Filtros voltaria a se dar por concluída sozinha,
  // porque "todo filtro tem motivo" é verdade quando não há filtro nenhum.
  //
  // O `GAP-D-1` é a memória disto: o componente já existiu órfão uma vez, com
  // três actions e RLS prontas e nenhuma rota que o renderizasse.
  //
  // Depois do reconhecimento dela, o Perfil é imutável e o painel lê.
  // ------------------------------------------------------------------
  const perfilAtivo = perfil ? await getActivePriorityProfile(supabase, id) : null;

  const filtrosDoPerfil = (perfilAtivo?.mandatoryFilters ?? []).map((filtro) => ({
    id: filtro.id,
    kind: filtro.kind,
    label: MANDATORY_FILTER_LABELS[filtro.kind as MandatoryFilterKind] ?? filtro.kind,
    value: filtro.value,
    reason: filtro.note ?? "",
  }));

  const preferenciasDoPerfil = (perfilAtivo?.preferences ?? []).map((filtro) => ({
    id: filtro.id,
    value: filtro.value,
    reason: filtro.note ?? "",
  }));

  const primeiroNome = nomeDaPaciente.split(" ")[0] ?? nomeDaPaciente;

  const nomes = new Map(mesa.profissionais.map((p) => [p.id, p.nome]));
  const escolhidos = [...(composta?.curated_selection_options ?? [])]
    .sort((a, b) => a.position - b.position)
    .map((opcao) => ({
      id: opcao.professional_profile_id,
      nome: nomes.get(opcao.professional_profile_id) ?? "profissional",
      rationale: opcao.rationale,
    }));

  // `SIM-52`: o editor do Relatório abre com o que já foi escrito. Sem isto,
  // uma Curadoria ENTREGUE aparecia com os campos vazios e a frase "falta
  // preencher" — sobre o documento que a paciente já está lendo.
  const { data: opcoesDoRelatorio } = relatorio
    ? await supabase
        .from("curadoria_report_options")
        .select("professional_profile_id, justification, relation_to_weights, attention_points")
        .eq("report_id", (relatorio as { id: string }).id)
    : { data: null };

  const jaEscrito = (opcoesDoRelatorio ?? []).map((opcao) => {
    const linha = opcao as {
      professional_profile_id: string;
      justification: string | null;
      relation_to_weights: string | null;
      attention_points: string[] | null;
    };
    return {
      id: linha.professional_profile_id,
      justification: linha.justification ?? "",
      relationToWeights: linha.relation_to_weights ?? "",
      attentionPoints: linha.attention_points ?? [],
    };
  });

  const entregue = Boolean((relatorio as { delivered_at: string | null } | null)?.delivered_at);

  // `SIM-49`: o painel de composição abre com o que já foi decidido. A ordem é
  // a que o Curador escolheu ao compor — `position`, nunca a de chegada.
  const jaComposta = composta
    ? {
        escolhidos: [...composta.curated_selection_options]
          .sort((a, b) => a.position - b.position)
          .map((opcao) => ({
            id: opcao.professional_profile_id,
            rationale: opcao.rationale,
            tradeOff: opcao.trade_off ?? "",
          })),
        composicao: composta.composition_rationale ?? "",
        entregue,
      }
    : null;

  return (
    <main className="mx-auto flex max-w-[80rem] flex-col gap-8 px-6 py-10">
      <header className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-wide text-ink-muted">
          Mesa de Curadoria · ADR-093
        </p>
        <h1 className="text-2xl font-medium text-ink">A Mesa pelas preocupações dela</h1>
        <p className="max-w-3xl text-sm text-ink-muted">
          Cada linha é uma coisa que {primeiroNome} disse. Aqui se registra o que ela contou,
          se julga o que ela não tem como pedir, se compõem os três caminhos e se escreve o
          que ela vai reler sozinha.
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
      {/* O ÍNDICE DAS PENDÊNCIAS vem primeiro porque a página tem onze telas
          e ninguém segura isso na cabeça. Não é o espelho que a auditoria F-6
          encolheu na Mesa antiga: lá ele repetia a etapa em foco; aqui não
          existe etapa em foco, e o que ele faz é dar o todo em um lugar. */}
      <OQueDependeDeVoce itens={atencao} />

      {/* SEM PERFIL, NADA DISTO EXISTE — e a tela precisa oferecer a saída.
          Um aviso que anuncia o que não resolve é beco sem saída, e beco sem
          saída é a forma mais cara de carga cognitiva: a pessoa procura em
          todo lugar antes de concluir que não existe.

          Abrir a Consulta Inicial é ato DELE, com autor registrado — o
          sistema não cria o Perfil sozinho ao abrir a tela (UX_PRINCIPLES P5). */}
      {!perfil ? (
        <section className="flex flex-col gap-3 rounded-md border border-border px-4 py-4">
          <h2 className="text-lg font-medium text-ink">Esta Curadoria ainda não começou</h2>
          <p className="max-w-3xl text-sm text-ink-muted">
            O Perfil de Prioridades é onde tudo abaixo se apoia: sem ele não há onde gravar o
            que importa para {primeiroNome}, nem o que elimina alguém desta Curadoria.
          </p>
          <StartPriorityProfile caseId={id} patientFirstName={primeiroNome} />
        </section>
      ) : null}

      <section id="quem-pode-participar" className="flex flex-col gap-4">
        <header className="flex flex-col gap-1">
          <h2 className="text-lg font-medium text-ink">Quem pode participar desta Curadoria</h2>
          <p className="max-w-3xl text-sm text-ink-muted">{view.nextStep}</p>
        </header>

        {/* O QUE ELIMINA vem ANTES de quem sobrou, porque é o que produz o
            "quem sobrou". Na Mesa antiga ele morava na etapa do Perfil, longe
            do efeito; aqui fica onde a consequência é lida — mesmo princípio
            que trouxe o juízo para dentro da célula (ADR-093). */}
        {perfil ? (
          <MandatoryFilters
            priorityProfileId={(perfil as { id: string }).id}
            patientFirstName={primeiroNome}
            readOnly={view.profileAcknowledged}
            filters={filtrosDoPerfil}
            preferences={preferenciasDoPerfil}
          />
        ) : null}

        <EligibilityPanel view={view} />
      </section>

      {/* A classificação vem ANTES da comparação, porque sem ela o Motor não
          cruza nada — e a tabela abaixo mostraria "falta você declarar" em
          cada célula. A ordem da tela é a ordem do trabalho. */}
      <div id="quanto-importa" className="scroll-mt-4">
        <ClassificarImportancia caseId={id} itens={paraClassificar} />
      </div>

      <div id="o-que-ela-pediu" className="scroll-mt-4">
        <ComparacaoPorPreocupacoes caseId={id} {...mesa} juizoVigente={juizoVigente} />
      </div>

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

      <div id="compor-os-tres" className="scroll-mt-4">
        <ComporOsTres
          priorityProfileId={(perfil as { id: string } | null)?.id ?? null}
          linhas={mesa.linhas}
          profissionais={mesa.profissionais}
          jaComposta={jaComposta}
        />
      </div>

      <div id="o-relatorio" className="scroll-mt-4">
        <EscreverORelatorio
          priorityProfileId={(perfil as { id: string } | null)?.id ?? null}
          linhas={mesa.linhas}
          profissionais={mesa.profissionais}
          escolhidos={escolhidos}
          composicaoJaEscrita={composta?.composition_rationale ?? ""}
          jaEscrito={jaEscrito}
          entregue={entregue}
        />
      </div>

      <EmitirEEntregar
        priorityProfileId={(perfil as { id: string } | null)?.id ?? null}
        curatedSelectionId={(selecao as { id: string } | null)?.id ?? null}
        nomeDaPaciente={nomeDaPaciente}
        emitido={Boolean((relatorio as { emitted_at: string | null } | null)?.emitted_at)}
        entregue={entregue}
        temRelatorio={Boolean(relatorio)}
      />
    </main>
  );
}
