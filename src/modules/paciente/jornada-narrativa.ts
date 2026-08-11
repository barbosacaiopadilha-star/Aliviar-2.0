/**
 * A JORNADA COMO NARRATIVA — seis marcos, uma fonte.
 *
 * @metodo docs/repaginacao/04_EXPERIENCIA_DO_PACIENTE.md — o percurso contado
 *         como percurso, não como fila de etapas internas
 *
 * Por que esta camada existe: a jornada interna tem **sete etapas**
 * (`jornada.ts`), e elas são certas para conduzir o trabalho — mas fragmentam
 * a leitura de quem só quer saber onde está. "Consulta", "Relatório",
 * "Conversa" e "Escolha" são quatro nomes para o que a paciente vive como dois
 * momentos: um encontro em que ela conta, outro em que ela recebe.
 *
 * Aqui as sete viram **seis marcos** — e o que era etapa vira **submarco**,
 * sem sumir. Nada é promovido, nada é apagado.
 *
 * **Isto é projeção de apresentação, não domínio.** Não há enum persistido,
 * não há coluna, não há estado novo: cada marco se conclui por um fato que já
 * existia, e a tabela abaixo é toda a regra.
 *
 * | marco               | conclui por                        |
 * |---------------------|------------------------------------|
 * | Sua história        | `historia.registeredAt`            |
 * | Primeiro Encontro   | **`acolhimento.meetingHeldAt`**    |
 * | Análise e Curadoria | `relatorio.emittedAt`              |
 * | Segundo Encontro    | **`devolutiva.presentedAt`**       |
 * | Sua decisão         | `devolutiva.decision`              |
 * | Próximos passos     | — (é continuidade, não se conclui) |
 *
 * Três invariantes que este arquivo existe para sustentar:
 *
 * - **D-9.** O Primeiro Encontro se conclui por `meetingHeldAt` e por mais
 *   nada. Nem `understandingConfirmedAt`, nem `validatedAt`, nem
 *   `meetingScheduledAt` — produto do encontro não é prova do encontro.
 * - **`presentedAt` ≠ `deliveredAt`.** Apresentar é o ato humano; entregar é o
 *   conteúdo digital ficar disponível. São submarcos separados, e o segundo
 *   não é inferido do primeiro.
 * - **A responsabilidade não é calculada aqui.** Ela chega pronta de
 *   `resolveCurrentResponsible`, onde vive a regra de que antes da decisão
 *   responde o Curador e depois dela o Concierge. Nenhuma data de encontro,
 *   apresentação ou entrega é gatilho de handoff.
 */

import type { LeituraDeEstado } from "@/foundation/contrato-de-estado";
import type { CuradoriaRecord } from "@/modules/curadoria/cos/types";
import type { Jornada, JornadaStageId } from "@/modules/curadoria/jornada";
import type { CoaCurrentResponsible } from "@/modules/coa/journey-responsibility";

export type MarcoId =
  | "HISTORIA"
  | "PRIMEIRO_ENCONTRO"
  | "ANALISE"
  | "SEGUNDO_ENCONTRO"
  | "DECISAO"
  | "PROXIMOS_PASSOS";

/** Três, e só três. Passado, presente, futuro — sem enum persistido. */
export type MarcoStatus = "CONCLUIDO" | "ATUAL" | "FUTURO";

export type Submarco = {
  /**
   * O texto já resolvido para o tempo verbal certo.
   *
   * **Um submarco ausente não pode ser escrito no passado.** A primeira versão
   * desta camada trazia sempre a frase concluída — "A conversa aconteceu",
   * "Sua escolha foi registrada" — e deixava a diferença por conta do símbolo.
   * O resultado era uma tela que dizia, sob o título "ainda por vir", que a
   * coisa já tinha acontecido. Cor e ícone não sustentam verdade sozinhos: o
   * texto também precisa dizê-la.
   */
  rotulo: string;
  feito: boolean;
  /** O que ele significa, quando o rótulo sozinho não basta. */
  nota?: string;
};

/** Escolhe o tempo verbal pelo fato. Nenhum submarco escapa desta função. */
function conforme(feito: boolean, texto: { sim: string; ainda: string }): string {
  return feito ? texto.sim : texto.ainda;
}

export type MarcoDaJornada = {
  id: MarcoId;
  titulo: string;
  /**
   * O nome curto, para a régua resumida da Home — onde seis títulos inteiros
   * não caberiam em 390px sem virar tipografia ilegível. É a MESMA etapa, dita
   * em menos palavras: nunca um sétimo conceito.
   */
  rotuloCurto: string;
  status: MarcoStatus;
  /** Uma frase. O que aconteceu, ou o que vai acontecer. */
  descricao: string;
  submarcos: Submarco[];
  /** Verdadeiro quando a jornada interna diz que esta parte aguarda a paciente. */
  aguardaVoce: boolean;
};

