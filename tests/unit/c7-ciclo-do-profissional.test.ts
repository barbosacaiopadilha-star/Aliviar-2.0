import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  CICLOS,
  MOTIVOS,
  NOTA_MAXIMA,
  NOTA_MINIMA,
  ROTULO_DO_CICLO,
  TRANSICOES,
  avaliarTransicao,
  elegibilidadeEfetiva,
  motivosDaTransicao,
  preverImpacto,
  transicaoPermitida,
  type CicloDoProfissional,
  type MotivoDoCiclo,
} from "@/modules/profiles/ciclo-do-profissional";

/**
 * OPS-G5 · CORTE 7 — a matriz completa do ciclo, permitida e proibida.
 *
 * A régua é a matriz inteira, não uma amostra: as 16 combinações de origem ×
 * destino são exercitadas, e cada uma tem veredito declarado. Testar só as seis
 * permitidas provaria que o que funciona funciona — e deixaria as dez proibidas
 * sem guarda nenhuma.
 */

const RAIZ = process.cwd();
const MIGRATION = path.join(
  RAIZ,
  "supabase/migrations/20260814221743_ciclo_do_profissional_motivo_e_trilha.sql",
);

const PERMITIDAS: Array<[CicloDoProfissional, CicloDoProfissional]> = [
  ["PREPARACAO", "PUBLICADO_ATIVO"],
  ["PUBLICADO_ATIVO", "PAUSADO"],
  ["PAUSADO", "PUBLICADO_ATIVO"],
  ["PUBLICADO_ATIVO", "RETIRADO_ARQUIVADO"],
  ["PAUSADO", "RETIRADO_ARQUIVADO"],
  ["RETIRADO_ARQUIVADO", "PREPARACAO"],
];

const AUTOR = "11111111-1111-4111-8111-111111111111";
const QUANDO = "2026-08-14T22:00:00.000Z";

function pedido(sobre: Partial<Parameters<typeof avaliarTransicao>[0]> = {}) {
  return {
    de: "PUBLICADO_ATIVO" as CicloDoProfissional | null,
    para: "PAUSADO" as CicloDoProfissional,
    motivo: "REVISAO_CADASTRAL" as MotivoDoCiclo | null,
    nota: null as string | null,
    autorId: AUTOR as string | null,
    quando: QUANDO as string | null,
    temConexaoAtiva: false,
    ...sobre,
  };
}

describe("C7 · a matriz completa das 16 combinações", () => {
  const todas = CICLOS.flatMap((de) => CICLOS.map((para) => [de, para] as const));

  it("são 16 combinações, e 6 delas são passagens", () => {
    expect(todas).toHaveLength(16);
    expect(TRANSICOES).toHaveLength(6);
  });

  it.each(PERMITIDAS)("%s → %s é permitida e tem motivos próprios", (de, para) => {
    expect(transicaoPermitida(de, para)).toBe(true);
    expect(motivosDaTransicao(de, para).length).toBeGreaterThan(0);
  });

  it.each(
    todas.filter(([de, para]) => !PERMITIDAS.some(([a, b]) => a === de && b === para)),
  )("%s → %s é proibida", (de, para) => {
    expect(transicaoPermitida(de, para)).toBe(false);
    expect(motivosDaTransicao(de, para)).toEqual([]);
  });

  it("as proibições que mais importam estão nomeadas", () => {
    // Arquivado voltando direto à Rede entraria sem nova verificação — foi por
    // isso que a microerrata corrigiu o desenho original.
    expect(transicaoPermitida("RETIRADO_ARQUIVADO", "PUBLICADO_ATIVO")).toBe(false);
    expect(transicaoPermitida("RETIRADO_ARQUIVADO", "PAUSADO")).toBe(false);
    expect(transicaoPermitida("PREPARACAO", "PAUSADO")).toBe(false);
    expect(transicaoPermitida("PREPARACAO", "RETIRADO_ARQUIVADO")).toBe(false);
    expect(transicaoPermitida("PUBLICADO_ATIVO", "PREPARACAO")).toBe(false);
  });

  it("nenhum estado transita para si mesmo", () => {
    for (const ciclo of CICLOS) expect(transicaoPermitida(ciclo, ciclo)).toBe(false);
  });
});

