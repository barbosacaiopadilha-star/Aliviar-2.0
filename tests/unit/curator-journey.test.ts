import { describe, expect, it } from "vitest";

import { conduct } from "@/modules/curadoria/cos/conduction";
import {
  CURATOR_JOURNEY_DEFINITIONS,
  CURATOR_JOURNEY_ORDER,
  JOURNEY_ACTION_LABELS,
  buildCuratorJourney,
  journeyStepHref,
  resolveJourneyStep,
  stepOfPhase,
} from "@/modules/curadoria/cos/journey";
import { COS_PHASES } from "@/modules/curadoria/cos/types";
import { MOCK_RECORDS } from "@/modules/curadoria/cos/mock-records";

const records = Object.values(MOCK_RECORDS);

describe("a jornada projeta o Método sem perder nada dele", () => {
  it("toda fase canônica pertence a exatamente uma etapa", () => {
    const cobertas = CURATOR_JOURNEY_ORDER.flatMap(
      (step) => CURATOR_JOURNEY_DEFINITIONS[step].phases,
    );
    expect(new Set(cobertas).size).toBe(cobertas.length);
    expect(new Set(cobertas)).toEqual(new Set(COS_PHASES));
  });

  it("as nove fases continuam intactas no domínio", () => {
    // A simplificação é de experiência. Se este número mudar, alguém mexeu no
    // Método achando que estava mexendo em tela.
    expect(COS_PHASES).toHaveLength(9);
    expect(CURATOR_JOURNEY_ORDER).toHaveLength(4);
  });

  it("cada etapa mantém a ordem do Método — nenhuma fase é remontada fora de sequência", () => {
    const ordemProjetada = CURATOR_JOURNEY_ORDER.flatMap(
      (step) => CURATOR_JOURNEY_DEFINITIONS[step].phases,
    );
    expect(ordemProjetada).toEqual([...COS_PHASES]);
  });
});

describe("as fusões só valem onde é o mesmo momento do raciocínio", () => {
  it("História e Caso são a mesma etapa", () => {
    expect(stepOfPhase("HISTORIA")).toBe("ACOLHER");
    expect(stepOfPhase("CASO")).toBe("ACOLHER");
  });

  it("Filtros, Prioridades e o reconhecimento dela são a mesma etapa", () => {
    // ADR-042: o reconhecimento é ESTADO do Perfil, não etapa da investigação.
    // O ato continua sendo dela — o que mudou é que deixou de ser cobrado do
    // Curador como se fosse um passo do trabalho dele.
    expect(stepOfPhase("FILTROS")).toBe("COMPARAR");
    expect(stepOfPhase("PRIORIDADES")).toBe("COMPARAR");
    expect(stepOfPhase("VALIDACAO")).toBe("COMPARAR");
    expect(CURATOR_JOURNEY_DEFINITIONS.COMPARAR.phases).toEqual([
      "FILTROS",
      "PRIORIDADES",
      "VALIDACAO",
      "CURADORIA_TECNICA",
    ]);
  });

  it("a jornada não fala mais a língua do modelo antigo", () => {
    const vocabulario = JSON.stringify(CURATOR_JOURNEY_DEFINITIONS);
    expect(vocabulario).not.toMatch(/CRITERIOS|VALIDAR|Definir Critérios|Validar Critérios/);
  });

  it("endereço antigo continua chegando ao lugar certo — nunca em 404", () => {
    expect(resolveJourneyStep("criterios")).toBe("COMPARAR");
    expect(resolveJourneyStep("validacao")).toBe("COMPARAR");
    expect(resolveJourneyStep("mapa-de-prioridades")).toBe("COMPARAR");
  });

  it("Relatório e Devolutiva permanecem separados — dias e donos diferentes", () => {
    expect(stepOfPhase("RELATORIO")).toBe("RELATORIO");
    expect(stepOfPhase("DEVOLUTIVA")).toBe("FINALIZAR");
  });
});

