import { redirect } from "next/navigation";

import { professionalWorkflowStepHref } from "@/modules/profiles/professional-workflow";

/**
 * A ficha do profissional sem etapa nomeada cai na primeira.
 *
 * Existe porque a etapa saiu da QUERY e entrou no CAMINHO. Com
 * `?etapa=publicacao`, todas as seis etapas eram a mesma rota, e o roteador
 * do Next tratava a troca como navegação já satisfeita: a URL não mudava e a
 * tela ficava parada. Medido — depois de recarregar a página ou de salvar,
 * clicar numa etapa simplesmente não ia a lugar nenhum.
 *
 * Com a etapa no caminho, cada uma é uma rota própria e a navegação volta a
 * ser navegação. Este arquivo guarda a porta antiga: link salvo, histórico e
 * o retorno da criação continuam funcionando.
 */
export default async function FichaSemEtapa({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(professionalWorkflowStepHref(id, "cadastro"));
}
