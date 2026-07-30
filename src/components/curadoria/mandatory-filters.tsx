"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  addMandatoryFilterAction,
  addPreferenceAction,
  removeFilterAction,
} from "@/modules/curadoria/actions";
import {
  MANDATORY_FILTER_KINDS,
  MANDATORY_FILTER_LABELS,
  type MandatoryFilterKind,
} from "@/modules/curadoria/types";

/**
 * O QUE ELIMINA — registro dos filtros obrigatórios.
 *
 * @metodo Ontologia §3.7 — restrição elimina opções e nunca recebe peso
 * @metodo Engine §4.1 — filtros são binários, conjuntivos e nunca afrouxados pelo Motor
 * @metodo Engine §5.1 — toda eliminação carrega motivo em linguagem humana
 * @metodo Fundamentos §13 — P5: nenhum filtro é inferido; ele vem da fala do paciente
 *
 * Por que existe: a fase Filtros era a única do COS sem nenhuma superfície. A
 * regra existia no Método, a action e a RLS existiam no código, e o Curador não
 * tinha onde registrar um requisito inegociável — a fase se dava por concluída
 * sozinha porque "todo filtro tem motivo" é verdade quando não há filtro nenhum.
 * Uma etapa que ninguém consegue executar é documentação, não jornada.
 *
 * O que NUNCA faz: sugerir um filtro, inferir um a partir da história, ou
 * aceitar um sem o motivo nas palavras do paciente. Zero filtros continua sendo
 * um resultado legítimo — o que não pode é ser um resultado por omissão.
 */

export type MandatoryFilterView = {
  id: string;
  kind: string;
  label: string;
  value: string;
  reason: string;
};

/**
 * Preferência — o que a pessoa disse e que não elimina ninguém.
 *
 * @metodo Ontologia §3.7 — restrição elimina; preferência informa a conversa
 *
 * Terceira categoria deliberada: nem tudo que importa cabe em "elimina" ou
 * "pesa". "Preferia alguém mais velho" não pode virar filtro (excluiria gente
 * sem que ela tenha pedido isso) nem peso (não é critério comparável) — mas
 * some do processo se não tiver onde ficar.
 */
export type PreferenceView = { id: string; value: string; reason: string };

/** Filtros booleanos não pedem valor: o próprio rótulo já é a afirmação. */
const BOOLEAN_KINDS: MandatoryFilterKind[] = ["CUIDADO_CONTINUO", "DISPONIBILIDADE_IMEDIATA"];

const VALUE_HINTS: Record<MandatoryFilterKind, string> = {
  UF: "Ex.: SP",
  AREA_DE_ATUACAO: "Ex.: Oncologia mamária",
  CUIDADO_CONTINUO: "",
  DISPONIBILIDADE_IMEDIATA: "",
};

