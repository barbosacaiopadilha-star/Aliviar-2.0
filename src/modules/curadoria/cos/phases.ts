/**
 * Curator Operating System — definição canônica das nove fases.
 *
 * Cada fase declara objetivo, critérios de entrada e saída, informações
 * obrigatórias e opcionais, artefatos produzidos, estados, validações, alertas,
 * exceções e rastreabilidade. Nada aqui é regra nova: cada linha aponta para o
 * documento que já a definiu.
 *
 * As nove fases são o **trabalho operacional**; as sete etapas do raciocínio
 * (Fundamentos §5.2) são o **pensamento**. Uma fase sempre declara a qual etapa
 * do raciocínio pertence — é assim que o COS permanece ancorado no Método em
 * vez de virar um fluxo paralelo.
 */

import type { CuradoriaStep } from "../types";
import { COS_PHASE_LABELS, type CosPhaseId, type CuradoriaRecord } from "./types";

export type MethodCitation = {
  source: "Fundamentos" | "Ontologia" | "Experience" | "Engine";
  section: string;
  rule: string;
};

export type PhaseCriterion = {
  id: string;
  description: string;
  /** Avaliado sobre a Memória da Curadoria. Puro, determinístico. */
  isMet: (record: CuradoriaRecord) => boolean;
};

export type CosPhaseDefinition = {
  id: CosPhaseId;
  order: number;
  label: string;
  objective: string;
  /** Qual etapa do raciocínio esta fase materializa. */
  reasoningStep: CuradoriaStep;
  entryCriteria: PhaseCriterion[];
  exitCriteria: PhaseCriterion[];
  requiredInformation: string[];
  optionalInformation: string[];
  artifacts: string[];
  states: string[];
  validations: string[];
  alerts: string[];
  exceptions: string[];
  traceability: MethodCitation[];
};

const always: PhaseCriterion = {
  id: "sempre",
  description: "Nenhuma pré-condição — é a primeira fase.",
  isMet: () => true,
};

function totalWeight(record: CuradoriaRecord): number {
  return record.prioridades.weights.reduce((sum, weight) => sum + weight.weight, 0);
}

