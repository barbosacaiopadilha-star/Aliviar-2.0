"use client";

/**
 * O RELATÓRIO — escrito a partir da própria Mesa.
 *
 * @metodo ADR-042 — o relatório carrega quem, por quê, como conversa com os
 *         pesos dela, e o que custa
 * @metodo ADR-093 — a Mesa é o documento que ela vai ler, sendo escrito
 * @metodo ADR-084 — o vidro é da casa DELA; aqui é papel
 *
 * Três campos por opção, e o contrato exige os três. O rascunho preenche dois
 * deles com o que já está declarado — a relação com os pesos e o que custa —
 * porque essas duas coisas a Mesa nova já sabe. A justificativa vem da razão
 * escrita na composição.
 *
 * Nada é salvo sozinho, e nada aparece no campo sem alguém pedir. Ver o
 * rascunho e adotá-lo são dois atos, e é essa distância que separa "ajuda a
 * escrever" de "escreve no seu lugar".
 */

import { useMemo, useState, useTransition } from "react";

import { saveReportAction } from "@/modules/curadoria/actions";
import { resumirCandidatos } from "@/modules/curadoria/composicao-dos-tres";
import type { Linha } from "@/modules/curadoria/mesa-por-preocupacoes";
import { rascunharRelatorio } from "@/modules/curadoria/rascunho-do-relatorio";

type Props = {
  priorityProfileId: string | null;
  linhas: readonly Linha[];
  profissionais: readonly { id: string; nome: string }[];
  /** Os três já compostos, na ordem em que ela vai ler. */
  escolhidos: readonly { id: string; nome: string; rationale: string }[];
  composicaoJaEscrita: string;
  /**
   * O RELATÓRIO QUE JÁ EXISTE — `SIM-52`.
   *
   * O editor abria sempre em branco. Numa Curadoria já ENTREGUE ele mostrava
   * os três campos de cada opção vazios e dizia "falta preencher" — sobre um
   * documento que a paciente já estava lendo, e que está íntegro no banco.
   *
   * Não havia risco de perda: `protect_delivered_report_options` recusa a
   * escrita depois da entrega. O custo era outro — o Curador não conseguia
   * reler o que entregou sem abrir o portal dela, e descobria a regra por erro
   * de banco, depois de digitar. A Mesa antiga tinha essa guarda na interface
   * (`T-11-6 · C8`) e ela saiu junto com o `MesaWorkspace`.
   */
  jaEscrito?: readonly {
    id: string;
    justification: string;
    relationToWeights: string;
    attentionPoints: readonly string[];
  }[];
  /** Entregue: vira leitura, e a razão é dita antes de a pessoa tentar. */
  entregue?: boolean;
};

type Campos = { justification: string; relationToWeights: string; attentionPoints: string };

