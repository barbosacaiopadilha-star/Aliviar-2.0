import Link from "next/link";
import type { SupabaseClient } from "@supabase/supabase-js";

import { ConciergeLink } from "@/components/paciente/concierge-link";
import { ConnectionChoicePanel } from "@/components/patient/connection-choice-panel";
import { CuradoriaDecisionPanel } from "@/components/patient/curadoria-decision-panel";
import { ContactModePanel } from "@/components/patient/contact-mode-panel";
import { RelationshipStatusPanel } from "@/components/patient/relationship-status-panel";
import { CaminhosPanel } from "@/components/paciente/caminhos/caminhos-panel";
import { Limiar } from "@/components/paciente/experiencia/limiar";
import type { PatientCuradoria } from "@/modules/curadoria/patient-curadoria";
import { SupabaseConnectionRepository } from "@/modules/connection";
import { SupabaseRelationshipRepository } from "@/modules/relationship";

/**
 * O BLOCO DA CURADORIA — a travessia inteira, agora dentro do Início.
 *
 * MERGE DE 23/08 (decisão do Fundador: "às vezes tem muita página"). Depois
 * do corte fundo, a Home tinha virado um cartaz de um botão só — e o botão
 * apontava para cá. Duas telas para um assunto: a primeira só apresentava a
 * segunda. Agora `/paciente` É a Curadoria, com o estado no topo; a rota
 * `/paciente/curadoria` redireciona (links antigos, PDF e oráculos seguem
 * funcionando) e `/paciente/curadoria/imprimir` continua rota própria.
 *
 * O conteúdo é o MESMO que vivia em `paciente/curadoria/page.tsx` — a
 * travessia, não uma pilha (TRAVESSIA_DA_PACIENTE.md): a Mesa vive dentro de
 * CaminhosPanel; a porta seguinte chama-se "A decisão" enquanto ela não
 * decidiu, e "Seu acompanhamento" depois. Após o primeiro atendimento, a
 * varanda abre e a Mesa recua — permanece visitável logo abaixo (L5).
 */
export async function BlocoCuradoria({
  supabase,
  curadoria,
}: {
  supabase: SupabaseClient;
  curadoria: PatientCuradoria;
}) {
  const caseId = curadoria.caseId;

  const connection = caseId
    ? await new SupabaseConnectionRepository(supabase).findByCaseId(caseId)
    : null;

  const relationship =
    caseId && connection?.status === "PRIMEIRO_ATENDIMENTO_REALIZADO"
      ? await new SupabaseRelationshipRepository(supabase).findByCaseId(caseId)
      : null;

  // As três opções entregues, na forma que os painéis de acompanhamento leem.
  const options = curadoria.options.map((option) => ({
    providerId: option.professionalProfileId,
    displayName: option.professionalName,
    professionalSummary: option.relationToWeights,
    whyIncluded: option.justification,
    strengthsForThisCase: option.favorablePoints,
    relevantLimitations: option.attentionPoints,
    practicalConsiderations: [],
  }));

  const varandaPrimeiro = Boolean(relationship);
  const decisao = curadoria.decision ?? null;

  // H2 · a conexão NUNCA pergunta "com quem" de novo: recebe o já decidido.
  const opcoesDaConexao = options.filter((opcao) => {
    if (decisao?.outcome === "CHOSEN") return opcao.displayName === decisao.chosenName;
    if (connection) return opcao.providerId === connection.professionalProfileId;
    return false;
  });

  // H3 · quem disse que nenhuma serviu não recebe "com quem seguir?".
  const mostrarConexao = connection !== null || decisao?.outcome === "CHOSEN";

  const blocoAcompanhamento =
    caseId && options.length > 0 ? (
      <>
        <Limiar nome={connection ? "Seu acompanhamento" : "A decisão"} />
        <div className="max-w-[44rem] space-y-8">
          {relationship ? (
            <RelationshipStatusPanel
              caseId={caseId}
              relationship={relationship}
              providerPresentations={options}
            />
          ) : null}
          {!relationship ? (
            <CuradoriaDecisionPanel
              curatedSelectionId={curadoria.curatedSelectionId}
              options={curadoria.options.map((opcao) => ({
                id: opcao.id,
                professionalName: opcao.professionalName,
              }))}
              decided={decisao}
            />
          ) : null}

          {mostrarConexao ? (
            <ConnectionChoicePanel
              caseId={caseId}
              providerPresentations={opcoesDaConexao}
              connection={connection}
              rodape={
                connection ? (
                  <ContactModePanel caseId={caseId} connection={connection} />
                ) : undefined
              }
            />
          ) : null}
        </div>
      </>
    ) : null;

  const blocoMesa = (
    <>
      {varandaPrimeiro ? <Limiar nome="A Mesa — para reler quando quiser" /> : null}
      <CaminhosPanel curadoria={curadoria} />

      {/* O PDF pertence à Mesa: material de consulta, nunca ação principal. */}
      <p className="mt-10">
        <Link
          href="/paciente/curadoria/imprimir"
          className="text-sm font-medium text-[var(--patient-acento)] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
        >
          Levar em PDF — para reler com a família ou na consulta
        </Link>
      </p>

      {/* C1 · Track C — a porta no momento em que ela mais faz falta. */}
      <p className="mt-3">
        <ConciergeLink topic="curadoria" />
      </p>
    </>
  );

  return (
    <div className="pb-16">
      {varandaPrimeiro ? blocoAcompanhamento : blocoMesa}
      {varandaPrimeiro ? blocoMesa : blocoAcompanhamento}
    </div>
  );
}
