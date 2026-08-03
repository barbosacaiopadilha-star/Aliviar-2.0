/**
 * LEDGER DE MIGRATIONS — o banco local está atrás do repositório?
 *
 * SEM SHEBANG, de propósito (NC-24): este arquivo é biblioteca. Quem roda pela
 * linha de comando é `scripts/check-migration-ledger.mjs`.
 *
 * Por que existe (NC-23): a certificação encontrou o banco local com 52 das 54
 * migrations do repositório — duas nunca aplicadas, entre elas a que torna
 * `curated_selection_options.band` anulável. A stack subia normalmente e nada
 * avisava. O sintoma disso é sempre o mesmo e sempre confuso: um teste falha
 * por coluna, constraint ou função que "deveria existir", e o tempo vai para o
 * lugar errado. Aqui a comparação é explícita e acontece antes.
 *
 * O que este módulo NUNCA faz: aplicar migration. Ele compara e informa; quem
 * aplica é uma pessoa, com um comando que ela digita.
 */

import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { join } from "node:path";

import { AmbienteBloqueadoError, resolverAlvoLocal } from "./env-guard.mjs";

/** O comando que aplica — dito por extenso, nunca executado por aqui. */
export const COMANDO_PARA_APLICAR = "npx supabase migration up --local";

/**
 * O identificador de uma migration é o prefixo numérico do arquivo, como a
 * própria CLI do Supabase o registra. Nome fora do formato não vira migration
 * silenciosamente: devolve `null` e é contado à parte.
 */
export function extrairVersao(nomeArquivo) {
  const match = /^(\d{14})_.+\.sql$/.exec(nomeArquivo);
  return match ? match[1] : null;
}

/**
 * As migrations que o repositório declara. Ordenadas — a ordem é o próprio
 * significado de uma migration, e uma lista instável esconde o que falta.
 */
export function listarMigrationsDoRepositorio(diretorio) {
  const arquivos = readdirSync(diretorio, { withFileTypes: true })
    .filter((entrada) => entrada.isFile())
    .map((entrada) => entrada.name);

  const versoes = [];
  const ignorados = [];

  for (const arquivo of arquivos) {
    const versao = extrairVersao(arquivo);
    if (versao) versoes.push(versao);
    else ignorados.push(arquivo);
  }

  return { versoes: versoes.sort(), ignorados: ignorados.sort() };
}

/**
 * O ledger REAL do banco local, perguntado à CLI do Supabase — a mesma fonte
 * que a própria ferramenta usa (`supabase_migrations.schema_migrations`).
 *
 * Nunca se infere "aplicada" pela presença de uma tabela ou coluna: estrutura
 * existente não prova migration registrada, e é justamente essa confusão que
 * deixa um banco meio aplicado passar por completo.
 *
 * `executar` é injetável para o teste conseguir exercitar os cenários sem
 * depender de uma stack de pé.
 *
 * @typedef {{ status: number | null, stdout: string, stderr: string }} SaidaDeComando
 * @param {{ cwd?: string, executar?: () => SaidaDeComando }} [opcoes]
 * @returns {string[]}
 */
export function lerLedgerAplicado({ cwd = process.cwd(), executar } = {}) {
  const rodar =
    executar ??
    (() =>
      // `--output-format json` é explícito de propósito: sem ele, a CLI decide
      // o formato por detecção de ambiente (sob agente de IA sai JSON; em CI e
      // terminal humano sai tabela) — e o parser abaixo só entende JSON.
      spawnSync("npx supabase migration list --local --output-format json", {
        cwd,
        encoding: "utf-8",
        shell: true,
      }));

  const resultado = rodar();

  if (resultado.status !== 0) {
    throw new AmbienteBloqueadoError(
      "Não foi possível ler o ledger do banco local. A stack está rodando? (npm run supabase:start)\n" +
        (resultado.stderr?.trim() || "(sem detalhes adicionais)"),
    );
  }

  const linhaJson = (resultado.stdout ?? "")
    .split(/\r?\n/)
    .map((linha) => linha.trim())
    .filter((linha) => linha.startsWith("{"))
    .pop();

  if (!linhaJson) {
    throw new AmbienteBloqueadoError(
      "A CLI do Supabase não devolveu o ledger em formato reconhecível. Verifique a versão instalada.",
    );
  }

  let dados;
  try {
    dados = JSON.parse(linhaJson);
  } catch {
    throw new AmbienteBloqueadoError(
      "A CLI do Supabase devolveu um ledger ilegível. Verifique a versão instalada.",
    );
  }

  // `remote` preenchido é o que o banco local já registrou como aplicada.
  return (dados.migrations ?? [])
    .filter((entrada) => Boolean(entrada.remote))
    .map((entrada) => entrada.remote)
    .sort();
}

/**
 * A comparação, pura: o que existe no repositório, o que o banco registrou, e
 * as duas formas de estarem em desacordo.
 *
 * `unknownInLedger` não é erro a corrigir por aqui — é sinal de que o banco
 * viu uma migration que este repositório não tem (outra branch, outro clone).
 * Apagar registro de ledger é decisão de gente, não de script.
 */
export function compararLedger({ repositorio, aplicadas }) {
  const noBanco = new Set(aplicadas);
  const noRepo = new Set(repositorio);

  const applied = repositorio.filter((versao) => noBanco.has(versao));
  const pending = repositorio.filter((versao) => !noBanco.has(versao));
  const unknownInLedger = aplicadas.filter((versao) => !noRepo.has(versao));

  return {
    repository: [...repositorio],
    applied,
    pending,
    unknownInLedger,
    synchronized: pending.length === 0 && unknownInLedger.length === 0,
  };
}

/** A mensagem que a pessoa lê. Diz o que falta e o que digitar — nada além. */
export function mensagemDeLedger(check) {
  if (check.synchronized) {
    return `Banco local sincronizado: ${check.applied.length} de ${check.repository.length} migrations aplicadas.`;
  }

  const partes = [];

  if (check.pending.length > 0) {
    partes.push(
      "Banco local desatualizado.",
      `Migrations pendentes (${check.pending.length}):`,
      ...check.pending.map((versao) => `- ${versao}`),
      "",
      "Execute:",
      COMANDO_PARA_APLICAR,
    );
  }

  if (check.unknownInLedger.length > 0) {
    if (partes.length > 0) partes.push("");
    partes.push(
      `O ledger registra ${check.unknownInLedger.length} migration(s) que este repositório não tem:`,
      ...check.unknownInLedger.map((versao) => `- ${versao}`),
      "Isso não é corrigido automaticamente — confira a branch ou o clone antes de qualquer coisa.",
    );
  }

  return partes.join("\n");
}

/**
 * A verificação inteira: recusa alvo hospedado, lê as duas fontes e compara.
 *
 * A proteção de ambiente é a do `env-guard` — a mesma que todo comando local
 * usa. Nenhuma lógica de "isto é produção" nasce aqui.
 *
 * @param {{ cwd?: string, diretorioDeMigrations?: string, executar?: () => SaidaDeComando }} [opcoes]
 */
export function verificarLedgerLocal({
  cwd = process.cwd(),
  diretorioDeMigrations = join(cwd, "supabase", "migrations"),
  executar,
} = {}) {
  resolverAlvoLocal("Verificação do ledger de migrations", { cwd });

  const { versoes, ignorados } = listarMigrationsDoRepositorio(diretorioDeMigrations);
  const aplicadas = lerLedgerAplicado({ cwd, executar });

  return { ...compararLedger({ repositorio: versoes, aplicadas }), ignorados };
}
