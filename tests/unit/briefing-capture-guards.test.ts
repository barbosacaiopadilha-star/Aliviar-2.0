import { describe, expect, it } from "vitest";

import {
  CAPTURE_STATE_LABELS,
  captureStateLabel,
  deriveCaptureState,
} from "@/modules/briefing/capture-state";
import {
  VERBATIM_CONTRACT,
  inspectDeclaredText,
} from "@/modules/briefing/content-guard";

describe("estado de captura — palavra, nunca número (P2)", () => {
  it("nenhum rótulo contém percentual, fração ou contagem", () => {
    for (const label of Object.values(CAPTURE_STATE_LABELS)) {
      expect(label).not.toMatch(/\d/);
      expect(label).not.toContain("%");
      expect(label).not.toMatch(/\bde\s+\d/);
    }
  });

  it("os quatro estados são exatamente os aprovados", () => {
    expect(Object.values(CAPTURE_STATE_LABELS)).toEqual([
      "Ainda não registrado",
      "Em preenchimento",
      "Registrado",
      "Atualizado hoje",
    ]);
  });

  it("vazio é 'ainda não registrado' — ausência, nunca falha (P16)", () => {
    expect(deriveCaptureState(0, 5)).toBe("AINDA_NAO_REGISTRADO");
    expect(captureStateLabel(0, 5)).toBe("Ainda não registrado");
  });

  it("começou mas não passou por todas: em preenchimento", () => {
    expect(deriveCaptureState(2, 5, "2026-07-01T10:00:00.000Z", new Date("2026-07-25T10:00:00Z"))).toBe(
      "EM_PREENCHIMENTO",
    );
  });

  it("passou por todas: registrado — sem 'completo' nem '5 de 5'", () => {
    expect(deriveCaptureState(5, 5, "2026-07-01T10:00:00.000Z", new Date("2026-07-25T10:00:00Z"))).toBe(
      "REGISTRADO",
    );
  });

  it("mexeu hoje tem precedência — o que importa é a recência, não a contagem", () => {
    const agora = new Date("2026-07-25T18:00:00");
    expect(deriveCaptureState(1, 5, "2026-07-25T09:00:00", agora)).toBe("ATUALIZADO_HOJE");
    expect(deriveCaptureState(5, 5, "2026-07-25T09:00:00", agora)).toBe("ATUALIZADO_HOJE");
  });

  it("data inválida não quebra a tela — degrada para o estado por contagem", () => {
    expect(deriveCaptureState(5, 5, "não é data")).toBe("REGISTRADO");
    expect(deriveCaptureState(1, 5, null)).toBe("EM_PREENCHIMENTO");
  });
});

describe("guard de conteúdo — detecta, explica, nunca reescreve", () => {
  it("texto legítimo sobre o próprio jeito de atender passa inteiro", () => {
    const texto =
      "Costumo desenhar o exame junto com o paciente e mando um resumo por escrito depois da consulta.";
    expect(inspectDeclaredText(texto)).toEqual([]);
  });

  it("autopromoção é sinalizada", () => {
    const issues = inspectDeclaredText("Sou o melhor cardiologista da região.");
    expect(issues.map((i) => i.code)).toContain("AUTOPROMOCAO");
  });

  it("promessa de resultado é sinalizada", () => {
    const issues = inspectDeclaredText("Garanto a cura em três meses, sem riscos.");
    expect(issues.map((i) => i.code)).toContain("PROMESSA_RESULTADO");
  });

  it("comparação com colegas é sinalizada", () => {
    const issues = inspectDeclaredText("Atendo diferente dos outros médicos daqui.");
    expect(issues.map((i) => i.code)).toContain("COMPARACAO");
  });

  it("dado que identifica paciente é sinalizado", () => {
    const issues = inspectDeclaredText("Tratei uma paciente de 62 anos com o mesmo quadro.");
    expect(issues.map((i) => i.code)).toContain("DADO_DE_PACIENTE");
  });

  it("devolve o trecho exato para a pessoa se localizar no próprio texto", () => {
    const issues = inspectDeclaredText("Aqui você tem resultado garantido.");
    expect(issues[0]?.excerpt.length).toBeGreaterThan(0);
    expect("Aqui você tem resultado garantido.").toContain(issues[0]!.excerpt);
  });

  it("a mensagem orienta sem repreender — nada de 'proibido' ou 'você não pode'", () => {
    const todas = [
      ...inspectDeclaredText("Sou o melhor da região."),
      ...inspectDeclaredText("Garanto o resultado."),
      ...inspectDeclaredText("Diferente dos outros colegas."),
      ...inspectDeclaredText("Atendi uma paciente de 40 anos."),
    ];
    expect(todas.length).toBeGreaterThan(0);
    for (const issue of todas) {
      const m = issue.message.toLowerCase();
      for (const duro of ["proibido", "você não pode", "inadequado", "violação", "erro"]) {
        expect(m, `mensagem repreensiva: ${issue.code}`).not.toContain(duro);
      }
      expect(issue.message.length).toBeGreaterThan(30);
    }
  });

  it("NUNCA altera o texto — a função só lê", () => {
    const original = "Sou o melhor e garanto a cura.";
    const copia = String(original);
    inspectDeclaredText(original);
    expect(original).toBe(copia);
  });
});

describe("verbatim do paciente nunca vira dado sobre profissional (§1.4)", () => {
  it("o contrato declara escopo de Case e nega toda derivação", () => {
    expect(VERBATIM_CONTRACT.scope).toBe("CASE");
    expect(VERBATIM_CONTRACT.createsProfessionalEntity).toBe(false);
    expect(VERBATIM_CONTRACT.producesAttribute).toBe(false);
    expect(VERBATIM_CONTRACT.feedsRanking).toBe(false);
  });

  it("o guard de conteúdo não roda sobre a fala do paciente — ela não se corrige", () => {
    // A fala do paciente é preservada como foi dita (P4). Se ele reclamar de
    // um atendimento anterior, isso é a Evidência de Curadoria — não conteúdo
    // a ser moderado. O guard existe só para o campo livre do profissional.
    const fala = "O médico anterior era o melhor da cidade e mesmo assim não me ouviu.";
    // Nada no caminho de gravação do verbatim chama inspectDeclaredText —
    // este teste documenta a fronteira; o teste de action prova a execução.
    expect(inspectDeclaredText(fala).length).toBeGreaterThan(0);
    expect(VERBATIM_CONTRACT.producesAttribute).toBe(false);
  });
});
