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

import { useMemo, useReducer, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { ComparacaoPremium } from "@/components/curadoria/mesa/comparacao-premium";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/components/ui/cn";
import {
  PARECER_PROMPTS,
  emptyParecer,
  logEntry,
  validateMesaClosure,
  type MesaLogEntry,
  type ParecerDraft,
} from "@/modules/curadoria/mesa";
import { saveReportAction, saveSelectionAction } from "@/modules/curadoria/actions";
import type { SelecaoCandidato, SelecaoExcluido } from "@/modules/curadoria/mesa-selecao";

type MesaWorkspaceProps = {
  /** Os elegíveis da Mesa, com a leitura do Motor — na ordem da Rede. */
  candidatos: SelecaoCandidato[];
  /** Quem não participa, com o motivo da própria classificação da Mesa. */
  excluidos: SelecaoExcluido[];
  curatorName: string;
  patientFirstName: string;
  /** Onde a seleção e o parecer são gravados. */
  priorityProfileId: string;
  /**
   * O trabalho já persistido, para a Mesa reabrir onde parou.
   *
   * Antes, todo o estado da Mesa vivia só no reducer: fechar a aba jogava fora
   * três pareceres escritos. Trabalho perdido em silêncio é a pior falha
   * possível numa tela onde se escreve por vinte minutos.
   */
  persisted?: {
    selectedIds: string[];
    pareceres: ParecerDraft[];
    compositionRationale: string;
    /** Já gravado no banco — a Mesa abre encerrada, mas reabrível. */
    closed: boolean;
  };
  /** Depois de entregue ao paciente, a seleção não muda mais. */
  locked?: boolean;
  /** A etapa seguinte — o Relatório deste caso. */
  reportHref: string;
};

/**
 * Estado da Mesa em um único átomo, com reducer puro.
 *
 * Por que reducer e não vários `useState`: a Memória precisa ser escrita na
 * mesma transição que a mudança que ela registra. Com setters separados, três
 * seleções no mesmo tick liam o mesmo valor de `selectedIds` e só a última
 * sobrevivia — e registrar a Memória de dentro de um updater duplicava a
 * entrada. Um reducer puro resolve os dois: correto sob batching, e sem efeito
 * colateral dentro de função de atualização.
 */
type MesaState = {
  comparisonIds: string[];
  selectedIds: string[];
  pareceres: ParecerDraft[];
  compositionRationale: string;
  log: MesaLogEntry[];
  closed: boolean;
};

type MesaAction =
  | { type: "TOGGLE_COMPARISON"; id: string; name: string; actor: string }
  | { type: "TOGGLE_SELECTION"; id: string; name: string; actor: string }
  | { type: "UPDATE_PARECER"; id: string; field: keyof Omit<ParecerDraft, "professionalId">; value: string }
  | { type: "SET_COMPOSITION"; value: string }
  | { type: "RECORD_JUSTIFICATION"; description: string; actor: string }
  | { type: "MOVE_SELECTION"; id: string; direction: -1 | 1; name: string; actor: string }
  | { type: "CLOSE"; actor: string }
  | { type: "REOPEN" };

const INITIAL_STATE: MesaState = {
  comparisonIds: [],
  selectedIds: [],
  pareceres: [],
  compositionRationale: "",
  log: [],
  closed: false,
};

function append(log: MesaLogEntry[], entry: MesaLogEntry): MesaLogEntry[] {
  const last = log[0];
  if (last?.kind === entry.kind && last.description === entry.description) return log;
  return [entry, ...log];
}

function mesaReducer(state: MesaState, action: MesaAction): MesaState {
  switch (action.type) {
    case "TOGGLE_COMPARISON": {
      const has = state.comparisonIds.includes(action.id);
      return {
        ...state,
        comparisonIds: has
          ? state.comparisonIds.filter((entry) => entry !== action.id)
          : [...state.comparisonIds, action.id],
        log: append(
          state.log,
          logEntry(
            has ? "COMPARACAO_REMOVIDA" : "COMPARACAO_ADICIONADA",
            `${action.name} ${has ? "saiu da" : "entrou na"} comparação.`,
            action.actor,
          ),
        ),
      };
    }

    case "TOGGLE_SELECTION": {
      const has = state.selectedIds.includes(action.id);
      // A Curadoria apresenta sempre exatamente três — nunca uma quarta.
      if (!has && state.selectedIds.length >= 3) return state;

      return {
        ...state,
        selectedIds: has
          ? state.selectedIds.filter((entry) => entry !== action.id)
          : [...state.selectedIds, action.id],
        pareceres: has
          ? state.pareceres.filter((draft) => draft.professionalId !== action.id)
          : state.pareceres.some((draft) => draft.professionalId === action.id)
            ? state.pareceres
            : [...state.pareceres, emptyParecer(action.id)],
        log: append(
          state.log,
          logEntry(
            has ? "OPCAO_REMOVIDA" : "OPCAO_SELECIONADA",
            `${action.name} ${has ? "saiu da" : "entrou na"} seleção.`,
            action.actor,
          ),
        ),
      };
    }

    case "UPDATE_PARECER":
      return {
        ...state,
        pareceres: state.pareceres.map((draft) =>
          draft.professionalId === action.id ? { ...draft, [action.field]: action.value } : draft,
        ),
      };

    case "SET_COMPOSITION":
      return { ...state, compositionRationale: action.value };

    case "RECORD_JUSTIFICATION":
      return {
        ...state,
        log: append(
          state.log,
          logEntry("JUSTIFICATIVA_REGISTRADA", action.description, action.actor),
        ),
      };

    case "MOVE_SELECTION": {
      // A ordem das três é ORDEM DE APRESENTAÇÃO, nunca colocação (Ontologia
      // §3.13). Ela existe porque a conversa tem uma sequência que faz sentido
      // — começar pelo caminho mais próximo do que ela pediu, por exemplo —
      // e essa sequência é julgamento do Curador, não de resultado nenhum.
      const from = state.selectedIds.indexOf(action.id);
      const to = from + action.direction;
      if (from < 0 || to < 0 || to >= state.selectedIds.length) return state;

      const reordered = [...state.selectedIds];
      [reordered[from], reordered[to]] = [reordered[to]!, reordered[from]!];

      return {
        ...state,
        selectedIds: reordered,
        log: append(
          state.log,
          logEntry(
            "OPCAO_SELECIONADA",
            `${action.name} passou a ser apresentada em ${to + 1}º na ordem da conversa.`,
            action.actor,
          ),
        ),
      };
    }

    case "REOPEN":
      // Reabrir não apaga o que foi escrito — só devolve a edição.
      return { ...state, closed: false };

    case "CLOSE":
      return {
        ...state,
        closed: true,
        log: append(
          state.log,
          logEntry(
            "SELECAO_FECHADA",
            "Curadoria Técnica encerrada com três opções e pareceres completos.",
            action.actor,
          ),
        ),
      };
  }
}

export function MesaWorkspace({
  candidatos,
  excluidos,
  curatorName,
  patientFirstName,
  priorityProfileId,
  persisted,
  locked = false,
  reportHref,
}: MesaWorkspaceProps) {
  const router = useRouter();
  const [state, dispatch] = useReducer(mesaReducer, {
    ...INITIAL_STATE,
    selectedIds: persisted?.selectedIds ?? [],
    pareceres: persisted?.pareceres ?? [],
    compositionRationale: persisted?.compositionRationale ?? "",
    closed: persisted?.closed ?? false,
  });
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
          attentionPoints: [parecer.limitations].filter((entry) => entry.trim()),
          favorablePoints: [],
          suggestedQuestions: [parecer.questions].filter((entry) => entry.trim()),
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
      <section aria-labelledby="elegiveis-heading" className="space-y-4">
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
              <CardTitle>Por que estas três, juntas</CardTitle>
              <CardDescription>
                A justificativa da composição — o que diferencia os caminhos entre si, para que{" "}
                {patientFirstName} escolha qual troca faz sentido.
              </CardDescription>
            </CardHeader>
            <textarea
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
        ) : missing.length > 0 ? (
          <div>
            <p className="text-sm text-ink">Para encerrar:</p>
            <ul className="mt-1.5 space-y-1">
              {missing.map((item) => (
                <li key={item} className="text-sm text-ink-muted">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" onClick={closeMesa} disabled={salvando} isLoading={salvando}>
              {salvando ? "Gravando a seleção e o parecer…" : "Encerrar e gerar o Relatório"}
            </Button>
            {salvando ? (
              <span role="status" className="text-sm text-ink-muted">
                Gravando no caso — não feche esta aba.
              </span>
            ) : null}
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
        <div>
          <h3 className="font-sans text-base font-semibold text-ink">{candidato.nome}</h3>
          <p className="mt-0.5 text-xs text-ink-muted">
            Aprovado pela Aliviar — critério próprio, anterior a este caso.
          </p>
        </div>
        {selected ? <Badge variant="sage">Selecionado</Badge> : null}
      </div>

      <div className="rounded-md bg-canvas p-3">
        <p className="text-xs uppercase tracking-wide text-ink-muted">
          Leitura do Motor para este caso
        </p>
        <p className="mt-1 text-sm text-ink">{candidato.resumo}</p>
        <p className="mt-1 text-xs text-ink-muted">
          Contagens por estado — nunca uma nota. O detalhe, critério a critério, está na Comparação.
        </p>
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
