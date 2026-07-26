import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { findDeliveredCuradoria, eligibleProfessionalProfileIds } = await import(
  "@/modules/curadoria/delivery-contract"
);

type Row = Record<string, unknown> | null;

/**
 * Supabase de mentira, mínimo: cada tabela devolve a linha (ou lista) que o
 * teste montou. O objetivo é exercitar as REGRAS do contrato — o que ele
 * aceita e o que recusa —, não o cliente do Supabase.
 */
function fakeSupabase(tables: Record<string, Row | Row[]>) {
  return {
    from(table: string) {
      const value = tables[table];
      const builder: Record<string, unknown> = {};
      for (const method of ["select", "eq", "order", "limit"]) {
        builder[method] = () => builder;
      }
      builder.maybeSingle = async () => ({ data: Array.isArray(value) ? null : (value ?? null) });
      builder.then = (resolve: (r: { data: Row[] }) => unknown) =>
        resolve({ data: Array.isArray(value) ? value : [] });
      return builder;
    },
  } as never;
}

const CASE = "case-1";

const selectionDelivered = {
  id: "sel-1",
  case_id: CASE,
  status: "DELIVERED",
  delivered_at: "2026-07-20T10:00:00.000Z",
};

const reportDelivered = {
  id: "rep-1",
  case_id: CASE,
  emitted_at: "2026-07-20T09:00:00.000Z",
  delivered_at: "2026-07-20T10:00:00.000Z",
};

const threeOptions = [
  { professional_profile_id: "prof-a", position: 1 },
  { professional_profile_id: "prof-b", position: 2 },
  { professional_profile_id: "prof-c", position: 3 },
];

function methodTables(overrides: Record<string, Row | Row[]> = {}) {
  return {
    curated_selections: selectionDelivered,
    curadoria_reports: reportDelivered,
    curadoria_report_options: threeOptions,
    final_curadoria_deliveries: null,
    ...overrides,
  };
}

describe("entrega do Método — o que é reconhecido", () => {
  it("reconhece Relatório entregue sobre seleção entregue com três opções", async () => {
    const delivery = await findDeliveredCuradoria(fakeSupabase(methodTables()), CASE);

    expect(delivery).toMatchObject({
      caseId: CASE,
      source: "METODO",
      deliveredAt: "2026-07-20T10:00:00.000Z",
    });
    expect(delivery?.options).toHaveLength(3);
  });

  it("expõe a proveniência dos registros que sustentam a entrega", async () => {
    const delivery = await findDeliveredCuradoria(fakeSupabase(methodTables()), CASE);
    expect(delivery?.provenance).toEqual({ curatedSelectionId: "sel-1", reportId: "rep-1" });
  });

  it("devolve os elegíveis na ordem de apresentação", async () => {
    const delivery = await findDeliveredCuradoria(fakeSupabase(methodTables()), CASE);
    expect(eligibleProfessionalProfileIds(delivery!)).toEqual(["prof-a", "prof-b", "prof-c"]);
  });
});

