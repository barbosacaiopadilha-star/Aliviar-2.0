/**
 * BASE DE EVIDÊNCIAS DE PRÁTICA — o domínio puro.
 *
 * @metodo Catálogo Canônico 1.0.0 (congelado 2026-07-31) — 28 conceitos
 * @metodo Protocolo da Prática Profissional — Q1..Q28
 * @metodo Gramática das Perguntas — P18 (mais opções ≠ melhor), P20 (resposta
 *         não é evidência verificada), texto livre nunca é conceito
 *
 * Este módulo é a codificação executável do catálogo congelado: os 28
 * conceitos, as opções canônicas de cada um, a validação de uma resposta, a
 * política de validade e a verbalização para o Relatório.
 *
 * O que ele NUNCA faz: pontuar, ordenar, comparar profissionais, interpretar
 * texto livre, ou concluir compatibilidade. Verbalizar é repetir o que foi
 * selecionado — cada palavra da frase rastreia a um rótulo canônico.
 *
 * Puro e determinístico: sem React, sem banco.
 */

import { SOURCE_TIERS, type SourceTier } from "./fontes";

export const PRACTICE_CATALOG_VERSION = "1.0.0";

// ---------------------------------------------------------------------------
// A forma de um conceito
// ---------------------------------------------------------------------------

export const EVIDENCE_AXES = [
  "ACESSO",
  "CONTINUIDADE_DO_CUIDADO",
  "MODELO_DE_ATENDIMENTO",
  "PRATICA_E_TRAJETORIA",
  "VIABILIDADE_DE_ACESSO",
] as const;
export type EvidenceAxis = (typeof EVIDENCE_AXES)[number];

/**
 * CONDUTA: resposta por opções canônicas (Partes A–C e E do Protocolo).
 * FATO_ESTRUTURADO: campos datados sem lista fechada (Parte D — formação,
 * trajetória), onde a resposta vive em `details`.
 */
export type ConceptKind = "CONDUTA" | "FATO_ESTRUTURADO";

/** O papel do conceito perante o Motor — contrato da Matriz de Cobertura. */
export type MotorParticipation = "DIRETO" | "INDIRETO" | "NUNCA";

export type PracticeConcept = {
  code: string;
  name: string;
  axis: EvidenceAxis;
  kind: ConceptKind;
  motor: MotorParticipation;
  /** Múltipla seleção permitida? Marcar mais NUNCA significa melhor (P18). */
  multi: boolean;
  /** Opções canônicas (código → rótulo). Vazio para FATO_ESTRUTURADO. */
  options: Readonly<Record<string, string>>;
  /** Opções que só são válidas acompanhadas de condição estruturada. */
  requireCondition: readonly string[];
  /** Conceitos cuja resposta exige `details` (listas/faixas estruturadas). */
  requireDetails: boolean;
  /** Fonte mínima que sustenta a informação (Política de Fontes). */
  minimumTier: SourceTier;
  /** Meses até a verificação vencer (volatilidade do catálogo congelado). */
  reviewAfterMonths: number;
};

const ESCAPES = {
  NAO_SEI_INFORMAR: "Não sei informar",
  NAO_SE_APLICA: "Não se aplica",
} as const;

function concept(entry: Omit<PracticeConcept, "requireCondition" | "requireDetails" | "multi"> & {
  multi?: boolean;
  requireCondition?: readonly string[];
  requireDetails?: boolean;
}): PracticeConcept {
  return {
    multi: entry.multi ?? true,
    requireCondition: entry.requireCondition ?? [],
    requireDetails: entry.requireDetails ?? false,
    ...entry,
  };
}

// ---------------------------------------------------------------------------
// O Catálogo 1.0.0 — 28 conceitos, na ordem da Matriz de Cobertura
// ---------------------------------------------------------------------------

