"use client";

import { useTransition } from "react";

import { Button } from "@/components/ui/button";

/**
 * Ativar / Desativar — com a tela obedecendo ao que foi gravado.
 *
 * Era um `<form action={serverAction}>` dentro do server component da etapa. A
 * ação gravava e chamava `revalidatePath(..., "layout")`, mas o selo do
 * cabeçalho continuava dizendo "Ativo" depois de desativar: `revalidatePath`
 * limpa o cache do SERVIDOR e não obriga este cliente a rebuscar. Quem operava
 * clicava de novo, achando que o primeiro clique não tinha pegado — e o segundo
 * clique reativava.
 *
 * Não dá para chamar `router.refresh()` de um server component; por isso este
 * pedacinho de cliente existe. É a mesma correção aplicada ao painel de
 * publicação, e a mesma razão pela qual os links de etapa são `<a>` e não
 * `<Link>`: nesta aplicação, o que o servidor grava só chega à tela quando
 * alguém manda buscar de novo.
 */
export function BotaoCicloDoProfissional({
  acao,
  rotulo,
}: {
  acao: (formData: FormData) => Promise<void>;
  rotulo: string;
}) {
  const [pendente, iniciar] = useTransition();

  return (
    <form
      action={(formData) => {
        iniciar(async () => {
          await acao(formData);
          // RECARGA INTEIRA, não `router.refresh()`: o que muda aqui é o selo
          // "Ativo / Inativo" do CABEÇALHO, e para ele o rebusco ficou
          // intermitente — apareceu numa execução e faltou na seguinte, com o
          // servidor certo nas duas. Ativar e desativar acontecem raramente e
          // decidem se a pessoa é vista por pacientes; um selo que mente aqui
          // custa mais que um piscar de tela. Pelo mesmo motivo, publicar
          // também recarrega (ver `publication-panel.tsx`).
          window.location.reload();
        });
      }}
    >
      <Button type="submit" variant="secondary" className="w-full sm:w-auto" isLoading={pendente}>
        {rotulo}
      </Button>
    </form>
  );
}
