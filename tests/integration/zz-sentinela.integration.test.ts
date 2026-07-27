import { readFileSync } from "node:fs";

import { beforeAll, describe, expect, it } from "vitest";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";

import { BASELINE_PATH } from "./limpeza/global";
import {
  CONTAS_PERMANENTES,
  contagens,
  lerIndestrutiveis,
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
 * RESÍDUO DELIBERADO, E SÓ ELE
 * ----------------------------
 * `curadoria.case_responsibility_changes` é append-only por gatilho, e o
 * gatilho recusa também o DELETE que chega pela cascata do Case. Um Case que
 * trocou de responsável não pode ser apagado — e com ele ficam o paciente
 * dono e a história de origem. É garantia de domínio, não falha de limpeza.
 *
 * O sentinela aceita exatamente essa classe e nenhuma outra: todo Case
 * residual precisa PROVAR que tem histórico append-only, e toda conta
 * residual precisa ser dona de um desses Cases. Qualquer coisa fora disso
 * derruba a suíte.
 */

describe("Sentinela — a suíte devolve o banco como encontrou", () => {
  const admin = createAdminSupabaseClient();
  let baseInventario: Inventario;
  let base: Contagens;
  let agora: Contagens;
  let sobrou: Inventario;

  /** Cases residuais protegidos pelo log append-only. */
  let comHistorico: string[] = [];
  /** Pacientes presos a esses Cases. */
  let presos: string[] = [];

  beforeAll(async () => {
    const baseline = JSON.parse(readFileSync(BASELINE_PATH, "utf-8"));
    baseInventario = baseline.inventario;
    base = baseline.contagens;
    agora = await contagens(admin);
    sobrou = await residuo(admin, baseInventario);

    // `service_role` não tem SELECT em `case_responsibility_changes` — o log
    // de responsabilidade só é legível pelos caminhos da aplicação. Então o
    // sentinela não pergunta ao banco quem está protegido: ele confere contra
    // o que a limpeza REGISTROU ao esbarrar no gatilho append-only. Um Case
    // que sobrou sem estar nessa lista não tem desculpa.
    const registrados = lerIndestrutiveis();
    comHistorico = sobrou.casos.filter((id) => registrados.includes(id));

    if (comHistorico.length > 0) {
      const { data: donos } = await admin
        .from("cases")
        .select("patient_profile_id")
        .in("id", comHistorico);
      presos = [...new Set((donos ?? []).map((linha) => linha.patient_profile_id as string))];
    }
  }, 120_000);

  it("todo Case residual é indestrutível por histórico append-only — nenhum outro sobra", () => {
    const semDesculpa = sobrou.casos.filter((id) => !comHistorico.includes(id));
    expect(semDesculpa, `Cases residuais sem histórico que os proteja: ${semDesculpa.join(", ")}`).toHaveLength(0);
  });

  it("toda conta residual é dona de um Case indestrutível", () => {
    const semDesculpa = sobrou.usuarios.filter((id) => !presos.includes(id));
    expect(semDesculpa, `contas residuais sem Case que as prenda: ${semDesculpa.join(", ")}`).toHaveLength(0);
    expect(agora.usuarios).toBe(base.usuarios + presos.length);
  });

  it("as seis contas permanentes continuam de pé", async () => {
    const { data } = await admin.auth.admin.listUsers({ perPage: 1000 });
    const emails = (data?.users ?? []).map((usuario) => usuario.email);
    for (const permanente of CONTAS_PERMANENTES) {
      expect(emails, `conta de bootstrap sumiu: ${permanente}`).toContain(permanente);
    }
  });

  it("nenhum perfil, papel ou preferência órfã ficou para trás", async () => {
    const semDesculpa = sobrou.perfis.filter((id) => !presos.includes(id));
    expect(semDesculpa, `perfis residuais: ${semDesculpa.join(", ")}`).toHaveLength(0);
    expect(agora.perfis).toBe(base.perfis + presos.length);

    // Papel residual só é aceitável se pertencer a um perfil preso — e nem
    // todos mantêm: a limpeza revoga o papel antes de tentar a exclusão (é o
    // que destrava o gatilho de auditoria), então o teto é `presos`, não a
    // igualdade.
    if (sobrou.perfis.length > 0) {
      const { data } = await admin.from("user_roles").select("profile_id").in("profile_id", sobrou.perfis);
      const forasteiros = (data ?? [])
        .map((linha) => linha.profile_id as string)
        .filter((id) => !presos.includes(id));
      expect(forasteiros, `papéis de perfis que não deviam existir: ${forasteiros.join(", ")}`).toHaveLength(0);
    }
    expect(agora.papeis).toBeGreaterThanOrEqual(base.papeis);
    expect(agora.papeis).toBeLessThanOrEqual(base.papeis + presos.length);
  });

  it("a cadeia da Curadoria voltou inteira ao baseline", () => {
    expect(agora.declaracoesCriterio).toBe(base.declaracoesCriterio);
    expect(agora.pesos).toBe(base.pesos);
    expect(agora.selecoes).toBe(base.selecoes);
    expect(agora.relatorios).toBe(base.relatorios);
    expect(agora.conexoes).toBe(base.conexoes);
    expect(agora.relacionamentos).toBe(base.relacionamentos);
  });

  it("nenhuma história sobrou além das presas ao Case indestrutível", () => {
    expect(agora.historias).toBe(base.historias + sobrou.historias.length);
    expect(sobrou.historias.length).toBeLessThanOrEqual(presos.length);
  });

  /**
   * O achado que originou esta missão: a suíte deixava profissionais
   * PUBLICADOS na Rede operacional local. Um Case real passaria a enxergar,
   * como opção de cuidado, gente que nenhum Curador cadastrou.
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
});
