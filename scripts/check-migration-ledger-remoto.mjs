#!/usr/bin/env node
/**
 * GUARDA DO LEDGER REMOTO — produção tem migration que o repositório não tem?
 *
 * A guarda que já existia (`check-migration-ledger.mjs`) só olha o banco da
 * máquina. Foi por essa fresta que a migration `20260819040715` chegou a
 * produção sem existir em nenhuma cópia do repositório: aplicada direto no
 * projeto hospedado, ela ficou registrada só no ledger remoto, e o SQL teve de
 * ser recuperado de um dump para voltar a ser versionado.
 *
 * Somente leitura: `migration list` não altera nada. Nunca aplica migration —
 * diz o que está fora de acordo e sai com código não-zero.
 *
 * Precisa de `SUPABASE_ACCESS_TOKEN` no ambiente. O valor não é lido nem
 * impresso por este script: quem o consome é a CLI.
 */

import { AmbienteBloqueadoError } from "./env-guard.mjs";
import { mensagemDeLedgerRemoto, verificarLedgerRemoto } from "./migration-ledger.mjs";

try {
  const check = verificarLedgerRemoto();

  if (check.ignorados.length > 0) {
    console.warn(
      `Ignorados por não seguirem o formato <timestamp>_<nome>.sql: ${check.ignorados.join(", ")}`,
    );
  }

  console.log(mensagemDeLedgerRemoto(check));

  // Migration pendente de publicar é estado normal antes de um deploy; o que
  // nunca pode passar é produção ter algo que o repositório não descreve.
  process.exit(check.unknownInLedger.length === 0 ? 0 : 1);
} catch (erro) {
  if (erro instanceof AmbienteBloqueadoError) {
    console.error(erro.message);
    process.exit(1);
  }
  console.error(erro);
  process.exit(1);
}
