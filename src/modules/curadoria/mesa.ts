/**
 * Mesa de Curadoria — lógica pura (MISSÃO 203).
 *
 * O que a Mesa exige antes de encerrar a Curadoria Técnica, em código puro e
 * testável — sem React, sem banco, sem data do sistema. Materializa a
 * Barreira 4 do Motor (Engine §11) e os critérios da MISSÃO 203: exatamente
 * três profissionais, cada um com parecer técnico próprio, mais a
 * justificativa da composição.
 *
 * Nenhuma função aqui seleciona, sugere conteúdo ou completa um parecer —
 * o sistema sugere estrutura, nunca conteúdo final (Engine §4.6).
 */

import { validateSelection } from "./method";

/** Parecer técnico de uma opção — as cinco perguntas da MISSÃO 203. */
export type ParecerDraft = {
  professionalId: string;
  /** Por que entrou na Curadoria. */
  whyIncluded: string;
  /** Quais prioridades do paciente atende melhor. */
  prioritiesServed: string;
  /** Quais limitações possui — o que esta opção custa. */
  limitations: string;
  /** Perguntas sugeridas para a consulta. */
  questions: string;
  /** Observações relevantes. */
  observations: string;
};

export function emptyParecer(professionalId: string): ParecerDraft {
  return {
    professionalId,
    whyIncluded: "",
    prioritiesServed: "",
    limitations: "",
    questions: "",
    observations: "",
  };
}

/**
 * A estrutura sugerida do parecer — os títulos que o editor apresenta.
 * Estrutura, nunca conteúdo: nenhum campo vem com frase pronta.
 * A orientação de cada campo ecoa os três testes do Momento 7
 * (Jornada §Momento 7): nomear o critério do paciente, dizer o que
 * custa, e poder ser lido em voz alta sem tradução.
 */
export const PARECER_PROMPTS: ReadonlyArray<{
  field: keyof Omit<ParecerDraft, "professionalId">;
  title: string;
  guidance: string;
  required: boolean;
}> = [
  {
    field: "whyIncluded",
    title: "Por que esta opção está na Curadoria",
    guidance:
      "Nomeie o critério do paciente que ela responde — nunca uma qualidade abstrata. Se você leria a frase em voz alta para ele sem mudar uma palavra, ela está pronta.",
    required: true,
  },
  {
    field: "prioritiesServed",
    title: "Quais prioridades atende melhor",
    guidance: "Relacione com os pesos que o paciente validou, na ordem em que pesam para ele.",
    required: true,
  },
  {
    field: "limitations",
    title: "Quais limitações possui",
    guidance:
      "O que esta opção custa. Opção só com virtudes não é opção — é recomendação disfarçada.",
    required: true,
  },
  {
    field: "questions",
    title: "Perguntas para a consulta",
    guidance: "O que vale o paciente perguntar no primeiro encontro com este profissional.",
    required: false,
  },
  {
    field: "observations",
    title: "Observações relevantes",
    guidance: "O que mais você observou e quer que fique registrado, com sua autoria.",
    required: false,
  },
];

export type MesaClosureInput = {
  selectedIds: string[];
  pareceres: ParecerDraft[];
  compositionRationale: string;
  /** Autoria humana obrigatória — quem está encerrando (Engine I-12). */
  curatorName: string;
  /** Nome de exibição por id, para mensagens em linguagem de pessoa. */
  namesById: Record<string, string>;
};

/**
 * O que ainda falta para encerrar a Curadoria Técnica — em linguagem de
 * pessoa, para aparecer AO LADO do botão, nunca um botão cinza sem explicação
 * (Experience §3: copiloto sinaliza a lacuna, não bloqueia o caminho).
 * Lista vazia = pronto para encerrar.
 */
export function validateMesaClosure(input: MesaClosureInput): string[] {
  const missing: string[] = [];

  const selection = validateSelection(input.selectedIds);
  if (!selection.valid && selection.error) {
    missing.push(selection.error);
  }

  for (const id of input.selectedIds) {
    const name = input.namesById[id] ?? "uma das opções";
    const parecer = input.pareceres.find((entry) => entry.professionalId === id);

    if (!parecer) {
      missing.push(`O parecer de ${name} ainda não foi iniciado.`);
      continue;
    }

    for (const prompt of PARECER_PROMPTS) {
      if (prompt.required && !parecer[prompt.field].trim()) {
        missing.push(`${name}: falta "${prompt.title.toLowerCase()}".`);
      }
    }
  }

  if (!input.compositionRationale.trim()) {
    missing.push("Falta explicar por que estas três, juntas, servem a este paciente.");
  }

  if (!input.curatorName.trim()) {
    // Nunca deveria acontecer na prática — a Mesa sempre conhece o Curador —
    // mas a Barreira 4 exige autoria e a validação não confia no chamador.
    missing.push("A seleção precisa de autor humano identificado.");
  }

  return missing;
}

/**
 * Registro local de trabalho da Mesa — a matéria-prima da Memória da
 * Curadoria. Cada ação relevante vira uma entrada com autor; a persistência
 * como eventos do Motor (Engine §7) é ponto de integração futura.
 */
export type MesaLogEntry = {
  kind:
    | "COMPARACAO_ADICIONADA"
    | "COMPARACAO_REMOVIDA"
    | "OPCAO_SELECIONADA"
    | "OPCAO_REMOVIDA"
    | "JUSTIFICATIVA_REGISTRADA"
    | "SELECAO_FECHADA";
  description: string;
  actor: string;
};

export function logEntry(kind: MesaLogEntry["kind"], description: string, actor: string): MesaLogEntry {
  return { kind, description, actor };
}
