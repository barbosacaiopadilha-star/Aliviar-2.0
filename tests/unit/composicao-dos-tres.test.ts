import { describe, expect, it } from "vitest";

import { razoesSugeridas, resumirCandidatos } from "@/modules/curadoria/composicao-dos-tres";
import type { Linha } from "@/modules/curadoria/mesa-por-preocupacoes";

function linha(parcial: Partial<Linha>): Linha {
  return {
    questionId: "P10",
    subcriterionCode: "MODELO_COMUNICACAO",
    pergunta: "O que te ajudaria a entender melhor o que for explicado?",
    resposta: "Explicação sem termos técnicos",
    grau: "ESSENCIAL",
    reconhecida: true,
    importancia: "MUITO_IMPORTANTE",
    celulas: [],
    // `SIM-46`: o campo é obrigatório em `Linha` desde que a linha redundante
    // passou a encolher, e este helper nunca o preencheu — `npm run typecheck`
    // ficou vermelho no `main` sem que nada barrasse o commit.
    todosIguais: false,
    opcoesMarcadas: [],
    opcoes: [],
    multi: false,
    origem: "TRADUCAO",
    ...parcial,
  };
}

const HELENA = { id: "helena", nome: "Dra. Helena" };
const OTAVIO = { id: "otavio", nome: "Dr. Otávio" };

describe("O resumo dos candidatos — contagens, nunca notas", () => {
  it("conta o que ele atende entre o que ELA chamou de essencial", () => {
    const mesa = {
      profissionais: [HELENA],
      linhas: [
        linha({
          celulas: [
            {
              profissionalId: "helena",
              estado: "CONFIRMADO",
              compatibilidade: "ALTA_COMPATIBILIDADE",
              motivo: "CRUZADO",
            },
          ],
        }),
      ],
    };

    const [resumo] = resumirCandidatos(mesa);
    expect(resumo.essenciais.atende).toBe(1);
    expect(resumo.essenciais.frasesQueAtende).toEqual(["Explicação sem termos técnicos"]);
  });

  // No Motor, MÉDIA é o que sai quando o profissional NÃO tem a característica
  // (princípio 2 da ADR-041). Contá-la como meio-atendimento suavizaria, para
  // quem escreve a razão, exatamente o que ela precisa saber antes de escolher.
  it("média compatibilidade conta como NÃO atende, não como meio-termo", () => {
    const mesa = {
      profissionais: [HELENA],
      linhas: [
        linha({
          celulas: [
            {
              profissionalId: "helena",
              estado: "NAO_CONFIRMADO",
              compatibilidade: "MEDIA_COMPATIBILIDADE",
              motivo: "CRUZADO",
            },
          ],
        }),
      ],
    };

    const [resumo] = resumirCandidatos(mesa);
    expect(resumo.essenciais.naoAtende).toBe(1);
    expect(resumo.essenciais.atende).toBe(0);
  });

  // Culpar o médico por uma pergunta que a operação ainda não fez seria
  // transferir a falha de quem tem o dever para quem não tem.
  it("pergunta que ela não respondeu não conta contra ninguém", () => {
    const mesa = {
      profissionais: [HELENA],
      linhas: [
        linha({
          resposta: null,
          grau: null,
          celulas: [
            {
              profissionalId: "helena",
              estado: null,
              compatibilidade: null,
              motivo: "SEM_ESTADO_DECLARADO",
            },
          ],
        }),
      ],
    };

    const [resumo] = resumirCandidatos(mesa);
    expect(resumo.tudo).toMatchObject({ atende: 0, naoAtende: 0, semInformacao: 0 });
  });

  // O dia em que a tela oferecer um ranking, o Curador vai confirmá-lo — e a
  // Aliviar terá passado a escolher o médico.
  //
  // A primeira versão deste teste NÃO MORDIA: usava "Dr. Otávio" e "Dra.
  // Helena", que já saem nessa ordem no alfabeto, então ordenar por nome
  // passava verde. Descoberto por mutação, no mesmo dia. Os nomes agora são
  // escolhidos para que a ordem de entrada contrarie AO MESMO TEMPO o
  // alfabeto e a contagem — as duas formas de ranquear sem dizer o nome.
  it("a ordem de saída é a de entrada — nem alfabeto, nem contagem", () => {
    const zulmira = { id: "zulmira", nome: "Dra. Zulmira" }; // último no alfabeto
    const abreu = { id: "abreu", nome: "Dr. Abreu" }; //        primeiro no alfabeto

    const forte = linha({
      celulas: [
        // Zulmira atende; Abreu não. Entra Zulmira primeiro.
        { profissionalId: "zulmira", estado: "CONFIRMADO", compatibilidade: "ALTA_COMPATIBILIDADE", motivo: "CRUZADO" },
        { profissionalId: "abreu", estado: "NAO_CONFIRMADO", compatibilidade: "MEDIA_COMPATIBILIDADE", motivo: "CRUZADO" },
      ],
    });

    const resumos = resumirCandidatos({ profissionais: [zulmira, abreu], linhas: [forte] });

    // Alfabeticamente Abreu viria primeiro; por contagem, Zulmira. A ordem
    // correta é a de entrada, que aqui difere das duas.
    expect(resumos.map((r) => r.profissionalId)).toEqual(["zulmira", "abreu"]);

    // E o mesmo com a entrada invertida: quem atende MAIS não sobe.
    const invertido = resumirCandidatos({ profissionais: [abreu, zulmira], linhas: [forte] });
    expect(invertido.map((r) => r.profissionalId)).toEqual(["abreu", "zulmira"]);
    expect(invertido[0].essenciais.atende).toBeLessThan(invertido[1].essenciais.atende);
  });
});

