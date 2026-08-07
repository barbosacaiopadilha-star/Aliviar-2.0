import { describe, expect, it, vi } from "vitest";

/**
 * ITEM 1.10B-P2 · ETAPA 1 — o LEITOR da cadeia (A4).
 *
 * O montador puro já tinha teste; quem não tinha era o caminho de leitura — e
 * é ele que decide o que a superfície viva vai receber. Aqui as três fontes são
 * substituídas por duplas, para que o teste prove a TRADUÇÃO de fonte para
 * cadeia, sem depender de banco.
 */

const loadCaseNeeds = vi.hoisted(() => vi.fn());
const loadCasePriorityMap = vi.hoisted(() => vi.fn());
const loadProfessionalMap = vi.hoisted(() => vi.fn());

vi.mock("@/modules/curadoria/protocolos-repository", () => ({ loadCaseNeeds }));
vi.mock("@/modules/curadoria/mapa-prioridades-repository", () => ({ loadCasePriorityMap }));
vi.mock("@/modules/curadoria/mapa-profissional-repository", () => ({ loadProfessionalMap }));

const { loadCadeiaDeProveniencia } = await import(
  "@/modules/curadoria/cadeia-de-proveniencia-repository"
);

/**
 * 1.8-R1 · A1 — o leitor consulta duas fontes novas: a proposta persistida
 * (via a CAPABILITY `ler_proposta_para_proveniencia`, §21 — nunca a tabela) e
 * a evidência alcançada pelo vínculo. A dupla responde por tabela para o
 * `.from(...)` e por nome para o `.rpc(...)`; consultas encadeadas terminam
 * tanto em `maybeSingle()` quanto em `await`.
 */