describe("entrega do Método — o que é recusado", () => {
  it("recusa seleção em rascunho", async () => {
    // A consulta filtra por status DELIVERED; um rascunho não retorna linha.
    const tables = methodTables({ curated_selections: null });
    expect(await findDeliveredCuradoria(fakeSupabase(tables), CASE)).toBeNull();
  });

  it("recusa Relatório emitido mas não entregue", async () => {
    const tables = methodTables({
      curadoria_reports: { ...reportDelivered, delivered_at: null },
    });
    expect(await findDeliveredCuradoria(fakeSupabase(tables), CASE)).toBeNull();
  });

  it("recusa Relatório entregue sem emissão registrada", async () => {
    const tables = methodTables({ curadoria_reports: { ...reportDelivered, emitted_at: null } });
    expect(await findDeliveredCuradoria(fakeSupabase(tables), CASE)).toBeNull();
  });

  it("recusa entrega que pertence a outro Case", async () => {
    const tables = methodTables({ curadoria_reports: { ...reportDelivered, case_id: "outro" } });
    expect(await findDeliveredCuradoria(fakeSupabase(tables), CASE)).toBeNull();
  });

  it("recusa entrega com menos de três opções", async () => {
    const tables = methodTables({ curadoria_report_options: threeOptions.slice(0, 2) });
    expect(await findDeliveredCuradoria(fakeSupabase(tables), CASE)).toBeNull();
  });

  it("recusa três posições com profissional repetido", async () => {
    const tables = methodTables({
      curadoria_report_options: [
        { professional_profile_id: "prof-a", position: 1 },
        { professional_profile_id: "prof-a", position: 2 },
        { professional_profile_id: "prof-c", position: 3 },
      ],
    });
    expect(await findDeliveredCuradoria(fakeSupabase(tables), CASE)).toBeNull();
  });

  it("recusa quando não há Relatório algum", async () => {
    const tables = methodTables({ curadoria_reports: null });
    expect(await findDeliveredCuradoria(fakeSupabase(tables), CASE)).toBeNull();
  });
});

describe("precedência entre as duas fontes", () => {
  const legacy = {
    id: "ace-1",
    case_id: CASE,
    delivered_at: "2026-01-01T00:00:00.000Z",
    version: 2,
    provider_presentations: [
      { providerId: "legado-a" },
      { providerId: "legado-b" },
      { providerId: "legado-c" },
    ],
  };

  it("a entrega do Método vence, e a legada nem é consultada", async () => {
    const delivery = await findDeliveredCuradoria(
      fakeSupabase(methodTables({ final_curadoria_deliveries: legacy })),
      CASE,
    );

    expect(delivery?.source).toBe("METODO");
    // Nunca combina: as opções são as três do Método, sem nenhuma legada.
    expect(eligibleProfessionalProfileIds(delivery!)).toEqual(["prof-a", "prof-b", "prof-c"]);
  });

  it("reconhece a legada somente quando não existe entrega do Método", async () => {
    const tables = methodTables({ curated_selections: null, final_curadoria_deliveries: legacy });
    const delivery = await findDeliveredCuradoria(fakeSupabase(tables), CASE);

    expect(delivery).toMatchObject({ source: "ACE_LEGADO", version: 2 });
    expect(eligibleProfessionalProfileIds(delivery!)).toEqual(["legado-a", "legado-b", "legado-c"]);
  });

  it("recusa entrega legada sem três apresentações", async () => {
    const tables = methodTables({
      curated_selections: null,
      final_curadoria_deliveries: { ...legacy, provider_presentations: [{ providerId: "só-um" }] },
    });
    expect(await findDeliveredCuradoria(fakeSupabase(tables), CASE)).toBeNull();
  });

  it("devolve null quando nenhuma das duas fontes tem entrega", async () => {
    const tables = methodTables({ curated_selections: null });
    expect(await findDeliveredCuradoria(fakeSupabase(tables), CASE)).toBeNull();
  });
});

describe("âncora do Connection", () => {
  it("a entrega do Método ancora no Relatório canônico", async () => {
    const delivery = await findDeliveredCuradoria(fakeSupabase(methodTables()), CASE);
    expect(delivery?.anchor).toEqual({ source: "METODO", reportId: "rep-1" });
  });

  it("a entrega legada ancora no registro histórico do motor antigo", async () => {
    const tables = methodTables({
      curated_selections: null,
      final_curadoria_deliveries: {
        id: "ace-1",
        case_id: CASE,
        delivered_at: "2026-01-01T00:00:00.000Z",
        version: 1,
        provider_presentations: [{ providerId: "a" }, { providerId: "b" }, { providerId: "c" }],
      },
    });
    const delivery = await findDeliveredCuradoria(fakeSupabase(tables), CASE);
    expect(delivery?.anchor).toEqual({ source: "ACE_LEGADO", finalDeliveryId: "ace-1" });
  });
});
