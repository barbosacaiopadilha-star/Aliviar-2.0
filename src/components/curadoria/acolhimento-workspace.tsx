"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  registerAcolhimentoAction,
  registrarPrimeiroEncontroRealizadoAction,
} from "@/modules/curadoria/actions";

/**
 * Tela de trabalho da Fase 1 — Acolhimento.
 *
 * @metodo Engine §4 — o Motor reconhece e explica; quem declara é o Curador
 * @metodo Experience §5 — UX3: nunca esconder o próximo passo
 *
 * Por que existe: o Curador precisa de um lugar para registrar o que extraiu do
 * material da pessoa antes da conversa — e, quando não há material, precisa
 * seguir sem cerimônia. Antes desta tela, a fase explicava o que faltava sem
 * oferecer como resolver (achado do Fundador em produção, 2026-07-24).
 *
 * M-001/M-003 (Item 1.5, achado P13): os dois checkboxes saíram. Eles pediam
 * ao Curador que AFIRMASSE ter lido; agora ele REGISTRA o que leu, e é esse
 * conteúdo que conclui a fase. A doutrina que já estava escrita aqui em
 * comentário — "confirmar revisão do que não está à vista é pedir uma
 * declaração falsa" — passa a valer de fato: sem material, nada é pedido.
 *
 * O que esta tela NUNCA faz: registrar sozinha. Cada linha é ato do Curador.
 */
export function AcolhimentoWorkspace({
  caseId,
  meetingHeldAt,
  knownFacts,
  openPendencies,
  hasSubmittedStory,
  hasLinkedDocument,
  preparado,
  nextPhaseHref,
}: {
  caseId: string;
  /** D-9: prova de que o Primeiro Encontro aconteceu. `null` = sem prova. */
  meetingHeldAt: string | null;
  knownFacts: string[];
  openPendencies: string[];
  /** M-003 §2.4 — há história enviada vinculada a este Case? */
  hasSubmittedStory: boolean;
  /** M-003 §2.4 — há documento vinculado à história deste Case? */
  hasLinkedDocument: boolean;
  /** O predicado do COS, já calculado — a tela nunca o recalcula. */
  preparado: boolean;
  nextPhaseHref: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [fatos, setFatos] = useState(knownFacts.join("\n"));
  const [pendencias, setPendencias] = useState(openPendencies.join("\n"));

  const temMaterial = hasSubmittedStory || hasLinkedDocument;

  function linhas(texto: string): string[] {
    return texto
      .split("\n")
      .map((linha) => linha.trim())
      .filter((linha) => linha !== "");
  }

  const registravel = linhas(fatos).length + linhas(pendencias).length >= 1;

  function salvar() {
    if (pending) return;
    setErro(null);
    startTransition(async () => {
      const result = await registerAcolhimentoAction({
        caseId,
        knownFacts: linhas(fatos),
        openPendencies: linhas(pendencias),
      });
      if (result.success) router.refresh();
      else setErro(result.error);
    });
  }

  // RAMO B (M-003 §5): sem material, não há o que preparar. Nenhum formulário,
  // nenhum clique — e a fase já está concluída por derivação. A tela diz que
  // não há material, nunca que "não foi revisado" (I-8).
  if (!temMaterial) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Acolhimento</CardTitle>
          <CardDescription>
            Ainda não há material desta pessoa para revisar — nem história enviada, nem
            documentos. Nada a registrar aqui.
          </CardDescription>
        </CardHeader>

        <div className="mt-5 border-t border-border pt-4">
          <Link
            href={nextPhaseHref}
            className="inline-flex min-h-11 items-center gap-2 rounded-md bg-brand-primary px-4 py-2.5 text-sm font-medium text-surface transition-colors duration-fast ease-standard hover:bg-brand-primary-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            Prosseguir para a História
            <span aria-hidden="true">→</span>
          </Link>
          <p className="mt-3 text-xs text-ink-muted">
            Se a história ou algum documento chegar depois, esta etapa volta a pedir o
            registro do que você extraiu deles.
          </p>
        </div>
      </Card>
    );
  }

  // RAMO A (M-003 §4): há material. O Curador registra o que extraiu — ao menos
  // um item, em qualquer das duas listas.
  return (
    <Card>
      {/* D-9 · o Primeiro Encontro é um EVENTO, e precisa de prova própria.
          Reconhecer a história e validar os mapas são produtos dele — e o
          Curador pode fazer os dois lendo o material, sem ter havido encontro.
          Por isso a realização não é inferida de nada: é este ato, ou nada. */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <p className="text-sm font-medium text-ink">Primeiro Encontro com o Curador</p>
          <p className="mt-0.5 text-xs text-ink-muted">
            {meetingHeldAt
              ? `Registrado como realizado em ${new Date(meetingHeldAt).toLocaleDateString("pt-BR")}.`
              : "Ainda sem registro de realização."}
          </p>
        </div>
        {meetingHeldAt ? null : (
          <Button
            type="button"
            variant="secondary"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                setErro(null);
                const result = await registrarPrimeiroEncontroRealizadoAction({ caseId });
                if (!result.success) setErro(result.error);
                else router.refresh();
              })
            }
          >
            Registrar encontro como realizado
          </Button>
        )}
      </div>

      <CardHeader>
        <CardTitle>Registrar o Acolhimento</CardTitle>
        <CardDescription>
          Escreva o que você extraiu do material desta pessoa — um item por linha. É o que
          faz o paciente não precisar recomeçar do zero.
        </CardDescription>
      </CardHeader>

      {erro ? (
        <p role="alert" className="mb-3 rounded-md border border-error bg-error-surface px-3 py-2 text-sm text-ink">
          {erro}
        </p>
      ) : null}

      <div className="space-y-4">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink">O que já se sabe</span>
          <span className="mb-2 block text-xs text-ink-muted">
            Fatos que você levou da história e dos documentos para a conversa.
          </span>
          <textarea
            value={fatos}
            onChange={(event) => setFatos(event.target.value)}
            disabled={pending}
            rows={5}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm leading-relaxed text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            placeholder={"Um fato por linha."}
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink">O que ficou em aberto</span>
          <span className="mb-2 block text-xs text-ink-muted">
            Pendências que a leitura revelou — o exame citado que não veio, o que falta confirmar.
          </span>
          <textarea
            value={pendencias}
            onChange={(event) => setPendencias(event.target.value)}
            disabled={pending}
            rows={4}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm leading-relaxed text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            placeholder={"Uma pendência por linha."}
          />
        </label>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-border pt-4">
        <Button type="button" onClick={salvar} disabled={pending || !registravel} isLoading={pending}>
          {pending ? "Registrando…" : "Registrar preparação"}
        </Button>

        {preparado ? (
          <Link
            href={nextPhaseHref}
            className="inline-flex min-h-11 items-center gap-2 rounded-md bg-brand-primary px-4 py-2.5 text-sm font-medium text-surface transition-colors duration-fast ease-standard hover:bg-brand-primary-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            Prosseguir para a História
            <span aria-hidden="true">→</span>
          </Link>
        ) : (
          <p className="text-xs text-ink-muted">
            A História abre quando houver ao menos um item registrado.
          </p>
        )}
      </div>
    </Card>
  );
}
