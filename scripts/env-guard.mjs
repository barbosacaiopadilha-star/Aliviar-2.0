/**
 * GUARDA DE AMBIENTE — uma função central, antes de qualquer chamada externa.
 *
 * SEM SHEBANG, de propósito (NC-24). Este arquivo é BIBLIOTECA: só exporta,
 * não executa nada ao ser importado, e nenhum comando o chama diretamente —
 * quem roda pela linha de comando são os wrappers (`with-local-supabase.mjs`,
 * `guard-db-reset.mjs`, `generate-local-env.mjs`, …), e esses mantêm o
 * shebang deles.
 *
 * O `#!` daqui era herança de hábito e custava caro: o vite-node transforma o
 * módulo e o executa em `vm.Script`, que rejeita `#!` com
 * "SyntaxError: Invalid or unexpected token". Como este arquivo é importado
 * pelo `setup-env`, pelo `globalSetup` da integração e pelo teste do próprio
 * guarda, um caractere invisível derrubava a suíte de integração inteira.
 *
 * Regra que fica: módulo importável não tem shebang; wrapper de linha de
 * comando tem. `tests/unit/env-guard.test.ts` pina isso.
 *
 * Por que existe: `.env.local` deste repositório aponta deliberadamente para
 * um projeto hospedado, e praticamente todo script local o lia como fallback.
 * Bastava rodar a suíte de integração, um seed ou um bootstrap sem injetar
 * variáveis para o comando conversar com um banco que não é o local — em
 * alguns casos apagando linhas (`DELETE ... LIKE 'DEMO-%'`) antes de qualquer
 * pessoa perceber.
 *
 * A regra aqui é simples e não tem exceção: comando local destrutivo só roda
 * contra Supabase local, e a recusa acontece ANTES da primeira chamada de
 * rede — não depois de autenticar, não depois de listar.
 *
 * Validação pelo identificador REAL do projeto, nunca pelo nome da variável:
 * `NEXT_PUBLIC_SUPABASE_URL` chamada assim não prova nada sobre para onde
 * aponta.
 *
 * Sem dependências: importado tanto por scripts `.mjs` quanto pelo setup da
 * suíte de integração.
 */

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

/** Hosts que são, de fato, a stack local em Docker. */
export const HOSTS_LOCAIS = ["127.0.0.1", "localhost", "[::1]", "::1"];

/**
 * O CONTÊINER DO BANCO LOCAL — um lugar só, também para os scripts.
 *
 * A guarda C7R (`tests/unit/c7r-container-em-um-lugar-so.test.ts`) exige que
 * o nome venha de uma fonte única. Do lado dos TESTES essa fonte é
 * `tests/apoio/stack-local.ts`; os scripts `.mjs` não a importam, e por isso
 * `backup-local` e `restore-local` viviam na lista de exceções, cada um com o
 * literal escrito à mão.
 *
 * Duas cópias já eram frágeis; a terceira (o inventário de alcance, 25/08)
 * fez a guarda falhar — corretamente. Em vez de virar a terceira exceção, o
 * nome passa a morar AQUI, nesta biblioteca que os scripts já importam, e a
 * lista de exceções encolhe em vez de crescer.
 *
 * A regra é idêntica à do lado dos testes: a variável manda; sem ela, a stack
 * de sempre. Nada muda para quem não a define.
 */
export const CONTAINER_DO_BANCO_PADRAO = "supabase_db_" + "aliviar-conexao";

export function containerDoBanco() {
  const escolhido = process.env.SUPABASE_DB_CONTAINER?.trim();
  return escolhido && escolhido.length > 0 ? escolhido : CONTAINER_DO_BANCO_PADRAO;
}

/**
 * Projetos hospedados que NENHUM comando local pode tocar.
 *
 * A lista é explícita e por identificador de projeto — o ref que aparece em
 * `https://<ref>.supabase.co`. Ref não é segredo (está na URL pública da
 * API); o segredo é a chave, que não mora aqui.
 */
export const PROJETOS_PROIBIDOS = {
  awdlmeykminwyifnygkm: "produção — Aliviar Curadoria",
  jfhxtwumrurqghuueawi: "projeto hospedado usado nas validações assistidas",
};

export class AmbienteBloqueadoError extends Error {
  constructor(mensagem) {
    super(mensagem);
    this.name = "AmbienteBloqueadoError";
  }
}

