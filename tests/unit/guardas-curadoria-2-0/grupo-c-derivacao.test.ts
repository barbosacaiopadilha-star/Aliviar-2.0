import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

/**
 * GUARDAS DA CURADORIA 2.0 — GRUPO C: DERIVAÇÃO
 *
 * A Camada de Derivação **ainda não existe** e, enquanto a ADR-A não existir,
 * não pode existir. Estas guardas são de **ausência**: elas provam que nada no
 * repositório já faz, por atalho, o que a arquitetura só autoriza depois de
 * decisão registrada. Guarda de ausência é o único tipo de guarda possível
 * sobre uma camada que não nasceu — e é exatamente o que o critério AC-BLOCO
 * da Arquitetura §17.4 pede ("a ausência do teste é o aceite").
 *
 * ┌ C-01 — Nenhuma proposta persistida existe
 * │ Objetivo ......... impedir que `derivation_proposals` nasça antes da ADR-A
 * │                    e das dez dependências do §15.0.
 * │ Princípio ........ "Proposta nunca é declaração" (P-08); Arquitetura §15.0.
 * │ Arquivos ......... src/** · supabase/migrations/**
 * │ Validação ........ varredura textual do repositório.
 * │ Teste ............ negativo (zero ocorrências) · fronteira (a varredura
 * │                    enxerga migrations, não só código).
 * │ Falha ............ alguém cria a tabela ou o módulo sem passar pela ADR.
 * │ Detecção ......... suíte unitária, sem banco.
 * ├ C-02 — Nenhum regime de confirmação em bloco (AC-BLOCO)
 * │ Princípio ........ Arquitetura §5.4.0: proibido existir, **nem atrás de
 * │                    feature flag**, enquanto DP-5 estiver aberta.
 * ├ C-03 — Filtro eliminatório nunca é derivado
 * │ Princípio ........ Arquitetura §5.5 e RS-07: o sistema sinaliza para
 * │                    discussão; quem declara filtro é o Curador, item a item.
 * │ Validação ........ quem escreve `priority_profile_filters` não conhece grau,
 * │                    `ESSENCIAL` nem o Protocolo da Pessoa.
 * └ C-04 — A única derivação autorizada hoje (ADR-065) não persiste nada
 *   Princípio ........ Arquitetura §15.0 e §2.3 (DR* nunca escreve nos Mapas).
 */

const RAIZ = process.cwd();

function arquivosDe(diretorio: string, extensoes: string[]): string[] {
  const encontrados: string[] = [];
  const caminhar = (atual: string) => {
    for (const entrada of readdirSync(atual)) {
      const completo = path.join(atual, entrada);
      if (statSync(completo).isDirectory()) {
        caminhar(completo);
        continue;
      }
      if (extensoes.some((ext) => entrada.endsWith(ext))) encontrados.push(completo);
    }
  };
  caminhar(diretorio);
  return encontrados;
}

const FONTES = arquivosDe(path.join(RAIZ, "src"), [".ts", ".tsx"]);
const MIGRATIONS = arquivosDe(path.join(RAIZ, "supabase", "migrations"), [".sql"]);

function ocorrencias(arquivos: string[], padrao: RegExp): string[] {
  return arquivos
    .filter((arquivo) => padrao.test(readFileSync(arquivo, "utf8")))
    .map((arquivo) => path.relative(RAIZ, arquivo));
}

/**
 * Escrita de verdade, não menção: procura `from("<tabela>")` e olha só até a
 * próxima tabela da mesma cadeia. Um módulo que LÊ esta tabela e ESCREVE em
 * outra não pode contar como escritor — foi assim que a primeira versão desta
 * guarda acusou `mesa-cruzamento.ts`, que só faz `select`.
 */
