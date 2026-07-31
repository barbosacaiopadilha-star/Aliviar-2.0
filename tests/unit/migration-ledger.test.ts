import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  COMANDO_PARA_APLICAR,
  compararLedger,
  extrairVersao,
  listarMigrationsDoRepositorio,
  lerLedgerAplicado,
  mensagemDeLedger,
  verificarLedgerLocal,
} from "../../scripts/migration-ledger.mjs";

/**
 * NC-23 — O BANCO LOCAL ESTÁ ATRÁS DO REPOSITÓRIO?
 *
 * A certificação encontrou 52 migrations aplicadas para 54 no repositório, e
 * nada avisava. O que se testa aqui é a detecção: pendente aparece, ordem é
 * estável, ledger com migration desconhecida vira aviso separado (nunca uma
 * "correção" automática), stack fora do ar não se confunde com sincronizado, e
 * produção é recusada antes de qualquer consulta.
 */

const RAIZ = process.cwd();
const PRODUCAO = "https://awdlmeykminwyifnygkm.supabase.co";

/** Uma resposta da CLI do Supabase, como o módulo a recebe de verdade. */
function respostaDaCli(pares: { local: string; remote: string }[]) {
  return () => ({
    status: 0,
    stdout: `Connecting to local database...\n${JSON.stringify({
      migrations: pares.map((par) => ({ ...par, time: "2026-07-30 10:00:00" })),
    })}\n`,
    stderr: "",
  });
}

/** Repositório de mentira, para não tocar em `supabase/migrations`. */
function repositorioFalso(arquivos: string[]) {
  const dir = mkdtempSync(join(tmpdir(), "ledger-"));
  for (const arquivo of arquivos) writeFileSync(join(dir, arquivo), "-- vazio\n");
  return dir;
}

describe("Ledger de migrations — comparação", () => {
  it("sincronizado: nada pendente, nada desconhecido", () => {
    const check = compararLedger({
      repositorio: ["001", "002", "003"],
      aplicadas: ["001", "002", "003"],
    });

    expect(check.synchronized).toBe(true);
    expect(check.pending).toEqual([]);
    expect(check.unknownInLedger).toEqual([]);
    expect(check.applied).toEqual(["001", "002", "003"]);
    expect(mensagemDeLedger(check)).toContain("sincronizado");
  });

  it("uma migration pendente é nomeada, com o comando para aplicá-la", () => {
    const check = compararLedger({ repositorio: ["001", "002", "003"], aplicadas: ["001", "002"] });

    expect(check.synchronized).toBe(false);
    expect(check.pending).toEqual(["003"]);

    const mensagem = mensagemDeLedger(check);
    expect(mensagem).toContain("Banco local desatualizado.");
    expect(mensagem).toContain("- 003");
    expect(mensagem).toContain(COMANDO_PARA_APLICAR);
    expect(COMANDO_PARA_APLICAR).toContain("supabase migration up --local");
  });

  it("várias pendentes aparecem todas, em ordem", () => {
    const check = compararLedger({
      repositorio: ["001", "002", "003", "004", "005"],
      aplicadas: ["001", "003"],
    });

    expect(check.pending).toEqual(["002", "004", "005"]);
    const linhas = mensagemDeLedger(check)
      .split("\n")
      .filter((linha) => linha.startsWith("- "));
    expect(linhas).toEqual(["- 002", "- 004", "- 005"]);
  });

  it("migration no ledger sem arquivo é inconsistência separada — e nada é apagado", () => {
    const check = compararLedger({ repositorio: ["001", "002"], aplicadas: ["001", "002", "999"] });

    expect(check.pending).toEqual([]);
    expect(check.unknownInLedger).toEqual(["999"]);
    expect(check.synchronized).toBe(false);

    const mensagem = mensagemDeLedger(check);
    expect(mensagem).toContain("999");
    expect(mensagem).toContain("não é corrigido automaticamente");
    // Nada de comando destrutivo sugerido.
    expect(mensagem).not.toMatch(/delete|drop|truncate|repair/i);
  });

  it("a ordem não depende da ordem de leitura do disco", () => {
    const a = compararLedger({ repositorio: ["003", "001", "002"].sort(), aplicadas: ["002"] });
    const b = compararLedger({ repositorio: ["001", "002", "003"], aplicadas: ["002"] });
    expect(a.pending).toEqual(b.pending);
    expect(a.pending).toEqual(["001", "003"]);
  });
});

