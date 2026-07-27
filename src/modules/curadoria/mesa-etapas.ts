/**
 * AS ETAPAS DA MESA — uma decisão por vez.
 *
 * O paciente percorre uma jornada; o Curador conduz uma investigação. A
 * diferença muda a arquitetura: a jornada é linear e acolhedora, a
 * investigação é não-linear e sob controle de quem investiga. Tudo continua
 * disponível — mas só o que serve à decisão de agora ganha destaque.
 *
 * Por isso este módulo não bloqueia etapa nenhuma: ele calcula onde está a
 * próxima decisão e o que cada etapa ainda deve. O Curador entra onde quiser,
 * a qualquer momento; a Mesa apenas deixa de fazê-lo procurar.
 *
 * Puro e determinístico: sem React, sem banco.
 */

export const MESA_ETAPAS = [
  "PERFIL",
  "REDE",
  "AVALIACAO",
  "COMPATIBILIDADE",
  "CRUZAMENTO",
  "CAMINHOS",
  "RELATORIO",
] as const;

export type MesaEtapaId = (typeof MESA_ETAPAS)[number];

export const MESA_ETAPA_LABELS: Record<MesaEtapaId, string> = {
  PERFIL: "Perfil",
  REDE: "Rede elegível",
  AVALIACAO: "Avaliação técnica",
  COMPATIBILIDADE: "Compatibilidade",
  CRUZAMENTO: "Cruzamento",
  CAMINHOS: "Três caminhos",
  RELATORIO: "Relatório",
};

/** A pergunta que o Curador responde em cada etapa — o nome é o raciocínio. */
export const MESA_ETAPA_QUESTIONS: Record<MesaEtapaId, string> = {
  PERFIL: "Quanto pesa cada critério para esta pessoa?",
  REDE: "Quem pode participar desta Curadoria?",
  AVALIACAO: "Quanto cada profissional responde tecnicamente a este caso?",
  COMPATIBILIDADE: "Quanto cada um responde ao que ela declarou?",
  CRUZAMENTO: "O que os dois cruzamentos mostram, lado a lado?",
  CAMINHOS: "Quais três caminhos eu apresento?",
  RELATORIO: "O que ela vai reler sozinha?",
};

/**
 * `PENDENTE` é o que ainda deve algo; `PRONTA` é o que já respondeu. Não
 * existe `BLOQUEADA`: o Curador pode abrir qualquer etapa quando quiser — a
 * investigação é dele. Etapas que dependem de outra dizem do que dependem,
 * em vez de fechar a porta.
 */
export type MesaEtapaStatus = "PRONTA" | "PENDENTE" | "AGUARDA";

export type MesaEtapaState = {
  id: MesaEtapaId;
  label: string;
  question: string;
  status: MesaEtapaStatus;
  /** O que falta, em uma frase. Vazio quando a etapa está pronta. */
  pending: string | null;
  /** De que ela depende para poder ser respondida. */
  waitingOn: string | null;
};

export type MesaFacts = {
  profileValidated: boolean;
  budgetsComplete: boolean;
  professionalsFound: number;
  awaitingAreaDeclaration: number;
  eligible: number;
  /** Critérios sem declaração, somados entre os elegíveis. */
  criteriaAwaiting: number;
  selected: number;
  reportExists: boolean;
  reportApproved: boolean;
  reportEmitted: boolean;
};

function etapa(
  id: MesaEtapaId,
  status: MesaEtapaStatus,
  pending: string | null,
  waitingOn: string | null = null,
): MesaEtapaState {
  return { id, label: MESA_ETAPA_LABELS[id], question: MESA_ETAPA_QUESTIONS[id], status, pending, waitingOn };
}

