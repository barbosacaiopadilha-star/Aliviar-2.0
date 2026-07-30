/**
 * Jornada do Paciente — projeção da Memória da Curadoria (MISSÃO 205).
 *
 * O Portal do Paciente não tem estado próprio: ele é uma **projeção** do mesmo
 * `CuradoriaRecord` que o Curador usa, menos o nível interno. Isso é decisão de
 * método, não de arquitetura — a Experiência (§6) determina que não existe
 * "versão do paciente" de um artefato compartilhado. Derivar em vez de duplicar
 * torna estruturalmente impossível a tela do paciente mostrar algo que o
 * registro não contém, ou divergir do que o Curador vê.
 *
 * O que nunca atravessa esta fronteira: score interno, cobertura de cadastro,
 * lista de analisados, quem foi eliminado, nome de mecanismo. Verificado por
 * teste.
 *
 * Puro e determinístico: sem banco, sem rede, sem data do sistema.
 */

import type { CuradoriaRecord } from "./cos/types";
import { resolveCurrentResponsible, type CoaCurrentResponsible } from "@/modules/coa/journey-responsibility";

export const JORNADA_STAGES = [
  "CONSULTA_INICIAL",
  "PERFIL_DE_PRIORIDADES",
  "CURADORIA",
  "DOSSIE",
  "REUNIAO",
  "ESCOLHA",
  "ACOMPANHAMENTO",
] as const;

export type JornadaStageId = (typeof JORNADA_STAGES)[number];

export const JORNADA_STAGE_LABELS: Record<JornadaStageId, string> = {
  CONSULTA_INICIAL: "Consulta Inicial",
  PERFIL_DE_PRIORIDADES: "Perfil de Prioridades",
  CURADORIA: "Curadoria em andamento",
  DOSSIE: "Dossiê preparado",
  REUNIAO: "Reunião agendada",
  ESCOLHA: "Sua escolha",
  ACOMPANHAMENTO: "Acompanhamento",
};

/**
 * `AGUARDANDO_VOCE` existe separado de `EM_ANDAMENTO` porque a diferença
 * importa para quem lê: uma coisa é a equipe trabalhando, outra é a vez dele.
 * `A_CAMINHO` nunca aparece como caixa cinza vazia — carrega o que vai
 * acontecer (a missão proíbe etapa vazia).
 */
export type JornadaStageStatus = "CONCLUIDA" | "EM_ANDAMENTO" | "AGUARDANDO_VOCE" | "A_CAMINHO";

export type JornadaStage = {
  id: JornadaStageId;
  label: string;
  status: JornadaStageStatus;
  /** O que aconteceu, em linguagem de pessoa. Nunca "processando". */
  description: string;
  /** Última atualização real — null quando ainda não houve nenhuma. */
  updatedAt: string | null;
  /** A próxima ação, e de quem ela é. */
  nextAction: { label: string; owner: "VOCE" | "EQUIPE" } | null;
  /** Quem responde por esta etapa, pelo nome. */
  responsible: string;
};

export type Jornada = {
  patientFirstName: string;
  curatorName: string;
  /** Responsável atual visível ao Assistido — um papel por vez. */
  currentResponsible: CoaCurrentResponsible;
  stages: JornadaStage[];
  /** A etapa em que a jornada está agora — nunca a mais avançada com dado. */
  currentStage: JornadaStageId;
  /** Prazo combinado, quando existe. O Portal nunca inventa um. */
  promisedReturn: string | null;
};

