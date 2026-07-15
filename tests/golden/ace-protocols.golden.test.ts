// Suíte golden dos protocolos ACE que chamam o modelo de linguagem
// (P002, P003, P004, P010 — ver PROTOCOL_CONFIG em
// src/modules/concierge/anthropic-language-model.ts). Ver
// docs/ace/05-knowledge/golden-set-testing.md para o propósito
// (Kernel, seção 4 — auditabilidade/reprodutibilidade) e como adicionar
// um novo caso.
//
// NUNCA roda contra o modelo fake — só faz sentido com a API Anthropic
// real, por isso instancia AnthropicAceLanguageModel diretamente (nunca
// getAceLanguageModel(), que cairia silenciosamente no fake fora de
// produção) e pula a suíte inteira quando CLAUDE_API_KEY não está
// configurada. Nunca faz parte de `npm test`/`test:integration`/CI
// automática — só `npm run test:golden`, sob demanda.
//
// GO LIVE (observabilidade segura, auditoria do Golden Set): toda falha
// grava um artefato de diagnóstico local e sanitizado em
// `.golden-results/<execução>/<protocolo>-<fixture>.json` (nunca em caso
// de sucesso, nunca fora da máquina local) — ver golden-results-writer.ts
// e sanitize-for-log.ts. O terminal continua mostrando só o resumo
// padrão do Vitest; o arquivo é o que permite diagnosticar depois do
// fato, sem precisar reexecutar a mesma amostra estocástica do modelo.

import { describe, expect, it } from "vitest";

import { AnthropicAceLanguageModel } from "@/modules/concierge/anthropic-language-model";
import { p002CaseBuilder, type P002ExtractedFields } from "@/modules/ace/protocols/p002-case-builder";
import { p003CaseAudit, type P003AdditionalFinding } from "@/modules/ace/protocols/p003-case-audit";
import { p004DecisionContextModeler, type P004Modeling } from "@/modules/ace/protocols/p004-decision-context-modeler";
import { p010FinalCuradoriaDelivery, type P010Presentation } from "@/modules/ace/protocols/p010-final-curadoria-delivery";
import { ProtocolError } from "@/modules/ace/core/error-contract";
import type { Narrative } from "@/modules/ace/artifacts/narrative";
import type { DecisionCase } from "@/modules/ace/artifacts/decision-case";
import type { CaseAudit } from "@/modules/ace/artifacts/case-audit";
import type { DecisionContext } from "@/modules/ace/artifacts/decision-context";
import type { CompatibilityMatrix } from "@/modules/ace/artifacts/compatibility-matrix";
import type { HumanReviewResult } from "@/modules/ace/artifacts/human-review-result";
import { p002Fixtures } from "./fixtures/p002-case-builder";
import { p003Fixtures } from "./fixtures/p003-case-audit";
import { p004Fixtures } from "./fixtures/p004-decision-context-modeler";
import { p010Fixtures } from "./fixtures/p010-final-curadoria-delivery";
import type { AceLanguageModelResponse } from "@/modules/concierge/language-model";
import { writeGoldenFailure } from "./golden-results-writer";
import {
  REAL_MODEL_CALLS_BLOCKED_MESSAGE,
  REAL_MODEL_CALLS_MISCONFIGURED_MESSAGE,
  resolveRealModelCallGuardState,
} from "./real-model-call-guard";

const ACE_METHOD_VERSION = "ACE-0.1";

// Uma execução (`npm run test:golden`) grava todos os seus artefatos de
// falha na mesma subpasta — mais fácil de correlacionar depois.
const RUN_TIMESTAMP = new Date().toISOString().replace(/[:.]/g, "-");

async function withGoldenDiagnostics<TOutput>(
  protocol: string,
  fixtureName: string,
  response: AceLanguageModelResponse<TOutput>,
  body: () => Promise<void> | void,
): Promise<void> {
  const start = Date.now();
  try {
    await body();
  } catch (error) {
    writeGoldenFailure({
      protocol,
      fixture: fixtureName,
      runTimestamp: RUN_TIMESTAMP,
      modelId: response.metadata.modelId,
      durationMs: Date.now() - start,
      output: response.output,
      failedExpectation: error instanceof Error ? error.message : String(error),
      errorCode: response.metadata.error?.code ?? (error instanceof ProtocolError ? error.code : null),
    });
    throw error;
  }
}

// Proteção contra chamadas reais acidentais (docs/ace/05-knowledge/
// golden-set-testing.md, seção "Executando contra o modelo real"):
// CLAUDE_API_KEY presente nunca é suficiente sozinha — é sempre exigida
// também ALLOW_REAL_MODEL_CALLS=true, explícita. O estado é resolvido uma
// única vez, antes de qualquer describe/it ser registrado, e nenhum
// cliente Anthropic é instanciado fora do ramo "authorized".
const guardState = resolveRealModelCallGuardState({
  ALLOW_REAL_MODEL_CALLS: process.env.ALLOW_REAL_MODEL_CALLS,
  CLAUDE_API_KEY: process.env.CLAUDE_API_KEY,
});