export function buildMesaEtapas(facts: MesaFacts): MesaEtapaState[] {
  const temElegiveis = facts.eligible > 0;
  const avaliacaoPronta = temElegiveis && facts.criteriaAwaiting === 0;

  return [
    facts.budgetsComplete
      ? etapa("PERFIL", "PRONTA", null)
      : etapa("PERFIL", "PENDENTE", "Distribuir os pontos dos dois cruzamentos."),

    facts.professionalsFound === 0
      ? etapa("REDE", "AGUARDA", null, "Nenhum profissional publicado alcança este Case.")
      : facts.awaitingAreaDeclaration > 0
        ? etapa(
            "REDE",
            "PENDENTE",
            `Declarar a área de ${facts.awaitingAreaDeclaration} profissional(is).`,
          )
        : etapa("REDE", "PRONTA", null),

    !temElegiveis
      ? etapa("AVALIACAO", "AGUARDA", null, "Depende de haver ao menos um profissional elegível.")
      : facts.criteriaAwaiting > 0
        ? etapa("AVALIACAO", "PENDENTE", `${facts.criteriaAwaiting} critério(s) sem avaliação.`)
        : etapa("AVALIACAO", "PRONTA", null),

    !temElegiveis
      ? etapa("COMPATIBILIDADE", "AGUARDA", null, "Depende de haver ao menos um profissional elegível.")
      : facts.criteriaAwaiting > 0
        ? etapa("COMPATIBILIDADE", "PENDENTE", "Faltam avaliações para fechar a leitura.")
        : etapa("COMPATIBILIDADE", "PRONTA", null),

    !facts.budgetsComplete
      ? etapa("CRUZAMENTO", "AGUARDA", null, "Depende dos pontos distribuídos.")
      : !avaliacaoPronta
        ? etapa("CRUZAMENTO", "AGUARDA", null, "Depende das avaliações por critério.")
        : etapa("CRUZAMENTO", "PRONTA", null),

    facts.selected === 3
      ? etapa("CAMINHOS", "PRONTA", null)
      : facts.eligible < 3
        ? etapa(
            "CAMINHOS",
            "AGUARDA",
            null,
            `Há ${facts.eligible} elegíve${facts.eligible === 1 ? "l" : "is"} — a seleção exige três.`,
          )
        : etapa("CAMINHOS", "PENDENTE", `Selecionar ${3 - facts.selected} de 3.`),

    facts.reportEmitted
      ? etapa("RELATORIO", "PRONTA", null)
      : facts.selected !== 3
        ? etapa("RELATORIO", "AGUARDA", null, "Depende dos três caminhos selecionados.")
        : facts.reportApproved
          ? etapa("RELATORIO", "PENDENTE", "Emitir o Relatório.")
          : facts.reportExists
            ? etapa("RELATORIO", "PENDENTE", "Revisar e aprovar o Relatório.")
            : etapa("RELATORIO", "PENDENTE", "Escrever ou gerar o rascunho."),
  ];
}

export type ProximaDecisao = {
  etapa: MesaEtapaId;
  /** A frase do cabeçalho: o que fazer agora. */
  label: string;
  /** Verdadeiro quando nada depende do Curador neste momento. */
  blocked: boolean;
};

/**
 * A pergunta que a Mesa inteira responde: qual é a próxima decisão?
 *
 * A primeira etapa pendente na ordem da investigação. Se nenhuma está
 * pendente mas alguma aguarda, a Mesa diz do que ela depende — silêncio mudo
 * seria a interface fingindo que está tudo certo.
 */
export function proximaDecisao(
  etapas: MesaEtapaState[],
  profileValidated: boolean,
): ProximaDecisao {
  if (!profileValidated) {
    return {
      etapa: "PERFIL",
      label: "O Perfil de Prioridades ainda precisa ser validado pela pessoa.",
      blocked: true,
    };
  }

  const pendente = etapas.find((entrada) => entrada.status === "PENDENTE");
  if (pendente) {
    return { etapa: pendente.id, label: pendente.pending ?? pendente.question, blocked: false };
  }

  const aguardando = etapas.find((entrada) => entrada.status === "AGUARDA");
  if (aguardando) {
    return { etapa: aguardando.id, label: aguardando.waitingOn ?? "Aguardando.", blocked: true };
  }

  return { etapa: "RELATORIO", label: "Curadoria concluída.", blocked: false };
}

/** Quantas etapas já responderam — o progresso da investigação. */
export function mesaProgress(etapas: MesaEtapaState[]): { done: number; total: number } {
  return { done: etapas.filter((entrada) => entrada.status === "PRONTA").length, total: etapas.length };
}
