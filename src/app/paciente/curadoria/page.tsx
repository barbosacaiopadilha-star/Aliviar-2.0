import Link from "next/link";

import type { Metadata } from "next";

import { PatientEmptyState } from "@/components/paciente/dashboard/patient-primitives";
import { ConnectionChoicePanel } from "@/components/patient/connection-choice-panel";
import { CuradoriaDecisionPanel } from "@/components/patient/curadoria-decision-panel";
import { ContactModePanel } from "@/components/patient/contact-mode-panel";
import { FinalCuradoriaView } from "@/components/patient/final-curadoria-view";
import { RelationshipStatusPanel } from "@/components/patient/relationship-status-panel";
import { CaminhosPanel } from "@/components/paciente/caminhos/caminhos-panel";
import { Limiar } from "@/components/paciente/experiencia/limiar";
import { loadPatientCuradoria } from "@/modules/curadoria/patient-curadoria";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireRole } from "@/modules/auth/guard";
import { getLatestFinalCuradoriaDeliveryForPatient } from "@/modules/concierge";
import { SupabaseConnectionRepository } from "@/modules/connection";
import { SupabaseRelationshipRepository } from "@/modules/relationship";

export const metadata: Metadata = {
  title: "Minha Curadoria",
  robots: { index: false, follow: false },
};

