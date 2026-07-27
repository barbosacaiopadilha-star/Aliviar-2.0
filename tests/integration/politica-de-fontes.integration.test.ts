// POLÍTICA DE FONTES — as garantias que vivem no banco
//
// A política tem duas metades. Uma é de domínio e está em `fontes.ts`, com
// testes unitários. Esta é a outra: o que o PostgreSQL recusa mesmo quando o
// código não pergunta.
//
// Usam service_role de propósito. Uma garantia que só existe sob RLS não é
// garantia — é convenção.

import { afterEach, beforeAll, describe, expect, it } from "vitest";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { listApprovedProviders } from "@/modules/curadoria/repository";

const admin = createAdminSupabaseClient();

let criados: string[] = [];
let algumPerfil: string;

async function criarProfissional(fields: Record<string, unknown> = {}): Promise<string> {
  const { data, error } = await admin
    .from("professional_profiles")
    .insert({
      display_name: "Profissional de teste",
      professional_identifier: `TESTE-FONTES-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      created_by: algumPerfil,
      ...fields,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  criados.push(data!.id as string);
  return data!.id as string;
}

async function darAreaVerificada(profissionalId: string) {
  const { error } = await admin.from("professional_practice_areas").insert({
    professional_profile_id: profissionalId,
    raw_text: "Ortopedia de coluna",
    tags: ["ortopedia-de-coluna"],
    source: "Site da clínica, consultado em 27/07/2026",
    verification_status: "verificado",
    verified_at: new Date().toISOString(),
    verified_by: algumPerfil,
  });
  if (error) throw new Error(error.message);
}

/** Tudo o que a publicação exige, para os testes poderem tirar um de cada vez. */
async function criarPublicavel(): Promise<string> {
  const id = await criarProfissional({
    crm: "123456",
    crm_uf: "SP",
    registration_status: "regular",
    registration_source: "Consulta ao CRM-SP em 27/07/2026",
    registration_verified_at: new Date().toISOString(),
    registration_verified_by: algumPerfil,
  });
  await darAreaVerificada(id);
  return id;
}

describe("política de fontes — o que o banco recusa (Supabase local)", () => {
  beforeAll(async () => {
    expect(process.env.SUPABASE_SERVICE_ROLE_KEY, "SUPABASE_SERVICE_ROLE_KEY ausente").toBeTruthy();
    algumPerfil = (await admin.from("profiles").select("id").limit(1).single()).data!.id as string;
  });

  afterEach(async () => {
    if (criados.length === 0) return;
    await admin.from("verification_divergences").delete().in("professional_profile_id", criados);
    await admin.from("professional_practice_areas").delete().in("professional_profile_id", criados);
    await admin.from("professional_profiles").delete().in("id", criados);
    criados = [];
  });

  describe("proveniência é obrigatória para dizer 'verificado'", () => {
    it("verificado sem fonte é recusado", async () => {
      const prof = await criarProfissional();

      const { error } = await admin.from("professional_practice_areas").insert({
        professional_profile_id: prof,
        raw_text: "Ortopedia de coluna",
        verification_status: "verificado",
        verified_at: new Date().toISOString(),
        verified_by: algumPerfil,
      });

      expect(error).not.toBeNull();
      expect(error!.message).toContain("proveniencia");
    });

    it("verificado sem autor é recusado", async () => {
      const prof = await criarProfissional();

      const { error } = await admin.from("professional_practice_areas").insert({
        professional_profile_id: prof,
        raw_text: "Ortopedia de coluna",
        source: "Site da clínica",
        verification_status: "verificado",
        verified_at: new Date().toISOString(),
      });

      expect(error).not.toBeNull();
    });

    it("verificado sem data é recusado", async () => {
      const prof = await criarProfissional();

      const { error } = await admin.from("professional_education_entries").insert({
        professional_profile_id: prof,
        title: "Residência em Ortopedia",
        kind: "residencia",
        source: "Certidão da instituição",
        verification_status: "verificado",
        verified_by: algumPerfil,
      });

      expect(error).not.toBeNull();
    });

    it("os outros estados não exigem proveniência — procurar e não achar também é trabalho", async () => {
      const prof = await criarProfissional();

      const { error } = await admin.from("professional_education_entries").insert({
        professional_profile_id: prof,
        title: "Fellowship declarado",
        kind: "fellowship",
        verification_status: "nao_localizado",
      });

      expect(error).toBeNull();
    });

    it("registro profissional segue a mesma regra", async () => {
      const prof = await criarProfissional();

      const { error } = await admin
        .from("professional_profiles")
        .update({ registration_status: "regular" })
        .eq("id", prof);

      expect(error).not.toBeNull();
    });
  });

  describe("divergência preserva as duas versões", () => {
    it("as duas versões e as duas fontes ficam registradas", async () => {
      const prof = await criarProfissional();

      const { data, error } = await admin
        .from("verification_divergences")
        .insert({
          professional_profile_id: prof,
          subject: "FELLOWSHIP",
          declared_version: "Fellowship em Cirurgia da Coluna",
          declared_source: "Currículo enviado pelo profissional",
          found_version: "Curso de aperfeiçoamento em Cirurgia da Coluna",
          found_source: "Secretaria da instituição",
          opened_by: algumPerfil,
        })
        .select("*")
        .single();

      expect(error).toBeNull();
      expect(data!.declared_version).toContain("Fellowship");
      expect(data!.found_version).toContain("aperfeiçoamento");
      expect(data!.status).toBe("aberta");
      expect(data!.severity).toBe("critica");
    });

    it("resolver não apaga nenhuma das duas — só acrescenta a conclusão", async () => {
      const prof = await criarProfissional();

      const { data: aberta } = await admin
        .from("verification_divergences")
        .insert({
          professional_profile_id: prof,
          subject: "FELLOWSHIP",
          declared_version: "Fellowship em Cirurgia da Coluna",
          found_version: "Curso de aperfeiçoamento",
          opened_by: algumPerfil,
        })
        .select("id")
        .single();

      const { data: resolvida, error } = await admin
        .from("verification_divergences")
        .update({
          status: "resolvida",
          resolution: "A instituição confirmou por escrito que o programa é de aperfeiçoamento.",
          resolved_version: "Curso de aperfeiçoamento em Cirurgia da Coluna",
          resolved_by: algumPerfil,
          resolved_at: new Date().toISOString(),
        })
        .eq("id", aberta!.id)
        .select("*")
        .single();

      expect(error).toBeNull();
      // O histórico continua legível: dá para saber o que foi declarado e o
      // que a fonte dizia, mesmo depois de decidido.
      expect(resolvida!.declared_version).toContain("Fellowship");
      expect(resolvida!.found_version).toContain("aperfeiçoamento");
      expect(resolvida!.resolved_by).toBe(algumPerfil);
    });

    it("fechar uma divergência sem dizer o que se concluiu é recusado", async () => {
      const prof = await criarProfissional();

      const { data: aberta } = await admin
        .from("verification_divergences")
        .insert({
          professional_profile_id: prof,
          subject: "FELLOWSHIP",
          declared_version: "A",
          found_version: "B",
          opened_by: algumPerfil,
        })
        .select("id")
        .single();

      const { error } = await admin
        .from("verification_divergences")
        .update({ status: "resolvida" })
        .eq("id", aberta!.id);

      expect(error).not.toBeNull();
    });
  });

  describe("publicação é uma porta com condições", () => {
    it("cadastro que cumpre os requisitos publica", async () => {
      const prof = await criarPublicavel();

      const { error } = await admin
        .from("professional_profiles")
        .update({ publication_status: "publicado" })
        .eq("id", prof);

      expect(error).toBeNull();
    });

    it("sem registro verificado no conselho não publica", async () => {
      const prof = await criarProfissional({ crm: "123456", crm_uf: "SP" });
      await darAreaVerificada(prof);

      const { error } = await admin
        .from("professional_profiles")
        .update({ publication_status: "publicado" })
        .eq("id", prof);

      expect(error).not.toBeNull();
      expect(error!.message).toContain("registro profissional");
    });

    it("sem área verificada não publica", async () => {
      const prof = await criarProfissional({
        crm: "123456",
        crm_uf: "SP",
        registration_status: "regular",
        registration_source: "Consulta ao CRM-SP",
        registration_verified_at: new Date().toISOString(),
        registration_verified_by: algumPerfil,
      });

      const { error } = await admin
        .from("professional_profiles")
        .update({ publication_status: "publicado" })
        .eq("id", prof);

      expect(error).not.toBeNull();
      expect(error!.message).toContain("area de atuacao");
    });

    it("sem CRM não publica", async () => {
      const prof = await criarProfissional({
        registration_status: "regular",
        registration_source: "Consulta",
        registration_verified_at: new Date().toISOString(),
        registration_verified_by: algumPerfil,
      });
      await darAreaVerificada(prof);

      const { error } = await admin
        .from("professional_profiles")
        .update({ publication_status: "publicado" })
        .eq("id", prof);

      expect(error).not.toBeNull();
    });

    it("divergência crítica em aberto barra a publicação", async () => {
      const prof = await criarPublicavel();

      await admin.from("verification_divergences").insert({
        professional_profile_id: prof,
        subject: "FELLOWSHIP",
        declared_version: "Fellowship",
        found_version: "Aperfeiçoamento",
        severity: "critica",
        opened_by: algumPerfil,
      });

      const { error } = await admin
        .from("professional_profiles")
        .update({ publication_status: "publicado" })
        .eq("id", prof);

      expect(error).not.toBeNull();
      expect(error!.message).toContain("divergencia critica");
    });

    it("divergência de observação não barra — nem toda discordância muda uma decisão", async () => {
      const prof = await criarPublicavel();

      await admin.from("verification_divergences").insert({
        professional_profile_id: prof,
        subject: "IDIOMAS",
        declared_version: "Português e inglês",
        found_version: "Português",
        severity: "observacao",
        opened_by: algumPerfil,
      });

      const { error } = await admin
        .from("professional_profiles")
        .update({ publication_status: "publicado" })
        .eq("id", prof);

      expect(error).toBeNull();
    });
  });

  describe("a Rede que o Curador vê", () => {
    it("profissional real, publicado e sem divergência aparece", async () => {
      const prof = await criarPublicavel();
      await admin.from("professional_profiles").update({ publication_status: "publicado" }).eq("id", prof);

      const rede = await listApprovedProviders(admin);
      expect(rede.map((p) => p.professionalProfileId)).toContain(prof);
    });

    it("profissional em rascunho não aparece", async () => {
      const prof = await criarPublicavel(); // criado, verificado — e não publicado

      const rede = await listApprovedProviders(admin);
      expect(rede.map((p) => p.professionalProfileId)).not.toContain(prof);
    });

    it("publicado com divergência crítica aberta some da Rede sem precisar ser despublicado", async () => {
      const prof = await criarPublicavel();
      await admin.from("professional_profiles").update({ publication_status: "publicado" }).eq("id", prof);

      expect((await listApprovedProviders(admin)).map((p) => p.professionalProfileId)).toContain(prof);

      await admin.from("verification_divergences").insert({
        professional_profile_id: prof,
        subject: "AREA_DE_ATUACAO",
        declared_version: "Ortopedia de coluna",
        found_version: "Ortopedia geral",
        severity: "critica",
        opened_by: algumPerfil,
      });

      const depois = await listApprovedProviders(admin);
      expect(depois.map((p) => p.professionalProfileId)).not.toContain(prof);
    });

    it("publicação não significa compatibilidade — quem entra na Rede ainda não foi avaliado para caso nenhum", async () => {
      const prof = await criarPublicavel();
      await admin.from("professional_profiles").update({ publication_status: "publicado" }).eq("id", prof);

      const rede = await listApprovedProviders(admin);
      const entrada = rede.find((p) => p.professionalProfileId === prof)!;

      // O snapshot que o Curador recebe não carrega nenhuma conclusão sobre
      // adequação. Ele traz fatos; a compatibilidade é declarada por ele.
      expect(entrada).toBeDefined();
      expect(Object.keys(entrada)).not.toContain("compatibility");
      expect(Object.keys(entrada)).not.toContain("score");
    });
  });
});
