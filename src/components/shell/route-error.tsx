type RouteErrorProps = {
  reset: () => void;
};

// Mensagem sempre genérica (docs/DESIGN_SYSTEM.md, seção 7) — nunca detalhe
// técnico, stack trace ou nome de recurso interno.
export function RouteError({ reset }: RouteErrorProps) {
  return (
    <div>
      <h1>Algo não saiu como esperado</h1>
      <p>Não foi possível concluir esta etapa agora. Tente novamente.</p>
      <button type="button" onClick={reset}>
        Tentar novamente
      </button>
    </div>
  );
}
