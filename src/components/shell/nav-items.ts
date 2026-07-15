export type NavItem = {
  label: string;
  href: string;
};

/**
 * Navegação inicial por papel (docs/DESIGN_SYSTEM.md, seção 5). Um link só
 * entra aqui quando a página de destino já existe — um link que não leva a
 * lugar nenhum é pior do que a ausência do link (mesmo princípio já
 * registrado no Design System). "Configurações" ainda não existe para
 * nenhum papel; "Profissionais" (administrador) entrou na Sprint Produto 2,
 * quando essa página passou a existir.
 *
 * Nunca gera navegação de "paciente" (PRODUTO DO PACIENTE, Fase 2) — o
 * paciente tem um item real fora da árvore `${basePath}` ("Minha história",
 * em /sua-historia) que esta função, ao só concatenar `${basePath}/sufixo`,
 * não consegue representar. A fonte única do paciente é
 * src/components/paciente/patient-nav-items.ts, consumida por PatientShell,
 * nunca por AppShell.
 */
export function getDefaultNavItems(role: string, basePath: string): NavItem[] {
  const items: NavItem[] = [{ label: "Início", href: basePath }];

  if (role === "administrador") {
    items.push({ label: "Pacientes", href: `${basePath}/pacientes` });
    items.push({ label: "Profissionais", href: `${basePath}/profissionais` });
    items.push({ label: "Equipe", href: `${basePath}/equipe` });
    items.push({ label: "Casos", href: `${basePath}/casos` });
    items.push({ label: "Observabilidade do ACE", href: `${basePath}/ace` });
  }

  if (role === "curador_medico") {
    items.push({ label: "Casos", href: `${basePath}/casos` });
  }

  return items;
}
