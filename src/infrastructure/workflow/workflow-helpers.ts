import type { JornadaDoPacienteView } from "@/experience-flow/contracts/jornada-view";
import { normalizarWorkspace } from "@/infrastructure/curador/curador-workspace";

export function entregaEstaPublicada(
  view: JornadaDoPacienteView,
  workspaceData: unknown,
): boolean {
  if (view.extensoes.entrega !== null) {
    return true;
  }

  const workspace = normalizarWorkspace(workspaceData);
  return workspace.rascunho_entrega?.modo === "PUBLICADO";
}
