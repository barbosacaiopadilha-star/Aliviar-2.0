"use client";

import { useState } from "react";

import { registrarDesfechoAction } from "@/modules/paciente/desfecho-actions";
import type { AtoSobreATraducao } from "@/modules/paciente/reconhecimento-contrato";

/**
 * OS QUATRO DESFECHOS, NA LINHA DO CONCEITO — Etapa 2C.
 *
 * @metodo M-001 §6.2.1 — confirmar · corrigir · discordar · deixar pendente
 * @metodo DT-22 — os dois que AFIRMAM algo sobre a tradução exigem o texto dela
 * @metodo PP-03 — a escrita passa pela RPC `acknowledge_case_need`, nunca por
 *         `UPDATE` direto e nunca pela ação do Curador
 *
 * Por que existe: a tradução do Curador é uma leitura do que ela disse, e até
 * aqui ela só podia ler essa leitura. Discordar exigia sair da tela e falar com
 * alguém; o que o sistema registrava era sempre concordância — ou silêncio.
 *
 * **Os quatro têm o mesmo peso.** Mesma cor, mesmo tamanho, mesma distância do
 * dedo dela, um passo cada. Um botão primário colorido ao lado de três links
 * cinzentos não seria uma escolha: seria uma sugestão com três saídas de
 * emergência. Concordar não é o desfecho preferido — é um dos quatro.
 *
 * Esta tela não decide nada e não conhece regra de domínio: quem recusa, quem
 * exige texto e quem é dona do Case é a RPC. Aqui só chega o retorno já
 * nomeado, com a frase que fala com ela.
 */

type Desfecho = "RECONHECIDA" | "CORRIGIDA" | "RECUSADA" | "PENDENTE";

/**
 * O rótulo é o que ela reconhece como sua reação, não o nome técnico do estado.
 * "RECUSADA" é vocabulário de banco; "Não foi isso que eu disse" é o que ela
 * diria em voz alta.
 */
const ROTULOS: Record<Desfecho, string> = {
  RECONHECIDA: "É isso mesmo",
  CORRIGIDA: "Quase — quero ajustar",
  RECUSADA: "Não foi isso que eu disse",
  PENDENTE: "Prefiro pensar",
};

/** O que cada desfecho já praticado diz de volta para ela. */
const REGISTRADO: Record<Exclude<Desfecho, "PENDENTE">, string> = {
  RECONHECIDA: "Você confirmou que esta leitura está correta.",
  CORRIGIDA: "Você pediu um ajuste nesta leitura.",
  RECUSADA: "Você discordou desta leitura.",
};

/** Os dois que afirmam algo sobre a tradução guardam o texto dela (DT-22). */
const PEDE_TEXTO: Record<string, string> = {
  CORRIGIDA: "O que ficou diferente do que você quis dizer?",
  RECUSADA: "Conte o que você disse de verdade — é isso que a Curadoria vai ler.",
};

const BOTAO =
  "inline-flex min-h-11 items-center rounded-md border border-[color-mix(in_srgb,var(--color-ink-muted)_30%,transparent)] px-4 py-2.5 text-sm text-ink transition-colors duration-fast ease-standard hover:bg-[color-mix(in_srgb,var(--color-ink)_5%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 disabled:opacity-60";

