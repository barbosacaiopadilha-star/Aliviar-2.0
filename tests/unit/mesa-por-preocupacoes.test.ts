import { describe, expect, it } from "vitest";

import {
  juizoExigidoEm,
  montarMesaPorPreocupacoes,
  type EntradaDaMesa,
  type ProfissionalNaMesa,
} from "@/modules/curadoria/mesa-por-preocupacoes";
import { PERSON_PROTOCOL } from "@/modules/curadoria/protocolos";

// Os 29 subcritérios ativos, como o banco os declara. A lista vive aqui só
// para o teste: o módulo os recebe de fora, justamente para nunca ter uma
// segunda cópia da verdade.
const ATIVOS = [
  "ACESSO_MODALIDADE",
  "ACESSO_LOCAL_DE_ATENDIMENTO",
  "ACESSO_DISPONIBILIDADE",
  "ACESSO_PRAZO_PARA_CONSULTA",
  "CONTINUIDADE_RETORNOS",
  "CONTINUIDADE_CANAIS",
  "CONTINUIDADE_COORDENACAO",
  "CONTINUIDADE_POS_PROCEDIMENTO",
  "CONTINUIDADE_EQUIPE_DE_APOIO",
  "MODELO_COMUNICACAO",
  "MODELO_DECISAO_COMPARTILHADA",
  "MODELO_ALTERNATIVAS",
  "MODELO_PARTICIPACAO_FAMILIAR",
  "MODELO_PREFERENCIAS_E_RESTRICOES",
  "MODELO_CONDUCAO_DE_NOTICIAS_DIFICEIS",
  "VIABILIDADE_COBERTURA_E_CONVENIO",
  "VIABILIDADE_CUSTO_E_PAGAMENTO",
  "FORMACAO_GRADUACAO",
  "FORMACAO_RESIDENCIA",
  "FORMACAO_ESPECIALIZACAO",
  "FORMACAO_FELLOWSHIP",
  "FORMACAO_COMPLEMENTAR",
  "EXPERIENCIA_TEMPO_DE_PRATICA",
  "EXPERIENCIA_VOLUME_DE_ATUACAO",
  "EXPERIENCIA_NO_TIPO_DE_CASO",
  "PRATICA_LIMITES_DE_ATUACAO",
  "HISTORICO_TRAJETORIA_INSTITUCIONAL",
  "HISTORICO_ATIVIDADE_ACADEMICA",
  "HISTORICO_AREAS_DE_ATUACAO",
] as const;

const NINGUEM: ProfissionalNaMesa[] = [];

function entrada(parcial: Partial<EntradaDaMesa> = {}): EntradaDaMesa {
  return {
    respostas: [],
    importancias: {},
    profissionais: NINGUEM,
    subcriteriosAtivos: [...ATIVOS],
    ...parcial,
  };
}

