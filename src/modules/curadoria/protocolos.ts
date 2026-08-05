/**
 * PROTOCOLOS OFICIAIS — o contrato executável das perguntas.
 *
 * @metodo PROTOCOLO_PESSOA.md — 14 perguntas + 2 declarações clínicas
 *         (+ P17 pela ADR-065 — leitura relacional, Catálogo 1.1.0)
 * @metodo PROTOCOLO_PRATICA_PROFISSIONAL.md — Q1..Q28 (+ Q29 pela ADR-065)
 * @metodo MAPA_DOS_PROTOCOLOS.md / MATRIZ_DE_COBERTURA.md — cobertura por eixo
 * @metodo GRAMATICA_DAS_PERGUNTAS.md — formas, escapes, graus, flexibilidade
 *
 * FONTE ÚNICA (BLOCO E / FRENTE 1): as perguntas e opções canônicas vêm do
 * catálogo GERADO do banco (`catalogo-gerado.ts` ← ADR-046/ADR-047) através
 * de `evidencias-pratica.ts` — nenhuma lista paralela. O texto da pergunta ao
 * profissional é `professional_question`; o da pessoa, `patient_question`; as
 * opções do lado da pessoa, `method_subcriterion_options` com
 * side='paciente'.
 *
 * PENDÊNCIA ENCERRADA PELA DP-3. Havia aqui uma ressalva: para 5 conceitos de
 * TRADUÇÃO (P3–P7), o Catálogo prometia "múltipla escolha + grau" do lado da
 * pessoa e nem o doc nem a migration materializavam a lista — as opções viviam
 * no código, e o gate de paridade comparava com o banco apenas onde o banco
 * materializava. Era a última fonte dupla conhecida.
 *
 * A migration 20260805140000 levou as cinco listas ao banco preservando
 * códigos, rótulos, ordem e multiplicidade. Não há mais lista paralela: as 17
 * perguntas leem do Catálogo, e o gate de paridade cobre todas.
 *
 * Puro e determinístico: sem React, sem banco.
 */

import { CATALOGO_GERADO, type CatalogoConceito } from "./catalogo-gerado";
import {
  PRACTICE_CATALOG,
  PRACTICE_CONCEPTS_BY_CODE,
  type EvidenceAxis,
  type PracticeConcept,
} from "./evidencias-pratica";

const CONCEITOS_GERADOS: ReadonlyMap<string, CatalogoConceito> = new Map(
  CATALOGO_GERADO.filter((entry) => entry.active).map((entry) => [entry.code, entry]),
);

/** As opções do lado da pessoa, como o banco as materializa (código → rótulo). */
function opcoesDaPessoa(code: string): Record<string, string> {
  const conceito = CONCEITOS_GERADOS.get(code);
  const record: Record<string, string> = {};
  for (const campo of conceito?.paciente ?? []) {
    for (const opcao of campo.options) {
      if (opcao.active) record[opcao.value] = opcao.label;
    }
  }
  return record;
}

function perguntaDaPessoa(code: string, fallback: string): string {
  return CONCEITOS_GERADOS.get(code)?.patientQuestion ?? fallback;
}

// ---------------------------------------------------------------------------
// Formas do lado da pessoa
// ---------------------------------------------------------------------------

/** Como a resposta da pessoa nasce — decisão de Método do mapa de perguntas. */
export const PERSON_MODES = ["DIRETO", "TRADUCAO", "DECLARACAO_CLINICA"] as const;
export type PersonMode = (typeof PERSON_MODES)[number];

/**
 * Grau declarado pela pessoa (ou traduzido). Nunca inferido.
 *
 * NENHUM valor daqui pode coincidir com `ImportanceLevel`: são conceitos
 * diferentes — grau é o quanto a PESSOA disse que aquilo pesa para ela;
 * importância é o quanto o CASE declara que o subcritério pesa, e só ela
 * entra no Motor. `PESA_MUITO` se chama assim, e não "IMPORTANTE", porque
 * `IMPORTANTE` é um nível de importância: com o mesmo texto nas duas escalas,
 * a matriz do Motor aceitava um grau como se fosse importância. A guarda
 * `importancia-vs-grau.test.ts` impede que a colisão volte.
 */
export const NEED_DEGREES = ["ESSENCIAL", "PESA_MUITO", "DESEJAVEL", "SEM_PREFERENCIA"] as const;
export type NeedDegree = (typeof NEED_DEGREES)[number];

export const NEED_DEGREE_LABELS: Record<NeedDegree, string> = {
  ESSENCIAL: "Essencial — sem isso o cuidado não acontece",
  PESA_MUITO: "Importante — pesa muito, não impede",
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
  /** A pergunta como o Curador a faz — patient_question do banco. */
  question: string;
  /** Opções canônicas do lado da pessoa (código → rótulo). */
  options: Readonly<Record<string, string>>;
  multi: boolean;
  /** Pergunta de flexibilidade, quando o conceito a tem. */
  flexibilityQuestion: string | null;
  /** Texto guiado permitido? Só onde o protocolo autoriza (P14). */
  allowsGuidedText: boolean;
};

