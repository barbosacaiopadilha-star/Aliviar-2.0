import type { ReactNode } from "react";

import { cn } from "@/components/ui/cn";

type FormFieldProps = {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
  /**
   * Esconde o rótulo visualmente, mantendo-o para leitores de tela.
   * Existe para as telas de conversa (Recepção): quando a pergunta em serifa
   * já é a pergunta, um rótulo "Sua resposta" acima do campo é a única
   * palavra de formulário na tela — o campo abaixo de uma pergunta é
   * evidentemente onde se responde (validação 2.4, mudança F).
   */
  hideLabel?: boolean;
};

export function FormField({
  label,
  htmlFor,
  error,
  hint,
  children,
  className,
  hideLabel = false,
}: FormFieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label
        htmlFor={htmlFor}
        className={cn("block text-sm font-medium text-ink", hideLabel && "sr-only")}
      >
        {label}
      </label>
      {children}
      {hint && !error ? (
        <p id={`${htmlFor}-hint`} className="text-sm text-ink-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${htmlFor}-error`} role="alert" className="text-sm text-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
