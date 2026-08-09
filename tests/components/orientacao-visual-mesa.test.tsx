import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { readFileSync } from "node:fs";

import { ComparacaoPremium } from "@/components/curadoria/mesa/comparacao-premium";
import { LeituraRelacionalPanel } from "@/components/curadoria/mesa/leitura-relacional-panel";
import { MesaSteps } from "@/components/curadoria/mesa/mesa-steps";
import { PainelDeJuizo, type ConceitoDeJuizo } from "@/components/curadoria/mesa/painel-de-juizo";
import {
  MARCA_DA_ETAPA,
  MARCA_DO_AGUARDO,
  MARCA_DE_AGUARDA_JUIZO,
  MARCA_DO_DESFECHO,
  PAPEL_DA_AUSENCIA_DE_DECLARACAO,
  classeDoPapel,
  papelDaLacuna,
} from "@/components/curadoria/mesa/gramatica-de-estados";
import {
  SUBCRITERION_STATUSES,
  type SubcriterionStatus,
} from "@/modules/curadoria/mapa-profissional";
import { COMPATIBILITY_LABELS } from "@/modules/curadoria/motor-compatibilidade";
import {
  RELATIONAL_CONCEPTS,
  crossRelational,
  relationalSummary,
  relationalSummarySentence,
  type RelationalEvidence,
  type RelationalNeed,
} from "@/modules/curadoria/motor-relacional";
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
    // A cor de atenção é declarada UMA vez, no mapa de papel — nunca dentro
    // da taxonomia de forma. Quem a recebe são os estados operacionais
    // (`juizo` desde a R-2, `lacuna` desde S-1), nunca a leitura de evidência.
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

  /**
   * S-2 · o T-3 relacional que existia aqui foi REMOVIDO, não relaxado.
   *
   * Ele afirmava que a lacuna relacional deveria ser `neutro` — premissa
   * formalmente corrigida pelo `02 ARQUITETO` (S-1) — e provava isso por
   * recorte de texto, que passaria com recorte vazio e sobreviveu a uma
   * mutação do comportamento real. O substituto está no bloco S-1 abaixo:
   * renderiza o painel com leituras produzidas pelo motor de verdade e olha
   * o papel resultante.
   */
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

/**
 * S-1 · A LACUNA RELACIONAL É "NINGUÉM DECLAROU".
 *
 * O oráculo não olha o código-fonte: monta leituras com o **motor de
 * verdade** (`crossRelational` sobre o Catálogo real), renderiza o painel e
 * observa o papel que cada leitura recebeu.
 *
 * Como o papel é verificado sem citar nenhuma cor: `juizo` já foi certificado
 * como `atencao` na Rodada 1, e vem de outra constante central
 * (`MARCA_DE_AGUARDA_JUIZO`). Se a lacuna é atenção, ela tem de coincidir com
 * o juízo **na parte de papel** — e divergir dele na parte de forma. É uma
 * comparação entre dois elementos renderizados, não uma asserção sobre CSS.
 */
