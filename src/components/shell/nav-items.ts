export type NavItem = {
  label: string;
  href: string;
};

/**
 * Navegação inicial por papel (docs/DESIGN_SYSTEM.md, seção 5). Um link só
 * entra aqui quando a página de destino já existe — um link que não leva a
 * lugar nenhum é pior do que a ausência do link (mesmo princípio já
 * registrado no Design System). "Configurações" ainda não existe para
 * nenhum papel; "Meu Perfil" (paciente) e "Profissionais" (administrador)
 * entraram na Sprint Produto 2, quando essas páginas passaram a existir.
 */
export function getDefaultNavItems(role: string, basePath: string): NavItem[] {
  const items: NavItem[] = [{ label: "Início", href: basePath }];

  if (role === "paciente") {
    items.push({ label: "Minha Curadoria", href: `${basePath}/curadoria` });
    items.push({ label: "Meu Perfil", href: `${basePath}/perfil` });
    items.push({ label: "Meus Documentos", href: `${basePath}/documentos` });
    items.push({ label: "Linha do Tempo", href: `${basePath}/linha-do-tempo` });
  }

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
