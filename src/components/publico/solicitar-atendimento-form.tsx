"use client";

import Link from "next/link";
import { useState } from "react";

import {
  MENSAGEM_DE_SUCESSO,
  type CampoPermitido,
  type Destinatario,
} from "@/modules/crm/solicitacao-publica";

/**
 * FALE COM A ALIVIAR — o formulário público.
 *
 * @metodo Experience §3 — a porta de entrada pede o mínimo para procurar a pessoa, e nada mais.
 * @metodo Fundamentos §10 — o que é de saúde se conversa com gente, nunca num campo de formulário.
 *
 * Por que existe: até aqui não havia por onde entrar. Quem descobria a Aliviar
 * não tinha caminho — e o único formulário público que existia pedia história
 * clínica antes de existir uma pessoa do outro lado.
 *
 * ⛔ **Nada de saúde nesta página.** Cinco campos, todos sobre como procurar
 * você. O consentimento nasce desmarcado — consentimento que já vem dado não é
 * consentimento. E a confirmação **não promete prazo**: prometer data que não
 * se controla é a primeira mentira pequena.
 */
export function SolicitarAtendimentoForm() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [destinatario, setDestinatario] = useState<Destinatario>("para_mim");
  const [consentimento, setConsentimento] = useState(false);
  const [website, setWebsite] = useState("");

  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<{ campo: CampoPermitido | "payload"; mensagem: string } | null>(null);
  const [enviado, setEnviado] = useState(false);

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    if (enviando) return;
    setErro(null);
    setEnviando(true);
    try {
      const resposta = await fetch("/api/solicitacoes-atendimento", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ nome, email, telefone, destinatario, consentimento, website }),
      });
      if (resposta.ok) {
        setEnviado(true);
        return;
      }
      const corpo = (await resposta.json().catch(() => null)) as
        | { campo?: CampoPermitido | "payload"; mensagem?: string }
        | null;
      // O que a pessoa digitou permanece na tela: refazer tudo por causa de um
      // campo é castigo, e ninguém volta depois disso.
      setErro({
        campo: corpo?.campo ?? "payload",
        mensagem: corpo?.mensagem ?? "Não conseguimos enviar agora. Tente de novo em instantes.",
      });
    } catch {
      setErro({ campo: "payload", mensagem: "Não conseguimos enviar agora. Tente de novo em instantes." });
    } finally {
      setEnviando(false);
    }
  }

  if (enviado) {
    return (
      <div className="max-w-reading space-y-3" role="status">
        <h2 className="font-serif text-2xl text-ink">{MENSAGEM_DE_SUCESSO}</h2>
        <p className="text-sm leading-relaxed text-ink-muted">
          Você não precisa fazer mais nada agora.
        </p>
      </div>
    );
  }

  const erroDe = (campo: CampoPermitido) => (erro?.campo === campo ? erro.mensagem : null);

  return (
    <form onSubmit={enviar} noValidate className="max-w-reading space-y-6">
      {erro && (erro.campo === "payload" || erro.campo === "website") ? (
        <p role="alert" className="rounded-md border border-error bg-error-surface px-3 py-2 text-sm text-ink">
          {erro.mensagem}
        </p>
      ) : null}

      <Campo id="nome" rotulo="Seu nome" erro={erroDe("nome")}>
        <input
          id="nome"
          name="nome"
          type="text"
          autoComplete="name"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className={entrada}
        />
      </Campo>

      <Campo id="email" rotulo="E-mail" dica="E-mail ou telefone — basta um." erro={erroDe("email")}>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={entrada}
        />
      </Campo>

      <Campo id="telefone" rotulo="Telefone" erro={erroDe("telefone")}>
        <input
          id="telefone"
          name="telefone"
          type="tel"
          autoComplete="tel"
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
          className={entrada}
        />
      </Campo>

      <fieldset className="space-y-2">
        <legend className="block text-sm font-medium text-ink">É para você ou para outra pessoa?</legend>
        {(
          [
            ["para_mim", "Para mim"],
            ["para_outra_pessoa", "Para outra pessoa"],
          ] as const
        ).map(([valor, rotulo]) => (
          <label key={valor} className="flex min-h-11 items-center gap-2 text-sm text-ink">
            <input
              type="radio"
              name="destinatario"
              value={valor}
              checked={destinatario === valor}
              onChange={() => setDestinatario(valor)}
              className="size-4"
            />
            {rotulo}
          </label>
        ))}
        {erroDe("destinatario") ? (
          <p role="alert" className="text-sm text-error">
            {erroDe("destinatario")}
          </p>
        ) : null}
      </fieldset>

      {/* Honeypot: fora da ordem de Tab e escondido de quem enxerga, mas sem
          mentir para leitor de tela — `aria-hidden` cobre a tecnologia
          assistiva, e `tabIndex={-1}` tira do caminho do teclado. */}
      <div aria-hidden="true" className="pointer-events-none absolute left-[-9999px] size-px overflow-hidden">
        <label htmlFor="website">Não preencha este campo</label>
        <input
          id="website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="consentimento" className="flex min-h-11 items-start gap-2 text-sm leading-relaxed text-ink">
          <input
            id="consentimento"
            name="consentimento"
            type="checkbox"
            checked={consentimento}
            onChange={(e) => setConsentimento(e.target.checked)}
            className="mt-1 size-4"
          />
          <span>
            Autorizo a Aliviar a entrar em contato comigo e li a{" "}
            <Link
              href="/privacidade"
              className="font-medium text-brand-primary underline underline-offset-4"
            >
              política de privacidade
            </Link>
            .
          </span>
        </label>
        {erroDe("consentimento") ? (
          <p role="alert" className="text-sm text-error">
            {erroDe("consentimento")}
          </p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={enviando}
        className="inline-flex min-h-11 items-center gap-2 rounded-md bg-brand-primary px-5 py-2.5 text-sm font-medium text-surface transition-colors duration-fast ease-standard hover:bg-brand-primary-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-70"
      >
        {enviando ? "Enviando…" : "Enviar pedido"}
      </button>
    </form>
  );
}

const entrada =
  "w-full rounded-sm border border-border bg-surface px-3 py-2.5 text-sm text-ink min-h-11 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-1 focus-visible:ring-offset-surface";

function Campo({
  id,
  rotulo,
  dica,
  erro,
  children,
}: {
  id: string;
  rotulo: string;
  dica?: string;
  erro: string | null;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {rotulo}
      </label>
      {dica ? <p className="text-xs text-ink-muted">{dica}</p> : null}
      {children}
      {erro ? (
        <p role="alert" className="text-sm text-error">
          {erro}
        </p>
      ) : null}
    </div>
  );
}
