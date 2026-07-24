import type { OpcaoRegistradaView } from "@/curator-flow/contracts/curador-view";
import type { DossieOpcaoView, RotuloOpcaoDossie } from "@/curadoria-flow/contracts/dossie-view";

const ROTULOS: RotuloOpcaoDossie[] = ["A", "B", "C"];

export function rotuloFromIndice(indice: number): RotuloOpcaoDossie {
  const rotulo = ROTULOS[indice];
  if (!rotulo) {
    throw new Error(`Índice de opção inválido: ${indice}`);
  }
  return rotulo;
}

export function textArrayToString(values: string[] | null | undefined): string {
  return (values ?? []).join("\n");
}

export function stringToTextArray(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export interface ReportOptionRow {
  id: string;
  report_id: string;
  professional_profile_id: string;
  position: number;
  justification: string;
  relation_to_weights: string;
  favorable_points: string[];
  attention_points: string[];
  suggested_questions: string[];
  curator_observations: string | null;
}

export interface ReportOptionExtras {
  o_que_esperar?: string;
  evidencias_resumo?: string;
}

export function reportOptionToDossieOpcao(
  row: ReportOptionRow,
  professional?: { display_name: string; especialidade: string },
  extras?: ReportOptionExtras,
): DossieOpcaoView {
  return {
    id: row.id,
    indice: row.position - 1,
    rotulo: rotuloFromIndice(row.position - 1),
    nome: professional?.display_name ?? "",
    especialidade: professional?.especialidade ?? "",
    parecer: row.justification,
    pontos_favoraveis: textArrayToString(row.favorable_points),
    pontos_atencao: textArrayToString(row.attention_points),
    perguntas_sugeridas: textArrayToString(row.suggested_questions),
    relation_to_weights: row.relation_to_weights,
    o_que_esperar: extras?.o_que_esperar ?? row.curator_observations ?? "",
    evidencias_resumo: extras?.evidencias_resumo ?? "",
    professional_profile_id: row.professional_profile_id,
  };
}

export function dossieOpcaoToReportOptionPayload(
  opcao: DossieOpcaoView,
  reportId: string,
): Omit<ReportOptionRow, "id"> & { id?: string } {
  return {
    id: opcao.id || undefined,
    report_id: reportId,
    professional_profile_id: opcao.professional_profile_id ?? opcao.id,
    position: opcao.indice + 1,
    justification: opcao.parecer,
    relation_to_weights: opcao.relation_to_weights ?? "",
    favorable_points: stringToTextArray(opcao.pontos_favoraveis),
    attention_points: stringToTextArray(opcao.pontos_atencao),
    suggested_questions: stringToTextArray(opcao.perguntas_sugeridas),
    curator_observations: opcao.o_que_esperar || null,
  };
}

export function opcaoRegistradaToDossieOpcao(
  opcao: OpcaoRegistradaView,
  id = "",
  professionalProfileId?: string,
): DossieOpcaoView {
  return {
    id,
    indice: opcao.indice,
    rotulo: rotuloFromIndice(opcao.indice),
    nome: opcao.nome,
    especialidade: opcao.especialidade,
    parecer: opcao.por_que_esta_aqui,
    pontos_favoraveis: opcao.por_que_pode_fazer_sentido,
    pontos_atencao: opcao.limitacoes,
    perguntas_sugeridas: "",
    relation_to_weights: "",
    o_que_esperar: opcao.o_que_esperar,
    evidencias_resumo: opcao.evidencias_resumo,
    professional_profile_id: professionalProfileId,
  };
}

export function dossieOpcaoToOpcaoRegistrada(opcao: DossieOpcaoView): OpcaoRegistradaView {
  return {
    indice: opcao.indice,
    nome: opcao.nome,
    especialidade: opcao.especialidade,
    por_que_esta_aqui: opcao.parecer,
    por_que_pode_fazer_sentido: opcao.pontos_favoraveis,
    o_que_esperar: opcao.o_que_esperar,
    limitacoes: opcao.pontos_atencao,
    evidencias_resumo: opcao.evidencias_resumo,
  };
}

export function opcoesRegistradasToDossieOpcoes(
  opcoes: OpcaoRegistradaView[],
): DossieOpcaoView[] {
  return opcoes.map((opcao) => opcaoRegistradaToDossieOpcao(opcao));
}

export function dossieOpcoesToOpcoesRegistradas(
  opcoes: DossieOpcaoView[],
): OpcaoRegistradaView[] {
  return opcoes.map(dossieOpcaoToOpcaoRegistrada);
}
