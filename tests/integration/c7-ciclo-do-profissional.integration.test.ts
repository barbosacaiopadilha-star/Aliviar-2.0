import { randomUUID } from "node:crypto";

import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import {
  avaliarTransicao,
  motivosDaTransicao,
  type CicloDoProfissional,
  type MotivoDoCiclo,
} from "@/modules/profiles/ciclo-do-profissional";

/**
 * OPS-G5 · CORTE 7 — os triggers, sobre o banco real.
 *
 * O módulo puro é a **explicação**; o trigger é a **verdade**. Ele tem de
 * sobreviver a qualquer writer futuro — inclusive a um que ainda não existe e
 * que, por descuido, esqueça de validar. Por isso tudo aqui escreve direto na
 * tabela, sem passar por action nenhuma: é exatamente o caminho que um writer
 * mal-feito tomaria.
 *
 * Fixture inequívoca: `professional_identifier` com prefixo `ZZC7-`, removida
 * no `afterEach`. ⛔ Nenhum profissional real é tocado.
 */

const service = createAdminSupabaseClient();
const MARCA = "ZZC7";

async function criarProfissional(ciclo: CicloDoProfissional | null) {
  const identificador = `${MARCA}-${randomUUID().slice(0, 12)}`;
  const { data, error } = await service
    .from("professional_profiles")
    .insert({
      display_name: "Fixture Sintética C7",
      professional_identifier: identificador,
      created_by: await autorSintetico(),
      // Só o legado nasce sem ciclo. Todo o resto nasce em PREPARACAO, que é o
      // default da coluna — deixamos o banco aplicá-lo em vez de repeti-lo.
      ...(ciclo === null ? { ciclo_de_vida: null } : {}),
    })
    .select("id")
    .single();
  if (error) throw new Error(`fixture: ${error.message}`);
  const id = data!.id as string;

  // C7R: publicar pela transição do ciclo passa por `assert_publication_requirements`,
  // como qualquer outra publicação — antes da remediação a guarda era pulada,
  // porque o `UPDATE` da transição não menciona `publication_status` e o Postgres
  // avalia a lista de colunas do gatilho contra o SET da instrução. A fixture
  // agora satisfaz a porta de verdade, em vez de entrar por uma fresta.
  const { error: eReg } = await service
    .from("professional_profiles")
    .update({
      crm: "000000",
      crm_uf: "SP",
      registration_status: "regular",
      // A proveniência é cobrada por CHECK: registro verificado sem quem e quando
      // verificou não é verificação, é afirmação.
      registration_source: "Fixture sintética C7",
      registration_verified_at: new Date().toISOString(),
      registration_verified_by: await autorSintetico(),
    })
    .eq("id", id);
  if (eReg) throw new Error(`fixture do registro: ${eReg.message}`);
  const { error: eArea } = await service
    .from("professional_practice_areas")
    .insert({
      professional_profile_id: id,
      raw_text: "Área sintética C7",
      verification_status: "verificado",
      source: "Fixture sintética C7",
      verified_at: new Date().toISOString(),
      verified_by: await autorSintetico(),
    });
  if (eArea) throw new Error(`fixture da área: ${eArea.message}`);

  // Ninguém nasce no meio do ciclo — nem a fixture. O ponto de partida é
  // alcançado caminhando pelas transições reais, que é também o único caminho
  // que a guarda de nascimento deixa aberto. Se um degrau quebrar, o teste que
  // dependia dele falha por não conseguir nem começar: é o que queremos.
  const CAMINHO: Record<Exclude<CicloDoProfissional, "PREPARACAO">, ReadonlyArray<[CicloDoProfissional, MotivoDoCiclo]>> = {
    PUBLICADO_ATIVO: [["PUBLICADO_ATIVO", "CADASTRO_VALIDADO"]],
    PAUSADO: [
      ["PUBLICADO_ATIVO", "CADASTRO_VALIDADO"],
      ["PAUSADO", "REVISAO_CADASTRAL"],
    ],
    RETIRADO_ARQUIVADO: [
      ["PUBLICADO_ATIVO", "CADASTRO_VALIDADO"],
      ["RETIRADO_ARQUIVADO", "ENCERRAMENTO_DA_ATUACAO"],
    ],
  };

  if (ciclo !== null && ciclo !== "PREPARACAO") {
    for (const [destino, motivo] of CAMINHO[ciclo]) {
      const { error: e2 } = await transitar(id, destino, { motivo });
      if (e2) throw new Error(`ponto de partida (${destino}): ${e2.message}`);
    }
    // A trilha do caminho de ida não pertence ao teste: ele começa aqui.
    await service.from("audit_logs").delete().eq("metadata->>professional_profile_id", id);
  }
  return id;
}