describe("A Mesa pelas preocupações dela — a cobertura não pode furar", () => {
  // ESTE é o teste que sustenta a ADR-093.
  //
  // A objeção contra organizar a tela pelas frases dela é séria: ela não sabe
  // pedir "limites de atuação", e uma Mesa feita só do que ela disse viraria um
  // espelho das preocupações dela — o oposto de curadoria. A resposta é que
  // nada escapa: cada subcritério sai como linha OU como órfão.
  //
  // Se alguém um dia acrescentar um subcritério ao Método sem pergunta no
  // Protocolo e sem lugar na conferência, é aqui que isso para.
  it("todo subcritério ativo aparece exatamente uma vez — como linha ou como órfão", () => {
    const mesa = montarMesaPorPreocupacoes(entrada());

    const vistos = [
      ...mesa.linhas.map((l) => l.subcriterionCode),
      ...mesa.orfaos.map((o) => o.subcriterionCode),
    ];

    expect(new Set(vistos).size, "algum subcritério apareceu duas vezes").toBe(vistos.length);
    expect([...vistos].sort()).toEqual([...ATIVOS].sort());
    expect(mesa.conferenciaCompleta).toBe(true);
  });

  it("são 17 linhas e 12 órfãos — e os órfãos são os que ela não tem como pedir", () => {
    const mesa = montarMesaPorPreocupacoes(entrada());

    expect(mesa.linhas).toHaveLength(17);
    expect(mesa.orfaos).toHaveLength(12);

    // Não é uma lista arbitrária: são formação, experiência, histórico e
    // limites de atuação. Nenhuma paciente pergunta pelo volume cirúrgico do
    // cirurgião — e é exatamente por isso que existe curadoria.
    for (const orfao of mesa.orfaos) {
      expect(orfao.subcriterionCode).toMatch(/^(FORMACAO|EXPERIENCIA|HISTORICO|PRATICA)_/);
    }
  });

  it("as linhas seguem a ordem da conversa, não a alfabética da taxonomia", () => {
    const mesa = montarMesaPorPreocupacoes(entrada());
    const esperada = PERSON_PROTOCOL.map((p) => p.id);

    expect(mesa.linhas.map((l) => l.questionId)).toEqual(esperada);
  });

  // Um subcritério que sai de circulação não pode deixar linha órfã para trás.
  it("subcritério fora de circulação não vira linha nem órfão", () => {
    const semAcesso = ATIVOS.filter((c) => c !== "ACESSO_MODALIDADE");
    const mesa = montarMesaPorPreocupacoes(entrada({ subcriteriosAtivos: semAcesso }));

    const vistos = [
      ...mesa.linhas.map((l) => l.subcriterionCode),
      ...mesa.orfaos.map((o) => o.subcriterionCode),
    ];
    expect(vistos).not.toContain("ACESSO_MODALIDADE");
    expect(mesa.conferenciaCompleta).toBe(true);
  });
});

describe("A linha carrega a voz dela, não só o código", () => {
  it("traz a resposta e o grau que ELA declarou, separados do juízo do Curador", () => {
    const mesa = montarMesaPorPreocupacoes(
      entrada({
        respostas: [
          {
            questionId: "P10",
            resposta: "Quero entender o suficiente para conseguir escolher.",
            grau: "ESSENCIAL",
            reconhecida: true,
          },
        ],
        // O Curador declarou MUITO_IMPORTANTE. São dois fatos distintos, de
        // duas pessoas distintas, e a linha guarda os dois sem misturar.
        importancias: { MODELO_COMUNICACAO: "MUITO_IMPORTANTE" },
      }),
    );

    const linha = mesa.linhas.find((l) => l.questionId === "P10")!;
    expect(linha.resposta).toBe("Quero entender o suficiente para conseguir escolher.");
    expect(linha.grau).toBe("ESSENCIAL");
    expect(linha.reconhecida).toBe(true);
    expect(linha.importancia).toBe("MUITO_IMPORTANTE");
    expect(linha.pergunta.length).toBeGreaterThan(0);
  });

  it("pergunta sem resposta dela vira linha mesmo assim — o silêncio é informação", () => {
    const mesa = montarMesaPorPreocupacoes(entrada());
    const linha = mesa.linhas.find((l) => l.questionId === "P10")!;

    expect(linha.resposta).toBeNull();
    expect(linha.grau).toBeNull();
    expect(linha.reconhecida).toBe(false);
  });
});

