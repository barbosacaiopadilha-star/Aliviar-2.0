import Link from "next/link";
import type { Metadata } from "next";

import { PatientHomeState } from "@/components/paciente/patient-home-state";
import { AmbientHero } from "@/components/paciente/experiencia/ambient-hero";
import { CuradoriaNaoIniciada } from "@/components/paciente/experiencia/estados-vazios";
import { CuradoriaCard } from "@/components/paciente/experiencia/curadoria-card";
import { JourneyWalk, type WalkStage } from "@/components/paciente/experiencia/journey-walk";
import { ProfileCard } from "@/components/paciente/experiencia/profile-card";
import { ProximaAcao } from "@/components/paciente/experiencia/proxima-acao";
import { QuemAcompanha } from "@/components/paciente/experiencia/quem-acompanha";
import { PatientWelcome } from "@/components/paciente/dashboard/patient-primitives";
import { derivePatientPending } from "@/modules/paciente/next-action";
import { nomeDoCuradorDoCaso } from "@/modules/paciente/nome-do-curador";
import { currentHourInBrazil, greetingFor } from "@/modules/paciente/ambiente";
import {
  mensagemPrincipal,
  STAGE_EYEBROWS,
  WALK_HREFS,
  WALK_LABELS,
  walkStatusOf,
} from "@/modules/paciente/experiencia";
import { loadComoQuerSerCuidada, loadPatientPerfil } from "@/modules/paciente/experiencia-loader";
import { loadModeloDoReconhecimento } from "@/modules/paciente/reconhecimento-model";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireRole } from "@/modules/auth/guard";
import { getPatientCaseOverview } from "@/modules/cases";
import { buildJornada } from "@/modules/curadoria/jornada";
import { listCaseIds, loadCuradoriaRecord } from "@/modules/curadoria/cos/repository";
import { listStoriesForProfile } from "@/modules/story/repository";
import { listPatientDocuments } from "@/modules/profiles/patient-document-repository";
import { lerEstado } from "@/foundation/contrato-de-estado";
import { lerFatosDoCaso } from "@/modules/paciente/fatos-do-caso";
import { loadPatientCuradoria } from "@/modules/curadoria/patient-curadoria";

export const metadata: Metadata = {
  title: "Minha Jornada",
  robots: { index: false, follow: false },
};

/** Link de leitura: sublinhado fino, sem virar botão nem competir com a ação. */
const LINK_DISCRETO =
  "text-[var(--patient-acento)] underline underline-offset-4 decoration-[color-mix(in_srgb,var(--patient-acento)_35%,transparent)] hover:decoration-[var(--patient-acento)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2";

/**
 * A home da paciente — cinco níveis, em uma coluna.
 *
 * 1 estado atual · 2 próxima ação · 3 quem acompanha · 4 jornada resumida ·
 * 5 suas coisas. A hierarquia é feita por **espaço, versalete, serifa e fio**
 * — não por cartões empilhados.
 *
 * A3b · o que saiu, e por quê:
 *
 * - **`QuickLinks`** era uma segunda barra de navegação dentro da página. Seus
 *   quatro destinos já estão no menu do `PatientShell`, que acompanha a
 *   paciente em toda a casa; repeti-los no rodapé da Home não dava acesso
 *   novo, só somava peso. Nenhum destino foi perdido.
 * - **os cartões** — `MeuResumo`, `ProfileCard` e o cartão da Curadoria eram
 *   quatro superfícies com fundo, borda e sombra disputando o mesmo olhar. A
 *   referência visual da Aliviar não tem cartão flutuante em lugar nenhum: ela
 *   separa assuntos por faixa e fio. A Home passa a falar essa língua.
 * - **o eyebrow de etapa no topo** repetia o que a régua já dizia melhor. No
 *   lugar dele entrou o macroestado do contrato — que a Home lia e não exibia.
 */
