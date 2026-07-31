/**
 * PROTOCOLOS OFICIAIS — o contrato executável das perguntas.
 *
 * @metodo PROTOCOLO_PESSOA.md — 14 perguntas + 2 declarações clínicas
 * @metodo PROTOCOLO_PRATICA_PROFISSIONAL.md — Q1..Q28
 * @metodo MAPA_DOS_PROTOCOLOS.md / MATRIZ_DE_COBERTURA.md — cobertura 28×5
 * @metodo GRAMATICA_DAS_PERGUNTAS.md — formas, escapes, graus, flexibilidade
 *
 * As opções canônicas do lado do profissional NÃO vivem aqui: vivem em
 * `evidencias-pratica.ts` (o Catálogo 1.0.0 executável) e são importadas —
 * duplicar a lista seria criar o segundo vocabulário que a ADR-039 matou.
 * Este módulo acrescenta o que é do protocolo: o texto da pergunta na língua
 * de quem responde, o público, o modo de aplicação e o lado da pessoa.
 *
 * Puro e determinístico: sem React, sem banco.
 */

import { PRACTICE_CATALOG, PRACTICE_CONCEPTS_BY_CODE, type PracticeConcept } from "./evidencias-pratica";

// ---------------------------------------------------------------------------
// Formas do lado da pessoa
// ---------------------------------------------------------------------------

/** Como a resposta da pessoa nasce — decisão de Método do mapa de perguntas. */
export const PERSON_MODES = ["DIRETO", "TRADUCAO", "DECLARACAO_CLINICA"] as const;
export type PersonMode = (typeof PERSON_MODES)[number];

/** Grau declarado pela pessoa (ou traduzido). Nunca inferido. */
export const NEED_DEGREES = ["ESSENCIAL", "IMPORTANTE", "DESEJAVEL", "SEM_PREFERENCIA"] as const;
export type NeedDegree = (typeof NEED_DEGREES)[number];

export const NEED_DEGREE_LABELS: Record<NeedDegree, string> = {
  ESSENCIAL: "Essencial — sem isso o cuidado não acontece",
  IMPORTANTE: "Importante — pesa muito, não impede",
  DESEJAVEL: "Desejável — bem-vindo",
  SEM_PREFERENCIA: "Não tenho preferência",
};

/** O reconhecimento de uma leitura traduzida — sempre ato da pessoa. */
export const ACKNOWLEDGMENT_STATES = ["PENDENTE", "RECONHECIDA", "CORRIGIDA", "RECUSADA"] as const;
export type AcknowledgmentState = (typeof ACKNOWLEDGMENT_STATES)[number];

export type PersonQuestion = {
  /** Identificador estável da pergunta (P1..P16, do documento oficial). */
  id: string;
  subcriterionCode: string;
  mode: PersonMode;
  /** A pergunta como o Curador a faz — língua da vida, nunca jargão. */
  question: string;
  /** Opções canônicas do lado da pessoa (código → rótulo). */
  options: Readonly<Record<string, string>>;
  multi: boolean;
  /** Pergunta de flexibilidade, quando o conceito a tem. */
  flexibilityQuestion: string | null;
  /** Texto guiado permitido? Só onde o protocolo autoriza (P14). */
  allowsGuidedText: boolean;
};

const SEM_PREFERENCIA = { NAO_TENHO_PREFERENCIA: "Não tenho preferência" } as const;
const NAO_SEI = { NAO_SEI_INFORMAR: "Não sei informar" } as const;

// ---------------------------------------------------------------------------
// PROTOCOLO DA PESSOA — P1..P16 (P8 e P9 são declarações do Curador)
// ---------------------------------------------------------------------------

