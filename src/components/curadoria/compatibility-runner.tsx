"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { computeCompatibilityAction } from "@/modules/curadoria/actions";

/**
 * Aplicar o Perfil validado à rede aprovada.
 *
 * @metodo Fundamentos §13 — P6: o universo é fechado e previamente aprovado; nunca há busca automática
 * @metodo Engine §5.3 — o Motor de Compatibilidade nunca seleciona, corta a lista, marca favorito ou desempata
 * @metodo Experience §3 — copiloto: sinaliza o que está acontecendo, nunca deixa em silêncio
 *
 * Por que existe: `computeCompatibilityAction` estava pronta e sem nenhum
 * chamador. A Mesa mostrava "Comparação ainda não executada" e parava ali —
 * um beco sem saída no meio exato da Curadoria. Não havia caminho pela
 * interface: só rodando a comparação por fora do produto.
 *
 * O que nunca faz: rodar sozinho ao abrir a tela. Aplicar o critério de alguém
 * à rede é um ato do Curador, e ele decide quando. Também nunca esconde o
 * estado: rodando, deu certo, ou falhou e por quê.
 */
export function CompatibilityRunner({
  priorityProfileId,
  patientFirstName,
  hasRun,
  eligibleCount,
}: {
  priorityProfileId: string;
  patientFirstName: string;
  /** Já existe uma comparação calculada para este Perfil. */
  hasRun: boolean;
  eligibleCount: number;
}) {
  const router = useRouter();
  const [erro, setErro] = useState<string | null>(null);
  const [concluido, setConcluido] = useState(false);
  const [pending, startTransition] = useTransition();

  function comparar() {
    setErro(null);
    setConcluido(false);
    startTransition(async () => {
      const result = await computeCompatibilityAction({ priorityProfileId });
      if (result.success) {
        setConcluido(true);
        router.refresh();
      } else {
        setErro(result.error ?? "Não foi possível calcular a compatibilidade.");
      }
    });
  }

  return (
    <Card className="space-y-4 border-brand-gold/40">
      <CardHeader>
        <CardTitle>
          {hasRun ? "Recalcular a comparação" : "Aplicar o Perfil à rede aprovada"}
        </CardTitle>
        <CardDescription>
          {hasRun
            ? `A comparação atual cobre ${eligibleCount} ${eligibleCount === 1 ? "profissional" : "profissionais"}. Recalcule se o Perfil ou a rede mudaram — a seleção que você já fez não é apagada.`
            : `Os pesos que ${patientFirstName} validou são aplicados a cada profissional da rede que já passou pelas restrições dela. O Motor calcula e explica; quem escolhe é você.`}
        </CardDescription>
      </CardHeader>

      {/* Estados: parado · calculando · deu certo · falhou. Nunca silêncio. */}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" onClick={comparar} disabled={pending} isLoading={pending}>
          {pending
            ? "Comparando com a rede…"
            : hasRun
              ? "Recalcular comparação"
              : "Comparar com a rede aprovada"}
        </Button>

        {pending ? (
          <span role="status" className="text-sm text-ink-muted">
            Aplicando cada peso a cada profissional. Isso não altera nada do Perfil.
          </span>
        ) : null}

        {concluido && !pending ? (
          <span role="status" className="text-sm text-ink-muted">
            Comparação atualizada. Os profissionais elegíveis aparecem abaixo.
          </span>
        ) : null}

        {erro ? (
          <span role="alert" className="text-sm text-error">
            {erro}
          </span>
        ) : null}
      </div>

      {!hasRun && !pending ? (
        <p className="max-w-reading text-xs leading-relaxed text-ink-muted">
          Depois disso você compara lado a lado, escolhe três caminhos e escreve o parecer de cada
          um. Nada é selecionado automaticamente.
        </p>
      ) : null}
    </Card>
  );
}