async function autorSintetico(): Promise<string> {
  const { data } = await service.from("profiles").select("id").limit(1);
  const id = data?.[0]?.id as string | undefined;
  if (!id) throw new Error("Nenhum profile no banco local. Rode `npm run bootstrap:test-users:local`.");
  return id;
}

async function transitar(
  id: string,
  para: CicloDoProfissional,
  sobre: { motivo?: MotivoDoCiclo | null; nota?: string | null; autor?: string | null; quando?: string | null } = {},
) {
  const autor = sobre.autor === undefined ? await autorSintetico() : sobre.autor;
  return service
    .from("professional_profiles")
    .update({
      ciclo_de_vida: para,
      ciclo_motivo: sobre.motivo === undefined ? "CADASTRO_VALIDADO" : sobre.motivo,
      ciclo_nota: sobre.nota ?? null,
      ciclo_alterado_por: autor,
      ciclo_alterado_em: sobre.quando === undefined ? new Date().toISOString() : sobre.quando,
    })
    .eq("id", id);
}

async function limpar() {
  const { data } = await service
    .from("professional_profiles")
    .select("id")
    .like("professional_identifier", `${MARCA}-%`);
  const ids = (data ?? []).map((r) => r.id as string);
  if (ids.length === 0) return;
  await service.from("audit_logs").delete().in("metadata->>professional_profile_id", ids);
  // A guarda de exclusão é real e vale também para a fixture: a história tem de
  // sair antes do cadastro. É a mesma ordem que um humano seguiria.
  await service.from("connection_records").delete().in("professional_profile_id", ids);
  const { error } = await service.from("professional_profiles").delete().in("id", ids);
  if (error) throw new Error(`cleanup: ${error.message}`);
}

afterEach(limpar);

/**
 * A guarda 11 e a política de exclusão só significam alguma coisa diante de um
 * acompanhamento real. A paciente sintética é uma só; os Cases, um por cenário,
 * e todos desfeitos no fim — nenhuma conta residual, nenhum dado de gente.
 */
let pacienteSintetica: string | null = null;
const casosCriados: string[] = [];
const historiasCriadas: string[] = [];

async function novoCaso(): Promise<{ id: string; patient_profile_id: string }> {
  // Todo Case nasce de uma história — não existe acompanhamento sem alguém que
  // tenha contado alguma coisa. O banco cobra isso, e faz bem.
  const { data: historia, error: eh } = await service
    .from("patient_stories")
    .insert({ profile_id: pacienteSintetica, created_by: pacienteSintetica, status: "enviada" })
    .select("id")
    .single();
  if (eh || !historia) throw new Error(`fixture da história: ${eh?.message ?? "sem história"}`);
  historiasCriadas.push(historia.id as string);

  const { data: caso, error } = await service
    .from("cases")
    .insert({
      patient_profile_id: pacienteSintetica,
      created_by: pacienteSintetica,
      source_story_id: historia.id,
    })
    .select("id, patient_profile_id")
    .single();
  if (error || !caso) throw new Error(`fixture do Case: ${error?.message ?? "sem Case"}`);
  casosCriados.push(caso.id as string);
  return caso as { id: string; patient_profile_id: string };
}

