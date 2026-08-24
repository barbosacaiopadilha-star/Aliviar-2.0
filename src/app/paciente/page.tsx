import Link from "next/link";
import type { Metadata } from "next";

import { BlocoCuradoria } from "@/components/paciente/bloco-curadoria";
import { ConciergeCard } from "@/components/paciente/concierge-card";
import { PatientHomeState } from "@/components/paciente/patient-home-state";
import { AmbientHero } from "@/components/paciente/experiencia/ambient-hero";
import { CuradoriaNaoIniciada } from "@/components/paciente/experiencia/estados-vazios";
import {
  AcaoPrincipal,
  PorqueEDepois,
  ProximaAcao,
} from "@/components/paciente/experiencia/proxima-acao";
import { PatientWelcome } from "@/components/paciente/dashboard/patient-primitives";
import { derivePatientPending } from "@/modules/paciente/next-action";
import { nomeDoCuradorDoCaso } from "@/modules/paciente/nome-do-curador";
import { currentHourInBrazil, greetingFor } from "@/modules/paciente/ambiente";
// CORTE FUNDO DE 23/08 · com a Home reduzida a um cartão, os carregadores do
// Perfil, do modelo do reconhecimento e da lista de documentos saíram daqui:
// nada nesta tela os consome mais. Eles seguem em uso — o Mapa de Prioridades
// em "Meus dados", a lista em "Documentos" —, cada um na tela que o mostra.
import { STAGE_EYEBROWS } from "@/modules/paciente/experiencia";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireRole } from "@/modules/auth/guard";
import { getPatientCaseOverview } from "@/modules/cases";
import { buildJornada } from "@/modules/curadoria/jornada";
import { listCaseIds, loadCuradoriaRecord } from "@/modules/curadoria/cos/repository";
import { listStoriesForProfile } from "@/modules/story/repository";
import { lerEstado } from "@/foundation/contrato-de-estado";
import { lerFatosDoCaso } from "@/modules/paciente/fatos-do-caso";
import { loadPatientCuradoria } from "@/modules/curadoria/patient-curadoria";

// A aba desta página dizia "Minha Jornada" — mas "Sua Jornada" é OUTRA página
// (`/paciente/linha-do-tempo`, rótulo fixado na decisão A4). Com duas abas
// chamadas "Jornada", o histórico do navegador não distinguia a home do
// percurso. A aba passa a usar o mesmo nome que o menu já dá a esta página.
export const metadata: Metadata = {
  title: "Início",
  robots: { index: false, follow: false },
};

/* ENXUGAMENTO DE 23/08 · `MARCO_HREFS` saiu com a régua. Ele existia para
   dar destino aos seis marcos, e os marcos agora só aparecem em "Sua
   Jornada". Os destinos em si continuam de pé — inclusive `/paciente/perfil`,
   que passou a ser a casa do Mapa de Prioridades. */

/** Link de leitura: sublinhado fino, sem virar botão nem competir com a ação. */
const LINK_DISCRETO =
  "text-[var(--patient-acento)] underline underline-offset-4 decoration-[color-mix(in_srgb,var(--patient-acento)_35%,transparent)] hover:decoration-[var(--patient-acento)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2";

/**
 * A HOME DA PACIENTE — UM CARTÃO E UMA LINHA (corte fundo de 23/08).
 *
 * Decisão do Fundador: "vamos manter apenas o que for essencial". A Home
 * responde três perguntas de quem abre o telefone — onde eu estou, o que eu
 * faço agora, e por quê — e nada mais. Tudo o que ela mostrava além disso já
 * tem casa própria nos quatro itens do menu, e repetir cada uma aqui em bloco
 * próprio gastava cinco telas de telefone para uma operação de quatro atos.
 *
 * O que saiu daqui e para onde foi:
 *
 * - **`MeuResumo` ("Suas coisas")** — história, documentos e relatório são
 *   itens do menu; o estado de cada coisa é dito na tela dela.
 * - **`ProfileCard`** — o Mapa de Prioridades passou a morar em "Meus dados",
 *   para onde a régua dos marcos já apontava.
 * - **`CuradoriaCard`** — "Minha Curadoria" é um item do menu, e é lá que
 *   vive o cartão do caminho escolhido, que é a entrega.
 * - **`JourneyWalk` e `QuemAcompanha`** — a régua dos seis marcos virou o
 *   link "Ver sua Jornada inteira"; quem cuida virou uma linha ao lado dele.
 * - **`QuickLinks`** (A3b, antes) — era uma segunda barra de navegação.
 *
 * Nenhum componente foi apagado e nenhuma rota caiu: o que saiu foi a
 * repetição, não a informação.
 */
