// Hook de registro para o runtime Node do Playwright Test — mesmo
// raciocínio já documentado em tests/integration/setup do Vitest
// (vitest.integration.config.ts, alias de "server-only" para
// tests/integration/stubs/server-only-stub.js, um arquivo vazio).
//
// node_modules/server-only/package.json define, via "exports", que o
// especificador "server-only" resolve para empty.js (vazio) somente sob a
// condição de export "react-server" — a única parte que o bundler do
// Next.js ativa ao empacotar código de servidor. Fora de um bundler (Node
// puro), a condição nunca é aplicada, e a resolução cai em index.js, que
// lança incondicionalmente:
//   "This module cannot be imported from a Client Component module."
//
// Isso nunca indica uma violação real de fronteira aqui: os módulos
// importados pelo fixture do E2E (createAdminSupabaseClient, cases/
// repository, concierge/*, profiles/*, story/repository) são os MESMOS já
// usados livremente pelos testes de integração (Vitest) para montar
// fixtures reais — nunca código que chegaria a um bundle de cliente.
//
// Este arquivo intercepta apenas a string exata "server-only" na cadeia
// de resolução de módulo do processo Node, devolvendo o mesmo módulo vazio
// que o próprio pacote já usa sob a condição "react-server" — nunca altera
// o pacote em si, nunca é lido pelo build real da aplicação (`next build`/
// `next start`), que continua resolvendo "server-only" normalmente e
// lançando o erro real se um Client Component algum dia importar um módulo
// server-only por engano.
//
// Registrado via NODE_OPTIONS (--require), não via import direto, porque
// os workers do Playwright Test são processos Node forkados — precisa
// estar ativo antes de qualquer arquivo de teste ser carregado em cada
// worker, não só no processo do playwright.config.ts.
const Module = require("module");

const originalLoad = Module._load;

Module._load = function serverOnlyStubLoad(request, ...rest) {
  if (request === "server-only") {
    return {};
  }
  return originalLoad.call(this, request, ...rest);
};
