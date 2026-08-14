import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * OPS-G5 · CORTE 7 — o writer do ciclo, camada por camada.
 *
 * A pergunta que estes testes respondem não é "a action funciona", e sim: **o
 * que ela recusa antes de tocar no banco, o que ela deixa o banco recusar, e de
 * onde vem a autoria**. Um writer que valida tudo em JavaScript e confia no
 * resultado protege a interface, não os dados; um que não valida nada devolve
 * código de erro do Postgres para uma pessoa. Aqui os dois erros são visíveis.
 */

const mocks = vi.hoisted(() => ({
  requireRoleForAction: vi.fn(),
  select: vi.fn(),
  update: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@/modules/auth/guard", () => ({
  requireRoleForAction: mocks.requireRoleForAction,
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));

vi.mock("@/lib/observability/erros", () => ({
  // A régua aqui é a mensagem que chega à pessoa, não o formato do log.
  falhaParaUsuario: (_escopo: string, _erro: unknown, sobre: { mensagem: string }) => sobre.mensagem,
}));

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: async () => ({
    schema: () => ({
      from: () => ({
        select: mocks.select,
        update: mocks.update,
      }),
    }),
  }),
}));

const { mudarCicloDoProfissionalAction, preverImpactoDaTransicaoAction } = await import(
  "@/modules/profiles/ciclo-do-profissional-actions"
);

const PROFISSIONAL = "22222222-2222-4222-8222-222222222222";
const ADMIN = "33333333-3333-4333-8333-333333333333";

/** O `select(...).eq(...).single()` que a action faz para ler o estado atual. */
function estadoAtual(ciclo: string | null) {
  mocks.select.mockReturnValue({
    eq: () => ({ single: async () => ({ data: { ciclo_de_vida: ciclo }, error: null }) }),
  });
}

/** O `update(...).eq(...)` — devolve o que o trigger diria. */
function bancoResponde(error: { message: string } | null) {
  const eq = vi.fn(async () => ({ error }));
  mocks.update.mockReturnValue({ eq });
  return eq;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireRoleForAction.mockResolvedValue({ user: { id: ADMIN } });
});

