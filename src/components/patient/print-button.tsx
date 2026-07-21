"use client";

import { Button } from "@/components/ui/button";

// "Baixar em PDF" via impressão nativa do navegador — todo navegador
// moderno oferece "Salvar como PDF" como destino de impressão, então isto
// já é um download de PDF real sem depender de uma biblioteca de geração
// de PDF no servidor. print:hidden garante que o próprio botão nunca
// aparece no documento impresso/salvo.
export function PrintButton() {
  return (
    <Button
      type="button"
      variant="secondary"
      className="w-auto print:hidden"
      onClick={() => window.print()}
    >
      Imprimir ou salvar como PDF
    </Button>
  );
}
