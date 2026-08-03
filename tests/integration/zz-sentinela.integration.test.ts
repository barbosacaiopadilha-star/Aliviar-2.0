import { readFileSync } from "node:fs";

import { beforeAll, describe, expect, it } from "vitest";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";

import { BASELINE_PATH } from "./limpeza/global";
import {
  CONTAS_PERMANENTES,
  contagens,
  residuo,
  type Contagens,
  type Inventario,
} from "./limpeza/inventario";

/**
 * SENTINELA — o último arquivo da suíte.
 *
 * Se qualquer arquivo anterior deixou rastro, é aqui que aparece. O
 * sequenciador da config o empurra para o fim: ele observa o banco depois de
 * todos os outros terem passado e limpado.
 *
 * O que ele NÃO faz: limpar. Sentinela que limpa esconde exatamente o
 * problema que existe para denunciar — a suíte passaria para sempre e o
 * resíduo só reapareceria quando alguém abrisse a Mesa e visse uma Rede que
 * ninguém cadastrou.
 *
 * Não existe mais classe de exceção. Até a ADR-038, Cases com troca de
 * responsável eram indestrutíveis e o sentinela precisava tolerá-los; a porta
 * administrativa acabou com isso. Hoje a exigência é igualdade com a
 * baseline, sem ressalva.
 */

