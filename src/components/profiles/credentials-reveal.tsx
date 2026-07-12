"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";

type CredentialsRevealProps = {
  email: string;
  password: string;
};

// Mostrado apenas uma vez, no momento em que a senha é gerada — nunca
// persistido no cliente (sem localStorage/sessionStorage), nunca
// recuperável depois de sair desta tela (correção de regra de negócio,
// seção 2 e 3).
export function CredentialsReveal({ email, password }: CredentialsRevealProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(`E-mail: ${email}\nSenha: ${password}`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card className="border-brand-sage/40 bg-brand-sage-light/10">
      <CardHeader>
        <h2 className="font-sans text-lg font-semibold text-ink">Credenciais de acesso</h2>
        <p className="text-sm text-ink-muted">
          Anote ou copie agora — esta senha não poderá ser consultada novamente. Entregue-a ao
          paciente por um canal seguro.
        </p>
      </CardHeader>

      <dl className="space-y-3 text-sm">
        <div>
          <dt className="font-medium text-ink">Login (e-mail)</dt>
          <dd className="mt-1 break-all rounded-sm border border-border bg-surface px-3 py-2 font-mono text-ink">
            {email}
          </dd>
        </div>
        <div>
          <dt className="font-medium text-ink">Senha</dt>
          <dd className="mt-1 break-all rounded-sm border border-border bg-surface px-3 py-2 font-mono text-ink">
            {password}
          </dd>
        </div>
      </dl>

      <Button
        type="button"
        variant="secondary"
        onClick={handleCopy}
        className="mt-4 w-full sm:w-auto"
      >
        {copied ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
        {copied ? "Copiado" : "Copiar credenciais"}
      </Button>
    </Card>
  );
}
