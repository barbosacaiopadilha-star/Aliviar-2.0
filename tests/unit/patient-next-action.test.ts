import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { buildJornada } from "@/modules/curadoria/jornada";
import { MOCK_RECORDS } from "@/modules/curadoria/cos/mock-records";
import { lerEstado, type FatosDoCaso } from "@/foundation/contrato-de-estado";
import { derivePatientPending, patientStageHref } from "@/modules/paciente/next-action";

/**
 * As leituras vêm do CONTRATO, não de literais: se a Fundação mudar a
 * projeção de um estado, estes testes acompanham em vez de mentir.
 */
function leituraDe(estado: string) {
  const fatos: Record<string, FatosDoCaso> = {
    HISTORIA_NAO_INICIADA: { historia: { existe: false, enviadaEm: null }, caso: null, relatorio: null, pendencia: null },
    HISTORIA_EM_PREENCHIMENTO: { historia: { existe: true, enviadaEm: null }, caso: null, relatorio: null, pendencia: null },
    HISTORIA_ENVIADA: { historia: { existe: true, enviadaEm: "enviada" }, caso: null, relatorio: null, pendencia: null },
    CASO_EM_CURADORIA: { historia: { existe: true, enviadaEm: "enviada" }, caso: { curadorResponsavel: "c", encerradoEm: null, cancelado: false }, relatorio: null, pendencia: null },
  };
  const leitura = lerEstado(fatos[estado]!);
  if (leitura.estado !== estado) throw new Error(`fixture nao produz ${estado}, e sim ${leitura.estado}`);
  return leitura;
}


function jornadaDe(caseKey: string) {
  return buildJornada(MOCK_RECORDS[caseKey]!);
}

describe("toda pendência diz O QUE falta — nunca só que falta algo", () => {
  it("sem história: a pendência é a história, com o caminho até ela", () => {
    const pending = derivePatientPending({ leitura: leituraDe("HISTORIA_NAO_INICIADA"), jornada: null });
    expect(pending.kind).toBe("action");
    if (pending.kind !== "action") return;
    expect(pending.action.title).toContain("sua história");
    // A3a.1 · era `/sua-historia` — a fachada pública. A pendência só existe
    // para quem já está autenticada, e a saída para a página explicativa a
    // fazia deixar a casa para ler o que já sabe. `/continuar` é a entrada
    // autenticada do wizard, e cria a primeira história quando não há nenhuma.
    expect(pending.action.cta?.href).toBe("/sua-historia/continuar");
  });

  it("rascunho: leva para continuar de onde parou, não para o começo", () => {
    const pending = derivePatientPending({ leitura: leituraDe("HISTORIA_EM_PREENCHIMENTO"), jornada: null });
    if (pending.kind !== "action") throw new Error("esperava ação");
    expect(pending.action.cta?.href).toBe("/sua-historia/continuar");
  });

  it("nenhuma pendência usa a frase genérica que motivou esta correção", () => {
    const estados: { leitura: ReturnType<typeof leituraDe>; jornada: ReturnType<typeof buildJornada> | null }[] = [
      { leitura: leituraDe("HISTORIA_NAO_INICIADA"), jornada: null },
      { leitura: leituraDe("HISTORIA_EM_PREENCHIMENTO"), jornada: null },
      { leitura: leituraDe("HISTORIA_ENVIADA"), jornada: null },
      ...Object.keys(MOCK_RECORDS).map((key) => ({ leitura: leituraDe("CASO_EM_CURADORIA"), jornada: jornadaDe(key) })),
    ];

    for (const entrada of estados) {
      const pending = derivePatientPending(entrada);
      const texto =
        pending.kind === "action"
          ? `${pending.action.title} ${pending.action.why}`
          : pending.message;

      expect(texto.toLowerCase()).not.toContain("informação adicional");
      expect(texto.toLowerCase()).not.toContain("aguardando informação");
      expect(texto.toLowerCase()).not.toContain("pendência");
    }
  });
});

