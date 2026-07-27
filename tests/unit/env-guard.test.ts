import { spawnSync } from "node:child_process";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  AmbienteBloqueadoError,
  assertSupabaseLocal,
  ehSupabaseLocal,
  lerArquivoEnv,
  PROJETOS_PROIBIDOS,
  refDoProjeto,
} from "../../scripts/env-guard.mjs";
import {
  AMBIENTES_CONHECIDOS,
  assertValidacaoAutorizada,
  descreverAmbiente,
} from "../../scripts/local/validation-guard.mjs";

const RAIZ = path.resolve(__dirname, "../..");
const PRODUCAO = "https://awdlmeykminwyifnygkm.supabase.co";
const LOCAL = "http://127.0.0.1:54321";

/** Roda um script real e devolve saída + código. Nada de mock: a guarda vale
 *  pelo que acontece no processo de verdade. */
function rodar(args: string[], env: Record<string, string> = {}) {
  const resultado = spawnSync(process.execPath, args, {
    cwd: RAIZ,
    encoding: "utf-8",
    env: {
      ...process.env,
      NEXT_PUBLIC_SUPABASE_URL: "",
      SUPABASE_URL: "",
      SUPABASE_SERVICE_ROLE_KEY: "",
      ...env,
    },
  });
  return {
    status: resultado.status,
    saida: `${resultado.stdout ?? ""}${resultado.stderr ?? ""}`,
  };
}

describe("Identificação do projeto — pelo ref real, não pelo nome da variável", () => {
  it("extrai o identificador de um projeto hospedado", () => {
    expect(refDoProjeto(PRODUCAO)).toBe("awdlmeykminwyifnygkm");
  });

  it("URL local não tem ref de projeto", () => {
    expect(refDoProjeto(LOCAL)).toBeNull();
    expect(ehSupabaseLocal(LOCAL)).toBe(true);
    expect(ehSupabaseLocal("http://localhost:54321")).toBe(true);
  });

  it("a produção atual está na lista de proibidos", () => {
    expect(Object.keys(PROJETOS_PROIBIDOS)).toContain("awdlmeykminwyifnygkm");
  });
});

describe("A guarda central", () => {
  it("aceita o Supabase local", () => {
    expect(assertSupabaseLocal(LOCAL, "Teste")).toBe(LOCAL);
  });

  it("recusa o projeto de produção, dizendo qual é", () => {
    expect(() => assertSupabaseLocal(PRODUCAO, "Suíte de integração")).toThrow(
      AmbienteBloqueadoError,
    );
    expect(() => assertSupabaseLocal(PRODUCAO, "Suíte de integração")).toThrow(
      /awdlmeykminwyifnygkm/,
    );
    expect(() => assertSupabaseLocal(PRODUCAO, "Suíte de integração")).toThrow(/produção/);
  });

  it("recusa qualquer host remoto, mesmo fora da lista", () => {
    expect(() => assertSupabaseLocal("https://outro-projeto.supabase.co", "Teste")).toThrow(
      /Supabase remoto detectado/,
    );
  });

  it("recusa ausência de alvo — nunca assume um padrão", () => {
    expect(() => assertSupabaseLocal(undefined, "Teste")).toThrow(/ausente/);
    expect(() => assertSupabaseLocal("", "Teste")).toThrow(/ausente/);
  });

  it("lança em vez de devolver falso — ninguém segue adiante ignorando retorno", () => {
    let escapou = false;
    try {
      assertSupabaseLocal(PRODUCAO, "Teste");
      escapou = true;
    } catch {
      /* esperado */
    }
    expect(escapou).toBe(false);
  });
});

describe("Nenhum consumidor local lê .env.local", () => {
  it("o setup da integração lê apenas arquivos locais", () => {
    const setup = lerArquivoEnv(path.join(RAIZ, ".env.test.example"));
    expect(setup.NEXT_PUBLIC_SUPABASE_URL).toBe(LOCAL);
  });

  it("o setup da suíte de integração não menciona .env.local", async () => {
    const { readFileSync } = await import("node:fs");
    const fonte = readFileSync(path.join(RAIZ, "tests/integration/setup-env.ts"), "utf-8");
    expect(fonte).toContain("assertSupabaseLocal");
    expect(fonte).not.toMatch(/lerArquivoEnv\([^)]*"\.env\.local"/);
  });
});

describe("Recusas, nos scripts de verdade", () => {
  it("a suíte de integração recusa apontar para produção", () => {
    const { status, saida } = rodar(
      [
        "node_modules/vitest/vitest.mjs",
        "run",
        "--config",
        "vitest.integration.config.ts",
        "team",
      ],
      { NEXT_PUBLIC_SUPABASE_URL: PRODUCAO },
    );
    expect(status).not.toBe(0);
    expect(saida).toMatch(/Suíte de integração bloqueada?|AmbienteBloqueado|awdlmeykminwyifnygkm/);
  }, 60_000);

  it("o seed da rede de demonstração recusa produção", () => {
    const { status, saida } = rodar(["scripts/seed-rede-demonstracao.mjs"], {
      NEXT_PUBLIC_SUPABASE_URL: PRODUCAO,
      SUPABASE_SERVICE_ROLE_KEY: "irrelevante-a-guarda-vem-antes",
    });
    expect(status).toBe(1);
    expect(saida).toContain("bloqueado");
    expect(saida).toContain("awdlmeykminwyifnygkm");
  }, 30_000);

  it("o bootstrap de contas de teste recusa produção", () => {
    const { status, saida } = rodar(["scripts/bootstrap-local-test-users.mjs"], {
      NEXT_PUBLIC_SUPABASE_URL: PRODUCAO,
      SUPABASE_SERVICE_ROLE_KEY: "irrelevante-a-guarda-vem-antes",
    });
    expect(status).toBe(1);
    expect(saida).toContain("bloqueado");
  }, 30_000);

  it("o runner local recusa produção antes de existir processo filho", () => {
    const { status, saida } = rodar(
      // O marcador é montado em tempo de execução: a mensagem da guarda ecoa o
      // comando recusado, e um literal apareceria nela mesmo sem filho algum.
      ["scripts/with-local-supabase.mjs", "node", "-e", "console.log(['NAO','RODOU'].join('_'))"],
      { NEXT_PUBLIC_SUPABASE_URL: PRODUCAO },
    );
    expect(status).toBe(1);
    expect(saida).not.toContain("NAO_RODOU");
    expect(saida).toContain("bloqueado");
  }, 30_000);

  it("o reset recusa --linked e --db-url remoto", () => {
    const comLinked = rodar(["scripts/guard-db-reset.mjs", "--linked"]);
    expect(comLinked.status).toBe(1);
    expect(comLinked.saida).toContain("Reset bloqueado");

    const comDbUrl = rodar([
      "scripts/guard-db-reset.mjs",
      "--db-url",
      "postgresql://postgres:x@db.awdlmeykminwyifnygkm.supabase.co:5432/postgres",
    ]);
    expect(comDbUrl.status).toBe(1);
    expect(comDbUrl.saida).toContain("Reset bloqueado");
  }, 30_000);
});

