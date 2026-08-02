import { randomUUID } from "node:crypto";

import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";

import { isPublicPath } from "@/modules/auth/public-paths";
import { getReportBySelection } from "@/modules/curadoria/report-repository";
import { listCriticalDivergenceBlocklist } from "@/modules/curadoria/rede-policy";
import { saveReportInputSchema } from "@/modules/curadoria/schema";
import { loadContinuityWorklist } from "@/modules/connection/continuity-worklist";
// Namespace de propósito (Bloco B.6): o gate B18 nasce VERMELHO antes da
// função de decisão existir — um import nomeado de export inexistente
// derrubaria o arquivo inteiro (e os gates D17–D21 com ele).
import * as patientAccounts from "@/modules/profiles/patient-account-repository";

/**
 * =============================================================================
 * GATES DO BLOCO D — FALSO SUCESSO / FAIL-OPEN (sem banco, clients falsos)
 * =============================================================================
 *
 * Funções que hoje transformam ERRO DE INFRAESTRUTURA em resposta de negócio
 * ("não há divergência", "não há relatório", "não há trabalho pendente").
 * O contrato pós-remediação: falha de consulta FALHA — nunca vira um vazio
 * indistinguível do vazio verdadeiro. Todos devem estar VERMELHOS hoje.
 */

/**
 * Client falso: qualquer cadeia de query resolve no MESMO resultado de erro —
 * o formato exato que o PostgREST devolve quando a consulta falha.
 */
function clienteQueFalha(mensagem: string): SupabaseClient {
  const resultado = { data: null, error: { message: mensagem, code: "42501" }, count: null };
  const cadeia: unknown = new Proxy(function () {}, {
    get(_alvo, prop) {
      if (prop === "then") {
        return (resolve: (valor: unknown) => void) => resolve(resultado);
      }
      return () => cadeia;
    },
    apply() {
      return cadeia;
    },
  });
  return { from: () => cadeia } as unknown as SupabaseClient;
}

describe("GATE-D17 [Bloco D] a política da Rede é fail-closed", () => {
  it("listCriticalDivergenceBlocklist com erro de consulta deve LANÇAR — nunca devolver blocklist vazia", async () => {
    const client = clienteQueFalha("permission denied for table verification_divergences");

    // Hoje: `data ?? []` engole o erro e devolve Set vazio — ou seja, uma
    // falha de consulta LIBERA para a Rede profissionais com divergência
    // crítica em aberto. Fail-open no único filtro de segurança da Rede.
    await expect(
      listCriticalDivergenceBlocklist(client),
      "erro de consulta na blocklist precisa FALHAR (fail-closed); " +
        "Set vazio aqui significa 'ninguém está bloqueado', que é falso",
    ).rejects.toThrow();
  });
});

describe("GATE-D18 [Bloco D] getReportBySelection não engole erro", () => {
  it("erro de consulta deve propagar — 'null' é resposta de negócio ('não há Relatório'), não de infraestrutura", async () => {
    const client = clienteQueFalha("connection reset by peer");

    // Hoje: o erro é descartado e a função devolve null — o chamador conclui
    // que o Relatório não existe e segue por um caminho de negócio errado.
    await expect(
      getReportBySelection(client, randomUUID()),
      "falha de consulta precisa propagar; null significa 'Relatório inexistente' e mente",
    ).rejects.toThrow();
  });
});

describe("GATE-D19 [Bloco D] Caixa de Continuidade não silencia falha", () => {
  it("loadContinuityWorklist com erro de consulta não pode devolver [] indistinguível de 'nada pendente'", async () => {
    const client = clienteQueFalha("permission denied for table connection_records");

    // Hoje: `if (error || !data) return []` — a fila de trabalho aparece
    // vazia, o Concierge conclui que não há ninguém esperando, e a falha
    // desaparece sem rastro.
    await expect(
      loadContinuityWorklist(client),
      "falha de consulta precisa FALHAR; [] aqui vira 'ninguém espera nada', que é falso",
    ).rejects.toThrow();
  });
});

describe("GATE-D20 [Bloco D / FUN-01] captação pública de leads", () => {
  it("PUBLIC_PATHS deve conter '/api/crm/leads' — sem isso, o endpoint público de captação exige sessão", async () => {
    expect(
      isPublicPath("/api/crm/leads"),
      "o formulário público de contato posta em /api/crm/leads sem sessão; " +
        "o middleware precisa deixá-lo passar (FUN-01)",
    ).toBe(true);
  });
});

describe("GATE-D21 [Bloco D] round-trip dos pareceres não perde conteúdo", () => {
  it("payload SEM favorablePoints não pode significar 'apagar os pontos favoráveis'", () => {
    const parsed = saveReportInputSchema.parse({
      priorityProfileId: randomUUID(),
      compositionRationale: "Composição de teste do gate.",
      options: [1, 2, 3].map((n) => ({
        professionalProfileId: randomUUID(),
        justification: `Justificativa ${n}.`,
        relationToWeights: `Relação ${n}.`,
        attentionPoints: [`Ponto de atenção ${n}.`],
        // favorablePoints deliberadamente AUSENTE: o editor atual nunca envia
        // o campo — e o schema o transforma em [], que a gravação persiste,
        // apagando pontos favoráveis já registrados (ex.: rascunho assistido).
      })),
    });

    expect(
      parsed.options[0]!.favorablePoints,
      "ausência do campo precisa continuar ausência (undefined = 'não mexi'); " +
        "o default([]) atual converte 'não enviei' em 'apague tudo'",
    ).toBeUndefined();
  });
});

/**
 * Client falso que resolve VAZIO sem erro — a ausência legítima, no mesmo
 * formato do PostgREST (`maybeSingle` sem linha: data null, error null).
 */
function clienteQueNaoEncontra(): SupabaseClient {
  const resultado = { data: null, error: null, count: null };
  const cadeia: unknown = new Proxy(function () {}, {
    get(_alvo, prop) {
      if (prop === "then") {
        return (resolve: (valor: unknown) => void) => resolve(resultado);
      }
      return () => cadeia;
    },
    apply() {
      return cadeia;
    },
  });
  return { from: () => cadeia } as unknown as SupabaseClient;
}

describe("GATE-B18 [Bloco B.6] falha de leitura do provisionamento não vira ausência", () => {
  // conversion-actions.ts descartava o `error` do SELECT em
  // `patient_provisioning` (validação B.5, item B2): uma falha de leitura
  // fazia a retomada concluir "não há operação pendente" e cair no
  // createUser — reabrindo em silêncio o beco do e-mail duplicado (AT-02),
  // a classe exata de defeito que o Bloco B fechou.
  it("leitura de patient_provisioning com erro deve LANÇAR — nunca 'não há operação pendente'", async () => {
    const client = clienteQueFalha("connection reset by peer");

    await expect(
      patientAccounts.getProvisioningOperation(client, "convert-lead:qualquer"),
      "erro de consulta na retomada precisa FALHAR e propagar; " +
        "tratá-lo como ausência dispara um createUser indevido (e-mail duplicado)",
    ).rejects.toThrow();
  });

  it("sem erro e sem linha é ausência LEGÍTIMA: null, e o fluxo segue normal", async () => {
    const client = clienteQueNaoEncontra();

    await expect(
      patientAccounts.getProvisioningOperation(client, "convert-lead:qualquer"),
      "ausência verdadeira (sem error, sem linha) devolve null — o fluxo de criação segue",
    ).resolves.toBeNull();
  });
});
