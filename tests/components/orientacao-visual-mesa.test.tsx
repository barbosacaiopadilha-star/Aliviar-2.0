import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ComparacaoPremium } from "@/components/curadoria/mesa/comparacao-premium";
import { MesaSteps } from "@/components/curadoria/mesa/mesa-steps";
import { PainelDeJuizo, type ConceitoDeJuizo } from "@/components/curadoria/mesa/painel-de-juizo";
import {
  MARCA_DA_ETAPA,
  MARCA_DO_AGUARDO,
  MARCA_DE_AGUARDA_JUIZO,
  MARCA_DO_DESFECHO,
  papelDaLacuna,
} from "@/components/curadoria/mesa/gramatica-de-estados";
import {
  SUBCRITERION_STATUSES,
  type SubcriterionStatus,
} from "@/modules/curadoria/mapa-profissional";
import type { MesaEtapaState } from "@/modules/curadoria/mesa-etapas";

/**
 * ORIENTAÇÃO VISUAL DA MESA — nível ESSENCIAL
 * (`AUDITORIA_UX_MESA_DE_CURADORIA` §13).
 *
 * E-1 · a pendência que só o leitor de tela recebia passa a ser vista.
 * E-2 · a cor ganha gramática: estrutura → atenção → resolução → impedimento.
 * E-3 · evidência não é pintada de verde/vermelho.
 *
 * Nada aqui testa domínio: nenhuma regra, contagem ou estado mudou.
 */

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/modules/curadoria/julgamento-actions", () => ({
  registrarJulgamentoAction: async () => ({ desfecho: "JUIZO_REGISTRADO", versaoId: "j-1" }),
  retirarJulgamentoAction: async () => ({ desfecho: "JUIZO_RETIRADO", versaoId: null }),
}));

afterEach(cleanup);

function etapa(
  id: MesaEtapaState["id"],
  status: MesaEtapaState["status"],
  pending: string | null,
  waitingOn: string | null = null,
): MesaEtapaState {
  return { id, label: id, question: `Pergunta de ${id}`, status, pending, waitingOn };
}

const ETAPAS: MesaEtapaState[] = [
  etapa("PERFIL", "PRONTA", null),
  etapa("REDE", "PENDENTE", "Declarar a área de 2 profissionais."),
  etapa("AVALIACAO", "AGUARDA", null, "Depende de haver ao menos um profissional elegível."),
];

function montarTrilha(atual: MesaEtapaState["id"], proxima: MesaEtapaState["id"]) {
  render(<MesaSteps etapas={ETAPAS} atual={atual} proxima={proxima} onSelecionar={vi.fn()} />);
}

describe("E-1 · a trilha mostra a pendência a quem enxerga", () => {
  it("a frase de `pending` da etapa ativa aparece VISUALMENTE, não só em sr-only", () => {
    montarTrilha("REDE", "REDE");
    const visiveis = screen.getAllByText("Declarar a área de 2 profissionais.");
    // Uma no `sr-only` do botão, outra no bloco visual abaixo da trilha.
    expect(visiveis.length).toBeGreaterThanOrEqual(1);
    const bloco = document.querySelector(".mesa-steps__pendencias");
    expect(bloco).toBeTruthy();
    expect(bloco?.textContent).toContain("Declarar a área de 2 profissionais.");
  });

  it("`waitingOn` aparece quando a etapa depende de outra", () => {
    montarTrilha("AVALIACAO", "AVALIACAO");
    const bloco = document.querySelector(".mesa-steps__pendencias");
    expect(bloco?.textContent).toContain("Depende de haver ao menos um profissional elegível.");
  });

  it("a próxima decisão também aparece, quando não é a etapa ativa", () => {
    montarTrilha("PERFIL", "REDE");
    const bloco = document.querySelector(".mesa-steps__pendencias");
    expect(bloco?.textContent).toContain("REDE");
    expect(bloco?.textContent).toContain("Declarar a área de 2 profissionais.");
  });

  it("no máximo DUAS linhas — revelar as seis recriaria o muro de texto", () => {
    montarTrilha("PERFIL", "REDE");
    expect(document.querySelectorAll(".mesa-steps__pendencia").length).toBeLessThanOrEqual(2);
  });

  it("etapa sem pendência não produz ruído — o bloco simplesmente não existe", () => {
    montarTrilha("PERFIL", "PERFIL");
    expect(document.querySelector(".mesa-steps__pendencias")).toBeNull();
  });

  it("nada é duplicado para o leitor de tela: o bloco visual é aria-hidden", () => {
    montarTrilha("REDE", "REDE");
    expect(document.querySelector(".mesa-steps__pendencias")?.getAttribute("aria-hidden")).toBe(
      "true",
    );
  });

  it("o `sr-only` da trilha PERMANECE — E-1 acrescenta ao vidente, não remove do leitor", () => {
    montarTrilha("REDE", "REDE");
    const srOnly = [...document.querySelectorAll(".sr-only")].map((n) => n.textContent ?? "");
    expect(srOnly.some((t) => t.includes("aguarda você"))).toBe(true);
    expect(srOnly.some((t) => t.includes("Declarar a área de 2 profissionais."))).toBe(true);
    expect(srOnly.some((t) => t.includes("depende de outra etapa"))).toBe(true);
  });

  it("o teclado e o foco seguem intactos: cada etapa continua um botão", () => {
    montarTrilha("REDE", "REDE");
    expect(screen.getAllByRole("button")).toHaveLength(ETAPAS.length);
    expect(screen.getByRole("navigation", { name: "Etapas da Curadoria Técnica" })).toBeTruthy();
  });
});

