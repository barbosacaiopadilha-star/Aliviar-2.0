import { readFileSync } from "node:fs";
import { join } from "node:path";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { montarCadeiaDeProveniencia } from "@/modules/curadoria/cadeia-de-proveniencia";
import {
  IMPORTANCE_LABELS,
  SUBCRITERION_CATALOG,
} from "@/modules/curadoria/mapa-prioridades";
import { NEED_DEGREE_LABELS, PERSON_QUESTIONS_BY_CODE } from "@/modules/curadoria/protocolos";

/**
 * ITEM 1.10B-P2 · ETAPA 2A — O MODELO DO RECONHECIMENTO.
 *
 * DT-37: toda capacidade operacional começa pelo modelo de dados. O que estes
 * testes protegem é a promessa que a Etapa 2B vai depender: a tela recebe tudo
 * pronto e **não volta ao banco**, não remonta cadeia e não decide o que é
 * dela e o que é técnico.
 */

const mocks = vi.hoisted(() => ({
  loadCaseNeeds: vi.fn(),
  loadCasePriorityMap: vi.fn(),
}));

vi.mock("@/modules/curadoria/protocolos-repository", () => ({
  loadCaseNeeds: mocks.loadCaseNeeds,
}));

vi.mock("@/modules/curadoria/mapa-prioridades-repository", () => ({
  loadCasePriorityMap: mocks.loadCasePriorityMap,
}));

const { loadModeloDoReconhecimento } = await import("@/modules/paciente/reconhecimento-model");

const CASE_ID = "11111111-1111-4111-8111-111111111111";

/** Um código real do Catálogo, com lado da pessoa. */
const COM_PESSOA = "MODELO_COMUNICACAO";
/** Outro, para provar que o modelo não colapsa tudo em uma linha só. */
const OUTRO_COM_PESSOA = "VIABILIDADE_CUSTO_E_PAGAMENTO";
/** Um código real do Catálogo **sem** lado da pessoa — julgado pelo Curador. */
const TECNICO = SUBCRITERION_CATALOG.map((entrada) => entrada.code).find(
  (code) => !PERSON_QUESTIONS_BY_CODE.has(code),
)!;

/**
 * Pré-condições do próprio teste. Sem elas, três oráculos abaixo passariam
 * vazios: comparar `undefined` com `undefined` prova nada, e foi assim que
 * F-01 e F-02 se tornaram tautológicos.
 */
describe("pré-condições do oráculo", () => {
  it("existe conceito técnico no Catálogo, e os rótulos comparados existem", () => {
    expect(TECNICO, "nenhum conceito sem lado da pessoa no Catálogo").toBeTruthy();
    expect(PERSON_QUESTIONS_BY_CODE.has(COM_PESSOA)).toBe(true);
    expect(PERSON_QUESTIONS_BY_CODE.has(OUTRO_COM_PESSOA)).toBe(true);
    expect(typeof NEED_DEGREE_LABELS.ESSENCIAL).toBe("string");
    expect(NEED_DEGREE_LABELS.ESSENCIAL.length).toBeGreaterThan(0);
    expect(typeof IMPORTANCE_LABELS.MUITO_IMPORTANTE).toBe("string");
    expect(IMPORTANCE_LABELS.MUITO_IMPORTANTE.length).toBeGreaterThan(0);
    // As duas escalas são deliberadamente disjuntas (`importancia-vs-grau`):
    // o grau é dela, a importância é do Curador. Trocar uma pela outra tem de
    // continuar sendo um erro visível, nunca um rótulo vazio.
    expect(Object.keys(IMPORTANCE_LABELS)).not.toContain("ESSENCIAL");
  });
});

function need(subcriterionCode: string, overrides: Record<string, unknown> = {}) {
  return {
    caseId: CASE_ID,
    subcriterionCode,
    options: ["explicacao_simples"],
    degree: "ESSENCIAL",
    flexibility: null,
    guidedText: null,
    origin: "DIRETO",
    proposedReading: null,
    acknowledgment: "PENDENTE",
    correction: null,
    declaredBy: "a pessoa",
    declaredAt: "2026-08-01T10:00:00.000Z",
    ...overrides,
  };
}

function item(subcriterionCode: string, overrides: Record<string, unknown> = {}) {
  return {
    subcriterionCode,
    importance: "MUITO_IMPORTANTE",
    declaredBy: "Curador",
    registradoEm: "2026-08-02T12:00:00.000Z",
    ...overrides,
  };
}

function darDados(needs: unknown[], items: unknown[]) {
  mocks.loadCaseNeeds.mockResolvedValue(needs);
  mocks.loadCasePriorityMap.mockResolvedValue({ items });
}