describe("As células — e a diferença entre os vazios", () => {
  const helena: ProfissionalNaMesa = {
    id: "helena",
    nome: "Dra. Helena",
    estados: { MODELO_COMUNICACAO: "CONFIRMADO", VIABILIDADE_CUSTO_E_PAGAMENTO: "CONFIRMADO" },
  };

  it("cruza pelo Motor quando importância e estado existem", () => {
    const mesa = montarMesaPorPreocupacoes(
      entrada({
        profissionais: [helena],
        importancias: { MODELO_COMUNICACAO: "MUITO_IMPORTANTE" },
      }),
    );

    const celula = mesa.linhas.find((l) => l.subcriterionCode === "MODELO_COMUNICACAO")!.celulas[0];
    expect(celula.motivo).toBe("CRUZADO");
    expect(celula.compatibilidade).toBe("ALTA_COMPATIBILIDADE");
  });

  // Três vazios que a tela antiga mostrava iguais. Confundi-los é o que
  // produzia "23 lacunas de informação" — uma frase que não é acionável
  // porque junta "o Método não cruza isto" com "ninguém preencheu ainda".
  it("distingue os três vazios: fora do Motor, sem importância, sem estado", () => {
    const mesa = montarMesaPorPreocupacoes(
      entrada({
        profissionais: [helena],
        importancias: {
          VIABILIDADE_CUSTO_E_PAGAMENTO: "IMPORTANTE", // fora do Motor por decisão
          MODELO_ALTERNATIVAS: "MUITO_IMPORTANTE", // Helena não tem estado
          // MODELO_COMUNICACAO fica sem importância declarada
        },
      }),
    );

    const motivo = (code: string) =>
      mesa.linhas.find((l) => l.subcriterionCode === code)!.celulas[0].motivo;

    expect(motivo("VIABILIDADE_CUSTO_E_PAGAMENTO")).toBe("FORA_DO_MOTOR");
    expect(motivo("MODELO_ALTERNATIVAS")).toBe("SEM_ESTADO_DECLARADO");
    expect(motivo("MODELO_COMUNICACAO")).toBe("SEM_IMPORTANCIA_DECLARADA");
  });

  it("uma célula por profissional, na ordem em que eles chegaram", () => {
    const otavio: ProfissionalNaMesa = { id: "otavio", nome: "Dr. Otávio", estados: {} };
    const mesa = montarMesaPorPreocupacoes(entrada({ profissionais: [helena, otavio] }));

    for (const linha of mesa.linhas) {
      expect(linha.celulas.map((c) => c.profissionalId)).toEqual(["helena", "otavio"]);
    }
  });
});

describe("A conferência final — o que ela não pediu ainda precisa de resposta", () => {
  it("órfão sem importância declarada fica pendente de conferência", () => {
    const mesa = montarMesaPorPreocupacoes(entrada());

    expect(mesa.pendentesDeConferencia).toContain("EXPERIENCIA_VOLUME_DE_ATUACAO");
    expect(mesa.pendentesDeConferencia).toContain("PRATICA_LIMITES_DE_ATUACAO");
  });

  // "Não influencia este caso" é resposta legítima e fecha o item — é
  // exatamente a função que o NAO_INFLUENCIA já tinha no Método.
  it("declarar NAO_INFLUENCIA encerra a pendência, como qualquer outra declaração", () => {
    const mesa = montarMesaPorPreocupacoes(
      entrada({ importancias: { EXPERIENCIA_VOLUME_DE_ATUACAO: "NAO_INFLUENCIA" } }),
    );

    expect(mesa.pendentesDeConferencia).not.toContain("EXPERIENCIA_VOLUME_DE_ATUACAO");
    expect(mesa.orfaos.find((o) => o.subcriterionCode === "EXPERIENCIA_VOLUME_DE_ATUACAO")!.conferido).toBe(true);
  });

  it("com os doze conferidos, não sobra pendência", () => {
    const todos = Object.fromEntries(
      ATIVOS.filter((c) => /^(FORMACAO|EXPERIENCIA|HISTORICO|PRATICA)_/.test(c)).map((c) => [
        c,
        "RELEVANTE" as const,
      ]),
    );
    const mesa = montarMesaPorPreocupacoes(entrada({ importancias: todos }));

    expect(mesa.pendentesDeConferencia).toEqual([]);
  });
});

// ---------------------------------------------------------------------------