/** O identificador real do projeto, ou `null` quando a URL é local/inválida. */
export function refDoProjeto(url) {
  if (!url) return null;
  let hostname;
  try {
    ({ hostname } = new URL(url));
  } catch {
    return null;
  }
  const match = hostname.match(/^([a-z0-9]{20})\.supabase\.(co|in|net)$/);
  return match ? match[1] : null;
}

export function ehSupabaseLocal(url) {
  if (!url) return false;
  try {
    return HOSTS_LOCAIS.includes(new URL(url).hostname);
  } catch {
    return false;
  }
}

/**
 * A guarda. Lança — nunca devolve `false` — para que nenhum chamador consiga
 * seguir adiante por engano ignorando um valor de retorno.
 *
 * @param {string | undefined} url  alvo pretendido
 * @param {string} comando          como o comando se identifica na mensagem
 */
export function assertSupabaseLocal(url, comando) {
  if (!url) {
    throw new AmbienteBloqueadoError(
      `${comando} bloqueado: NEXT_PUBLIC_SUPABASE_URL ausente. ` +
        "Rode pelo script `:local` correspondente, que injeta o alvo da stack local.",
    );
  }

  const ref = refDoProjeto(url);
  if (ref && PROJETOS_PROIBIDOS[ref]) {
    throw new AmbienteBloqueadoError(
      `${comando} bloqueado: o alvo é o projeto ${ref} (${PROJETOS_PROIBIDOS[ref]}). ` +
        "Comandos locais nunca tocam um projeto hospedado.",
    );
  }

  if (!ehSupabaseLocal(url)) {
    let host = "(URL inválida)";
    try {
      host = new URL(url).hostname;
    } catch {
      /* mantém o texto acima */
    }
    throw new AmbienteBloqueadoError(
      `${comando} bloqueado: Supabase remoto detectado (${host}). ` +
        "Só a stack local (127.0.0.1) é aceita aqui.",
    );
  }

  return url;
}

/** Lê um arquivo de env sem dependência externa. Ausente devolve `{}`. */
export function lerArquivoEnv(caminho) {
  if (!existsSync(caminho)) return {};
  const valores = {};
  for (const linha of readFileSync(caminho, "utf-8").split(/\r?\n/)) {
    const match = linha.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match) valores[match[1]] = match[2].trim().replace(/^"|"$/g, "");
  }
  return valores;
}

/**
 * O alvo local, de verdade: perguntado à própria CLI do Supabase, não a um
 * arquivo que alguém pode ter editado. Já sai validado.
 */
export function lerStackLocal({ cwd = process.cwd() } = {}) {
  const resultado = spawnSync("npx supabase status -o env", {
    cwd,
    encoding: "utf-8",
    shell: true,
  });

  if (resultado.status !== 0) {
    throw new AmbienteBloqueadoError(
      "A stack Supabase local não respondeu. Ela está rodando? (npm run supabase:start)\n" +
        (resultado.stderr?.trim() || "(sem detalhes adicionais)"),
    );
  }

  const valores = {};
  for (const linha of resultado.stdout.split(/\r?\n/)) {
    const match = linha.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match) valores[match[1]] = match[2].trim().replace(/^"|"$/g, "");
  }

  const url = valores.API_URL;
  assertSupabaseLocal(url, "Leitura da stack local");

  if (!valores.ANON_KEY || !valores.SERVICE_ROLE_KEY) {
    throw new AmbienteBloqueadoError(
      "ANON_KEY/SERVICE_ROLE_KEY ausentes na saída de `supabase status -o env`. Verifique a versão da CLI.",
    );
  }

  return {
    NEXT_PUBLIC_SUPABASE_URL: url,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: valores.ANON_KEY,
    SUPABASE_URL: url,
    SUPABASE_ANON_KEY: valores.ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: valores.SERVICE_ROLE_KEY,
  };
}

/**
 * O alvo de um comando local: respeita uma injeção explícita (e a valida),
 * senão pergunta à stack local.
 *
 * Nunca cai em `.env.local` — foi exatamente esse fallback que fez a suíte de
 * integração inteira autenticar contra um projeto hospedado.
 */
export function resolverAlvoLocal(comando, { cwd = process.cwd() } = {}) {
  const injetada = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  if (injetada) {
    assertSupabaseLocal(injetada, comando);
    return {
      NEXT_PUBLIC_SUPABASE_URL: injetada,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
      SUPABASE_URL: injetada,
      SUPABASE_ANON_KEY:
        process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
    };
  }
  return lerStackLocal({ cwd });
}
