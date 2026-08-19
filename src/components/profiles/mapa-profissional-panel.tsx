"use client";

/**
 * MAPA DO PROFISSIONAL — a seção operacional.
 *
 * @metodo Modelo v1.0 §4 e §6 — os seis critérios, os mesmos do Case
 * @metodo Política de Fontes — lacuna aparece como lacuna
 *
 * Por que existe: sem o estado de cada subcritério do lado do profissional, o
 * Mapa de Prioridades do Case não tem com o que conversar. Aqui a operação
 * registra o que verificou — três estados, nada de nota, peso ou adjetivo.
 *
 * O que nunca faz: criar subcritério, renomear subcritério, ordenar à mão,
 * pedir estrela, pedir número, ou preencher tudo como "não informado" para a
 * barra parecer completa. Item não trabalhado fica sem registro, e o resumo
 * diz isso com todas as letras.
 */

import { useState, useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/components/ui/cn";
import { saveProfessionalSubcriterionAction } from "@/modules/curadoria/mapa-profissional-actions";
import {
  completionSentence,
  NOTE_MAX_LENGTH,
  SUBCRITERION_STATUSES,
  SUBCRITERION_STATUS_LABELS,
  SUBCRITERION_STATUS_MEANING,
  type ProfessionalMapCompletion,
  type ProfessionalMapGroup,
  type SubcriterionStatus,
} from "@/modules/curadoria/mapa-profissional";

type EstadoLocal = { status: SubcriterionStatus | null; note: string };

export function MapaProfissionalPanel({
  professionalProfileId,
  groups,
  completion,
}: {
  professionalProfileId: string;
  groups: ProfessionalMapGroup[];
  completion: ProfessionalMapCompletion;
}) {
  const [local, setLocal] = useState<Record<string, EstadoLocal>>(() =>
    Object.fromEntries(
      groups.flatMap((grupo) =>
        grupo.entries.map((entrada) => [
          entrada.subcriterion.code,
          { status: entrada.status, note: entrada.note ?? "" },
        ]),
      ),
    ),
  );
  const [salvando, setSalvando] = useState<string | null>(null);
  const [salvo, setSalvo] = useState<string | null>(null);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [, startTransition] = useTransition();

  const tratados = Object.values(local).filter((entrada) => entrada.status !== null).length;
  const resumo = completionSentence({ ...completion, declared: tratados, pending: completion.total - tratados });

  function gravar(code: string, proximo: EstadoLocal) {
    if (!proximo.status) return;

    setLocal((atual) => ({ ...atual, [code]: proximo }));
    setSalvando(code);
    setErros((atuais) =>
      Object.fromEntries(Object.entries(atuais).filter(([chave]) => chave !== code)),
    );

    startTransition(async () => {
      const resultado = await saveProfessionalSubcriterionAction({
        professionalProfileId,
        subcriterionCode: code,
        status: proximo.status!,
        note: proximo.note,
      });

      setSalvando(null);

      if (!resultado.success) {
        // O rascunho local fica: trabalho digitado nunca é jogado fora.
        setErros((atuais) => ({ ...atuais, [code]: resultado.error }));
        return;
      }

      setSalvo(code);
      setTimeout(() => setSalvo((atual) => (atual === code ? null : atual)), 2000);
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mapa do Profissional</CardTitle>
        <CardDescription>
          O que a operação verificou sobre cada subcritério do Método. Sem nota, sem peso: a
          característica está presente, não está, ou não se sabe.
        </CardDescription>
      </CardHeader>

      <p className="text-sm font-medium text-ink" aria-live="polite">
        {resumo}
      </p>
      <p className="mt-1 max-w-reading text-xs text-ink-muted">
        &ldquo;Ainda não avaliado&rdquo; é diferente de &ldquo;Não informado&rdquo;: o primeiro é item que ninguém
        tratou; o segundo é item analisado, sem informação suficiente. Deixar itens sem registro é
        legítimo — a completude é informação, não etapa obrigatória.
      </p>

      <div className="mt-6 space-y-8">
        {groups.map((grupo) => (
          <section key={grupo.group} aria-label={grupo.label}>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-brand-sage-deep">
              {grupo.label}
            </h3>

            <ul className="mt-3 space-y-5">
              {grupo.entries.map((entrada) => {
                const code = entrada.subcriterion.code;
                const estado = local[code] ?? { status: null, note: "" };
                const erro = erros[code];

                return (
                  <li key={code} className="border-t border-line pt-4 first:border-t-0 first:pt-0">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                      <p className="font-medium text-ink">{entrada.subcriterion.name}</p>
                      {salvando === code ? (
                        <span className="text-xs text-ink-muted">Salvando…</span>
                      ) : salvo === code ? (
                        <span className="text-xs text-brand-sage-deep">Salvo</span>
                      ) : estado.status === null ? (
                        <Badge variant="default">Ainda não avaliado</Badge>
                      ) : null}
                    </div>

                    <p className="mt-0.5 max-w-reading text-sm text-ink-muted">
                      {entrada.subcriterion.description}
                    </p>

                    <fieldset className="mt-3">
                      <legend className="sr-only">
                        Estado de {entrada.subcriterion.name}
                      </legend>
                      <div className="flex flex-wrap gap-x-5 gap-y-2">
                        {SUBCRITERION_STATUSES.map((status) => (
                          <label
                            key={status}
                            className="flex cursor-pointer items-center gap-2 text-sm text-ink"
                            title={SUBCRITERION_STATUS_MEANING[status]}
                          >
                            <input
                              type="radio"
                              name={`status-${code}`}
                              value={status}
                              checked={estado.status === status}
                              onChange={() => gravar(code, { ...estado, status })}
                            />
                            {SUBCRITERION_STATUS_LABELS[status]}
                          </label>
                        ))}
                      </div>
                    </fieldset>

                    <div className="mt-3">
                      <label
                        htmlFor={`note-${code}`}
                        className="text-xs text-ink-muted"
                      >
                        Observação (opcional)
                      </label>
                      <input
                        id={`note-${code}`}
                        type="text"
                        maxLength={NOTE_MAX_LENGTH}
                        value={estado.note}
                        disabled={estado.status === null}
                        onChange={(evento) =>
                          setLocal((atual) => ({
                            ...atual,
                            [code]: { ...estado, note: evento.target.value },
                          }))
                        }
                        onBlur={() => {
                          if (estado.status && estado.note !== (entrada.note ?? "")) {
                            gravar(code, estado);
                          }
                        }}
                        className={cn(
                          "mt-1 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink",
                          estado.status === null && "cursor-not-allowed opacity-50",
                        )}
                        placeholder={
                          estado.status === null
                            ? "Escolha um estado antes de observar."
                            : "Uma frase curta, se ajudar a ler depois."
                        }
                      />
                    </div>

                    {/* A ASSINATURA. O Mapa é o que a Aliviar afirma sobre um
                        médico real, e até aqui toda declaração era anônima: a
                        coluna existia, a tela lia, e nenhuma escrita
                        preenchia. Sem autor resolvido, NÃO se escreve nada —
                        "autor desconhecido" seria pior que o silêncio, porque
                        sugere que alguém assinou. */}
                    {entrada.declaredByName ? (
                      <p className="mt-2 text-xs text-ink-muted">
                        Declarado por {entrada.declaredByName}
                        {entrada.registradoEm
                          ? ` em ${new Date(entrada.registradoEm).toLocaleDateString("pt-BR")}`
                          : ""}
                        .
                      </p>
                    ) : null}

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
    </Card>
  );
}
