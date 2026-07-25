import { revalidatePath } from "next/cache";

/**
 * As superfícies que precisam esquecer o cache quando um Case muda.
 *
 * Por que existe: cada action do módulo mantinha a sua própria lista de rotas,
 * e todas apontavam para `/curador/casos` e `/portal-curador` — endereços que
 * hoje são apenas redirects legados. As rotas reais do Portal do Curador são
 * `/coa/curadoria/*`. Consequência observada em produção: o Curador assumia uma
 * Curadoria, o banco gravava certo, e a lista continuava sem ela até a próxima
 * navegação completa. O dado estava certo; a tela é que não era avisada.
 *
 * Uma lista só, num lugar só. Quando uma rota mudar de novo, muda aqui — e não
 * em cinco actions que ninguém lembra que existem.
 */
export function revalidateCaseSurfaces(caseId?: string) {
  // Portal do Curador — rota real, com `layout` para alcançar a fila e a
  // página do caso de uma vez.
  revalidatePath("/coa/curadoria", "layout");
  if (caseId) revalidatePath(`/coa/curadoria/casos/${caseId}`, "layout");

  // Administração e paciente.
  revalidatePath("/admin/casos");
  if (caseId) revalidatePath(`/admin/casos/${caseId}`);
  revalidatePath("/paciente");
  revalidatePath("/paciente/curadoria");

  // Endereços herdados: quem estiver com um link antigo aberto também recarrega.
  revalidatePath("/portal-curador");
  revalidatePath("/curador/casos");
  if (caseId) revalidatePath(`/curador/casos/${caseId}`);
}
