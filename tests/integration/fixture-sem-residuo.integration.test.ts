import { describe, expect, it } from "vitest";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";

import {
  cleanupFixture,
  removerPacienteSintetico,
  seedDeliveredCase,
} from "../apoio/apoio-curadoria-entregue";

/**
 * B3-CLEANUP · A FIXTURE PRECISA SAIR INTEIRA — e isso precisa ser falseável.
 *
 * O defeito que originou esta guarda não deixou NENHUM teste vermelho. As
 * fixtures confiavam em `auth.admin.deleteUser` para cascatear
 * `auth.users → curadoria.profiles → cases`; o GoTrue devolvia 500 (SQLSTATE
 * 23503, tabelas que prendem `profiles` sem cascade) e o erro era descartado.
 * O banco local acumulou Cases e contas sintéticas em silêncio.
 *
 * Silêncio deixou de ser resultado aceitável: aqui a limpeza é MEDIDA, e o
 * caso em que o DELETE do Case não afeta nenhuma linha é exercitado de
 * propósito — se ele voltar a passar batido, este arquivo cai.
 */
describe("B3-CLEANUP · a fixture canônica não deixa resíduo", () => {
  const service = createAdminSupabaseClient();

  async function contar(tabela: string, coluna: string, valor: string) {
    const { data, error } = await service.from(tabela).select(coluna).eq(coluna, valor);
    if (error) throw new Error(`${tabela}: ${error.message}`);
    return (data ?? []).length;
  }

  async function total(tabela: string) {
    const { count, error } = await service.from(tabela).select("*", { count: "exact", head: true });
    if (error) throw new Error(`${tabela}: ${error.message}`);
    return count ?? 0;
  }

  /**
   * Contagem por PREFIXO EXATO de e-mail — nunca por papel nem por contagem
   * total. As contas históricas do banco local compartilham o papel
   * `administrador` com o bootstrap permanente; contar por papel derrubaria a
   * conta fixa junto.
   */
  async function contarPrefixo(prefixo: string) {
    let pagina = 1;
    let achados = 0;
    for (;;) {
      const { data, error } = await service.auth.admin.listUsers({ page: pagina, perPage: 1000 });
      if (error) throw new Error(`listUsers: ${error.message}`);
      const usuarios = data?.users ?? [];
      achados += usuarios.filter((u) => (u.email ?? "").startsWith(prefixo)).length;
      if (usuarios.length < 1000) return achados;
      pagina += 1;
    }
  }

  it(
    "cria, limpa, e o Case, o perfil e os filhos somem juntos",
    { timeout: 180_000 },
    async () => {
      const fixture = await seedDeliveredCase({ decidir: "CHOSEN" });

      // O que existe ANTES — sem isto, um cleanup que apaga nada passaria.
      expect(await contar("cases", "id", fixture.caseId), "o Case precisa existir").toBe(1);
      expect(
        await contar("curated_selections", "case_id", fixture.caseId),
        "a Curadoria entregue precisa existir",
      ).toBe(1);
      expect(
        await contar("patient_curadoria_decisions", "case_id", fixture.caseId),
        "a decisão precisa existir",
      ).toBe(1);
      expect(
        await contar("patient_stories", "profile_id", fixture.patientProfileId),
        "a história precisa existir",
      ).toBeGreaterThan(0);
      // O CRM é criado junto com a conta e foi ele que derrubou o `deleteUser`
      // do paciente canônico (crm_contacts_patient_profile_id_fkey, 23503).
      expect(
        await contar("crm_contacts", "patient_profile_id", fixture.patientProfileId),
        "o contato de CRM precisa existir",
      ).toBeGreaterThan(0);

      const { data: antes } = await service.auth.admin.getUserById(fixture.patientProfileId);
      expect(antes?.user?.id, "a conta sintética precisa existir").toBe(fixture.patientProfileId);

      await cleanupFixture(fixture);

      expect(await contar("cases", "id", fixture.caseId), "o Case precisa ter saído").toBe(0);

      // A conta — o passo que falhava em silêncio.
      const { data: conta } = await service.auth.admin.getUserById(fixture.patientProfileId);
      expect(conta?.user ?? null, "a conta sintética precisa ter saído do auth").toBeNull();

      // Os filhos, um a um: o Case sai por cascade, mas a guarda mede em vez
      // de supor — foi supor que produziu o vazamento.
      for (const [tabela, coluna] of [
        ["case_events", "case_id"],
        ["curated_selections", "case_id"],
        ["patient_curadoria_decisions", "case_id"],
        ["connection_records", "case_id"],
        ["final_curadoria_deliveries", "case_id"],
      ] as const) {
        expect(await contar(tabela, coluna, fixture.caseId), `${tabela} ficou para trás`).toBe(0);
      }
      expect(
        await contar("patient_stories", "profile_id", fixture.patientProfileId),
        "a história ficou para trás",
      ).toBe(0);
      expect(
        await contar("crm_contacts", "patient_profile_id", fixture.patientProfileId),
        "o contato de CRM ficou para trás — foi ele que derrubava o deleteUser",
      ).toBe(0);

      // O admin/curador da fixture: criado por execução, e por muito tempo
      // nunca removido. Na integração a limpeza automática de
      // `setup-limpeza.ts` absorvia a sobra; no E2E não há esse guarda-chuva,
      // e foi lá que 225 contas se acumularam.
      const { data: contaAdmin } = await service.auth.admin.getUserById(fixture.adminUserId);
      expect(contaAdmin?.user ?? null, "a conta admin da fixture precisa ter saído").toBeNull();
    },
  );

  it(
    "duas execuções seguidas não fazem nenhuma contagem crescer",
    { timeout: 300_000 },
    async () => {
      const base = {
        admins: await contarPrefixo("connection-e2e-admin-"),
        pacientes: await contarPrefixo("connection-e2e-patient-"),
        cases: await total("cases"),
        profissionais: await total("professional_profiles"),
        papeis: await total("user_roles"),
        auditoria: await total("audit_logs"),
      };

      // Duas voltas: um vazamento de uma conta por fixture só se distingue de
      // ruído quando a contagem volta ao mesmo número DUAS vezes.
      for (const volta of [1, 2]) {
        const fixture = await seedDeliveredCase();
        await cleanupFixture(fixture);

        expect(await contarPrefixo("connection-e2e-admin-"), `admin vazou na volta ${volta}`).toBe(
          base.admins,
        );
        expect(
          await contarPrefixo("connection-e2e-patient-"),
          `paciente vazou na volta ${volta}`,
        ).toBe(base.pacientes);
        expect(await total("cases"), `Case vazou na volta ${volta}`).toBe(base.cases);
        expect(
          await total("professional_profiles"),
          `profissional vazou na volta ${volta}`,
        ).toBe(base.profissionais);
        expect(await total("user_roles"), `user_roles vazou na volta ${volta}`).toBe(base.papeis);
      }

      // A trilha é append-only: pode crescer, nunca encolher. Se um cleanup
      // começar a apagar auditoria, é aqui que se descobre.
      expect(
        await total("audit_logs"),
        "o cleanup não pode apagar audit trail",
      ).toBeGreaterThanOrEqual(base.auditoria);
    },
  );

  it(
    "DELETE do Case que não afeta nenhuma linha é FALHA, nunca silêncio",
    { timeout: 180_000 },
    async () => {
      const fixture = await seedDeliveredCase();
      try {
        // Um Case que não pertence a este paciente: o DELETE por
        // `patient_profile_id` remove o Case real e NÃO remove o exigido.
        // É exatamente a forma do defeito original — e agora ela grita.
        const inexistente = "00000000-0000-0000-0000-000000000000";
        await expect(
          removerPacienteSintetico(service, fixture.patientProfileId, inexistente),
        ).rejects.toThrow(/não saiu do banco/);
      } finally {
        // A tentativa acima falha DEPOIS de apagar o Case e ANTES de apagar o
        // perfil — então este teste não pode terminar sem completar a remoção,
        // sob pena de produzir exatamente o resíduo que ele existe para vetar.
        // Sem `caseIdEsperado`: o Case já saiu, e zero linhas aqui é correto.
        await removerPacienteSintetico(service, fixture.patientProfileId);
        await cleanupFixture({ ...fixture, patientProfileId: "" });
      }
    },
  );
});