beforeAll(async () => {
  const sufixo = randomUUID().slice(0, 8);
  const { data, error } = await service.auth.admin.createUser({
    email: `zzc7-${sufixo}@aliviar-conexao.local`,
    password: `Senha-${sufixo}-Ok!`,
    email_confirm: true,
    user_metadata: { display_name: "Paciente Sintética C7" },
  });
  if (error || !data?.user) throw new Error(`fixture da paciente: ${error?.message ?? "sem usuário"}`);
  pacienteSintetica = data.user.id;

  const { error: e1 } = await service.from("patient_profiles").insert({ profile_id: pacienteSintetica });
  if (e1) throw new Error(`fixture do perfil da paciente: ${e1.message}`);

});

/**
 * Uma Connection só existe para quem foi APRESENTADO à paciente — invariante de
 * outro corte, que este teste respeita em vez de contornar. Montar isso exige a
 * história inteira: execução do Motor, artefatos, revisão humana e entrega.
 * Trinta linhas de fixture para que a guarda 11 seja exercitada de verdade, e
 * não contra uma tabela de mentira.
 */
async function comConexaoReal(profissionalId: string, status: string) {
  // Uma revisão validada por Case: cada cenário recebe o seu, com história
  // própria. Reaproveitar o mesmo Case colidiria com essa invariante — e
  // acomodar a fixture à custa dela seria testar um mundo que não existe.
  const caso = await novoCaso();
  const autor = await autorSintetico();
  const METODO = "c7-fixture";

  const { data: exec, error: ee } = await service
    .from("ace_executions")
    .insert({ case_id: caso.id, started_by: autor, method_version: METODO })
    .select("id")
    .single();
  if (ee || !exec) throw new Error(`fixture da execução: ${ee?.message ?? "sem execução"}`);

  const artefato = async (tipo: string) => {
    const id = randomUUID();
    const { error } = await service.from("ace_artifacts").insert({
      id,
      case_id: caso.id,
      execution_id: exec.id,
      artifact_type: tipo,
      version: 1,
      protocol_id: tipo === "Shortlist" ? "P009" : "P008",
      protocol_version: "1.0",
      method_version: METODO,
      payload: {},
      created_by: autor,
    });
    if (error) throw new Error(`fixture do artefato ${tipo}: ${error.message}`);
    return id;
  };
  const shortlist = await artefato("Shortlist");
  const matriz = await artefato("CompatibilityMatrix");

  const { data: revisao, error: er } = await service
    .from("human_review_results")
    .insert({
      id: randomUUID(),
      case_id: caso.id,
      execution_id: exec.id,
      reviewer_id: autor,
      reviewed_at: new Date().toISOString(),
      review_status: "VALIDATED",
      review_action: "APPROVE",
      original_shortlist_artifact_id: shortlist,
      original_shortlist_artifact_version: 1,
      compatibility_matrix_artifact_id: matriz,
      compatibility_matrix_artifact_version: 1,
      review_rationale: "Fixture sintética do Corte 7.",
      method_version: METODO,
    })
    .select("id")
    .single();
  if (er || !revisao) throw new Error(`fixture da revisão: ${er?.message ?? "sem revisão"}`);

  const entregaId = randomUUID();
  const agora = new Date().toISOString();
  const { error: ed } = await service.from("final_curadoria_deliveries").insert({
    id: entregaId,
    case_id: caso.id,
    patient_profile_id: caso.patient_profile_id,
    human_review_result_id: revisao.id,
    validated_by: autor,
    validated_at: agora,
    delivered_by: autor,
    generated_at: agora,
    decision_summary: "Fixture sintética do Corte 7.",
    client_context_summary: "Fixture sintética do Corte 7.",
    provider_presentations: [{ providerId: profissionalId }],
    comparison_summary: "Fixture sintética do Corte 7.",
    next_steps: ["Nenhum."],
    method_explanation: "Fixture sintética do Corte 7.",
    disclaimer: "Fixture sintética do Corte 7.",
    method_version: METODO,
  });
  if (ed) throw new Error(`fixture da entrega: ${ed.message}`);

  const { error } = await service.from("connection_records").insert({
    case_id: caso.id,
    patient_profile_id: caso.patient_profile_id,
    professional_profile_id: profissionalId,
    final_curadoria_delivery_id: entregaId,
    status,
    decided_at: agora,
  });
  if (error) throw new Error(`fixture da Connection: ${error.message}`);
}