export function buildJornada(record: CuradoriaRecord): Jornada {
  const { historia, validacao, curadoriaTecnica, relatorio, devolutiva } = record;
  const curator = record.curatorName;
  const name = record.patientFirstName;

  const consultaDone = Boolean(historia.understandingConfirmedAt);
  const perfilDone = Boolean(validacao?.validatedAt);
  const curadoriaDone = curadoriaTecnica.selectedProfessionalIds.length === 3;
  const dossieDone = Boolean(relatorio.emittedAt);
  const reuniaoDone = Boolean(devolutiva.presentedAt);
  const escolhaDone = Boolean(devolutiva.decision);

  const stages: JornadaStage[] = [
    {
      id: "CONSULTA_INICIAL",
      label: JORNADA_STAGE_LABELS.CONSULTA_INICIAL,
      status: consultaDone ? "CONCLUIDA" : "EM_ANDAMENTO",
      description: consultaDone
        ? `Você contou sua história para ${curator}, e ela devolveu organizada até você reconhecer.`
        : `${curator} vai ouvir sua história inteira antes de organizar qualquer coisa.`,
      updatedAt: historia.understandingConfirmedAt ?? historia.registeredAt,
      nextAction: consultaDone ? null : { label: "Conversar com seu Curador", owner: "EQUIPE" },
      responsible: curator,
    },
    {
      id: "PERFIL_DE_PRIORIDADES",
      label: JORNADA_STAGE_LABELS.PERFIL_DE_PRIORIDADES,
      status: perfilDone ? "CONCLUIDA" : consultaDone ? "AGUARDANDO_VOCE" : "A_CAMINHO",
      description: perfilDone
        ? "Seu Perfil está completo, e você o reconheceu como seu."
        : consultaDone
          ? "Falta você reconhecer este Perfil como seu. Sem essa confirmação, nada avança."
          : "Vocês vão definir juntos o que mais importa para você nesta decisão.",
      updatedAt: validacao?.validatedAt ?? null,
      nextAction: perfilDone
        ? null
        : consultaDone
          ? { label: "Validar meu Perfil de Prioridades", owner: "VOCE" }
          : null,
      responsible: perfilDone ? name : curator,
    },
    {
      id: "CURADORIA",
      label: JORNADA_STAGE_LABELS.CURADORIA,
      status: curadoriaDone ? "CONCLUIDA" : perfilDone ? "EM_ANDAMENTO" : "A_CAMINHO",
      description: curadoriaDone
        ? `${curator} analisou os profissionais da rede aprovada e escolheu três caminhos para você.`
        : perfilDone
          ? `${curator} está analisando os profissionais da rede aprovada com base no que vocês construíram.`
          : "Seu Perfil será aplicado aos profissionais que a Aliviar já aprovou.",
      // Nunca a data do cálculo — o que importa para quem lê é quando uma
      // pessoa trabalhou, não quando uma máquina rodou (M3: a data do cálculo
      // nem existe mais no registro).
      updatedAt: curadoriaTecnica.selectedAt,
      nextAction: curadoriaDone ? null : perfilDone ? { label: "Em análise", owner: "EQUIPE" } : null,
      responsible: curator,
    },
    {
      id: "DOSSIE",
      label: JORNADA_STAGE_LABELS.DOSSIE,
      status: dossieDone ? "CONCLUIDA" : curadoriaDone ? "EM_ANDAMENTO" : "A_CAMINHO",
      description: dossieDone
        ? "Seu Dossiê está pronto: as três opções, o que cada uma oferece e o que cada uma custa."
        : curadoriaDone
          ? `${curator} está escrevendo o parecer de cada opção.`
          : "Você vai receber um documento explicando cada opção e sua relação com suas prioridades.",
      updatedAt: relatorio.emittedAt,
      // Sem destino enquanto a tela do Dossiê não existe. Prometer "Ler meu
      // Dossiê" sem ter onde levar seria pior que não prometer: a MISSÃO 206
      // exige que nenhum fluxo termine abruptamente, e um convite que não
      // abre nada é exatamente um fim abrupto. Quando a tela existir, esta
      // ação volta com `owner: "VOCE"`.
      nextAction: dossieDone
        ? { label: `${curator} vai apresentar as opções na conversa de vocês`, owner: "EQUIPE" }
        : null,
      responsible: curator,
    },
    {
      id: "REUNIAO",
      label: JORNADA_STAGE_LABELS.REUNIAO,
      status: reuniaoDone ? "CONCLUIDA" : dossieDone ? "AGUARDANDO_VOCE" : "A_CAMINHO",
      description: reuniaoDone
        ? `${curator} apresentou as três opções e respondeu suas dúvidas.`
        : dossieDone
          ? `${curator} vai apresentar as opções pessoalmente e explicar o que diferencia cada uma.`
          : "As opções são sempre apresentadas por uma pessoa — nunca só por documento.",
      updatedAt: devolutiva.presentedAt,
      nextAction: reuniaoDone ? null : dossieDone ? { label: "Combinar a conversa", owner: "EQUIPE" } : null,
      responsible: curator,
    },
    {
      id: "ESCOLHA",
      label: JORNADA_STAGE_LABELS.ESCOLHA,
      status: escolhaDone ? "CONCLUIDA" : reuniaoDone ? "AGUARDANDO_VOCE" : "A_CAMINHO",
      description: escolhaDone
        ? devolutiva.decision?.outcome === "CHOSEN"
          ? "Você escolheu. A decisão foi sua, e ela está registrada."
          : "Nenhuma das três serviu — e isso é uma resposta legítima. Vamos entender o que faltou."
        : reuniaoDone
          ? "A decisão é sua, no seu tempo. Não há prazo."
          : "A escolha final é sempre sua.",
      updatedAt: devolutiva.decision?.decidedAt ?? null,
      nextAction: escolhaDone
        ? null
        : reuniaoDone
          ? { label: "Registrar minha decisão", owner: "VOCE" }
          : null,
      responsible: name,
    },
    {
      id: "ACOMPANHAMENTO",
      label: JORNADA_STAGE_LABELS.ACOMPANHAMENTO,
      status:
        escolhaDone && devolutiva.decision?.outcome === "CHOSEN" ? "EM_ANDAMENTO" : "A_CAMINHO",
      description:
        escolhaDone && devolutiva.decision?.outcome === "CHOSEN"
          ? "A Curadoria não termina na escolha. Seguimos com você."
          : "Depois da escolha, continuamos acompanhando sua jornada.",
      updatedAt: null,
      nextAction: null,
      responsible:
        escolhaDone && devolutiva.decision?.outcome === "CHOSEN"
          ? "Equipe Aliviar"
          : curator,
    },
  ];

  const current =
    stages.find((stage) => stage.status !== "CONCLUIDA")?.id ?? "ACOMPANHAMENTO";

  const currentResponsible = resolveCurrentResponsible({
    curadoriaRecord: record,
    curatorName: curator,
    attendantName: "Equipe Aliviar",
    conciergeName: "Equipe Aliviar",
  });

  return {
    patientFirstName: name,
    curatorName: curator,
    currentResponsible,
    stages,
    currentStage: current,
    promisedReturn: record.promisedReturn,
  };
}

/**
 * Os pesos como o paciente os vê — sempre com a evidência, porque é a fala
 * dele ao lado do número que transforma transparência em reconhecimento
 * (Jornada §Momento 4). Nunca o score interno de nenhum profissional.
 */
export type PesoPaciente = {
  criterion: string;
  label: string;
  weight: number;
  evidence: string;
};

export const PERFIL_MESSAGE =
  "Este Perfil foi construído junto com você durante nossa conversa e serviu como base para toda a Curadoria.";
