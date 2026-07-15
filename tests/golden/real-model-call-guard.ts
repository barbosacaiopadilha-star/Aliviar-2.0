// Golden Set — proteção contra chamadas reais acidentais à API Anthropic.
//
// Incidente registrado (docs/ace/05-knowledge/golden-set-testing.md,
// seção "Incidente"): `CLAUDE_API_KEY` presente em `.env.local` foi
// suficiente, sozinha, para que `npm run test:golden` chamasse a API real
// mesmo depois de `unset CLAUDE_API_KEY` no shell (o setup do Golden Set
// lê `.env.local` diretamente). A partir desta proteção, a presença da
// chave nunca é suficiente — é sempre exigida também uma autorização
// explícita e inequívoca via `ALLOW_REAL_MODEL_CALLS=true`.
//
// Módulo puro (sem I/O, sem instanciar nenhum cliente Anthropic) para que
// a proteção em si possa ser testada offline, sem qualquer risco de
// chamada real — ver tests/unit/golden-real-model-call-guard.test.ts.

export type RealModelCallGuardState =
  | { status: "blocked" }
  | { status: "misconfigured" }
  | { status: "authorized" };

// Comparação estrita: só a string exatamente "true" autoriza — nunca
// "True"/"TRUE" (nenhuma tolerância de capitalização), nunca com espaços
// ao redor, nunca "1"/"yes"/"false"/"0"/vazio. Qualquer variação é tratada
// como ausência de autorização, nunca como autorização "quase certa".
function isExplicitAuthorization(value: string | undefined): boolean {
  return value === "true";
}

export function resolveRealModelCallGuardState(env: {
  ALLOW_REAL_MODEL_CALLS?: string;
  CLAUDE_API_KEY?: string;
}): RealModelCallGuardState {
  if (!isExplicitAuthorization(env.ALLOW_REAL_MODEL_CALLS)) {
    return { status: "blocked" };
  }

  if (!env.CLAUDE_API_KEY) {
    return { status: "misconfigured" };
  }

  return { status: "authorized" };
}

// Mensagens estáticas — nunca interpolam nenhum valor de variável de
// ambiente, para que nenhum segredo possa aparecer aqui por engano.
export const REAL_MODEL_CALLS_BLOCKED_MESSAGE =
  "Chamadas reais ao modelo Anthropic estão bloqueadas por padrão. A presença de CLAUDE_API_KEY sozinha nunca autoriza. Defina ALLOW_REAL_MODEL_CALLS=true explicitamente para autorizar esta execução.";

export const REAL_MODEL_CALLS_MISCONFIGURED_MESSAGE =
  "ALLOW_REAL_MODEL_CALLS=true foi definido, mas CLAUDE_API_KEY não está configurada — nenhuma chamada real foi tentada.";
