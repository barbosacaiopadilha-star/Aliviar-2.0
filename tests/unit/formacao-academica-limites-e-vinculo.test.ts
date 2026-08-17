import { describe, expect, it, vi } from "vitest";

import {
  ERRO_ARQUIVO_GRANDE,
  ERRO_DOCUMENTO_DE_OUTRO,
  ERRO_PAGINAS,
  ERRO_PRAZO,
  ERRO_TEXTO_GRANDE,
  LIMITES,
  processarCurriculo,
} from "@/modules/profiles/formacao-academica-extracao";

/**
 * F-1 e F-3 — O VÍNCULO E OS LIMITES, FALSEÁVEIS SEM BANCO.
 *
 * F-1: currículo do profissional B não vira formação do profissional A. E a
 * recusa é REJEIÇÃO, não extração que falhou: não nasce run, não nasce vínculo,
 * não nasce formação — o teste conta as escritas, não confia na intenção.
 *
 * F-3: cada limite é medido nos três pontos que importam — abaixo, exatamente
 * no teto e acima —, mais o prazo. Em nenhum caminho de recusa pode sobrar
 * formação parcial, e o `erro` gravado é CLASSE: nenhuma linha do currículo
 * atravessa para coluna ou log.
 */

const CV = "Graduação em Medicina — Universidade Federal de Minas Gerais, 2004-2010";

type Escrita = { tabela: string; linha: Record<string, unknown> };

/**
 * Cliente falso mínimo: registra toda escrita e responde às leituras que o
 * pipeline faz. `donoDoDocumento` decide o desfecho do vínculo do F-1.
 */
function fakeSupabase({ donoDoDocumento = true }: { donoDoDocumento?: boolean } = {}) {
  const escritas: Escrita[] = [];
  const exclusoes: Array<{ tabela: string; ids: unknown }> = [];
  /** Filtros aplicados por tabela — é aqui que o F-1 é falseável. */
  const filtros: Array<{ tabela: string; coluna: string }> = [];

  const construir = (tabela: string) => {
    const api: Record<string, unknown> = {};
    let ultimoInsert: Record<string, unknown> | null = null;

    api.select = () => api;
    api.eq = (coluna: string) => {
      filtros.push({ tabela, coluna });
      return api;
    };
    api.in = () => api;
    api.insert = (linha: Record<string, unknown>) => {
      ultimoInsert = linha;
      escritas.push({ tabela, linha });
      return api;
    };
    api.delete = () => ({ in: (_c: string, ids: unknown) => { exclusoes.push({ tabela, ids }); return Promise.resolve({ error: null }); } });
    api.maybeSingle = () =>
      Promise.resolve({
        data: tabela === "professional_documents" ? (donoDoDocumento ? { id: "doc-1" } : null) : null,
        error: null,
      });
    api.single = () =>
      Promise.resolve(
        tabela === "professional_documents"
          ? { data: donoDoDocumento ? { file_path: "prof/cv.pdf" } : null, error: null }
          : { data: { id: `${tabela}-gerado` }, error: null },
      );
    // `select` sem `single` resolve como lista (estado atual e vínculos).
    api.then = (resolver: (v: { data: unknown[]; error: null }) => unknown) =>
      resolver({ data: [], error: null });
    void ultimoInsert;
    return api;
  };

  return {
    escritas,
    exclusoes,
    filtros,
    cliente: {
      from: (tabela: string) => construir(tabela),
      storage: { from: () => ({ download: () => Promise.resolve({ data: null, error: new Error("x") }) }) },
    } as never,
  };
}

const base = (bytes: number, lerPdf?: () => Promise<{ texto: string; paginas: number }>) => ({
  professionalProfileId: "prof-A",
  documentId: "doc-de-B",
  actorId: "admin-1",
  baixarPdf: async () => new Uint8Array(bytes),
  lerPdf: lerPdf ?? (async () => ({ texto: CV, paginas: 1 })),
});