describe("E-2 · a gramática de estados", () => {
  it("cada estado tem cor E sinal — a interface sobrevive em escala de cinza", () => {
    for (const marca of [
      ...Object.values(MARCA_DA_ETAPA),
      ...Object.values(MARCA_DO_AGUARDO),
      ...Object.values(MARCA_DO_DESFECHO),
    ]) {
      expect(marca.sinal.length).toBeGreaterThan(0);
      expect(marca.papel.length).toBeGreaterThan(0);
    }
  });

  it("a trilha deixa de ter uma cor só: respondida é resolvida, pendente é atenção", () => {
    expect(MARCA_DA_ETAPA.PRONTA.papel).toBe("resolvido");
    expect(MARCA_DA_ETAPA.PENDENTE.papel).toBe("atencao");
    // AGUARDA é "ainda não é a vez" — nunca bloqueio, nunca impedimento.
    expect(MARCA_DA_ETAPA.AGUARDA.papel).toBe("neutro");

    montarTrilha("REDE", "REDE");
    const marcas = [...document.querySelectorAll(".mesa-step__marca")].map((n) => n.className);
    expect(marcas[0]).toContain("mesa-estado--resolvido");
    expect(marcas[1]).toContain("mesa-estado--atencao");
    expect(marcas[2]).toContain("mesa-estado--neutro");
  });

  it("`VERSAO_JA_GRAVADA` é SUCESSO idempotente — jamais tratado como erro", () => {
    expect(MARCA_DO_DESFECHO.VERSAO_JA_GRAVADA.papel).not.toBe("impedimento");
    expect(MARCA_DO_DESFECHO.VERSAO_JA_GRAVADA.papel).toBe("neutro");
    expect(MARCA_DO_DESFECHO.VERSAO_JA_GRAVADA.sinal).toBe("=");
  });

  it("`JUIZO_SUPERADO_POR_EVIDENCIA` é atualidade — jamais falha", () => {
    expect(MARCA_DO_AGUARDO.JUIZO_SUPERADO_POR_EVIDENCIA.papel).toBe("atencao");
    expect(MARCA_DO_AGUARDO.JUIZO_SUPERADO_POR_EVIDENCIA.papel).not.toBe("impedimento");
  });

  it("conflito, ausência de autoridade e erro técnico são impedimento", () => {
    expect(MARCA_DO_DESFECHO.CONFLITO_DE_VERSAO.papel).toBe("impedimento");
    expect(MARCA_DO_DESFECHO.SEM_AUTORIDADE.papel).toBe("impedimento");
    expect(MARCA_DO_DESFECHO.ERRO_TECNICO.papel).toBe("impedimento");
  });

  it("sucesso não recebe tratamento de erro", () => {
    expect(MARCA_DO_DESFECHO.JUIZO_REGISTRADO.papel).toBe("resolvido");
    expect(MARCA_DO_DESFECHO.JUIZO_REGISTRADO.papel).not.toBe("impedimento");
  });

  it("retirar um juízo devolve o conceito à atenção — não é perda nem falha", () => {
    expect(MARCA_DO_DESFECHO.JUIZO_RETIRADO.papel).toBe("atencao");
    expect(MARCA_DO_AGUARDO.JUIZO_RETIRADO.papel).toBe("atencao");
  });

  it("o aguardo do conceito recebe âmbar e sinal, sem virar erro", () => {
    const conceito: ConceitoDeJuizo = {
      code: "FORMACAO",
      label: "Formação Profissional",
      natureza: "TECNICO",
      lacuna: "JUIZO_SUPERADO_POR_EVIDENCIA",
      vigente: null,
      historico: [],
      evidenciasCorrentes: [],
      versaoBaseId: null,
    };
    render(
      <PainelDeJuizo
        caseId="case-1"
        profissionais={[
          { professionalProfileId: "prof-1", nome: "Dra. Exemplo", conceitos: [conceito] },
        ]}
      />,
    );
    const aguardo = screen.getByTestId("aguardo-FORMACAO");
    // O texto original de MOTIVO_DO_AGUARDO permanece intacto.
    expect(aguardo.textContent).toContain("Evidência nova superou o juízo anterior");
    expect(aguardo.innerHTML).toContain("mesa-estado--atencao");
    expect(aguardo.innerHTML).not.toContain("mesa-estado--impedimento");
  });
});