afterAll(async () => {
  // Ordem inversa da montagem: a história sai antes de quem a guarda.
  if (casosCriados.length > 0) {
    await service.from("final_curadoria_deliveries").delete().in("case_id", casosCriados);
    await service.from("human_review_results").delete().in("case_id", casosCriados);
    await service.from("ace_artifacts").delete().in("case_id", casosCriados);
    await service.from("ace_executions").delete().in("case_id", casosCriados);
    await service.from("cases").delete().in("id", casosCriados);
  }
  if (historiasCriadas.length > 0) await service.from("patient_stories").delete().in("id", historiasCriadas);
  if (pacienteSintetica) {
    await service.from("patient_profiles").delete().eq("profile_id", pacienteSintetica);
    await service.auth.admin.deleteUser(pacienteSintetica);
  }
});

describe("C7 · o trigger aceita as seis passagens", () => {
  it.each([
    ["PREPARACAO", "PUBLICADO_ATIVO", "CADASTRO_VALIDADO"],
    ["PUBLICADO_ATIVO", "PAUSADO", "REVISAO_CADASTRAL"],
    ["PAUSADO", "PUBLICADO_ATIVO", "REATIVACAO_VALIDADA"],
    ["PUBLICADO_ATIVO", "RETIRADO_ARQUIVADO", "ENCERRAMENTO_DA_ATUACAO"],
    ["PAUSADO", "RETIRADO_ARQUIVADO", "IMPEDIMENTO_REGULATORIO"],
    ["RETIRADO_ARQUIVADO", "PREPARACAO", "REGULARIZACAO_CONCLUIDA"],
  ] as const)("%s → %s com motivo %s", async (de, para, motivo) => {
    const id = await criarProfissional(de);
    const { error } = await transitar(id, para, { motivo });
    expect(error, `o banco recusou uma transição legítima: ${error?.message}`).toBeNull();

    const { data } = await service.from("professional_profiles").select("ciclo_de_vida").eq("id", id).single();
    expect(data!.ciclo_de_vida).toBe(para);
  });
});

describe("C7 · o trigger recusa cada transição proibida", () => {
  it.each([
    ["RETIRADO_ARQUIVADO", "PUBLICADO_ATIVO"],
    ["RETIRADO_ARQUIVADO", "PAUSADO"],
    ["PREPARACAO", "PAUSADO"],
    ["PREPARACAO", "RETIRADO_ARQUIVADO"],
    ["PUBLICADO_ATIVO", "PREPARACAO"],
    ["PAUSADO", "PREPARACAO"],
  ] as const)("%s → %s é recusada", async (de, para) => {
    const id = await criarProfissional(de);
    // Escolhe um motivo que EXISTE, para que a recusa seja pela transição.
    const { error } = await transitar(id, para, { motivo: "OUTRO", nota: "tentativa deliberada de transição proibida" });
    expect(error, "o banco aceitou uma transição proibida").not.toBeNull();
    expect(error!.message).toContain("não permitida");

    const { data } = await service.from("professional_profiles").select("ciclo_de_vida").eq("id", id).single();
    expect(data!.ciclo_de_vida, "o estado mudou apesar da recusa").toBe(de);
  });
});

