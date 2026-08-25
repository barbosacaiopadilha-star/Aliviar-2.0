"use client";

/**
 * O JUÍZO, NA CÉLULA A QUE ELE PERTENCE.
 *
 * @metodo ADR-067 §5 — H8–H10 técnicos sempre exigidos; H11 relacional
 * @metodo ADR-065 — condução de notícias difíceis exige cruzamento humano
 * @metodo ADR-093 — a Mesa se organiza pelas preocupações dela
 *
 * A Mesa antiga tinha um bloco "Juízo do Curador (H8–H11)" com seis conceitos
 * por profissional, empilhados longe de tudo. Eram dezoito caixas de texto
 * seguidas, e nenhuma delas ficava perto do fato que a justificava.
 *
 * Aqui o juízo mora na célula. Os três relacionais caem nas linhas P11, P14 e
 * P17 — perguntas feitas a ELA —, e os três técnicos caem nos eixos que ela não
 * tem como pedir. Isso não foi arranjo meu: é a estrutura do Método aparecendo
 * quando se para de organizar a tela pela taxonomia.
 *
 * O que este componente NÃO faz: sugerir conclusão pronta. As sugestões de
 * redação existem no Protocolo porque lá se traduz o que ELA disse — há
 * matéria-prima declarada. Aqui a conclusão é do Curador sobre o profissional,
 * e uma frase oferecida seria o software opinando sobre um médico. O que se
 * oferece é a ESTRUTURA da frase, vazia.
 */

import { useState, useTransition } from "react";

import { registrarJulgamentoAction } from "@/modules/curadoria/julgamento-actions";

const LIMITE_DA_CONCLUSAO = 280;

/**
 * FORMAS DE COMEÇAR — sete registros, nenhum conteúdo.
 *
 * O Fundador pediu (25/08): "nos juízos eu quero respostas humanas e textos bem
 * formulados; nos casos em que a paciente lê seu juízo, a gente precisa ser bem
 * versátil".
 *
 * A versatilidade tem que estar na FORMA, não no conteúdo — e essa fronteira é
 * a diferença entre ajudar e substituir. "Considerando o que está verificado,
 * entendo que…" oferece um jeito de dizer. "Este profissional atende bem a esta
 * necessidade" seria o software emitindo o juízo que a ADR-067 reserva a uma
 * pessoa, e o Curador assinaria embaixo sem ter pensado.
 *
 * Sete começos porque as situações são diferentes de verdade: julgar com o que
 * se sabe não é a mesma coisa que julgar com uma lacuna à vista, que não é a
 * mesma coisa que reconhecer uma contradição entre o que se leu e o que se
 * ouviu. Três formas obrigavam a torcer a frase; sete deixam escolher a que
 * cabe.
 *
 * O TOM VEM DE ONDE O TEXTO VAI PARAR. Alguns juízos alimentam o relatório que
 * ELA lê. Por isso nenhum começo aqui é jargão — nem "adequado ao perfil", nem
 * "compatível com os requisitos". São frases que uma pessoa diria a outra
 * pessoa sobre uma terceira, com cuidado.
 */
const COMECOS: readonly { rotulo: string; texto: string }[] = [
  { rotulo: "Com o que se sabe", texto: "Considerando o que está verificado até aqui, entendo que" },
  { rotulo: "Com a lacuna à vista", texto: "Falta informação sobre este ponto, e mesmo assim entendo que" },
  { rotulo: "Reservado", texto: "O que sei até aqui não me permite concluir mais do que" },
  { rotulo: "O que pesa a favor", texto: "O que mais pesa a favor deste caminho, neste ponto, é" },
  { rotulo: "O que pesa contra", texto: "O que precisa ser dito antes de qualquer escolha é que" },
  { rotulo: "Divergência", texto: "O que li e o que ouvi não coincidem neste ponto: " },
  { rotulo: "Para ela ler", texto: "Se você escolher este caminho, sobre este ponto é importante saber que" },
];

type Props = {
  caseId: string;
  professionalProfileId: string;
  professionalNome: string;
  subcriterionCode: string;
  natureza: "TECNICO" | "RELACIONAL";
  /** A conclusão vigente, quando já existe. */
  conclusaoVigente: string | null;
};

export function RegistrarJuizoNaCelula({
  caseId,
  professionalProfileId,
  professionalNome,
  subcriterionCode,
  natureza,
  conclusaoVigente,
}: Props) {
  const [aberto, setAberto] = useState(false);
  const [conclusao, setConclusao] = useState(conclusaoVigente ?? "");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, iniciar] = useTransition();

  function registrar() {
    setErro(null);
    iniciar(async () => {
      const desfecho = await registrarJulgamentoAction({
        caseId,
        professionalProfileId,
        subcriterionCode,
        natureza,
        conclusao,
        fatosVisiveis: [],
        evidencias: [],
      });
      if (desfecho.desfecho === "JUIZO_REGISTRADO") {
        setAberto(false);
        return;
      }
      // O detalhe técnico aparece: um "não deu certo" sem razão obriga a
      // pessoa a adivinhar, e foi assim que um erro de gravação passou
      // despercebido antes.
      setErro(desfecho.detalhe ?? desfecho.desfecho);
    });
  }

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="mt-1 block text-xs font-medium text-ink underline underline-offset-2"
      >
        {conclusaoVigente ? "Rever juízo" : "Registrar juízo"}
      </button>
    );
  }

  const excedeu = conclusao.length > LIMITE_DA_CONCLUSAO;

  return (
    <div className="mt-2 flex flex-col gap-2 rounded-md border border-border bg-canvas p-2">
      <p className="text-xs text-ink-muted">
        Seu juízo sobre {professionalNome} neste ponto. Fica registrado, versionado e com o
        seu nome.
      </p>

      <textarea
        value={conclusao}
        onChange={(evento) => setConclusao(evento.target.value)}
        rows={3}
        maxLength={LIMITE_DA_CONCLUSAO}
        className="rounded-md border border-border bg-surface px-2 py-1.5 text-xs text-ink"
      />

      <p className="text-xs text-ink-muted">
        Comece de uma destas formas, se ajudar — o que vem depois é seu:
      </p>
      <div className="flex flex-wrap items-center gap-1.5">
        {/* Estrutura de frase, nunca conteúdo: começar a escrever é o custo,
            e opinar sobre o médico não é trabalho do software. */}
        {COMECOS.map((comeco) => (
          <button
            key={comeco.rotulo}
            type="button"
            title={comeco.texto}
            onClick={() =>
              setConclusao((atual) => (atual.length > 0 ? atual : `${comeco.texto} `))
            }
            className="rounded-md border border-border px-2 py-1 text-xs text-ink-muted transition-colors hover:text-ink"
          >
            {comeco.rotulo}
          </button>
        ))}
      </div>

      <span className={excedeu ? "text-xs text-ink" : "text-xs text-ink-muted"}>
        {conclusao.length} de {LIMITE_DA_CONCLUSAO}
      </span>

      {erro ? <p className="text-xs text-ink">{erro}</p> : null}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={registrar}
          disabled={salvando || conclusao.trim().length === 0}
          className="rounded-md border border-border px-2.5 py-1 text-xs font-medium text-ink disabled:opacity-50"
        >
          {salvando ? "Registrando…" : "Registrar"}
        </button>
        <button type="button" onClick={() => setAberto(false)} className="text-xs text-ink-muted">
          Fechar
        </button>
      </div>
    </div>
  );
}
