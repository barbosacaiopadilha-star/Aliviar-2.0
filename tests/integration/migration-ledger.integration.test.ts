// LEDGER DE MIGRATIONS — contra a stack local de verdade (NC-23).
//
// O teste unitário prova a comparação; aqui prova-se que ela funciona contra o
// ledger real, e que a pendência é detectada de fato — sem tocar em nenhuma
// migration real e sem escrever nada no banco.

import { cpSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  compararLedger,
  lerLedgerAplicado,
  listarMigrationsDoRepositorio,
  mensagemDeLedger,
  verificarLedgerLocal,
} from "../../scripts/migration-ledger.mjs";

const RAIZ = process.cwd();
const MIGRATIONS = join(RAIZ, "supabase", "migrations");

describe("Guarda do ledger contra a stack local", () => {
  it("o banco local está sincronizado com o repositório", () => {
    const check = verificarLedgerLocal({ cwd: RAIZ });

    expect(check.pending, `pendentes: ${check.pending.join(", ")}`).toEqual([]);
    expect(check.unknownInLedger, `sem arquivo: ${check.unknownInLedger.join(", ")}`).toEqual([]);
    expect(check.synchronized).toBe(true);
    expect(check.applied.length).toBe(check.repository.length);
    expect(mensagemDeLedger(check)).toContain("sincronizado");
  }, 60_000);

  it("a migration da M2 consta do ledger — foi ela que faltava na certificação", () => {
    const check = verificarLedgerLocal({ cwd: RAIZ });
    expect(check.applied).toContain("20260730100000");
  }, 60_000);

  it("uma migration a mais no repositório é detectada como pendente", () => {
    // Cópia do diretório real num temporário: nenhuma migration verdadeira é
    // criada, renomeada ou removida, e o ledger do banco não é tocado.
    const copia = mkdtempSync(join(tmpdir(), "ledger-real-"));
    cpSync(MIGRATIONS, copia, { recursive: true });
    writeFileSync(join(copia, "29991231235959_pendente_de_mentira.sql"), "-- nunca aplicada\n");

    const { versoes } = listarMigrationsDoRepositorio(copia);
    const aplicadas = lerLedgerAplicado({ cwd: RAIZ });
    const check = compararLedger({ repositorio: versoes, aplicadas });

    expect(check.synchronized).toBe(false);
    expect(check.pending).toEqual(["29991231235959"]);

    const mensagem = mensagemDeLedger(check);
    expect(mensagem).toContain("Banco local desatualizado.");
    expect(mensagem).toContain("- 29991231235959");
    expect(mensagem).toContain("supabase migration up --local");

    // E o cenário real segue intacto depois da simulação.
    expect(verificarLedgerLocal({ cwd: RAIZ }).synchronized).toBe(true);
  }, 60_000);

  it("a saída do guarda não expõe chave nem URL hospedada", () => {
    const mensagem = mensagemDeLedger(verificarLedgerLocal({ cwd: RAIZ }));
    expect(mensagem).not.toMatch(/eyJ[A-Za-z0-9_-]{10,}/);
    expect(mensagem).not.toMatch(/supabase\.co/);
  }, 60_000);
});