export const PERSON_PROTOCOL: readonly PersonQuestion[] = [
  {
    id: "P1", subcriterionCode: "ACESSO_MODALIDADE", mode: "DIRETO",
    question: "Como você consegue ser atendida?",
    options: {
      PRECISO_REMOTO: "Preciso de atendimento remoto",
      PREFIRO_REMOTO: "Prefiro remoto",
      PRECISO_PRESENCIAL: "Preciso de atendimento presencial",
      PREFIRO_PRESENCIAL: "Prefiro presencial",
      TANTO_FAZ: "Tanto faz",
      ...NAO_SEI,
    },
    multi: false,
    flexibilityQuestion: "Se não houver o formato que você precisa, o outro serve para você eventualmente?",
    allowsGuidedText: false,
  },
  {
    id: "P2", subcriterionCode: "ACESSO_LOCAL_DE_ATENDIMENTO", mode: "TRADUCAO",
    question: "De onde você sairia para uma consulta — e até onde dá para ir?",
    options: {
      ATE_30_MIN: "Até 30 minutos", ATE_1H: "Até 1 hora", ATE_2H: "Até 2 horas",
      QUALQUER_DISTANCIA: "Qualquer distância", NAO_POSSO_ME_DESLOCAR: "Não posso me deslocar",
    },
    multi: false, flexibilityQuestion: null, allowsGuidedText: false,
  },
  {
    id: "P3", subcriterionCode: "ACESSO_DISPONIBILIDADE", mode: "DIRETO",
    question: "Quando você consegue ser atendida?",
    options: {
      MANHA_DIAS_UTEIS: "Manhã em dias úteis", TARDE_DIAS_UTEIS: "Tarde em dias úteis",
      NOITE_APOS_18H: "Noite, após as 18h", SABADO: "Sábado", DOMINGO_OU_FERIADO: "Domingo ou feriado",
    },
    multi: true,
    flexibilityQuestion: "Você conseguiria faltar ao trabalho ou compromisso para uma consulta?",
    allowsGuidedText: false,
  },
  {
    id: "P4", subcriterionCode: "ACESSO_PRAZO_PARA_CONSULTA", mode: "TRADUCAO",
    question: "Em quanto tempo você sente que precisa ser atendida?",
    options: {
      ATE_7_DIAS: "Em até 7 dias", ATE_15_DIAS: "Em até 15 dias",
      ATE_30_DIAS: "Em até 30 dias", SEM_URGENCIA_DECLARADA: "Sem urgência declarada",
    },
    multi: false, flexibilityQuestion: null, allowsGuidedText: false,
  },
  {
    id: "P5", subcriterionCode: "CONTINUIDADE_RETORNOS", mode: "TRADUCAO",
    question: "Depois da primeira consulta, como você gostaria que o acompanhamento continuasse?",
    options: {
      RETORNO_JA_MARCADO_AO_SAIR: "Sair com o retorno já marcado",
      RETORNO_CONFORME_EU_EVOLUIR: "Retorno conforme eu evoluir",
      PREFIRO_PROCURAR_QUANDO_PRECISAR: "Prefiro procurar quando precisar",
      QUERO_ORIENTACAO_ESCRITA_APOS_CONSULTA: "Quero orientação escrita após a consulta",
      ...SEM_PREFERENCIA,
    },
    multi: true, flexibilityQuestion: null, allowsGuidedText: false,
  },
  {
    id: "P6", subcriterionCode: "CONTINUIDADE_CANAIS", mode: "TRADUCAO",
    question: "Se algo mudar entre uma consulta e outra — você piorar, surgir uma dúvida — o que você precisa que exista?",
    options: {
      PODER_MANDAR_MENSAGEM: "Poder mandar mensagem",
      TELEFONE_PARA_LIGAR: "Um telefone para ligar",
      CONTATO_PARA_URGENCIA_FORA_DO_HORARIO: "Contato para urgência fora do horário",
      BASTA_REAGENDAR: "Basta poder reagendar",
      ...SEM_PREFERENCIA,
    },
    multi: true, flexibilityQuestion: null, allowsGuidedText: false,
  },
  {
    id: "P7", subcriterionCode: "CONTINUIDADE_COORDENACAO", mode: "TRADUCAO",
    question: "Você já é acompanhada por outros profissionais que precisariam conversar entre si sobre você?",
    options: { SIM: "Sim", NAO: "Não", ...NAO_SEI },
    multi: false, flexibilityQuestion: null, allowsGuidedText: false,
  },
  {
    id: "P8", subcriterionCode: "CONTINUIDADE_POS_PROCEDIMENTO", mode: "DECLARACAO_CLINICA",
    question: "(Projeção clínica do Curador — a pessoa não é perguntada antes do diagnóstico.)",
    options: {}, multi: false, flexibilityQuestion: null, allowsGuidedText: false,
  },
  {
    id: "P9", subcriterionCode: "CONTINUIDADE_EQUIPE_DE_APOIO", mode: "DECLARACAO_CLINICA",
    question: "(Projeção clínica do Curador — traduzida quando a história já revela.)",
    options: {}, multi: false, flexibilityQuestion: null, allowsGuidedText: false,
  },
  {
    id: "P10", subcriterionCode: "MODELO_COMUNICACAO", mode: "TRADUCAO",
    question: "O que te ajudaria a entender melhor o que for explicado?",
    options: {
      EXPLICACAO_SEM_TERMOS_TECNICOS: "Explicação sem termos técnicos",
      QUE_CONFIRMEM_SE_ENTENDI: "Que confirmem se eu entendi",
      ALGO_ESCRITO_PARA_LEVAR: "Algo escrito para levar",
      DESENHO_OU_IMAGEM: "Desenho ou imagem",
      TEMPO_PARA_PERGUNTAR: "Tempo para perguntar",
      PODER_GRAVAR_A_CONVERSA: "Poder gravar a conversa",
      ...SEM_PREFERENCIA,
    },
    multi: true, flexibilityQuestion: null, allowsGuidedText: false,
  },
  {
    id: "P11", subcriterionCode: "MODELO_DECISAO_COMPARTILHADA", mode: "DIRETO",
    question: "Quando houver mais de um caminho possível, como você gostaria de participar da decisão?",
    options: {
      QUERO_DECIDIR_COM_ORIENTACAO: "Quero decidir, com orientação",
      QUERO_QUE_RECOMENDE_E_EU_CONFIRMO: "Quero que o médico recomende e eu confirmo",
      PREFIRO_QUE_O_MEDICO_DECIDA: "Prefiro que o médico decida",
      NAO_SEI_AINDA: "Não sei ainda",
    },
    multi: false, flexibilityQuestion: null, allowsGuidedText: false,
  },
  {
    id: "P12", subcriterionCode: "MODELO_ALTERNATIVAS", mode: "TRADUCAO",
    question: "Antes de aceitar um tratamento, o que você precisa saber?",
    options: {
      TODAS_AS_OPCOES_DISPONIVEIS: "Todas as opções disponíveis",
      OPCAO_DE_NAO_FAZER_NADA: "A opção de não fazer nada",
      RISCOS_DE_CADA_CAMINHO: "Os riscos de cada caminho",
      CUSTOS_DE_CADA_CAMINHO: "Os custos de cada caminho",
      ...SEM_PREFERENCIA,
    },
    multi: true, flexibilityQuestion: null, allowsGuidedText: false,
  },
  {
    id: "P13", subcriterionCode: "MODELO_PARTICIPACAO_FAMILIAR", mode: "DIRETO",
    question: "Você quer que alguém participe das conversas com você?",
    options: {
      QUERO_ACOMPANHANTE_SEMPRE: "Quero acompanhante sempre",
      EM_ALGUMAS_CONVERSAS: "Em algumas conversas",
      PREFIRO_SOZINHA: "Prefiro sozinha",
      ...SEM_PREFERENCIA,
    },
    multi: false, flexibilityQuestion: null, allowsGuidedText: false,
  },
  {
    id: "P14", subcriterionCode: "MODELO_PREFERENCIAS_E_RESTRICOES", mode: "TRADUCAO",
    question: "Existe algo que você não aceita, ou que precisa ser respeitado no seu cuidado?",
    options: {}, multi: false, flexibilityQuestion: null,
    allowsGuidedText: true, // o ÚNICO texto guiado do protocolo da pessoa
  },
  {
    id: "P15", subcriterionCode: "VIABILIDADE_COBERTURA_E_CONVENIO", mode: "DIRETO",
    question: "Como você pretende usar sua cobertura de saúde?",
    options: {
      PRECISO_USAR_ESTE_CONVENIO: "Preciso usar este convênio",
      POSSO_USAR_REEMBOLSO: "Posso usar reembolso",
      ACEITO_ATENDIMENTO_PARTICULAR: "Aceito atendimento particular",
      PRECISO_CONFIRMAR_MINHA_COBERTURA: "Preciso confirmar minha cobertura",
      SEM_RESTRICAO_DECLARADA: "Sem restrição declarada",
      NAO_SE_APLICA: "Não se aplica",
    },
    multi: true, flexibilityQuestion: null, allowsGuidedText: false,
  },
  {
    id: "P16", subcriterionCode: "VIABILIDADE_CUSTO_E_PAGAMENTO", mode: "DIRETO",
    question: "O que precisa ser verdade para você conseguir pagar pelo atendimento?",
    options: {
      TENHO_LIMITE: "Tenho um limite de valor",
      PRECISO_SABER_O_VALOR_ANTES: "Preciso saber o valor antes de escolher",
      PRECISO_DE_PARCELAMENTO: "Preciso de parcelamento",
      NAO_DECLAREI_RESTRICAO: "Não declaro restrição",
      PREFIRO_NAO_INFORMAR: "Prefiro não informar",
      NAO_SE_APLICA: "Não se aplica",
    },
    multi: true, flexibilityQuestion: null, allowsGuidedText: false,
  },
] as const;

