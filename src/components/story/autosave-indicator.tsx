"use client";

import { Check } from "lucide-react";
import { usePathname } from "next/navigation";

import { useStoryDraft } from "@/modules/story/use-story-draft";

// Só lê o estado do hook já existente — nenhuma mudança na lógica de
// autosave. Comunica o estado em linguagem humana, nunca técnica ("salvando",
// nunca "revision" ou "sincronizando com o servidor").
//
// Bloco D (gate D22 / FS-02 / ADR-064 §4): "Sua resposta foi salva." só
// aparece com a persistência CONFIRMADA. Recusa mostra o erro (com a
// referência vinda do servidor) e a verdade que consola: o texto está
// guardado neste dispositivo. Sessão expirada tem frase própria e caminho de
// reentrada — detectada por estado discriminado, nunca por texto de erro.
export function AutosaveIndicator() {
  const { isSaving, data, saveError, sessionExpired } = useStoryDraft();
  const pathname = usePathname();
  const hasAnyAnswer = Object.values(data).some((value) => Boolean(value));

  if (!hasAnyAnswer && !isSaving && !saveError && !sessionExpired) {
    return null;
  }

  if (isSaving) {
    return (
      <p className="flex items-center gap-1.5 text-xs text-ink-muted" role="status" aria-live="polite">
        Salvando automaticamente…
      </p>
    );
  }

  if (sessionExpired) {
    return (
      <p className="max-w-reading text-xs leading-relaxed text-ink" role="alert">
        Sua sessão expirou. Entre novamente para continuar — seu texto está guardado neste
        dispositivo.{" "}
        <a
          href={`/login?next=${encodeURIComponent(pathname)}`}
          className="font-medium text-brand-primary underline-offset-2 hover:underline"
        >
          Entrar novamente
        </a>
      </p>
    );
  }

  if (saveError) {
    return (
      <p className="max-w-reading text-xs leading-relaxed text-ink" role="alert">
        Sua última resposta ainda não foi salva — o texto está guardado neste dispositivo.{" "}
        {saveError}
      </p>
    );
  }

  return (
    <p className="flex items-center gap-1.5 text-xs text-ink-muted" role="status" aria-live="polite">
      <Check className="size-3.5 text-success" aria-hidden="true" />
      Sua resposta foi salva.
    </p>
  );
}
