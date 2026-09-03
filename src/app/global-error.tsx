"use client";

/**
 * ÚLTIMA FRONTEIRA — `SIM-106`.
 *
 * As fronteiras por área (`(auth)`, `admin`, `paciente`, `profissional`)
 * cobrem falha DENTRO de uma página. Nenhuma delas cobre falha no **layout
 * raiz** — se `layout.tsx` quebra, o React não tem onde montar nada e a
 * pessoa vê a tela de erro crua do navegador, sem uma palavra da Aliviar.
 * Este arquivo é o único lugar que o Next consulta nesse caso.
 *
 * Por que estilo embutido, e não as classes da casa: quando este componente
 * entra, o layout raiz falhou — e é ele quem carrega a folha de estilo e as
 * fontes. Depender de `globals.css` aqui é depender justamente do que pode
 * não ter subido. A tela é feia de propósito e funciona sempre.
 *
 * O `digest` é o único fio entre o que a pessoa viu e o log do servidor:
 * o Next o gera para erros de servidor e é o mesmo valor que aparece no
 * registro. Por isso ele é mostrado — quem liga dizendo o código encurta a
 * investigação de horas para minutos, que é a razão de `registrarErro`
 * também emitir uma referência curta (`lib/observability/erros.ts`).
 */

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // O servidor já registrou o que sabia; aqui só resta o console do
  // navegador, que é onde uma pessoa de suporte consegue olhar.
  console.error("[global-error]", error.digest ?? "sem digest", error.message);

  return (
    <html lang="pt-BR">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          backgroundColor: "#fbfaf8",
          color: "#1c1a17",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          lineHeight: 1.6,
        }}
      >
        <main style={{ maxWidth: "34rem", width: "100%" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 600, margin: "0 0 0.75rem" }}>
            Algo não saiu como esperado
          </h1>
          <p style={{ margin: "0 0 1.5rem" }}>
            A página não pôde ser carregada agora. Não é nada que você tenha feito, e nada do seu
            atendimento se perdeu. Tente novamente em instantes.
          </p>

          {error.digest ? (
            <p style={{ margin: "0 0 1.5rem", fontSize: "0.875rem", color: "#5b554d" }}>
              Se precisar falar com a equipe, informe este código:{" "}
              <code
                style={{
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                  backgroundColor: "#efece7",
                  padding: "0.125rem 0.375rem",
                  borderRadius: "0.25rem",
                }}
              >
                {error.digest}
              </code>
            </p>
          ) : null}

          <button
            type="button"
            onClick={reset}
            style={{
              appearance: "none",
              border: "1px solid #1c1a17",
              borderRadius: "0.5rem",
              backgroundColor: "#1c1a17",
              color: "#fbfaf8",
              padding: "0.625rem 1.25rem",
              fontSize: "1rem",
              fontFamily: "inherit",
              cursor: "pointer",
            }}
          >
            Tentar novamente
          </button>
        </main>
      </body>
    </html>
  );
}