export const PERSON_QUESTIONS_BY_CODE: ReadonlyMap<string, PersonQuestion> = new Map(
  PERSON_PROTOCOL.map((q) => [q.subcriterionCode, q]),
);

// ---------------------------------------------------------------------------
// PROTOCOLO DO PROFISSIONAL — Q1..Q28, derivado do Catálogo (não duplicado)
// ---------------------------------------------------------------------------

export type ProfessionalQuestion = {
  /** Identificador estável (Q1..Q28, na ordem da Matriz de Cobertura). */
  id: string;
  /** O contrato do conceito vem do Catálogo — opções, multi, condição, tier. */
  concept: PracticeConcept;
  /** A pergunta situacional — comportamento, nunca opinião. */
  question: string;
  /** Parte do protocolo (A–E), para navegação por blocos. */
  part: "A" | "B" | "C" | "D" | "E";
};

const PROFESSIONAL_QUESTION_TEXTS: Record<string, { question: string; part: ProfessionalQuestion["part"] }> = {
  ACESSO_MODALIDADE: { question: "Em quais formatos você atende hoje?", part: "A" },
  ACESSO_LOCAL_DE_ATENDIMENTO: { question: "Em quais endereços você atende presencialmente?", part: "A" },
  ACESSO_DISPONIBILIDADE: { question: "Em quais janelas você atende habitualmente?", part: "A" },
  ACESSO_PRAZO_PARA_CONSULTA: { question: "Hoje, qual o prazo habitual para uma primeira consulta?", part: "A" },
  CONTINUIDADE_RETORNOS: { question: "Depois da primeira consulta, quais destas condutas você costuma adotar?", part: "B" },
  CONTINUIDADE_CANAIS: { question: "Entre uma consulta e outra, como a pessoa consegue falar com você ou com sua equipe?", part: "B" },
  CONTINUIDADE_POS_PROCEDIMENTO: { question: "Quando você realiza um procedimento, o que acontece depois — e por quanto tempo?", part: "B" },
  CONTINUIDADE_EQUIPE_DE_APOIO: { question: "Quem mais acompanha, junto com você, as pessoas que você atende?", part: "B" },
  CONTINUIDADE_COORDENACAO: { question: "Quando a pessoa já é acompanhada por outros profissionais, o que você costuma fazer?", part: "B" },
  MODELO_COMUNICACAO: { question: "Quando uma pessoa demonstra dificuldade para compreender uma explicação, quais práticas você normalmente utiliza?", part: "C" },
  MODELO_DECISAO_COMPARTILHADA: { question: "Quando existem duas ou mais opções clinicamente adequadas, quais ações você costuma realizar antes da decisão?", part: "C" },
  MODELO_ALTERNATIVAS: { question: "Ao propor uma conduta, o que você costuma apresentar junto?", part: "C" },
  MODELO_PARTICIPACAO_FAMILIAR: { question: "Como você conduz a presença de acompanhantes?", part: "C" },
  MODELO_PREFERENCIAS_E_RESTRICOES: { question: "Quando a pessoa recusa uma conduta, ou tem uma restrição pessoal, religiosa ou cultural, o que você costuma fazer?", part: "C" },
  FORMACAO_GRADUACAO: { question: "Em qual instituição e ano você se graduou em medicina?", part: "D" },
  FORMACAO_RESIDENCIA: { question: "Quais residências você concluiu (instituição, especialidade, ano)?", part: "D" },
  FORMACAO_ESPECIALIZACAO: { question: "Quais títulos de especialista você possui (entidade, área, ano)?", part: "D" },
  FORMACAO_FELLOWSHIP: { question: "Quais fellowships você realizou (instituição, subárea, ano, país)?", part: "D" },
  FORMACAO_COMPLEMENTAR: { question: "Quais outras formações relevantes você possui (tipo, instituição, ano)?", part: "D" },
  EXPERIENCIA_TEMPO_DE_PRATICA: { question: "Há quanto tempo você atua nesta especialidade?", part: "D" },
  EXPERIENCIA_NO_TIPO_DE_CASO: { question: "Com quais condições e procedimentos você tem prática regular hoje?", part: "D" },
  EXPERIENCIA_VOLUME_DE_ATUACAO: { question: "Com que frequência você atende este tipo de caso?", part: "D" },
  PRATICA_LIMITES_DE_ATUACAO: { question: "Quais situações você não atende — e, nesses casos, o que você faz?", part: "D" },
  HISTORICO_TRAJETORIA_INSTITUCIONAL: { question: "Quais são seus vínculos institucionais, atuais e anteriores?", part: "D" },
  HISTORICO_ATIVIDADE_ACADEMICA: { question: "Qual é a sua atividade acadêmica hoje?", part: "D" },
  HISTORICO_AREAS_DE_ATUACAO: { question: "Quais são suas áreas de atuação hoje, como você as declara?", part: "D" },
  VIABILIDADE_COBERTURA_E_CONVENIO: { question: "Por quais formas de cobertura você atende hoje?", part: "E" },
  VIABILIDADE_CUSTO_E_PAGAMENTO: { question: "Qual o custo da primeira consulta e como pode ser pago?", part: "E" },
};

