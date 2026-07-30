"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { startConsultationAction } from "@/modules/curadoria/actions";

/**
 * Abrir o Perfil de Prioridades desta pessoa.
 *
 * @metodo Fundamentos §10 — o Perfil de Prioridades é o primeiro patrimônio construído em conjunto
 * @metodo Experience §5 — UX3: o próximo passo é visível e nomeado pelo que faz
 *
 * M4: sem consumidor em rota alguma hoje — candidato a remoção física na M5.
 *
 * Por que existe: sem um Perfil aberto, a etapa Mapa de Prioridades não tem onde
 * gravar nem um requisito nem uma classificação — e a tela dizia "o Perfil precisa ser
 * criado antes desta etapa" sem oferecer como. Um aviso que não resolve o que
 * anuncia é um beco sem saída, e beco sem saída é a forma mais cara de carga
 * cognitiva: a pessoa procura em todo lugar antes de concluir que não existe.
 *
 * O que nunca faz: criar o Perfil sozinho ao abrir a tela. Abrir a Consulta
 * Inicial é um ato do Curador, com autor registrado — o sistema não age em
 * nome de ninguém (UX_PRINCIPLES P5).
 */
export function StartPriorityProfile({ caseId, patientFirstName }: { caseId: string; patientFirstName: string }) {
  const router = useRouter();
  const [erro, setErro] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function abrir() {
    setErro(null);
    startTransition(async () => {
      const result = await startConsultationAction({ caseId });
      if (result.success) router.refresh();
      else setErro(result.error ?? "Não foi possível abrir o Perfil de Prioridades.");
    });
  }

  return (
    <div className="space-y-3">
      <p className="max-w-reading text-sm leading-relaxed text-ink-muted">
        O Perfil de Prioridades de {patientFirstName} ainda não foi aberto. Ele é o lugar onde ficam
        os requisitos inegociáveis e o Mapa de Prioridades — e nasce com o seu nome como autor.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" onClick={abrir} disabled={pending} isLoading={pending}>
          {pending ? "Abrindo…" : "Abrir o Perfil de Prioridades"}
        </Button>
        {erro ? (
          <span role="alert" className="text-sm text-error">
            {erro}
          </span>
        ) : null}
      </div>
    </div>
  );
}
