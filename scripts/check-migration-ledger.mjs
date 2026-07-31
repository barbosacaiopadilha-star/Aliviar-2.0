#!/usr/bin/env node
/**
 * GUARDA DO LEDGER — falha cedo quando o banco local está atrás do repositório.
 *
 * Wrapper de linha de comando: toda a lógica mora em `migration-ledger.mjs`,
 * que é importável e testável. Aqui só há execução, mensagem e exit code.
 *
 * Nunca aplica migration. Diz o que falta e qual comando digitar.
 */

import { AmbienteBloqueadoError } from "./env-guard.mjs";
import { mensagemDeLedger, verificarLedgerLocal } from "./migration-ledger.mjs";

try {
  const check = verificarLedgerLocal();

  if (check.ignorados.length > 0) {
    console.warn(
      `Ignorados por não seguirem o formato <timestamp>_<nome>.sql: ${check.ignorados.join(", ")}`,
    );
  }

  console.log(mensagemDeLedger(check));
  process.exit(check.synchronized ? 0 : 1);
} catch (erro) {
  if (erro instanceof AmbienteBloqueadoError) {
    console.error(erro.message);
    process.exit(1);
  }
  console.error(erro);
  process.exit(1);
}