describe("Golden-set — protocolos ACE contra o modelo Anthropic real", () => {
  if (guardState.status === "blocked") {
    it("BLOQUEADO por padrão — defina ALLOW_REAL_MODEL_CALLS=true para autorizar chamadas reais", () => {
      console.warn(REAL_MODEL_CALLS_BLOCKED_MESSAGE);
      expect(REAL_MODEL_CALLS_BLOCKED_MESSAGE).toBeTruthy();
    });
    return;
  }

  if (guardState.status === "misconfigured") {
    it("ALLOW_REAL_MODEL_CALLS=true definido, mas CLAUDE_API_KEY ausente — erro de configuração, nenhuma chamada tentada", () => {
      throw new Error(REAL_MODEL_CALLS_MISCONFIGURED_MESSAGE);
    });
    return;
  }

  const languageModel = new AnthropicAceLanguageModel();

  describe("P002 — Case Builder", () => {
    for (const fixture of p002Fixtures) {
      it(fixture.name, async () => {
        const response = await languageModel.run<{ narrative: Narrative }, P002ExtractedFields>({
          protocolId: "P002",
          protocolVersion: ACE_METHOD_VERSION,
          prompt: "p002-case-builder",
          input: { narrative: fixture.narrative },
        });

        await withGoldenDiagnostics("P002", fixture.name, response, async () => {
          expect(response.metadata.status, JSON.stringify(response.metadata.error)).toBe("ok");
          const decisionCase = await p002CaseBuilder.execute({
            narrative: fixture.narrative,
            extractedFields: response.output!,
          });

          fixture.assert(decisionCase);
        });
      });
    }
  });

  describe("P003 — Case Audit", () => {
    for (const fixture of p003Fixtures) {
      it(fixture.name, async () => {
        const response = await languageModel.run<
          { decisionCase: DecisionCase },
          { additionalFindings: P003AdditionalFinding[] }
        >({
          protocolId: "P003",
          protocolVersion: ACE_METHOD_VERSION,
          prompt: "p003-case-audit",
          input: { decisionCase: fixture.decisionCase },
        });

        await withGoldenDiagnostics("P003", fixture.name, response, async () => {
          expect(response.metadata.status, JSON.stringify(response.metadata.error)).toBe("ok");
          const caseAudit = await p003CaseAudit.execute({
            decisionCase: fixture.decisionCase,
            additionalFindings: response.output!.additionalFindings,
          });

          fixture.assert(caseAudit);
        });
      });
    }
  });

  describe("P004 — Decision Context Modeler", () => {
    for (const fixture of p004Fixtures) {
      it(fixture.name, async () => {
        const response = await languageModel.run<
          { decisionCase: DecisionCase; caseAudit: CaseAudit },
          P004Modeling
        >({
          protocolId: "P004",
          protocolVersion: ACE_METHOD_VERSION,
          prompt: "p004-decision-context-modeler",
          input: { decisionCase: fixture.decisionCase, caseAudit: fixture.caseAudit },
        });

        await withGoldenDiagnostics("P004", fixture.name, response, async () => {
          expect(response.metadata.status, JSON.stringify(response.metadata.error)).toBe("ok");
          const decisionContext = await p004DecisionContextModeler.execute({
            decisionCase: fixture.decisionCase,
            caseAudit: fixture.caseAudit,
            modeling: response.output!,
          });

          fixture.assert(decisionContext);
        });
      });
    }
  });

  describe("P010 — Final Curadoria Delivery", () => {
    for (const fixture of p010Fixtures) {
      it(fixture.name, async () => {
        const pipeline = await fixture.buildPipeline();

        const response = await languageModel.run<
          {
            decisionCase: DecisionCase;
            decisionContext: DecisionContext;
            humanReviewResult: HumanReviewResult;
            compatibilityMatrix: CompatibilityMatrix;
          },
          P010Presentation
        >({
          protocolId: "P010",
          protocolVersion: pipeline.humanReviewResult.methodVersion,
          prompt: "p010-final-curadoria-delivery",
          input: {
            decisionCase: pipeline.decisionCase,
            decisionContext: pipeline.decisionContext,
            humanReviewResult: pipeline.humanReviewResult,
            compatibilityMatrix: pipeline.compatibilityMatrix,
          },
        });

        await withGoldenDiagnostics("P010", fixture.name, response, async () => {
          expect(response.metadata.status, JSON.stringify(response.metadata.error)).toBe("ok");
          const finalCuradoria = await p010FinalCuradoriaDelivery.execute({
            humanReviewResult: pipeline.humanReviewResult,
            compatibilityMatrix: pipeline.compatibilityMatrix,
            decisionCase: pipeline.decisionCase,
            decisionContext: pipeline.decisionContext,
            providerPresentationRepository: pipeline.providerPresentationRepository,
            presentation: response.output!,
          });

          fixture.assert(finalCuradoria);
        });
      });
    }
  });
});