function escreveNaTabela(fonte: string, tabela: string): boolean {
  const referencia = new RegExp(`from\\(\\s*["']${tabela}["']\\s*\\)`, "g");
  let encontro: RegExpExecArray | null;
  while ((encontro = referencia.exec(fonte)) !== null) {
    const inicio = encontro.index + encontro[0].length;
    const cadeia = fonte.slice(inicio, inicio + 400).split(/\.from\(/)[0];
    if (/\.(insert|upsert|update|delete)\(/.test(cadeia)) return true;
  }
  return false;
}

function escritoresDe(arquivos: string[], tabela: string): string[] {
  return arquivos
    .filter((arquivo) => escreveNaTabela(readFileSync(arquivo, "utf8"), tabela))
    .map((arquivo) => path.relative(RAIZ, arquivo).split(path.sep).join("/"));
}

describe("C-01 · Nenhuma proposta persistida existe", () => {
  it("a tabela `derivation_proposals` não existe em migration nenhuma", () => {
    expect(
      ocorrencias(MIGRATIONS, /derivation_proposals/i),
      "A Camada de Derivação exige a ADR-A e as dez dependências do §15.0 antes de persistir qualquer proposta.",
    ).toEqual([]);
  });

  it("nenhum módulo do código conhece propostas de derivação persistidas", () => {
    expect(ocorrencias(FONTES, /derivation_proposals|derivationProposal/i)).toEqual([]);
  });

  it("nenhum módulo persiste 'proposta' como estado de domínio", () => {
    expect(
      ocorrencias(FONTES, /\bPROPOSTA\b\s*[:=]|status\s*[:=]\s*["']PROPOSTA["']/),
      "Um estado PROPOSTA persistido é a Camada de Derivação nascendo sem fronteira humana.",
    ).toEqual([]);
  });
});

describe("C-02 · Nenhum regime de confirmação em bloco (AC-BLOCO)", () => {
  it("nenhum mecanismo de confirmação em lote existe — nem inativo, nem atrás de flag", () => {
    const suspeitos = ocorrencias(
      [...FONTES, ...MIGRATIONS],
      /confirmarEmBloco|confirmacaoEmBloco|confirmacao_em_bloco|bulkConfirm|confirmBulk|confirmAll|confirmarTodos|aceitarTodas/i,
    );
    expect(
      suspeitos,
      "Arquitetura §5.4.0: enquanto DP-5 estiver aberta, o regime de bloco não existe no repositório.",
    ).toEqual([]);
  });
});

describe("C-03 · Filtro eliminatório nunca é derivado", () => {
  const escritoresDeFiltro = escritoresDe(FONTES, "priority_profile_filters");

  it("existe exatamente um lugar que escreve filtros — e ele é conhecido", () => {
    expect(escritoresDeFiltro).toEqual(["src/modules/curadoria/repository.ts"]);
  });

  it("quem escreve filtro não conhece grau, ESSENCIAL nem o Protocolo da Pessoa", () => {
    for (const relativo of escritoresDeFiltro) {
      const fonte = readFileSync(path.join(RAIZ, relativo), "utf8");
      for (const padrao of [/ESSENCIAL/, /NEED_DEGREES?/, /\bdegree\b/, /PERSON_PROTOCOL/]) {
        expect(
          padrao.test(fonte),
          `${relativo} referencia ${padrao} — o filtro eliminatório passaria a nascer de derivação, e a Arquitetura §5.5 o proíbe.`,
        ).toBe(false);
      }
    }
  });
});

describe("C-04 · A única derivação autorizada não persiste nada", () => {
  it("`deriveRelationalState` (ADR-065) vive em módulo puro, sem escrita", () => {
    const fonte = readFileSync(
      path.join(RAIZ, "src", "modules", "curadoria", "motor-relacional.ts"),
      "utf8",
    );
    expect(fonte).toMatch(/export function deriveRelationalState/);
    for (const padrao of [/\.insert\(/, /\.upsert\(/, /\.update\(/, /\.delete\(/, /supabase/i]) {
      expect(
        padrao.test(fonte),
        "A derivação relacional é leitura. Se ela passar a escrever, vira declaração sem ato humano.",
      ).toBe(false);
    }
  });

  it("nenhum módulo de derivação escreve nos dois Mapas que alimentam o Motor", () => {
    const escrevemMapas = FONTES.filter((arquivo) => {
      const fonte = readFileSync(arquivo, "utf8");
      return (
        /case_priority_map|professional_subcriterion_map/.test(fonte) &&
        /\.insert\(|\.upsert\(|\.update\(|\.delete\(/.test(fonte)
      );
    }).map((a) => path.relative(RAIZ, a));

    for (const arquivo of escrevemMapas) {
      expect(
        /deriv/i.test(arquivo),
        `${arquivo} é módulo de derivação e escreve num Mapa do Motor. A Fronteira Humana (§2.4) existe exatamente para impedir isso.`,
      ).toBe(false);
    }
  });
});