export default async function PacienteHomePage() {
  const authState = await requireRole("paciente");
  const supabase = await createServerSupabaseClient();

  const [stories, caseOverview, caseIds] = await Promise.all([
    listStoriesForProfile(supabase, authState.user.id),
    getPatientCaseOverview(supabase, authState.user.id),
    listCaseIds(supabase),
  ]);

  const record = caseIds.length > 0 ? await loadCuradoriaRecord(supabase, caseIds[0]) : null;
  // 2.6/G-10: o nome do Curador vem da capability nominal — a RLS de
  // `profiles` segue fechada para ela. Sem desfecho OK, o fallback genérico
  // do registro permanece; superfícies internas não passam por aqui.
  const nomeDoCurador = record ? await nomeDoCuradorDoCaso(supabase, record.caseId) : null;
  const jornada = record
    ? buildJornada(nomeDoCurador ? { ...record, curatorName: nomeDoCurador } : record)
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
  if (!record || !jornada) {
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
        {/* CORTE FUNDO DE 23/08 · "Suas coisas" saiu também daqui. Antes de
            existir Case ele dizia três vezes que nada existe ainda — e
            `CuradoriaNaoIniciada`, logo abaixo, já diz isso uma vez, com
            acolhimento em vez de inventário. */}
        <CuradoriaNaoIniciada />
        {/* C3 · Track C, emendada em 24/08 (decisão do Fundador): a porta
            existe desde o primeiro dia — e deixou de ser linha escondida
            para ser ferramenta com card e botão. */}
        <ConciergeCard topic="jornada" />
      </div>
    );
  }

  // MERGE DE 23/08 (decisão do Fundador: "às vezes tem muita página"): o
  // botão do hero apontava para /paciente/curadoria — que agora É esta
  // página. Um botão que leva para onde a pessoa já está é ruído; quando o
  // destino é aqui, o conteúdo logo abaixo é a resposta e o botão some. As
  // outras ações (continuar a história, por exemplo) continuam com botão.
  const cta = pending.kind === "nothing" ? null : pending.action.cta;
  const acaoNoHero =
    cta && cta.href !== "/paciente/curadoria" ? <AcaoPrincipal pending={pending} /> : null;

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      {/* CORTE FUNDO + MERGE DE 23/08. O topo responde as três perguntas de
          quem abre o telefone — onde eu estou, o que eu faço agora, e por
          quê — e logo abaixo vem a operação inteira: a Curadoria. Duas
          telas viraram uma; a rota antiga redireciona para cá.

          O que saiu da Home em cortes anteriores continua onde foi parar:
          "Suas coisas" → menu; Mapa de Prioridades → Meus dados; régua dos
          seis marcos → Sua Jornada, pelo link abaixo. */}
      <AmbientHero
        firstName={firstName}
        stage={jornada.currentStage}
        eyebrow={STAGE_EYEBROWS[jornada.currentStage]}
        greeting={saudacao}
        estado={{ texto: leitura.rotuloPaciente, papel: leitura.tom }}
        acao={
          <div className="space-y-5">
            {acaoNoHero}
            <PorqueEDepois pending={pending} curatorName={jornada.curatorName} />
          </div>
        }
      />

      {/* Uma linha: quem está com você agora (reconhecimento, não canal) e a
          porta do percurso inteiro, para quem quiser o histórico. */}
      <p className="text-sm text-[var(--color-ink-muted)]">
        {jornada.currentResponsible?.name ? (
          <>
            <span className="font-medium text-[var(--patient-ink)]">
              {jornada.currentResponsible.name}
            </span>{" "}
            está com você agora ·{" "}
          </>
        ) : null}
        <Link href="/paciente/linha-do-tempo" className={LINK_DISCRETO}>
          Ver sua Jornada inteira
        </Link>
      </p>

      {/* A CURADORIA — a operação em si, na mesma página que o estado.
          `loadPatientCuradoria` só devolve com `delivered_at`: antes da
          entrega este bloco simplesmente não existe, e o topo já diz onde
          o caso está. */}
      {/* Invocado como função (não como JSX): componente-servidor async
          aninhado quebra o renderer dos testes de composição, e aqui dentro
          já estamos no servidor — o resultado é o mesmo JSX. */}
      {curadoriaEntregue ? await BlocoCuradoria({ supabase, curadoria: curadoriaEntregue }) : null}

      {/* O CONCIERGE COMO FERRAMENTA (decisão do Fundador, 24/08): o quarto
          ato fecha a página em QUALQUER estado, como card com botão — abaixo
          de tudo que é leitura e decisão, nunca no meio delas. O tópico é o
          da jornada; a linha da Mesa (tópico curadoria) continua onde está. */}
      <ConciergeCard topic={curadoriaEntregue ? "curadoria" : "jornada"} />
    </div>
  );
}

/* CORTE FUNDO DE 23/08 · as auxiliares textoDaHistoria e MeuResumo viviam
   aqui, no pé desta página, e só serviam ao bloco "Suas coisas". Saíram com
   ele: o estado da história é dito na tela da história, o dos documentos na
   central de documentos, e o do Relatório em Minha Curadoria — cada um onde a
   pessoa já foi para vê-lo, sem uma quarta cópia na Home. */
