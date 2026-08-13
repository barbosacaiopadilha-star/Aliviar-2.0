import { afterEach, describe, expect, it } from "vitest";

import { createClient } from "@supabase/supabase-js";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { listContacts } from "@/modules/crm/repository";
import { VERSAO_DO_CONSENTIMENTO } from "@/modules/crm/solicitacao-publica";

/**
 * OPS-R3A1 · A PORTA PÚBLICA, SOBRE O BANCO REAL.
 *
 * Nada aqui monta linha à mão: tudo atravessa a RPC `solicitar_atendimento_publico`
 * — a mesma que o endpoint chama — e a leitura sai de `listContacts`, o loader
 * real da Fila do Atendimento. Fixture que insere direto na tabela provaria que
 * o `insert` funciona, não que a porta funciona.
 *
 * A fixture é inequívoca: `@validation.aliviar.local`, o domínio sintético já
 * usado pelo projeto, e todo registro criado aqui é removido no `afterEach`.
 */

/** Leitura e limpeza: privilegiadas, como a equipe faria. */
const service = createAdminSupabaseClient();

/**
 * ESCRITA: pelo papel do VISITANTE, nunca pelo privilegiado. Testar a porta com
 * `service_role` provaria que a função roda para quem já pode tudo — e não é
 * disso que a porta trata. O grant é para `anon`, e é como `anon` que ela é
 * exercitada aqui.
 */
const publico = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { db: { schema: "curadoria" }, auth: { persistSession: false } },
);

const MARCA = "porta-publica-a1";

function email(sufixo: string) {
  return `${MARCA}-${sufixo}@validation.aliviar.local`;
}

async function solicitar(entrada: {
  nome?: string;
  email?: string;
  telefone?: string;
  paraOutraPessoa?: boolean;
  versao?: string;
}) {
  return publico.rpc("solicitar_atendimento_publico", {
    _nome: entrada.nome ?? "Fixture Sintética A1",
    _email: entrada.email ?? "",
    _telefone: entrada.telefone ?? "",
    _para_outra_pessoa: entrada.paraOutraPessoa ?? false,
    _consentimento_versao: entrada.versao ?? VERSAO_DO_CONSENTIMENTO,
  });
}

async function contatosDaFixture() {
  const { data, error } = await service
    .from("crm_contacts")
    .select("*")
    .like("email_normalized", `${MARCA}-%`);
  if (error) throw new Error(`leitura da fixture: ${error.message}`);
  return data ?? [];
}

async function limpar() {
  const { error } = await service.from("crm_contacts").delete().like("email_normalized", `${MARCA}-%`);
  if (error) throw new Error(`cleanup: ${error.message}`);
  const { error: e2 } = await service
    .from("crm_contacts")
    .delete()
    .like("phone_normalized", "5511900000%");
  if (e2) throw new Error(`cleanup telefone: ${e2.message}`);
}

afterEach(limpar);

describe("T-A-2 · uma solicitação válida cria exatamente um contato", () => {
  it("nasce um contato, e apenas um", async () => {
    const { error } = await solicitar({ email: email("t2") });
    expect(error).toBeNull();

    const contatos = await contatosDaFixture();
    expect(contatos, "a porta pública não criou o contato").toHaveLength(1);
  });

  it("T-A-5 · o contato nasce SEM responsável, no estado canônico", async () => {
    await solicitar({ email: email("t5") });
    const [contato] = await contatosDaFixture();

    expect(contato!.assigned_to, "o contato nasceu com dono").toBeNull();
    expect(contato!.pipeline_stage).toBe("new_contact");
    expect(contato!.source).toBe("porta_publica");
    expect(contato!.consent_status).toBe("concedido");
    expect(contato!.consent_recorded_at, "consentimento sem data").not.toBeNull();
    expect(String(contato!.source_detail)).toContain(VERSAO_DO_CONSENTIMENTO);
  });

  it("não grava nada de clínico — a linha só tem o que a porta coleta", async () => {
    await solicitar({ email: email("clinico") });
    const [contato] = await contatosDaFixture();

    // `initial_reason` existe na tabela e é texto livre. A porta pública NÃO o
    // preenche: é exatamente onde conteúdo clínico entraria sem ninguém notar.
    expect(contato!.initial_reason, "a porta pública escreveu em initial_reason").toBeNull();
    expect(contato!.patient_profile_id).toBeNull();
    expect(contato!.active_case_id).toBeNull();
  });
});

describe("T-A-4 · repetição equivalente em 24 h não duplica", () => {
  it("o mesmo e-mail, duas vezes, é um contato só", async () => {
    await solicitar({ email: email("t4") });
    await solicitar({ email: email("t4") });
    expect(await contatosDaFixture()).toHaveLength(1);
  });

  it("o mesmo telefone escrito de três jeitos é a mesma pessoa", async () => {
    for (const forma of ["(11) 90000-0001", "11900000001", "+55 11 90000-0001"]) {
      await solicitar({ telefone: forma });
    }
    const { data } = await service
      .from("crm_contacts")
      .select("id")
      .eq("phone_normalized", "5511900000001");
    expect(data ?? [], "o mesmo telefone virou vários contatos").toHaveLength(1);
  });

  it("⛔ nome igual NÃO funde pessoas diferentes", async () => {
    await solicitar({ nome: "Maria Silva", email: email("maria-a") });
    await solicitar({ nome: "Maria Silva", email: email("maria-b") });
    expect(await contatosDaFixture(), "duas pessoas homônimas viraram uma").toHaveLength(2);
  });

  it("e-mail bate e telefone diverge: continua sendo a mesma pessoa", async () => {
    await solicitar({ email: email("colisao"), telefone: "(11) 90000-0002" });
    await solicitar({ email: email("colisao"), telefone: "(11) 90000-0003" });
    expect(await contatosDaFixture()).toHaveLength(1);
  });
});