export const PRACTICE_CATALOG: readonly PracticeConcept[] = [
  // EIXO 1 — ACESSO AO CUIDADO (Q1–Q4)
  concept({
    code: "ACESSO_MODALIDADE", name: "Modalidade de atendimento",
    axis: "ACESSO", kind: "CONDUTA", motor: "DIRETO",
    options: {
      PRESENCIAL: "Atendimento presencial",
      REMOTO: "Atendimento remoto",
      PRIMEIRA_PRESENCIAL_RETORNOS_REMOTOS: "Primeira presencial, retornos remotos",
      PRIMEIRA_REMOTA_CONDICIONADA: "Primeira remota, sob condição",
      HIBRIDO_CONFORME_O_CASO: "Híbrido conforme o caso",
      ...ESCAPES,
    },
    requireCondition: ["PRIMEIRA_REMOTA_CONDICIONADA", "HIBRIDO_CONFORME_O_CASO"],
    minimumTier: "INSTITUCIONAL", reviewAfterMonths: 6,
  }),
  concept({
    code: "ACESSO_LOCAL_DE_ATENDIMENTO", name: "Local de atendimento",
    axis: "ACESSO", kind: "FATO_ESTRUTURADO", motor: "DIRETO",
    options: {}, requireDetails: true,
    minimumTier: "INSTITUCIONAL", reviewAfterMonths: 6,
  }),
  concept({
    code: "ACESSO_DISPONIBILIDADE", name: "Disponibilidade",
    axis: "ACESSO", kind: "CONDUTA", motor: "DIRETO",
    options: {
      MANHA_DIAS_UTEIS: "Manhã em dias úteis",
      TARDE_DIAS_UTEIS: "Tarde em dias úteis",
      NOITE_APOS_18H: "Noite, após as 18h",
      SABADO: "Sábado",
      DOMINGO_OU_FERIADO: "Domingo ou feriado",
      SOB_AGENDAMENTO_ESPECIFICO: "Sob agendamento específico",
      ...ESCAPES,
    },
    requireCondition: ["SOB_AGENDAMENTO_ESPECIFICO"],
    minimumTier: "INSTITUCIONAL", reviewAfterMonths: 3,
  }),
  concept({
    code: "ACESSO_PRAZO_PARA_CONSULTA", name: "Prazo para a primeira consulta",
    axis: "ACESSO", kind: "CONDUTA", motor: "DIRETO", multi: false,
    options: {
      ATE_7_DIAS: "Até 7 dias",
      DE_8_A_15_DIAS: "De 8 a 15 dias",
      DE_16_A_30_DIAS: "De 16 a 30 dias",
      DE_31_A_60_DIAS: "De 31 a 60 dias",
      MAIS_DE_60_DIAS: "Mais de 60 dias",
      VARIA_CONFORME_O_CASO: "Varia conforme o caso",
      ...ESCAPES,
    },
    requireCondition: ["VARIA_CONFORME_O_CASO"],
    minimumTier: "INSTITUCIONAL", reviewAfterMonths: 3,
  }),

  // EIXO 2 — CONTINUIDADE DO CUIDADO (Q5–Q9)
  concept({
    code: "CONTINUIDADE_RETORNOS", name: "Retornos",
    axis: "CONTINUIDADE_DO_CUIDADO", kind: "CONDUTA", motor: "DIRETO",
    options: {
      RETORNO_PROGRAMADO_NA_PROPRIA_CONSULTA: "Retorno programado na própria consulta",
      RETORNO_CONFORME_EVOLUCAO: "Retorno conforme evolução",
      RETORNO_APENAS_SE_SOLICITADO: "Retorno apenas se solicitado",
      ENVIA_ORIENTACAO_ESCRITA: "Envia orientação escrita",
      REAVALIA_EXAMES_ENTRE_CONSULTAS: "Reavalia exames entre consultas",
      ...ESCAPES,
    },
    minimumTier: "INSTITUCIONAL", reviewAfterMonths: 12,
  }),
  concept({
    code: "CONTINUIDADE_CANAIS", name: "Canais entre consultas",
    axis: "CONTINUIDADE_DO_CUIDADO", kind: "CONDUTA", motor: "DIRETO",
    options: {
      MENSAGEM_DIRETA_COM_O_PROFISSIONAL: "Mensagem direta com o profissional",
      MENSAGEM_COM_EQUIPE_OU_SECRETARIA: "Mensagem com a equipe ou secretaria",
      TELEFONE_HORARIO_COMERCIAL: "Telefone em horário comercial",
      PORTAL_OU_APLICATIVO: "Portal ou aplicativo",
      CONTATO_DE_URGENCIA_FORA_DO_HORARIO: "Contato de urgência fora do horário",
      APENAS_REAGENDAMENTO: "Apenas reagendamento",
      NAO_HA_CANAL_ENTRE_CONSULTAS: "Não há canal entre consultas",
      ...ESCAPES,
    },
    minimumTier: "INSTITUCIONAL", reviewAfterMonths: 6,
  }),
  concept({
    code: "CONTINUIDADE_POS_PROCEDIMENTO", name: "Acompanhamento pós-procedimento",
    axis: "CONTINUIDADE_DO_CUIDADO", kind: "CONDUTA", motor: "INDIRETO",
    options: {
      ACOMPANHA_PESSOALMENTE_TODO_O_POS: "Acompanha pessoalmente todo o pós",
      ACOMPANHA_COM_EQUIPE: "Acompanha com a equipe",
      ACOMPANHA_ATE_ALTA_E_ENCAMINHA: "Acompanha até a alta e encaminha",
      ENCAMINHA_PARA_OUTRO_PROFISSIONAL: "Encaminha para outro profissional",
      NAO_REALIZA_PROCEDIMENTOS: "Não realiza procedimentos",
      ...ESCAPES,
    },
    minimumTier: "INSTITUCIONAL", reviewAfterMonths: 12,
  }),
  concept({
    code: "CONTINUIDADE_EQUIPE_DE_APOIO", name: "Equipe de apoio",
    axis: "CONTINUIDADE_DO_CUIDADO", kind: "CONDUTA", motor: "DIRETO",
    options: {
      ENFERMAGEM: "Enfermagem",
      SECRETARIA_CLINICA: "Secretaria clínica",
      NUTRICAO: "Nutrição",
      PSICOLOGIA: "Psicologia",
      FISIOTERAPIA: "Fisioterapia",
      SERVICO_SOCIAL: "Serviço social",
      OUTRO_PROFISSIONAL_DA_EQUIPE: "Outro profissional da equipe",
      ATUA_SEM_EQUIPE_FIXA: "Atua sem equipe fixa",
      ...ESCAPES,
    },
    minimumTier: "INSTITUCIONAL", reviewAfterMonths: 12,
  }),
  concept({
    code: "CONTINUIDADE_COORDENACAO", name: "Coordenação com outros profissionais",
    axis: "CONTINUIDADE_DO_CUIDADO", kind: "CONDUTA", motor: "DIRETO",
    options: {
      CONTATA_DIRETAMENTE_O_OUTRO_PROFISSIONAL: "Contata diretamente o outro profissional",
      ENVIA_RELATORIO_ESCRITO: "Envia relatório escrito",
      PARTICIPA_DE_DISCUSSAO_DE_CASO: "Participa de discussão de caso",
      ORIENTA_A_PESSOA_A_LEVAR_INFORMACAO: "Orienta a pessoa a levar a informação",
      ATUA_DE_FORMA_INDEPENDENTE: "Atua de forma independente",
      ...ESCAPES,
    },
    minimumTier: "INSTITUCIONAL", reviewAfterMonths: 12,
  }),

  // EIXO 3 — MODELO DE ATENDIMENTO (Q10–Q14)
  concept({
    code: "MODELO_COMUNICACAO", name: "Como explica",
    axis: "MODELO_DE_ATENDIMENTO", kind: "CONDUTA", motor: "DIRETO",
    options: {
      ADAPTA_A_LINGUAGEM_AO_INTERLOCUTOR: "Adapta a linguagem ao interlocutor",
      VERIFICA_SE_A_PESSOA_COMPREENDEU: "Verifica se a pessoa compreendeu",
      REEXPLICA_DE_OUTRA_FORMA_QUANDO_NECESSARIO: "Reexplica de outra forma quando necessário",
      USA_APOIO_VISUAL_OU_DESENHO: "Usa apoio visual ou desenho",
      ENVIA_RESUMO_ESCRITO: "Envia resumo escrito",
      RESERVA_TEMPO_PARA_PERGUNTAS: "Reserva tempo para perguntas",
      AUTORIZA_GRAVACAO_DA_CONSULTA: "Autoriza gravação da consulta",
      ...ESCAPES,
    },
    minimumTier: "INSTITUCIONAL", reviewAfterMonths: 12,
  }),
  concept({
    code: "MODELO_DECISAO_COMPARTILHADA", name: "Como conduz decisões",
    axis: "MODELO_DE_ATENDIMENTO", kind: "CONDUTA", motor: "INDIRETO",
    options: {
      APRESENTA_TODAS_AS_OPCOES_ADEQUADAS: "Apresenta todas as opções adequadas",
      EXPLICA_RISCOS_E_BENEFICIOS_DE_CADA_UMA: "Explica riscos e benefícios de cada uma",
      PERGUNTA_O_QUE_IMPORTA_PARA_A_PESSOA: "Pergunta o que importa para a pessoa",
      OFERECE_TEMPO_PARA_DECIDIR: "Oferece tempo para decidir",
      SUGERE_SEGUNDA_OPINIAO_QUANDO_PERTINENTE: "Sugere segunda opinião quando pertinente",
      RECOMENDA_UMA_OPCAO_E_EXPLICA_O_PORQUE: "Recomenda uma opção e explica o porquê",
      DECIDE_E_COMUNICA_A_CONDUTA: "Decide e comunica a conduta",
      ...ESCAPES,
    },
    minimumTier: "INSTITUCIONAL", reviewAfterMonths: 12,
  }),
  concept({
    code: "MODELO_ALTERNATIVAS", name: "Explicação de alternativas",
    axis: "MODELO_DE_ATENDIMENTO", kind: "CONDUTA", motor: "DIRETO",
    options: {
      OPCOES_DE_TRATAMENTO_DISPONIVEIS: "Opções de tratamento disponíveis",
      OPCAO_DE_ACOMPANHAR_SEM_INTERVIR: "Opção de acompanhar sem intervir",
      RISCOS_DE_CADA_CAMINHO: "Riscos de cada caminho",
      O_QUE_ACONTECE_SE_NADA_FOR_FEITO: "O que acontece se nada for feito",
      LIMITES_DO_QUE_SE_SABE_HOJE: "Limites do que se sabe hoje",
      CUSTO_E_COBERTURA_DE_CADA_OPCAO: "Custo e cobertura de cada opção",
      ...ESCAPES,
    },
    minimumTier: "INSTITUCIONAL", reviewAfterMonths: 12,
  }),
  concept({
    code: "MODELO_PARTICIPACAO_FAMILIAR", name: "Participação de acompanhantes",
    axis: "MODELO_DE_ATENDIMENTO", kind: "CONDUTA", motor: "DIRETO",
    options: {
      ACOMPANHANTE_BEM_VINDO_SEMPRE: "Acompanhante bem-vindo sempre",
      ACOMPANHANTE_MEDIANTE_AUTORIZACAO_DA_PESSOA: "Acompanhante mediante autorização da pessoa",
      PARTE_DA_CONSULTA_A_SOS: "Parte da consulta a sós",
      CONTATO_COM_FAMILIA_ENTRE_CONSULTAS_SE_AUTORIZADO: "Contato com a família entre consultas, se autorizado",
      ATENDIMENTO_APENAS_INDIVIDUAL: "Atendimento apenas individual",
      ...ESCAPES,
    },
    minimumTier: "INSTITUCIONAL", reviewAfterMonths: 12,
  }),
  concept({
    code: "MODELO_PREFERENCIAS_E_RESTRICOES", name: "Respeito a recusas e restrições",
    axis: "MODELO_DE_ATENDIMENTO", kind: "CONDUTA", motor: "NUNCA",
    options: {
      REGISTRA_A_RESTRICAO_NO_PRONTUARIO: "Registra a restrição no prontuário",
      BUSCA_ALTERNATIVA_COMPATIVEL: "Busca alternativa compatível",
      EXPLICA_CONSEQUENCIAS_E_MANTEM_ACOMPANHAMENTO: "Explica consequências e mantém o acompanhamento",
      ENCAMINHA_QUANDO_NAO_PODE_ATENDER: "Encaminha quando não pode atender à restrição",
      NAO_ACOMPANHA_QUEM_RECUSA_A_CONDUTA_INDICADA: "Não acompanha quem recusa a conduta indicada",
      ...ESCAPES,
    },
    minimumTier: "INSTITUCIONAL", reviewAfterMonths: 12,
  }),

  // EIXO 4 — PRÁTICA E TRAJETÓRIA (Q15–Q26) — fatos com proveniência
  concept({ code: "FORMACAO_GRADUACAO", name: "Graduação", axis: "PRATICA_E_TRAJETORIA", kind: "FATO_ESTRUTURADO", motor: "INDIRETO", options: {}, requireDetails: true, minimumTier: "OFICIAL_PRIMARIA", reviewAfterMonths: 60 }),
  concept({ code: "FORMACAO_RESIDENCIA", name: "Residência médica", axis: "PRATICA_E_TRAJETORIA", kind: "FATO_ESTRUTURADO", motor: "INDIRETO", options: {}, requireDetails: true, minimumTier: "OFICIAL_PRIMARIA", reviewAfterMonths: 60 }),
  concept({ code: "FORMACAO_ESPECIALIZACAO", name: "Especialização", axis: "PRATICA_E_TRAJETORIA", kind: "FATO_ESTRUTURADO", motor: "INDIRETO", options: {}, requireDetails: true, minimumTier: "OFICIAL_PRIMARIA", reviewAfterMonths: 36 }),
  concept({ code: "FORMACAO_FELLOWSHIP", name: "Fellowship", axis: "PRATICA_E_TRAJETORIA", kind: "FATO_ESTRUTURADO", motor: "INDIRETO", options: {}, requireDetails: true, minimumTier: "OFICIAL_PRIMARIA", reviewAfterMonths: 60 }),
  concept({ code: "FORMACAO_COMPLEMENTAR", name: "Formação complementar", axis: "PRATICA_E_TRAJETORIA", kind: "FATO_ESTRUTURADO", motor: "INDIRETO", options: {}, requireDetails: true, minimumTier: "INSTITUCIONAL", reviewAfterMonths: 36 }),
  concept({
    code: "EXPERIENCIA_TEMPO_DE_PRATICA", name: "Tempo de prática",
    axis: "PRATICA_E_TRAJETORIA", kind: "CONDUTA", motor: "INDIRETO", multi: false,
    options: { ATE_2_ANOS: "Até 2 anos", DE_3_A_5_ANOS: "De 3 a 5 anos", DE_6_A_10_ANOS: "De 6 a 10 anos", DE_11_A_20_ANOS: "De 11 a 20 anos", MAIS_DE_20_ANOS: "Mais de 20 anos", ...ESCAPES },
    minimumTier: "INSTITUCIONAL", reviewAfterMonths: 12,
  }),
  concept({ code: "EXPERIENCIA_NO_TIPO_DE_CASO", name: "Experiência no tipo de caso", axis: "PRATICA_E_TRAJETORIA", kind: "FATO_ESTRUTURADO", motor: "INDIRETO", options: {}, requireDetails: true, minimumTier: "INSTITUCIONAL", reviewAfterMonths: 12 }),
  concept({
    code: "EXPERIENCIA_VOLUME_DE_ATUACAO", name: "Volume de atuação",
    axis: "PRATICA_E_TRAJETORIA", kind: "CONDUTA", motor: "INDIRETO", multi: false,
    options: { SEMANALMENTE: "Semanalmente", MENSALMENTE: "Mensalmente", ALGUMAS_VEZES_AO_ANO: "Algumas vezes ao ano", RARAMENTE: "Raramente", ...ESCAPES },
    minimumTier: "INSTITUCIONAL", reviewAfterMonths: 12,
  }),
  concept({
    code: "PRATICA_LIMITES_DE_ATUACAO", name: "Limites de atuação",
    axis: "PRATICA_E_TRAJETORIA", kind: "CONDUTA", motor: "INDIRETO", requireDetails: true,
    options: { ENCAMINHA_COM_INDICACAO: "Encaminha com indicação", ENCAMINHA_SEM_INDICACAO: "Encaminha sem indicação", ...ESCAPES },
    minimumTier: "INSTITUCIONAL", reviewAfterMonths: 12,
  }),
  concept({ code: "HISTORICO_TRAJETORIA_INSTITUCIONAL", name: "Trajetória institucional", axis: "PRATICA_E_TRAJETORIA", kind: "FATO_ESTRUTURADO", motor: "INDIRETO", options: {}, requireDetails: true, minimumTier: "OFICIAL_PRIMARIA", reviewAfterMonths: 12 }),
  concept({
    code: "HISTORICO_ATIVIDADE_ACADEMICA", name: "Atividade acadêmica",
    axis: "PRATICA_E_TRAJETORIA", kind: "CONDUTA", motor: "INDIRETO",
    options: { PUBLICA_REGULARMENTE: "Publica regularmente", PUBLICOU_NO_PASSADO: "Publicou no passado", LECIONA: "Leciona", ORIENTA_RESIDENTES: "Orienta residentes", SEM_ATIVIDADE_ACADEMICA: "Sem atividade acadêmica", ...ESCAPES },
    minimumTier: "PUBLICA_SECUNDARIA", reviewAfterMonths: 24,
  }),
  concept({ code: "HISTORICO_AREAS_DE_ATUACAO", name: "Áreas de atuação", axis: "PRATICA_E_TRAJETORIA", kind: "FATO_ESTRUTURADO", motor: "INDIRETO", options: {}, requireDetails: true, minimumTier: "INSTITUCIONAL", reviewAfterMonths: 12 }),

  // EIXO 5 — VIABILIDADE DE ACESSO (Q27–Q28) — NUNCA no Motor
  concept({
    code: "VIABILIDADE_COBERTURA_E_CONVENIO", name: "Cobertura e convênio",
    axis: "VIABILIDADE_DE_ACESSO", kind: "CONDUTA", motor: "NUNCA",
    options: {
      EXCLUSIVAMENTE_PARTICULAR: "Exclusivamente particular",
      CONVENIOS_SELECIONADOS: "Convênios selecionados",
      EMITE_DOCUMENTACAO_PARA_REEMBOLSO: "Emite documentação para reembolso",
      NAO_EMITE_DOCUMENTACAO_PARA_REEMBOLSO: "Não emite documentação para reembolso",
      SUJEITO_A_CONFIRMACAO_ADMINISTRATIVA: "Sujeito a confirmação administrativa",
      NAO_INFORMADO_PELO_PROFISSIONAL: "Não informado",
      ...ESCAPES,
    },
    requireCondition: ["SUJEITO_A_CONFIRMACAO_ADMINISTRATIVA"],
    // CONVENIOS_SELECIONADOS exige a lista de operadoras em details — regra
    // dura do contrato: "aceita convênio" sem dizer qual não é informação.
    minimumTier: "INSTITUCIONAL", reviewAfterMonths: 3,
  }),
  concept({
    code: "VIABILIDADE_CUSTO_E_PAGAMENTO", name: "Custo e pagamento",
    axis: "VIABILIDADE_DE_ACESSO", kind: "CONDUTA", motor: "NUNCA",
    options: {
      FAIXA_ATE_300: "Primeira consulta até R$ 300",
      FAIXA_301_A_600: "Primeira consulta de R$ 301 a R$ 600",
      FAIXA_601_A_1000: "Primeira consulta de R$ 601 a R$ 1.000",
      FAIXA_1001_A_2000: "Primeira consulta de R$ 1.001 a R$ 2.000",
      FAIXA_ACIMA_DE_2000: "Primeira consulta acima de R$ 2.000",
      VALOR_SUJEITO_A_CONFIRMACAO: "Valor sujeito a confirmação",
      DINHEIRO_OU_PIX: "Dinheiro ou PIX",
      CARTAO_A_VISTA: "Cartão à vista",
      CARTAO_PARCELADO: "Cartão parcelado",
      TRANSFERENCIA: "Transferência",
      BOLETO: "Boleto",
      EXAMES_NAO_INCLUSOS: "Exames não inclusos",
      RETORNO_COBRADO_A_PARTE: "Retorno cobrado à parte",
      TAXA_DE_PROCEDIMENTO: "Taxa de procedimento",
      SEM_CUSTOS_ADICIONAIS_CONHECIDOS: "Sem custos adicionais conhecidos",
      NAO_INFORMADO_PELO_PROFISSIONAL: "Não informado",
      ...ESCAPES,
    },
    requireCondition: ["VALOR_SUJEITO_A_CONFIRMACAO"],
    minimumTier: "INSTITUCIONAL", reviewAfterMonths: 3,
  }),
] as const;