describe("C7 · motivo, nota, autoria e instante", () => {
  it("motivo ausente é recusado", async () => {
    const id = await criarProfissional("PUBLICADO_ATIVO");
    const { error } = await transitar(id, "PAUSADO", { motivo: null });
    expect(error?.message).toContain("exige um motivo");
  });

  it("motivo incompatível com a transição é recusado", async () => {
    const id = await criarProfissional("PUBLICADO_ATIVO");
    const { error } = await transitar(id, "PAUSADO", { motivo: "ENCERRAMENTO_DA_ATUACAO" });
    expect(error?.message).toContain("não vale para a transição");
  });

  it("OUTRO sem nota é recusado", async () => {
    const id = await criarProfissional("PUBLICADO_ATIVO");
    const { error } = await transitar(id, "PAUSADO", { motivo: "OUTRO", nota: null });
    expect(error?.message).toContain("pelo menos 10 caracteres");
  });

  it("OUTRO com nota curta é recusado; com nota válida passa", async () => {
    const curto = await criarProfissional("PUBLICADO_ATIVO");
    expect((await transitar(curto, "PAUSADO", { motivo: "OUTRO", nota: "curta" })).error).not.toBeNull();

    const ok = await criarProfissional("PUBLICADO_ATIVO");
    expect(
      (await transitar(ok, "PAUSADO", { motivo: "OUTRO", nota: "o profissional pediu um intervalo de três meses" })).error,
    ).toBeNull();
  });

  it("autoria ausente é recusada", async () => {
    const id = await criarProfissional("PUBLICADO_ATIVO");
    const { error } = await transitar(id, "PAUSADO", { motivo: "REVISAO_CADASTRAL", autor: null });
    expect(error?.message).toContain("tem autor");
  });

  it("o instante é do banco: o que o cliente manda é ignorado", async () => {
    // C7R · o contrato mudou, e este oráculo muda com ele. Antes o carimbo vinha
    // do aplicativo e o trigger só exigia que fosse diferente do anterior — o
    // que aceitava retroceder para 2020. Agora o banco atribui o instante, e o
    // valor do cliente não é consultado: mandar nulo, ou mandar 2020, dá no
    // mesmo, porque nenhum dos dois é lido.
    const id = await criarProfissional("PUBLICADO_ATIVO");
    const antes = new Date();

    expect((await transitar(id, "PAUSADO", { motivo: "REVISAO_CADASTRAL", quando: null })).error).toBeNull();

    const { data } = await service
      .from("professional_profiles")
      .select("ciclo_alterado_em")
      .eq("id", id)
      .single();
    const gravado = new Date(data!.ciclo_alterado_em as string);
    expect(gravado.getTime(), "o banco não carimbou o instante").toBeGreaterThanOrEqual(antes.getTime() - 1000);
  });

  it("carimbo antigo do cliente não retrocede o histórico", async () => {
    const id = await criarProfissional("PUBLICADO_ATIVO");
    expect(
      (await transitar(id, "PAUSADO", { motivo: "REVISAO_CADASTRAL", quando: "2020-01-01T00:00:00.000Z" })).error,
    ).toBeNull();

    const { data } = await service
      .from("professional_profiles")
      .select("ciclo_alterado_em")
      .eq("id", id)
      .single();
    expect(
      new Date(data!.ciclo_alterado_em as string).getFullYear(),
      "o histórico retrocedeu para o ano que o cliente mandou",
    ).toBeGreaterThan(2020);
  });
});

