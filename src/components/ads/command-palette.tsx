"use client";

import {
  Calendar,
  Contact,
  Filter,
  Home,
  LayoutDashboard,
  Plus,
  Search,
  Settings,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { NavGroup } from "@/components/shell/nav-items";
import { cn } from "@/components/ui/cn";
import { Dialog } from "@/components/ui/dialog";

export type CommandAction = {
  id: string;
  label: string;
  keywords?: string[];
  href?: string;
  onSelect?: () => void;
  group: string;
  icon?: React.ReactNode;
};

type CommandPaletteProps = {
  open: boolean;
  onClose: () => void;
  navGroups: NavGroup[];
  role: string;
  basePath: string;
};

const iconMap: Record<string, React.ReactNode> = {
  home: <Home className="size-4" aria-hidden="true" />,
  dashboard: <LayoutDashboard className="size-4" aria-hidden="true" />,
  contacts: <Contact className="size-4" aria-hidden="true" />,
  funnel: <Filter className="size-4" aria-hidden="true" />,
  tasks: <Calendar className="size-4" aria-hidden="true" />,
  agenda: <Calendar className="size-4" aria-hidden="true" />,
  patients: <Users className="size-4" aria-hidden="true" />,
  settings: <Settings className="size-4" aria-hidden="true" />,
  create: <Plus className="size-4" aria-hidden="true" />,
  search: <Search className="size-4" aria-hidden="true" />,
};

function quickActionsForRole(role: string, basePath: string): CommandAction[] {
  const actions: CommandAction[] = [];

  if (role === "administrador" || role === "concierge") {
    actions.push(
      {
        id: "create-contact",
        label: "Criar contato",
        keywords: ["novo", "lead", "crm"],
        href: `${basePath}/crm/contatos/novo`,
        group: "Ações rápidas",
        icon: iconMap.create,
      },
      {
        id: "search-contacts",
        label: "Buscar contatos",
        keywords: ["pesquisar", "crm", "contato"],
        href: `${basePath}/crm/contatos`,
        group: "Ações rápidas",
        icon: iconMap.search,
      },
    );
  }

  if (role === "administrador") {
    actions.push({
      id: "create-patient",
      label: "Cadastrar assistido",
      keywords: ["novo", "assistido", "paciente"],
      href: `${basePath}/pacientes/novo`,
      group: "Ações rápidas",
      icon: iconMap.create,
    });
  }

  return actions;
}

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

function matchesQuery(action: CommandAction, query: string): boolean {
  if (!query) return true;
  const haystack = normalize(`${action.label} ${action.keywords?.join(" ") ?? ""} ${action.group}`);
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  return terms.every((term) => haystack.includes(term));
}

export function CommandPalette({ open, onClose, navGroups, role, basePath }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const navigationActions = useMemo<CommandAction[]>(() => {
    return navGroups.flatMap((group) =>
      group.items.map((item) => ({
        id: `nav-${item.href}`,
        label: item.label,
        keywords: [group.label, item.label],
        href: item.href,
        group: group.label,
        icon: item.icon ? iconMap[item.icon] : iconMap.dashboard,
      })),
    );
  }, [navGroups]);

  const allActions = useMemo(
    () => [...navigationActions, ...quickActionsForRole(role, basePath)],
    [navigationActions, role, basePath],
  );

  const filtered = useMemo(
    () => allActions.filter((action) => matchesQuery(action, query)),
    [allActions, query],
  );

  const grouped = useMemo(() => {
    const map = new Map<string, CommandAction[]>();
    for (const action of filtered) {
      const list = map.get(action.group) ?? [];
      list.push(action);
      map.set(action.group, list);
    }
    return map;
  }, [filtered]);

  const flatFiltered = useMemo(() => filtered, [filtered]);

  const handleSelect = useCallback(
    (action: CommandAction) => {
      onClose();
      setQuery("");
      setActiveIndex(0);
      if (action.href) router.push(action.href);
      else action.onSelect?.();
    },
    [onClose, router],
  );

  useEffect(() => {
    if (!open) {
      setQuery("");
      setActiveIndex(0);
      return;
    }
    inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, Math.max(flatFiltered.length - 1, 0)));
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    }
    if (event.key === "Enter" && flatFiltered[activeIndex]) {
      event.preventDefault();
      handleSelect(flatFiltered[activeIndex]);
    }
  }

  let runningIndex = -1;

  return (
    <Dialog open={open} onClose={onClose} title="Paleta de comandos" className="max-w-xl p-0">
      <div className="px-4 pt-2">
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <Search className="size-4 shrink-0 text-ink-muted" aria-hidden="true" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Buscar páginas, ações e módulos…"
            aria-label="Busca global"
            className="h-11 w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-muted"
          />
          <kbd className="hidden rounded border border-border bg-canvas px-1.5 py-0.5 text-[10px] text-ink-muted sm:inline">
            ESC
          </kbd>
        </div>

        <div className="max-h-[min(24rem,60vh)] overflow-y-auto py-2" role="listbox" aria-label="Resultados">
          {flatFiltered.length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-ink-muted">
              Nenhum resultado para &ldquo;{query}&rdquo;
            </p>
          ) : (
            Array.from(grouped.entries()).map(([group, actions]) => (
              <div key={group} className="mb-2">
                <p className="px-2 py-1.5 text-xs font-medium text-ink-muted">{group}</p>
                <ul>
                  {actions.map((action) => {
                    runningIndex += 1;
                    const index = runningIndex;
                    const isActive = index === activeIndex;
                    return (
                      <li key={action.id}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={isActive}
                          onMouseEnter={() => setActiveIndex(index)}
                          onClick={() => handleSelect(action)}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-colors duration-fast ease-standard",
                            isActive ? "bg-brand-primary text-surface" : "text-ink hover:bg-canvas",
                          )}
                        >
                          <span className={cn(isActive ? "text-surface" : "text-ink-muted")}>{action.icon}</span>
                          <span>{action.label}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))
          )}
        </div>

        <div className="border-t border-border py-2 text-xs text-ink-muted">
          <kbd className="rounded border border-border bg-canvas px-1">Ctrl</kbd>
          <span className="mx-0.5">+</span>
          <kbd className="rounded border border-border bg-canvas px-1">K</kbd>
          <span className="mx-2">para abrir</span>
          <kbd className="rounded border border-border bg-canvas px-1">↑</kbd>
          <kbd className="ml-0.5 rounded border border-border bg-canvas px-1">↓</kbd>
          <span className="mx-1">navegar</span>
          {/* Enter sempre abriu o item destacado, mas a ajuda não dizia — quem
              usa teclado não tinha como descobrir sozinho. */}
          <kbd className="rounded border border-border bg-canvas px-1">Enter</kbd>
          <span className="mx-1">abrir</span>
        </div>
      </div>
    </Dialog>
  );
}
