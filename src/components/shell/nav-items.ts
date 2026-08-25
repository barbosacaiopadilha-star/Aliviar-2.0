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
    // "Visão operacional" (/coa) saiu do menu junto com a tela: o hub virou
    // redirecionamento puro para a casa do papel. O menu já leva direto às
    // três jornadas — um item que só roteava seria porta para um corredor.
    groups.push({
      label: "Centro de Operações",
      items: [
        { label: "Atendimento", href: "/atendimento", icon: "contacts" },
        { label: "Curadoria", href: "/coa/curadoria", icon: "cases" },
        { label: "Concierge", href: "/acompanhamento", icon: "dashboard" },
      ],
    });
    // Funil, Tarefas, Agenda e o dashboard do CRM SAÍRAM (ADR-075 executada):
    // eram ferramentas de volume com volume zero, e o funil era a terceira
    // máquina de estados. O que fica é o registro — a lista de contatos. Os
    // atos comerciais (tarefas, agendamentos, interações) continuam vivos
    // DENTRO da ficha de cada contato, que é onde acontecem de verdade.
    groups.push({
      label: "Relacionamento",
      items: [
        {
          label: "Contatos",
          href: `${basePath}/crm/contatos`,
          icon: "contacts",
        },
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
        // ADR-089 · o item que o comentário abaixo esperava. Não é o painel
        // do ACE que saiu: é a medição do custo de uma Curadoria, lida do que
        // o sistema já registrava. Fica no Administrador e NÃO no Curador —
        // cronômetro à vista de quem exerce juízo clínico pressiona o juízo.
        { label: "Medição", href: `${basePath}/medicao`, icon: "analytics" },
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
    // O Painel Concierge, o Funil, Tarefas e Agenda saíram (ADR-075): o
    // trabalho do Concierge vive em /acompanhamento (a home do papel, por
    // role-home.ts) e os atos comerciais vivem na ficha de cada contato.
    groups.push({
      label: "Dashboard",
      items: [{ label: "Acompanhamento", href: "/acompanhamento", icon: "dashboard" }],
    });
    groups.push({
      label: "Concierge",
      items: [
        {
          label: "Contatos",
          href: `${basePath}/crm/contatos`,
          icon: "contacts",
        },
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