const TABELAS: Record<string, unknown[]> = {};
let RPC_PROPOSTA: { data: unknown[] | null; error: { message: string } | null } = {
  data: [],
  error: null,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabase = {
  from(tabela: string) {
    const linhas = TABELAS[tabela] ?? [];
    const resposta = { data: linhas, error: null };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cadeia: any = {
      select: () => cadeia,
      eq: () => cadeia,
      maybeSingle: async () => ({ data: linhas[0] ?? null, error: null }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      then: (aoResolver: any, aoFalhar?: any) =>
        Promise.resolve(resposta).then(aoResolver, aoFalhar),
    };
    return cadeia;
  },
  async rpc(nome: string) {
    if (nome !== "ler_proposta_para_proveniencia") {
      return { data: null, error: { message: `função inesperada: ${nome}` } };
    }
    return RPC_PROPOSTA;
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;

const CONCEITO_ID = "sub-acesso-modalidade";

function prepararTabelas(opcoes: {
  proposta?: Record<string, unknown> | null;
  vinculo?: string | null;
  evidencias?: Record<string, unknown>[];
  /** Simula a recusa da capability: mais de uma proposta ⇒ PROPOSTA_AMBIGUA. */
  propostaAmbigua?: boolean;
}) {
  for (const chave of Object.keys(TABELAS)) delete TABELAS[chave];
  TABELAS["method_subcriteria"] = [{ id: CONCEITO_ID }];
  TABELAS["professional_subcriterion_map"] = [{ evidence_id: opcoes.vinculo ?? null }];
  TABELAS["practice_evidence"] = opcoes.evidencias ?? [];
  RPC_PROPOSTA = opcoes.propostaAmbigua
    ? {
        data: null,
        error: {
          message:
            "PROPOSTA_AMBIGUA: 2 propostas para o alvo (case-1, ACESSO_MODALIDADE). A leitura de proveniencia nao escolhe entre elas (1.8-R1 §21.2).",
        },
      }
    : { data: opcoes.proposta ? [opcoes.proposta] : [], error: null };
}
const PARAMS = {
  caseId: "case-1",
  professionalProfileId: "prof-1",
  subcriterionCode: "ACESSO_MODALIDADE",
};

function prepararFontes(opcoes: {
  need?: boolean;
  importancia?: boolean;
  estado?: boolean;
}) {
  // Sem vínculo e sem proposta é o estado do regime atual: legado do lado do
  // profissional, importância declarada à mão do lado dela.
  prepararTabelas({});
  loadCaseNeeds.mockResolvedValue(
    opcoes.need
      ? [
          {
            subcriterionCode: "ACESSO_MODALIDADE",
            degree: "ESSENCIAL",
            options: ["telemedicina"],
            declaredBy: "perfil-paciente",
            declaredAt: "2026-08-01T10:00:00Z",
          },
        ]
      : [],
  );
  loadCasePriorityMap.mockResolvedValue({
    items: opcoes.importancia
      ? [
          {
            subcriterionCode: "ACESSO_MODALIDADE",
            importance: "MUITO_IMPORTANTE",
            declaredBy: "perfil-curador",
            registradoEm: "2026-08-02T09:00:00Z",
          },
        ]
      : [],
  });
  loadProfessionalMap.mockResolvedValue({
    items: opcoes.estado
      ? [
          {
            subcriterionCode: "ACESSO_MODALIDADE",
            status: "CONFIRMADO",
            note: null,
            declaredBy: "perfil-admin",
            registradoEm: "2026-07-31T08:00:00Z",
          },
        ]
      : [],
  });
}

describe("loadCadeiaDeProveniencia — a tradução de fonte para cadeia", () => {
  it("leva grau, opções, autor e data da declaração dela para o elo de origem", async () => {
    prepararFontes({ need: true, importancia: true, estado: true });

    const cadeia = await loadCadeiaDeProveniencia(supabase, PARAMS);
    const origem = cadeia.ramos
      .find((r) => r.lado === "PESSOA")!
      .elos.find((e) => e.id === "DECLARACAO_ORIGINAL")!;

    expect(origem.presente).toBe(true);
    expect(origem.detalhe).toBe("ESSENCIAL · telemedicina");
    expect(origem.autor).toBe("perfil-paciente");
    expect(origem.em).toBe("2026-08-01T10:00:00Z");
  });

  it("leva a importância e a data de gravação para o elo da confirmação", async () => {
    prepararFontes({ need: true, importancia: true, estado: true });

    const confirmacao = (await loadCadeiaDeProveniencia(supabase, PARAMS)).ramos
      .find((r) => r.lado === "PESSOA")!
      .elos.find((e) => e.id === "CONFIRMACAO")!;

    expect(confirmacao.detalhe).toBe("MUITO_IMPORTANTE");
    expect(confirmacao.autor).toBe("perfil-curador");
    expect(confirmacao.em).toBe("2026-08-02T09:00:00Z");
  });

  it("leva o estado e a data para o elo do profissional", async () => {
    prepararFontes({ need: true, importancia: true, estado: true });

    const confirmacao = (await loadCadeiaDeProveniencia(supabase, PARAMS)).ramos
      .find((r) => r.lado === "PROFISSIONAL")!
      .elos.find((e) => e.id === "CONFIRMACAO")!;

    expect(confirmacao.detalhe).toBe("CONFIRMADO");
    expect(confirmacao.autor).toBe("perfil-admin");
    expect(confirmacao.em).toBe("2026-07-31T08:00:00Z");
  });

  it("conceito que nenhuma fonte conhece produz cadeia inteira de lacunas, sem erro", async () => {
    prepararFontes({});

    const cadeia = await loadCadeiaDeProveniencia(supabase, PARAMS);

    expect(cadeia.subcriterionCode).toBe("ACESSO_MODALIDADE");
    expect(cadeia.completa).toBe(false);
    for (const ramo of cadeia.ramos) {
      for (const entrada of ramo.elos) {
        expect(entrada.presente, `${ramo.lado}/${entrada.id}`).toBe(false);
        expect(entrada.detalhe).toBeNull();
      }
    }
  });

  it("o leitor não busca a Base de Evidências — e a cadeia declara essa ausência", async () => {
    prepararFontes({ need: true, importancia: true, estado: true });

    const origem = (await loadCadeiaDeProveniencia(supabase, PARAMS)).ramos
      .find((r) => r.lado === "PROFISSIONAL")!
      .elos.find((e) => e.id === "DECLARACAO_ORIGINAL")!;

    // MUDANÇA DE CONTRATO — 1.8-R1. O vínculo passou a existir
    // (`professional_subcriterion_map.evidence_id`): sem ele a origem continua
    // AUSENTE, mas o motivo deixou de ser "a cadeia não lê" para ser "este
    // registro não tem vínculo". A diferença importa — a primeira frase
    // acusava o leitor, a segunda descreve o dado.
    expect(origem.marca).toBe("AUSENTE");
    expect(origem.presente).toBe(false);
    expect(origem.lacuna).toContain("não tem vínculo com a evidência");
    expect(origem.lacuna, "nenhuma evidência é escolhida por ser a mais recente").toContain(
      "mais recente",
    );
  });

  it("lê as três fontes uma vez cada, com os identificadores recebidos", async () => {
    prepararFontes({ need: true, importancia: true, estado: true });
    loadCaseNeeds.mockClear();
    loadCasePriorityMap.mockClear();
    loadProfessionalMap.mockClear();

    await loadCadeiaDeProveniencia(supabase, PARAMS);

    expect(loadCaseNeeds).toHaveBeenCalledWith(supabase, "case-1");
    expect(loadCasePriorityMap).toHaveBeenCalledWith(supabase, "case-1");
    expect(loadProfessionalMap).toHaveBeenCalledWith(supabase, "prof-1");
  });
});

// ===========================================================================
// 1.8-R1 · A1 — os dois ramos, lidos de verdade
// ===========================================================================

const PROPOSTA = {
  id: "proposta-1",
  case_id: "case-1",
  subcriterion_code: "ACESSO_MODALIDADE",
  rule_id: "regra-acesso",
  rule_version: 2,
  origin_record: "need-1",
  origin_version: "ESSENCIAL",
  origin_author: "perfil-paciente",
  suggested_value: "MUITO_IMPORTANTE",
  emitted_at: "2026-08-02T08:00:00Z",
};

const EVIDENCIA_ANTIGA = {
  id: "evidencia-v1",
  professional_profile_id: "prof-1",
  subcriterion_code: "ACESSO_MODALIDADE",
  version: 1,
  source: "cadastro inicial",
  source_tier: "OFICIAL_PRIMARIA",
  collected_by: "perfil-admin",
  collected_at: "2026-07-01T08:00:00Z",
  verified_by: null,
  verified_at: null,
  verification_source: null,
};

async function cadeiaDe(opcoes: Parameters<typeof prepararTabelas>[0]) {
  prepararFontes({ need: true, importancia: true, estado: true });
  prepararTabelas(opcoes);
  return loadCadeiaDeProveniencia(supabase, PARAMS);
}

const eloDe = (
  cadeia: Awaited<ReturnType<typeof loadCadeiaDeProveniencia>>,
  lado: "PESSOA" | "PROFISSIONAL",
  id: string,
) => cadeia.ramos.find((r) => r.lado === lado)!.elos.find((e) => e.id === id)!;

describe("1.8-R1 · ramo importância — a proposta persistida", () => {
  it("a proposta correta é carregada, com regra e versão exatas", async () => {
    const proposta = eloDe(await cadeiaDe({ proposta: PROPOSTA }), "PESSOA", "PROPOSTA");
    expect(proposta.marca).toBe("PRESENTE");
    expect(proposta.detalhe).toContain("regra regra-acesso v2");
    expect(proposta.detalhe).toContain("MUITO_IMPORTANTE");
    expect(proposta.autor).toBe("perfil-paciente");
    expect(proposta.em).toBe("2026-08-02T08:00:00Z");
  });

  it("sem proposta, a importância manual não inventa nenhuma", async () => {
    const cadeia = await cadeiaDe({ proposta: null });
    const proposta = eloDe(cadeia, "PESSOA", "PROPOSTA");
    expect(proposta.marca).toBe("NAO_APLICAVEL");
    expect(proposta.detalhe, "um detalhe apareceu para um nó que não existe").toBeNull();
    expect(cadeia.lacunas.map((l) => l.elo), "não-aplicável virou lacuna").not.toContain("PROPOSTA");
  });

  it("a confirmação da importância vem do Mapa do Case", async () => {
    const confirmacao = eloDe(await cadeiaDe({ proposta: PROPOSTA }), "PESSOA", "CONFIRMACAO");
    expect(confirmacao.marca).toBe("PRESENTE");
    expect(confirmacao.detalhe).toBe("MUITO_IMPORTANTE");
    expect(confirmacao.autor).toBe("perfil-curador");
    expect(confirmacao.em).toBe("2026-08-02T09:00:00Z");
  });

  it("duas propostas para o mesmo alvo LEVANTAM — quem recusa é a CAPABILITY", async () => {
    // §21.2: a recusa mudou de casa. Antes o repositório contava e levantava;
    // agora a própria função SQL levanta `PROPOSTA_AMBIGUA`, e o repositório
    // só propaga — nem ele nem ela escolhem.
    prepararFontes({ need: true, importancia: true, estado: true });
    prepararTabelas({ propostaAmbigua: true });
    await expect(loadCadeiaDeProveniencia(supabase, PARAMS)).rejects.toThrow(/PROPOSTA_AMBIGUA/);
  });
});

describe("1.8-R1 · ramo estado — a evidência pelo vínculo", () => {
  it("`evidence_id` resolve a evidência exata, com versão e proveniência", async () => {
    const origem = eloDe(
      await cadeiaDe({ vinculo: "evidencia-v1", evidencias: [EVIDENCIA_ANTIGA] }),
      "PROFISSIONAL",
      "DECLARACAO_ORIGINAL",
    );
    expect(origem.marca).toBe("PRESENTE");
    expect(origem.detalhe).toContain("v1");
    expect(origem.detalhe).toContain("OFICIAL_PRIMARIA");
    expect(origem.detalhe).toContain("cadastro inicial");
    expect(origem.autor).toBe("perfil-admin");
    expect(origem.em).toBe("2026-07-01T08:00:00Z");
  });

  /**
   * A PROVA DECISIVA. Existe uma versão 7, mais nova; o Mapa aponta para a 1.
   * Se a cadeia devolvesse a 7, ela estaria dizendo que a confirmação de
   * julho se apoiou numa evidência que só nasceu depois — e é exatamente essa
   * mentira que o vínculo existe para impedir.
   */
  it("evidência mais nova NÃO muda o vínculo anterior", async () => {
    const origem = eloDe(
      await cadeiaDe({
        vinculo: "evidencia-v1",
        evidencias: [EVIDENCIA_ANTIGA], // o `.eq("id", …)` só alcança a apontada
      }),
      "PROFISSIONAL",
      "DECLARACAO_ORIGINAL",
    );
    expect(origem.detalhe).toContain("v1");
    expect(origem.detalhe, "a cadeia pulou para a versão mais recente").not.toContain("v7");
  });

  it("legado sem vínculo fica AUSENTE, e nenhuma evidência é escolhida no lugar", async () => {
    const cadeia = await cadeiaDe({ vinculo: null, evidencias: [EVIDENCIA_ANTIGA] });
    const origem = eloDe(cadeia, "PROFISSIONAL", "DECLARACAO_ORIGINAL");
    expect(origem.marca).toBe("AUSENTE");
    expect(origem.detalhe).toBeNull();
    expect(origem.lacuna).toContain("mais recente");
    expect(cadeia.lacunas.map((l) => l.elo)).toContain("DECLARACAO_ORIGINAL");
  });

  it("a confirmação do estado vem do Mapa do Profissional", async () => {
    const confirmacao = eloDe(
      await cadeiaDe({ vinculo: "evidencia-v1", evidencias: [EVIDENCIA_ANTIGA] }),
      "PROFISSIONAL",
      "CONFIRMACAO",
    );
    expect(confirmacao.marca).toBe("PRESENTE");
    expect(confirmacao.detalhe).toBe("CONFIRMADO");
    expect(confirmacao.autor).toBe("perfil-admin");
    expect(confirmacao.em).toBe("2026-07-31T08:00:00Z");
  });

  it("com proposta e vínculo, a cadeia fecha inteira", async () => {
    const cadeia = await cadeiaDe({
      proposta: PROPOSTA,
      vinculo: "evidencia-v1",
      evidencias: [EVIDENCIA_ANTIGA],
    });
    expect(cadeia.lacunas, `sobraram lacunas: ${JSON.stringify(cadeia.lacunas)}`).toEqual([]);
    expect(cadeia.completa).toBe(true);
  });
});