// `SEM_PREFERENCIA` e `NAO_SEI` viviam aqui, compartilhados pelas listas
// provisórias. Saíram com elas: os dois códigos agora são linhas do Catálogo,
// como qualquer outra opção.

// ---------------------------------------------------------------------------
// DP-3 — AQUI VIVIAM AS CINCO LISTAS PROVISÓRIAS.
//
// Eram a última violação conhecida da regra de fonte única: P3–P7 tinham o
// vocabulário do lado da pessoa no CÓDIGO, enquanto P1, P2 e P10–P13 já o liam
// do Catálogo. O gate de paridade comparava os materializados e passava verde
// ignorando estes — uma divergência aqui não tinha como aparecer.
//
// As 22 linhas (21 códigos distintos — `NAO_TENHO_PREFERENCIA` serve a dois
// conceitos) foram para `method_subcriterion_options` pela migration
// 20260805140000, com os mesmos códigos, rótulos, ordem e multiplicidade.
// Daqui em diante as cinco leem por `opcoesDaPessoa`, como todas as outras, e
// a evolução acontece por versionamento do Catálogo — nunca editando código.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// PROTOCOLO DA PESSOA — P1..P17 (P8 e P9 são declarações do Curador;
// P17 instituído pela ADR-065)
// ---------------------------------------------------------------------------