const SUPABASE = { marcador: "não deve ser usado diretamente" } as never;

beforeEach(() => {
  vi.clearAllMocks();
  darDados([], []);
});

describe("A1/A2 · o loader lê as duas fontes, e só lê", () => {
  it("consulta a declaração dela E o Mapa registrado, ambos pelo mesmo caso", async () => {
    await loadModeloDoReconhecimento(SUPABASE, CASE_ID);

    expect(mocks.loadCaseNeeds).toHaveBeenCalledWith(SUPABASE, CASE_ID);
    expect(mocks.loadCasePriorityMap).toHaveBeenCalledWith(SUPABASE, CASE_ID);
  });

  it("não escreve nada: o cliente só é repassado às leituras", async () => {
    const fonte = readFileSync(
      join(process.cwd(), "src/modules/paciente/reconhecimento-model.ts"),
      "utf8",
    );

    for (const escrita of ["insert(", "update(", "upsert(", "delete(", "rpc("]) {
      expect(fonte.includes(escrita), `o modelo do reconhecimento chama ${escrita}`).toBe(false);
    }
    // Nenhum acesso direto a tabela: as duas fontes têm repositório próprio.
    expect(fonte).not.toContain(".from(");
  });

  it("caso sem nada declarado e sem nada registrado devolve modelo vazio, não erro", async () => {
    const modelo = await loadModeloDoReconhecimento(SUPABASE, CASE_ID);

    expect(modelo).toEqual({ caseId: CASE_ID, linhas: [], tecnicos: [] });
  });
});

describe("A3 · a cadeia vem do Item 1.9, inteira", () => {
  it("a cadeia da linha é idêntica à que o montador puro produz para os mesmos dados", async () => {
    darDados([need(COM_PESSOA)], [item(COM_PESSOA)]);

    const [linha] = (await loadModeloDoReconhecimento(SUPABASE, CASE_ID)).linhas;

    expect(linha!.cadeia).toEqual(
      montarCadeiaDeProveniencia({
        subcriterionCode: COM_PESSOA,
        pessoa: {
          declaracao: {
            degree: "ESSENCIAL",
            options: ["explicacao_simples"],
            declaredBy: "a pessoa",
            declaredAt: "2026-08-01T10:00:00.000Z",
          },
          importancia: {
            importance: "MUITO_IMPORTANTE",
            declaredBy: "Curador",
            registradoEm: "2026-08-02T12:00:00.000Z",
          },
        },
        profissional: { estado: null },
      }),
    );
  });

  it("as lacunas exibidas são as que o montador nomeou — o modelo não as reescreve", async () => {
    darDados([need(COM_PESSOA)], [item(COM_PESSOA)]);

    const [linha] = (await loadModeloDoReconhecimento(SUPABASE, CASE_ID)).linhas;

    expect(linha!.cadeia.lacunas.length).toBeGreaterThan(0);
    expect(linha!.cadeia.completa).toBe(false);
  });

  it("não duplica a cadeia: o modelo não constrói elo, ramo nem lacuna por conta própria", async () => {
    const fonte = readFileSync(
      join(process.cwd(), "src/modules/paciente/reconhecimento-model.ts"),
      "utf8",
    );

    // Se qualquer um destes aparecer, alguém começou a remontar aqui o que o
    // Item 1.9 já monta — e as duas versões vão divergir em silêncio.
    for (const marca of [
      "DECLARACAO_ORIGINAL",
      "CONFIRMACAO",
      "LEITURA",
      "PROPOSTA",
      "ramos",
      "elos",
    ]) {
      expect(fonte.includes(marca), `o modelo remonta "${marca}" em vez de reusar o 1.9`).toBe(
        false,
      );
    }

    expect(fonte).toContain("montarCadeiaDeProveniencia");
  });
});

