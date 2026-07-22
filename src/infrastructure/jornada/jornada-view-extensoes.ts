import type { JornadaViewExtensoes } from "@/experience-flow/contracts/jornada-view";

export const EXTENSOES_VAZIAS: JornadaViewExtensoes = {
  tempo_estimado: null,
  documentos: [],
  entrega: null,
  escolha_registrada: null,
};

export function normalizarExtensoes(
  extensoes?: Partial<JornadaViewExtensoes> | null,
): JornadaViewExtensoes {
  return {
    tempo_estimado: extensoes?.tempo_estimado ?? null,
    documentos: extensoes?.documentos ?? [],
    entrega: extensoes?.entrega ?? null,
    escolha_registrada: extensoes?.escolha_registrada ?? null,
  };
}
