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
    // MR-01: as opções chegam TRADUZIDAS. O teste usava códigos inventados
    // ("a", "b") e afirmava o repasse cru — afirmava o defeito DEF-2.
    const codigos = Object.keys(PERSON_QUESTIONS_BY_CODE.get(COM_PESSOA)!.options).slice(0, 2);
    expect(codigos.length, "o conceito de teste perdeu suas opções").toBe(2);

    darDados([need(COM_PESSOA, { options: codigos })], [item(COM_PESSOA)]);

    const [linha] = (await loadModeloDoReconhecimento(SUPABASE, CASE_ID)).linhas;

    expect(linha!.declaracao!.opcoes).toEqual(
      codigos.map((codigo) => PERSON_QUESTIONS_BY_CODE.get(COM_PESSOA)!.options[codigo]),
    );
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

    const [linha] = (await loadModeloDoReconhecimento(SUPABASE, CASE_ID, "a pessoa")).linhas;

    expect(linha!.declaracao!.autor).toBe("a pessoa");
    expect(linha!.declaracao!.em).toBe("2026-08-01T10:00:00.000Z");
  });

  it("o registro carrega autor E data — os dois, ou o que houver", async () => {
    darDados([need(COM_PESSOA)], [item(COM_PESSOA)]);

    const [linha] = (await loadModeloDoReconhecimento(SUPABASE, CASE_ID, "Curador")).linhas;

    expect(linha!.registro!.autor).toBe("Curador");
    expect(linha!.registro!.registradoEm).toBe("2026-08-02T12:00:00.000Z");
  });

  it("o bloco técnico carrega procedência quando ela existe", async () => {
    darDados([], [item(TECNICO)]);

    const [tecnico] = (await loadModeloDoReconhecimento(SUPABASE, CASE_ID, "Curador")).tecnicos;

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

/**
 * ETAPA 2C · C6 — O ESTADO DO ATO VEM DO MESMO CARREGAMENTO.
 *
 * `origin`, `acknowledgment`, `proposed_reading` e `correction` já vinham em
 * `loadCaseNeeds` desde a Etapa 2A. Aqui só passam a atravessar o contrato:
 * nenhuma consulta nova, nenhuma regra nova.
 */
describe("C6 · o ato sobre a tradução, sem consulta nova", () => {
  it("linha traduzida e pendente chega pronta para receber desfecho", async () => {
    darDados([need(COM_PESSOA, { origin: "TRADUCAO", proposedReading: "Entendi assim." })], []);

    const [linha] = (await loadModeloDoReconhecimento(SUPABASE, CASE_ID)).linhas;

    expect(linha!.ato).toEqual({
      houveTraducao: true,
      desfecho: "PENDENTE",
      leituraProposta: "Entendi assim.",
      correcao: null,
    });
  });

  it("resposta direta dela não admite desfecho — ninguém traduziu nada", async () => {
    darDados([need(COM_PESSOA, { origin: "DIRETO" })], []);

    const [linha] = (await loadModeloDoReconhecimento(SUPABASE, CASE_ID)).linhas;

    expect(linha!.ato.houveTraducao).toBe(false);
  });

  it("desfecho já praticado atravessa com o texto dela", async () => {
    darDados(
      [
        need(COM_PESSOA, {
          origin: "TRADUCAO",
          proposedReading: "Entendi assim.",
          acknowledgment: "RECUSADA",
          correction: "não foi isso",
        }),
      ],
      [],
    );

    const [linha] = (await loadModeloDoReconhecimento(SUPABASE, CASE_ID)).linhas;

    expect(linha!.ato.desfecho).toBe("RECUSADA");
    expect(linha!.ato.correcao).toBe("não foi isso");
  });

  it("conceito só registrado, sem fala dela, não inventa tradução", async () => {
    darDados([], [item(COM_PESSOA)]);

    const [linha] = (await loadModeloDoReconhecimento(SUPABASE, CASE_ID)).linhas;

    expect(linha!.ato.houveTraducao).toBe(false);
    expect(linha!.ato.desfecho).toBe("PENDENTE");
    expect(linha!.ato.leituraProposta).toBeNull();
  });

  it("o loader continua lendo as MESMAS duas fontes — nenhuma terceira apareceu", async () => {
    darDados([need(COM_PESSOA, { origin: "TRADUCAO" })], [item(COM_PESSOA)]);

    await loadModeloDoReconhecimento(SUPABASE, CASE_ID);

    expect(mocks.loadCaseNeeds).toHaveBeenCalledTimes(1);
    expect(mocks.loadCasePriorityMap).toHaveBeenCalledTimes(1);
  });
});

/**
 * MR-01 — DEF-2: A COLUNA DELA NÃO FALA EM CÓDIGO.
 *
 * A verificação em navegador da Etapa 2D mostrou `explicacao_simples` em "O que
 * você disse". O código com que a resposta é ARMAZENADA chegava inteiro à tela.
 *
 * A cobertura aqui não é por amostra: percorre TODAS as opções de TODOS os
 * conceitos com lado da pessoa. Uma opção nova no Catálogo entra na varredura
 * sozinha, sem ninguém lembrar deste teste.
 */
describe("MR-01 · o que ela disse, dito como ela disse", () => {
  const COM_OPCOES = [...PERSON_QUESTIONS_BY_CODE.entries()].filter(
    ([, pergunta]) => Object.keys(pergunta.options).length > 0,
  );

  it("a varredura tem matéria — o Catálogo não está vazio", () => {
    expect(COM_OPCOES.length).toBeGreaterThan(8);
    const total = COM_OPCOES.reduce((soma, [, p]) => soma + Object.keys(p.options).length, 0);
    expect(total).toBeGreaterThan(30);
  });

  it("toda opção do Catálogo chega como rótulo humano, nunca como código", async () => {
    for (const [code, pergunta] of COM_OPCOES) {
      const codigos = Object.keys(pergunta.options);
      darDados([need(code, { options: codigos })], []);

      const [linha] = (await loadModeloDoReconhecimento(SUPABASE, CASE_ID)).linhas;

      expect(linha!.declaracao!.opcoes, code).toEqual(
        codigos.map((codigo) => pergunta.options[codigo]),
      );

      for (const codigo of codigos) {
        expect(linha!.declaracao!.opcoes, `${code} → ${codigo}`).not.toContain(codigo);
      }
    }
  });

  it("nenhum rótulo tem cara de identificador interno", async () => {
    for (const [code, pergunta] of COM_OPCOES) {
      darDados([need(code, { options: Object.keys(pergunta.options) })], []);

      const [linha] = (await loadModeloDoReconhecimento(SUPABASE, CASE_ID)).linhas;

      for (const rotulo of linha!.declaracao!.opcoes) {
        // Códigos canônicos são MAIÚSCULAS_COM_UNDERSCORE ou minúsculas_com_underscore.
        expect(rotulo, `${code} → ${rotulo}`).not.toMatch(/^[a-z0-9]+(_[a-z0-9]+)+$/);
        expect(rotulo, `${code} → ${rotulo}`).not.toMatch(/^[A-Z0-9]+(_[A-Z0-9]+)+$/);
        expect(rotulo.length, `${code} → ${rotulo}`).toBeGreaterThan(1);
      }
    }
  });

  it("opção que o Catálogo não nomeia mais: nem some, nem vira código", async () => {
    darDados([need(COM_PESSOA, { options: ["opcao_aposentada_qualquer"] })], []);

    const [linha] = (await loadModeloDoReconhecimento(SUPABASE, CASE_ID)).linhas;

    // I-8: a escolha dela não desaparece por falta de rótulo...
    expect(linha!.declaracao!.opcoes).toHaveLength(1);
    // ...e M3: o código também não chega à tela dela.
    expect(linha!.declaracao!.opcoes[0]).not.toBe("opcao_aposentada_qualquer");
    expect(linha!.declaracao!.opcoes[0]).toBe("Uma opção que o Catálogo não descreve mais");
  });

  it("sem opção nenhuma, a lista fica vazia — nada é inventado", async () => {
    darDados([need(COM_PESSOA, { options: [] })], []);

    const [linha] = (await loadModeloDoReconhecimento(SUPABASE, CASE_ID)).linhas;

    expect(linha!.declaracao!.opcoes).toEqual([]);
    expect(linha!.declaracao).not.toBeNull();
  });

  it("o mapa é o MESMO do painel do Curador — os dois lados verbalizam igual", () => {
    const painel = readFileSync(
      join(process.cwd(), "src/components/curadoria/protocolo-pessoa-panel.tsx"),
      "utf8",
    );
    const modelo = readFileSync(
      join(process.cwd(), "src/modules/paciente/reconhecimento-model.ts"),
      "utf8",
    );

    expect(painel).toContain("question.options[option]");
    expect(modelo).toContain("PERSON_QUESTIONS_BY_CODE.get(subcriterionCode)?.options[valor]");
    // Nenhum mapa novo nasceu aqui (M1).
    expect(modelo).not.toMatch(/const [A-Z_]*LABELS[A-Z_]* *[:=] *\{/);
  });
});

// ---------------------------------------------------------------------------
// O autor é um NOME, nunca um identificador — achado da travessia de 25/08
// ---------------------------------------------------------------------------
//
// `declaredBy` guarda o id do perfil. Enquanto ninguém o gravava, a tela dela
// dizia "não consta quem registrou" — falso. Ao passar a gravá-lo (SIM-27), a
// procedência exibiu o UUID CRU para a paciente: a mesma família do SIM-06,
// quando o Concierge lia "Case 1a1dd209" onde a tela prometia uma pessoa.
//
// O modelo passou a traduzir. Estes casos existem para que o id não volte a
// vazar — nem quando há nome, nem quando não há.

describe("O autor exibido é nome, nunca identificador", () => {
  const UUID = "e8fd393e-f921-46e8-af95-04d8715a97d1";

  it("com nome, a procedência que ela lê mostra a pessoa — nunca o id", async () => {
    darDados([need(COM_PESSOA, { declaredBy: UUID })], [item(COM_PESSOA, { declaredBy: UUID })]);

    const modelo = await loadModeloDoReconhecimento(SUPABASE, CASE_ID, "Dra. Ana");

    expect(modelo.linhas[0]!.registro!.autor).toBe("Dra. Ana");
    expect(modelo.linhas[0]!.declaracao!.autor).toBe("Dra. Ana");

    // ESCOPO DESTE CONSERTO: a PROCEDÊNCIA — a frase "Registrado por … em …"
    // que a paciente lê em cada linha. Era ela que exibia o UUID.
    //
    // O id ainda vive na CADEIA (`cadeia.ramos[].elos[].autor`), que é outra
    // estrutura, com outro público: a prova de origem, hoje não renderizada
    // nesta tela. Afirmar aqui sobre o objeto inteiro faria este teste falhar
    // por um motivo que ele não trata — e teste que falha pelo motivo errado
    // ensina a ignorá-lo. O restante está registrado como SIM-28.
  });

  it("SEM nome, vira ausência declarada — o id não passa como se fosse gente", async () => {
    darDados([], [item(TECNICO, { declaredBy: UUID })]);

    const modelo = await loadModeloDoReconhecimento(SUPABASE, CASE_ID, null);

    // A frase de procedência dirá "não consta quem registrou" — que é
    // verdadeiro. Mostrar o código seria pior que a ausência: diz nada, e
    // parece que diz algo.
    expect(modelo.tecnicos[0]!.autor).toBeNull();
  });
});