// A formação é o que todo mundo quer saber primeiro — e é por isso que ela vem
// por último. O diploma é o atalho que qualquer pessoa usaria sozinha, sem
// curadoria nenhuma, e é o mais fácil de confundir com resposta. Aberta a tela
// pela formação, todo o resto vira nota de rodapé de um currículo.
describe("A ordem dos doze — do que ela vive para o que ela não alcança", () => {
  it("a formação vem por último, depois de experiência, limites e histórico", () => {
    const mesa = montarMesaPorPreocupacoes(entrada());
    const eixos = mesa.orfaos.map((o) => o.subcriterionCode.split("_")[0]);

    const primeiroDe = (eixo: string) => eixos.indexOf(eixo);
    expect(primeiroDe("EXPERIENCIA")).toBeLessThan(primeiroDe("PRATICA"));
    expect(primeiroDe("PRATICA")).toBeLessThan(primeiroDe("HISTORICO"));
    expect(primeiroDe("HISTORICO")).toBeLessThan(primeiroDe("FORMACAO"));

    // Os cinco de formação ficam juntos, no fim, sem nada depois deles.
    const depoisDaFormacao = eixos.slice(primeiroDe("FORMACAO"));
    expect(new Set(depoisDaFormacao)).toEqual(new Set(["FORMACAO"]));
  });

  // Um eixo novo que ninguém previu não pode ir para o rodapé em silêncio:
  // é assim que um conceito passa meses sem ser visto por ninguém.
  it("eixo desconhecido aparece ANTES da formação, onde alguém o vê", () => {
    const mesa = montarMesaPorPreocupacoes(
      entrada({ subcriteriosAtivos: [...ATIVOS, "EIXO_QUE_NINGUEM_PREVIU"] }),
    );
    const codigos = mesa.orfaos.map((o) => o.subcriterionCode);

    expect(codigos.indexOf("EIXO_QUE_NINGUEM_PREVIU")).toBeLessThan(
      codigos.indexOf("FORMACAO_GRADUACAO"),
    );
    expect(mesa.conferenciaCompleta).toBe(true);
  });
});

// ---------------------------------------------------------------------------

// A Mesa antiga empilhava os seis juízos num bloco só, longe do fato que os
// justificava. Eles caem sozinhos no lugar certo — e o encaixe não foi
// arranjado por mim: os três relacionais SÃO perguntas feitas a ela, e os três
// técnicos SÃO os eixos que ela não tem como pedir.
describe("Onde cada juízo pertence — a estrutura do Método, não o layout", () => {
  it("os três relacionais caem em perguntas feitas A ELA", () => {
    const mesa = montarMesaPorPreocupacoes(entrada());
    const comJuizoRelacional = mesa.linhas
      .filter((l) => juizoExigidoEm(l.subcriterionCode) === "RELACIONAL")
      .map((l) => l.questionId);

    // P11 (decisão compartilhada), P14 (preferências e restrições),
    // P17 (condução de notícias difíceis — ADR-065).
    expect(comJuizoRelacional.sort()).toEqual(["P11", "P14", "P17"]);
  });

  it("os três técnicos caem nos eixos que ela não tem como pedir", () => {
    const mesa = montarMesaPorPreocupacoes(entrada());
    const eixos = new Set(
      mesa.orfaos
        .filter((o) => juizoExigidoEm(o.subcriterionCode) === "TECNICO")
        .map((o) => o.subcriterionCode.split("_")[0]),
    );

    expect(eixos).toEqual(new Set(["FORMACAO", "EXPERIENCIA", "HISTORICO"]));
  });

  // A ADR-067 §5 exige UM juízo de formação, não cinco. O Mapa fala em
  // subcritérios; o juízo é do eixo inteiro.
  it("nenhum juízo é exigido fora dos seis conceitos do Método", () => {
    const mesa = montarMesaPorPreocupacoes(entrada());
    const exigidos = [...mesa.linhas, ...mesa.orfaos]
      .map((item) => ("questionId" in item ? item.subcriterionCode : item.subcriterionCode))
      .filter((code) => juizoExigidoEm(code) !== null);

    // 5 de formação + 3 de experiência + 3 de histórico + os 3 relacionais.
    // Os de PRATICA e os de ACESSO/CONTINUIDADE/VIABILIDADE não pedem juízo.
    expect(exigidos).not.toContain("PRATICA_LIMITES_DE_ATUACAO");
    expect(exigidos).not.toContain("ACESSO_MODALIDADE");
    expect(exigidos).toContain("MODELO_DECISAO_COMPARTILHADA");
  });
});