export const PRACTICE_CONCEPTS_BY_CODE: ReadonlyMap<string, PracticeConcept> = new Map(
  PRACTICE_CATALOG.map((entry) => [entry.code, entry]),
);

export function isPracticeConceptCode(code: string): boolean {
  return PRACTICE_CONCEPTS_BY_CODE.has(code);
}

// ---------------------------------------------------------------------------
// Validação de uma resposta — a porta única do domínio
// ---------------------------------------------------------------------------

const TIER_RANK: Record<SourceTier, number> = {
  INADEQUADA: 0,
  PUBLICA_SECUNDARIA: 1,
  INSTITUCIONAL: 2,
  OFICIAL_PRIMARIA: 3,
};

export type PracticeEvidenceInput = {
  subcriterionCode: string;
  options: string[];
  details: Record<string, unknown>;
  conditionNote: string | null;
  observation: string | null;
  sourceTier: SourceTier;
  source: string;
};

/** Devolve a lista de recusas — vazia significa aceita. */
export function validatePracticeEvidence(input: PracticeEvidenceInput): string[] {
  const erros: string[] = [];
  const conceito = PRACTICE_CONCEPTS_BY_CODE.get(input.subcriterionCode);

  if (!conceito) {
    return [`"${input.subcriterionCode}" não é um conceito do Catálogo Canônico ${PRACTICE_CATALOG_VERSION}.`];
  }

  if (conceito.kind === "CONDUTA") {
    if (input.options.length === 0) {
      erros.push(`${conceito.code}: nenhuma opção selecionada — ausência de resposta não é resposta.`);
    }
    for (const opcao of input.options) {
      if (!(opcao in conceito.options)) {
        erros.push(`${conceito.code}: "${opcao}" não é opção canônica deste conceito.`);
      }
    }
    if (!conceito.multi && input.options.length > 1) {
      erros.push(`${conceito.code}: escolha única — ${input.options.length} opções recebidas.`);
    }
    const exigemCondicao = input.options.filter((opcao) => conceito.requireCondition.includes(opcao));
    if (exigemCondicao.length > 0 && (!input.conditionNote || input.conditionNote.trim() === "")) {
      erros.push(
        `${conceito.code}: ${exigemCondicao.join(", ")} exige condição estruturada — "depende" sem dizer de quê não é informação.`,
      );
    }
  } else {
    if (input.options.length > 0) {
      erros.push(`${conceito.code}: fato estruturado não usa opções — a resposta vive nos campos estruturados.`);
    }
  }

  if (conceito.requireDetails && Object.keys(input.details).length === 0) {
    erros.push(`${conceito.code}: exige campos estruturados (details) — resposta vazia não entra.`);
  }

  // Regra dura do contrato de viabilidade: convênio sem operadoras é inválido.
  if (
    conceito.code === "VIABILIDADE_COBERTURA_E_CONVENIO" &&
    input.options.includes("CONVENIOS_SELECIONADOS")
  ) {
    const operadoras = input.details["operadoras"];
    if (!Array.isArray(operadoras) || operadoras.length === 0) {
      erros.push(
        "VIABILIDADE_COBERTURA_E_CONVENIO: CONVENIOS_SELECIONADOS exige a lista de operadoras — \"aceita convênio\" sem dizer qual é a aparência de informação, não informação.",
      );
    }
  }

  // Na COLETA, só a fonte inadequada é recusada: uma autodeclaração entra
  // como declarada, e é exatamente isso que ela é. A fonte mínima do conceito
  // é exigida na VERIFICAÇÃO — "encontrar uma informação não é o mesmo que
  // verificá-la" (Política de Fontes).
  if (!SOURCE_TIERS.includes(input.sourceTier)) {
    erros.push(`Fonte de nível desconhecido: ${input.sourceTier}.`);
  } else if (input.sourceTier === "INADEQUADA") {
    erros.push(`${conceito.code}: fonte inadequada não entra nem como declaração.`);
  }

  if (input.source.trim() === "") erros.push("Fonte da coleta é obrigatória.");
  if (input.observation && input.observation.trim().length > 280) {
    erros.push("Observação passa de 280 caracteres — é apoio à leitura, não laudo.");
  }

  return erros;
}

