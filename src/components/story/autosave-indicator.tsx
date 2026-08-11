"use client";

import { Check } from "lucide-react";
import { usePathname } from "next/navigation";

import { STORY_ALREADY_SUBMITTED_ERROR, useStoryDraft } from "@/modules/story/use-story-draft";

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
  const { isSaving, data, saveError, sessionExpired, status } = useStoryDraft();
  const pathname = usePathname();
  const hasAnyAnswer = Object.values(data).some((value) => Boolean(value));

  /**
   * A5.1 · HISTÓRIA ENVIADA NÃO É FALHA DE GRAVAÇÃO.
   *
   * A recusa por "já enviada" chegava aqui como `saveError` qualquer e caía no
   * ramo de erro, que a emoldurava assim:
   *
   *   "Sua última resposta ainda não foi salva — o texto está guardado neste
   *    dispositivo. Esta história já foi enviada e não pode mais ser editada."
   *
   * Duas afirmações incompatíveis na mesma frase — e a primeira metade era
   * **falsa duas vezes**: não havia resposta pendente de gravação, e o texto
   * não estava guardado no dispositivo, porque o próprio `runPersist` chama
   * `clearStoryCache` exatamente nesse caso.
   *
   * O fato que distingue já existia: `status`. Ele vem do registro, não de
   * substring nem de rota nem do passo do wizard.
   */
  const enviada = status === "enviada" || saveError === STORY_ALREADY_SUBMITTED_ERROR;

  if (enviada) {
    return (
      <p className="max-w-reading text-xs leading-relaxed text-ink-muted" role="status">
        Sua história já está com a Aliviar e não recebe mais edições. Um Curador vai lê-la
        inteira.
      </p>
    );
  }

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
