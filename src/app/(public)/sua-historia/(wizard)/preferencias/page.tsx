import { redirect } from "next/navigation";

// CORTE DE 23/08 · a preferência de modalidade fundiu-se ao passo
// "Há algo importante?". A rota permanece como redirect pelo mesmo motivo
// de /sua-historia/motivo: rascunhos antigos com `currentStep =
// "preferencias"` retomam sem cair em tela morta.
export default function PreferenciasPage() {
  redirect("/sua-historia/informacoes");
}
