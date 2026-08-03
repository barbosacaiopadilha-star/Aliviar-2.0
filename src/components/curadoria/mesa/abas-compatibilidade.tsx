"use client";

/**
 * COMPATIBILIDADE — duas abas, uma leitura por vez (ADR-065).
 *
 * Assistencial (o Motor de Compatibilidade vigente, intocado) e Relacional
 * (a quarta leitura). As abas nunca somam, nunca comparam entre si e nunca
 * sugerem promoção — cada leitura informa por conta própria.
 */

import { useState } from "react";

import { cn } from "@/components/ui/cn";

const ABAS = [
  { id: "assistencial", label: "Assistencial" },
  { id: "relacional", label: "Relacional" },
] as const;

type AbaId = (typeof ABAS)[number]["id"];

export function AbasCompatibilidade({
  assistencial,
  relacional,
}: {
  assistencial: React.ReactNode;
  relacional: React.ReactNode;
}) {
  const [ativa, setAtiva] = useState<AbaId>("assistencial");

  return (
    <div className="space-y-4">
      <div role="tablist" aria-label="Leituras de compatibilidade" className="flex gap-2">
        {ABAS.map((aba) => (
          <button
            key={aba.id}
            role="tab"
            type="button"
            aria-selected={ativa === aba.id}
            onClick={() => setAtiva(aba.id)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm transition-colors",
              ativa === aba.id
                ? "bg-ink text-surface"
                : "bg-surface text-ink-muted hover:text-ink",
            )}
          >
            {aba.label}
          </button>
        ))}
      </div>
      <div role="tabpanel">{ativa === "assistencial" ? assistencial : relacional}</div>
    </div>
  );
}