describe("S-1 · lacuna relacional ⇒ atenção (oráculo comportamental)", () => {
  const AUTOMATICOS = RELATIONAL_CONCEPTS.filter((c) => c.cruzamento === "automatico");
  const HUMANOS = RELATIONAL_CONCEPTS.filter((c) => c.cruzamento === "humano");

  /** Uma opção da pessoa que o Catálogo real sabe satisfazer — nada inventado. */
  function opcaoReal(conceito: (typeof RELATIONAL_CONCEPTS)[number]) {
    const campo = conceito.paciente.find((c) => c.field === "principal");
    const opcao = (campo?.options ?? []).find(
      (o) => o.active && o.satisfiedBy !== null && !o.satisfiedBy.includes("*"),
    );
    if (!opcao) throw new Error(`Catálogo sem opção utilizável em ${conceito.code}`);
    return opcao as typeof opcao & { satisfiedBy: readonly string[] };
  }

  function coluna(
    id: string,
    nome: string,
    needs: RelationalNeed[],
    evidencias: RelationalEvidence[],
  ) {
    const { readings, notAnsweredByPerson } = crossRelational(
      needs,
      new Map(evidencias.map((e) => [e.subcriterionCode, e])),
    );
    const summary = relationalSummary(readings);
    return {
      professionalProfileId: id,
      nome,
      readings,
      notAnsweredByPerson,
      summary,
      summarySentence: relationalSummarySentence(summary),
    };
  }

  /**
   * Uma Mesa com as cinco leituras vivas ao mesmo tempo — todas saídas do
   * motor, nenhuma escrita à mão:
   *
   *   coluna A · ninguém declarou nada → LACUNA (xN) e AGUARDA JUÍZO
   *   coluna B · declarou              → ALTA, MÉDIA e NÃO RELEVANTE
   */
  function montarPainel() {
    const semDeclaracao = coluna(
      "prof-sem",
      "Profissional sem declaração",
      [
        ...AUTOMATICOS.map((c) => ({
          subcriterionCode: c.code,
          options: [opcaoReal(c).value],
          degree: "ESSENCIAL" as const,
        })),
        { subcriterionCode: HUMANOS[0]!.code, options: [], degree: "ESSENCIAL" as const },
      ],
      [], // ← nenhuma evidência vigente: é exatamente o caso de S-1
    );

    const alta = opcaoReal(AUTOMATICOS[0]!);
    const comDeclaracao = coluna(
      "prof-com",
      "Profissional com declaração",
      [
        { subcriterionCode: AUTOMATICOS[0]!.code, options: [alta.value], degree: "ESSENCIAL" },
        {
          subcriterionCode: AUTOMATICOS[1]!.code,
          options: [opcaoReal(AUTOMATICOS[1]!).value],
          degree: "ESSENCIAL",
        },
        {
          subcriterionCode: AUTOMATICOS[2]!.code,
          options: [opcaoReal(AUTOMATICOS[2]!).value],
          degree: "SEM_PREFERENCIA",
        },
      ],
      [
        // Conduta correspondente ⇒ CONFIRMADO ⇒ ALTA.
        { subcriterionCode: AUTOMATICOS[0]!.code, options: [alta.satisfiedBy[0]!] },
        // Declarou, mas nada que corresponda ⇒ NAO_CONFIRMADO ⇒ MÉDIA.
        { subcriterionCode: AUTOMATICOS[1]!.code, options: [] },
        // Sem preferência ⇒ NÃO RELEVANTE, qualquer que seja a conduta.
        { subcriterionCode: AUTOMATICOS[2]!.code, options: [] },
      ],
    );

    render(
      <LeituraRelacionalPanel
        colunas={[semDeclaracao, comDeclaracao]}
        relationalNeedsCount={semDeclaracao.readings.length + comDeclaracao.readings.length}
      />,
    );
  }

  const AGUARDA = "Aguarda juízo do Curador";
  /** Classes que toda leitura tem por ser um item da lista — não são papel. */
  const ESTRUTURA = new Set(["rounded-md", "bg-surface", "px-3", "py-2", "border-l-2"]);

  function itens(rotulo: string): HTMLElement[] {
    const todos = [
      ...document.querySelectorAll<HTMLElement>('[data-testid="leitura-relacional"] li'),
    ];
    return todos.filter((li) => (li.textContent ?? "").includes(rotulo));
  }

  const tokens = (el: HTMLElement) => new Set(el.className.split(/\s+/).filter(Boolean));

  /** O que dois elementos compartilham além da estrutura: o papel. */
  function papelComum(a: HTMLElement, b: HTMLElement): string[] {
    return [...tokens(a)].filter((t) => tokens(b).has(t) && !ESTRUTURA.has(t));
  }

  it("o cenário é real: o motor produziu as cinco leituras (anti-vacuidade §10)", () => {
    montarPainel();
    for (const rotulo of [
      COMPATIBILITY_LABELS.LACUNA_DE_INFORMACAO,
      COMPATIBILITY_LABELS.ALTA_COMPATIBILIDADE,
      COMPATIBILITY_LABELS.MEDIA_COMPATIBILIDADE,
      COMPATIBILITY_LABELS.NAO_RELEVANTE,
      AGUARDA,
    ]) {
      expect(
        itens(rotulo).length,
        `o motor não produziu nenhuma leitura "${rotulo}"`,
      ).toBeGreaterThan(0);
    }
  });

  it("S1-T1 · a lacuna relacional recebe o mesmo papel do estado já certificado como atenção", () => {
    // Pré-condição lida do CENTRO, não do DOM: os dois estados operacionais
    // desta superfície têm o mesmo papel, e ele é `atencao`.
    expect(PAPEL_DA_AUSENCIA_DE_DECLARACAO).toBe(MARCA_DE_AGUARDA_JUIZO.papel);
    expect(PAPEL_DA_AUSENCIA_DE_DECLARACAO).toBe("atencao");

    montarPainel();
    const lacunas = itens(COMPATIBILITY_LABELS.LACUNA_DE_INFORMACAO);
    const juizos = itens(AGUARDA);
    expect(lacunas.length).toBeGreaterThan(0);
    expect(juizos.length).toBeGreaterThan(0);

    // Então toda lacuna tem de coincidir com o juízo na parte de PAPEL.
    for (const lacuna of lacunas) {
      expect(
        papelComum(lacuna, juizos[0]!),
        "a lacuna relacional não recebeu o papel de atenção",
      ).not.toHaveLength(0);
    }
  });

  it("S1-T1b · e continua distinta dele na FORMA — o papel não apaga a leitura", () => {
    montarPainel();
    const lacuna = itens(COMPATIBILITY_LABELS.LACUNA_DE_INFORMACAO)[0]!;
    const juizo = itens(AGUARDA)[0]!;
    // Mesmo papel, formas diferentes: cada um tem token que o outro não tem.
    expect([...tokens(lacuna)].some((t) => !tokens(juizo).has(t))).toBe(true);
    expect([...tokens(juizo)].some((t) => !tokens(lacuna).has(t))).toBe(true);
    // E o texto continua ao lado — nenhuma distinção depende de cor sozinha.
    expect((lacuna.textContent ?? "").includes(COMPATIBILITY_LABELS.LACUNA_DE_INFORMACAO)).toBe(
      true,
    );
  });

  it("S1-T2 · leitura COM evidência NÃO recebe papel de estado (caso negativo)", () => {
    montarPainel();
    const juizo = itens(AGUARDA)[0]!;
    const comEvidencia: Array<[string, HTMLElement]> = [
      ["alta", itens(COMPATIBILITY_LABELS.ALTA_COMPATIBILIDADE)[0]!],
      ["média", itens(COMPATIBILITY_LABELS.MEDIA_COMPATIBILIDADE)[0]!],
      ["não relevante", itens(COMPATIBILITY_LABELS.NAO_RELEVANTE)[0]!],
    ];
    for (const [nome, el] of comEvidencia) {
      expect(el, `o motor não produziu a leitura "${nome}"`).toBeTruthy();
      // Com um estado operacional só pode coincidir na ESTRUTURA. Se passar a
      // compartilhar papel, alguém pintou tudo de âmbar.
      expect(
        papelComum(el, juizo),
        `a leitura "${nome}" passou a compartilhar papel com um estado operacional`,
      ).toHaveLength(0);
    }
  });

  it("S-2 · o painel consulta a decisão central, não uma regra própria", () => {
    // Companheiro estrutural do oráculo comportamental — com a guarda de
    // não-vacuidade que o §10 exige: o alvo existe e o recorte não é vazio.
    const fonte = readFileSync("src/components/curadoria/mesa/leitura-relacional-panel.tsx", "utf8");
    expect(fonte.length).toBeGreaterThan(0);
    const inicio = fonte.indexOf("const PAPEL_DO_TOM");
    expect(inicio, "PAPEL_DO_TOM desapareceu — o recorte seria vazio").toBeGreaterThan(-1);
    const mapa = fonte.slice(inicio, fonte.indexOf("}", inicio));
    expect(mapa).toContain("PAPEL_DA_AUSENCIA_DE_DECLARACAO");
    expect(mapa).toContain("MARCA_DE_AGUARDA_JUIZO");
    // E não redecide localmente o que o centro já decidiu.
    expect(/lacuna:\s*["']/.test(mapa), "o painel voltou a decidir o papel por conta própria").toBe(
      false,
    );
  });

  it("S3-T1 · `BORDA_DO_PAPEL.neutro` foi removido — e `neutro` segue vivo no centro", () => {
    const fonte = readFileSync("src/components/curadoria/mesa/leitura-relacional-panel.tsx", "utf8");
    const inicio = fonte.indexOf("const BORDA_DO_PAPEL");
    expect(inicio, "BORDA_DO_PAPEL desapareceu — o recorte seria vazio").toBeGreaterThan(-1);
    const mapa = fonte.slice(inicio, fonte.indexOf("};", inicio));
    expect(mapa).toContain("atencao:");
    expect(/\bneutro:/.test(mapa), "o ramo morto voltou").toBe(false);
    // O que saiu foi uma borda local sem consumidor, não o papel.
    expect(classeDoPapel("neutro")).toContain("neutro");
    expect(MARCA_DA_ETAPA.AGUARDA.papel).toBe("neutro");
  });
});
