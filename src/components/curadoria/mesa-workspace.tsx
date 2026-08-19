"use client";

/**
 * Selection Panel + Technical Justification + Decision Memory — Áreas 3, 4 e 5
 * da Mesa de Curadoria, orquestradas.
 *
 * @metodo Fundamentos §13 — P14: o algoritmo nunca seleciona os três; a seleção é exclusivamente do Curador
 * @metodo Engine §11 — Barreira 4: exatamente três, sem repetição, cada uma com justificativa e autoria humana
 * @metodo Engine §4.6 — as justificativas de opção e composição são escritas pelo Curador, nunca pelo Motor
 * @metodo Experience §3 — copiloto sinaliza a lacuna e nunca bloqueia o caminho sem explicar
 * @metodo Ontologia §3.13 — a ordem é de apresentação, nunca colocação
 *
 * Por que existe: é onde o Curador exerce julgamento. Ele monta a comparação
 * que quiser, escolhe três, e escreve o parecer de cada uma — o sistema
 * organiza a mesa e verifica o que falta, sem nunca sugerir quem entra nem o
 * que escrever.
 *
 * M1 (ADR-042): os candidatos deixam de vir do motor antigo
 * (`compatibility_analyses`) e passam a ser os elegíveis da própria Mesa, com
 * a leitura do Motor de Compatibilidade por subcritério. A comparação desta
 * área é a MESMA matriz das etapas de leitura — uma verdade só por par
 * (Case, profissional).
 *
 * O que nunca faz: pré-selecionar, ordenar por score, sugerir texto de parecer,
 * ou desabilitar o encerramento sem dizer ao lado exatamente o que falta.
 */

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { ComparacaoPremium } from "@/components/curadoria/mesa/comparacao-premium";
import { useMesaEstado } from "@/components/curadoria/mesa/mesa-estado";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/components/ui/cn";
import {
  PARECER_PROMPTS,
  ressalvasDaMesa,
  validateMesaClosure,
  type ParecerDraft,
} from "@/modules/curadoria/mesa";
import { saveReportAction, saveSelectionAction } from "@/modules/curadoria/actions";
import { textareaParaItens } from "@/modules/curadoria/relatorio-itens";
import type { SelecaoCandidato, SelecaoExcluido } from "@/modules/curadoria/mesa-selecao";

type MesaWorkspaceProps = {
  /** Os elegíveis da Mesa, com a leitura do Motor — na ordem da Rede. */
  /** Identidade do estado: rascunho de um Caso nunca atravessa para outro. */
  caseId: string;
  candidatos: SelecaoCandidato[];
  /** Quem não participa, com o motivo da própria classificação da Mesa. */
  excluidos: SelecaoExcluido[];
  curatorName: string;
  patientFirstName: string;
  /** Onde a seleção e o parecer são gravados. */
  priorityProfileId: string;
  // D-6 · `persisted` saiu daqui: quem inicializa o estado é
  // `MesaEstadoProvider`, acima do Shell. Manter a prop faria o workspace
  // ACEITAR um valor que ignora — o tipo de armadilha que esta base já pagou.
  /** Depois de entregue ao paciente, a seleção não muda mais. */
  locked?: boolean;
  /** A etapa seguinte — o Relatório deste caso. */
  reportHref: string;
};

// D-6 · o estado da Mesa mudou de lugar: vive em `mesa/mesa-estado.tsx`,
// ACIMA de `MesaShell`. Aqui ele morria ao trocar de etapa, porque este
// componente mora dentro de `conteudo[etapaAtual]` e desmonta junto.