describe("toda pendência tem destino — ou declara que acontece na conversa", () => {
  it("nunca existe um terceiro caso: ou há link, ou o texto diz que é conversa", () => {
    for (const key of Object.keys(MOCK_RECORDS)) {
      const pending = derivePatientPending({ leitura: leituraDe("CASO_EM_CURADORIA"), jornada: jornadaDe(key) });
      if (pending.kind !== "action") continue;

      const { cta, happensInConversation, title } = pending.action;

      // A invariante, como XOR: ou tem destino, ou é conversa declarada.
      // Nunca os dois (o link contradiria a conversa), nunca nenhum (é o bug).
      expect(
        Boolean(cta) !== happensInConversation,
        `pendência ambígua — deveria ter destino OU ser conversa declarada: ${title}`,
      ).toBe(true);

      if (cta) {
        expect(cta.href.startsWith("/"), `link relativo esperado: ${cta.href}`).toBe(true);
        expect(cta.label.toLowerCase()).not.toBe("continuar");
      }
    }
  });

  it("validar o Perfil não ganha botão — o ato tem liturgia (Fundamentos §10)", () => {
    // Um caso cuja etapa aguardando é o Perfil de Prioridades.
    const jornada = Object.keys(MOCK_RECORDS)
      .map((key) => jornadaDe(key))
      .find((j) => j.stages.some((s) => s.id === "PERFIL_DE_PRIORIDADES" && s.status === "AGUARDANDO_VOCE"));

    expect(jornada, "nenhum mock cobre o Perfil aguardando o paciente").toBeDefined();
    const pending = derivePatientPending({ leitura: leituraDe("CASO_EM_CURADORIA"), jornada: jornada! });
    if (pending.kind !== "action") throw new Error("esperava ação");
    expect(pending.action.cta).toBeNull();
    expect(pending.action.title).toContain("prioridades");
  });

  it("escolher entre os três caminhos tem destino real", () => {
    const jornada = Object.keys(MOCK_RECORDS)
      .map((key) => jornadaDe(key))
      .find((j) => j.stages.some((s) => s.id === "ESCOLHA" && s.status === "AGUARDANDO_VOCE"));

    if (!jornada) return; // nenhum mock nesse ponto — nada a afirmar
    const pending = derivePatientPending({ leitura: leituraDe("CASO_EM_CURADORIA"), jornada });
    if (pending.kind !== "action") throw new Error("esperava ação");
    expect(pending.action.cta?.href).toBe("/paciente/curadoria");
  });
});

describe("quando nada depende dela, o silêncio é declarado", () => {
  it("diz com quem o caso está, e o que vem depois", () => {
    for (const key of Object.keys(MOCK_RECORDS)) {
      const pending = derivePatientPending({ leitura: leituraDe("CASO_EM_CURADORIA"), jornada: jornadaDe(key) });
      if (pending.kind !== "nothing") continue;
      expect(pending.message).toContain("Nada depende de você");
      expect(pending.whatHappensNext.length).toBeGreaterThan(10);
    }
  });

  it("história enviada sem Caso: nenhuma cobrança, e o que vem a seguir é dito", () => {
    const pending = derivePatientPending({
      leitura: leituraDe("HISTORIA_ENVIADA"),
      jornada: null,
    });
    expect(pending.kind).toBe("nothing");
    if (pending.kind !== "nothing") return;
    expect(pending.whatHappensNext).toContain("Curador");
  });
});

describe("o vocabulário do paciente continua protegido", () => {
  it("nenhuma pendência traz score, ranking, protocolo ou nome de fase interna", () => {
    const proibidos = ["score", "ranking", "protocolo", "curadoria técnica", "devolutiva", "filtro"];

    for (const key of Object.keys(MOCK_RECORDS)) {
      const pending = derivePatientPending({ leitura: leituraDe("CASO_EM_CURADORIA"), jornada: jornadaDe(key) });
      const texto = (
        pending.kind === "action"
          ? `${pending.action.title} ${pending.action.why} ${pending.action.whatHappensNext}`
          : `${pending.message} ${pending.whatHappensNext}`
      ).toLowerCase();

      for (const termo of proibidos) {
        expect(texto, `vocabulário interno vazou: ${termo}`).not.toContain(termo);
      }
    }
  });
});