export default async function PatientCuradoriaPage() {
  const authState = await requireRole("paciente");
  const supabase = await createServerSupabaseClient();

  const delivery = await getLatestFinalCuradoriaDeliveryForPatient(supabase, authState.user.id);

  // A Curadoria do Método (COS): as três opções que o Curador entregou, com o
  // parecer de cada uma, e o lugar onde ELA registra a decisão. A RLS libera a
  // leitura pelo `delivered_at` do Relatório e só aceita a decisão da própria
  // pessoa — por isso este painel vive aqui, e não no portal do Curador.
  const curadoria = await loadPatientCuradoria(supabase);

  if (!delivery && !curadoria) {
    return (
      <PatientEmptyState
        title="Ainda não há relatórios aqui."
        description="Quando sua curadoria finalizar os três caminhos, eles aparecerão com calma neste espaço — para reler com a família ou levar à consulta."
      />
    );
  }

  // O Case do qual o acompanhamento depende — vindo da Curadoria do Método
  // quando ela existe, e só então do registro legado. Antes, Connection e
  // Relationship só apareciam se houvesse entrega do motor antigo: pelo
  // caminho canônico a pessoa lia as três opções e não tinha como seguir.
  const caseId = curadoria?.caseId ?? delivery?.caseId ?? null;

  const connection = caseId
    ? await new SupabaseConnectionRepository(supabase).findByCaseId(caseId)
    : null;

  const relationship =
    caseId && connection?.status === "PRIMEIRO_ATENDIMENTO_REALIZADO"
      ? await new SupabaseRelationshipRepository(supabase).findByCaseId(caseId)
      : null;

  // As três opções entregues, na forma que os painéis de acompanhamento leem.
  // Só os campos com correspondência real são preenchidos: `attentionPoints`
  // é o que a opção custa, e é exatamente o que o painel chama de limitação.
  const options = curadoria
    ? curadoria.options.map((option) => ({
        providerId: option.professionalProfileId,
        displayName: option.professionalName,
        professionalSummary: option.relationToWeights,
        whyIncluded: option.justification,
        strengthsForThisCase: option.favorablePoints,
        relevantLimitations: option.attentionPoints,
        practicalConsiderations: [],
      }))
    : (delivery?.providerPresentations ?? []);

  // A página é uma travessia, não uma pilha (TRAVESSIA_DA_PACIENTE.md):
  // o eco da Sala e a Mesa vivem dentro de CaminhosPanel; a porta seguinte
  // se chama "A decisão" enquanto ela não decidiu, e "Seu acompanhamento"
  // depois — a casa simplesmente continua, sem celebração. O formato legado
  // (FinalCuradoriaView) recua para o fim como documento histórico quando a
  // Curadoria do Método existe; sozinho, segue sendo o conteúdo principal.
  // Depois do primeiro atendimento, o presente tem um nome só: a varanda
  // abre a página e a Mesa recua — permanece visitável logo abaixo (nada
  // fecha atrás dela, L5), mas as alternativas saem de cena (A_DECISAO §8).
  const varandaPrimeiro = Boolean(relationship);

  // B3-R · ARQUITETURA E — a pessoa é nomeada UMA vez, no fato canônico.
  //
  // `decided` já está aqui desde sempre: o loader consulta
  // `patient_curadoria_decisions` e a rota o descartava. Nenhuma consulta
  // nova, nenhum loader novo (L1).
  const decisao = curadoria?.decision ?? null;

  // H4 · caminho legado (só o documento antigo): nada muda. O painel de
  // conexão mantém os três e a correção completa.
  const legado = !curadoria && Boolean(delivery);

  // H2 · no caminho canônico a conexão NUNCA pergunta "com quem" de novo:
  // recebe o já decidido, ou o do próprio `connection` quando ele existe sem
  // decisão. Filtrado no CALL SITE — o componente não muda (L6).
  const opcoesDaConexao = legado
    ? options
    : options.filter((opcao) => {
        if (decisao?.outcome === "CHOSEN") return opcao.displayName === decisao.chosenName;
        if (connection) return opcao.providerId === connection.professionalProfileId;
        return false;
      });

  // H3 · quem disse que nenhuma serviu não recebe "com quem seguir?".
  // Perguntar isso seria incoerente e cruel.
  const mostrarConexao =
    legado || connection !== null || decisao?.outcome === "CHOSEN";

  const blocoAcompanhamento =
    caseId && options.length > 0 ? (
      <>
        <Limiar nome={connection ? "Seu acompanhamento" : "A decisão"} />
        {/* Um foco perceptivo por vez: quando o Relationship existe, ele é
            o fato principal e abre a varanda; o restante vira memória e
            gesto possível abaixo — nunca painéis com a mesma força. */}
        <div className="max-w-[44rem] space-y-8">
          {relationship ? (
            <RelationshipStatusPanel
              caseId={caseId}
              relationship={relationship}
              providerPresentations={options}
            />
          ) : null}
          {/* §J · a superfície canônica mora AQUI: sob o Limiar que já se
              chama "A decisão", abaixo da varanda (que é o presente) e ACIMA
              da conexão (que pressupõe decisão). Nenhum Limiar novo, nenhuma
              seção nova. Havendo `relationship`, é omitida: um foco
              perceptivo por vez, doutrina já escrita nesta página. */}
          {curadoria && !relationship ? (
            <CuradoriaDecisionPanel
              curatedSelectionId={curadoria.curatedSelectionId}
              options={curadoria.options.map((opcao) => ({
                id: opcao.id,
                professionalName: opcao.professionalName,
              }))}
              decided={decisao}
            />
          ) : null}

          {/* H3 · quem disse que nenhuma serviu não recebe "com quem seguir?".
              H2 · e quem já decidiu não escolhe de novo: a conexão recebe só o
              profissional já nomeado no fato canônico. */}
          {mostrarConexao ? (
            <ConnectionChoicePanel
              caseId={caseId}
              providerPresentations={opcoesDaConexao}
              connection={connection}
            />
          ) : null}

          {connection ? (
            <ContactModePanel caseId={caseId} connection={connection} />
          ) : null}
        </div>
      </>
    ) : null;

  const blocoMesa = curadoria ? (
    <>
      {varandaPrimeiro ? <Limiar nome="A Mesa — para reler quando quiser" /> : null}
      <CaminhosPanel curadoria={curadoria} />

      {/* O PDF pertence à Mesa: material de consulta — para reler com a
          família ou levar à consulta —, nunca ação principal. Link de texto
          discreto, sem competir com os três caminhos (Etapa Mesa §10).

          Item 1.7 (A5): o link deixou de depender da entrega legada. Ele
          existia só quando havia documento legado — quem tinha apenas a
          Curadoria do Método não tinha PDF nenhum. */}
      <p className="mt-10">
        <Link
          href="/paciente/curadoria/imprimir"
          className="text-sm font-medium text-[var(--patient-acento)] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
        >
          Levar em PDF — para reler com a família ou na consulta
        </Link>
      </p>
    </>
  ) : null;

  return (
    <div className="pb-16">
      {varandaPrimeiro ? blocoAcompanhamento : blocoMesa}

      {/* Item 1.7 (P9/RI5 · critério X4): UMA entrega, sempre. Quando existe a
          Curadoria do Método, é ela — e só ela. O formato legado aparece
          apenas para quem não tem outro: nada é apagado, e ninguém perde o
          documento que já recebeu (DP-2: histórico preservado). O que saiu
          daqui foi a SEGUNDA entrega, que exibia os dois ao mesmo tempo. */}
      {!curadoria && delivery ? <FinalCuradoriaView delivery={delivery} /> : null}

      {varandaPrimeiro ? blocoMesa : blocoAcompanhamento}

      {/* Entrega apenas no formato legado: o documento é o conteúdo
          principal, e o PDF o acompanha. O rótulo "Baixar em PDF" permanece
          aqui — é o que o e2e e a paciente desse formato conhecem. */}
      {!curadoria && delivery ? (
        <div className="mt-16">
          <Link
            href="/paciente/curadoria/imprimir"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] bg-white px-5 py-2.5 text-sm font-medium text-[var(--patient-ink)] shadow-sm transition-all hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
          >
            Baixar em PDF
          </Link>
        </div>
      ) : null}
    </div>
  );
}
