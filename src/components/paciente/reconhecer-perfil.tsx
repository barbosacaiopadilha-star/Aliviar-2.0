"use client";

import { useEffect, useRef, useState } from "react";

import {
  ACKNOWLEDGE_ACTION_LABEL,
  ACKNOWLEDGE_CONFIRMATION,
  DECISION_MESSAGES,
  decideAcknowledgement,
} from "@/modules/curadoria/reconhecimento-do-perfil";
import { reconhecerPerfilAction } from "@/modules/paciente/reconhecimento-actions";

/**
 * O ato dela, na tela dela — ADR-042.
 *
 * Antes este botão não existia: quem registrava o "reconhecimento da paciente"
 * era o Curador, dentro do Priority Builder, e só depois que os 100 pontos
 * fechassem. O ato era descrito como dela e executado por outra pessoa.
 *
 * A confirmação diz O QUE VAI ACONTECER em vez de "tem certeza?"
 * (EXPERIENCE_BIBLE): ela está congelando o Perfil, e isso é a Invariante 28 —
 * corrigir exige construir um novo junto com a Curadoria.
 */
export function ReconhecerPerfil({
  caseId,
  pendentes,
  validated,
}: {
  caseId: string;
  pendentes: number;
  validated: boolean;
}) {
  const [confirmando, setConfirmando] = useState(false);
  /** C4 — "deixar pendente" é escolha dela, não ausência de escolha. Vive só
      na tela: PENDENTE já é o estado no banco, e praticá-lo não escreve nada. */
  const [adiado, setAdiado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, setPendente] = useState(false);
  const [sessaoExpirada, setSessaoExpirada] = useState(false);
  // Bloco D: o reload disparou mas o documento não trocou (RECONHECE-
  // REFRESH-001) — depois do timeout de segurança, o spinner dá lugar a uma
  // mensagem honesta com o caminho manual. O RPC JÁ persistiu neste ponto.
  const [recarregarManualmente, setRecarregarManualmente] = useState(false);
  const reloadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (reloadTimeoutRef.current) clearTimeout(reloadTimeoutRef.current);
    };
  }, []);

  const decisao = decideAcknowledgement(validated ? "VALIDATED" : "DRAFT", pendentes);

  if (decisao === "JA_RECONHECIDO") return null;

  // Mapa incompleto não é falha dela — é o trabalho ainda acontecendo. A tela
  // conta o estado em vez de mostrar um botão desabilitado sem explicação.
  if (decisao !== "PODE_RECONHECER") {
    return (
      <p className="mt-5 max-w-reading text-sm leading-relaxed text-ink-muted">
        {DECISION_MESSAGES[decisao]}
      </p>
    );
  }

  const confirmar = async () => {
    setErro(null);
    setSessaoExpirada(false);
    setPendente(true);
    const resultado = await reconhecerPerfilAction({ caseId });
    if (!resultado.success) {
      setPendente(false);
      // Por código discriminado, nunca por substring: sessão expirada é
      // reentrada — jamais a acusação "Este Perfil não é seu." (Bloco D).
      if (resultado.code === "SESSAO_EXPIRADA") {
        setSessaoExpirada(true);
      } else {
        setErro(resultado.error);
      }
      setConfirmando(false);
      return;
    }
    // Navegação de documento completa, DEPOIS de a action retornar — não
    // router.refresh(). Diagnóstico instrumentado (2026-08-02, três
    // variantes): a action resolvia, o flight RSC de /paciente chegava
    // completo (28 KB em ~300ms, estado novo dentro, zero erros, todos os
    // chunks no disco) e o router do Next 15.5.20 nunca commitava a árvore —
    // "Registrando…" eterno. O GET de documento da mesma rota fecha em
    // ~280ms e mostra o ato dela. Dívida registrada: RECONHECE-REFRESH-001
    // (docs/BACKLOG_TECNICO.md). `pendente` fica true de propósito até a
    // navegação trocar o documento.
    window.location.reload();
    // Rede de segurança (Bloco D): se em 8s o documento não trocou, nada de
    // spinner eterno — o reconhecimento JÁ está registrado, e a mensagem
    // honesta com o botão de recarregar assume o lugar do "Registrando…".
    reloadTimeoutRef.current = setTimeout(() => setRecarregarManualmente(true), 8000);
  };

  // O reload não trocou o documento, mas o ato dela JÁ está registrado —
  // a verdade, com o caminho manual, no lugar do spinner eterno.
  if (recarregarManualmente) {
    return (
      <div className="mt-5 space-y-3">
        <p role="status" className="max-w-reading text-sm leading-relaxed text-ink">
          Seu reconhecimento foi registrado. Recarregue a página para continuar.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="inline-flex min-h-11 items-center rounded-md bg-brand-primary px-4 py-2.5 text-sm font-medium text-surface transition-colors duration-fast ease-standard hover:bg-brand-primary-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
        >
          Recarregar a página
        </button>
      </div>
    );
  }

  return (
    <div className="mt-5 space-y-3">
      <p className="max-w-reading text-sm leading-relaxed text-ink">
        Este retrato representa corretamente o que é importante para você? Se algo não estiver com a
        sua cara, fale com seu Curador antes de confirmar — dá tempo, e revisar é normal.
      </p>

      {confirmando ? (
        <div className="space-y-3">
          <p className="max-w-reading text-sm leading-relaxed text-ink">{ACKNOWLEDGE_CONFIRMATION}</p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={confirmar}
              disabled={pendente}
              className="inline-flex min-h-11 items-center rounded-md bg-brand-primary px-4 py-2.5 text-sm font-medium text-surface transition-colors duration-fast ease-standard hover:bg-brand-primary-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 disabled:opacity-60"
            >
              {pendente ? "Registrando…" : "Sim, confirmar"}
            </button>
            <button
              type="button"
              onClick={() => setConfirmando(false)}
              disabled={pendente}
              className="inline-flex min-h-11 items-center rounded-md border border-[color-mix(in_srgb,var(--color-ink-muted)_30%,transparent)] px-4 py-2.5 text-sm text-ink transition-colors duration-fast ease-standard hover:bg-[color-mix(in_srgb,var(--color-ink)_5%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
            >
              Ainda não
            </button>
          </div>
        </div>
      ) : adiado ? (
        // C4 — DEIXAR PENDENTE, o desfecho que não escreve nada.
        //
        // PENDENTE é o estado em que o reconhecimento já nasce: praticá-lo é
        // não praticar nenhum outro. Por isso aqui não há action, não há RPC e
        // não há estado novo — só a verdade dita em voz alta, para que "ainda
        // não" deixe de ser silêncio e passe a ser uma escolha dela.
        <div className="mt-5 space-y-3">
          <p role="status" className="max-w-reading text-sm leading-relaxed text-ink">
            Nada foi registrado, e nada mudou. Este Perfil continua com você — volte quando quiser,
            e fale com seu Curador se algo aqui não estiver com a sua cara.
          </p>
          <button
            type="button"
            onClick={() => setAdiado(false)}
            className="inline-flex min-h-11 items-center rounded-md border border-[color-mix(in_srgb,var(--color-ink-muted)_30%,transparent)] px-4 py-2.5 text-sm text-ink transition-colors duration-fast ease-standard hover:bg-[color-mix(in_srgb,var(--color-ink)_5%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
          >
            Voltar às opções
          </button>
        </div>
      ) : (
        // C6 — os dois desfechos praticáveis hoje ficam lado a lado, no mesmo
        // lugar, a um passo cada. Nenhum deles é o caminho "de saída".
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setConfirmando(true)}
            className="inline-flex min-h-11 items-center rounded-md bg-brand-primary px-4 py-2.5 text-sm font-medium text-surface transition-colors duration-fast ease-standard hover:bg-brand-primary-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
          >
            {ACKNOWLEDGE_ACTION_LABEL}
          </button>
          <button
            type="button"
            onClick={() => setAdiado(true)}
            className="inline-flex min-h-11 items-center rounded-md border border-[color-mix(in_srgb,var(--color-ink-muted)_30%,transparent)] px-4 py-2.5 text-sm text-ink transition-colors duration-fast ease-standard hover:bg-[color-mix(in_srgb,var(--color-ink)_5%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
          >
            Ainda não quero confirmar
          </button>
        </div>
      )}

      {sessaoExpirada ? (
        <p role="alert" className="max-w-reading text-sm leading-relaxed text-ink">
          Sua sessão expirou. Entre novamente para continuar — nada do que você fez aqui se
          perdeu.{" "}
          <a
            href={`/login?next=${encodeURIComponent("/paciente")}`}
            className="font-medium text-brand-primary underline-offset-2 hover:underline"
          >
            Entrar novamente
          </a>
        </p>
      ) : null}

      {erro ? (
        <p role="alert" className="max-w-reading text-sm leading-relaxed text-ink">
          {erro}
        </p>
      ) : null}
    </div>
  );
}