export const PROFESSIONAL_PROTOCOL: readonly ProfessionalQuestion[] = PRACTICE_CATALOG.map(
  (concept, index) => {
    const texto = PROFESSIONAL_QUESTION_TEXTS[concept.code];
    if (!texto) {
      // Guarda de construção: conceito sem pergunta é catálogo e protocolo
      // divergindo — erro de código, nunca de dado.
      throw new Error(`Conceito sem pergunta no Protocolo do Profissional: ${concept.code}`);
    }
    return { id: `Q${index + 1}`, concept, question: texto.question, part: texto.part };
  },
);

export const PROTOCOL_PARTS: Record<ProfessionalQuestion["part"], string> = {
  A: "Acesso ao cuidado",
  B: "Continuidade do cuidado",
  C: "Modelo de atendimento",
  D: "Prática e trajetória",
  E: "Viabilidade de acesso",
};

export function professionalQuestionsOfPart(part: ProfessionalQuestion["part"]): ProfessionalQuestion[] {
  return PROFESSIONAL_PROTOCOL.filter((q) => q.part === part);
}

// ---------------------------------------------------------------------------
// Validação do lado da pessoa — a porta única do Perfil do Case
// ---------------------------------------------------------------------------

export type PersonNeedInput = {
  subcriterionCode: string;
  options: string[];
  degree: NeedDegree;
  flexibility: string | null;
  guidedText: string | null;
  origin: PersonMode;
  proposedReading: string | null;
};

