export type NavItem = {
  label: string;
  href: string;
};

/**
 * Navegação inicial por papel (docs/DESIGN_SYSTEM.md, seção 5). "Perfil" e
 * "Configurações" estão previstos no documento, mas suas páginas ainda não
 * existem — deliberadamente omitidos daqui por enquanto: um link que não
 * leva a lugar nenhum é pior do que a ausência do link (mesmo princípio
 * registrado no Design System). Adicionar aqui quando essas páginas
 * existirem.
 */
export function getDefaultNavItems(basePath: string): NavItem[] {
  return [{ label: "Início", href: basePath }];
}