describe("F-1 · o documento tem de ser DO profissional", () => {
  it("documento de outro profissional é REJEITADO — e não nasce run, vínculo ou formação", async () => {
    const { cliente, escritas, exclusoes } = fakeSupabase({ donoDoDocumento: false });

    const r = await processarCurriculo({
      supabase: cliente,
      professionalProfileId: "prof-A",
      documentId: "doc-de-B",
      actorId: "admin-1",
      // sem `baixarPdf`: é o caminho real, o único em que o vínculo é conferido
    });

    expect(r.status).toBe("falha");
    expect(r.erro).toBe(ERRO_DOCUMENTO_DE_OUTRO);
    expect(r.runId, "rejeição não registra execução").toBeNull();
    expect(r.criadas).toBe(0);
    expect(escritas, "nenhuma escrita — nem run, nem vínculo, nem formação").toEqual([]);
    expect(exclusoes, "rejeição não apaga nada").toEqual([]);
  });

  it("a consulta do documento filtra pelas DUAS colunas — é o que a correção instituiu", async () => {
    // Este é o oráculo que morde a mutação: sem `professional_profile_id` no
    // filtro, o pipeline volta a aceitar documento alheio, e aqui cai.
    const { cliente, filtros } = fakeSupabase({ donoDoDocumento: true });
    await processarCurriculo({
      supabase: cliente,
      professionalProfileId: "prof-A",
      documentId: "doc-A",
      actorId: "admin-1",
      lerPdf: async () => ({ texto: CV, paginas: 1 }),
    });

    const doDocumento = filtros
      .filter((f) => f.tabela === "professional_documents")
      .map((f) => f.coluna);
    expect(doDocumento, "a busca do documento não filtrou por id").toContain("id");
    expect(
      doDocumento,
      "a busca do documento não exigiu que ele seja DO profissional",
    ).toContain("professional_profile_id");
  });

  it("o erro é classe fechada — não carrega nome, título nem trecho de currículo", async () => {
    const { cliente } = fakeSupabase({ donoDoDocumento: false });
    const r = await processarCurriculo({
      supabase: cliente,
      professionalProfileId: "prof-A",
      documentId: "doc-de-B",
      actorId: "admin-1",
    });
    expect(r.erro).toBe("documento_de_outro_profissional");
    expect(r.erro).not.toContain("Universidade");
    expect(r.erro).not.toContain("Medicina");
  });
});