describe("Sentinela — a suíte devolve o banco como encontrou", () => {
  const admin = createAdminSupabaseClient();
  let base: Contagens;
  let agora: Contagens;
  let sobrou: Inventario;

  beforeAll(async () => {
    const baseline = JSON.parse(readFileSync(BASELINE_PATH, "utf-8"));
    base = baseline.contagens;
    agora = await contagens(admin);
    sobrou = await residuo(admin, baseline.inventario);
  }, 120_000);

  it("nenhuma conta temporária sobreviveu", () => {
    expect(sobrou.usuarios, `contas residuais: ${sobrou.usuarios.join(", ")}`).toHaveLength(0);
    expect(agora.usuarios).toBe(base.usuarios);
  });

  it("as seis contas permanentes continuam de pé", async () => {
    const { data } = await admin.auth.admin.listUsers({ perPage: 1000 });
    const emails = (data?.users ?? []).map((usuario) => usuario.email);
    for (const permanente of CONTAS_PERMANENTES) {
      expect(emails, `conta de bootstrap sumiu: ${permanente}`).toContain(permanente);
    }
  });

  it("nenhum perfil, papel ou preferência órfã ficou para trás", () => {
    expect(sobrou.perfis, `perfis residuais: ${sobrou.perfis.join(", ")}`).toHaveLength(0);
    expect(agora.perfis).toBe(base.perfis);
    expect(agora.papeis).toBe(base.papeis);
  });

  it("nenhum Case temporário sobreviveu — nem os que têm histórico de responsabilidade", () => {
    expect(sobrou.casos, `Cases residuais: ${sobrou.casos.join(", ")}`).toHaveLength(0);
    expect(agora.casos).toBe(base.casos);
  });

  it("a cadeia da Curadoria voltou inteira ao baseline", () => {
    expect(agora.declaracoesCriterio).toBe(base.declaracoesCriterio);
    expect(agora.pesos).toBe(base.pesos);
    expect(agora.selecoes).toBe(base.selecoes);
    expect(agora.relatorios).toBe(base.relatorios);
    expect(agora.conexoes).toBe(base.conexoes);
    expect(agora.relacionamentos).toBe(base.relacionamentos);
  });

  it("nenhuma história de paciente sobrou", () => {
    expect(sobrou.historias, `histórias residuais: ${sobrou.historias.join(", ")}`).toHaveLength(0);
    expect(agora.historias).toBe(base.historias);
  });

  /**
   * O achado que originou esta linha de trabalho: a suíte deixava
   * profissionais PUBLICADOS na Rede operacional local. Um Case real passaria
   * a enxergar, como opção de cuidado, gente que nenhum Curador cadastrou.
   */
  it("a Rede operacional publicada voltou ao baseline", () => {
    expect(agora.redeOperacionalPublicada).toBe(base.redeOperacionalPublicada);
    expect(
      sobrou.profissionais,
      `profissionais residuais: ${sobrou.profissionais.length}`,
    ).toHaveLength(0);
    expect(agora.profissionais).toBe(base.profissionais);
  });

  it("nenhuma fixture de certificação escapou para fora do Case autorizado", async () => {
    const { data, error } = await admin
      .from("professional_profiles")
      .select("id, display_name, is_test_fixture, is_demo")
      .eq("is_test_fixture", true);
    if (error) throw new Error(error.message);

    // Fixture publicada só é alcançável por Case marcado `is_certification`
    // — o emparelhamento simétrico da carga da Mesa. Fixture de pé sem Case
    // de certificação que a autorize está solta na Rede.
    if ((data ?? []).length > 0) {
      const { count } = await admin
        .from("cases")
        .select("*", { count: "exact", head: true })
        .eq("is_certification", true);
      expect(
        count ?? 0,
        "fixtures publicadas sem nenhum Case de certificação que as autorize",
      ).toBeGreaterThan(0);
    }

    for (const fixture of data ?? []) {
      expect(fixture.is_demo, `fixture ${fixture.display_name} marcada também como demo`).toBe(false);
    }
  });

  it("nenhum profissional com marcador de teste ficou no banco", async () => {
    const { data } = await admin
      .from("professional_profiles")
      .select("display_name")
      .or("professional_identifier.like.ident-%,display_name.like.Profissional PR3%");
    expect(
      data ?? [],
      `profissionais com marcador de teste: ${(data ?? []).map((p) => p.display_name).join(", ")}`,
    ).toHaveLength(0);
  });

  /**
   * O catálogo do Método é vocabulário, não dado de teste: a limpeza nunca o
   * toca, e nenhuma suíte pode deixá-lo alterado. Um subcritério que ficou
   * fora de circulação porque um teste morreu no meio mudaria em silêncio a
   * completude de todo mundo.
   */
  it("o catálogo canônico sobrevive intacto, e nenhum Mapa ficou para trás", async () => {
    const { count: catalogo } = await admin
      .from("method_subcriteria")
      .select("*", { count: "exact", head: true });
    const { count: ativos } = await admin
      .from("method_subcriteria")
      .select("*", { count: "exact", head: true })
      .eq("active", true);

    // Catálogo 1.0.0 (ADR-046/047): 28 vigentes + 6 aposentados do 0.9.0,
    // que permanecem legíveis como histórico — 34 registros ao todo.
    expect(catalogo, "o catálogo não é apagado no teardown").toBe(34);
    expect(ativos, "nenhum subcritério entrou ou saiu de circulação").toBe(28);

    // Os Mapas saem por cascata de Case e de profissional. Se sobrou linha
    // NOVA, sobrou dono. O oráculo é relativo à baseline — a stack local
    // compartilhada carrega resíduo legítimo de execuções E2E anteriores
    // (pré-existente à suíte; ~476 linhas em 2026-08-03), e a função da
    // sentinela é provar que ESTA suíte devolve o banco como encontrou,
    // nunca que o mundo nasceu vazio (mesmo desenho das demais contagens).
    expect(
      agora.mapasDeCase,
      `case_priority_map: a suíte deixou Mapas de Case para trás (baseline ${base.mapasDeCase})`,
    ).toBe(base.mapasDeCase);
    expect(
      agora.mapasDeProfissional,
      `professional_subcriterion_map: a suíte deixou Mapas de profissional para trás (baseline ${base.mapasDeProfissional})`,
    ).toBe(base.mapasDeProfissional);
  });

  /**
   * A auditoria cresce de propósito — e só ela.
   *
   * `audit_logs` tem RLS apenas com política de SELECT: DELETE é filtrado
   * para zero linhas. É imutável pelo caminho da aplicação, e não foi
   * desligada para a suíte passar. Os descartes de Case da ADR-038 gravam
   * aqui de propósito: é o rastro que sobrevive ao Case.
   */
  it("a auditoria cresce — e é o único crescimento aceito", async () => {
    const { count } = await admin
      .from("audit_logs")
      .select("*", { count: "exact", head: true })
      .eq("action", "case_discarded");
    expect(count ?? 0, "todo Case sintético descartado deixou registro").toBeGreaterThan(0);
  });
});
