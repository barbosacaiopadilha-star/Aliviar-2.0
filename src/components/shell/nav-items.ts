export type NavItem = {
  label: string;
  href: string;
  icon?: "home" | "dashboard" | "contacts" | "funnel" | "tasks" | "agenda" | "patients" | "settings" | "cases" | "team" | "professionals" | "analytics";
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export function isNavItemActive(pathname: string, href: string, basePath: string): boolean {
  if (href === basePath) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Navegação agrupada do Sistema Operacional Aliviar (AOS-DC).
 * Um link só entra quando a página de destino existe.
 */
export function getNavGroups(role: string, basePath: string): NavGroup[] {
  const groups: NavGroup[] = [];

  if (role === "administrador") {
    groups.push({
      label: "Dashboard",
      items: [{ label: "Visão geral", href: basePath, icon: "home" }],
    });
    groups.push({
      label: "CRM",
      items: [
        { label: "Painel Concierge", href: `${basePath}/crm`, icon: "dashboard" },
        { label: "Contatos", href: `${basePath}/crm/contatos`, icon: "contacts" },
        { label: "Funil", href: `${basePath}/crm/funil`, icon: "funnel" },
        { label: "Tarefas", href: `${basePath}/crm/tarefas`, icon: "tasks" },
        { label: "Agenda", href: `${basePath}/crm/agenda`, icon: "agenda" },
      ],
    });
    groups.push({
      label: "Administração",
      items: [
        { label: "Pacientes", href: `${basePath}/pacientes`, icon: "patients" },
        { label: "Profissionais", href: `${basePath}/profissionais`, icon: "professionals" },
        { label: "Equipe", href: `${basePath}/equipe`, icon: "team" },
        { label: "Casos", href: `${basePath}/casos`, icon: "cases" },
      ],
    });
    groups.push({
      label: "Analytics",
      items: [{ label: "Observabilidade ACE", href: `${basePath}/ace`, icon: "analytics" }],
    });
    return groups;
  }

  if (role === "concierge") {
    groups.push({
      label: "Dashboard",
      items: [{ label: "Painel Concierge", href: `${basePath}/crm`, icon: "dashboard" }],
    });
    groups.push({
      label: "Concierge",
      items: [
        { label: "Contatos", href: `${basePath}/crm/contatos`, icon: "contacts" },
        { label: "Funil", href: `${basePath}/crm/funil`, icon: "funnel" },
        { label: "Tarefas", href: `${basePath}/crm/tarefas`, icon: "tasks" },
        { label: "Agenda", href: `${basePath}/crm/agenda`, icon: "agenda" },
      ],
    });
    return groups;
  }

  if (role === "curador_medico") {
    groups.push({
      label: "Dashboard",
      items: [{ label: "Início", href: basePath, icon: "home" }],
    });
    groups.push({
      label: "Curador",
      items: [{ label: "Casos", href: `${basePath}/casos`, icon: "cases" }],
    });
    return groups;
  }

  groups.push({
    label: "Dashboard",
    items: [{ label: "Início", href: basePath, icon: "home" }],
  });
  return groups;
}

/** @deprecated Use getNavGroups — mantido para compatibilidade temporária. */
export function getDefaultNavItems(role: string, basePath: string): NavItem[] {
  return getNavGroups(role, basePath).flatMap((group) => group.items);
}