describe("C7 · guarda 11 — Connection ativa recusa a retirada", () => {
  async function comConexao(status: string) {
    const id = await criarProfissional("PUBLICADO_ATIVO");
    await comConexaoReal(id, status);
    return id;
  }

  it("com acompanhamento em curso, a retirada é recusada", async () => {
    const id = await comConexao("PRIMEIRO_ATENDIMENTO_REALIZADO");
    const { error } = await transitar(id, "RETIRADO_ARQUIVADO", { motivo: "ENCERRAMENTO_DA_ATUACAO" });
    expect(error, "o banco deixou retirar um profissional com acompanhamento em curso").not.toBeNull();
    expect(error!.message).toContain("acompanhamento em curso");

    const { data } = await service.from("professional_profiles").select("ciclo_de_vida").eq("id", id).single();
    expect(data!.ciclo_de_vida, "o estado mudou apesar da recusa").toBe("PUBLICADO_ATIVO");
  });

  it("encerrada, a retirada passa", async () => {
    const id = await comConexao("ENCERRADO_SEM_RELACIONAMENTO");
    expect(
      (await transitar(id, "RETIRADO_ARQUIVADO", { motivo: "ENCERRAMENTO_DA_ATUACAO" })).error,
      "uma Connection encerrada continuou segurando a retirada",
    ).toBeNull();
  });

  it("a pausa nunca é bloqueada — ela existe justamente para preservar o acompanhamento", async () => {
    const id = await comConexao("CONTATO_INICIADO");
    expect(
      (await transitar(id, "PAUSADO", { motivo: "INDISPONIBILIDADE_TEMPORARIA" })).error,
      "a guarda 11 vazou para a pausa",
    ).toBeNull();
  });
});

describe("C7 · a trilha em audit_logs", () => {
  it("cada transição deixa uma linha com de, para, motivo e autor", async () => {
    const id = await criarProfissional("PREPARACAO");
    const autor = await autorSintetico();
    expect((await transitar(id, "PUBLICADO_ATIVO", { motivo: "CADASTRO_VALIDADO" })).error).toBeNull();
    expect((await transitar(id, "PAUSADO", { motivo: "SOLICITACAO_DO_PROFISSIONAL" })).error).toBeNull();

    const { data: tudo } = await service
      .from("audit_logs")
      .select("action, actor_id, metadata")
      .eq("metadata->>professional_profile_id", id)
      .order("created_at");

    // C7R · agora são duas trilhas, e isso é o desenho funcionando. Como o
    // espelho move `publication_status` junto com o ciclo,
    // `log_professional_publication_transition` (20260802162000) também registra
    // — a trilha de publicação seguiu viva, e passou a ser CONSEQUÊNCIA do
    // ciclo em vez de um ato paralelo. Este teste é sobre a trilha do ciclo;
    // a de publicação tem oráculo próprio, logo abaixo.
    const data = (tudo ?? []).filter((l) => String(l.action).startsWith("professional_ciclo_"));

    expect(data, "a trilha do ciclo não registrou as duas passagens").toHaveLength(2);
    expect(data[0]!.action).toBe("professional_ciclo_publicado_ativo");
    expect(data[1]!.action).toBe("professional_ciclo_pausado");
    expect(data[1]!.actor_id).toBe(autor);

    const meta = data[1]!.metadata as Record<string, unknown>;
    expect(meta.de).toBe("PUBLICADO_ATIVO");
    expect(meta.para).toBe("PAUSADO");
    expect(meta.motivo).toBe("SOLICITACAO_DO_PROFISSIONAL");
  });

  it("transição recusada não deixa trilha", async () => {
    const id = await criarProfissional("PREPARACAO");
    await transitar(id, "RETIRADO_ARQUIVADO", { motivo: "OUTRO", nota: "tentativa de transição proibida" });

    const { data } = await service.from("audit_logs").select("id").eq("metadata->>professional_profile_id", id);
    expect(data ?? [], "houve trilha de um ato que não aconteceu").toHaveLength(0);
  });

  it("editar outro campo não gera trilha nem exige motivo", async () => {
    const id = await criarProfissional("PUBLICADO_ATIVO");
    const { error } = await service
      .from("professional_profiles")
      .update({ display_name: "Fixture Sintética C7 (renomeada)" })
      .eq("id", id);
    expect(error, "mudar o nome passou a exigir motivo de ciclo").toBeNull();

    const { data } = await service.from("audit_logs").select("id").eq("metadata->>professional_profile_id", id);
    expect(data ?? []).toHaveLength(0);
  });
});