export type NarrativaDaJornada = {
  marcos: MarcoDaJornada[];
  /** Quem responde pelo caso agora. Lido, nunca decidido aqui. */
  responsavel: CoaCurrentResponsible;
  /**
   * Encerramento, quando houve. **Cancelado não é concluído**: um caso
   * cancelado não tem marco atual e não pode ser lido como percurso cumprido.
   */
  encerramento: { tipo: "CANCELADO" | "SEM_ENTREGA"; rotulo: string } | null;
};

/** Qual marco cada etapa interna habita. Nenhuma etapa fica órfã. */
const MARCO_DA_ETAPA: Record<JornadaStageId, MarcoId> = {
  CONSULTA_INICIAL: "PRIMEIRO_ENCONTRO",
  PERFIL_DE_PRIORIDADES: "ANALISE",
  CURADORIA: "ANALISE",
  DOSSIE: "ANALISE",
  REUNIAO: "SEGUNDO_ENCONTRO",
  ESCOLHA: "DECISAO",
  ACOMPANHAMENTO: "PROXIMOS_PASSOS",
};

export function projetarNarrativa(input: {
  record: CuradoriaRecord;
  jornada: Jornada;
  leitura: LeituraDeEstado;
}): NarrativaDaJornada {
  const { record, jornada, leitura } = input;
  const { acolhimento, historia, validacao, curadoriaTecnica, relatorio, devolutiva } = record;
  const curador = jornada.curatorName;

  const encerramento =
    leitura.estado === "CASO_CANCELADO"
      ? ({ tipo: "CANCELADO", rotulo: leitura.rotuloPaciente } as const)
      : leitura.estado === "CASO_ENCERRADO_SEM_ENTREGA"
        ? ({ tipo: "SEM_ENTREGA", rotulo: leitura.rotuloPaciente } as const)
        : null;

  // D-9 · o encontro se conclui por ele mesmo. Esta constante existe isolada
  // para que qualquer tentativa de trocá-la por outro fato fique visível.
  const primeiroEncontroRealizado = Boolean(acolhimento.meetingHeldAt);

  const definicoes: Array<Omit<MarcoDaJornada, "status" | "aguardaVoce"> & { concluido: boolean }> = [
    {
      id: "HISTORIA",
      titulo: "Sua história",
      rotuloCurto: "História",
      concluido: Boolean(historia.registeredAt),
      descricao: historia.registeredAt
        ? "Você contou o que está vivendo, com as suas palavras."
        : "Tudo começa pelo que você viveu — não por um formulário.",
      submarcos: [
        {
          rotulo: conforme(Boolean(historia.registeredAt), {
            sim: "Você contou sua história",
            ainda: "Você vai contar sua história, no seu tempo",
          }),
          feito: Boolean(historia.registeredAt),
        },
        {
          rotulo: conforme(Boolean(historia.understandingConfirmedAt), {
            sim: `${curador} confirmou que entendeu`,
            ainda: `${curador} vai confirmar com você que entendeu`,
          }),
          feito: Boolean(historia.understandingConfirmedAt),
          nota: "O reconhecimento de que o relato ficou fiel ao que você disse.",
        },
      ],
    },
    {
      id: "PRIMEIRO_ENCONTRO",
      titulo: "Primeiro Encontro",
      rotuloCurto: "1º Encontro",
      concluido: primeiroEncontroRealizado,
      descricao: primeiroEncontroRealizado
        ? `A conversa em que ${curador} ouviu a sua história inteira aconteceu.`
        : `${curador} vai ouvir a sua história inteira antes de organizar qualquer coisa.`,
      submarcos: [
        {
          rotulo: conforme(primeiroEncontroRealizado, {
            sim: "A conversa aconteceu",
            ainda: "A conversa com seu Curador acontecerá aqui",
          }),
          feito: primeiroEncontroRealizado,
          nota: primeiroEncontroRealizado
            ? "Registrado por quem conduziu o encontro."
            : "Só quem conduz o encontro pode registrá-lo como realizado.",
        },
      ],
    },
    {
      id: "ANALISE",
      titulo: "Análise e Curadoria",
      rotuloCurto: "Curadoria",
      concluido: Boolean(relatorio.emittedAt),
      descricao: relatorio.emittedAt
        ? "As opções foram escolhidas e sustentadas, uma a uma."
        : "É aqui que o seu caso é estudado — e leva o tempo que precisa levar.",
      submarcos: [
        {
          rotulo: conforme(Boolean(validacao?.validatedAt), {
            sim: "Você reconheceu suas prioridades",
            ainda: "Você vai reconhecer suas prioridades como suas",
          }),
          feito: Boolean(validacao?.validatedAt),
          nota: "A comparação só existe depois que o critério é seu.",
        },
        {
          rotulo: conforme(Boolean(curadoriaTecnica.selectedAt), {
            sim: "Os profissionais da rede foram analisados",
            ainda: "Os profissionais da rede serão analisados",
          }),
          feito: Boolean(curadoriaTecnica.selectedAt),
        },
        {
          rotulo: conforme(Boolean(relatorio.emittedAt), {
            sim: "Os três caminhos ficaram prontos",
            ainda: "Os três caminhos serão preparados",
          }),
          feito: Boolean(relatorio.emittedAt),
          nota: relatorio.emittedAt
            ? "Preparados dentro da Aliviar — ainda não apresentados a você."
            : "Eles só ficam prontos quando os três estiverem sustentados.",
        },
      ],
    },
    {
      id: "SEGUNDO_ENCONTRO",
      titulo: "Segundo Encontro",
      rotuloCurto: "2º Encontro",
      concluido: Boolean(devolutiva.presentedAt),
      descricao: devolutiva.presentedAt
        ? `${curador} apresentou os três caminhos e respondeu suas dúvidas.`
        : "As opções são sempre apresentadas por uma pessoa — nunca por um documento que chega sozinho.",
      submarcos: [
        {
          rotulo: conforme(Boolean(devolutiva.presentedAt), {
            sim: "As opções foram apresentadas por uma pessoa",
            ainda: "As opções serão apresentadas a você por uma pessoa",
          }),
          feito: Boolean(devolutiva.presentedAt),
        },
        // `deliveredAt` é fato próprio: apresentar não é entregar. Enquanto ele
        // for nulo, esta linha diz que o conteúdo digital ainda não está lá —
        // mesmo com a apresentação feita.
        {
          rotulo: conforme(Boolean(relatorio.deliveredAt), {
            sim: "O conteúdo ficou disponível para você reler",
            ainda: "Quando a entrega digital acontecer, o conteúdo ficará aqui para reler",
          }),
          feito: Boolean(relatorio.deliveredAt),
          nota: "Ter sido apresentado não é o mesmo que estar aqui para reler — são dois momentos.",
        },
      ],
    },
    {
      id: "DECISAO",
      titulo: "Sua decisão",
      rotuloCurto: "Decisão",
      concluido: Boolean(devolutiva.decision),
      descricao: devolutiva.decision
        ? "Você decidiu, no seu tempo."
        : "Os três caminhos são legítimos e não há ordem de preferência entre eles. Não existe prazo.",
      submarcos: [
        {
          rotulo: conforme(Boolean(devolutiva.decision), {
            sim: "Sua escolha foi registrada",
            ainda: "Quando você decidir, sua escolha ficará registrada aqui",
          }),
          feito: Boolean(devolutiva.decision),
        },
      ],
    },
    {
      id: "PROXIMOS_PASSOS",
      titulo: "Próximos passos",
      rotuloCurto: "Próximos passos",
      // Continuidade não se conclui: enquanto a Aliviar acompanha, este marco
      // fica aberto de propósito.
      concluido: false,
      descricao: devolutiva.decision
        ? "A partir daqui, a Aliviar cuida do agendamento e segue ao seu lado."
        : "Depois da sua decisão, seguimos com você — o acompanhamento não termina na escolha.",
      submarcos: [],
    },
  ];

  // O marco ATUAL é o primeiro não concluído. Caso encerrado não tem atual:
  // não há percurso em andamento para apontar.
  const indiceAtual = encerramento ? -1 : definicoes.findIndex((marco) => !marco.concluido);

  const etapasAguardando = new Set(
    jornada.stages
      .filter((stage) => stage.status === "AGUARDANDO_VOCE")
      .map((stage) => MARCO_DA_ETAPA[stage.id]),
  );

  const marcos: MarcoDaJornada[] = definicoes.map((definicao, indice) => {
    const { concluido, ...resto } = definicao;
    return {
      ...resto,
      status: concluido ? "CONCLUIDO" : indice === indiceAtual ? "ATUAL" : "FUTURO",
      aguardaVoce: !encerramento && etapasAguardando.has(definicao.id),
    };
  });

  return { marcos, responsavel: jornada.currentResponsible, encerramento };
}