// ---------------------------------------------------------------------------
// Estado da informação e validade
// ---------------------------------------------------------------------------

/** Os estados persistidos são os do enum vigente da Política de Fontes. */
export const EVIDENCE_STATUS_LABELS: Record<string, string> = {
  nao_verificado: "Declarado, ainda não verificado",
  verificado: "Verificado",
  divergente: "Divergente",
  nao_localizado: "Não localizado",
  desatualizado: "Desatualizado",
};

/**
 * A fonte da VERIFICAÇÃO precisa sustentar o conceito — é aqui que o mínimo
 * da Política de Fontes vale. Devolve a recusa, ou null quando sustenta.
 */
export function verificationTierRejection(
  subcriterionCode: string,
  tier: SourceTier,
): string | null {
  const conceito = PRACTICE_CONCEPTS_BY_CODE.get(subcriterionCode);
  if (!conceito) return `Conceito desconhecido: ${subcriterionCode}.`;
  if (TIER_RANK[tier] < TIER_RANK[conceito.minimumTier]) {
    return `${conceito.code}: fonte ${tier} não sustenta verificação — mínimo ${conceito.minimumTier}.`;
  }
  return null;
}

/**
 * "Revisão pendente" não é estado gravado — é derivação: evidência verificada
 * cuja verificação venceu pela política de volatilidade do conceito.
 */