describe("Validações hospedadas — allowlist explícita por project ref", () => {
  const LEGADO = "https://jfhxtwumrurqghuueawi.supabase.co";

  it("a allowlist nasce vazia — projeto não reconhecido é recusado", () => {
    expect(() =>
      assertValidacaoAutorizada("https://umprojetoqualquerxxx.supabase.co", "validation:e2e", {}),
    ).toThrow(/não está na allowlist/);
  });

  it("produção nunca é autorizável, nem com a variável apontando para ela", () => {
    expect(() =>
      assertValidacaoAutorizada(PRODUCAO, "validation:e2e", {
        ALIVIAR_VALIDATION_PROJECT_REF: "awdlmeykminwyifnygkm",
      }),
    ).toThrow(/nenhuma autorização o libera/);
  });

  it("o projeto legado de estado desconhecido fica bloqueado", () => {
    expect(() =>
      assertValidacaoAutorizada(LEGADO, "validation:e2e:b6", {
        ALIVIAR_VALIDATION_PROJECT_REF: "jfhxtwumrurqghuueawi",
      }),
    ).toThrow(/estado desconhecido/);
    expect(AMBIENTES_CONHECIDOS.jfhxtwumrurqghuueawi.autorizavel).toBe(false);
  });

  it("autorização de um projeto não libera outro", () => {
    expect(() =>
      assertValidacaoAutorizada("https://projetoalvoxxxxxxxxx.supabase.co", "validation:e2e", {
        ALIVIAR_VALIDATION_PROJECT_REF: "outroprojetoxxxxxxxx",
      }),
    ).toThrow(/vale para um projeto só/);
  });

  it("um projeto autorizado explicitamente passa", () => {
    const alvo = "https://projetoautorizadoxxx.supabase.co";
    expect(
      assertValidacaoAutorizada(alvo, "validation:e2e", {
        ALIVIAR_VALIDATION_PROJECT_REF: "projetoautorizadoxxx",
      }),
    ).toBe(alvo);
  });

  it("a stack local sempre passa", () => {
    expect(assertValidacaoAutorizada(LOCAL, "validation:e2e", {})).toBe(LOCAL);
  });

  it("o ambiente é descrito antes de qualquer execução", () => {
    expect(descreverAmbiente(PRODUCAO)).toContain("produção");
    expect(descreverAmbiente(LOCAL)).toContain("LOCAL");
    expect(descreverAmbiente("https://desconhecidoxxxxxxxx.supabase.co")).toContain(
      "não reconhecido",
    );
  });

  it.each([
    ["validation:e2e", "scripts/local/validate-e2e-real.mjs"],
    ["validation:e2e:b6", "scripts/local/validate-e2e-curadoria-b6.mjs"],
  ])("%s falha antes de criar ou excluir conta", (_nome, script) => {
    const { status, saida } = rodar([script], {
      // Sem injeção, o script cai em `.env.local` — que aponta para produção.
      // É exatamente o cenário que precisa ser recusado.
      ALIVIAR_VALIDATION_PROJECT_REF: "awdlmeykminwyifnygkm",
    });
    expect(status).not.toBe(0);
    expect(saida).toContain("[ambiente]");
    expect(saida).toContain("bloqueado");
    expect(saida).not.toMatch(/conta criada|usuário criado|deleteUser/i);
  }, 30_000);
});

describe("Produção não é tocada por esta missão", () => {
  it("nenhum script de produção passou a depender da guarda local", async () => {
    const { readFileSync } = await import("node:fs");
    const pkg = JSON.parse(readFileSync(path.join(RAIZ, "package.json"), "utf-8"));
    for (const nome of ["build", "start"]) {
      expect(pkg.scripts[nome]).not.toContain("with-local-supabase");
    }
  });

  it("todo comando local que toca banco passa por uma guarda", async () => {
    const { readFileSync } = await import("node:fs");
    const pkg = JSON.parse(readFileSync(path.join(RAIZ, "package.json"), "utf-8"));
    for (const nome of [
      "test:integration",
      "test:integration:local",
      "test:e2e",
      "bootstrap:test-users",
      "bootstrap:test-users:local",
      "seed:rede-demo:local",
      "seed:mesa:local",
      "dev:local",
    ]) {
      expect(pkg.scripts[nome], nome).toContain("with-local-supabase");
    }
    expect(pkg.scripts["supabase:reset"]).toContain("guard-db-reset");
  });
});
