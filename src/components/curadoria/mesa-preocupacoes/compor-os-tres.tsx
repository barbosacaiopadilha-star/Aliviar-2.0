"use client";

/**
 * COMPOR OS TRÊS — o ato em que a Curadoria vira o que ela vai ler.
 *
 * @metodo ADR-042 — a seleção carrega quem, em que ordem, por quê e a que custo
 * @metodo ADR-093 — a Mesa é o documento dela, sendo escrito
 * @metodo ADR-041 — contagens, nunca notas; nenhuma ordem sugerida
 *
 * O contrato exige exatamente três, cada um com razão escrita, mais a razão da
 * COMPOSIÇÃO — por que estes três, juntos, para esta pessoa. Não é burocracia:
 * três opções sem explicação é uma lista, e lista não ajuda ninguém a decidir.
 *
 * O que esta tela mostra ao lado de cada candidato é o resumo do que ELE
 * responde ao que ELA pediu — contagens com as frases dela por trás. O que ela
 * não mostra é qualquer ordem, destaque ou recomendação. Os cartões saem na
 * ordem em que os profissionais chegaram, e é assim que fica.
 *
 * O vidro da ADR-084 não entra aqui: esta é ferramenta do Curador, e papel é a
 * regra. O vidro é da casa dela — e é lá que os três caminhos vão aparecer.
 */

import { useMemo, useState, useTransition } from "react";

import { saveSelectionAction } from "@/modules/curadoria/actions";
import {
  razoesSugeridas,
  resumirCandidatos,
  type ResumoDoCandidato,
} from "@/modules/curadoria/composicao-dos-tres";
import type { Linha } from "@/modules/curadoria/mesa-por-preocupacoes";

type Props = {
  priorityProfileId: string | null;
  linhas: readonly Linha[];
  profissionais: readonly { id: string; nome: string }[];
};

type Escrita = { rationale: string; tradeOff: string };

const VAZIA: Escrita = { rationale: "", tradeOff: "" };

function Contagem({ resumo }: { resumo: ResumoDoCandidato }) {
  const { atende, naoAtende, semInformacao } = resumo.essenciais;
  const total = atende + naoAtende + semInformacao;

  if (total === 0) {
    return (
      <p className="text-xs text-ink-muted">
        Ela ainda não declarou nada como essencial — a conversa do Protocolo não chegou lá.
      </p>
    );
  }

  return (
    <p className="text-xs text-ink-muted">
      Entre os {total} pontos que ela chamou de essenciais: <strong className="font-medium text-ink">{atende} atende</strong>,{" "}
      {naoAtende} não atende, {semInformacao} ninguém verificou.
    </p>
  );
}