export function DesfechosDoConceito({
  caseId,
  subcriterionCode,
  label,
  ato,
}: {
  caseId: string;
  subcriterionCode: string;
  /** O rótulo do conceito — para que o texto fale do ponto certo. */
  label: string;
  ato: AtoSobreATraducao;
}) {
  const [escolhido, setEscolhido] = useState<Desfecho | null>(null);
  const [texto, setTexto] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, setPendente] = useState(false);
  const [registrado, setRegistrado] = useState<Exclude<Desfecho, "PENDENTE"> | null>(null);

  // Onde ela respondeu direto, não há leitura de terceiro sobre a qual
  // concordar ou discordar. Oferecer os desfechos aqui sugeriria que alguém
  // interpretou o que ela disse — quando ninguém interpretou.
  if (!ato.houveTraducao) return null;

  const jaPraticado = registrado ?? (ato.desfecho !== "PENDENTE" ? ato.desfecho : null);

  // O desfecho não regride nem é reescrito (PP-03 §5.2, `JA_RESPONDIDO`): o
  // que a tela mostra depois do ato é o que ficou, não um formulário aberto.
  if (jaPraticado) {
    return (
      <div className="mt-3 border-t border-[var(--color-border)] pt-3">
        <p role="status" className="text-sm leading-relaxed text-ink">
          {REGISTRADO[jaPraticado]}
        </p>
        {ato.correcao ? (
          <p className="mt-1 max-w-reading text-sm leading-relaxed text-ink-muted">
            Você escreveu: “{ato.correcao}”
          </p>
        ) : null}
      </div>
    );
  }

  const registrar = async (desfecho: Exclude<Desfecho, "PENDENTE">) => {
    setErro(null);
    setPendente(true);

    const resultado = await registrarDesfechoAction({
      caseId,
      subcriterionCode,
      acknowledgment: desfecho,
      correction: desfecho === "RECONHECIDA" ? null : texto,
    });

    setPendente(false);

    if (!resultado.success) {
      setErro(resultado.error);
      return;
    }

    // A tela conta o que ficou sem esperar recarga: o ato JÁ está no banco, e
    // o próximo GET traz o mesmo estado (as rotas da paciente são dinâmicas).
    setRegistrado(resultado.desfecho);
  };

  return (
    <div className="mt-3 border-t border-[var(--color-border)] pt-3">
      {ato.leituraProposta ? (
        <p className="max-w-reading text-sm leading-relaxed text-ink-muted">
          Entendemos assim: “{ato.leituraProposta}”
        </p>
      ) : null}

      {escolhido === "PENDENTE" ? (
        // C4 — o desfecho que NÃO escreve nada. `PENDENTE` já é o estado no
        // banco: praticá-lo é não praticar nenhum outro, e dizê-lo em voz alta
        // é o que separa uma escolha dela de um silêncio.
        <div className="mt-3 space-y-2">
          <p role="status" className="max-w-reading text-sm leading-relaxed text-ink">
            Nada foi registrado sobre {label.toLowerCase()}. Você pode voltar a este ponto quando
            quiser.
          </p>
          <button type="button" onClick={() => setEscolhido(null)} className={BOTAO}>
            Voltar às opções
          </button>
        </div>
      ) : escolhido === "CORRIGIDA" || escolhido === "RECUSADA" ? (
        <div className="mt-3 space-y-2">
          <label
            htmlFor={`texto-${subcriterionCode}`}
            className="block max-w-reading text-sm leading-relaxed text-ink"
          >
            {PEDE_TEXTO[escolhido]}
          </label>
          <textarea
            id={`texto-${subcriterionCode}`}
            value={texto}
            onChange={(evento) => setTexto(evento.target.value)}
            maxLength={500}
            rows={3}
            className="w-full max-w-reading rounded-md border border-[var(--color-border)] bg-transparent p-3 text-sm leading-relaxed text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          />
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => registrar(escolhido)}
              disabled={pendente || texto.trim().length === 0}
              className={BOTAO}
            >
              {pendente ? "Registrando…" : "Registrar"}
            </button>
            <button
              type="button"
              onClick={() => {
                setEscolhido(null);
                setErro(null);
              }}
              disabled={pendente}
              className={BOTAO}
            >
              Voltar às opções
            </button>
          </div>
          {texto.trim().length === 0 ? (
            // DT-22 dito ANTES da recusa: o botão desabilitado sem explicação
            // faria ela procurar o que fez de errado.
            <p className="max-w-reading text-xs leading-relaxed text-ink-muted">
              Sem o que você escrever, fica o estado sem o motivo — e o motivo é o que importa.
            </p>
          ) : null}
        </div>
      ) : (
        // C5 — os quatro, no mesmo lugar, com o mesmo peso, a um passo cada.
        <div className="mt-3 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => registrar("RECONHECIDA")}
            disabled={pendente}
            className={BOTAO}
          >
            {ROTULOS.RECONHECIDA}
          </button>
          {(["CORRIGIDA", "RECUSADA", "PENDENTE"] as const).map((desfecho) => (
            <button
              key={desfecho}
              type="button"
              onClick={() => setEscolhido(desfecho)}
              disabled={pendente}
              className={BOTAO}
            >
              {ROTULOS[desfecho]}
            </button>
          ))}
        </div>
      )}

      {erro ? (
        <p role="alert" className="mt-2 max-w-reading text-sm leading-relaxed text-ink">
          {erro}
        </p>
      ) : null}
    </div>
  );
}
