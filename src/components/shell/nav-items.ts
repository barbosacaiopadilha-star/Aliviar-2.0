export type NavItem = {
  label: string;
  href: string;
  icon?:
    | "home"
    | "dashboard"
    | "contacts"
    | "funnel"
    | "tasks"
    | "agenda"
    | "patients"
    | "settings"
    | "cases"
    | "team"
    | "professionals"
    | "analytics";
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export function isNavItemActive(
  pathname: string,
  href: string,
  basePath: string,
): boolean {
  if (href === basePath) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Navegação agrupada do Centro de Operações Aliviar (COA).
 * Um link só entra quando a página de destino existe.
 */
export function getNavGroups(role: string, basePath: string): NavGroup[] {
  const groups: NavGroup[] = [];

  if (role === "administrador") {
    groups.push({
      label: "Dashboard",
      items: [{ label: "Visão geral", href: basePath, icon: "home" }],
    });
    // Os DASHBOARDS /coa/atendimento e /coa/concierge saíram (auditoria
    // operacional de 21/08, F-3): eram vitrines sobre os mesmos dados das
    // jornadas, e o próprio hub já dizia que "deixam de competir como porta
    // de entrada". O menu passa a apontar para onde o trabalho acontece.
    groups.push({
      label: "Centro de Operações",
      items: [
        { label: "Visão operacional", href: "/coa", icon: "dashboard" },
        { label: "Atendimento", href: "/atendimento", icon: "contacts" },
        { label: "Curadoria", href: "/coa/curadoria", icon: "cases" },
        { label: "Concierge", href: "/acompanhamento", icon: "dashboard" },
      ],
    });
    groups.push({
      label: "Relacionamento",
      items: [
        {
          label: "Contatos",
          href: `${basePath}/crm/contatos`,
          icon: "contacts",
        },
        { label: "Funil", href: `${basePath}/crm/funil`, icon: "funnel" },
        { label: "Tarefas", href: `${basePath}/crm/tarefas`, icon: "tasks" },
        { label: "Agenda", href: `${basePath}/crm/agenda`, icon: "agenda" },
      ],
    });
    groups.push({
      label: "Administração",
      items: [
        { label: "Pacientes", href: `${basePath}/pacientes`, icon: "patients" },
        {
          label: "Profissionais",
          href: `${basePath}/profissionais`,
          icon: "professionals",
        },
        { label: "Equipe", href: `${basePath}/equipe`, icon: "team" },
        { label: "Casos", href: `${basePath}/casos`, icon: "cases" },
      ],
    });
    // O grupo "Analytics" levava a `/admin/ace` — o painel de um motor que não
    // executa mais. O item 1.7 (DP-2) tirou esse destino da tela de caso e
    // esqueceu o menu: sobrava uma entrada que só dava 404, pela barra lateral
    // e pela paleta de comandos, que lê esta mesma lista. Enquanto não houver
    // observabilidade para mostrar, não há item.
    return groups;
  }

  if (role === "concierge") {
    groups.push({
      label: "Dashboard",
      items: [
        {
          label: "Painel Concierge",
          href: `${basePath}/crm`,
          icon: "dashboard",
        },
      ],
    });
    groups.push({
      label: "Concierge",
      items: [
        {
          label: "Contatos",
          href: `${basePath}/crm/contatos`,
          icon: "contacts",
        },
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
