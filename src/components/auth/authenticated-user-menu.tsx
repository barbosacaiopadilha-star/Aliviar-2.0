"use client";

/**
 * Menu ÚNICO de usuário autenticado da plataforma — Administrador, Atendente, Curador, Concierge e Paciente usam exatamente esta peça. Nunca criar variação por módulo.
 *
 * @metodo Fundamentos §13 — o operador humano é identificável em todo momento
 * @metodo Experience §3 — saída segura e papel visível reduzem ansiedade
 *
 * Por que existe: o Curador precisa ver seu nome real, papel e encerrar sessão
 * com um clique — nunca um nome fictício ou texto solto sem menu.
 */

import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { LogoutButton } from "@/components/auth/logout-button";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/components/ui/cn";

type AuthenticatedUserMenuProps = {
  displayName: string;
  roleLabel: string;
};

export function AuthenticatedUserMenu({ displayName, roleLabel }: AuthenticatedUserMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // pointerdown cobre mouse E touch com um único listener. Importante: o
    // clique DENTRO do menu não fecha nada aqui (contains = true) — o item
    // executa o próprio handler antes de qualquer fechamento. Fechar no
    // pointerdown de fora nunca corta um clique de dentro.
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    // Teclado é cidadão de primeira classe: Escape fecha e devolve o foco ao
    // gatilho — sem isso, quem navega por teclado fica preso no menu aberto.
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        (rootRef.current?.querySelector("button[aria-haspopup]") as HTMLButtonElement | null)?.focus();
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  const initials = displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div ref={rootRef} className="relative">
      {/* aria-label fixo: abaixo de `sm` o nome some do gatilho e, sem isto,
          o botão viraria um avatar sem nome acessível. min-h-11: área de
          toque de 44px no mobile. O chevron é a indicação visual de que
          existe um menu — e gira quando aberto, sem depender só de cor. */}
      <button
        type="button"
        aria-label={`Menu do usuário — ${displayName}, ${roleLabel}`}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "flex min-h-11 items-center gap-2 rounded-full border border-border bg-surface px-2 py-1.5 pl-1.5 pr-2.5",
          "transition-colors duration-fast ease-standard hover:bg-canvas",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2",
        )}
      >
        <Avatar name={displayName || initials || "?"} className="size-7 text-xs" size="sm" />
        <span className="hidden text-left sm:block">
          <span className="block max-w-[10rem] truncate text-sm font-medium text-ink">{displayName}</span>
          <span className="block text-xs text-ink-muted">{roleLabel}</span>
        </span>
        <ChevronDown
          aria-hidden="true"
          className={cn(
            "size-4 shrink-0 text-ink-muted transition-transform duration-fast ease-standard",
            open && "rotate-180",
          )}
        />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-dropdown mt-2 w-56 rounded-md border border-border bg-surface p-2 shadow-md"
        >
          <div className="border-b border-border px-3 py-2">
            <p className="truncate text-sm font-medium text-ink">{displayName}</p>
            <p className="text-xs text-ink-muted">{roleLabel}</p>
          </div>
          {/* "Alterar senha" leva ao fluxo de redefinição por e-mail — o único
              que existe hoje. Quando houver página de conta, entra aqui como
              "Minha conta". */}
          <Link
            role="menuitem"
            href="/recuperar-senha"
            onClick={() => setOpen(false)}
            className="mt-2 flex min-h-10 items-center rounded-md px-3 text-sm text-ink transition-colors hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          >
            Alterar senha
          </Link>
          <div role="separator" className="my-2 border-t border-border" />
          <LogoutButton className="justify-center" />
        </div>
      ) : null}
    </div>
  );
}