export function evidenceReviewIsDue(
  subcriterionCode: string,
  referenceIso: string | null,
  nowIso: string,
): boolean {
  const conceito = PRACTICE_CONCEPTS_BY_CODE.get(subcriterionCode);
  if (!conceito || !referenceIso) return false;
  const referencia = new Date(referenceIso);
  const limite = new Date(referencia);
  limite.setMonth(limite.getMonth() + conceito.reviewAfterMonths);
  return new Date(nowIso) >= limite;
}

// ---------------------------------------------------------------------------
// Validade — derivada da política do conceito, nunca gravada como verdade
// ---------------------------------------------------------------------------

export const EVIDENCE_VALIDITIES = [
  "VALIDO",
  "PROXIMO_DO_VENCIMENTO",
  "VENCIDO",
  "SEM_DATA",
] as const;
export type EvidenceValidity = (typeof EVIDENCE_VALIDITIES)[number];

export const EVIDENCE_VALIDITY_LABELS: Record<EvidenceValidity, string> = {
  VALIDO: "Verificação dentro da validade",
  PROXIMO_DO_VENCIMENTO: "Verificação próxima do vencimento",
  VENCIDO: "Verificação vencida",
  SEM_DATA: "Sem data suficiente para avaliar",
};

/**
 * Classifica a validade da VERIFICAÇÃO — não do fato. Evidência não
 * verificada não tem validade a vencer: fica `SEM_DATA`, que é a verdade.
 * "Próximo do vencimento" = últimos 20% da janela do conceito. Tudo derivado;
 * nada disso é gravado (Etapa 8 — vencido calculável não vira coluna).
 */
