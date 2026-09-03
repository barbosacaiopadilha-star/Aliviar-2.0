import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import {
  contarPedidosEmAberto,
  listarEliminacoesExecutadas,
  listarPedidosParaOperacao,
} from "@/modules/governanca/pedidos-repository";

import { createCuradoriaClient } from "./curadoria-client";

/**
 * A FILA DE PEDIDOS DO TITULAR — as fronteiras em que a tela se apoia.
 *
 * A tela `/admin/pedidos` faz duas coisas com privilégios diferentes, e é
 * essa separação que estes testes protegem:
 *
 *   · LÊ pelo cliente autenticado normal, contando com a RLS de governança
 *     (`or curadoria.has_role('administrador')`);
 *   · ESCREVE por service role, porque `authenticated` não tem UPDATE na
 *     tabela — *"abrir pedido é ato do titular; executá-lo é da operação"*.
 *
 * Se algum dia alguém conceder UPDATE a `authenticated` "para simplificar a
 * tela", o quarto teste reprova: a assistida passaria a poder declarar o
 * próprio pedido como atendido.
 */

type TestAccount = { role: string; email: string; password: string };
const TEST_USERS_PATH = path.resolve(__dirname, "../../test-users.local.json");
function loadTestAccounts(): TestAccount[] {
  if (!existsSync(TEST_USERS_PATH)) throw new Error("test-users.local.json não existe. Rode `npm run bootstrap:test-users`.");
  return JSON.parse(readFileSync(TEST_USERS_PATH, "utf-8"));
}
const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

async function entrar(conta: TestAccount) {
  const client = createCuradoriaClient(url, anonKey);
  const { data, error } = await client.auth.signInWithPassword({ email: conta.email, password: conta.password });
  if (error) throw error;
  return { client, uid: data.user!.id };
}