describe("F-3 · limites explícitos, medidos nos três pontos", () => {
  /**
   * Os VALORES ficam presos aqui, em números literais, e não derivados da
   * constante: um teste que acompanha o limite não percebe o limite sendo
   * afrouxado. Trocar qualquer um destes números passa a exigir trocar este
   * teste — política vira decisão visível, não edição silenciosa.
   */
  it("os quatro tetos são exatamente os justificados", () => {
    expect(LIMITES.MAX_BYTES, "teto do bucket professional-documents (20 MiB)").toBe(20 * 1024 * 1024);
    expect(LIMITES.MAX_PAGINAS, "currículo médico real cabe com folga").toBe(60);
    expect(LIMITES.MAX_CHARS_TEXTO, "margem de 2× sobre 60 páginas densas").toBe(400_000);
    expect(LIMITES.PRAZO_MS, "abaixo do menor teto de duração da função Node").toBe(9_000);
  });

  it("logo ABAIXO do teto de bytes: não é recusado por tamanho", async () => {
    const { cliente } = fakeSupabase();
    const r = await processarCurriculo({ supabase: cliente, ...base(LIMITES.MAX_BYTES - 1) });
    expect(r.erro).not.toBe(ERRO_ARQUIVO_GRANDE);
  });

  it("EXATAMENTE no teto de bytes: passa — o limite é inclusivo", async () => {
    const { cliente } = fakeSupabase();
    const r = await processarCurriculo({ supabase: cliente, ...base(LIMITES.MAX_BYTES) });
    expect(r.erro).not.toBe(ERRO_ARQUIVO_GRANDE);
  });

  it("logo ACIMA do teto de bytes: recusa nomeada, zero formação", async () => {
    const { cliente, escritas } = fakeSupabase();
    const r = await processarCurriculo({ supabase: cliente, ...base(LIMITES.MAX_BYTES + 1) });
    expect(r.erro).toBe(ERRO_ARQUIVO_GRANDE);
    expect(r.criadas).toBe(0);
    expect(
      escritas.filter((e) => e.tabela === "professional_education_entries"),
      "recusa por tamanho não cria formação",
    ).toEqual([]);
    const runs = escritas.filter((e) => e.tabela === "professional_education_extraction_runs");
    expect(runs).toHaveLength(1);
    expect(runs[0]!.linha.status).toBe("falha");
    expect(runs[0]!.linha.erro).toBe(ERRO_ARQUIVO_GRANDE);
  });

  it("páginas: no teto passa, acima recusa", async () => {
    const noTeto = fakeSupabase();
    const rTeto = await processarCurriculo({
      supabase: noTeto.cliente,
      ...base(1000, async () => ({ texto: CV.repeat(200), paginas: LIMITES.MAX_PAGINAS })),
    });
    expect(rTeto.erro).not.toBe(ERRO_PAGINAS);

    const acima = fakeSupabase();
    const rAcima = await processarCurriculo({
      supabase: acima.cliente,
      ...base(1000, async () => ({ texto: CV.repeat(200), paginas: LIMITES.MAX_PAGINAS + 1 })),
    });
    expect(rAcima.erro).toBe(ERRO_PAGINAS);
    expect(rAcima.criadas).toBe(0);
    expect(
      acima.escritas.filter((e) => e.tabela === "professional_education_entries"),
    ).toEqual([]);
  });

  it("texto: acima do teto recusa sem formação parcial", async () => {
    const { cliente, escritas } = fakeSupabase();
    const r = await processarCurriculo({
      supabase: cliente,
      ...base(1000, async () => ({
        texto: "a".repeat(LIMITES.MAX_CHARS_TEXTO + 1),
        paginas: 10,
      })),
    });
    expect(r.erro).toBe(ERRO_TEXTO_GRANDE);
    expect(escritas.filter((e) => e.tabela === "professional_education_entries")).toEqual([]);
  });

  // O antigo `comPrazo` (Promise.race que só limitava a ESPERA) foi removido
  // pela correção do F-3: o prazo agora CANCELA a tarefa do PDF.js de verdade.
  // As provas do cancelamento vivem em formacao-academica-cancelamento.test.ts.

  it("prazo estourado na leitura vira run 'falha' com `prazo_excedido`, sem formação", async () => {
    const { cliente, escritas } = fakeSupabase();
    const r = await processarCurriculo({
      supabase: cliente,
      ...base(1000, async () => {
        throw new Error(ERRO_PRAZO);
      }),
    });
    expect(r.erro).toBe(ERRO_PRAZO);
    expect(r.requerPdfTextual, "prazo não é currículo visual — não pede outro PDF").toBe(false);
    expect(escritas.filter((e) => e.tabela === "professional_education_entries")).toEqual([]);
  });

  it("F-2 · leitor da paciente devolve ERRO tipado, nunca lista vazia", async () => {
    const { listarFormacaoConfirmada } = await import(
      "@/modules/profiles/formacao-academica-repository"
    );

    const clienteComErro = {
      from: () => ({
        select: () => ({
          in: () => ({
            eq: () =>
              Promise.resolve({
                data: null,
                error: { message: "permission denied for table professional_education_entries" },
              }),
          }),
        }),
      }),
    } as never;

    const r = await listarFormacaoConfirmada(clienteComErro, ["prof-A"]);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.motivo).toBe("indisponivel");

    const clienteOk = {
      from: () => ({
        select: () => ({ in: () => ({ eq: () => Promise.resolve({ data: [], error: null }) }) }),
      }),
    } as never;
    const vazio = await listarFormacaoConfirmada(clienteOk, ["prof-A"]);
    expect(vazio.ok, "ausência legítima continua sendo sucesso com lista vazia").toBe(true);
    if (vazio.ok) expect(vazio.porProfissional.size).toBe(0);
  });

  it("nenhuma recusa escreve conteúdo do currículo em coluna, e nada vai para o log", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const spyLog = vi.spyOn(console, "log").mockImplementation(() => {});
    const { cliente, escritas } = fakeSupabase();

    await processarCurriculo({ supabase: cliente, ...base(LIMITES.MAX_BYTES + 1) });

    for (const e of escritas) {
      const serializada = JSON.stringify(e.linha);
      expect(serializada, "trecho de currículo em coluna").not.toContain("Universidade");
      expect(serializada).not.toContain("Medicina");
    }
    expect(spy, "erro de recurso não vai para o log").not.toHaveBeenCalled();
    expect(spyLog).not.toHaveBeenCalled();
    spy.mockRestore();
    spyLog.mockRestore();
  });
});