describe("E-3 · evidência sem código verde/vermelho", () => {
  const arquivos = [
    "src/components/curadoria/mesa/leitura-relacional-panel.tsx",
    "src/components/curadoria/mesa/evidencia-chips.tsx",
  ];

  it("nenhuma leitura de evidência é pintada de verde ou vermelho", async () => {
    const { readFileSync } = await import("node:fs");
    for (const arquivo of arquivos) {
      const fonte = readFileSync(arquivo, "utf8");
      for (const proibido of [
        "emerald",
        "green",
        "text-red",
        "bg-red",
        "border-red",
        "rose-",
        "color-success",
        "color-error",
      ]) {
        expect(fonte.includes(proibido), `${arquivo} codifica evidência com ${proibido}`).toBe(
          false,
        );
      }
    }
  });

  it("as leituras continuam distintas — por forma, não por cor", async () => {
    const { readFileSync } = await import("node:fs");
    const fonte = readFileSync(arquivos[0], "utf8");
    // Sólida, pontilhada, tracejada, apagada, dupla: cinco formas distintas.
    for (const forma of ["border-dotted", "border-dashed", "border-double"]) {
      expect(fonte.includes(forma), `perdeu a distinção por forma: ${forma}`).toBe(true);
    }
  });

  it("âmbar só onde falta ATO HUMANO — nunca em leitura de evidência", async () => {
    const { readFileSync } = await import("node:fs");
    const fonte = readFileSync(arquivos[0], "utf8");
    const tons = fonte.slice(fonte.indexOf("const TOM_CLASSES"), fonte.indexOf("export function"));
    // `juizo` (aguarda o Curador) é o único com a cor de atenção.
    expect(tons.match(/color-attention/g) ?? []).toHaveLength(1);
    expect(tons.slice(tons.indexOf("juizo:"))).toContain("color-attention");
  });
});

describe("R-1 · `LACUNA_DE_INFORMACAO` não tem um papel só", () => {
  it("T-1 · sem registro (`status` null) — ninguém olhou ainda ⇒ atenção", () => {
    expect(papelDaLacuna(null)).toBe("atencao");
  });

  it("T-2 · `NAO_INFORMADO` — olharam e não havia ⇒ neutro", () => {
    expect(papelDaLacuna("NAO_INFORMADO")).toBe("neutro");
  });

  it("os dois casos são REALMENTE distintos — senão a correção seria decorativa", () => {
    expect(papelDaLacuna(null)).not.toBe(papelDaLacuna("NAO_INFORMADO"));
  });

  it("T-6 · nenhum estado formal novo: a função só lê `status`, que já existia", () => {
    // Os únicos valores que o domínio produz — nenhum inventado aqui.
    for (const status of [...SUBCRITERION_STATUSES, null]) {
      expect(["atencao", "neutro"]).toContain(papelDaLacuna(status));
    }
  });
});