describe("Pedidos do titular — o que a operação lê, e o que só ela escreve", () => {
  const admin = createAdminSupabaseClient();
  let contas: TestAccount[];
  let assistida: Awaited<ReturnType<typeof entrar>>;
  let administrador: Awaited<ReturnType<typeof entrar>>;
  let curador: Awaited<ReturnType<typeof entrar>>;
  const criados: string[] = [];
  const logsCriados: number[] = [];

  beforeAll(async () => {
    contas = loadTestAccounts();
    const por = (r: string) => contas.find((c) => c.role === r)!;
    assistida = await entrar(por("paciente"));
    administrador = await entrar(por("administrador"));
    curador = await entrar(por("curador_medico"));

    // Dois pedidos da assistida de teste: um de acesso (que a plataforma não
    // executa) e um de correção. Eliminação NÃO entra aqui — ela apagaria a
    // conta permanente da suíte; quem a cobre é
    // `eliminacao-do-titular.integration.test.ts`, com pessoa sintética.
    for (const tipo of ["acesso", "correcao"] as const) {
      const { data, error } = await admin
        .from("data_subject_requests")
        .insert({ profile_id: assistida.uid, tipo })
        .select("id")
        .single();
      if (error) throw error;
      criados.push(data.id as string);
    }
  });

  it("o administrador vê os pedidos pela RLS — sem service role", async () => {
    const pedidos = await listarPedidosParaOperacao(administrador.client);
    const meus = pedidos.filter((p) => criados.includes(p.id));
    expect(meus).toHaveLength(2);
    // O nome vem de `profiles`, que responde ao administrador: sem ele a fila
    // seria uma lista de uuids e a confirmação nominal não teria contra o quê
    // ser conferida.
    expect(meus[0].nomeDoTitular).toBeTruthy();
    expect(meus.map((p) => p.tipo).sort()).toEqual(["acesso", "correcao"]);
  });

  it("a assistida vê o pedido DELA e nada de mais ninguém", async () => {
    const { data, error } = await assistida.client
      .from("data_subject_requests")
      .select("id, profile_id");
    expect(error).toBeNull();
    expect(data!.length).toBeGreaterThanOrEqual(2);
    expect(
      data!.every((linha) => linha.profile_id === assistida.uid),
      "a RLS de governança não pode devolver pedido alheio",
    ).toBe(true);
  });

  it("um curador NÃO vê pedidos de titular — não é papel de governança", async () => {
    const { data, error } = await curador.client.from("data_subject_requests").select("id");
    expect(error).toBeNull();
    expect(data ?? []).toHaveLength(0);
  });

  it("NINGUÉM autenticado escreve na fila — nem a assistida, nem o administrador", async () => {
    for (const [quem, cliente] of [
      ["assistida", assistida.client],
      ["administrador", administrador.client],
    ] as const) {
      const { data, error } = await cliente
        .from("data_subject_requests")
        .update({ status: "concluido", concluido_em: new Date().toISOString(), desfecho: "por fora" })
        .eq("id", criados[0])
        .select("id");
      // Sem privilégio de UPDATE, o Postgres recusa (42501). Se um dia o grant
      // aparecer, a policy de SELECT deixaria a linha visível e o UPDATE
      // passaria — por isso o teste exige erro OU zero linhas afetadas.
      const bloqueado = error !== null || (data ?? []).length === 0;
      expect(bloqueado, `${quem} conseguiu escrever na fila`).toBe(true);
    }
    const { data: intacto } = await admin
      .from("data_subject_requests")
      .select("status, desfecho")
      .eq("id", criados[0])
      .single();
    expect(intacto!.status).toBe("recebido");
    expect(intacto!.desfecho).toBeNull();
  });

  it("a operação registra o desfecho, e um reenvio não responde duas vezes", async () => {
    const primeiro = await admin
      .from("data_subject_requests")
      .update({ status: "concluido", desfecho: "Cópia enviada por e-mail em 03/09.", concluido_em: new Date().toISOString() })
      .eq("id", criados[0])
      .in("status", ["recebido", "em_execucao"])
      .select("id");
    expect(primeiro.error).toBeNull();
    expect(primeiro.data).toHaveLength(1);

    // A mesma escrita de novo: o filtro de status é o que impede sobrescrever
    // a resposta já dada ao titular.
    const segundo = await admin
      .from("data_subject_requests")
      .update({ status: "recusado", desfecho: "REESCRITO", concluido_em: new Date().toISOString() })
      .eq("id", criados[0])
      .in("status", ["recebido", "em_execucao"])
      .select("id");
    expect(segundo.data ?? []).toHaveLength(0);

    const { data: final } = await admin
      .from("data_subject_requests")
      .select("status, desfecho")
      .eq("id", criados[0])
      .single();
    expect(final!.status).toBe("concluido");
    expect(final!.desfecho).toContain("Cópia enviada");
  });

  it("a contagem em aberto ignora o que já foi respondido — é o número da Visão geral", async () => {
    const antes = await contarPedidosEmAberto(administrador.client);
    await admin
      .from("data_subject_requests")
      .update({ status: "recusado", desfecho: "Retenção por obrigação legal (teste).", concluido_em: new Date().toISOString() })
      .eq("id", criados[1])
      .in("status", ["recebido", "em_execucao"]);
    const depois = await contarPedidosEmAberto(administrador.client);
    expect(depois).toBe(antes - 1);
  });

  it("o histórico de eliminações vem da AUDITORIA, e lê o id do metadata", async () => {
    // `data_subject_requests.profile_id → profiles ON DELETE CASCADE`: uma
    // eliminação apaga o próprio pedido. Uma tela que procurasse "concluídos
    // do tipo exclusão" mostraria lista vazia para sempre e pareceria correta.
    // O que sobrevive é este registro — com `target_profile_id` NULO (a coluna
    // tem FK e o perfil já não existe) e o id da pessoa no `metadata`.
    const idEliminado = "55555555-5555-4555-8555-555555555555";
    const { data: inserido, error } = await admin
      .from("audit_logs")
      .insert({
        actor_id: administrador.uid,
        action: "data_subject_request_closed",
        target_profile_id: null,
        metadata: {
          profile_id: idEliminado,
          reason: "teste do histórico",
          cases_discarded: 2,
          documents: 3,
          storage_orphans: 1,
        },
      })
      .select("id")
      .single();
    expect(error).toBeNull();
    logsCriados.push(inserido!.id as number);

    const lidos = await listarEliminacoesExecutadas(administrador.client, 20);
    const meu = lidos.find((e) => e.profileIdEliminado === idEliminado);
    expect(meu, "o registro de auditoria tem de aparecer no histórico da tela").toBeDefined();
    expect(meu!.motivo).toBe("teste do histórico");
    expect(meu!.casesDescartados).toBe(2);
    expect(meu!.documentos).toBe(3);
    expect(meu!.orfaosDeStorage).toBe(1);
  });

  afterAll(async () => {
    if (criados.length) await admin.from("data_subject_requests").delete().in("id", criados);
    // audit_logs tem RLS só com policy de SELECT; o DELETE passa pelo service role.
    if (logsCriados.length) await admin.from("audit_logs").delete().in("id", logsCriados);
  });
});
