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
 * Navegação agrupada do Centro de Operações Aliviar (COA).
 * Um link só entra quando a página de destino existe.
 */
export function getNavGroups(role: string, basePath: string): NavGroup[] {
  if (basePath === "/coa/atendimento") {
    return getAtendimentoNavGroups(role);
  }
  if (basePath === "/coa/concierge") {
    return getConciergeNavGroups(role);
  }

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

function getAtendimentoNavGroups(role: string): NavGroup[] {
  const groups: NavGroup[] = [
    {
      label: "COA · Atendimento",
      items: [{ label: "Fila de Leads", href: "/coa/atendimento", icon: "dashboard" }],
    },
    {
      label: "Operação",
      items: [
        { label: "Contatos", href: "/admin/crm/contatos", icon: "contacts" },
        { label: "Funil", href: "/admin/crm/funil", icon: "funnel" },
        { label: "Tarefas", href: "/admin/crm/tarefas", icon: "tasks" },
        { label: "Agenda", href: "/admin/crm/agenda", icon: "agenda" },
      ],
    },
  ];

  if (role === "administrador") {
    groups.push({
      label: "COA",
      items: [
        { label: "Curadoria", href: "/coa/curadoria", icon: "cases" },
        { label: "Concierge", href: "/coa/concierge", icon: "dashboard" },
      ],
    });
  }

  return groups;
}

function getConciergeNavGroups(role: string): NavGroup[] {
  const groups: NavGroup[] = [
    {
      label: "COA · Concierge",
      // "Fila" é vocabulário de atendimento em massa: o Concierge acompanha
      // casos com nome, não despacha uma fila.
      items: [{ label: "Continuidade", href: "/coa/concierge", icon: "dashboard" }],
    },
    {
      label: "Operação",
      items: [
        { label: "Contatos", href: "/admin/crm/contatos", icon: "contacts" },
        { label: "Tarefas", href: "/admin/crm/tarefas", icon: "tasks" },
        { label: "Agenda", href: "/admin/crm/agenda", icon: "agenda" },
      ],
    },
  ];

  if (role === "administrador") {
    groups.push({
      label: "COA",
      items: [
        { label: "Atendimento", href: "/coa/atendimento", icon: "contacts" },
        { label: "Curadoria", href: "/coa/curadoria", icon: "cases" },
      ],
    });
  }

  return groups;
}