export function classifyEvidenceValidity(
  subcriterionCode: string,
  status: string,
  verifiedAtIso: string | null,
  nowIso: string,
): EvidenceValidity {
  const conceito = PRACTICE_CONCEPTS_BY_CODE.get(subcriterionCode);
  if (!conceito || status !== "verificado" || !verifiedAtIso) return "SEM_DATA";

  const verificada = new Date(verifiedAtIso).getTime();
  const vencimento = new Date(verifiedAtIso);
  vencimento.setMonth(vencimento.getMonth() + conceito.reviewAfterMonths);

  const agora = new Date(nowIso).getTime();
  if (agora >= vencimento.getTime()) return "VENCIDO";

  const janela = vencimento.getTime() - verificada;
  return agora >= verificada + janela * 0.8 ? "PROXIMO_DO_VENCIMENTO" : "VALIDO";
}

/**
 * A frase OPERACIONAL — descreve o estado da informação, jamais a qualidade
 * do profissional (Etapa 11). Determinística, uma por estado, e a de
 * "vencida" só existe porque a validade derivada o disse.
 */
export function operationalPhrase(evidence: {
  subcriterionCode: string;
  status: string;
  verifiedAt: string | null;
}, nowIso: string): string {
  if (evidence.status === "divergente") {
    return "A informação declarada diverge da fonte consultada. A análise permanece pendente.";
  }
  if (evidence.status === "desatualizado") {
    return "Esta informação foi marcada como desatualizada pela operação e aguarda atualização.";
  }
  if (evidence.status === "nao_localizado") {
    return "A informação não foi localizada na fonte consultada.";
  }
  if (evidence.status === "verificado") {
    const validade = classifyEvidenceValidity(
      evidence.subcriterionCode,
      evidence.status,
      evidence.verifiedAt,
      nowIso,
    );
    if (validade === "VENCIDO") {
      return "A última verificação desta informação está vencida e precisa ser atualizada.";
    }
    return `Informação verificada em ${evidence.verifiedAt!.slice(0, 10)}, com base em fonte registrada pela operação.`;
  }
  return "Informação declarada pelo profissional, ainda não verificada pela operação.";
}