describe("Ledger de migrations — fonte de verdade do repositório", () => {
  it("o identificador é o prefixo de 14 dígitos, e só ele", () => {
    expect(extrairVersao("20260730100000_selecao_sem_banda.sql")).toBe("20260730100000");
    expect(extrairVersao("README.md")).toBeNull();
    expect(extrairVersao("rascunho.sql")).toBeNull();
    expect(extrairVersao("2026_curto.sql")).toBeNull();
    expect(extrairVersao("20260730100000.sql")).toBeNull();
  });

  it("arquivo fora do formato não entra silenciosamente como migration", () => {
    const dir = repositorioFalso([
      "20260101000000_primeira.sql",
      "20260102000000_segunda.sql",
      "README.md",
      "rascunho.sql",
      ".gitkeep",
    ]);

    const { versoes, ignorados } = listarMigrationsDoRepositorio(dir);
    expect(versoes).toEqual(["20260101000000", "20260102000000"]);
    expect(ignorados).toEqual([".gitkeep", "README.md", "rascunho.sql"]);
  });

  it("as migrations reais do repositório são lidas e ordenadas", () => {
    const { versoes, ignorados } = listarMigrationsDoRepositorio(
      join(RAIZ, "supabase", "migrations"),
    );
    expect(versoes.length).toBeGreaterThan(0);
    expect([...versoes]).toEqual([...versoes].sort());
    expect(ignorados).toEqual([]);
  });
});

describe("Ledger de migrations — leitura do banco", () => {
  it("só conta como aplicada a migration que o ledger registrou", () => {
    const aplicadas = lerLedgerAplicado({
      executar: respostaDaCli([
        { local: "001", remote: "001" },
        { local: "002", remote: "" },
        { local: "003", remote: "003" },
      ]),
    });
    expect(aplicadas).toEqual(["001", "003"]);
  });

  it("stack indisponível é erro claro — nunca se confunde com sincronizado", () => {
    expect(() =>
      lerLedgerAplicado({
        executar: () => ({ status: 1, stdout: "", stderr: "container is not running: exited" }),
      }),
    ).toThrow(/stack está rodando/i);
  });

  it("resposta ilegível da CLI é recusada, não interpretada como ledger vazio", () => {
    expect(() =>
      lerLedgerAplicado({ executar: () => ({ status: 0, stdout: "sem json aqui", stderr: "" }) }),
    ).toThrow(/formato reconhecível/i);
  });
});

describe("Ledger de migrations — proteção de ambiente", () => {
  const urlOriginal = process.env.NEXT_PUBLIC_SUPABASE_URL;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = PRODUCAO;
  });

  afterEach(() => {
    if (urlOriginal === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    else process.env.NEXT_PUBLIC_SUPABASE_URL = urlOriginal;
  });

  it("produção é recusada ANTES de qualquer consulta ao banco", () => {
    let consultou = false;
    const espiao = () => {
      consultou = true;
      return { status: 0, stdout: "{}", stderr: "" };
    };

    expect(() => verificarLedgerLocal({ executar: espiao })).toThrow(/bloqueado/i);
    expect(consultou, "o ledger foi consultado mesmo com alvo de produção").toBe(false);
  });

  it("a recusa diz o projeto e o motivo, sem imprimir chave alguma", () => {
    let mensagem = "";
    try {
      verificarLedgerLocal({ executar: () => ({ status: 0, stdout: "{}", stderr: "" }) });
    } catch (erro) {
      mensagem = (erro as Error).message;
    }

    expect(mensagem).toContain("produção");
    expect(mensagem).not.toMatch(/eyJ[A-Za-z0-9_-]{10,}/); // nenhum JWT
    expect(mensagem).not.toMatch(/service_role|anon_key|password/i);
  });
});

describe("Ledger de migrations — o wrapper de linha de comando", () => {
  function rodarGuarda(env: Record<string, string>) {
    const resultado = spawnSync(process.execPath, ["scripts/check-migration-ledger.mjs"], {
      cwd: RAIZ,
      encoding: "utf-8",
      env: { ...process.env, ...env },
    });
    return { status: resultado.status, saida: `${resultado.stdout}${resultado.stderr}` };
  }

  it("recusa alvo de produção com exit diferente de zero", () => {
    const { status, saida } = rodarGuarda({ NEXT_PUBLIC_SUPABASE_URL: PRODUCAO });
    expect(status).toBe(1);
    expect(saida).toContain("bloqueado");
    expect(saida).not.toContain("sincronizado");
    expect(saida).not.toMatch(/eyJ[A-Za-z0-9_-]{10,}/);
  }, 30_000);

  it("nunca aplica migration — o comando é dito, nunca executado", () => {
    const wrapper = readFileSync(join(RAIZ, "scripts/check-migration-ledger.mjs"), "utf8");
    const modulo = readFileSync(join(RAIZ, "scripts/migration-ledger.mjs"), "utf8");

    // Nenhum dos dois dispara `migration up`: o comando existe como texto para
    // a pessoa digitar, nunca como chamada.
    for (const fonte of [wrapper, modulo]) {
      expect(fonte).not.toMatch(/(spawnSync|execSync|exec)\([^)]*migration up/);
      expect(fonte).not.toMatch(/db\s+(reset|push)/);
    }
    // O wrapper sequer sabe executar processo — quem consulta é o módulo.
    expect(wrapper).not.toContain("child_process");
    expect(COMANDO_PARA_APLICAR).toBe("npx supabase migration up --local");
  });
});