describe("C7 · legado ambíguo", () => {
  it("não transita a partir de nulo — a revisão vem antes", async () => {
    const id = await criarProfissional(null);
    const { error } = await transitar(id, "PUBLICADO_ATIVO", { motivo: "CADASTRO_VALIDADO" });
    expect(error, "o banco deixou um legado ambíguo transitar sem revisão").not.toBeNull();
    expect(error!.message).toContain("legado sem ciclo classificado");
  });

  it("o ciclo não volta a ser indefinido", async () => {
    const id = await criarProfissional("PUBLICADO_ATIVO");
    const { error } = await service
      .from("professional_profiles")
      .update({ ciclo_de_vida: null })
      .eq("id", id);
    expect(error?.message).toContain("não volta a ser indefinido");
  });
});

describe("C7 · exclusão só sem história", () => {
  it("sem histórico operacional, o cadastro pode ser apagado", async () => {
    const id = await criarProfissional("PREPARACAO");
    const { error } = await service.from("professional_profiles").delete().eq("id", id);
    expect(error, "um cadastro sem história nenhuma foi impedido de sair").toBeNull();
  });

  it("com histórico operacional, a exclusão é recusada e aponta a retirada", async () => {
    const id = await criarProfissional("PUBLICADO_ATIVO");
    await comConexaoReal(id, "DECISAO_REGISTRADA");

    const { error } = await service.from("professional_profiles").delete().eq("id", id);
    expect(error, "um profissional com histórico foi apagado").not.toBeNull();
    expect(error!.message).toContain("Retire da rede");

    const { data } = await service.from("professional_profiles").select("id").eq("id", id);
    expect(data ?? [], "a linha sumiu apesar da recusa").toHaveLength(1);
  });
});

describe("C7 · o módulo puro concorda com o banco", () => {
  it.each([
    ["PUBLICADO_ATIVO", "PAUSADO", "ENCERRAMENTO_DA_ATUACAO"],
    ["PREPARACAO", "PUBLICADO_ATIVO", "REVISAO_CONCLUIDA"],
    ["PAUSADO", "RETIRADO_ARQUIVADO", "CADASTRO_VALIDADO"],
  ] as const)(
    "%s → %s com motivo %s: os dois recusam",
    async (de, para, motivo) => {
      // Se um aceitasse e o outro não, a interface prometeria o que o banco
      // recusa — ou esconderia um caminho que ele permite.
      expect(motivosDaTransicao(de, para)).not.toContain(motivo);
      const veredito = avaliarTransicao({
        de, para, motivo, nota: null, autorId: "x", quando: "y", temConexaoAtiva: false,
      });
      expect(veredito.ok).toBe(false);

      const id = await criarProfissional(de);
      const { error } = await transitar(id, para, { motivo });
      expect(error, "o banco aceitou o que o módulo recusa").not.toBeNull();
    },
  );
});

describe("C7 · cleanup em duas voltas", () => {
  it("limpar duas vezes devolve exatamente a baseline", async () => {
    const { data: antes } = await service.from("professional_profiles").select("id");
    const baseline = (antes ?? []).length;

    await criarProfissional("PREPARACAO");
    await criarProfissional("PUBLICADO_ATIVO");
    const { data: durante } = await service.from("professional_profiles").select("id");
    expect((durante ?? []).length).toBe(baseline + 2);

    await limpar();
    await limpar();

    const { data: depois } = await service.from("professional_profiles").select("id");
    expect((depois ?? []).length, "sobrou resíduo depois de duas voltas").toBe(baseline);
  });
});