describe("R-1 · consistência entre superfícies (regressão do §15)", () => {
  /**
   * A regressão que este bloco impede é a que aconteceu: a MESMA regra
   * decidida em dois lugares divergiu — a comparação pintava âmbar em toda
   * lacuna, a leitura relacional pintava neutro em toda lacuna.
   *
   * A guarda é semântica: nenhuma superfície pode decidir o papel de uma
   * lacuna por conta própria. Todas consultam a fonte única.
   */
  const SUPERFICIES = [
    "src/components/curadoria/mesa/comparacao-premium.tsx",
    "src/components/curadoria/mesa/painel-investigacao.tsx",
    "src/components/curadoria/mesa/leitura-relacional-panel.tsx",
  ];

  it("T-3 · toda superfície que decide papel de lacuna consulta a fonte única", async () => {
    const { readFileSync } = await import("node:fs");
    for (const arquivo of SUPERFICIES.slice(0, 2)) {
      const fonte = readFileSync(arquivo, "utf8");
      expect(fonte.includes("papelDaLacuna"), `${arquivo} não consulta a fonte única`).toBe(true);
      // E não reimplementa a decisão localmente.
      expect(
        /status\s*===\s*null\s*\?\s*["']atencao/.test(fonte),
        `${arquivo} reimplementa a regra de R-1`,
      ).toBe(false);
    }
  });

  it("T-3 · a leitura relacional é coerente por construção do domínio", async () => {
    const { readFileSync } = await import("node:fs");
    const motor = readFileSync("src/modules/curadoria/motor-relacional.ts", "utf8");
    // `deriveRelationalState` funde ausência de evidência em NAO_INFORMADO:
    // naquele motor toda lacuna é o CASO B, e neutro é a leitura correta.
    expect(motor).toContain('state: "NAO_INFORMADO"');
    expect(papelDaLacuna("NAO_INFORMADO")).toBe("neutro");

    const painel = readFileSync(SUPERFICIES[2], "utf8");
    const tons = painel.slice(painel.indexOf("const TOM_CLASSES"), painel.indexOf("BORDA_DO_PAPEL"));
    // A lacuna relacional não gasta âmbar — coerente com o papel `neutro`.
    expect(tons.includes("color-attention")).toBe(false);
  });
});

describe("R-2 · estado é central; forma da evidência é local", () => {
  it("T-5 · `juizo` consome a decisão central, sem regra paralela", async () => {
    const { readFileSync } = await import("node:fs");
    const painel = readFileSync(
      "src/components/curadoria/mesa/leitura-relacional-panel.tsx",
      "utf8",
    );
    expect(painel).toContain("MARCA_DE_AGUARDA_JUIZO");
    // A entrada local de `juizo` guarda só a FORMA — nenhuma cor decidida ali.
    const tons = painel.slice(painel.indexOf("const TOM_CLASSES"), painel.indexOf("BORDA_DO_PAPEL"));
    expect(tons).toContain("juizo:");
    expect(tons.slice(tons.indexOf("juizo:")).includes("color-attention")).toBe(false);
    // E é o mesmo estado operacional do conceito sem juízo — uma definição só.
    expect(MARCA_DE_AGUARDA_JUIZO).toBe(MARCA_DO_AGUARDO.SEM_JUIZO);
    expect(MARCA_DE_AGUARDA_JUIZO.papel).toBe("atencao");
  });

  it("T-4 · `alta` e `media` seguem locais, distintas por forma, sem verde/âmbar", async () => {
    const { readFileSync } = await import("node:fs");
    const painel = readFileSync(
      "src/components/curadoria/mesa/leitura-relacional-panel.tsx",
      "utf8",
    );
    const tons = painel.slice(painel.indexOf("const TOM_CLASSES"), painel.indexOf("BORDA_DO_PAPEL"));
    for (const leitura of ["alta:", "media:", "lacuna:", "neutra:"]) {
      expect(tons, `a taxonomia de forma perdeu ${leitura}`).toContain(leitura);
    }
    // Nem verde, nem âmbar interpretando conteúdo de evidência.
    for (const proibido of ["emerald", "green", "amber", "color-attention"]) {
      expect(
        tons.slice(0, tons.indexOf("juizo:")).includes(proibido),
        `leitura de evidência voltou a usar ${proibido}`,
      ).toBe(false);
    }
    // A distinção continua sendo o traço.
    expect(tons).toContain("border-dotted");
    expect(tons).toContain("border-dashed");
  });

  it("§16 · a gramática central NÃO absorveu taxonomia de evidência", async () => {
    const { readFileSync } = await import("node:fs");
    const gramatica = readFileSync(
      "src/components/curadoria/mesa/gramatica-de-estados.ts",
      "utf8",
    );
    // Ela decide ESTADO. Não conhece borda, opacidade nem classe de leitura.
    // Limite de palavra de propósito: "falta ato humano" contém `alta`, e a
    // prosa que EXPLICA o estado não pode derrubar a guarda do mecanismo.
    for (const proibido of [
      /border-/,
      /\bdotted\b/,
      /\bdashed\b/,
      /\bdouble\b/,
      /\bopacity\b/,
      /\balta\b/,
      /\bmedia\b/,
      /ALTA_COMPATIBILIDADE/,
      /MEDIA_COMPATIBILIDADE/,
      /TOM_CLASSES/,
    ]) {
      expect(
        proibido.test(gramatica),
        `a gramática passou a conhecer taxonomia de evidência: ${proibido}`,
      ).toBe(false);
    }
    // O vocabulário central continua sendo o de estados.
    for (const papel of ["estrutura", "resolvido", "atencao", "impedimento", "neutro"]) {
      expect(gramatica).toContain(papel);
    }
  });

  it("T-7 · `DESFECHO_LEGIVEL` permanece intacto", async () => {
    const { readFileSync } = await import("node:fs");
    const painel = readFileSync("src/components/curadoria/mesa/painel-de-juizo.tsx", "utf8");
    for (const rotulo of [
      'JUIZO_REGISTRADO: "Juízo registrado."',
      'VERSAO_JA_GRAVADA: "Este juízo já estava gravado — nada foi duplicado."',
      'SEM_AUTORIDADE: "Você não tem autoridade para este ato."',
    ]) {
      expect(painel, `DESFECHO_LEGIVEL alterado: ${rotulo}`).toContain(rotulo);
    }
  });
});

describe("R-1 · a comparação premium deixa de gastar âmbar em tudo", () => {
  function celula(code: string, status: SubcriterionStatus | null) {
    return {
      subcriterionCode: code,
      label: code,
      importance: "MUITO_IMPORTANTE" as const,
      status,
      result: "LACUNA_DE_INFORMACAO" as const,
      stateSentence: "—",
    };
  }

  function montarComparacao() {
    render(
      <ComparacaoPremium
        colunas={[
          {
            id: "prof-1",
            nome: "Dra. Exemplo",
            resumo: "2 lacunas",
            celulas: [celula("NUNCA_OLHADO", null), celula("JA_ANALISADO", "NAO_INFORMADO")],
          },
        ]}
      />,
    );
  }

  it("mesma lacuna, `status` diferente ⇒ papéis visuais DIFERENTES", () => {
    montarComparacao();
    const celulas = [...document.querySelectorAll(".mesa-celula--insuficiente")];
    expect(celulas).toHaveLength(2);
    expect(celulas[0]!.className).toContain("mesa-celula--lacuna-atencao");
    expect(celulas[1]!.className).toContain("mesa-celula--lacuna-neutro");
  });

  it("a FORMA continua dizendo 'lacuna' nas duas — só a cor separa o ato pendente", () => {
    montarComparacao();
    const celulas = [...document.querySelectorAll(".mesa-celula--insuficiente")];
    // As duas seguem tracejadas: a lacuna não desaparece por ter sido olhada.
    expect(celulas.every((n) => n.className.includes("mesa-celula--insuficiente"))).toBe(true);
    // E nenhuma depende só de cor — o rótulo textual do estado continua lá.
    expect(celulas.every((n) => (n.textContent ?? "").trim().length > 0)).toBe(true);
  });

  it("T-3 · o papel de cada caso bate com o que a fonte única decide", () => {
    montarComparacao();
    const celulas = [...document.querySelectorAll(".mesa-celula--insuficiente")];
    expect(celulas[0]!.className).toContain(`mesa-celula--lacuna-${papelDaLacuna(null)}`);
    expect(celulas[1]!.className).toContain(
      `mesa-celula--lacuna-${papelDaLacuna("NAO_INFORMADO")}`,
    );
  });
});
