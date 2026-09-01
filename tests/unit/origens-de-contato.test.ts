import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { LEAD_SOURCES, LEAD_SOURCE_LABELS, normalizeLeadSource } from "@/modules/crm/lead";
import {
  CONTACT_SOURCES,
  CONTACT_SOURCES_MANUAIS,
  CONTACT_SOURCE_LABELS,
} from "@/modules/crm/types";

/**
 * AS ORIGENS DE CONTATO — guarda do `SIM-82`.
 *
 * **O defeito que ela existe para impedir.** A migration da porta pública
 * (`20260812210000`) insere `source = 'porta_publica'`. Nenhum dos dois mapas
 * de rótulo conhecia esse valor, e `normalizeLeadSource` derruba o que não
 * conhece em `"outro"` — então **a fila do Supervisor mostrava "Outro" para
 * toda pessoa que entrou pela porta da frente**. Na travessia de 01/09 era o
 * único `source` existente no banco: **100% dos contatos reais rotulados como
 * origem desconhecida**, com "Site" ali ao lado, sem uso.
 *
 * **Por que o teste lê a migration, e não uma lista.** Copiar os valores para
 * cá criaria a terceira lista a divergir das outras duas em silêncio — que é
 * exatamente o defeito. O SQL é a fonte: quem escrever um `source` novo numa
 * migration reprova aqui até rotulá-lo.
 *
 * **O fallback continua existindo, e deve.** `"outro"` é a resposta honesta
 * para um valor que ninguém previu. O que não pode é ele engolir um valor que
 * o próprio sistema escreve todo dia.
 */

const RAIZ = path.resolve(__dirname, "../..");
const MIGRATIONS = path.join(RAIZ, "supabase/migrations");

/** Todo literal gravado em `crm_contacts.source` por alguma migration. */
function origensQueOBancoEscreve(): string[] {
  const achadas = new Set<string>();
  for (const nome of readdirSync(MIGRATIONS).filter((n) => n.endsWith(".sql"))) {
    const sql = readFileSync(path.join(MIGRATIONS, nome), "utf-8");
    if (!sql.includes("crm_contacts")) continue;
    // `source, source_detail, …` seguido do bloco de values — o literal da
    // origem é o que aparece imediatamente antes de um `source_detail`.
    for (const m of sql.matchAll(/'([a-z_]+)',\s*\n\s*'solicitar-atendimento/g)) achadas.add(m[1]);
  }
  return [...achadas];
}

describe("As origens de contato — SIM-82", () => {
  const doBanco = origensQueOBancoEscreve();

  it("a varredura acha alguma origem — senão o teste passa por vazio", () => {
    expect(doBanco.length, "nenhum literal de source achado nas migrations").toBeGreaterThan(0);
  });

  it.each([
    ["LEAD_SOURCES (fila do Supervisor)", LEAD_SOURCES as readonly string[]],
    ["CONTACT_SOURCES (CRM)", CONTACT_SOURCES as readonly string[]],
  ])("%s conhece toda origem que as migrations escrevem", (_nome, lista) => {
    const desconhecidas = doBanco.filter((o) => !lista.includes(o));
    expect(
      desconhecidas,
      `\norigem que o banco escreve e o código não conhece: ${desconhecidas.join(", ")}\n` +
        "Acrescente à lista E ao mapa de rótulos — senão ela aparece como \"Outro\".\n",
    ).toEqual([]);
  });

  it("nenhuma origem cai em \"outro\" por falta de rótulo", () => {
    for (const origem of doBanco) {
      expect(normalizeLeadSource(origem), `${origem} está sendo tratado como desconhecido`).toBe(origem);
    }
  });

  it("todo valor das duas listas tem rótulo, e nenhum rótulo é o código cru", () => {
    for (const v of LEAD_SOURCES) {
      expect(LEAD_SOURCE_LABELS[v], `sem rótulo: ${v}`).toBeTruthy();
      expect(LEAD_SOURCE_LABELS[v]).not.toBe(v);
    }
    for (const v of CONTACT_SOURCES) {
      expect(CONTACT_SOURCE_LABELS[v], `sem rótulo: ${v}`).toBeTruthy();
      expect(CONTACT_SOURCE_LABELS[v]).not.toBe(v);
    }
  });

  /**
   * Rotular não é oferecer: quem escreve `porta_publica` é a migration, e um
   * seletor com essa opção deixaria alguém marcar "pedido pelo site" para um
   * contato que veio por telefone.
   */
  it("o que só a migration escreve não é oferecido no cadastro à mão", () => {
    for (const origem of doBanco) {
      expect(
        CONTACT_SOURCES_MANUAIS as readonly string[],
        `${origem} é escrito pela migration e não deve aparecer no seletor`,
      ).not.toContain(origem);
    }
    expect(CONTACT_SOURCES_MANUAIS.length).toBeGreaterThan(0);
  });
});