describe("nenhuma rota herdada morre", () => {
  it("todo slug de fase continua resolvendo para a etapa que a contém", () => {
    for (const phase of COS_PHASES) {
      expect(resolveJourneyStep(phase.toLowerCase()), `slug morto: ${phase}`).toBe(
        stepOfPhase(phase),
      );
    }
  });

  it("todo slug de etapa resolve para si mesmo", () => {
    for (const step of CURATOR_JOURNEY_ORDER) {
      expect(resolveJourneyStep(CURATOR_JOURNEY_DEFINITIONS[step].slug)).toBe(step);
    }
  });

  // "mesa" ERA o exemplo de slug inexistente. Virou o slug real da etapa
  // COMPARAR quando a Mesa antiga saiu (ADR-093) e a rota `curadoria_tecnica`
  // deu lugar a `mesa` — trocar o exemplo é o que mantém o teste mordendo.
  it("slug desconhecido não vira etapa por engano", () => {
    // `curadoria_tecnica` NÃO serve de exemplo: continua resolvendo, e com
    // razão — é o slug da FASE do Método, que não saiu porque a rota saiu.
    // Endereço herdado nunca morre (o teste acima prova isso).
    expect(resolveJourneyStep("bancada")).toBeNull();
    expect(resolveJourneyStep("")).toBeNull();
  });

  it("a etapa COMPARAR leva à Mesa nova", () => {
    expect(resolveJourneyStep("mesa")).toBe("COMPARAR");
  });

  it("cada etapa tem um endereço, e nenhum se repete", () => {
    const hrefs = CURATOR_JOURNEY_ORDER.map((step) => journeyStepHref("c1", step));
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });
});

describe("o estado da etapa deriva do estado das fases (P4)", () => {
  it("etapa só fecha quando todas as suas fases fecharam", () => {
    for (const record of records) {
      const journey = buildCuratorJourney(record, conduct(record));
      for (const step of journey.steps) {
        const todasFechadas = step.phases.every((phase) => phase.status === "CONCLUIDA");
        expect(step.status === "CONCLUIDA").toBe(todasFechadas);
      }
    }
  });

  it("uma etapa nunca esconde o que falta em qualquer das suas fases", () => {
    for (const record of records) {
      const journey = buildCuratorJourney(record, conduct(record));
      for (const step of journey.steps) {
        const faltamNasFases = step.phases.flatMap((phase) => phase.missing);
        expect(step.missing).toEqual(faltamNasFases);
      }
    }
  });

  it("esperar por alguém vence: se uma fase aguarda o paciente, a etapa aguarda", () => {
    for (const record of records) {
      const journey = buildCuratorJourney(record, conduct(record));
      for (const step of journey.steps) {
        if (step.phases.some((phase) => phase.status === "AGUARDANDO")) {
          expect(step.status).toBe("AGUARDANDO");
        }
      }
    }
  });

  it("a etapa atual é a primeira não concluída — voltar atrás é legítimo", () => {
    for (const record of records) {
      const journey = buildCuratorJourney(record, conduct(record));
      const primeiraAberta = journey.steps.find((step) => step.status !== "CONCLUIDA");
      expect(journey.currentStep).toBe(primeiraAberta?.id ?? journey.steps[journey.steps.length - 1]!.id);
    }
  });

  it("o progresso conta etapas fechadas, e nada mais", () => {
    for (const record of records) {
      const journey = buildCuratorJourney(record, conduct(record));
      expect(journey.totalCount).toBe(4);
      expect(journey.completedCount).toBe(
        journey.steps.filter((step) => step.status === "CONCLUIDA").length,
      );
    }
  });
});

describe("o que já sabemos vem dos mesmos critérios do Motor", () => {
  it("nada é declarado à mão: settled e missing nunca se sobrepõem", () => {
    for (const record of records) {
      const journey = buildCuratorJourney(record, conduct(record));
      for (const step of journey.steps) {
        for (const item of step.settled) {
          expect(step.missing, `critério em dois lados: ${item}`).not.toContain(item);
        }
      }
    }
  });

  it("etapa concluída não tem nada em aberto", () => {
    for (const record of records) {
      const journey = buildCuratorJourney(record, conduct(record));
      for (const step of journey.steps.filter((s) => s.status === "CONCLUIDA")) {
        expect(step.missing).toEqual([]);
      }
    }
  });
});

describe("vocabulário da jornada — o nome é o raciocínio, não a entidade", () => {
  it("nenhum rótulo de ação é genérico", () => {
    for (const label of Object.values(JOURNEY_ACTION_LABELS)) {
      expect(label.toLowerCase()).not.toBe("continuar");
      expect(label.toLowerCase()).not.toBe("avançar");
      expect(label.toLowerCase()).not.toBe("prosseguir");
    }
  });

  it("toda etapa declara a frase que o Curador diz ao terminá-la", () => {
    for (const step of CURATOR_JOURNEY_ORDER) {
      const definition = CURATOR_JOURNEY_DEFINITIONS[step];
      expect(definition.completionSentence.length).toBeGreaterThan(15);
      // Primeira pessoa: é o Curador falando, não o sistema descrevendo.
      expect(definition.completionSentence).toMatch(/^[A-ZÀ-Ú]/);
    }
  });

  it("determinismo — a mesma Memória sempre produz a mesma jornada", () => {
    const record = records[0]!;
    const uma = buildCuratorJourney(record, conduct(record));
    const outra = buildCuratorJourney(record, conduct(record));
    expect(JSON.stringify(uma)).toBe(JSON.stringify(outra));
  });
});
