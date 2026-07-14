import { LinkButton } from "@/components/landing/link-button";

// Duas portas de entrada, nunca um CTA de venda — absorve o papel do
// antigo ConciergeSection (caminho guiado via WhatsApp) como a segunda
// opção do encerramento, em vez de uma seção própria.
export function FinalActions() {
  return (
    <div className="flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row">
      <LinkButton href="/sua-historia" variant="primary">
        Contar minha história
      </LinkButton>
      <LinkButton href="https://wa.me/message" variant="secondary">
        Conversar pelo WhatsApp
      </LinkButton>
    </div>
  );
}