// ---------------------------------------------------------------------------

// A primeira versão da tela pediu 42 juízos onde o Método pede 18: ela
// renderizava o pedido em cada SUBCRITÉRIO, e a ADR-067 §5 exige um por EIXO.
// O agrupamento existe para que a tela não tenha como errar isso de novo — e
// esta é a conta que prova.
describe("O juízo é do eixo, não do subcritério — 18, nunca 42", () => {
  it("um grupo por eixo, e só os três eixos da ADR-067 pedem juízo", () => {
    const mesa = montarMesaPorPreocupacoes(entrada());

    expect(mesa.gruposDeOrfaos.map((g) => g.eixo)).toEqual([
      "EXPERIENCIA",
      "PRATICA",
      "HISTORICO",
      "FORMACAO",
    ]);
    expect(mesa.gruposDeOrfaos.filter((g) => g.juizo === "TECNICO").map((g) => g.eixo)).toEqual([
      "EXPERIENCIA",
      "HISTORICO",
      "FORMACAO",
    ]);
  });

  it("os grupos contêm todos os órfãos, sem perder nem duplicar nenhum", () => {
    const mesa = montarMesaPorPreocupacoes(entrada());
    const nosGrupos = mesa.gruposDeOrfaos.flatMap((g) => g.itens.map((i) => i.subcriterionCode));

    expect(nosGrupos.sort()).toEqual(mesa.orfaos.map((o) => o.subcriterionCode).sort());
  });

  // A conta que a tela faz: 3 eixos técnicos + 3 conceitos relacionais,
  // vezes o número de profissionais.
  it("a conta fecha em 6 pontos de juízo por profissional", () => {
    const mesa = montarMesaPorPreocupacoes(entrada());

    const relacionais = mesa.linhas.filter(
      (l) => juizoExigidoEm(l.subcriterionCode) === "RELACIONAL",
    ).length;
    const tecnicos = mesa.gruposDeOrfaos.filter((g) => g.juizo === "TECNICO").length;

    expect(relacionais + tecnicos).toBe(6);
  });
});

// ---------------------------------------------------------------------------

// A primeira versão da tela pediu 42 juízos onde o Método pede 18: renderizava
// o pedido em cada SUBCRITÉRIO, e a ADR-067 §5 exige um por EIXO. O
// agrupamento existe para que a tela não tenha como errar isso de novo.
describe("O juízo é do eixo, não do subcritério — 18, nunca 42", () => {
  it("um grupo por eixo, e só os três eixos da ADR-067 pedem juízo", () => {
    const mesa = montarMesaPorPreocupacoes(entrada());

    expect(mesa.gruposDeOrfaos.map((g) => g.eixo)).toEqual([
      "EXPERIENCIA",
      "PRATICA",
      "HISTORICO",
      "FORMACAO",
    ]);
    expect(mesa.gruposDeOrfaos.filter((g) => g.juizo === "TECNICO").map((g) => g.eixo)).toEqual([
      "EXPERIENCIA",
      "HISTORICO",
      "FORMACAO",
    ]);
  });

  it("os grupos contêm todos os órfãos, sem perder nem duplicar nenhum", () => {
    const mesa = montarMesaPorPreocupacoes(entrada());
    const nosGrupos = mesa.gruposDeOrfaos.flatMap((g) => g.itens.map((i) => i.subcriterionCode));

    expect(nosGrupos.sort()).toEqual(mesa.orfaos.map((o) => o.subcriterionCode).sort());
  });

  // A conta que a tela faz: 3 eixos técnicos + 3 conceitos relacionais.
  it("a conta fecha em 6 pontos de juízo por profissional", () => {
    const mesa = montarMesaPorPreocupacoes(entrada());

    const relacionais = mesa.linhas.filter(
      (l) => juizoExigidoEm(l.subcriterionCode) === "RELACIONAL",
    ).length;
    const tecnicos = mesa.gruposDeOrfaos.filter((g) => g.juizo === "TECNICO").length;

    expect(relacionais + tecnicos).toBe(6);
  });
});
