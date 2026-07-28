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

import { useState, useTransition } from "react";

import { savePriorityImportanceAction } from "@/modules/curadoria/mapa-prioridades-actions";
import {
  IMPORTANCE_LABELS,
  IMPORTANCE_LEVELS,
  type ImportanceLevel,
  type PriorityMapCompletion,
  type PriorityMapGroup,
} from "@/modules/curadoria/mapa-prioridades";
import { cn } from "@/components/ui/cn";

export function MapaPrioridadesPanel({
  caseId,
  groups,
  completion,
}: {
  caseId: string;
  groups: PriorityMapGroup[];
  completion: PriorityMapCompletion;
}) {
  const [local, setLocal] = useState<Record<string, ImportanceLevel | null>>(() =>
    Object.fromEntries(
      groups.flatMap((grupo) =>
        grupo.entries.map((entrada) => [entrada.subcriterion.code, entrada.importance]),
      ),
    ),
  );
  const [salvando, setSalvando] = useState<string | null>(null);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [, startTransition] = useTransition();

  const classificados = Object.values(local).filter(Boolean).length;

  function gravar(code: string, importance: ImportanceLevel) {
    setLocal((atual) => ({ ...atual, [code]: importance }));
    setSalvando(code);
    setErros((atuais) =>
      Object.fromEntries(Object.entries(atuais).filter(([chave]) => chave !== code)),
    );

    startTransition(async () => {
      const resultado = await savePriorityImportanceAction({
        caseId,
        subcriterionCode: code,
        importance,
      });
      setSalvando(null);
      if (!resultado.success) {
        // O rascunho local fica: trabalho registrado nunca é jogado fora.
        setErros((atuais) => ({ ...atuais, [code]: resultado.error }));
      }
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
        Estes são os subcritérios do Método. Você não cria nem renomeia nenhum — registra quanto
        cada um importa para esta pessoa, com as palavras dela na conversa.
      </p>

      <div className="mt-6 space-y-8">
        {groups.map((grupo) => (
          <section key={grupo.group} aria-label={grupo.label}>
            <h3 className="mesa-rotulo">{grupo.label}</h3>

            <ul className="mt-3 space-y-4">
              {grupo.entries.map((entrada) => {
                const code = entrada.subcriterion.code;
                const nivel = local[code] ?? null;
                const erro = erros[code];

                return (
                  <li key={code} className="border-t border-line pt-3 first:border-t-0 first:pt-0">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                      <p className="text-sm font-medium text-ink">{entrada.subcriterion.name}</p>
                      {salvando === code ? (
                        <span className="text-xs text-ink-muted">Salvando…</span>
                      ) : nivel === null ? (
                        <span className="text-xs text-ink-muted">Ainda por conversar</span>
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
                            className={cn("mesa-chip cursor-pointer", nivel === level && "mesa-chip--ativo")}
                          >
                            <input
                              type="radio"
                              name={`importancia-${code}`}
                              value={level}
                              checked={nivel === level}
                              onChange={() => gravar(code, level)}
                              className="sr-only"
                            />
                            {IMPORTANCE_LABELS[level]}
                          </label>
                        ))}
                      </div>
                    </fieldset>

                    {erro ? (
                      <p role="alert" className="mt-2 text-sm text-red-700">
                        {erro}
                      </p>
                    ) : null}
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
