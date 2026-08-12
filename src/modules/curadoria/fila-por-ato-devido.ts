/**
 * A FILA POR ATO DEVIDO — sete grupos, todos derivados de fatos que já existem.
 *
 * A pergunta que esta projeção responde é a do Curador ao abrir o portal: *"por
 * onde eu começo agora?"*. A resposta honesta não é "pelo mais antigo" nem "pelo
 * mais urgente" — é **pelo ato que está devido**, e por quem o deve.
 *
 * ⛔ **Não existe tabela de fila.** Criá-la produziria um segundo dono do Caso,
 * concorrente com `cases` — o mesmo erro que a Caixa de Continuidade (NT-4)
 * evitou. Aqui não há coluna de status de fila, writer, marcação manual nem
 * estado persistido: cada grupo é um **predicado** sobre fatos já gravados por
 * atos reais. Apagar este arquivo não perde dado nenhum.
 *
 * ⛔ **Sem SLA, sem "atrasado", sem contagem de dias, sem cor de urgência.** Não
 * existe regra temporal aprovada neste produto, e inventá-la aqui seria criar um
 * SLA por conta própria — doutrina herdada de `continuity-worklist` e da Track C.
 * Um Caso parado há três meses e um de ontem aparecem igualmente: o que os
 * distingue é o ato devido, não o relógio.
 *
 * ⛔ **Nenhum conteúdo clínico.** A Fila diz o que fazer e com quem está a bola.
 * Parecer, história, diagnóstico, justificativa de composição e nota de filtro
 * pertencem à Mesa, e só a ela.
 *
 * **Onde este arquivo mora.** O contrato 36 §12 proíbe mexer em `src/modules/**`
 * — a proibição existe para que uma track de UX não altere regra de domínio.
 * Este arquivo não altera nenhuma: é uma projeção de leitura pura, sem writer,
 * sem migration e sem autoridade nova, e segue o precedente que o próprio §6
 * cita (a Caixa de Continuidade, que vive em `src/modules/connection`). Se a
 * leitura preferida for a literal, mover este arquivo é uma renomeação — nada
 * aqui depende do diretório.
 */

/**
 * O RECORTE DE FATOS que a Fila lê. Deliberadamente pequeno: tudo que **não**
 * está aqui é conteúdo que a Fila não pode mostrar nem usar para classificar.
 * Nenhum campo é livre; nenhum é clínico; nenhum é temporal-comparativo.
 */
export type FatosDaFila = {
  caseId: string;
  /** Nome de exibição da paciente — identificação operacional mínima. */
  patientName: string;
  /** Status do Caso. `CLOSED`/`CANCELLED` tiram o Caso da Fila. */
  status: string;
  closedAt: string | null;
  /** A devolução do entendimento ("deixa eu ver se entendi") já aconteceu? */
  understandingConfirmedAt: string | null;
  /** O Perfil de Prioridades foi aberto? É o Mapa preparado. */
  priorityProfileId: string | null;
  /** O primeiro encontro aconteceu? Fato da D-9, registrado pelo Curador. */
  meetingHeldAt: string | null;
  /** A PACIENTE reconheceu o Perfil (ADR-042). Nunca escrito pelo Curador. */
  validatedAt: string | null;
  reportEmittedAt: string | null;
  reportDeliveredAt: string | null;
  /** A decisão dela, em `patient_curadoria_decisions`. Append-only. */
  decisionAt: string | null;
  /** Entrega do motor antigo, sem Curadoria estruturada (CR-12). */
  legadoSemCuradoria: boolean;
};

export const GRUPOS_DA_FILA = [
  "AGUARDA_ACOLHIMENTO",
  "AGUARDA_PRIMEIRO_ENCONTRO",
  "AGUARDA_RECONHECIMENTO_DELA",
  "CURADORIA_EM_CURSO",
  "AGUARDA_ENTREGA",
  "AGUARDA_DECISAO_DELA",
  "COM_O_CONCIERGE",
] as const;

export type GrupoDaFila = (typeof GRUPOS_DA_FILA)[number];

/** Quem deve o próximo ato. A Fila mostra; nunca transfere. */
export type Responsavel = "CURADOR" | "PACIENTE" | "CONCIERGE";

export type DefinicaoDeGrupo = {
  id: GrupoDaFila;
  /** Copy exata do contrato 36 §6 — o cabeçalho do grupo É o nome do grupo. */
  titulo: string;
  /** O que o Curador faz (ou espera) aqui. Nunca um prazo. */
  atoDevido: string;
  responsavel: Responsavel;
  /** O que a tela diz quando o grupo está vazio. */
  vazio: string;
  /**
   * Se este grupo autoriza um CTA para o Curador. `false` quando o ato é de
   * outra pessoa — é o que impede a Fila de criar autoridade que não existe.
   */
  temAcaoDoCurador: boolean;
};

