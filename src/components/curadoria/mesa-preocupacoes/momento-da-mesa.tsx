/**
 * O CABEÇALHO DE CADA MOMENTO — a pergunta sempre no mesmo lugar.
 *
 * @metodo ADR-093 — a Mesa é o documento dela, sendo escrito
 * @metodo `mesa-etapas.ts` — "a pergunta que o Curador responde em cada etapa:
 *   o nome é o raciocínio"
 *
 * ────────────────────────────────────────────────────────────────────────────
 * POR QUE ISTO É DIDÁTICA E NÃO DECORAÇÃO
 *
 * A Mesa antiga tinha um achado que a nova herdou pela metade: cada etapa
 * carregava a PERGUNTA que ela responde, e o comentário do módulo dizia por
 * quê — *"o nome é o raciocínio"*. Duas seções da Mesa nova têm isso; as
 * outras não, e quem chega vê trinta e duas linhas de tabela sem saber para
 * que servem nem onde aquilo termina.
 *
 * O que ensina aqui NÃO é a frase: é o LUGAR. A mesma linha, na mesma posição,
 * no mesmo tom, em todas as seções — o olho aprende em duas seções que aquela
 * linha responde "para que estou fazendo isto", e daí em diante ele a procura.
 * Consistência de posição é o único recurso didático que não custa altura numa
 * página de doze telas.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * A REGRA QUE IMPEDE ISTO DE VIRAR GUIA
 *
 * **O texto descreve o ATO e a PERGUNTA, nunca o mecanismo.**
 *
 * "Quem pode participar desta Curadoria?" continua verdadeiro se o painel for
 * reconstruído amanhã. "Clique em Declarar área para liberar o profissional"
 * fica velho na primeira mudança — e vira o `SIM-40` dentro do produto, que é
 * exatamente o defeito do guia que ensinava três conceitos onde o Método exige
 * seis: ele descrevia a tela, não o Método.
 *
 * Por isso as perguntas vêm de `MESA_ETAPA_QUESTIONS` onde já existem: fonte
 * escrita, revisada, e que não pertence a esta tela.
 */

import type { ReactNode } from "react";

export function MomentoDaMesa({
  titulo,
  pergunta,
  children,
}: {
  titulo: string;
  /** A pergunta que este momento responde — o raciocínio, não a instrução. */
  pergunta: string;
  /** O que mais o cabeçalho precisa dizer neste momento. Opcional. */
  children?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-1">
      {/* A pergunta vem ANTES do título, e menor: quem lê de cima para baixo
          encontra primeiro o porquê, e só então o quê. Invertida, ela virava
          legenda — e legenda ninguém lê duas vezes. */}
      <p className="text-xs uppercase tracking-wide text-ink-muted">{pergunta}</p>
      <h2 className="text-lg font-medium text-ink">{titulo}</h2>
      {children}
    </header>
  );
}
