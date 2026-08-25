"use client";

/**
 * EMITIR E ENTREGAR — os dois atos que saem das mãos do Curador.
 *
 * @metodo ADR-048/Bloco B — a entrega é transacional: seleção, Relatório,
 *         evento e auditoria num único ato, ou nada
 * @metodo ADR-093 — a Mesa é o documento; entregar não é escrever
 *
 * Escrever o relatório e entregá-lo são coisas de naturezas diferentes, e esta
 * tela existe para não deixar que a diferença suma numa rolagem só.
 *
 * Salvar é reversível: o rascunho fica, ninguém vê, dá para voltar amanhã.
 * **Entregar chega a uma pessoa.** A partir dali ela abre o portal e lê três
 * nomes com a assinatura da Aliviar embaixo, e não existe desfazer que a faça
 * não ter lido.
 *
 * Por isso: bloco à parte, com o que vai acontecer escrito antes, e uma
 * confirmação que exige intenção. Não é fricção decorativa — é a única
 * proteção contra um clique no fim de um dia longo.
 */

import { useState, useTransition } from "react";

import { deliverSelectionAction, emitReportAction } from "@/modules/curadoria/actions";

type Props = {
  priorityProfileId: string | null;
  curatedSelectionId: string | null;
  nomeDaPaciente: string;
  /** Já emitido? Emitir é pré-condição da entrega. */
  emitido: boolean;
  entregue: boolean;
  temRelatorio: boolean;
};

export function EmitirEEntregar({
  priorityProfileId,
  curatedSelectionId,
  nomeDaPaciente,
  emitido,
  entregue,
  temRelatorio,
}: Props) {
  const [confirmando, setConfirmando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [feito, setFeito] = useState<"EMITIDO" | "ENTREGUE" | null>(null);
  const [agindo, iniciar] = useTransition();

  if (entregue || feito === "ENTREGUE") {
    return (
      <section className="border-t border-border pt-6">
        <h3 className="text-base font-medium text-ink">Entregue</h3>
        <p className="mt-1 max-w-3xl text-sm text-ink-muted">
          {nomeDaPaciente} já pode ler os três caminhos no portal dela. A decisão é dela, no
          tempo dela — e ninguém aqui a apressa.
        </p>
      </section>
    );
  }

  if (!temRelatorio) {
    return (
      <section className="border-t border-border pt-6">
        <h3 className="text-base font-medium text-ink">Emitir e entregar</h3>
        <p className="mt-1 max-w-3xl text-sm text-ink-muted">
          Abre quando o relatório estiver salvo.
        </p>
      </section>
    );
  }

  function emitir() {
    setErro(null);
    if (!priorityProfileId) {
      setErro("O Perfil de Prioridades ainda não foi aberto.");
      return;
    }
    iniciar(async () => {
      const resultado = await emitReportAction({ priorityProfileId });
      if (resultado.success) {
        setFeito("EMITIDO");
        return;
      }
      setErro(resultado.error ?? "Não foi possível emitir.");
    });
  }

  function entregar() {
    setErro(null);
    if (!curatedSelectionId) {
      setErro("A seleção dos três ainda não foi salva.");
      return;
    }
    iniciar(async () => {
      const resultado = await deliverSelectionAction({ curatedSelectionId });
      if (resultado.success) {
        setFeito("ENTREGUE");
        setConfirmando(false);
        return;
      }
      setErro(resultado.error ?? "Não foi possível entregar.");
    });
  }

  const jaEmitido = emitido || feito === "EMITIDO";

  return (
    <section className="flex flex-col gap-4 border-t border-border pt-6">
      <header className="flex flex-col gap-1">
        <h3 className="text-base font-medium text-ink">Emitir e entregar</h3>
        <p className="max-w-3xl text-sm text-ink-muted">
          Dois atos, nesta ordem. <strong className="font-medium text-ink">Emitir</strong> fecha
          o relatório: ele para de ser rascunho e passa a ser o documento desta Curadoria.{" "}
          <strong className="font-medium text-ink">Entregar</strong> abre o portal de{" "}
          {nomeDaPaciente} — e isso não se desfaz.
        </p>
      </header>

      {erro ? <p className="text-sm text-ink">{erro}</p> : null}

      {!jaEmitido ? (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={emitir}
            disabled={agindo}
            className="rounded-md border border-border px-4 py-2 text-sm font-medium text-ink disabled:opacity-50"
          >
            {agindo ? "Emitindo…" : "Emitir o relatório"}
          </button>
          <span className="text-xs text-ink-muted">Ainda não chega a ela.</span>
        </div>
      ) : !confirmando ? (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-ink-muted">Relatório emitido. Falta a entrega.</p>
          <button
            type="button"
            onClick={() => setConfirmando(true)}
            className="self-start rounded-md border border-border px-4 py-2 text-sm font-medium text-ink"
          >
            Entregar a {nomeDaPaciente}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3 rounded-md border border-border bg-canvas p-4">
          {/* O que vai acontecer, dito ANTES — e não numa mensagem de sucesso
              depois, quando já não adianta. */}
          <p className="max-w-2xl text-sm text-ink">
            Ao entregar, {nomeDaPaciente} passa a ver os três caminhos no portal dela, com o
            que cada um responde ao que ela disse e o que cada um custa. Ela decide quando
            quiser, e pode não decidir.
          </p>
          <p className="max-w-2xl text-sm text-ink-muted">
            Não há desfazer. Uma correção depois disto é uma errata, que ela também lê.
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={entregar}
              disabled={agindo}
              className="rounded-md border border-ink px-4 py-2 text-sm font-medium text-ink disabled:opacity-50"
            >
              {agindo ? "Entregando…" : "Confirmo — entregar agora"}
            </button>
            <button
              type="button"
              onClick={() => setConfirmando(false)}
              className="text-sm text-ink-muted"
            >
              Ainda não
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