export function ComporOsTres({ priorityProfileId, linhas, profissionais }: Props) {
  const resumos = useMemo(
    () => resumirCandidatos({ linhas, profissionais }),
    [linhas, profissionais],
  );

  const [escolhidos, setEscolhidos] = useState<string[]>([]);
  const [escrita, setEscrita] = useState<Record<string, Escrita>>({});
  const [composicao, setComposicao] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [salvo, setSalvo] = useState(false);
  const [salvando, iniciar] = useTransition();

  function alternar(id: string) {
    setSalvo(false);
    setEscolhidos((atual) => {
      if (atual.includes(id)) return atual.filter((x) => x !== id);
      // O contrato é exatamente três. Barrar o quarto aqui é mais honesto do
      // que aceitar e recusar depois de a pessoa ter escrito a razão dele.
      if (atual.length >= 3) return atual;
      return [...atual, id];
    });
  }

  function escrever(id: string, campo: keyof Escrita, valor: string) {
    setSalvo(false);
    setEscrita((atual) => ({ ...atual, [id]: { ...(atual[id] ?? VAZIA), [campo]: valor } }));
  }

  const prontos =
    escolhidos.length === 3 &&
    composicao.trim().length > 0 &&
    escolhidos.every((id) => (escrita[id]?.rationale ?? "").trim().length > 0);

  function gravar() {
    setErro(null);
    if (!priorityProfileId) {
      setErro("O Perfil de Prioridades ainda não foi aberto — a seleção pende dele.");
      return;
    }
    iniciar(async () => {
      const resultado = await saveSelectionAction({
        priorityProfileId,
        compositionRationale: composicao.trim(),
        options: escolhidos.map((id) => {
          const dele = escrita[id] ?? VAZIA;
          const tradeOff = dele.tradeOff.trim();
          return {
            professionalProfileId: id,
            rationale: dele.rationale.trim(),
            ...(tradeOff.length > 0 ? { tradeOff } : {}),
          };
        }),
      });
      if (resultado.success) {
        setSalvo(true);
        return;
      }
      setErro(resultado.error ?? "Não foi possível salvar a seleção.");
    });
  }

  return (
    <section className="flex flex-col gap-5 border-t border-border pt-6">
      <header className="flex flex-col gap-1">
        <h3 className="text-base font-medium text-ink">Os três caminhos</h3>
        <p className="max-w-3xl text-sm text-ink-muted">
          Escolha três e escreva por que cada um está aqui. Nenhuma ordem é sugerida — os
          cartões saem na ordem em que os profissionais entraram na Rede deste Case.
        </p>
      </header>

      <div className="flex flex-col gap-4">
        {resumos.map((resumo) => {
          const escolhido = escolhidos.includes(resumo.profissionalId);
          const sugestoes = razoesSugeridas(resumo);
          const dele = escrita[resumo.profissionalId] ?? VAZIA;

          return (
            <article
              key={resumo.profissionalId}
              className="flex flex-col gap-3 rounded-md border border-border p-4"
            >
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={escolhido}
                  onChange={() => alternar(resumo.profissionalId)}
                  disabled={!escolhido && escolhidos.length >= 3}
                  className="mt-1"
                />
                <span className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-ink">{resumo.nome}</span>
                  <Contagem resumo={resumo} />
                </span>
              </label>

              {escolhido ? (
                <div className="flex flex-col gap-2 pl-6">
                  <label className="flex flex-col gap-1 text-xs font-medium text-ink">
                    Por que este caminho está aqui
                    <textarea
                      value={dele.rationale}
                      onChange={(e) => escrever(resumo.profissionalId, "rationale", e.target.value)}
                      rows={3}
                      className="rounded-md border border-border bg-surface px-2 py-1.5 text-xs font-normal text-ink"
                    />
                  </label>

                  {sugestoes.length > 0 ? (
                    <div className="flex flex-wrap items-center gap-1.5">
                      {/* Resumo de fato, não opinião — e nunca pré-preenchido. */}
                      <span className="text-xs text-ink-muted">Comece de:</span>
                      {sugestoes.map((sugestao) => (
                        <button
                          key={sugestao.rotulo}
                          type="button"
                          title={sugestao.texto}
                          onClick={() =>
                            escrever(resumo.profissionalId, "rationale", sugestao.texto)
                          }
                          className="rounded-md border border-border px-2 py-1 text-xs text-ink-muted transition-colors hover:text-ink"
                        >
                          {sugestao.rotulo}
                        </button>
                      ))}
                    </div>
                  ) : null}

                  <label className="flex flex-col gap-1 text-xs font-medium text-ink">
                    O que ela perde escolhendo este (opcional, e quase nunca vazio)
                    <textarea
                      value={dele.tradeOff}
                      onChange={(e) => escrever(resumo.profissionalId, "tradeOff", e.target.value)}
                      rows={2}
                      className="rounded-md border border-border bg-surface px-2 py-1.5 text-xs font-normal text-ink"
                    />
                  </label>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>

      <label className="flex flex-col gap-1 text-sm font-medium text-ink">
        Por que estes três, juntos, fazem sentido para ela
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
          Seleção salva. A entrega é um ato à parte — nada chega a ela por este botão.
        </p>
      ) : null}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={gravar}
          disabled={!prontos || salvando}
          className="rounded-md border border-border px-4 py-2 text-sm font-medium text-ink disabled:opacity-50"
        >
          {salvando ? "Salvando…" : "Salvar os três"}
        </button>
        <span className="text-xs text-ink-muted">
          {escolhidos.length} de 3 escolhidos
          {escolhidos.length === 3 && !prontos ? " · falta a razão de algum deles" : ""}
        </span>
      </div>
    </section>
  );
}