describe("A3a.1 · a História, da Home, é sempre a entrada autenticada", () => {
  const PRIVADO = "/sua-historia/continuar";

  it("começar e retomar levam ao MESMO destino — o wizard dentro da casa", () => {
    const naoIniciada = derivePatientPending({
      leitura: leituraDe("HISTORIA_NAO_INICIADA"),
      jornada: null,
    });
    const emPreenchimento = derivePatientPending({
      leitura: leituraDe("HISTORIA_EM_PREENCHIMENTO"),
      jornada: null,
    });

    if (naoIniciada.kind !== "action" || emPreenchimento.kind !== "action") {
      throw new Error("esperava ação nos dois estados da História");
    }

    // O conflito que esta guarda existe para impedir: duas fontes mandando a
    // mesma paciente para lugares diferentes pelo mesmo ato.
    expect(naoIniciada.action.cta?.href).toBe(PRIVADO);
    expect(emPreenchimento.action.cta?.href).toBe(PRIVADO);
    expect(naoIniciada.action.cta?.href).toBe(emPreenchimento.action.cta?.href);
  });

  it("nenhuma pendência da Home despacha a paciente para a fachada pública", () => {
    const entradas = [
      { leitura: leituraDe("HISTORIA_NAO_INICIADA"), jornada: null },
      { leitura: leituraDe("HISTORIA_EM_PREENCHIMENTO"), jornada: null },
      { leitura: leituraDe("HISTORIA_ENVIADA"), jornada: null },
      ...Object.keys(MOCK_RECORDS).map((key) => ({
        leitura: leituraDe("CASO_EM_CURADORIA"),
        jornada: jornadaDe(key),
      })),
    ];

    for (const entrada of entradas) {
      const pending = derivePatientPending(entrada);
      if (pending.kind !== "action" || !pending.action.cta) continue;
      // Exato: `/sua-historia/continuar` é legítimo; a raiz sozinha não é.
      expect(
        pending.action.cta.href,
        `pendência autenticada apontando para a página pública: ${pending.action.title}`,
      ).not.toBe("/sua-historia");
    }
  });

  it("e a página pública continua existindo, pública e separada", () => {
    // A correção move a PACIENTE AUTENTICADA para dentro da casa. Ela não
    // transforma a fachada em rota privada — quem chega de fora continua
    // tendo uma página que explica o que é contar a própria história.
    const bruto = readFileSync("src/modules/auth/public-paths.ts", "utf8");
    const declarado = bruto.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");

    expect(declarado).toContain('"/sua-historia"');
    // E o passo autenticado segue fora da lista pública (contrato da A2C).
    expect(declarado).not.toContain('"/sua-historia/continuar"');
    expect(existsSync("src/app/(public)/sua-historia/page.tsx")).toBe(true);
  });
});

describe("a régua só vira link onde existe onde chegar", () => {
  it("etapas sem destino não fingem ter um", () => {
    expect(patientStageHref("PERFIL_DE_PRIORIDADES")).toBeUndefined();
    expect(patientStageHref("CURADORIA")).toBeUndefined();
    expect(patientStageHref("REUNIAO")).toBeUndefined();
  });

  it("etapas com destino apontam para uma rota do paciente", () => {
    expect(patientStageHref("CONSULTA_INICIAL")).toBe("/sua-historia");
    expect(patientStageHref("ESCOLHA")).toBe("/paciente/curadoria");
    expect(patientStageHref("DOSSIE")).toBe("/paciente/curadoria");
  });
});
