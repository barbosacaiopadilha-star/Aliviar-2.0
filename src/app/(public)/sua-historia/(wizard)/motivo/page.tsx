import { redirect } from "next/navigation";

// CORTE DE 23/08 · o motivo fundiu-se ao passo "Para quem é esta busca?".
// A rota permanece como redirect: rascunhos antigos gravaram
// `currentStep = "motivo"` e o `/sua-historia/continuar` os manda para cá —
// tela morta seria perder a pessoa no meio da própria história. O campo, o
// dado e o passo lógico continuam existindo; só o endereço se fundiu.
export default function MotivoPage() {
  redirect("/sua-historia/para-quem");
}
