import { redirect } from "next/navigation";

/**
 * A ficha CRM do contato FUNDIU com a ficha do Atendimento (21/08): a mesma
 * pessoa tinha duas fichas, e a que sobrou é a da jornada — que absorveu o
 * registro (interações, tarefas, agenda, linha do tempo). Endereço salvo não
 * vira 404: cai na ficha única. O arquivo existe (em vez de um redirect no
 * next.config) porque `/admin/crm/contatos/novo` é rota irmã e um redirect de
 * `:id` no config a engoliria.
 */
export default async function CrmContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/atendimento/${id}`);
}
