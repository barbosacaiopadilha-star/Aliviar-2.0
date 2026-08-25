"use client";

/**
 * REGISTRAR A RESPOSTA DELA, NA PRÓPRIA LINHA.
 *
 * @metodo ADR-093 — a linha é a conversa; registrar acontece onde ela vive
 * @metodo ADR-042 — reconhecer é ato exclusivo dela: aqui só se PROPÕE
 * @metodo ADR-068 — sugestão se oferece, nunca vem pré-preenchida
 *
 * Na Mesa antiga, responder pelo Protocolo era outra tela, com dezessete
 * fichas recolhidas. Aqui é a mesma linha que já mostra o que cada profissional
 * responde àquela preocupação — o Curador registra o que ouviu no lugar onde
 * vai ler a consequência.
 *
 * O que este componente NÃO faz: reconhecer. Perguntas de tradução geram uma
 * leitura PROPOSTA, e ela nasce pendente até a pessoa dizer que é isso, na
 * jornada dela. O Curador traduz; quem reconhece é ela.
 */

import { useState, useTransition } from "react";

import { leiturasSugeridas } from "@/modules/curadoria/leituras-sugeridas";
import { NEED_DEGREES, NEED_DEGREE_LABELS, type NeedDegree } from "@/modules/curadoria/protocolos";
import { registerPersonNeedAction } from "@/modules/curadoria/protocolos-actions";

export type OpcaoDaPergunta = { codigo: string; rotulo: string };

type Props = {
  caseId: string;
  questionId: string;
  subcriterionCode: string;
  pergunta: string;
  opcoes: readonly OpcaoDaPergunta[];
  multi: boolean;
  /** TRADUCAO exige a leitura proposta; DIRETO nasce reconhecida. */
  origem: "DIRETO" | "TRADUCAO" | "DECLARACAO_CLINICA";
  opcoesJaMarcadas: readonly string[];
  grauJaDeclarado: NeedDegree | null;
};

export function RegistrarRespostaDela({
  caseId,
  questionId,
  subcriterionCode,
  pergunta,
  opcoes,
  multi,
  origem,
  opcoesJaMarcadas,
  grauJaDeclarado,
}: Props) {
  const [aberto, setAberto] = useState(false);
  const [marcadas, setMarcadas] = useState<string[]>([...opcoesJaMarcadas]);
  const [grau, setGrau] = useState<NeedDegree | null>(grauJaDeclarado);
  const [leitura, setLeitura] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, iniciar] = useTransition();

  const exigeLeitura = origem === "TRADUCAO";

  // As sugestões nascem do que ELE acabou de marcar, e mudam junto. Uma
  // sugestão calculada uma vez e congelada descreveria uma conversa anterior.
  const sugestoes = leiturasSugeridas({
    opcoesMarcadas: marcadas
      .map((codigo) => opcoes.find((o) => o.codigo === codigo)?.rotulo)
      .filter((rotulo): rotulo is string => Boolean(rotulo)),
    grau,
  });

  function alternar(codigo: string) {
    setMarcadas((atual) => {
      if (!multi) return [codigo];
      return atual.includes(codigo) ? atual.filter((c) => c !== codigo) : [...atual, codigo];
    });
  }

  function registrar() {
    setErro(null);
    iniciar(async () => {
      const resultado = await registerPersonNeedAction({
        caseId,
        subcriterionCode,
        options: marcadas,
        degree: grau,
        flexibility: null,
        guidedText: null,
        origin: origem,
        proposedReading: exigeLeitura ? leitura.trim() || null : null,
      });
      if (resultado.success) {
        setAberto(false);
        return;
      }
      setErro(resultado.error);
    });
  }

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="mt-2 text-xs font-medium text-ink underline underline-offset-2"
      >
        {opcoesJaMarcadas.length > 0 ? `Atualizar ${questionId}` : `Registrar ${questionId}`}
      </button>
    );
  }

  return (
    <div className="mt-3 flex flex-col gap-3 rounded-md border border-border bg-canvas p-3">
      <p className="text-xs text-ink-muted">{pergunta}</p>

      <fieldset className="flex flex-col gap-1.5">
        <legend className="sr-only">O que ela respondeu</legend>
        {opcoes.map((opcao) => (
          <label key={opcao.codigo} className="flex items-start gap-2 text-xs text-ink">
            <input
              type={multi ? "checkbox" : "radio"}
              name={`${questionId}-resposta`}
              checked={marcadas.includes(opcao.codigo)}
              onChange={() => alternar(opcao.codigo)}
              className="mt-0.5"
            />
            <span>{opcao.rotulo}</span>
          </label>
        ))}
      </fieldset>

      <fieldset className="flex flex-col gap-1.5">
        <legend className="text-xs font-medium text-ink">Quanto isso pesa, segundo ela</legend>
        {NEED_DEGREES.map((nivel) => (
          <label key={nivel} className="flex items-start gap-2 text-xs text-ink">
            <input
              type="radio"
              name={`${questionId}-grau`}
              checked={grau === nivel}
              onChange={() => setGrau(nivel)}
              className="mt-0.5"
            />
            <span>{NEED_DEGREE_LABELS[nivel]}</span>
          </label>
        ))}
      </fieldset>

      {exigeLeitura ? (
        <div className="flex flex-col gap-2">
          <label className="flex flex-col gap-1 text-xs font-medium text-ink">
            O que você entendeu — ela vai reconhecer, corrigir ou recusar
            <textarea
              value={leitura}
              onChange={(evento) => setLeitura(evento.target.value)}
              rows={3}
              placeholder="Pelo que você me contou, entendi que… É isso?"
              className="rounded-md border border-border bg-surface px-2 py-1.5 text-xs font-normal text-ink"
            />
          </label>

          {sugestoes.length > 0 ? (
            <div className="flex flex-col gap-1.5">
              {/* Nada é pré-preenchido: as sugestões ficam ao lado, e só entram
                  no campo se ele escolher uma — e ele edita depois. */}
              <p className="text-xs text-ink-muted">
                Se quiser, comece de uma destas e edite livremente:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {sugestoes.map((sugestao) => (
                  <button
                    key={sugestao.rotulo}
                    type="button"
                    onClick={() => setLeitura(sugestao.texto)}
                    title={sugestao.texto}
                    className="rounded-md border border-border px-2 py-1 text-xs text-ink-muted transition-colors hover:text-ink"
                  >
                    {sugestao.rotulo}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <p className="text-xs text-ink-muted">
            Esta leitura nasce pendente. O reconhecimento é ato dela, na jornada dela.
          </p>
        </div>
      ) : null}

      {erro ? <p className="text-xs text-ink">{erro}</p> : null}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={registrar}
          disabled={salvando || marcadas.length === 0 || grau === null}
          className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-ink disabled:opacity-50"
        >
          {salvando ? "Registrando…" : "Registrar"}
        </button>
        <button
          type="button"
          onClick={() => setAberto(false)}
          className="text-xs text-ink-muted"
        >
          Fechar
        </button>
      </div>
    </div>
  );
}
