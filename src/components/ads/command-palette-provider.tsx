"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

import { CommandPalette } from "./command-palette";
import type { NavGroup } from "@/components/shell/nav-items";

type CommandPaletteContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const CommandPaletteContext = createContext<CommandPaletteContextValue | null>(null);

export function useCommandPalette() {
  const ctx = useContext(CommandPaletteContext);
  if (!ctx) {
    throw new Error("useCommandPalette deve ser usado dentro de CommandPaletteProvider");
  }
  return ctx;
}

type CommandPaletteProviderProps = {
  children: ReactNode;
  navGroups: NavGroup[];
  role: string;
  basePath: string;
};

export function CommandPaletteProvider({ children, navGroups, role, basePath }: CommandPaletteProviderProps) {
  const [open, setOpen] = useState(false);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      setOpen((current) => !current);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <CommandPaletteContext.Provider value={{ open, setOpen }}>
      {children}
      <CommandPalette
        open={open}
        onClose={() => setOpen(false)}
        navGroups={navGroups}
        role={role}
        basePath={basePath}
      />
    </CommandPaletteContext.Provider>
  );
}