export const COS_PHASE_DEFINITIONS: Record<CosPhaseId, CosPhaseDefinition> = {
  // -------------------------------------------------------------------------
  ACOLHIMENTO: {
    id: "ACOLHIMENTO",
    order: 1,
    label: COS_PHASE_LABELS.ACOLHIMENTO,
    objective:
      "Preparar o início da Curadoria. O Curador chega à conversa sabendo o que já se sabe — o paciente nunca recomeça do zero.",
    reasoningStep: "COMPREENDER",
    entryCriteria: [always],
    exitCriteria: [
      {
        id: "contexto-lido",
        description: "O Curador revisou o que já se sabe sobre o paciente.",
        isMet: (record) => record.acolhimento.contextReviewed,
      },
      {
        id: "documentos-revisados",
        description: "Os documentos disponíveis foram revisados.",
        isMet: (record) => record.acolhimento.documentsReviewed,
      },
    ],
    requiredInformation: ["Contexto já conhecido", "Documentos disponíveis"],
    optionalInformation: ["Data e hora da Consulta Inicial", "Pendências operacionais em aberto"],
    artifacts: [],
    states: ["Pendente", "Preparado"],
    validations: ["Nunca iniciar uma Consulta Inicial sem contexto revisado."],
    alerts: [],
    exceptions: [],
    traceability: [
      {
        source: "Experience",
        section: "§2.2",
        rule: "O paciente nunca precisa recontar o básico do zero — o Curador começa demonstrando que leu.",
      },
      {
        source: "Experience",
        section: "§3",
        rule: "Copiloto antecipa, não interroga.",
      },
    ],
  },

  // -------------------------------------------------------------------------
  HISTORIA: {
    id: "HISTORIA",
    order: 2,
    label: COS_PHASE_LABELS.HISTORIA,
    objective:
      "Ouvir a história inteira antes de organizar qualquer coisa, e devolvê-la organizada até o paciente reconhecer: “é exatamente isso”.",
    reasoningStep: "COMPREENDER",
    entryCriteria: [
      {
        id: "acolhimento-concluido",
        description: "O Acolhimento foi concluído.",
        isMet: (record) => record.acolhimento.contextReviewed && record.acolhimento.documentsReviewed,
      },
    ],
    exitCriteria: [
      {
        id: "narrativa-registrada",
        description: "Registrar a narrativa do paciente.",
        isMet: (record) => Boolean(record.historia.narrative?.trim()),
      },
      {
        id: "compreensao-confirmada",
        description: "A devolução foi feita e o paciente reconheceu a própria história.",
        isMet: (record) => Boolean(record.historia.understandingConfirmedAt),
      },
    ],
    requiredInformation: ["Narrativa do paciente", "Confirmação de compreensão"],
    optionalInformation: ["O que motivou a busca, nas palavras dele"],
    artifacts: ["História registrada"],
    states: ["Não iniciada", "Em escuta", "Devolvida", "Confirmada"],
    validations: [
      "Nenhuma informação é inferida — tudo vem do que foi dito.",
      "A confirmação de compreensão é um momento da conversa, nunca um checkbox isolado.",
    ],
    alerts: [],
    exceptions: [],
    traceability: [
      {
        source: "Fundamentos",
        section: "§5.2",
        rule: "Compreender: ouvir a história inteira, sem organizar nada ainda.",
      },
      {
        source: "Experience",
        section: "§2.2",
        rule: "O momento “é exatamente isso” é o produto da etapa, não um efeito colateral.",
      },
      { source: "Engine", section: "§3", rule: "História é entrada obrigatória da cadeia." },
    ],
  },

  // -------------------------------------------------------------------------
  CASO: {
    id: "CASO",
    order: 3,
    label: COS_PHASE_LABELS.CASO,
    objective:
      "Separar, dentro da história, o que é fato clínico, o que é limite e o que é contexto — transformar história em material de trabalho.",
    reasoningStep: "ESTRUTURAR",
    entryCriteria: [
      {
        id: "historia-confirmada",
        description: "A história foi registrada e confirmada.",
        isMet: (record) =>
          Boolean(record.historia.narrative?.trim()) && Boolean(record.historia.understandingConfirmedAt),
      },
    ],
    exitCriteria: [
      {
        id: "contexto-clinico",
        description: "Registrar o contexto clínico.",
        isMet: (record) => Boolean(record.caso.clinicalContext?.trim()),
      },
    ],
    requiredInformation: ["Contexto clínico"],
    optionalInformation: [
      "Diagnóstico já recebido",
      "Hipótese em investigação",
      "Exames realizados",
      "Tratamentos em curso",
      "Limitações",
    ],
    artifacts: ["Caso"],
    states: ["Não iniciado", "Em estruturação", "Estruturado"],
    validations: [
      "Nada é acrescentado além do que foi dito — lacuna se pergunta, nunca se preenche.",
      "Registrar diagnóstico é registrar um fato relatado; nunca emitir um.",
    ],
    alerts: [],
    exceptions: [],
    traceability: [
      {
        source: "Fundamentos",
        section: "§5.2",
        rule: "Estruturar: separar necessidade, limite e receio.",
      },
      {
        source: "Ontologia",
        section: "§3.2",
        rule: "Caso representa a situação clínica que originou a Curadoria.",
      },
      {
        source: "Fundamentos",
        section: "§7",
        rule: "O Curador nunca diagnostica, nunca interpreta exame, nunca emite opinião clínica.",
      },
    ],
  },

  // -------------------------------------------------------------------------
  FILTROS: {
    id: "FILTROS",
    order: 4,
    label: COS_PHASE_LABELS.FILTROS,
    objective:
      "Registrar os requisitos inegociáveis do paciente — o que elimina uma opção de forma binária, antes de qualquer cálculo.",
    reasoningStep: "ESTRUTURAR",
    entryCriteria: [
      {
        id: "caso-estruturado",
        description: "O Caso está estruturado.",
        isMet: (record) => Boolean(record.caso.clinicalContext?.trim()),
      },
    ],
    exitCriteria: [
      {
        id: "filtros-revisados",
        description:
          "Os filtros foram conversados com o paciente. Zero filtros é um resultado válido — mas precisa ter sido conversado.",
        isMet: (record) => record.filtros.every((filtro) => Boolean(filtro.reason.trim())),
      },
    ],
    requiredInformation: [],
    optionalInformation: ["Especialidade", "Cidade", "Convênio", "Hospital", "Modalidade", "Disponibilidade"],
    artifacts: ["Restrições do Perfil de Prioridades"],
    states: ["Não iniciados", "Em construção", "Revisados"],
    validations: [
      "Todo filtro carrega o motivo, nas palavras do paciente.",
      "Nenhum filtro é inferido automaticamente — nunca.",
      "Um aspecto declarado como filtro não pode receber peso (Invariante 24).",
    ],
    alerts: ["C-02 — restrições mutuamente exclusivas"],
    exceptions: ["E-01 — filtros eliminaram todos", "E-09 — restrições mutuamente exclusivas"],
    traceability: [
      {
        source: "Ontologia",
        section: "§3.7",
        rule: "Restrição elimina opções e nunca recebe peso.",
      },
      {
        source: "Engine",
        section: "§4.1",
        rule: "Filtros são binários, conjuntivos e nunca afrouxados pelo Motor.",
      },
      {
        source: "Engine",
        section: "§5.1",
        rule: "Toda eliminação carrega motivo em linguagem humana.",
      },
    ],
  },

  // -------------------------------------------------------------------------
  PRIORIDADES: {
    id: "PRIORIDADES",
    order: 5,
    label: COS_PHASE_LABELS.PRIORIDADES,
    objective:
      "Construir com o paciente a distribuição dos 100 pontos — o núcleo do Método. Cada peso nasce de uma fala e carrega a evidência dela.",
    reasoningStep: "PRIORIZAR",
    entryCriteria: [
      {
        id: "filtros-revisados",
        description: "Os filtros foram revisados.",
        isMet: (record) => record.filtros.every((filtro) => Boolean(filtro.reason.trim())),
      },
    ],
    exitCriteria: [
      {
        id: "soma-cem",
        description: "Fechar a distribuição em exatamente 100 pontos.",
        isMet: (record) => totalWeight(record) === 100,
      },
      {
        id: "toda-evidencia",
        description: "Registrar a Evidência de Curadoria de cada peso.",
        isMet: (record) => record.prioridades.weights.every((weight) => Boolean(weight.evidence.trim())),
      },
    ],
    requiredInformation: ["Critérios priorizados", "Peso de cada critério", "Evidência de cada peso"],
    optionalInformation: ["Observações e preferências registradas nas palavras do paciente"],
    artifacts: ["Perfil de Prioridades (em construção)", "Evidência de Curadoria"],
    states: ["Rascunho", "Em construção", "Pronto para validar"],
    validations: [
      "I-01 — a soma precisa fechar em exatamente 100.",
      "I-02 — nenhum peso existe sem evidência.",
      "I-03 — nenhum aspecto é critério e restrição ao mesmo tempo.",
      "I-04 — critério que exige alvo declarado não fica sem alvo.",
      "I-05 — nenhum critério duplicado.",
    ],
    alerts: [],
    exceptions: [],
    traceability: [
      {
        source: "Fundamentos",
        section: "§10",
        rule: "O Perfil de Prioridades é o primeiro patrimônio construído em conjunto.",
      },
      {
        source: "Fundamentos",
        section: "§13",
        rule: "P5 — nenhuma prioridade existe sem validação do paciente.",
      },
      {
        source: "Ontologia",
        section: "§3.6",
        rule: "Peso é importância atribuída pelo paciente, nunca qualidade de médico.",
      },
      {
        source: "Engine",
        section: "§5.2",
        rule: "O Motor de Pesos nunca sugere valor nem autoajusta um peso quando outro muda.",
      },
      {
        source: "Experience",
        section: "§6",
        rule: "O total é sempre visível e o que falta é dito em linguagem natural.",
      },
    ],
  },

  // -------------------------------------------------------------------------
  VALIDACAO: {
    id: "VALIDACAO",
    order: 6,
    label: COS_PHASE_LABELS.VALIDACAO,
    objective:
      "O paciente reconhece o Perfil como dele. Sem esse ato, não existe Curadoria — e nada pode ser calculado.",
    reasoningStep: "PRIORIZAR",
    entryCriteria: [
      {
        id: "distribuicao-fechada",
        description: "A distribuição fecha 100 pontos, com evidência em todos.",
        isMet: (record) =>
          totalWeight(record) === 100 &&
          record.prioridades.weights.every((weight) => Boolean(weight.evidence.trim())),
      },
    ],
    exitCriteria: [
      {
        id: "validado",
        description: "O paciente validou explicitamente, e o ato está registrado.",
        isMet: (record) => Boolean(record.validacao?.validatedAt),
      },
    ],
    requiredInformation: ["Registro de como o paciente confirmou"],
    optionalInformation: ["Correções feitas por ele durante a leitura em voz alta"],
    artifacts: ["Perfil de Prioridades (Validado, imutável)"],
    states: ["Aguardando validação", "Validado"],
    validations: [
      "A validação é um ato do paciente, registrado — nunca um aceite clicado pelo Curador em nome dele.",
      "Depois de validado, o Perfil é imutável: corrigir exige construir um novo.",
    ],
    alerts: [],
    exceptions: [],
    traceability: [
      {
        source: "Fundamentos",
        section: "§10",
        rule: "Sem o ato de validação, o Perfil não existe e nada pode ser calculado sobre ele.",
      },
      {
        source: "Experience",
        section: "§2.3",
        rule: "A validação tem liturgia: leitura em voz alta, evidência junto, pergunta aberta.",
      },
      {
        source: "Ontologia",
        section: "Invariante 12",
        rule: "Nenhum Perfil é validado por outro que não o Paciente.",
      },
    ],
  },

  // -------------------------------------------------------------------------
  CURADORIA_TECNICA: {
    id: "CURADORIA_TECNICA",
    order: 7,
    label: COS_PHASE_LABELS.CURADORIA_TECNICA,
    objective:
      "Aplicar o Perfil validado à base de médicos previamente aprovados e escolher — como humano — exatamente três caminhos legítimos.",
    reasoningStep: "COMPARAR",
    entryCriteria: [
      {
        id: "perfil-validado",
        description: "O Perfil de Prioridades está validado.",
        isMet: (record) => Boolean(record.validacao?.validatedAt),
      },
    ],
    exitCriteria: [
      {
        id: "tres-selecionados",
        description: "Selecionar exatamente três profissionais, com autoria registrada.",
        isMet: (record) =>
          record.curadoriaTecnica.selectedProfessionalIds.length === 3 &&
          Boolean(record.curadoriaTecnica.selectedBy),
      },
    ],
    requiredInformation: ["Comparação calculada", "Três profissionais selecionados"],
    optionalInformation: ["Observações do Curador sobre cada profissional analisado"],
    artifacts: ["Mapa de Compatibilidade", "Registros de Exclusão", "Seleção das três opções"],
    states: ["Aguardando comparação", "Comparado", "Selecionado"],
    validations: [
      "I-09 — exatamente três, nunca outro número.",
      "I-10 — nenhum profissional repetido.",
      "I-11 — toda opção tem análise que a fundamenta.",
      "I-12 — a seleção tem autor humano.",
    ],
    alerts: [
      "C-01 — mais de três equivalentes",
      "C-05 — nenhuma opção acima de Moderada",
      "C-06 — cobertura média baixa",
    ],
    exceptions: [
      "E-01 — universo esvaziado pelos filtros",
      "E-02 — menos de três elegíveis",
      "E-05 — cobertura média abaixo de 50%",
    ],
    traceability: [
      {
        source: "Fundamentos",
        section: "§13",
        rule: "P14 — o algoritmo nunca seleciona os três profissionais apresentados.",
      },
      {
        source: "Engine",
        section: "§5.3",
        rule: "O Motor de Compatibilidade nunca seleciona, corta a lista, marca favorito ou desempata.",
      },
      {
        source: "Fundamentos",
        section: "§13",
        rule: "P6 — o universo é fechado e previamente aprovado; nunca há busca automática.",
      },
    ],
  },

  // -------------------------------------------------------------------------
  RELATORIO: {
    id: "RELATORIO",
    order: 8,
    label: COS_PHASE_LABELS.RELATORIO,
    objective:
      "Escrever o documento que o paciente vai reler e mostrar para a família — com o que cada opção oferece e o que cada uma custa.",
    reasoningStep: "JUSTIFICAR",
    entryCriteria: [
      {
        id: "selecao-fechada",
        description: "As três opções estão selecionadas.",
        isMet: (record) => record.curadoriaTecnica.selectedProfessionalIds.length === 3,
      },
    ],
    exitCriteria: [
      {
        id: "tres-justificadas",
        description: "Escrever justificativa, relação com os pesos e pontos de atenção das três opções.",
        isMet: (record) =>
          record.relatorio.options.length === 3 &&
          record.relatorio.options.every(
            (option) =>
              Boolean(option.justification.trim()) &&
              Boolean(option.relationToWeights.trim()) &&
              option.attentionPoints.length > 0,
          ),
      },
      {
        id: "composicao-justificada",
        description: "Justificar a composição das três como conjunto.",
        isMet: (record) => Boolean(record.relatorio.compositionRationale?.trim()),
      },
    ],
    requiredInformation: [
      "Justificativa de cada opção",
      "Relação com os pesos",
      "Pontos de atenção",
      "Justificativa da composição",
    ],
    optionalInformation: ["Pontos favoráveis", "Perguntas sugeridas", "Observações do Curador"],
    artifacts: ["Relatório"],
    states: ["Em elaboração", "Emitido", "Entregue"],
    validations: [
      "Toda opção declara o que custa — opção só com virtudes é recomendação disfarçada.",
      "Nenhum score interno aparece no conteúdo do paciente.",
      "Nenhuma linguagem de ranking, colocação ou vencedor.",
      "A ordem é de apresentação, nunca de colocação.",
    ],
    alerts: [],
    exceptions: ["E-08 — profissional saiu do universo após a seleção"],
    traceability: [
      {
        source: "Experience",
        section: "§2.5",
        rule: "Toda opção diz o que custa; assimetria de entusiasmo é indução.",
      },
      {
        source: "Ontologia",
        section: "§3.12",
        rule: "O Relatório nunca contém score interno nem linguagem de ranking.",
      },
      {
        source: "Engine",
        section: "§4.6",
        rule: "As justificativas de opção e composição são escritas pelo Curador, nunca pelo Motor.",
      },
    ],
  },

  // -------------------------------------------------------------------------
  DEVOLUTIVA: {
    id: "DEVOLUTIVA",
    order: 9,
    label: COS_PHASE_LABELS.DEVOLUTIVA,
    objective:
      "Apresentar as três opções pessoalmente, responder dúvidas devolvendo ao critério do paciente, e registrar a decisão dele — no tempo dele.",
    reasoningStep: "APRESENTAR",
    entryCriteria: [
      {
        id: "relatorio-pronto",
        description: "O Relatório está pronto, com as três opções justificadas.",
        isMet: (record) =>
          record.relatorio.options.length === 3 && Boolean(record.relatorio.compositionRationale?.trim()),
      },
    ],
    exitCriteria: [
      {
        id: "decisao-registrada",
        description: "Registrar a decisão do paciente — inclusive “nenhuma destas”.",
        isMet: (record) => Boolean(record.devolutiva.decision),
      },
    ],
    requiredInformation: ["Registro da apresentação", "Decisão do paciente"],
    optionalInformation: ["Dúvidas do paciente", "Observações", "Próximos passos"],
    artifacts: ["Escolha", "Acompanhamento"],
    states: ["Aguardando apresentação", "Apresentado", "Decidido"],
    validations: [
      "A entrega é sempre humana — nunca uma notificação com anexo.",
      "“Nenhuma destas” é desfecho legítimo, registrado com a mesma facilidade.",
      "Nenhum prazo é imposto ao paciente.",
    ],
    alerts: [],
    exceptions: [],
    traceability: [
      {
        source: "Experience",
        section: "§2.5",
        rule: "A entrega é sempre humana; o Curador começa pelo Perfil, não pelos médicos.",
      },
      {
        source: "Experience",
        section: "§2.6",
        rule: "Oito vetores de indução ficam fechados; a decisão é do paciente.",
      },
      {
        source: "Ontologia",
        section: "§3.14",
        rule: "“Nenhuma destas” significa que alguma etapa anterior não capturou algo, nunca falha do paciente.",
      },
    ],
  },
};

export const COS_PHASE_ORDER: CosPhaseId[] = Object.values(COS_PHASE_DEFINITIONS)
  .sort((a, b) => a.order - b.order)
  .map((phase) => phase.id);
