"use client";

/**
 * MAPA DE PRIORIDADES — a primeira etapa da Mesa (ADR-042).
 *
 * @metodo ADR-039 — o Método define o que se avalia; o Case, quanto importa
 * @metodo Fundamentos §13 — P14: o Curador declara; o sistema organiza
 *
 * Substitui "Definir Critérios". O Curador não escreve critério, não nomeia
 * critério e não descreve critério: ele diz **quanto cada subcritério do
 * Método importa para esta pessoa**, numa escala de cinco níveis.
 *
 * O que nunca faz: caixa de texto para criar critério, distribuição de
 * pontos, soma, saldo, ou barra que precise fechar em 100. Não existe etapa
 * de validar critérios — a completude é calculada e mostrada como
 * informação, nunca como porteiro.
 */

import { useEffect, useMemo, useState, useTransition } from "react";

import { savePriorityImportancesAction } from "@/modules/curadoria/mapa-prioridades-actions";
import {
  IMPORTANCE_LABELS,
  IMPORTANCE_LEVELS,
  type ImportanceLevel,
  type PriorityMapCompletion,
  type PriorityMapGroup,
} from "@/modules/curadoria/mapa-prioridades";
import { cn } from "@/components/ui/cn";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";

export function MapaPrioridadesPanel({
  caseId,
  groups,
  completion,
}: {
  caseId: string;
  groups: PriorityMapGroup[];
  completion: PriorityMapCompletion;
}) {
  const initial = useMemo(
    () =>
      Object.fromEntries(
        groups.flatMap((grupo) =>
          grupo.entries.map((entrada) => [
            entrada.subcriterion.code,
            entrada.importance,
          ]),
        ),
      ) as Record<string, ImportanceLevel | null>,
    [groups],
  );
  const [local, setLocal] =
    useState<Record<string, ImportanceLevel | null>>(initial);
  const [persistido, setPersistido] =
    useState<Record<string, ImportanceLevel | null>>(initial);
  const [erro, setErro] = useState<string | null>(null);
  const [salvo, setSalvo] = useState(false);
  const [pending, startTransition] = useTransition();

  const classificados = Object.values(local).filter(Boolean).length;
  const alterados = Object.entries(local).filter(
    ([code, importance]) =>
      importance !== null && importance !== persistido[code],
  );
  const temAlteracoes = alterados.length > 0;

  useEffect(() => {
    if (!temAlteracoes) return;
    const avisar = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", avisar);
    return () => window.removeEventListener("beforeunload", avisar);
  }, [temAlteracoes]);

  function escolher(code: string, importance: ImportanceLevel) {
    setLocal((atual) => ({ ...atual, [code]: importance }));
    setErro(null);
    setSalvo(false);
  }

  function gravarAlteracoes() {
    if (!temAlteracoes) return;
    startTransition(async () => {
      const resultado = await savePriorityImportancesAction({
        caseId,
        entries: alterados.map(([subcriterionCode, importance]) => ({
          subcriterionCode,
          importance: importance!,
        })),
      });
      if (!resultado.success) {
        // O rascunho local fica: trabalho digitado nunca é jogado fora.
        setErro(resultado.error);
        return;
      }
      setPersistido(local);
      setSalvo(true);
    });
  }

  return (
    <div>
      {/* Informação, nunca porteiro: a Mesa não bloqueia navegação por causa
          de um mapa incompleto. */}
      <p className="text-sm font-medium text-ink" aria-live="polite">
        {classificados === 0
          ? `Nenhum dos ${completion.total} subcritérios foi classificado ainda.`
          : classificados === completion.total
            ? `${completion.total} de ${completion.total} classificados.`
            : `${classificados} de ${completion.total} classificados · ${completion.total - classificados} ainda por conversar.`}
      </p>
      <p className="mt-1 max-w-reading text-xs text-ink-muted">
        Estes são os subcritérios do Método. Você não cria nem renomeia nenhum —
        registra quanto cada um importa para esta pessoa, com as palavras dela
        na conversa.
      </p>

      <div className="sticky top-[var(--mesa-topo,0px)] z-10 mt-4 flex flex-wrap items-center gap-3 rounded-md border border-border-strong bg-surface p-3">
        <Button
          type="button"
          onClick={gravarAlteracoes}
          disabled={!temAlteracoes || pending}
          isLoading={pending}
        >
          {alterados.length === 0
            ? "Mapa salvo"
            : alterados.length === 1
              ? "Salvar 1 alteração"
              : `Salvar ${alterados.length} alterações`}
        </Button>
        <p className="text-xs text-ink-muted">
          As escolhas ficam como rascunho nesta tela até você salvar o conjunto.
        </p>
      </div>

      {erro ? <FormMessage variant="error">{erro}</FormMessage> : null}
      {salvo && !temAlteracoes ? (
        <FormMessage variant="success">
          Mapa salvo em uma única gravação.
        </FormMessage>
      ) : null}

      <div className="mt-6 space-y-8">
        {groups.map((grupo) => (
          <section key={grupo.group} aria-label={grupo.label}>
            <h3 className="mesa-rotulo">{grupo.label}</h3>

            <ul className="mt-3 space-y-4">
              {grupo.entries.map((entrada) => {
                const code = entrada.subcriterion.code;
                const nivel = local[code] ?? null;

                return (
                  <li
                    key={code}
                    className="border-t border-line pt-3 first:border-t-0 first:pt-0"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                      <p className="text-sm font-medium text-ink">
                        {entrada.subcriterion.name}
                      </p>
                      {nivel === null ? (
                        <span className="text-xs text-ink-muted">
                          Ainda por conversar
                        </span>
                      ) : nivel !== persistido[code] ? (
                        <span className="text-xs font-medium text-brand-primary">
                          Alteração não salva
                        </span>
                      ) : null}
                    </div>

                    <p className="mt-0.5 max-w-reading text-xs text-ink-muted">
                      {entrada.subcriterion.description}
                    </p>

                    <fieldset className="mt-2">
                      <legend className="sr-only">
                        Importância de {entrada.subcriterion.name}
                      </legend>
                      <div className="flex flex-wrap gap-1.5">
                        {IMPORTANCE_LEVELS.map((level) => (
                          <label
                            key={level}
                            className={cn(
                              "mesa-chip cursor-pointer",
                              nivel === level && "mesa-chip--ativo",
                            )}
                          >
                            <input
                              type="radio"
                              name={`importancia-${code}`}
                              value={level}
                              checked={nivel === level}
                              onChange={() => escolher(code, level)}
                              disabled={pending}
                              className="sr-only"
                            />
                            {IMPORTANCE_LABELS[level]}
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
