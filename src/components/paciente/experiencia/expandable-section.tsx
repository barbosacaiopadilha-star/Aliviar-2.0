"use client";

import { ChevronDown } from "lucide-react";
import { useId, useState, type ReactNode } from "react";

import { cn } from "@/components/ui/cn";

/**
 * Progressive Disclosure — o primitivo.
 *
 * A pessoa nunca recebe tudo de uma vez. O resumo fica visível; o detalhe
 * abre quando ela pede, no mesmo lugar — sem troca de página, sem perder o
 * ambiente. É o que sustenta a regra de uma ideia principal por tela.
 *
 * Acessibilidade: botão real com `aria-expanded` e `aria-controls`, região
 * com `id` correspondente. O ícone é decorativo; quem anuncia é o texto.
 */
export function ExpandableSection({
  label,
  expandedLabel,
  children,
  defaultOpen = false,
  className,
}: {
  /** O convite fechado — "Conhecer meu Perfil". */
  label: string;
  /** O convite aberto. Quando ausente, repete o fechado. */
  expandedLabel?: string;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const regionId = useId();

  return (
    <div className={className}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={regionId}
        onClick={() => setOpen((current) => !current)}
        className="group inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--color-border)] bg-white/70 px-5 text-sm font-medium text-[var(--patient-forest)] transition-colors duration-300 ease-standard hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
      >
        {open ? (expandedLabel ?? label) : label}
        <ChevronDown
          aria-hidden="true"
          className={cn("size-4 transition-transform duration-300 ease-standard", open && "rotate-180")}
        />
      </button>

      {/* Renderizado só quando aberto: leitor de tela não anuncia conteúdo
          que a pessoa não pediu, e a árvore fica do tamanho da atenção. */}
      {open ? (
        <div id={regionId} className="patient-fade-in mt-5">
          {children}
        </div>
      ) : (
        <div id={regionId} hidden />
      )}
    </div>
  );
}