// ---------------------------------------------------------------------------
// Verbalização — repetir o que foi selecionado, nada além
// ---------------------------------------------------------------------------

export type EvidenceProvenanceRef = {
  sourceType: "evidencia_de_pratica";
  subcriterion: string;
  status: string;
  verifiedAt: string | null;
};

export type EvidenceForVerbalization = {
  subcriterionCode: string;
  options: string[];
  details: Record<string, unknown>;
  conditionNote: string | null;
  status: string;
  verifiedAt: string | null;
};

function stateSuffix(evidence: EvidenceForVerbalization): string {
  if (evidence.status === "verificado" && evidence.verifiedAt) {
    return ` (verificado em ${evidence.verifiedAt.slice(0, 10)})`;
  }
  const label = EVIDENCE_STATUS_LABELS[evidence.status];
  return label && evidence.status !== "verificado" ? ` (${label.toLowerCase()})` : "";
}

/**
 * A frase é verbalização fiel: rótulos canônicos unidos por conectores fixos.
 * Nenhum adjetivo, nenhuma contagem, nenhuma comparação, nenhuma inferência.
 * Frase que não consegue rastrear um termo a uma opção não é gerada (null).
 */
export function verbalizePracticeEvidence(
  evidence: EvidenceForVerbalization,
): { text: string; ref: EvidenceProvenanceRef } | null {
  const conceito = PRACTICE_CONCEPTS_BY_CODE.get(evidence.subcriterionCode);
  if (!conceito) return null;

  // Contrato da Matriz de Cobertura: MODELO_PREFERENCIAS_E_RESTRICOES não tem
  // frase; viabilidade só fala com validação do Curador — aqui, nunca.
  if (conceito.code === "MODELO_PREFERENCIAS_E_RESTRICOES") return null;
  if (conceito.axis === "VIABILIDADE_DE_ACESSO") return null;

  let corpo: string;
  if (conceito.kind === "CONDUTA") {
    const rotulos = evidence.options
      .map((opcao) => conceito.options[opcao])
      .filter((rotulo): rotulo is string => Boolean(rotulo));
    if (rotulos.length === 0 || rotulos.length !== evidence.options.length) return null;
    corpo = rotulos.join(" · ");
  } else {
    const pares = Object.entries(evidence.details)
      .filter(([, valor]) => typeof valor === "string" || typeof valor === "number")
      .map(([campo, valor]) => `${campo}: ${valor}`);
    if (pares.length === 0) return null;
    corpo = pares.join("; ");
  }

  const condicao = evidence.conditionNote ? ` — condição: ${evidence.conditionNote}` : "";

  return {
    text: `${conceito.name} — prática registrada: ${corpo}${condicao}${stateSuffix(evidence)}.`,
    ref: {
      sourceType: "evidencia_de_pratica",
      subcriterion: conceito.code,
      status: evidence.status,
      verifiedAt: evidence.verifiedAt,
    },
  };
}