export default async function PacienteHomePage() {
  const authState = await requireRole("paciente");
  const supabase = await createServerSupabaseClient();

  const [stories, caseOverview, caseIds, documentos] = await Promise.all([
    listStoriesForProfile(supabase, authState.user.id),
    getPatientCaseOverview(supabase, authState.user.id),
    listCaseIds(supabase),
    listPatientDocuments(supabase, authState.user.id),
  ]);

  const record = caseIds.length > 0 ? await loadCuradoriaRecord(supabase, caseIds[0]) : null;
  // 2.6/G-10: o nome do Curador vem da capability nominal — a RLS de
  // `profiles` segue fechada para ela. Sem desfecho OK, o fallback genérico
  // do registro permanece; superfícies internas não passam por aqui.
  const nomeDoCurador = record ? await nomeDoCuradorDoCaso(supabase, record.caseId) : null;
  const jornada = record
    ? buildJornada(nomeDoCurador ? { ...record, curatorName: nomeDoCurador } : record)
    : null;
  const perfil = record ? await loadPatientPerfil(supabase, record.caseId) : null;
  // ADR-065 — o bloco relacional do Perfil: as respostas dela, nada inferido.
  const comoQuerSerCuidada = record ? await loadComoQuerSerCuidada(supabase, record.caseId) : [];
  // Etapa 2B — a comparação que ela vê ao reconhecer o Perfil é montada AQUI,
  // no servidor, e desce pronta. Nenhuma tela abaixo volta ao banco.
  const modeloDoReconhecimento = record
    ? await loadModeloDoReconhecimento(supabase, record.caseId)
    : null;

  // FATOS → CONTRATO CONGELADO → PROJEÇÃO. A Home deixou de decidir
  // macroestado: ela lê o que a Fundação leu, e é a mesma leitura que a
  // Jornada consome. Duas telas, uma verdade.
  //
  // `loadPatientCuradoria` é a prova de entrega: ele se recusa a devolver
  // Curadoria sem `delivered_at`, então não há como confundir emitir com
  // entregar por este caminho.
  const curadoriaEntregue = record ? await loadPatientCuradoria(supabase) : null;
  const fatos = await lerFatosDoCaso(supabase, {
    storyStatuses: stories.map((story) => story.status),
    caseId: caseOverview?.caseId ?? null,
    curadoriaEntregueEm: curadoriaEntregue?.deliveredAt ?? null,
  });
  const leitura = lerEstado(fatos);
  const pending = derivePatientPending({ leitura, jornada });

  const saudacao = greetingFor(currentHourInBrazil());
  const displayName = authState.profile?.displayName ?? "Paciente";
  const firstName = displayName.split(/\s+/)[0] ?? displayName;

  // Sem Case ainda: a jornada não começou, e a home diz isso sem simular
  // uma trilha vazia.
  if (!jornada) {
    return (
      <div className="mx-auto max-w-3xl space-y-8">
        <PatientWelcome name={displayName} subtitle={`${saudacao}. Estamos por aqui.`} />
        {/* A3a · o estado diz ONDE ela está; a ação, logo abaixo, diz o que
            depende dela. `acaoEmOutroLugar` evita que a mesma pendência seja
            oferecida duas vezes na mesma dobra. */}
        <PatientHomeState
          leitura={leitura}
          statusLabel={caseOverview?.statusLabel ?? null}
          acaoEmOutroLugar
        />
        <ProximaAcao pending={pending} />
        {/* O resumo do que já é dela vale desde o primeiro dia — antes de
            existir Case, ele diz com honestidade o que ainda não existe. */}
        <MeuResumo
          historia={stories[0]?.data.historia ?? null}
          documentos={documentos.length}
          relatorioEmitido={false}
        />
        <CuradoriaNaoIniciada />
      </div>
    );
  }

  const walkStages: WalkStage[] = jornada.stages.map((stage) => ({
    id: stage.id,
    label: WALK_LABELS[stage.id],
    status: walkStatusOf(stage.status),
    // A RLS continua sendo a autoridade: o link leva a uma superfície dela,
    // e o que ela pode ver lá é decidido no servidor, não aqui.
    href: WALK_HREFS[stage.id],
  }));

  const currentStage = jornada.stages.find((stage) => stage.id === jornada.currentStage);

  // A ação principal do cartão da Curadoria: onde ela continua. Só existe
  // quando há de fato uma tela para continuar.
  const curadoriaAction =
    jornada.currentStage === "DOSSIE" ||
    jornada.currentStage === "REUNIAO" ||
    jornada.currentStage === "ESCOLHA" ||
    jornada.currentStage === "ACOMPANHAMENTO"
      ? { label: "Acompanhar", href: "/paciente/curadoria" }
      : undefined;

  // A3b · a régua não repete a frase que a próxima ação já disse.
  //
  // `derivePatientPending`, quando nada aguarda a paciente, usa a DESCRIÇÃO DA
  // ETAPA ATUAL como "o que acontece depois". É literalmente a mesma string que
  // a régua exibia logo abaixo — a mesma frase, dois blocos de distância. O
  // topo responde "o que está acontecendo agora"; a régua responde "onde isso
  // fica no percurso". Quando as duas coincidem, quem cala é a régua.
  const detalheDaEtapa =
    pending.kind === "nothing" && pending.whatHappensNext === currentStage?.description
      ? undefined
      : currentStage?.description;

  return (
    <div className="mx-auto max-w-3xl space-y-14">
      {/* NÍVEL 1 · o que está acontecendo agora. */}
      <AmbientHero
        firstName={firstName}
        stage={jornada.currentStage}
        eyebrow={STAGE_EYEBROWS[jornada.currentStage]}
        greeting={saudacao}
        estado={{ texto: leitura.rotuloPaciente, papel: leitura.tom }}
      />

      {/* NÍVEL 2 · a próxima ação (A3a — comportamento intocado). */}
      <ProximaAcao pending={pending} curatorName={jornada.curatorName} />

      {/* NÍVEL 3 · quem acompanha. Uma linha: a pessoa quer reconhecer um
          nome, não abrir um canal de atendimento. */}
      <QuemAcompanha responsavel={jornada.currentResponsible} />

      {/* NÍVEL 4 · a jornada resumida — orientação, não cobrança. */}
      <JourneyWalk
        stages={walkStages}
        currentDetail={detalheDaEtapa}
        curatorName={jornada.curatorName}
      />

      {/* NÍVEL 5 · o que já é dela. */}
      <MeuResumo
        historia={stories[0]?.data.historia ?? null}
        documentos={documentos.length}
        relatorioEmitido={Boolean(record?.relatorio.emittedAt)}
      />

      {/* A grade de duas colunas saiu: ela dava a MESMA importância ao Perfil
          e à Curadoria, lado a lado, com o mesmo peso do estado e da ação. Em
          fluxo, cada um recebe o peso que tem. */}
      {perfil && record ? (
        <ProfileCard
          perfil={perfil}
          caseId={record.caseId}
          observations={record.prioridades.observations}
          validatedAt={record.validacao?.validatedAt ?? null}
          curatorName={jornada.curatorName}
          comoQuerSerCuidada={comoQuerSerCuidada}
          modelo={modeloDoReconhecimento ?? undefined}
        />
      ) : null}

      {/* A3a · o `aside` saiu daqui. Ele dizia "isso acontece na conversa com
          X" — a MESMA frase que `ProximaAcao` agora diz no nível 2, e dizia-a
          no nível 4, onde ninguém procura o que precisa fazer.

          A3b · e o cartão só continua cartão quando há para onde ir. Sem ação,
          ele era uma superfície grande com uma frase curta no meio — o "card
          vazio" que dominava o fim da página. */}
      <CuradoriaCard
        message={mensagemPrincipal(jornada.currentStage)}
        action={curadoriaAction}
        peso={curadoriaAction ? "cartao" : "discreto"}
      />
    </div>
  );
}