export function EscreverORelatorio({
  priorityProfileId,
  linhas,
  profissionais,
  escolhidos,
  composicaoJaEscrita,
  jaEscrito,
  entregue = false,
}: Props) {
  const rascunhos = useMemo(() => {
    const resumos = resumirCandidatos({ linhas, profissionais });
    return rascunharRelatorio(resumos, escolhidos.map((e) => e.id));
  }, [linhas, profissionais, escolhidos]);

  // `SIM-52`: abre com o que já foi escrito. Os pontos de atenção são uma
  // coleção no banco e um item por linha na tela — a mesma serialização que o
  // editor do Relatório já usa, e que tem inversa definida.
  const [campos, setCampos] = useState<Record<string, Campos>>(() =>
    Object.fromEntries(
      (jaEscrito ?? []).map((opcao) => [
        opcao.id,
        {
          justification: opcao.justification,
          relationToWeights: opcao.relationToWeights,
          attentionPoints: opcao.attentionPoints.join("\n"),
        },
      ]),
    ),
  );
  const [composicao, setComposicao] = useState(composicaoJaEscrita);
  const [erro, setErro] = useState<string | null>(null);
  const [salvo, setSalvo] = useState(false);
  const [salvando, iniciar] = useTransition();

  function ler(id: string): Campos {
    return campos[id] ?? { justification: "", relationToWeights: "", attentionPoints: "" };
  }

  function escrever(id: string, campo: keyof Campos, valor: string) {
    setSalvo(false);
    setCampos((atual) => ({ ...atual, [id]: { ...ler(id), [campo]: valor } }));
  }

  /** Adotar o rascunho de UMA opção — ato explícito, um clique, reversível. */
  function adotar(id: string) {
    const rascunho = rascunhos.find((r) => r.profissionalId === id);
    const escolhido = escolhidos.find((e) => e.id === id);
    if (!rascunho) return;
    setSalvo(false);
    setCampos((atual) => ({
      ...atual,
      [id]: {
        justification: ler(id).justification || escolhido?.rationale || "",
        relationToWeights: ler(id).relationToWeights || rascunho.relationToWeights,
        attentionPoints: ler(id).attentionPoints || rascunho.attentionPoints.join("\n"),
      },
    }));
  }

  const prontos =
    escolhidos.length === 3 &&
    composicao.trim().length > 0 &&
    escolhidos.every((e) => {
      const dele = ler(e.id);
      return (
        dele.justification.trim().length > 0 &&
        dele.relationToWeights.trim().length > 0 &&
        // O contrato exige ao menos um ponto de atenção. Barrar aqui evita
        // descobrir isso depois de escrever os outros dois campos das três.
        dele.attentionPoints.split("\n").some((linha) => linha.trim().length > 0)
      );
    });

  function gravar() {
    setErro(null);
    if (!priorityProfileId) {
      setErro("O Perfil de Prioridades ainda não foi aberto — o relatório pende dele.");
      return;
    }
    iniciar(async () => {
      const resultado = await saveReportAction({
        priorityProfileId,
        compositionRationale: composicao.trim(),
        options: escolhidos.map((e) => {
          const dele = ler(e.id);
          return {
            professionalProfileId: e.id,
            justification: dele.justification.trim(),
            relationToWeights: dele.relationToWeights.trim(),
            attentionPoints: dele.attentionPoints
              .split("\n")
              .map((linha) => linha.trim())
              .filter(Boolean),
            suggestedQuestions: [],
          };
        }),
      });
      if (resultado.success) {
        setSalvo(true);
        return;
      }
      setErro(resultado.error ?? "Não foi possível salvar o relatório.");
    });
  }

  if (escolhidos.length < 3) {
    return (
      <section className="border-t border-border pt-6">
        <h3 className="text-base font-medium text-ink">O relatório</h3>
        <p className="mt-1 max-w-3xl text-sm text-ink-muted">
          Abre quando os três caminhos estiverem compostos. É o texto que ela vai ler para
          decidir — e ele nasce do que já está nesta tela.
        </p>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-5 border-t border-border pt-6">
      <header className="flex flex-col gap-1">
        <h3 className="text-base font-medium text-ink">O relatório</h3>
        <p className="max-w-3xl text-sm text-ink-muted">
          {entregue
            ? "Este é o texto que ela recebeu. Depois da entrega o Relatório não muda — corrigir exige compor uma nova Curadoria, e ela ficaria sabendo."
            : "O texto que ela vai ler. Cada opção precisa dizer por que está aqui, como conversa com o que ela declarou, e o que custa — o contrato não aceita opção sem custo."}
        </p>
      </header>

      {escolhidos.map((escolhido) => {
        const dele = ler(escolhido.id);
        const rascunho = rascunhos.find((r) => r.profissionalId === escolhido.id);
        const temRascunho = Boolean(
          rascunho && (rascunho.relationToWeights || rascunho.attentionPoints.length > 0),
        );

        return (
          <article
            key={escolhido.id}
            className="flex flex-col gap-3 rounded-md border border-border p-4"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h4 className="text-sm font-medium text-ink">{escolhido.nome}</h4>
              {temRascunho ? (
                <button
                  type="button"
                  onClick={() => adotar(escolhido.id)}
                  className="rounded-md border border-border px-2.5 py-1 text-xs text-ink-muted transition-colors hover:text-ink"
                >
                  Trazer o rascunho da Mesa
                </button>
              ) : null}
            </div>

            <label className="flex flex-col gap-1 text-xs font-medium text-ink">
              Por que este caminho está aqui
              <textarea
                value={dele.justification}
                onChange={(e) => escrever(escolhido.id, "justification", e.target.value)}
                rows={3}
                className="rounded-md border border-border bg-surface px-2 py-1.5 text-xs font-normal text-ink"
              />
            </label>

            <label className="flex flex-col gap-1 text-xs font-medium text-ink">
              Como conversa com o que ela declarou
              <textarea
                value={dele.relationToWeights}
                onChange={(e) => escrever(escolhido.id, "relationToWeights", e.target.value)}
                rows={3}
                className="rounded-md border border-border bg-surface px-2 py-1.5 text-xs font-normal text-ink"
              />
            </label>

            <label className="flex flex-col gap-1 text-xs font-medium text-ink">
              O que custa — um por linha, e ao menos um
              <textarea
                value={dele.attentionPoints}
                onChange={(e) => escrever(escolhido.id, "attentionPoints", e.target.value)}
                rows={3}
                className="rounded-md border border-border bg-surface px-2 py-1.5 text-xs font-normal text-ink"
              />
            </label>
          </article>
        );
      })}

      <label className="flex flex-col gap-1 text-sm font-medium text-ink">
        Por que estes três, juntos — escreva para ela, não sobre ela
        <textarea
          value={composicao}
          onChange={(e) => {
            setSalvo(false);
            setComposicao(e.target.value);
          }}
          rows={3}
          className="rounded-md border border-border bg-surface px-3 py-2 text-sm font-normal text-ink"
        />
      </label>

      {erro ? <p className="text-sm text-ink">{erro}</p> : null}
      {salvo ? (
        <p className="text-sm text-ink-muted">
          Relatório salvo como rascunho. Emitir e entregar são atos à parte — nada chegou a
          ela ainda.
        </p>
      ) : null}

      {/* `SIM-52` · ENTREGUE ⇒ AÇÃO INDISPONÍVEL, COM MOTIVO — o C8 de volta.
          O banco já recusava a escrita (`protect_delivered_report_options`),
          mas o Curador só descobria a regra pelo erro, depois de digitar. Uma
          regra aprendida por erro é uma regra que a interface escondeu. */}
      {entregue ? (
        <p className="text-xs text-ink-muted">
          Entregue — não há o que salvar. O documento acima é o que ela está lendo.
        </p>
      ) : (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={gravar}
            disabled={!prontos || salvando}
            className="rounded-md border border-border px-4 py-2 text-sm font-medium text-ink disabled:opacity-50"
          >
            {salvando ? "Salvando…" : "Salvar o relatório"}
          </button>
          {!prontos ? (
            <span className="text-xs text-ink-muted">
              Falta preencher os três campos de alguma opção, ou a razão da composição.
            </span>
          ) : null}
        </div>
      )}
    </section>
  );
}