describe("T-A-11 · retry e concorrência não duplicam", () => {
  it("cinco envios simultâneos produzem um contato", async () => {
    const alvo = email("concorrencia");
    const resultados = await Promise.all(Array.from({ length: 5 }, () => solicitar({ email: alvo })));
    for (const r of resultados) expect(r.error).toBeNull();
    expect(await contatosDaFixture(), "a corrida criou duplicatas").toHaveLength(1);
  });
});

describe("T-A-16 · contato já convertido não é alterado por envio público", () => {
  it("a repetição não mexe em quem já virou paciente", async () => {
    const alvo = email("convertido");
    await solicitar({ email: alvo });
    const [antes] = await contatosDaFixture();

    // Simula a conversão feita pelo Atendimento — o caminho interno. A check
    // `crm_contacts_conversao_coerente` exige que `converted_at` e
    // `patient_profile_id` andem juntos: conversão sem paciente não existe, e
    // o banco recusa. Satisfazer a regra é parte de simular de verdade.
    const { data: perfis } = await service.from("profiles").select("id").limit(1);
    const perfil = perfis?.[0]?.id as string | undefined;
    if (!perfil) {
      throw new Error(
        "Nenhum perfil no banco local para simular a conversão. Rode `npm run bootstrap:test-users:local`.",
      );
    }

    const marcoDaConversao = new Date().toISOString();
    const { error } = await service
      .from("crm_contacts")
      .update({ converted_at: marcoDaConversao, patient_profile_id: perfil })
      .eq("id", antes!.id);
    expect(error).toBeNull();

    await solicitar({ email: alvo });

    const depois = await contatosDaFixture();
    expect(depois, "o envio público criou um segundo contato para quem já converteu").toHaveLength(1);
    // Comparação por instante, não por texto: o Postgres devolve `+00:00` onde
    // o JS escreve `Z`. São o mesmo momento, e é o momento que importa.
    expect(
      new Date(String(depois[0]!.converted_at)).getTime(),
      "o envio público mexeu no marco da conversão",
    ).toBe(new Date(marcoDaConversao).getTime());
    expect(depois[0]!.id, "o envio público trocou o contato de quem já converteu").toBe(antes!.id);
  });
});

describe("T-A-12 · o contato atravessa writer e loader reais da Fila", () => {
  it("aparece em listContacts, sem responsável e com origem pública", async () => {
    await solicitar({ email: email("fila") });

    const fila = await listContacts(service);
    const nosso = fila.filter((c) => (c.email ?? "").includes(`${MARCA}-fila`));

    expect(nosso, "o contato não chegou à Fila do Atendimento").toHaveLength(1);
    expect(nosso[0]!.assignedTo ?? null, "chegou à Fila já com dono").toBeNull();
    expect(nosso[0]!.pipelineStage).toBe("new_contact");
  });
});

describe("T-A-13 · a porta pública não cria conta nem Case", () => {
  it("nenhum usuário, perfil ou Case nasce da solicitação", async () => {
    const antesUsuarios = (await service.auth.admin.listUsers({ perPage: 1000 })).data?.users.length ?? 0;
    const antesCases = (await service.from("cases").select("id")).data?.length ?? 0;
    const antesPerfis = (await service.from("profiles").select("id")).data?.length ?? 0;

    await solicitar({ email: email("t13") });

    expect((await service.auth.admin.listUsers({ perPage: 1000 })).data?.users.length ?? 0).toBe(antesUsuarios);
    expect((await service.from("cases").select("id")).data?.length ?? 0).toBe(antesCases);
    expect((await service.from("profiles").select("id")).data?.length ?? 0).toBe(antesPerfis);
  });
});

describe("o writer recusa o que a interface também recusaria", () => {
  it("sem nome, sem contato ou sem consentimento, não escreve", async () => {
    for (const invalido of [
      { nome: "   ", email: email("invalido-1") },
      { email: "", telefone: "" },
      { email: email("invalido-3"), versao: "  " },
    ]) {
      const { error } = await solicitar(invalido);
      expect(error, "o writer aceitou pedido inválido").not.toBeNull();
    }
    expect(await contatosDaFixture()).toHaveLength(0);
  });
});

describe("cleanup idempotente — duas voltas, resíduo zero", () => {
  it("limpar duas vezes devolve exatamente a baseline", async () => {
    const baseline = (await service.from("crm_contacts").select("id")).data?.length ?? 0;

    await solicitar({ email: email("cleanup-1") });
    await solicitar({ email: email("cleanup-2"), telefone: "(11) 90000-0009" });
    expect((await service.from("crm_contacts").select("id")).data?.length ?? 0).toBe(baseline + 2);

    await limpar();
    await limpar();

    expect(
      (await service.from("crm_contacts").select("id")).data?.length ?? 0,
      "sobrou resíduo depois de duas voltas de limpeza",
    ).toBe(baseline);
  });
});
