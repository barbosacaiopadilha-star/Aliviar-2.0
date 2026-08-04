import { describe, expect, it } from "vitest";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";

/**
 * PP-02 — AUTORIA NOS DOIS MAPAS.
 *
 * A migration só acrescenta uma coluna nullable a cada um dos dois mapas que
 * alimentam o Motor. O que precisa ser provado é justamente o que uma coluna
 * nova pode quebrar: a gravação antiga continua funcionando, a FK é real, e
 * `NULL` é aceito — porque `NULL` tem significado (registro anterior ao regime
 * de autoria), e não é um vazio a ser corrigido.
 *
 * Nenhuma escrita de produto preenche a coluna neste pacote: isto é
 * infraestrutura, não comportamento.
 */

const service = createAdminSupabaseClient();

/**
 * Dois destes testes exigem um Case e um subcritério semeados. Sem eles a
 * asserção não roda — e um teste que passa sem exercitar nada é pior que um
 * teste ausente. A pré-condição é resolvida na coleta para que eles apareçam
 * como **skipped** no relatório, nunca como verdes vazios.
 */
const caso = (await service.from("cases").select("id").limit(1).maybeSingle()).data;
const subcriterio = (
  await service.from("method_subcriteria").select("id").eq("active", true).limit(1).maybeSingle()
).data;
const comDados = Boolean(caso && subcriterio);

const MAPAS = [
  { tabela: "case_priority_map", rotulo: "Mapa de Prioridades do Case" },
  { tabela: "professional_subcriterion_map", rotulo: "Mapa do Profissional" },
] as const;

describe("PP-02 · Autoria nos dois mapas (Supabase local)", () => {
  it("a migration foi aplicada: a coluna existe nos dois mapas", async () => {
    for (const { tabela, rotulo } of MAPAS) {
      const { error } = await service.from(tabela).select("declared_by").limit(1);
      expect(error, `${rotulo}: coluna declared_by inacessível`).toBeNull();
    }
  });

  it("a coluna é nullable — e `NULL` é o valor legítimo do regime anterior", async () => {
    for (const { tabela, rotulo } of MAPAS) {
      const { data, error } = await service.from(tabela).select("declared_by").is("declared_by", null);
      expect(error, `${rotulo}: filtrar por NULL falhou`).toBeNull();
      expect(Array.isArray(data)).toBe(true);
    }
  });

  it("nenhum backfill aconteceu: nenhuma linha preexistente ganhou autor", async () => {
    for (const { tabela, rotulo } of MAPAS) {
      const { count, error } = await service
        .from(tabela)
        .select("declared_by", { count: "exact", head: true })
        .not("declared_by", "is", null);
      expect(error, `${rotulo}: contagem falhou`).toBeNull();
      expect(count, `${rotulo}: alguém inventou autoria para registro antigo`).toBe(0);
    }
  });

  it.runIf(comDados)("a FK é real: autor inexistente é recusado pelo banco", async () => {
    const inexistente = "00000000-0000-4000-8000-000000000000";

    const { error } = await service.from("case_priority_map").insert({
      case_id: caso!.id,
      subcriterion_id: subcriterio!.id,
      importance: "RELEVANTE",
      declared_by: inexistente,
    });

    expect(error, "o banco aceitou um autor que não existe em profiles").not.toBeNull();
    expect(`${error?.message} ${error?.details ?? ""}`).toMatch(/foreign key|violates|declared_by/i);
  });

  it.runIf(comDados)("compatibilidade: gravação sem autor continua funcionando", async () => {
    // Exatamente a forma antiga de escrever — sem mencionar `declared_by`.
    const { data, error } = await service
      .from("case_priority_map")
      .upsert(
        { case_id: caso!.id, subcriterion_id: subcriterio!.id, importance: "RELEVANTE" },
        { onConflict: "case_id,subcriterion_id" },
      )
      .select("id, declared_by")
      .single();

    expect(error, "a gravação no formato anterior ao PP-02 falhou").toBeNull();
    expect(data?.declared_by, "a coluna deveria nascer NULL, sem autor inventado").toBeNull();

    if (data?.id) await service.from("case_priority_map").delete().eq("id", data.id);
  });
});