describe("As razões sugeridas — resumem fato, não emitem opinião", () => {
  const comCusto = {
    profissionalId: "helena",
    nome: "Dra. Helena",
    essenciais: {
      atende: 2,
      naoAtende: 1,
      semInformacao: 0,
      frasesQueAtende: ["Explicação sem termos técnicos", "Sair com o retorno já marcado"],
      frasesQueNaoAtende: ["Preciso de atendimento presencial"],
    },
    tudo: {
      atende: 2,
      naoAtende: 1,
      semInformacao: 0,
      frasesQueAtende: [],
      frasesQueNaoAtende: [],
    },
  };

  // Esta razão vai para o PORTAL DELA, embaixo do nome de cada profissional.
  // A primeira versão dizia "responde ao que ELA chamou de essencial" — texto
  // do Curador falando sobre ela — e foi assim que chegou à tela dela na
  // travessia de 25/08: ela leu sobre si mesma na terceira pessoa, como se não
  // estivesse na sala. Nenhum teste pegaria; só atravessar até o portal.
  it("fala com ela, não sobre ela — quem lê isto é a paciente", () => {
    const [primeira] = razoesSugeridas(comCusto);
    expect(primeira.texto).toContain("ao que você chamou de essencial");
    expect(primeira.texto).not.toContain("ela chamou");
  });

  it("cita as frases dela entre aspas, em vez de resumir em adjetivo", () => {
    const [primeira] = razoesSugeridas(comCusto);
    expect(primeira.texto).toContain("“Explicação sem termos técnicos”");
    expect(primeira.texto).toContain("“Sair com o retorno já marcado”");
  });

  // Uma razão que só enumera acertos esconde o custo — e é por isso que o
  // contrato da seleção tem `tradeOff`: nenhuma das três é perfeita.
  it("oferece também a razão que encara o que ele NÃO atende", () => {
    const comOCusto = razoesSugeridas(comCusto).find((r) => r.rotulo === "Com o custo à vista");
    expect(comOCusto).toBeDefined();
    expect(comOCusto!.texto).toContain("apesar de não responder a “Preciso de atendimento presencial”");
    expect(comOCusto!.texto).toContain("que você declarou essencial");
    // Termina em aberto de propósito: quem completa é o Curador.
    expect(comOCusto!.texto.trim().endsWith("O que compensa isso é")).toBe(true);
  });

  it("nomeia a lacuna quando existe, em vez de calar sobre ela", () => {
    const comLacuna = razoesSugeridas({
      ...comCusto,
      essenciais: { ...comCusto.essenciais, semInformacao: 2 },
    });
    expect(comLacuna.some((r) => r.rotulo === "Com a lacuna nomeada")).toBe(true);
  });

  it("sem nada declarado, não sugere razão nenhuma", () => {
    const vazio = {
      profissionalId: "x",
      nome: "X",
      essenciais: { atende: 0, naoAtende: 0, semInformacao: 0, frasesQueAtende: [], frasesQueNaoAtende: [] },
      tudo: { atende: 0, naoAtende: 0, semInformacao: 0, frasesQueAtende: [], frasesQueNaoAtende: [] },
    };
    expect(razoesSugeridas(vazio)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------

// Visto na tela, com o caso real: a razão sugerida saía "apesar de não
// responder a sair com o retorno já marcado · quero orientação escrita", e o
// ponto médio serve de rótulo numa célula mas não é português dentro de frase.
describe("A frase entra na prosa, não como rótulo", () => {
  it("o separador de múltipla escolha vira vírgula na razão", () => {
    const mesa = {
      profissionais: [{ id: "helena", nome: "Dra. Helena" }],
      linhas: [
        linha({
          resposta: "Sair com o retorno já marcado · Quero orientação escrita após a consulta",
          celulas: [
            {
              profissionalId: "helena",
              estado: "CONFIRMADO",
              compatibilidade: "ALTA_COMPATIBILIDADE",
              motivo: "CRUZADO",
            },
          ],
        }),
      ],
    };

    const [resumo] = resumirCandidatos(mesa);
    const [primeira] = razoesSugeridas(resumo);

    expect(primeira.texto).toContain(
      "“Sair com o retorno já marcado, Quero orientação escrita após a consulta”",
    );
    expect(primeira.texto).not.toContain("·");
  });
});
