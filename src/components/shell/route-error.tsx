"use client";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

type RouteErrorProps = {
  reset: () => void;
};

export function RouteError({ reset }: RouteErrorProps) {
  return (
    <div className="mx-auto max-w-reading py-10">
      <Alert variant="error" title="Algo não saiu como esperado">
        Não foi possível concluir esta etapa agora. Você pode tentar novamente.
      </Alert>
      <div className="mt-6">
        <Button type="button" onClick={reset} className="w-auto">
          Tentar novamente
        </Button>
      </div>
    </div>
  );
}
