import type { ChecklistItemState, StudioChecklistItem } from "./types";

type ChecklistDefinition = {
  id: string;
  section: string;
  label: string;
};

/** Checklist operacional derivado do Protocolo AliCIA 1.0 — Capítulo 12 (A–G). */
export const OPERATIONAL_CHECKLIST_DEFINITIONS: ChecklistDefinition[] = [
  { id: "A1", section: "A — Elegibilidade", label: "Nome completo coletado" },
  { id: "A2", section: "A — Elegibilidade", label: "CRM consultado (print + data + URL)" },
  { id: "A3", section: "A — Elegibilidade", label: "Situação do CRM: ativo" },
  { id: "A4", section: "A — Elegibilidade", label: "Especialidade no escopo confirmada" },
  { id: "A5", section: "A — Elegibilidade", label: "RQE ou título verificado" },
  { id: "A6", section: "A — Elegibilidade", label: "Atuação no Espírito Santo confirmada" },
  { id: "A7", section: "A — Elegibilidade", label: "Pelo menos 1 fonte nível 1–3 documentada" },
  { id: "A8", section: "A — Elegibilidade", label: "Decisão de elegibilidade registrada" },
  { id: "B1", section: "B — Coleta", label: "Graduação: instituição + fonte" },
  { id: "B2", section: "B — Coleta", label: "Residência(s) com fonte cada" },
  { id: "B3", section: "B — Coleta", label: "Treinamento complementar documentado (se houver)" },
  { id: "B4", section: "B — Coleta", label: "Títulos (TEOT etc.) com fonte (se houver)" },
  { id: "B5", section: "B — Coleta", label: "Instituições de atuação atual com fonte" },
  { id: "B6", section: "B — Coleta", label: "Áreas de atuação em fonte nível 1–4" },
  { id: "B7", section: "B — Coleta", label: "Conflitos entre fontes resolvidos ou pendentes" },
  { id: "C1", section: "C — Instituições", label: "Cada instituição categorizada" },
  { id: "C2", section: "C — Instituições", label: "Nome canônico aplicado" },
  { id: "C3", section: "C — Instituições", label: "Cidade/UF preenchidos quando conhecidos" },
  { id: "D1", section: "D — Verificação", label: "Nível atribuído (A / B / C)" },
  { id: "D2", section: "D — Verificação", label: "Campos não confirmados em unverifiedFields" },
  { id: "D3", section: "D — Verificação", label: "Nenhum pendente exibido como confirmado" },
  { id: "D4", section: "D — Verificação", label: "Mínimo de 2 fontes no perfil" },
  { id: "E1", section: "E — Revisão editorial", label: "Textos em linguagem simples" },
  { id: "E2", section: "E — Revisão editorial", label: "Sem adjetivos de qualidade clínica" },
  { id: "E3", section: "E — Revisão editorial", label: "Sem linguagem de recomendação" },
  { id: "E4", section: "E — Revisão editorial", label: "Resumo cobre quem é, formação, atuação, pendências" },
  { id: "E5", section: "E — Revisão editorial", label: "Publicações tratadas corretamente" },
  { id: "F1", section: "F — Publicação", label: "Checklist A–E completo" },
  { id: "F2", section: "F — Publicação", label: "Revisor identificado" },
  { id: "F3", section: "F — Publicação", label: "Nível A: segundo revisor / curador" },
  { id: "F4", section: "F — Publicação", label: "Dossiê arquivado" },
  { id: "F5", section: "F — Publicação", label: "Datas de publicação e revisão (180d) registradas" },
  { id: "F6", section: "F — Publicação", label: "Decisão PUBLICAR / MANTER OCULTO" },
  { id: "G1", section: "G — Pós-publicação", label: "Perfil visível no ambiente correto" },
  { id: "G2", section: "G — Pós-publicação", label: "QA 10% reprodutibilidade" },
  { id: "G3", section: "G — Pós-publicação", label: "Falha QA: retorno à revisão se aplicável" },
];

export function createDefaultChecklist(
  initialStates?: Partial<Record<string, ChecklistItemState>>,
): StudioChecklistItem[] {
  return OPERATIONAL_CHECKLIST_DEFINITIONS.map((item) => ({
    ...item,
    state: initialStates?.[item.id] ?? "pendente",
  }));
}

export function checklistProgress(items: StudioChecklistItem[]): {
  total: number;
  concluido: number;
  bloqueado: number;
} {
  return {
    total: items.length,
    concluido: items.filter((i) => i.state === "concluido").length,
    bloqueado: items.filter((i) => i.state === "bloqueado").length,
  };
}
