"use client";

/**
 * Menu ÚNICO de usuário autenticado da plataforma — Administrador, Atendente, Curador, Concierge e Paciente usam exatamente esta peça. Nunca criar variação por módulo.
 *
 * @metodo Fundamentos §13 — o operador humano é identificável em todo momento
 * @metodo Experience §3 — saída segura e papel visível reduzem ansiedade
 *
 * BUG DE PRODUÇÃO corrigido (2026-07-24, reportado pelo Fundador): os itens
 * do menu recebiam hover mas NÃO recebiam clique — só teclado funcionava.
 * Causa raiz comprovada por sonda com clique real (Playwright): os headers
 * do Paciente e dos Portais criam stacking context sem z-index
 * (`backdrop-filter`), que pinta ATOMICAMENTE na ordem do documento. O
 * dropdown ficava aprisionado nessa camada, e o `main` — que vem depois no
 * DOM — pintava por cima da parte do menu que desce sobre o conteúdo,
 * engolindo os cliques. Teclado ignora sobreposição, por isso TAB+Space
 * funcionava.
 *
 * Por isso o menu agora renderiza em PORTAL no document.body, com posição
 * fixa calculada a partir do gatilho: nenhum stacking context de header — o
 * de hoje ou o que inventarem amanhã — volta a capturá-lo.
 */

import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { LogoutButton } from "@/components/auth/logout-button";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/components/ui/cn";

type AuthenticatedUserMenuProps = {
  displayName: string;
  roleLabel: string;
};

export function AuthenticatedUserMenu({ displayName, roleLabel }: AuthenticatedUserMenuProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; right: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Posição fixa derivada do gatilho: alinhado à direita dele, logo abaixo.
  // Recalculada em scroll/resize enquanto aberto — `position: fixed` não
  // acompanha o documento sozinho.
  const reposition = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPosition({ top: rect.bottom + 8, right: Math.max(8, window.innerWidth - rect.right) });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    reposition();
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [open, reposition]);

  useEffect(() => {
    // pointerdown cobre mouse E touch. Com o menu em portal, "dentro" são
    // DUAS árvores: o gatilho e o menu — as duas contam como dentro. Clique
    // em item nunca é cortado: contains = true → nada fecha antes do handler.
    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (!triggerRef.current?.parentElement?.contains(target) && !menuRef.current?.contains(target)) {
        setOpen(false);
      }
    }
    // Escape fecha e devolve o foco ao gatilho — teclado nunca fica preso.
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
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
    <div className="relative">
      {/* aria-label fixo: abaixo de `sm` o nome some do gatilho e, sem isto,
          o botão viraria um avatar sem nome acessível. min-h-11: área de
          toque de 44px no mobile. O chevron é a indicação visual de que
          existe um menu — e gira quando aberto, sem depender só de cor. */}
      <button
        ref={triggerRef}
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

      {open && position
        ? createPortal(
            <div
              ref={menuRef}
              role="menu"
              style={{ top: position.top, right: position.right }}
              className="fixed z-dropdown w-56 rounded-md border border-border bg-surface p-2 shadow-md"
            >
              <div className="border-b border-border px-3 py-2">
                <p className="truncate text-sm font-medium text-ink">{displayName}</p>
                <p className="text-xs text-ink-muted">{roleLabel}</p>
              </div>
              {/* "Alterar senha" leva ao fluxo de redefinição por e-mail — o
                  único que existe hoje. Quando houver página de conta, entra
                  aqui como "Minha conta". */}
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
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