describe("A4 · nunca inventar profissional, nunca inventar evidência", () => {
  it("o ramo do profissional não afirma nada: nenhum elo presente", async () => {
    darDados([need(COM_PESSOA)], [item(COM_PESSOA)]);

    const [linha] = (await loadModeloDoReconhecimento(SUPABASE, CASE_ID)).linhas;
    const profissional = linha!.cadeia.ramos.find((ramo) => ramo.lado === "PROFISSIONAL")!;

    expect(profissional.elos.every((elo) => !elo.presente)).toBe(true);
    expect(profissional.completo).toBe(false);
    expect(profissional.elos.every((elo) => elo.autor === null)).toBe(true);
  });

  it("o ramo dela continua inteiro — ausência de profissional não apaga o que ela disse", async () => {
    darDados([need(COM_PESSOA)], [item(COM_PESSOA)]);

    const [linha] = (await loadModeloDoReconhecimento(SUPABASE, CASE_ID)).linhas;
    const pessoa = linha!.cadeia.ramos.find((ramo) => ramo.lado === "PESSOA")!;

    expect(pessoa.elos.some((elo) => elo.presente)).toBe(true);
  });

  it("autor ausente permanece ausente — o modelo não preenche quem registrou", async () => {
    darDados([need(COM_PESSOA)], [item(COM_PESSOA, { declaredBy: null, registradoEm: null })]);

    const [linha] = (await loadModeloDoReconhecimento(SUPABASE, CASE_ID)).linhas;

    expect(linha!.registro).not.toBeNull();
    expect(linha!.registro!.autor).toBeNull();
  });
});

describe("A5 · a separação acontece no modelo, não na tela", () => {
  it("conceito técnico vai para o terceiro bloco e nunca para as duas colunas", async () => {
    darDados([need(COM_PESSOA)], [item(COM_PESSOA), item(TECNICO)]);

    const modelo = await loadModeloDoReconhecimento(SUPABASE, CASE_ID);

    expect(modelo.linhas.map((linha) => linha.subcriterionCode)).toEqual([COM_PESSOA]);
    expect(modelo.tecnicos.map((tecnico) => tecnico.subcriterionCode)).toEqual([TECNICO]);
  });

  it("nenhum conceito aparece nos dois blocos ao mesmo tempo", async () => {
    const todos = SUBCRITERION_CATALOG.map((entrada) => entrada.code);
    darDados(
      todos.filter((code) => PERSON_QUESTIONS_BY_CODE.has(code)).map((code) => need(code)),
      todos.map((code) => item(code)),
    );

    const modelo = await loadModeloDoReconhecimento(SUPABASE, CASE_ID);
    const nasColunas = new Set(modelo.linhas.map((linha) => linha.subcriterionCode));
    const noBloco = modelo.tecnicos.map((tecnico) => tecnico.subcriterionCode);

    expect(noBloco.some((code) => nasColunas.has(code))).toBe(false);
    expect(nasColunas.size + noBloco.length).toBe(todos.length);
  });

  it("a régua da separação é ter pergunta a ela no Protocolo — não um rótulo colado à mão", async () => {
    const todos = SUBCRITERION_CATALOG.map((entrada) => entrada.code);
    darDados(
      todos.filter((code) => PERSON_QUESTIONS_BY_CODE.has(code)).map((code) => need(code)),
      todos.map((code) => item(code)),
    );

    const modelo = await loadModeloDoReconhecimento(SUPABASE, CASE_ID);

    for (const linha of modelo.linhas) {
      expect(PERSON_QUESTIONS_BY_CODE.has(linha.subcriterionCode), linha.subcriterionCode).toBe(
        true,
      );
    }
    for (const tecnico of modelo.tecnicos) {
      expect(
        PERSON_QUESTIONS_BY_CODE.has(tecnico.subcriterionCode),
        tecnico.subcriterionCode,
      ).toBe(false);
    }
  });

  it("técnico sem registro não é inventado — ausência não vira linha", async () => {
    darDados([], []);

    expect((await loadModeloDoReconhecimento(SUPABASE, CASE_ID)).tecnicos).toEqual([]);
  });
});

describe("A6 · a tela não poderá voltar ao banco", () => {
  it("cada linha traz rótulo humano, não o código do conceito", async () => {
    darDados([need(COM_PESSOA)], [item(COM_PESSOA), item(TECNICO)]);

    const modelo = await loadModeloDoReconhecimento(SUPABASE, CASE_ID);
    const esperado = SUBCRITERION_CATALOG.find((entrada) => entrada.code === COM_PESSOA)!.name;

    expect(modelo.linhas[0]!.label).toBe(esperado);
    expect(modelo.linhas[0]!.label).not.toBe(COM_PESSOA);
    expect(modelo.tecnicos[0]!.label).not.toBe(TECNICO);
  });

  it("grau e importância chegam humanizados, nunca o enum cru do banco", async () => {
    darDados([need(COM_PESSOA)], [item(COM_PESSOA)]);

    const [linha] = (await loadModeloDoReconhecimento(SUPABASE, CASE_ID)).linhas;

    expect(linha!.declaracao!.grau).toBe(NEED_DEGREE_LABELS.ESSENCIAL);
    expect(linha!.declaracao!.grau).not.toBe("ESSENCIAL");
    expect(linha!.registro!.importancia).toBe(IMPORTANCE_LABELS.MUITO_IMPORTANTE);
    expect(linha!.registro!.importancia).not.toBe("MUITO_IMPORTANTE");
  });

  it("as opções que ela escolheu e a data em que declarou vêm junto", async () => {
    darDados([need(COM_PESSOA, { options: ["a", "b"] })], [item(COM_PESSOA)]);

    const [linha] = (await loadModeloDoReconhecimento(SUPABASE, CASE_ID)).linhas;

    expect(linha!.declaracao!.opcoes).toEqual(["a", "b"]);
    expect(linha!.declaracao!.em).toBe("2026-08-01T10:00:00.000Z");
  });
});