/**
 * OS SETE GRUPOS, NA ORDEM DO CONTRATO — e a ordem **é** a precedência.
 *
 * Cada Caso é avaliado de cima para baixo e para no primeiro predicado que
 * satisfaz. Por isso os predicados abaixo não precisam ser mutuamente
 * exclusivos em isolamento: a exclusividade vem da ordem, e é ela que garante
 * "no máximo um grupo por Caso". Ler de cima para baixo é ler a jornada.
 */
export const DEFINICOES_DA_FILA: Record<GrupoDaFila, DefinicaoDeGrupo> = {
  AGUARDA_ACOLHIMENTO: {
    id: "AGUARDA_ACOLHIMENTO",
    titulo: "Aguarda Acolhimento",
    atoDevido: "Ouvir a história e devolver o entendimento.",
    responsavel: "CURADOR",
    vazio: "Nenhum Caso aguardando Acolhimento.",
    temAcaoDoCurador: true,
  },
  AGUARDA_PRIMEIRO_ENCONTRO: {
    id: "AGUARDA_PRIMEIRO_ENCONTRO",
    titulo: "Aguarda o Primeiro Encontro",
    atoDevido: "Realizar o encontro e registrar que aconteceu.",
    responsavel: "CURADOR",
    vazio: "Nenhum Caso aguardando o Primeiro Encontro.",
    temAcaoDoCurador: true,
  },
  AGUARDA_RECONHECIMENTO_DELA: {
    id: "AGUARDA_RECONHECIMENTO_DELA",
    titulo: "Aguarda o reconhecimento dela",
    // ADR-042: reconhecer o Perfil é ato DELA. A Fila informa e para aí.
    atoDevido: "O Mapa está preparado e o reconhecimento é dela — nada a fazer aqui.",
    responsavel: "PACIENTE",
    vazio: "Nenhum Perfil aguardando reconhecimento.",
    temAcaoDoCurador: false,
  },
  CURADORIA_EM_CURSO: {
    id: "CURADORIA_EM_CURSO",
    titulo: "Curadoria em curso",
    atoDevido: "Analisar a Rede e compor os três caminhos.",
    responsavel: "CURADOR",
    vazio: "Nenhuma Curadoria em curso.",
    temAcaoDoCurador: true,
  },
  AGUARDA_ENTREGA: {
    id: "AGUARDA_ENTREGA",
    titulo: "Aguarda entrega",
    atoDevido: "Apresentar as três opções pessoalmente e entregar.",
    responsavel: "CURADOR",
    vazio: "Nenhum Relatório aguardando entrega.",
    temAcaoDoCurador: true,
  },
  AGUARDA_DECISAO_DELA: {
    id: "AGUARDA_DECISAO_DELA",
    titulo: "Aguarda a decisão dela",
    atoDevido: "A escolha é dela, no tempo dela.",
    responsavel: "PACIENTE",
    vazio: "Nenhuma decisão pendente.",
    temAcaoDoCurador: false,
  },
  COM_O_CONCIERGE: {
    id: "COM_O_CONCIERGE",
    titulo: "Com o Concierge",
    atoDevido: "O acompanhamento seguiu com a Equipe Aliviar.",
    responsavel: "CONCIERGE",
    vazio: "Nenhum Caso com o Concierge.",
    temAcaoDoCurador: false,
  },
};

/** Motivo pelo qual um Caso não entra em grupo nenhum. */
export type ForaDaFila = "ENCERRADO" | "LEGADO";

/**
 * A CLASSIFICAÇÃO — um Caso, no máximo um grupo.
 *
 * Devolve `null` quando o Caso está **fora** da Fila. São dois casos, ambos do
 * contrato: o Caso encerrado (`CLOSED`/`CANCELLED`, ou `closed_at` gravado) não
 * tem ato devido; e a entrega legada do motor antigo não é Curadoria
 * estruturada — colocá-la em qualquer grupo prometeria um ato que este produto
 * não vai executar.
 *
 * ⛔ Nada aqui olha data de criação, `updated_at`, posição em array ou qualquer
 * ordem de chegada. Dois Casos com os mesmos fatos caem no mesmo grupo,
 * independentemente de qual nasceu primeiro.
 */
