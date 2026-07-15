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
      {/* Progressão Hierárquica (Fase 3): evidência medida em navegador
          mostrou que o branco sólido da variante secondary tem mais
          contraste de luminância que o navy da primária contra o
          gradiente escuro do CTA final, competindo pela atenção.
          Modificador de opacidade em cor (`bg-surface/NN`) foi testado e
          descartado — as cores do sistema estão definidas como hex puro
          em globals.css, não como tripla RGB, então o Tailwind não
          consegue misturar alpha nelas (confirmado: renderizou totalmente
          transparente). `opacity` no elemento inteiro é o mecanismo
          padrão do CSS, sem essa dependência — 90% é sutil o bastante
          para não parecer desabilitado, preservando cor, borda, hover e
          foco intactos. Nenhuma mudança em link-button.tsx. */}
      <LinkButton href="https://wa.me/message" variant="secondary" className="opacity-90">
        Conversar pelo WhatsApp
      </LinkButton>
    </div>
  );
}