export const PERSON_PROTOCOL: readonly PersonQuestion[] = [
  {
    id: "P1", subcriterionCode: "ACESSO_MODALIDADE", mode: "DIRETO",
    question: perguntaDaPessoa("ACESSO_MODALIDADE", "Como você consegue ser atendida?"),
    options: opcoesDaPessoa("ACESSO_MODALIDADE"),
    multi: false,
    flexibilityQuestion: "Se não houver o formato que você precisa, o outro serve para você eventualmente?",
    allowsGuidedText: false,
  },
  {
    id: "P2", subcriterionCode: "ACESSO_LOCAL_DE_ATENDIMENTO", mode: "TRADUCAO",
    question: perguntaDaPessoa("ACESSO_LOCAL_DE_ATENDIMENTO", "De onde você pode se deslocar, e até onde?"),
    options: opcoesDaPessoa("ACESSO_LOCAL_DE_ATENDIMENTO"),
    multi: false, flexibilityQuestion: null, allowsGuidedText: false,
  },
  {
    id: "P3", subcriterionCode: "ACESSO_DISPONIBILIDADE", mode: "DIRETO",
    question: perguntaDaPessoa("ACESSO_DISPONIBILIDADE", "Quando você consegue ser atendida?"),
    options: opcoesDaPessoa("ACESSO_DISPONIBILIDADE"),
    multi: true,
    flexibilityQuestion: "Você conseguiria faltar ao trabalho ou compromisso para uma consulta?",
    allowsGuidedText: false,
  },
  {
    id: "P4", subcriterionCode: "ACESSO_PRAZO_PARA_CONSULTA", mode: "TRADUCAO",
    question: perguntaDaPessoa("ACESSO_PRAZO_PARA_CONSULTA", "Em quanto tempo você precisa ser atendida?"),
    options: opcoesDaPessoa("ACESSO_PRAZO_PARA_CONSULTA"),
    multi: false, flexibilityQuestion: null, allowsGuidedText: false,
  },
  {
    id: "P5", subcriterionCode: "CONTINUIDADE_RETORNOS", mode: "TRADUCAO",
    question: perguntaDaPessoa(
      "CONTINUIDADE_RETORNOS",
      "Como você gostaria que fosse o acompanhamento depois da primeira consulta?",
    ),
    options: opcoesDaPessoa("CONTINUIDADE_RETORNOS"),
    multi: true, flexibilityQuestion: null, allowsGuidedText: false,
  },
  {
    id: "P6", subcriterionCode: "CONTINUIDADE_CANAIS", mode: "TRADUCAO",
    question: perguntaDaPessoa(
      "CONTINUIDADE_CANAIS",
      "Você precisa conseguir falar com alguém entre as consultas?",
    ),
    options: opcoesDaPessoa("CONTINUIDADE_CANAIS"),
    multi: true, flexibilityQuestion: null, allowsGuidedText: false,
  },
  {
    id: "P7", subcriterionCode: "CONTINUIDADE_COORDENACAO", mode: "TRADUCAO",
    question: perguntaDaPessoa(
      "CONTINUIDADE_COORDENACAO",
      "Você já é acompanhada por outros profissionais que precisariam conversar entre si?",
    ),
    options: opcoesDaPessoa("CONTINUIDADE_COORDENACAO"),
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
    question: perguntaDaPessoa("MODELO_COMUNICACAO", "O que te ajudaria a entender melhor o que for explicado?"),
    options: opcoesDaPessoa("MODELO_COMUNICACAO"),
    multi: true, flexibilityQuestion: null, allowsGuidedText: false,
  },
  {
    id: "P11", subcriterionCode: "MODELO_DECISAO_COMPARTILHADA", mode: "DIRETO",
    question: perguntaDaPessoa(
      "MODELO_DECISAO_COMPARTILHADA",
      "Quando houver mais de um caminho possível, como você gostaria de participar da decisão?",
    ),
    options: opcoesDaPessoa("MODELO_DECISAO_COMPARTILHADA"),
    multi: false, flexibilityQuestion: null, allowsGuidedText: false,
  },
  {
    id: "P12", subcriterionCode: "MODELO_ALTERNATIVAS", mode: "TRADUCAO",
    question: perguntaDaPessoa("MODELO_ALTERNATIVAS", "O que você precisa saber antes de aceitar um tratamento?"),
    options: opcoesDaPessoa("MODELO_ALTERNATIVAS"),
    multi: true, flexibilityQuestion: null, allowsGuidedText: false,
  },
  {
    id: "P13", subcriterionCode: "MODELO_PARTICIPACAO_FAMILIAR", mode: "DIRETO",
    question: perguntaDaPessoa("MODELO_PARTICIPACAO_FAMILIAR", "Você quer que alguém participe das conversas?"),
    options: opcoesDaPessoa("MODELO_PARTICIPACAO_FAMILIAR"),
    multi: false, flexibilityQuestion: null, allowsGuidedText: false,
  },
  {
    id: "P14", subcriterionCode: "MODELO_PREFERENCIAS_E_RESTRICOES", mode: "TRADUCAO",
    question: perguntaDaPessoa(
      "MODELO_PREFERENCIAS_E_RESTRICOES",
      "Existe algo que você não aceita, ou que precisa ser respeitado no seu cuidado?",
    ),
    options: {}, multi: false, flexibilityQuestion: null,
    allowsGuidedText: true, // o ÚNICO texto guiado do protocolo da pessoa
  },
  {
    id: "P15", subcriterionCode: "VIABILIDADE_COBERTURA_E_CONVENIO", mode: "DIRETO",
    question: perguntaDaPessoa("VIABILIDADE_COBERTURA_E_CONVENIO", "Como você pretende usar sua cobertura?"),
    options: opcoesDaPessoa("VIABILIDADE_COBERTURA_E_CONVENIO"),
    multi: true, flexibilityQuestion: null, allowsGuidedText: false,
  },
  {
    id: "P16", subcriterionCode: "VIABILIDADE_CUSTO_E_PAGAMENTO", mode: "DIRETO",
    question: perguntaDaPessoa(
      "VIABILIDADE_CUSTO_E_PAGAMENTO",
      "O que precisa ser verdade para você conseguir pagar?",
    ),
    options: opcoesDaPessoa("VIABILIDADE_CUSTO_E_PAGAMENTO"),
    multi: true, flexibilityQuestion: null, allowsGuidedText: false,
  },
  {
    // ADR-065 — leitura relacional (Catálogo 1.1.0): o único conceito novo do
    // domínio. Cruzamento humano obrigatório; a resposta nunca entra em motor.
    id: "P17", subcriterionCode: "MODELO_CONDUCAO_DE_NOTICIAS_DIFICEIS", mode: "DIRETO",
    question: perguntaDaPessoa(
      "MODELO_CONDUCAO_DE_NOTICIAS_DIFICEIS",
      "Se houver uma notícia difícil, como você prefere recebê-la?",
    ),
    options: opcoesDaPessoa("MODELO_CONDUCAO_DE_NOTICIAS_DIFICEIS"),
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
  /** Identificador estável (Q1..Q28, na ordem canônica do banco). */
  id: string;
  /** O contrato do conceito vem do Catálogo — opções, multi, condição, tier. */
  concept: PracticeConcept;
  /** A pergunta situacional — professional_question do banco. */
  question: string;
  /** Parte do protocolo (A–E), derivada do eixo, para navegação por blocos. */
  part: "A" | "B" | "C" | "D" | "E";
};

const AXIS_PART: Record<EvidenceAxis, ProfessionalQuestion["part"]> = {
  ACESSO_AO_CUIDADO: "A",
  CONTINUIDADE_DO_CUIDADO: "B",
  MODELO_DE_ATENDIMENTO: "C",
  PRATICA_E_TRAJETORIA: "D",
  VIABILIDADE_DE_ACESSO: "E",
};

export const PROFESSIONAL_PROTOCOL: readonly ProfessionalQuestion[] = PRACTICE_CATALOG.map(
  (concept, index) => {
    const doBanco = CONCEITOS_GERADOS.get(concept.code);
    if (!doBanco?.professionalQuestion) {
      // Guarda de construção: conceito sem pergunta é catálogo e protocolo
      // divergindo — erro de código, nunca de dado.
      throw new Error(`Conceito sem pergunta no Protocolo do Profissional: ${concept.code}`);
    }
    return {
      id: `Q${index + 1}`,
      concept,
      question: doBanco.professionalQuestion,
      part: AXIS_PART[concept.axis],
    };
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