export function classificarCaso(fatos: FatosDaFila): GrupoDaFila | null {
  // Fora da Fila, antes de tudo: um Caso encerrado não deve ato nenhum, e
  // deixá-lo cair no primeiro predicado o faria reaparecer como trabalho.
  if (fatos.closedAt !== null || fatos.status === "CLOSED" || fatos.status === "CANCELLED") {
    return null;
  }
  // A entrega legada existe no banco e não tem Curadoria estruturada por trás.
  if (fatos.legadoSemCuradoria) return null;

  // 7 · Com o Concierge — a decisão dela está registrada. É o fim da linha do
  //     Curador, e por isso é testado primeiro: qualquer fato anterior ainda
  //     seria verdadeiro, e o Caso apareceria duas vezes.
  if (fatos.decisionAt !== null) return "COM_O_CONCIERGE";

  // 6 · Aguarda a decisão dela — entregue, sem decisão. A Connection NÃO
  //     substitui a decisão: só `patient_curadoria_decisions` a registra.
  if (fatos.reportDeliveredAt !== null) return "AGUARDA_DECISAO_DELA";

  // 5 · Aguarda entrega — emitido e não entregue. Emitir ≠ entregar.
  if (fatos.reportEmittedAt !== null) return "AGUARDA_ENTREGA";

  // 4 · Curadoria em curso — ela reconheceu o Perfil e ainda não há Relatório
  //     emitido. É a Mesa aberta: seleção em curso conta aqui.
  if (fatos.validatedAt !== null) return "CURADORIA_EM_CURSO";

  // 3 · Aguarda o reconhecimento dela — o encontro aconteceu, o Mapa está
  //     preparado, e o ato seguinte é DELA (ADR-042).
  if (fatos.meetingHeldAt !== null) return "AGUARDA_RECONHECIMENTO_DELA";

  // 2 · Aguarda o Primeiro Encontro — Mapa preparado (Perfil aberto), encontro
  //     ainda não realizado.
  if (fatos.priorityProfileId !== null) return "AGUARDA_PRIMEIRO_ENCONTRO";

  // 1 · Aguarda Acolhimento — o entendimento ainda não foi devolvido. É o
  //     começo, e também a rede de segurança: um Caso sem nenhum fato adiante
  //     cai aqui em vez de sumir.
  return "AGUARDA_ACOLHIMENTO";
}

export function motivoDeExclusao(fatos: FatosDaFila): ForaDaFila | null {
  if (fatos.closedAt !== null || fatos.status === "CLOSED" || fatos.status === "CANCELLED") {
    return "ENCERRADO";
  }
  if (fatos.legadoSemCuradoria) return "LEGADO";
  return null;
}

export type GrupoMontado = {
  definicao: DefinicaoDeGrupo;
  casos: FatosDaFila[];
  contagem: number;
};

/**
 * A FILA INTEIRA — sete grupos, sempre os sete, sempre na mesma ordem.
 *
 * Grupo vazio **não some**: ele diz que está vazio. Um grupo que desaparece
 * ensina o Curador a não procurar por ele, e no dia em que voltar a ter Caso a
 * tela muda de forma sem aviso.
 *
 * A ordem dentro de cada grupo é a ordem de entrada — a Fila não promete
 * prioridade nenhuma dentro do grupo, e fingir uma seria inventar urgência.
 */
export function montarFila(fatos: FatosDaFila[]): {
  grupos: GrupoMontado[];
  fora: Array<{ caso: FatosDaFila; motivo: ForaDaFila }>;
  total: number;
} {
  const porGrupo = new Map<GrupoDaFila, FatosDaFila[]>(GRUPOS_DA_FILA.map((g) => [g, []]));
  const fora: Array<{ caso: FatosDaFila; motivo: ForaDaFila }> = [];

  for (const caso of fatos) {
    const grupo = classificarCaso(caso);
    if (grupo === null) {
      fora.push({ caso, motivo: motivoDeExclusao(caso) ?? "ENCERRADO" });
      continue;
    }
    porGrupo.get(grupo)!.push(caso);
  }

  const grupos = GRUPOS_DA_FILA.map((id) => ({
    definicao: DEFINICOES_DA_FILA[id],
    casos: porGrupo.get(id)!,
    contagem: porGrupo.get(id)!.length,
  }));

  return { grupos, fora, total: grupos.reduce((soma, g) => soma + g.contagem, 0) };
}

/**
 * O QUE A FILA LÊ DE UM `CuradoriaRecord` — e o que ela deliberadamente ignora.
 *
 * Esta função é a fronteira de privacidade da Fila: tudo que ela **não** copia
 * é conteúdo que a tela não tem como mostrar por acidente. História, parecer,
 * diagnóstico, hipótese, justificativa de composição, nota de filtro, contato —
 * nada disso atravessa. Se um dia a Fila precisar dizer mais, o campo entra
 * aqui, de propósito, e não por herança.
 */
export function fatosDoRegistro(
  registro: {
    caseId: string;
    patientName: string;
    historia: { understandingConfirmedAt: string | null };
    acolhimento: { meetingHeldAt: string | null };
    priorityProfileId: string | null;
    validacao: { validatedAt: string } | null;
    relatorio: { emittedAt: string | null; deliveredAt: string | null };
    devolutiva: { decision: { decidedAt: string } | null };
  },
  extras: { status: string; closedAt: string | null; legadoSemCuradoria: boolean },
): FatosDaFila {
  return {
    caseId: registro.caseId,
    patientName: registro.patientName,
    status: extras.status,
    closedAt: extras.closedAt,
    understandingConfirmedAt: registro.historia.understandingConfirmedAt,
    priorityProfileId: registro.priorityProfileId,
    meetingHeldAt: registro.acolhimento.meetingHeldAt,
    validatedAt: registro.validacao?.validatedAt ?? null,
    reportEmittedAt: registro.relatorio.emittedAt,
    reportDeliveredAt: registro.relatorio.deliveredAt,
    decisionAt: registro.devolutiva.decision?.decidedAt ?? null,
    legadoSemCuradoria: extras.legadoSemCuradoria,
  };
}