/**
 * O resumo do que já é da pessoa (ETAPA 9): a história dela, os documentos
 * dela, e o estado do Relatório — sempre dados reais, nunca texto fictício.
 * O que não existe ainda simplesmente não aparece como se existisse.
 */
function MeuResumo({
  historia,
  documentos,
  relatorioEmitido,
}: {
  historia: string | null;
  documentos: number;
  relatorioEmitido: boolean;
}) {
  const resumoDaHistoria = historia?.trim()
    ? historia.trim().length > 220
      ? `${historia.trim().slice(0, 220)}…`
      : historia.trim()
    : null;

  return (
    <section aria-labelledby="meu-resumo-titulo" className="border-t border-[var(--color-border)] pt-8">
      <h2
        id="meu-resumo-titulo"
        className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-[var(--color-ink-muted)]"
      >
        Suas coisas
      </h2>

      {/* A3b · o padrão de colunas da Aliviar pública: fio vertical entre os
          assuntos, nunca caixa em volta de cada um. O `divide-*` só desenha
          nas divisas internas, e some no empilhamento do mobile. */}
      <dl className="mt-6 grid gap-6 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-[var(--color-border)]">
        <div className="sm:pr-6">
          <dt className="text-sm font-medium text-[var(--patient-ink)]">Sua história</dt>
          <dd className="mt-2 text-sm leading-relaxed text-[var(--color-ink-muted)]">
            {resumoDaHistoria ?? (
              <>
                Você ainda não contou sua história.{" "}
                <Link href="/sua-historia/continuar" className={LINK_DISCRETO}>
                  Começar agora
                </Link>
              </>
            )}
          </dd>
        </div>

        <div className="sm:px-6">
          <dt className="text-sm font-medium text-[var(--patient-ink)]">Documentos</dt>
          <dd className="mt-2 text-sm leading-relaxed text-[var(--color-ink-muted)]">
            {documentos === 0 ? "Nenhum documento enviado." : `${documentos} documento(s) enviado(s).`}{" "}
            <Link href="/paciente/documentos" className={LINK_DISCRETO}>
              Ver
            </Link>
          </dd>
        </div>

        <div className="sm:pl-6">
          <dt className="text-sm font-medium text-[var(--patient-ink)]">Relatório</dt>
          <dd className="mt-2 text-sm leading-relaxed text-[var(--color-ink-muted)]">
            {relatorioEmitido ? (
              <>
                Pronto para você.{" "}
                <Link href="/paciente/curadoria" className={LINK_DISCRETO}>
                  Abrir
                </Link>
              </>
            ) : (
              "Em preparação pela sua Curadoria."
            )}
          </dd>
        </div>
      </dl>
    </section>
  );
}