export function MesaWorkspace({
  caseId,
  candidatos,
  excluidos,
  curatorName,
  patientFirstName,
  priorityProfileId,
  locked = false,
  reportHref,
}: MesaWorkspaceProps) {
  const router = useRouter();
  // O estado vem de cima. `persisted` continua sendo a inicialização
  // legítima do servidor — ela só passou a ser aplicada no provider, uma vez,
  // em vez de a cada montagem deste componente.
  const { state, dispatch } = useMesaEstado(caseId);
  const { comparisonIds, selectedIds, pareceres, compositionRationale, log, closed } = state;

  const [erro, setErro] = useState<string | null>(null);
  const [salvando, startSaving] = useTransition();

  const namesById = useMemo(
    () => Object.fromEntries(candidatos.map((entry) => [entry.professionalProfileId, entry.nome])),
    [candidatos],
  );

  const missing = useMemo(
    () =>
      validateMesaClosure({
        selectedIds,
        pareceres,
        compositionRationale,
        curatorName,
        namesById,
      }),
    [selectedIds, pareceres, compositionRationale, curatorName, namesById],
  );

  /**
   * "Tem alguma confirmação" = ao menos uma célula da leitura do Motor que não
   * seja lacuna nem irrelevante. `NAO_RELEVANTE` não conta como informação
   * sobre o profissional: é o Caso dizendo que aquele ponto não pesa aqui.
   */
  const temAlgumaConfirmacao = useMemo(
    () =>
      Object.fromEntries(
        candidatos.map((c) => [
          c.professionalProfileId,
          c.celulas.some(
            (celula) =>
              celula.result === "ALTA_COMPATIBILIDADE" ||
              celula.result === "MEDIA_COMPATIBILIDADE",
          ),
        ]),
      ),
    [candidatos],
  );

  const ressalvas = useMemo(
    () => ressalvasDaMesa({ selectedIds, pareceres, namesById, temAlgumaConfirmacao }),
    [selectedIds, pareceres, namesById, temAlgumaConfirmacao],
  );

  function toggleComparison(id: string) {
    dispatch({ type: "TOGGLE_COMPARISON", id, name: namesById[id] ?? id, actor: curatorName });
  }

  function toggleSelection(id: string) {
    dispatch({ type: "TOGGLE_SELECTION", id, name: namesById[id] ?? id, actor: curatorName });
  }

  function updateParecer(id: string, field: keyof Omit<ParecerDraft, "professionalId">, value: string) {
    dispatch({ type: "UPDATE_PARECER", id, field, value });
  }

  /**
   * Encerrar a Curadoria Técnica — o momento em que o trabalho sai da tela e
   * vira registro.
   *
   * Dois artefatos nascem do mesmo ato, porque são a mesma decisão: a SELEÇÃO
   * (quem são os três e o que cada um custa) e o RASCUNHO DO RELATÓRIO (o
   * parecer completo que o paciente vai reler). Separá-los em dois botões
   * obrigaria o Curador a escrever a mesma coisa duas vezes.
   *
   * A ordem importa: sem seleção gravada não existe Relatório a que se prender.
   * Se o segundo passo falhar, o primeiro permanece — e a tela diz exatamente
   * isso, em vez de fingir que nada aconteceu.
   */
  function closeMesa() {
    if (missing.length > 0 || salvando || locked) return;
    setErro(null);

    startSaving(async () => {
      const ordered = selectedIds.map((id) => ({
        id,
        parecer: pareceres.find((draft) => draft.professionalId === id)!,
      }));

      const selectionResult = await saveSelectionAction({
        priorityProfileId,
        compositionRationale,
        options: ordered.map(({ id, parecer }) => ({
          professionalProfileId: id,
          rationale: parecer.whyIncluded,
          tradeOff: parecer.limitations,
        })),
      });

      if (!selectionResult.success) {
        setErro(selectionResult.error ?? "Não foi possível salvar a seleção.");
        return;
      }

      const reportResult = await saveReportAction({
        priorityProfileId,
        compositionRationale,
        options: ordered.map(({ id, parecer }) => ({
          professionalProfileId: id,
          justification: parecer.whyIncluded,
          relationToWeights: parecer.prioritiesServed,
          // O que a opção custa é obrigatório: opção só com virtudes é
          // recomendação disfarçada (Experience §2.5).
          // FRENTE D3: a inversa da exibição (um item por linha) — o
          // `[parecer.limitations]` anterior reenviava dois itens gravados
          // como UM item colado, para sempre.
          attentionPoints: textareaParaItens(parecer.limitations),
          // A Mesa não edita pontos favoráveis: campo AUSENTE é "não mexi",
          // e a gravação preserva o que o rascunho assistido escreveu
          // (contrato D21a). O `favorablePoints: []` anterior os apagava a
          // cada encerramento.
          suggestedQuestions: textareaParaItens(parecer.questions),
          curatorObservations: parecer.observations.trim() || null,
        })),
      });

      if (!reportResult.success) {
        setErro(
          `A seleção foi salva, mas o Relatório não: ${reportResult.error ?? "erro desconhecido"}. Corrija e encerre de novo — a seleção não será duplicada.`,
        );
        return;
      }

      dispatch({ type: "CLOSE", actor: curatorName });
      router.refresh();
    });
  }

  /** Reabrir para corrigir — enquanto não houver entrega ao paciente. */
  function reopenMesa() {
    if (locked) return;
    setErro(null);
    dispatch({ type: "REOPEN" });
  }

  // A comparação desta área é a MESMA matriz do Motor das etapas de leitura,
  // recortada para quem o Curador adicionou — nunca uma segunda conta.
  const colunasEmComparacao = comparisonIds
    .map((id) => candidatos.find((entry) => entry.professionalProfileId === id))
    .filter((entry): entry is SelecaoCandidato => Boolean(entry))
    .map((entry) => ({
      id: entry.professionalProfileId,
      nome: entry.nome,
      celulas: entry.celulas,
      resumo: entry.resumo,
    }));

  return (
    <div className="space-y-6">
      {/* ÁREA 3 — PROFISSIONAIS ELEGÍVEIS */}
      <section
        aria-labelledby="elegiveis-heading"
        aria-describedby={candidatos.length > 0 ? "elegiveis-comum" : undefined}
        className="space-y-4"
      >
        <div>
          <h2 id="elegiveis-heading" className="font-sans text-xl font-semibold text-ink">
            Profissionais elegíveis
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            {candidatos.length} elegíve{candidatos.length === 1 ? "l" : "is"} pela área e pelos
            filtros de {patientFirstName}
            {excluidos.length > 0
              ? `; ${excluidos.length} não participa${excluidos.length === 1 ? "" : "m"}, com o motivo registrado`
              : ""}
            . A ordem é a da Rede — leitura, nunca colocação.
          </p>

          {/* O que vale para TODOS os candidatos é dito uma vez, aqui, no nível
              do conjunto. Repetido dentro de cada cartão, fazia informação
              comum parecer característica individual — e o leitor de tela a
              ouvia N vezes sem ganhar nada. As duas afirmações continuam
              separadas porque dizem coisas diferentes: de onde vem quem está
              na lista, e como ler o que o Motor contou. */}
          {candidatos.length > 0 ? (
            <div id="elegiveis-comum" className="mt-2 space-y-0.5">
              <p className="text-xs text-ink-muted">
                Aprovado pela Aliviar — critério próprio, anterior a este caso.
              </p>
              <p className="text-xs text-ink-muted">
                Contagens por estado — nunca uma nota. O detalhe, critério a critério, está na
                Comparação.
              </p>
            </div>
          ) : null}
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          {candidatos.map((candidato) => (
            <CandidatoCard
              key={candidato.professionalProfileId}
              candidato={candidato}
              inComparison={comparisonIds.includes(candidato.professionalProfileId)}
              selected={selectedIds.includes(candidato.professionalProfileId)}
              selectionFull={selectedIds.length >= 3}
              disabled={closed}
              onToggleComparison={() => toggleComparison(candidato.professionalProfileId)}
              onToggleSelection={() => toggleSelection(candidato.professionalProfileId)}
            />
          ))}
        </div>

        {excluidos.length > 0 ? (
          <details className="rounded-md border border-border bg-surface p-4">
            <summary className="cursor-pointer text-sm font-medium text-ink">
              Quem não participa, e por quê ({excluidos.length})
            </summary>
            <ul className="mt-3 space-y-2">
              {excluidos.map((entry) => (
                <li key={entry.professionalProfileId} className="text-sm">
                  <span className="text-ink">{entry.nome}</span>
                  <span aria-hidden="true"> — </span>
                  <span className="text-ink-muted">{entry.motivo}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-ink-muted">
              Esta lista é sua. O paciente sabe por qual critério algo foi excluído, nunca quem.
            </p>
          </details>
        ) : null}
      </section>

      {/* ÁREA 4 — COMPARAÇÃO (a matriz do Motor, recortada) */}
      <section aria-labelledby="comparacao-heading">
        <Card>
          <CardHeader>
            <CardTitle>
              <span id="comparacao-heading">Comparação</span>
            </CardTitle>
            <CardDescription>
              Lado a lado, critério a critério. Sem ranking, sem vencedor — as colunas ficam na ordem
              em que você adicionou.
            </CardDescription>
          </CardHeader>
          {colunasEmComparacao.length > 0 ? (
            <ComparacaoPremium colunas={colunasEmComparacao} />
          ) : (
            <p className="max-w-reading text-sm leading-relaxed text-ink-muted">
              Adicione profissionais à comparação com o botão “Comparar” — a leitura do Motor
              aparece aqui, lado a lado.
            </p>
          )}
        </Card>
      </section>

      {/* ÁREA 5 — PARECER DO CURADOR */}
      <section aria-labelledby="parecer-heading" className="space-y-4">
        <div>
          <h2 id="parecer-heading" className="font-sans text-xl font-semibold text-ink">
            Seu parecer técnico
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            {selectedIds.length === 0
              ? "Selecione profissionais acima para escrever o parecer de cada um."
              : `${selectedIds.length} de 3 selecionados. Nenhuma opção existe sem justificativa.`}
          </p>
        </div>

        {selectedIds.map((id, index) => {
          const parecer = pareceres.find((draft) => draft.professionalId === id);
          if (!parecer) return null;

          return (
            <Card key={id} className="space-y-5">
              <CardHeader>
                <CardTitle>{namesById[id]}</CardTitle>
                <CardDescription>
                  Opção {index + 1} de {selectedIds.length} — ordem de apresentação, nunca colocação.
                </CardDescription>
              </CardHeader>

              {/* Reordenar: a sequência da conversa é decisão sua. */}
              {closed ? null : (
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={index === 0}
                    onClick={() =>
                      dispatch({
                        type: "MOVE_SELECTION",
                        id,
                        direction: -1,
                        name: namesById[id] ?? id,
                        actor: curatorName,
                      })
                    }
                  >
                    Apresentar antes
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={index === selectedIds.length - 1}
                    onClick={() =>
                      dispatch({
                        type: "MOVE_SELECTION",
                        id,
                        direction: 1,
                        name: namesById[id] ?? id,
                        actor: curatorName,
                      })
                    }
                  >
                    Apresentar depois
                  </Button>
                </div>
              )}

              {PARECER_PROMPTS.map((prompt) => (
                <div key={prompt.field} className="space-y-1.5">
                  <label
                    htmlFor={`${prompt.field}-${id}`}
                    className="block text-sm font-medium text-ink"
                  >
                    {prompt.title}
                    {prompt.required ? null : (
                      <span className="ml-2 text-xs font-normal text-ink-muted">opcional</span>
                    )}
                  </label>
                  <p className="text-xs leading-relaxed text-ink-muted">{prompt.guidance}</p>
                  <textarea
                    id={`${prompt.field}-${id}`}
                    value={parecer[prompt.field]}
                    disabled={closed}
                    onChange={(event) => updateParecer(id, prompt.field, event.target.value)}
                    onBlur={() =>
                      parecer[prompt.field].trim()
                        ? dispatch({
                            type: "RECORD_JUSTIFICATION",
                            description: `${prompt.title} — ${namesById[id]}.`,
                            actor: curatorName,
                          })
                        : undefined
                    }
                    rows={3}
                    className={cn(
                      "w-full rounded-sm border bg-surface px-3 py-2 text-sm leading-relaxed text-ink",
                      "focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-1 focus-visible:ring-offset-surface",
                      "transition-colors duration-fast ease-standard disabled:cursor-not-allowed disabled:opacity-70",
                      prompt.required && !parecer[prompt.field].trim()
                        ? "border-[color-mix(in_srgb,var(--color-brand-gold)_50%,transparent)]"
                        : "border-border",
                    )}
                  />
                </div>
              ))}
            </Card>
          );
        })}

        {selectedIds.length > 0 ? (
          <Card className="space-y-3">
            <CardHeader>
              {/* O título É o rótulo do campo. Antes ele era só um `CardTitle`
                  solto: visualmente parecia um label e, para leitor de tela, o
                  textarea era um campo sem nome. A copy não muda. */}
              <CardTitle>
                <label htmlFor="composicao-rationale">Por que estas três, juntas</label>
              </CardTitle>
              <CardDescription>
                A justificativa da composição — o que diferencia os caminhos entre si, para que{" "}
                {patientFirstName} escolha qual troca faz sentido.
              </CardDescription>
            </CardHeader>
            <textarea
              id="composicao-rationale"
              value={compositionRationale}
              disabled={closed}
              onChange={(event) => dispatch({ type: "SET_COMPOSITION", value: event.target.value })}
              rows={4}
              className={cn(
                "w-full rounded-sm border bg-surface px-3 py-2 text-sm leading-relaxed text-ink",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-1 focus-visible:ring-offset-surface",
                "transition-colors duration-fast ease-standard disabled:cursor-not-allowed disabled:opacity-70",
                compositionRationale.trim() ? "border-border" : "border-[color-mix(in_srgb,var(--color-brand-gold)_50%,transparent)]",
              )}
            />
          </Card>
        ) : null}
      </section>

      {/* ENCERRAMENTO — Barreira 4 */}
      <Card className={cn("space-y-4", missing.length === 0 && !closed && "border-[color-mix(in_srgb,var(--color-brand-sage)_50%,transparent)]")}>
        <CardHeader>
          <CardTitle>
            {closed ? "Curadoria Técnica encerrada" : "Encerrar a Curadoria Técnica"}
          </CardTitle>
          <CardDescription>
            {closed
              ? `Três opções gravadas por ${curatorName}, cada uma com parecer próprio. O rascunho do Relatório nasceu junto — revise e emita na etapa seguinte.`
              : "A seleção fica registrada no caso, com o seu nome — é sua, nunca do sistema."}
          </CardDescription>
        </CardHeader>

        {closed ? (
          <div className="space-y-3">
            <p className="text-sm text-ink-muted">
              {locked
                ? "A Curadoria já foi entregue ao paciente — a seleção não muda mais."
                : "Enquanto não for entregue ao paciente, você pode reabrir e corrigir."}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <a
                href={reportHref}
                className="inline-flex min-h-11 items-center gap-2 rounded-md bg-brand-primary px-4 py-2.5 text-sm font-medium text-surface transition-colors duration-fast ease-standard hover:bg-brand-primary-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
              >
                Revisar o Relatório
                <span aria-hidden="true">→</span>
              </a>
              {locked ? null : (
                <Button type="button" variant="ghost" onClick={reopenMesa}>
                  Reabrir para corrigir
                </Button>
              )}
            </div>
          </div>
        ) : (
          /* C7 · O destino fica sempre à vista.
             Antes, o botão de encerrar só NASCIA quando tudo já estava pronto:
             quem chegava com dois pareceres via uma lista de pendências e
             nenhum botão, e não tinha como saber que o caminho terminava ali.
             Agora ele está sempre na tela — desabilitado enquanto falta algo,
             dizendo o que falta, pelo mesmo `missing` que decide o clique. */
          <div className="space-y-3">
            {missing.length > 0 ? (
              <div id="encerrar-pendencias">
                <p className="text-sm text-ink">Para encerrar:</p>
                <ul className="mt-1.5 space-y-1">
                  {missing.map((item, indice) => (
                    <li key={`${indice}-${item}`} className="text-sm text-ink-muted">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {/* RESSALVAS — observação, nunca impedimento. Ficam abaixo do que
                falta e acima do botão, no caminho do olho de quem vai clicar,
                e o botão continua habilitado: pode ser exatamente o que o
                Curador quis, e ele é quem sabe. Se travassem, seriam
                contornadas com texto de fachada e o sistema teria piorado o
                trabalho em vez de ajudá-lo. */}
            {ressalvas.length > 0 ? (
              <div className="rounded-md border border-border p-3">
                <p className="text-sm text-ink">Antes de encerrar, vale olhar:</p>
                <ul className="mt-1.5 space-y-1.5">
                  {ressalvas.map((r) => (
                    <li key={r.kind + r.texto} className="max-w-prose text-sm text-ink-muted">
                      {r.texto}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                onClick={closeMesa}
                disabled={salvando || missing.length > 0}
                isLoading={salvando}
                aria-describedby={missing.length > 0 ? "encerrar-pendencias" : undefined}
              >
                {salvando ? "Gravando a seleção e o parecer…" : "Encerrar e gerar o Relatório"}
              </Button>
              {salvando ? (
                <span role="status" className="text-sm text-ink-muted">
                  Gravando no caso — não feche esta aba.
                </span>
              ) : null}
            </div>
          </div>
        )}

        {erro ? (
          <p role="alert" className="rounded-md border border-error bg-error-surface px-3 py-2 text-sm text-ink">
            {erro}
          </p>
        ) : null}
      </Card>

      {/* DECISION MEMORY */}
      {log.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Memória desta sessão</CardTitle>
            <CardDescription>
              Cada movimento fica registrado com autor — inclusive as mudanças de opinião.
            </CardDescription>
          </CardHeader>
          <ul className="space-y-2">
            {log.map((entry, index) => (
              <li key={`${entry.kind}-${index}`} className="text-sm">
                <span className="text-ink">{entry.description}</span>
                <span aria-hidden="true"> · </span>
                <span className="text-xs text-ink-muted">{entry.actor}</span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </div>
  );
}

/**
 * O cartão do candidato — quem é, o que a leitura do Motor contou, e os dois
 * atos possíveis. Nenhuma banda, nenhum número que possa ser lido como nota:
 * a evidência detalhada mora na Comparação, que é a mesma matriz do Motor.
 */
function CandidatoCard({
  candidato,
  inComparison,
  selected,
  selectionFull,
  disabled,
  onToggleComparison,
  onToggleSelection,
}: {
  candidato: SelecaoCandidato;
  inComparison: boolean;
  selected: boolean;
  selectionFull: boolean;
  disabled: boolean;
  onToggleComparison: () => void;
  onToggleSelection: () => void;
}) {
  return (
    <Card className={cn("space-y-4", selected && "border-[color-mix(in_srgb,var(--color-brand-primary)_50%,transparent)]")}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        {/* A proveniência ("aprovado pela Aliviar") e como ler as contagens
            valem para todos e são ditas uma vez, acima da lista. Aqui fica só
            o que distingue este candidato dos outros. */}
        <h3 className="font-sans text-base font-semibold text-ink">{candidato.nome}</h3>
        {selected ? <Badge variant="sage">Selecionado</Badge> : null}
      </div>

      <div className="rounded-md bg-canvas p-3">
        <p className="text-xs uppercase tracking-wide text-ink-muted">
          Leitura do Motor para este caso
        </p>
        <p className="mt-1 text-sm text-ink">{candidato.resumo}</p>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
        <button
          type="button"
          onClick={onToggleComparison}
          disabled={disabled}
          className={cn(
            "inline-flex min-h-10 items-center rounded-md border px-3 py-2 text-sm font-medium transition-colors duration-fast ease-standard",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
            "disabled:cursor-not-allowed disabled:opacity-60",
            inComparison
              ? "border-[color-mix(in_srgb,var(--color-brand-primary)_40%,transparent)] bg-canvas text-brand-primary-deep"
              : "border-border bg-surface text-ink hover:border-[color-mix(in_srgb,var(--color-brand-primary)_40%,transparent)]",
          )}
        >
          {inComparison ? "Tirar da comparação" : "Comparar"}
        </button>

        <button
          type="button"
          onClick={onToggleSelection}
          disabled={disabled || (!selected && selectionFull)}
          className={cn(
            "inline-flex min-h-10 items-center rounded-md px-3 py-2 text-sm font-medium transition-colors duration-fast ease-standard",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
            "disabled:cursor-not-allowed disabled:opacity-60",
            selected
              ? "border border-border bg-surface text-ink hover:bg-canvas"
              : "bg-brand-primary text-surface hover:bg-brand-primary-deep",
          )}
        >
          {selected ? "Remover da seleção" : "Selecionar"}
        </button>

        {!selected && selectionFull && !disabled ? (
          // Nunca um botão cinza sem explicação (Experience §6).
          <p className="text-xs text-ink-muted">
            As três já estão selecionadas — remova uma para trocar.
          </p>
        ) : null}
      </div>
    </Card>
  );
}