/** Devolve as recusas — vazia significa aceita. */
export function validatePersonNeed(input: PersonNeedInput): string[] {
  const erros: string[] = [];
  const pergunta = PERSON_QUESTIONS_BY_CODE.get(input.subcriterionCode);

  if (!pergunta) {
    return [`"${input.subcriterionCode}" não tem lado da pessoa no protocolo — os conceitos técnicos não têm pergunta, por definição do Método.`];
  }

  if (input.origin !== pergunta.mode && pergunta.mode === "DECLARACAO_CLINICA") {
    erros.push(`${pergunta.id}: ${input.subcriterionCode} é declaração clínica do Curador — não recebe resposta direta nem tradução.`);
  }
  if (pergunta.mode !== "DECLARACAO_CLINICA" && input.origin === "DECLARACAO_CLINICA") {
    erros.push(`${pergunta.id}: este conceito tem pergunta à pessoa — declaração clínica não o substitui.`);
  }

  if (pergunta.mode === "DECLARACAO_CLINICA") {
    // Projeção clínica: sem opções da pessoa; o grau é a própria declaração.
    if (input.options.length > 0) {
      erros.push(`${pergunta.id}: declaração clínica não seleciona opções da pessoa.`);
    }
  } else {
    if (input.options.length === 0 && !pergunta.allowsGuidedText) {
      erros.push(`${pergunta.id}: nenhuma opção selecionada — silêncio não é dado.`);
    }
    for (const opcao of input.options) {
      if (!(opcao in pergunta.options)) {
        erros.push(`${pergunta.id}: "${opcao}" não é opção canônica desta pergunta.`);
      }
    }
    if (!pergunta.multi && input.options.length > 1) {
      erros.push(`${pergunta.id}: escolha única — ${input.options.length} opções recebidas.`);
    }
  }

  if (input.guidedText && !pergunta.allowsGuidedText) {
    erros.push(`${pergunta.id}: texto guiado só existe em P14 — nos demais, a resposta é estruturada.`);
  }
  if (input.guidedText && input.guidedText.trim().length > 500) {
    erros.push(`${pergunta.id}: texto guiado passa de 500 caracteres.`);
  }

  if (input.origin === "TRADUCAO" && (!input.proposedReading || input.proposedReading.trim() === "")) {
    erros.push(`${pergunta.id}: tradução exige a leitura proposta — "pelo que você me contou, entendi que…".`);
  }
  if (input.origin === "DIRETO" && input.proposedReading) {
    erros.push(`${pergunta.id}: resposta direta não carrega leitura proposta — a fala é dela.`);
  }

  if (!NEED_DEGREES.includes(input.degree)) {
    erros.push(`Grau desconhecido: ${input.degree}.`);
  }
  if (input.flexibility && input.flexibility.trim().length > 280) {
    erros.push(`${pergunta.id}: flexibilidade passa de 280 caracteres.`);
  }
  if (input.flexibility && !pergunta.flexibilityQuestion && pergunta.mode !== "DECLARACAO_CLINICA") {
    erros.push(`${pergunta.id}: este conceito não tem pergunta de flexibilidade no protocolo.`);
  }

  return erros;
}

/**
 * Progresso é contagem — "N de 28" — nunca percentual de qualidade.
 * Quem conta é quem exibe; aqui só existe o que foi respondido.
 */
export function protocolProgress(answeredCodes: readonly string[]): { answered: number; total: number } {
  const validos = new Set(
    answeredCodes.filter((code) => PRACTICE_CONCEPTS_BY_CODE.has(code)),
  );
  return { answered: validos.size, total: PROFESSIONAL_PROTOCOL.length };
}
