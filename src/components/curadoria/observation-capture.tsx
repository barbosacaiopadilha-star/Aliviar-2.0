"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  recordObservationAction,
  removeObservationAction,
  reviseObservationAction,
} from "@/modules/briefing/actions";
import {
  OBSERVATION_KINDS,
  OBSERVATION_KIND_LABELS,
  type CuratorObservation,
  type ObservationKind,
} from "@/modules/briefing/types";

/**
 * CAPTURA DE OBSERVAÇÕES DO CURADOR.
 *
 * @metodo Método §3 — a leitura do Curador é parte do Método, não ruído
 * @metodo Engine §4 — quem decide é o Curador; o Motor pode ser contrariado
 * @metodo Experience §3 — copiloto: sinaliza, nunca bloqueia
 *
 * Governado por docs/ALIGNMENT_PROFILE.md §3 e ACE_PRINCIPLES.md (P8 — direito
 * à revisão; P10 — sobre situação, nunca sobre essência; P11 — a observação
 * pertence ao Case, não à pessoa).
 *
 * Por que existe: o Curador escuta coisas na Consulta Inicial que não cabem em
 * nenhuma opção fechada — que a pessoa quer a filha junto, que ficou tensa ao
 * falar de custo, que a sugestão do sistema não bate com o que ele viu. Sem
 * um lugar para registrar isso, a leitura dele se perde entre a conversa e a
 * apresentação, e ele reconstrói tudo de memória semanas depois.
 *
 * Por que CU4 ("Discordo de uma observação do sistema") fica aqui e não escondido
 * atrás de um botão em cada sugestão: discordar precisa ser encontrável sem ser
 * cobrado. Numa lista com as outras, é um registro normal — não um incidente.
 *
 * O que NUNCA faz: exigir observação para avançar de fase, sugerir texto,
 * reescrever o que foi digitado, ou vincular a observação à pessoa como
 * sujeito permanente. O vínculo é com o Case, e o Case termina.
 */

type Props = {
  caseId: string;
  observations: CuratorObservation[];
  /** Quem está olhando — só o autor vê corrigir/remover. Vem do servidor. */
  viewerId: string;
};

export function ObservationCapture({ caseId, observations, viewerId }: Props) {
  return (
    <Card className="space-y-6">
      <CardHeader>
        <CardTitle>Observações para a apresentação</CardTitle>
        <CardDescription>
          Sua leitura desta conversa, para você mesmo consultar na hora de apresentar. Fica no caso,
          não no histórico da pessoa. Escreva sobre a situação — nunca sobre como ela é.
        </CardDescription>
      </CardHeader>

      <NewObservation caseId={caseId} />

      {observations.length > 0 ? (
        <ul className="space-y-2">
          {observations.map((observation) => (
            <li key={observation.id}>
              <ObservationRow
                observation={observation}
                caseId={caseId}
                isAuthor={observation.authorId === viewerId}
              />
            </li>
          ))}
        </ul>
      ) : (
        <p className="max-w-reading text-sm leading-relaxed text-ink-muted">
          Nenhuma observação registrada. A Curadoria segue normalmente sem nenhuma — isto é apoio
          para você, não etapa a cumprir.
        </p>
      )}
    </Card>
  );
}

function KindSelect({
  id,
  value,
  onChange,
  disabled,
}: {
  id: string;
  value: ObservationKind;
  onChange: (kind: ObservationKind) => void;
  disabled: boolean;
}) {
  return (
    <Select
      id={id}
      value={value}
      onChange={(event) => onChange(event.target.value as ObservationKind)}
      disabled={disabled}
    >
      {OBSERVATION_KINDS.map((kind) => (
        <option key={kind} value={kind}>
          {OBSERVATION_KIND_LABELS[kind]}
        </option>
      ))}
    </Select>
  );
}

function NewObservation({ caseId }: { caseId: string }) {
  const [kind, setKind] = useState<ObservationKind>("CU1");
  const [note, setNote] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function registrar() {
    setErro(null);
    startTransition(async () => {
      const result = await recordObservationAction({ caseId, kind, note });
      // O texto só é limpo quando o registro deu certo — nada digitado se
      // perde por causa de um erro do sistema.
      if (result.success) setNote("");
      else setErro(result.error);
    });
  }

  return (
    <div className="space-y-2 rounded-md border border-border bg-canvas p-4">
      <label htmlFor="nova-observacao-tipo" className="block text-sm font-medium text-ink">
        Registrar observação
      </label>
      <KindSelect id="nova-observacao-tipo" value={kind} onChange={setKind} disabled={pending} />

      <Textarea
        id="nova-observacao-nota"
        aria-label="O que você observou"
        rows={3}
        maxLength={2000}
        value={note}
        onChange={(event) => setNote(event.target.value)}
        disabled={pending}
        placeholder="O que aconteceu nesta conversa"
      />

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" onClick={registrar} disabled={pending || note.trim().length === 0}>
          Registrar
        </Button>
        {erro ? (
          <span role="alert" className="text-sm text-error">
            {erro}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function ObservationRow({
  observation,
  caseId,
  isAuthor,
}: {
  observation: CuratorObservation;
  caseId: string;
  isAuthor: boolean;
}) {
  const [editando, setEditando] = useState(false);
  const [note, setNote] = useState(observation.note);
  const [erro, setErro] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function corrigir() {
    setErro(null);
    startTransition(async () => {
      const result = await reviseObservationAction({
        observationId: observation.id,
        caseId,
        note,
      });
      if (result.success) setEditando(false);
      else setErro(result.error);
    });
  }

  function remover() {
    setErro(null);
    startTransition(async () => {
      const result = await removeObservationAction({ observationId: observation.id, caseId });
      if (!result.success) setErro(result.error);
    });
  }

  return (
    <div className="rounded-md border border-border bg-surface p-3">
      <p className="text-xs text-ink-muted">{OBSERVATION_KIND_LABELS[observation.kind]}</p>

      {editando ? (
        <>
          <Textarea
            aria-label="Corrigir observação"
            rows={3}
            maxLength={2000}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            disabled={pending}
            className="mt-1"
          />
          <div className="mt-2 flex flex-wrap gap-3">
            <Button type="button" size="sm" onClick={corrigir} disabled={pending || !note.trim()}>
              Salvar correção
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setNote(observation.note);
                setEditando(false);
                setErro(null);
              }}
              disabled={pending}
            >
              Cancelar
            </Button>
          </div>
        </>
      ) : (
        <p className="mt-1 max-w-reading text-sm leading-relaxed text-ink">{observation.note}</p>
      )}

      <p className="mt-1 text-xs text-ink-muted">
        {observation.authorName} · {new Date(observation.observedAt).toLocaleDateString("pt-BR")}
      </p>

      {/* Só o autor corrige ou remove o que escreveu. A leitura de um Curador
          não apaga a de outro — elas coexistem, cada uma com seu autor. */}
      {isAuthor && !editando ? (
        <div className="mt-2 flex flex-wrap gap-3">
          <Button type="button" size="sm" variant="ghost" onClick={() => setEditando(true)}>
            Corrigir
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={remover} disabled={pending}>
            Remover
          </Button>
        </div>
      ) : null}

      {erro ? (
        <p role="alert" className="mt-2 text-sm text-error">
          {erro}
        </p>
      ) : null}
    </div>
  );
}