describe("C7 · motivo canônico, e só o compatível", () => {
  it("motivo ausente é recusado", () => {
    const r = avaliarTransicao(pedido({ motivo: null }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.mensagem).toContain("exige um motivo");
  });

  it("motivo de outra transição é recusado", () => {
    // `ENCERRAMENTO_DA_ATUACAO` é de retirada; usá-lo para pausar seria
    // registrar uma razão que não descreve o ato praticado.
    const r = avaliarTransicao(pedido({ para: "PAUSADO", motivo: "ENCERRAMENTO_DA_ATUACAO" }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.mensagem).toContain("não vale para esta transição");
  });

  it("`SOLICITACAO_DO_PROFISSIONAL` vale em pausa e retirada, e não em publicação", () => {
    expect(motivosDaTransicao("PUBLICADO_ATIVO", "PAUSADO")).toContain("SOLICITACAO_DO_PROFISSIONAL");
    expect(motivosDaTransicao("PUBLICADO_ATIVO", "RETIRADO_ARQUIVADO")).toContain("SOLICITACAO_DO_PROFISSIONAL");
    expect(motivosDaTransicao("PREPARACAO", "PUBLICADO_ATIVO")).not.toContain("SOLICITACAO_DO_PROFISSIONAL");
  });

  it("todo motivo declarado é usado por alguma transição", () => {
    const usados = new Set(TRANSICOES.flatMap((t) => t.motivos));
    for (const motivo of MOTIVOS) {
      expect(usados.has(motivo), `${motivo} não é aceito em transição nenhuma`).toBe(true);
    }
  });
});

describe("C7 · OUTRO exige nota, e a nota tem limites", () => {
  const comOutro = (nota: string | null) =>
    avaliarTransicao(pedido({ para: "PAUSADO", motivo: "OUTRO", nota }));

  it("sem nota é recusado", () => {
    expect(comOutro(null).ok).toBe(false);
  });

  it("nota curta demais é recusada", () => {
    expect(comOutro("curta").ok).toBe(false);
    expect(comOutro("a".repeat(NOTA_MINIMA - 1)).ok).toBe(false);
  });

  it("espaço em branco não é nota", () => {
    expect(comOutro(" ".repeat(40)).ok).toBe(false);
  });

  it("nota longa demais é recusada", () => {
    expect(comOutro("a".repeat(NOTA_MAXIMA + 1)).ok).toBe(false);
  });

  it("nota no limite é aceita nas duas pontas", () => {
    expect(comOutro("a".repeat(NOTA_MINIMA)).ok).toBe(true);
    expect(comOutro("a".repeat(NOTA_MAXIMA)).ok).toBe(true);
  });

  it("motivo canônico não exige nota", () => {
    expect(avaliarTransicao(pedido({ motivo: "REVISAO_CADASTRAL", nota: null })).ok).toBe(true);
  });
});

describe("C7 · autoria e instante", () => {
  it("sem autor é recusado", () => {
    const r = avaliarTransicao(pedido({ autorId: null }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.mensagem).toContain("tem autor");
  });

  it("sem data é recusado", () => {
    const r = avaliarTransicao(pedido({ quando: null }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.mensagem).toContain("data própria");
  });
});

describe("C7 · guarda 11 — Connection ativa recusa a retirada", () => {
  it("retirar com acompanhamento em curso é recusado", () => {
    const r = avaliarTransicao(pedido({ para: "RETIRADO_ARQUIVADO", motivo: "ENCERRAMENTO_DA_ATUACAO", temConexaoAtiva: true }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.mensagem).toContain("acompanhamento em curso");
  });

  it("retirar sem acompanhamento em curso é aceito", () => {
    expect(
      avaliarTransicao(pedido({ para: "RETIRADO_ARQUIVADO", motivo: "ENCERRAMENTO_DA_ATUACAO", temConexaoAtiva: false })).ok,
    ).toBe(true);
  });

  it("PAUSAR com acompanhamento em curso é aceito — e isso é o desenho", () => {
    // Pausa tira das composições novas e preserva quem já está sendo atendido.
    // Bloquear a pausa empurraria o Admin para a retirada, que é pior.
    expect(avaliarTransicao(pedido({ para: "PAUSADO", motivo: "INDISPONIBILIDADE_TEMPORARIA", temConexaoAtiva: true })).ok).toBe(true);
  });
});

describe("C7 · reativação passa por PREPARACAO", () => {
  it("o caminho de volta tem duas passagens, nunca uma", () => {
    expect(transicaoPermitida("RETIRADO_ARQUIVADO", "PUBLICADO_ATIVO")).toBe(false);
    expect(transicaoPermitida("RETIRADO_ARQUIVADO", "PREPARACAO")).toBe(true);
    expect(transicaoPermitida("PREPARACAO", "PUBLICADO_ATIVO")).toBe(true);
  });

  it("a volta ao arquivo exige motivo próprio de retorno", () => {
    const motivos = motivosDaTransicao("RETIRADO_ARQUIVADO", "PREPARACAO");
    expect(motivos).toContain("RETORNO_SOLICITADO");
    expect(motivos).toContain("REGULARIZACAO_CONCLUIDA");
    expect(motivos).not.toContain("CADASTRO_VALIDADO");
  });
});

describe("C7 · legado ambíguo é inelegível e não é reclassificado em silêncio", () => {
  it("transição a partir de nulo é recusada", () => {
    const r = avaliarTransicao(pedido({ de: null, para: "PUBLICADO_ATIVO", motivo: "CADASTRO_VALIDADO" }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.mensagem).toContain("legado sem ciclo classificado");
  });

  it("nulo é inelegível, e a lista diz por quê", () => {
    const e = elegibilidadeEfetiva({ ciclo: null, isDemo: false, isTestFixture: false });
    expect(e.elegivel).toBe(false);
    expect(e.motivo).toContain("pendente de revisão");
  });

  it("a migration não inventa PAUSADO nem RETIRADO a partir do binário antigo", () => {
    const sql = readFileSync(MIGRATION, "utf8");
    const backfill = sql.slice(sql.indexOf("-- 3 · Legado"), sql.indexOf("-- 4 · A matriz"));
    expect(backfill).toContain("'PUBLICADO_ATIVO'");
    expect(backfill).toContain("'PREPARACAO'");
    expect(backfill, "o backfill inferiu PAUSADO do estado binário").not.toContain("'PAUSADO'");
    expect(backfill, "o backfill inferiu RETIRADO_ARQUIVADO do estado binário").not.toContain("'RETIRADO_ARQUIVADO'");
  });

  it("o backfill não fabrica motivo, autoria nem data retroativos", () => {
    const sql = readFileSync(MIGRATION, "utf8");
    const backfill = sql.slice(sql.indexOf("-- 3 · Legado"), sql.indexOf("-- 4 · A matriz"));
    // A régua é o que os `update` FAZEM, não o que a doutrina comenta: o texto
    // cita essas colunas justamente para dizer que não as preenche.
    const comandos = backfill.replace(/^\s*--.*$/gm, "");
    for (const coluna of ["ciclo_motivo", "ciclo_alterado_por", "ciclo_alterado_em"]) {
      expect(comandos, `o backfill preencheu \`${coluna}\` retroativamente`).not.toContain(coluna);
    }
    // E o único `set` do backfill é o do próprio ciclo.
    const sets = [...comandos.matchAll(/set\s+(\w+)\s*=/g)].map((m) => m[1]);
    expect(new Set(sets)).toEqual(new Set(["ciclo_de_vida"]));
  });

  it("o default só entra depois do backfill", () => {
    const sql = readFileSync(MIGRATION, "utf8");
    // Se o default viesse antes, o Postgres teria preenchido as linhas
    // existentes e apagado a distinção entre "nasce em preparação" e "legado".
    expect(sql.indexOf("set default 'PREPARACAO'")).toBeGreaterThan(sql.indexOf("-- 3 · Legado"));
    expect(sql.indexOf("set default 'PREPARACAO'")).toBeGreaterThan(sql.lastIndexOf("update curadoria.professional_profiles"));
  });
});

describe("C7 · elegibilidade efetiva — badge que não mente", () => {
  it.each(CICLOS)("%s: só PUBLICADO_ATIVO é elegível", (ciclo) => {
    const e = elegibilidadeEfetiva({ ciclo, isDemo: false, isTestFixture: false });
    expect(e.elegivel).toBe(ciclo === "PUBLICADO_ATIVO");
    if (!e.elegivel) expect(e.motivo).toBe(ROTULO_DO_CICLO[ciclo]);
  });

  it("DEMO nunca é elegível, mesmo publicado e ativo", () => {
    const e = elegibilidadeEfetiva({ ciclo: "PUBLICADO_ATIVO", isDemo: true, isTestFixture: false });
    expect(e.elegivel).toBe(false);
    expect(e.motivo).toContain("demonstração");
  });

  it("fixture nunca é elegível", () => {
    expect(elegibilidadeEfetiva({ ciclo: "PUBLICADO_ATIVO", isDemo: false, isTestFixture: true }).elegivel).toBe(false);
  });
});

describe("C7 · prévia de impacto", () => {
  it("retirada com acompanhamento em curso é bloqueada, e a prévia diz quantos", () => {
    const um = preverImpacto({ de: "PUBLICADO_ATIVO", para: "RETIRADO_ARQUIVADO", conexoesAtivas: 1 });
    expect(um.bloqueio).toContain("1 acompanhamento em curso");
    expect(um.consequencias).toEqual([]);

    const varios = preverImpacto({ de: "PUBLICADO_ATIVO", para: "RETIRADO_ARQUIVADO", conexoesAtivas: 3 });
    expect(varios.bloqueio).toContain("3 acompanhamentos em curso");
  });

  it("toda prévia diz que o histórico entregue não muda", () => {
    for (const [de, para] of PERMITIDAS) {
      const impacto = preverImpacto({ de, para, conexoesAtivas: 0 });
      expect(impacto.preservado.join(" "), `${de}→${para} não preservou o histórico na prévia`).toContain(
        "permanecem exatamente como estão",
      );
    }
  });

  it("pausa e retirada dizem que saem das composições novas", () => {
    for (const para of ["PAUSADO", "RETIRADO_ARQUIVADO"] as const) {
      const impacto = preverImpacto({ de: "PUBLICADO_ATIVO", para, conexoesAtivas: 0 });
      expect(impacto.consequencias.join(" ")).toContain("Sai das próximas composições");
    }
  });

  it("a pausa avisa que o acompanhamento continua", () => {
    const impacto = preverImpacto({ de: "PUBLICADO_ATIVO", para: "PAUSADO", conexoesAtivas: 2 });
    expect(impacto.bloqueio).toBeNull();
    expect(impacto.consequencias.join(" ")).toContain("continuam normalmente");
  });
});

describe("C7 · o módulo espelha a migration, caso a caso", () => {
  const sql = readFileSync(MIGRATION, "utf8");
  const matriz = sql.slice(sql.indexOf("create or replace function curadoria.motivos_da_transicao"), sql.indexOf("comment on function curadoria.motivos_da_transicao"));

  it("nenhuma cláusula da matriz SQL esquece a origem", () => {
    // Um `when _para = 'X'` sem origem parece abreviação e é uma transição
    // extra: casa com qualquer estado de partida. Foi assim que a retirada
    // direto da preparação entrou sem ninguém escrevê-la.
    const clausulas = [...matriz.matchAll(/^\s*when (.+?)\s*$/gm)].map((m) => m[1]!);
    // Uma cláusula pode agrupar origens (`_de in (...)`), então são no máximo
    // tantas quantas as transições — nunca mais, e nunca nenhuma.
    expect(clausulas.length).toBeGreaterThan(0);
    expect(clausulas.length).toBeLessThanOrEqual(TRANSICOES.length);
    for (const clausula of clausulas) {
      expect(clausula, `esta cláusula não nomeia a origem: "${clausula}"`).toContain("_de");
      expect(clausula, `esta cláusula não nomeia o destino: "${clausula}"`).toContain("_para");
    }
  });

  it.each(TRANSICOES)("$de → $para: os mesmos motivos no SQL", ({ motivos }) => {
    // Se a interface oferecesse um motivo que o banco recusa, o Admin
    // descobriria isso no meio do ato — depois de escrever a justificativa.
    for (const motivo of motivos) {
      expect(matriz, `${motivo} não aparece na matriz SQL`).toContain(`'${motivo}'`);
    }
  });

  it("os quatro estados e os doze motivos existem no enum do banco", () => {
    for (const ciclo of CICLOS) expect(sql).toContain(`'${ciclo}'`);
    for (const motivo of MOTIVOS) expect(sql).toContain(`'${motivo}'`);
  });

  it("a definição de Connection ativa vem da fonte canônica", () => {
    // ⛔ Nenhuma segunda definição: a guarda lê pela negativa do único estado
    // terminal de `connection_records`.
    expect(sql).toContain("c.status <> 'ENCERRADO_SEM_RELACIONAMENTO'");
    const conexao = readFileSync(path.join(RAIZ, "src/modules/connection/types.ts"), "utf8");
    expect(conexao).toContain('"ENCERRADO_SEM_RELACIONAMENTO"');
  });

  it("a guarda do trigger e a trilha existem, e a trilha é definer com search_path fixo", () => {
    expect(sql).toContain("create trigger assert_ciclo_do_profissional");
    expect(sql).toContain("create trigger registrar_trilha_do_ciclo");
    expect(sql).toContain("insert into curadoria.audit_logs");
    const trilha = sql.slice(sql.indexOf("function curadoria.registrar_trilha_do_ciclo"));
    expect(trilha).toContain("security definer");
    expect(trilha).toContain("set search_path = ''");
    expect(sql).toContain("revoke execute on function curadoria.registrar_trilha_do_ciclo() from public");
    expect(sql, "a trilha abriu SQL dinâmico").not.toMatch(/execute\s+format\(/i);
  });

  it("a validação do ciclo é SECURITY INVOKER — não precisa de privilégio extra", () => {
    const guarda = sql.slice(
      sql.indexOf("function curadoria.assert_ciclo_do_profissional"),
      sql.indexOf("drop trigger if exists assert_ciclo_do_profissional"),
    );
    expect(guarda, "a guarda virou security definer sem necessidade").not.toContain("security definer");
  });

  it("as guardas de publicação não foram replicadas", () => {
    // A fonte é `assert_publication_requirements`, desde 20260727071000. Ler
    // `publication_status` para CLASSIFICAR o legado é legítimo; o que não pode
    // é esta migration voltar a DECIDIR quem pode publicar.
    const comandos = sql.replace(/^\s*--.*$/gm, "");
    for (const regra of ["registration_status", "area de atuacao", "verified_area", "crm"]) {
      expect(comandos, `a migration replicou a regra de publicação: ${regra}`).not.toContain(regra);
    }
    // Nenhuma recusa desta migration fala de requisito de publicação.
    const recusas = [...comandos.matchAll(/raise exception '([^']+)'/g)].map((m) => m[1]);
    expect(recusas.length).toBeGreaterThan(5);
    for (const recusa of recusas) {
      expect(recusa.toLowerCase(), `esta migration recusou por regra de publicação: "${recusa}"`).not.toMatch(
        /publica[çc]|registro profissional|conselho/,
      );
    }
  });
});

describe("C7 · hard delete só sem história", () => {
  const sql = readFileSync(MIGRATION, "utf8");

  it("a recusa considera todas as fontes de histórico operacional", () => {
    const guarda = sql.slice(sql.indexOf("function curadoria.assert_exclusao_sem_historia"));
    for (const tabela of [
      "connection_records",
      "curated_selection_options",
      "curadoria_report_options",
      "professional_subcriterion_map",
      "practice_evidence",
    ]) {
      expect(guarda, `a exclusão ignora \`${tabela}\``).toContain(tabela);
    }
  });

  it("a recusa aponta o caminho certo, que é retirar", () => {
    expect(sql).toContain("Retire da rede — o histórico permanece.");
  });

  it("o gatilho é BEFORE DELETE, não um aviso na interface", () => {
    expect(sql).toContain("before delete on curadoria.professional_profiles");
  });
});