describe("C7 · o papel é exigido antes de tudo", () => {
  it("sem administrador, nada acontece — nem leitura", async () => {
    mocks.requireRoleForAction.mockRejectedValue(new Error("não autorizado"));
    estadoAtual("PUBLICADO_ATIVO");

    await expect(
      mudarCicloDoProfissionalAction({ profissionalId: PROFISSIONAL, para: "PAUSADO", motivo: "REVISAO_CADASTRAL" }),
    ).rejects.toThrow("não autorizado");

    expect(mocks.select, "leu o cadastro sem confirmar o papel").not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("a previsão de impacto também exige administrador", async () => {
    mocks.requireRoleForAction.mockRejectedValue(new Error("não autorizado"));
    await expect(preverImpactoDaTransicaoAction(PROFISSIONAL, "RETIRADO_ARQUIVADO")).rejects.toThrow("não autorizado");
  });
});

describe("C7 · o que é recusado antes de tocar no banco", () => {
  it("transição fora da matriz não chega a virar escrita", async () => {
    estadoAtual("RETIRADO_ARQUIVADO");
    const eq = bancoResponde(null);

    const r = await mudarCicloDoProfissionalAction({
      profissionalId: PROFISSIONAL,
      para: "PUBLICADO_ATIVO",
      motivo: "CADASTRO_VALIDADO",
    });

    expect(r.success).toBe(false);
    expect(eq, "escreveu no banco uma transição que a matriz já recusava").not.toHaveBeenCalled();
  });

  it("motivo que não vale para a transição é recusado cedo", async () => {
    estadoAtual("PUBLICADO_ATIVO");
    const eq = bancoResponde(null);

    const r = await mudarCicloDoProfissionalAction({
      profissionalId: PROFISSIONAL,
      para: "PAUSADO",
      motivo: "ENCERRAMENTO_DA_ATUACAO",
    });

    expect(r.success).toBe(false);
    expect(eq).not.toHaveBeenCalled();
  });

  it("OUTRO sem nota é recusado cedo", async () => {
    estadoAtual("PUBLICADO_ATIVO");
    const eq = bancoResponde(null);

    const r = await mudarCicloDoProfissionalAction({
      profissionalId: PROFISSIONAL,
      para: "PAUSADO",
      motivo: "OUTRO",
      nota: "curta",
    });

    expect(r.success).toBe(false);
    expect(eq).not.toHaveBeenCalled();
  });

  it("legado sem ciclo não transita — a revisão vem antes", async () => {
    estadoAtual(null);
    const eq = bancoResponde(null);

    const r = await mudarCicloDoProfissionalAction({
      profissionalId: PROFISSIONAL,
      para: "PUBLICADO_ATIVO",
      motivo: "CADASTRO_VALIDADO",
    });

    expect(r.success).toBe(false);
    expect(eq).not.toHaveBeenCalled();
  });
});

describe("C7 · a autoria vem da sessão", () => {
  it("o autor e o instante são escritos pelo servidor, nunca recebidos", async () => {
    estadoAtual("PREPARACAO");
    const eq = bancoResponde(null);
    const antes = Date.now();

    const r = await mudarCicloDoProfissionalAction({
      profissionalId: PROFISSIONAL,
      para: "PUBLICADO_ATIVO",
      motivo: "CADASTRO_VALIDADO",
    });

    expect(r.success).toBe(true);
    const escrito = mocks.update.mock.calls[0]![0] as Record<string, unknown>;
    expect(escrito.ciclo_alterado_por, "a autoria não veio da sessão").toBe(ADMIN);
    expect(escrito.ciclo_motivo).toBe("CADASTRO_VALIDADO");
    expect(new Date(escrito.ciclo_alterado_em as string).getTime()).toBeGreaterThanOrEqual(antes);
    expect(eq).toHaveBeenCalledTimes(1);
  });

  it("a mudança é publicada nas duas rotas que a mostram", async () => {
    estadoAtual("PREPARACAO");
    bancoResponde(null);

    await mudarCicloDoProfissionalAction({
      profissionalId: PROFISSIONAL,
      para: "PUBLICADO_ATIVO",
      motivo: "CADASTRO_VALIDADO",
    });

    const rotas = mocks.revalidatePath.mock.calls.map((c) => c[0]);
    expect(rotas).toContain(`/admin/profissionais/${PROFISSIONAL}`);
    expect(rotas).toContain("/admin/profissionais");
  });
});

describe("C7 · o que só o banco pode recusar", () => {
  it("a frase da guarda 11 sobe inteira, sem virar erro genérico", async () => {
    // A action não conta Connections para decidir: se contasse, existiriam duas
    // versões da guarda 11 e a de JavaScript envelheceria primeiro.
    estadoAtual("PUBLICADO_ATIVO");
    bancoResponde({
      message: "Este profissional tem acompanhamento em curso. Encerre ou substitua antes de retirar da rede.",
    });

    const r = await mudarCicloDoProfissionalAction({
      profissionalId: PROFISSIONAL,
      para: "RETIRADO_ARQUIVADO",
      motivo: "ENCERRAMENTO_DA_ATUACAO",
    });

    expect(r.success).toBe(false);
    expect(r.success === false && r.error).toContain("acompanhamento em curso");
  });

  it("a transição que a matriz permite chega ao banco — a última palavra é dele", async () => {
    estadoAtual("PUBLICADO_ATIVO");
    const eq = bancoResponde(null);

    const r = await mudarCicloDoProfissionalAction({
      profissionalId: PROFISSIONAL,
      para: "RETIRADO_ARQUIVADO",
      motivo: "ENCERRAMENTO_DA_ATUACAO",
    });

    expect(r.success, "a action recusou sozinha o que cabe ao trigger julgar").toBe(true);
    expect(eq).toHaveBeenCalledTimes(1);
  });
});

describe("C7 · a previsão de impacto", () => {
  function comConexoes(ciclo: string | null, quantas: number) {
    mocks.select
      .mockReturnValueOnce({
        eq: () => ({ single: async () => ({ data: { ciclo_de_vida: ciclo }, error: null }) }),
      })
      .mockReturnValueOnce({
        eq: () => ({ neq: async () => ({ count: quantas, error: null }) }),
      });
  }

  it("com acompanhamento em curso, a retirada aparece bloqueada antes da confirmação", async () => {
    comConexoes("PUBLICADO_ATIVO", 2);
    const r = await preverImpactoDaTransicaoAction(PROFISSIONAL, "RETIRADO_ARQUIVADO");

    expect(r.success).toBe(true);
    expect(r.success === true && r.data.bloqueio, "a retirada foi oferecida sem aviso").not.toBeNull();
  });

  it("sem acompanhamento, a retirada é oferecida com as consequências à vista", async () => {
    comConexoes("PUBLICADO_ATIVO", 0);
    const r = await preverImpactoDaTransicaoAction(PROFISSIONAL, "RETIRADO_ARQUIVADO");

    expect(r.success).toBe(true);
    expect(r.success === true && r.data.bloqueio).toBeNull();
    expect(r.success === true && r.data.consequencias.length).toBeGreaterThan(0);
    expect(r.success === true && r.data.preservado.length, "não disse o que permanece").toBeGreaterThan(0);
  });

  it("legado sem ciclo é dito como tal, em vez de arbitrar um estado", async () => {
    comConexoes(null, 0);
    const r = await preverImpactoDaTransicaoAction(PROFISSIONAL, "PUBLICADO_ATIVO");

    expect(r.success).toBe(true);
    expect(r.success === true && r.data.bloqueio).toContain("legado");
  });
});