describe("O universo é a união — a lacuna é o que o reconhecimento existe para mostrar", () => {
  it("declarado por ela e não registrado aparece, com o registro ausente", async () => {
    darDados([need(COM_PESSOA)], []);

    const [linha] = (await loadModeloDoReconhecimento(SUPABASE, CASE_ID)).linhas;

    expect(linha!.subcriterionCode).toBe(COM_PESSOA);
    expect(linha!.declaracao).not.toBeNull();
    expect(linha!.registro).toBeNull();
  });

  it("registrado sem ela ter declarado aparece, com a declaração ausente", async () => {
    darDados([], [item(COM_PESSOA)]);

    const [linha] = (await loadModeloDoReconhecimento(SUPABASE, CASE_ID)).linhas;

    expect(linha!.declaracao).toBeNull();
    expect(linha!.registro).not.toBeNull();
  });

  it("cada conceito rende uma linha só, mesmo estando nas duas fontes", async () => {
    darDados(
      [need(COM_PESSOA), need(OUTRO_COM_PESSOA)],
      [item(COM_PESSOA), item(OUTRO_COM_PESSOA)],
    );

    const codigos = (await loadModeloDoReconhecimento(SUPABASE, CASE_ID)).linhas.map(
      (linha) => linha.subcriterionCode,
    );

    expect(codigos).toEqual([...new Set(codigos)]);
    expect(codigos).toHaveLength(2);
  });
});

/**
 * ETAPA 2B — B2/B3: O QUE A TELA EXIBE VEM NO MESMO OBJETO.
 *
 * Sem estes campos a tela teria de caçar autoria e data dentro da cadeia para
 * montar uma frase — voltando a raciocinar sobre proveniência, que é
 * exatamente o que o modelo existe para evitar.
 */
describe("B2/B3 · proveniência entregue pronta, e ausência declarada", () => {
  it("a declaração dela carrega quem a registrou, além do grau e da data", async () => {
    darDados([need(COM_PESSOA)], [item(COM_PESSOA)]);

    const [linha] = (await loadModeloDoReconhecimento(SUPABASE, CASE_ID)).linhas;

    expect(linha!.declaracao!.autor).toBe("a pessoa");
    expect(linha!.declaracao!.em).toBe("2026-08-01T10:00:00.000Z");
  });

  it("o registro carrega autor E data — os dois, ou o que houver", async () => {
    darDados([need(COM_PESSOA)], [item(COM_PESSOA)]);

    const [linha] = (await loadModeloDoReconhecimento(SUPABASE, CASE_ID)).linhas;

    expect(linha!.registro!.autor).toBe("Curador");
    expect(linha!.registro!.registradoEm).toBe("2026-08-02T12:00:00.000Z");
  });

  it("o bloco técnico carrega procedência quando ela existe", async () => {
    darDados([], [item(TECNICO)]);

    const [tecnico] = (await loadModeloDoReconhecimento(SUPABASE, CASE_ID)).tecnicos;

    expect(tecnico!.autor).toBe("Curador");
    expect(tecnico!.registradoEm).toBe("2026-08-02T12:00:00.000Z");
  });

  it("procedência indisponível vira ausência declarada, nunca valor de enfeite", async () => {
    darDados([], [item(TECNICO, { declaredBy: null, registradoEm: null })]);

    const [tecnico] = (await loadModeloDoReconhecimento(SUPABASE, CASE_ID)).tecnicos;

    expect(tecnico!.autor).toBeNull();
    expect(tecnico!.registradoEm).toBeNull();
    // E o rótulo continua real: a ausência da autoria não apaga o conceito.
    expect(tecnico!.importancia.length).toBeGreaterThan(0);
  });

  it("B3 · o bloco técnico não ganha cadeia — não há lado dela para encadear", async () => {
    darDados([], [item(TECNICO)]);

    const [tecnico] = (await loadModeloDoReconhecimento(SUPABASE, CASE_ID)).tecnicos;

    expect(tecnico).not.toHaveProperty("cadeia");
  });
});