export function MandatoryFilters({
  priorityProfileId,
  filters,
  preferences = [],
  patientFirstName,
  readOnly,
}: {
  priorityProfileId: string;
  filters: MandatoryFilterView[];
  preferences?: PreferenceView[];
  patientFirstName: string;
  /** Depois de validado, o Perfil é imutável — corrigir exige construir um novo. */
  readOnly: boolean;
}) {
  const [kind, setKind] = useState<MandatoryFilterKind>("AREA_DE_ATUACAO");
  const [value, setValue] = useState("");
  const [reason, setReason] = useState("");
  const [preferencia, setPreferencia] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function registrarPreferencia() {
    setErro(null);
    startTransition(async () => {
      const result = await addPreferenceAction({
        priorityProfileId,
        value: preferencia.trim(),
      });
      if (result.success) setPreferencia("");
      else setErro(result.error ?? "Não foi possível registrar a preferência.");
    });
  }

  const isBoolean = BOOLEAN_KINDS.includes(kind);
  const podeAdicionar = (isBoolean || value.trim().length > 0) && reason.trim().length > 0;

  function adicionar() {
    setErro(null);
    startTransition(async () => {
      const result = await addMandatoryFilterAction({
        priorityProfileId,
        kind,
        value: isBoolean ? "true" : value.trim(),
        note: reason.trim(),
      });
      if (result.success) {
        setValue("");
        setReason("");
      } else {
        setErro(result.error ?? "Não foi possível adicionar o filtro.");
      }
    });
  }

  function remover(filterId: string) {
    setErro(null);
    startTransition(async () => {
      const result = await removeFilterAction({ priorityProfileId, filterId });
      if (!result.success) setErro(result.error ?? "Não foi possível remover o filtro.");
    });
  }

  return (
    <div className="space-y-4">
      {filters.length === 0 ? (
        <p className="max-w-reading text-sm leading-relaxed text-ink-muted">
          Nenhum requisito inegociável registrado. Zero filtros é um resultado válido — desde que
          tenha sido conversado com {patientFirstName}, não esquecido.
        </p>
      ) : (
        <ul className="space-y-2">
          {filters.map((filtro) => (
            <li key={filtro.id} className="rounded-md border border-border bg-surface p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="text-sm font-medium text-ink">
                  {filtro.value === "true" ? filtro.label : `${filtro.label}: ${filtro.value}`}
                </p>
                {readOnly ? null : (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => remover(filtro.id)}
                    disabled={pending}
                  >
                    Remover
                  </Button>
                )}
              </div>
              <p className="mt-1 border-l-2 border-border pl-2 text-sm italic leading-relaxed text-ink-muted">
                {filtro.reason}
              </p>
            </li>
          ))}
        </ul>
      )}

      {/* PREFERÊNCIA — nem elimina, nem pesa. Sem este lugar, o que a pessoa
          disse virava filtro por falta de opção, e alguém era excluído por
          algo que ela nunca pediu para eliminar. */}
      <div className="rounded-md border border-border bg-surface p-4">
        <p className="text-sm font-medium text-ink">O que ela disse, e não elimina ninguém</p>
        <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">
          Preferências ficam registradas nas palavras dela e informam a sua conversa — nunca cortam
          uma opção nem recebem peso.
        </p>

        {preferences.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {preferences.map((preference) => (
              <li key={preference.id} className="flex flex-wrap items-start justify-between gap-2">
                <span className="max-w-reading text-sm italic leading-relaxed text-ink">
                  &ldquo;{preference.value}&rdquo;
                </span>
                {readOnly ? null : (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => remover(preference.id)}
                    disabled={pending}
                  >
                    Remover
                  </Button>
                )}
              </li>
            ))}
          </ul>
        ) : null}

        {readOnly ? null : (
          <div className="mt-3 space-y-2">
            <label htmlFor="preferencia-valor" className="block text-xs text-ink-muted">
              Como ela disse
            </label>
            <Textarea
              id="preferencia-valor"
              rows={2}
              maxLength={500}
              value={preferencia}
              disabled={pending}
              onChange={(event) => setPreferencia(event.target.value)}
              placeholder="A frase dela, sem traduzir"
            />
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={registrarPreferencia}
              disabled={pending || preferencia.trim().length === 0}
            >
              Registrar preferência
            </Button>
          </div>
        )}
      </div>

      {readOnly ? (
        <p className="text-xs text-ink-muted">
          O Perfil está validado — os requisitos ficaram como {patientFirstName} os declarou.
        </p>
      ) : (
        <div className="space-y-3 rounded-md border border-border bg-canvas p-4">
          <p className="text-sm font-medium text-ink">Registrar um requisito inegociável</p>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="filtro-tipo" className="mb-1 block text-xs text-ink-muted">
                O que precisa ser verdade
              </label>
              <Select
                id="filtro-tipo"
                value={kind}
                onChange={(event) => setKind(event.target.value as MandatoryFilterKind)}
                disabled={pending}
              >
                {MANDATORY_FILTER_KINDS.map((option) => (
                  <option key={option} value={option}>
                    {MANDATORY_FILTER_LABELS[option]}
                  </option>
                ))}
              </Select>
            </div>

            {isBoolean ? null : (
              <Input
                id="filtro-valor"
                label="Qual valor"
                value={value}
                onChange={(event) => setValue(event.target.value)}
                placeholder={VALUE_HINTS[kind]}
                maxLength={120}
                disabled={pending}
              />
            )}
          </div>

          {/* O motivo não é burocracia: é o que permite reconstruir, meses
              depois, por que alguém foi eliminado (Engine §5.1). */}
          <div>
            <label htmlFor="filtro-motivo" className="mb-1 block text-xs text-ink-muted">
              Por que isto elimina uma opção — nas palavras de {patientFirstName}
            </label>
            <Textarea
              id="filtro-motivo"
              rows={2}
              maxLength={1000}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              disabled={pending}
              placeholder="O que ela disse que torna isto inegociável"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" onClick={adicionar} disabled={pending || !podeAdicionar}>
              Registrar requisito
            </Button>
            {!podeAdicionar && reason.trim().length === 0 ? (
              <span className="text-xs text-ink-muted">
                Um filtro sem motivo elimina alguém sem explicação — por isso o motivo é obrigatório.
              </span>
            ) : null}
            {erro ? (
              <span role="alert" className="text-sm text-error">
                {erro}
              </span>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
