import { describe, expect, it } from "vitest";

// Módulo operacional em .mjs. A função é pura e mora em arquivo próprio
// justamente para poder ser importada aqui: o configurador é um roteiro que
// roda ao ser carregado, e importá-lo executaria o roteiro.
import {
  conferirCredenciais,
  descreverFormato,
  instalarOcultacao,
  montarConnectionString,
} from "../../scripts/backup-credenciais.mjs";

// REC-01 · as conferências do configurador de backup de produção.
//
// Por que isto é testado: o pior erro de colagem aqui é o SILENCIOSO. Um
// arquivo escrito com o marcador `[YOUR-PASSWORD]` do painel parece
// configurado, não reclama, e só falha no dia em que alguém precisar do
// backup — que é exatamente o dia em que não dá para consertar.
//
// Nenhum valor real aparece aqui. São todos inventados para o teste.

const REF = "abcdefghijklmnop";
const URL_BOA = `postgresql://postgres:umaSenhaQualquer@db.${REF}.supabase.co:5432/postgres`;
const CHAVE_BOA = "chave-de-servico-suficientemente-longa-para-o-teste";

describe("Conferência das credenciais de backup — o que não pode passar", () => {
  it("credenciais coerentes passam sem ressalva", () => {
    expect(conferirCredenciais({ dbUrl: URL_BOA, serviceKey: CHAVE_BOA, ref: REF })).toEqual([]);
  });

  it("o marcador do painel é recusado — é o erro silencioso clássico", () => {
    const problemas = conferirCredenciais({
      dbUrl: `postgresql://postgres:[YOUR-PASSWORD]@db.${REF}.supabase.co:5432/postgres`,
      serviceKey: CHAVE_BOA,
      ref: REF,
    });
    expect(problemas.join(" ")).toContain("marcador do painel");
  });

  it("apontar para o banco local é recusado — seria backup de desenvolvimento", () => {
    const problemas = conferirCredenciais({
      dbUrl: "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
      serviceKey: CHAVE_BOA,
      ref: REF,
    });
    expect(problemas.join(" ")).toContain("LOCAL");
  });

  it("host de outro projeto é recusado quando há projeto vinculado", () => {
    const problemas = conferirCredenciais({
      dbUrl: "postgresql://postgres:senha@db.outroprojeto.supabase.co:5432/postgres",
      serviceKey: CHAVE_BOA,
      ref: REF,
    });
    expect(problemas.join(" ")).toContain("não aparece em nenhum dos dois");
  });

  it("a string do POOLER é aceita — o ref mora no usuário, não no host", () => {
    // O painel do Supabase oferece o pooler por padrão. A primeira versão
    // procurava o ref só no host e recusava esta string — travando quem
    // seguia exatamente a instrução da tela.
    const problemas = conferirCredenciais({
      dbUrl: `postgresql://postgres.${REF}:umaSenhaQualquer@aws-0-sa-east-1.pooler.supabase.com:5432/postgres`,
      serviceKey: CHAVE_BOA,
      ref: REF,
    });
    expect(problemas).toEqual([]);
  });

  it("connection string sem senha é recusada", () => {
    const problemas = conferirCredenciais({
      dbUrl: `postgresql://postgres@db.${REF}.supabase.co:5432/postgres`,
      serviceKey: CHAVE_BOA,
      ref: REF,
    });
    expect(problemas.join(" ")).toContain("não tem senha");
  });

  it("a chave publishable no lugar da service_role é recusada", () => {
    const problemas = conferirCredenciais({
      dbUrl: URL_BOA,
      serviceKey: "sb_publishable_ACJWlzQHlZjBrEguHvfOxg_exemplo",
      ref: REF,
    });
    expect(problemas.join(" ")).toContain("publishable");
  });

  it("valores vazios são recusados, e os dois são nomeados", () => {
    const problemas = conferirCredenciais({ dbUrl: "", serviceKey: "", ref: REF });
    expect(problemas.join(" ")).toContain("connection string veio vazia");
    expect(problemas.join(" ")).toContain("service role key veio vazia");
  });

  it("sem projeto vinculado, o host não é comparado — mas o resto continua valendo", () => {
    expect(
      conferirCredenciais({ dbUrl: URL_BOA, serviceKey: CHAVE_BOA, ref: null }),
    ).toEqual([]);
    expect(
      conferirCredenciais({
        dbUrl: "postgresql://postgres:postgres@localhost:5432/postgres",
        serviceKey: CHAVE_BOA,
        ref: null,
      }).join(" "),
    ).toContain("LOCAL");
  });
});

// ---------------------------------------------------------------------------
// A ocultação da digitação — o defeito de 25/08
// ---------------------------------------------------------------------------
//
// A primeira versão tinha a condição INVERTIDA: escondia o rótulo do prompt e
// ecoava o que era digitado. Fazia o oposto do que prometia, e só apareceu
// quando o Fundador rodou e viu o texto na tela. Naquele dia nada vazou por
// SORTE — ele havia colado comandos, não segredos.
//
// Estes testes existem para que não dependa de sorte de novo.

describe("Ocultação da digitação — nada do que é digitado chega à tela", () => {
  function palco() {
    const tela: string[] = [];
    const rl = {} as { _writeToOutput: (t: string) => void };
    const controle = instalarOcultacao(rl, (t: string) => tela.push(t));
    return { tela, rl, controle };
  }

  it("com a ocultação ligada, NADA é escrito na tela", () => {
    const { tela, rl, controle } = palco();
    controle.ocultar();

    rl._writeToOutput("s");
    rl._writeToOutput("e");
    rl._writeToOutput("nha-inteira-colada-de-uma-vez");

    expect(tela).toEqual([]);
  });

  it("desligada, escreve normalmente — senão o prompt sumiria", () => {
    const { tela, rl, controle } = palco();

    rl._writeToOutput("Cole aqui: ");
    controle.ocultar();
    rl._writeToOutput("segredo");
    controle.revelar();
    rl._writeToOutput("\n(recebido)");

    // Exatamente o que a pessoa deve ver: o rótulo e a confirmação. Nunca o
    // valor no meio.
    expect(tela).toEqual(["Cole aqui: ", "\n(recebido)"]);
    expect(tela.join("")).not.toContain("segredo");
  });

  it("o estado é consultável, e começa revelado", () => {
    const { controle } = palco();
    expect(controle.estaOculto()).toBe(false);
    controle.ocultar();
    expect(controle.estaOculto()).toBe(true);
    controle.revelar();
    expect(controle.estaOculto()).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// A chave opcional — para que backup parcial exista em vez de backup nenhum
// ---------------------------------------------------------------------------

describe("Service role key opcional — o banco não espera pelos anexos", () => {
  it("com chaveOpcional, a ausência da chave passa", () => {
    expect(
      conferirCredenciais({ dbUrl: URL_BOA, serviceKey: "", ref: REF, chaveOpcional: true }),
    ).toEqual([]);
  });

  it("sem chaveOpcional, a ausência continua sendo problema", () => {
    expect(
      conferirCredenciais({ dbUrl: URL_BOA, serviceKey: "", ref: REF }).join(" "),
    ).toContain("service role key veio vazia");
  });

  it("opcional não é o mesmo que sem conferência: chave errada continua recusada", () => {
    expect(
      conferirCredenciais({
        dbUrl: URL_BOA,
        serviceKey: "sb_publishable_exemplo_de_chave_publica_longa",
        ref: REF,
        chaveOpcional: true,
      }).join(" "),
    ).toContain("publishable");
  });

  it("e a connection string continua obrigatória mesmo com a chave opcional", () => {
    expect(
      conferirCredenciais({ dbUrl: "", serviceKey: "", ref: REF, chaveOpcional: true }).join(" "),
    ).toContain("connection string veio vazia");
  });
});

// ---------------------------------------------------------------------------

// O diagnóstico que faltava, escrito a partir de um travamento real (25/08):
// o Fundador colou algo com 32 caracteres no campo da connection string e
// recebeu apenas "não é uma URL válida". A conferência sabia o comprimento e
// sabia que o prefixo estava errado, e calou as duas coisas — então ele não
// tinha como saber se havia colado o campo errado, se a colagem truncara, ou
// se o programa estava quebrado. O backup de produção não aconteceu naquele
// dia, e esta é a razão.
//
// A regra que estes testes guardam tem duas metades, e as duas importam:
// a mensagem precisa AJUDAR, e precisa poder ser lida em voz alta numa tela
// compartilhada sem entregar o segredo.
describe("Diagnóstico da colagem — diz a forma do que chegou, nunca o conteúdo", () => {
  it("conta o comprimento e aponta o prefixo errado — o caso que travou o Fundador", () => {
    const senhaCrua = "Xk9pQ2mW7vR4tY6uI8oP1aS3dF5gH0jK"; // 32, inventada

    const [problema] = conferirCredenciais({
      dbUrl: senhaCrua,
      serviceKey: CHAVE_BOA,
      ref: REF,
    });

    expect(problema).toContain("32 caracteres");
    expect(problema).toContain("postgresql://");
  });

  it("reconhece um JWT colado no campo errado e diz que é uma chave", () => {
    expect(descreverFormato("eyJhbGciOiJIUzI1NiJ9.cargaQualquer.assinatura")).toContain("CHAVE");
  });

  it("reconhece a chave nova do painel pelo prefixo sb_", () => {
    expect(descreverFormato("sb_secret_umValorInventadoParaOTeste")).toContain("chave do painel");
  });

  it("avisa quando a colagem trouxe quebra de linha junto", () => {
    expect(descreverFormato(`${URL_BOA}\nsobra`)).toContain("quebra de linha");
  });

  // A metade que protege: a mensagem vai para a tela, e a tela pode estar
  // sendo compartilhada. Nenhum pedaço reconhecível do segredo pode sair
  // junto com a ajuda — se um dia alguém acrescentar um "recebi algo como
  // 'Xk9p…'" para ser prestativo, é aqui que isso para.
  it("não devolve nenhum trecho do valor recebido", () => {
    const segredo = "postgresql://postgres:SenhaSuperSecreta123@db.exemplo.supabase.co:5432/x";
    const mensagem = descreverFormato(segredo);

    const janelas = Array.from({ length: segredo.length - 5 }, (_, i) => segredo.slice(i, i + 6));
    const vazadas = janelas.filter((janela) => mensagem.includes(janela));

    expect(vazadas).toEqual([]);
  });
});

// ---------------------------------------------------------------------------

// Montar a URI é o passo que o programa passou a fazer no lugar da pessoa.
//
// Antes, o configurador esperava que ela substituísse `[YOUR-PASSWORD]` à mão
// e colasse o resultado num campo sem eco. Editar texto no escuro e colar sem
// conferir é o que falhou em 25/08 — e o modo de falhar foi silencioso, que é
// o pior modo para uma ferramenta de backup.
describe("Montagem da connection string — o programa substitui, não a pessoa", () => {
  const URI_DO_PAINEL = `postgresql://postgres:[YOUR-PASSWORD]@db.${REF}.supabase.co:5432/postgres`;

  it("põe a senha no lugar do marcador e o resultado passa na conferência", () => {
    const montada = montarConnectionString(URI_DO_PAINEL, "umaSenhaQualquer");

    expect(montada).not.toContain("[YOUR-PASSWORD]");
    expect(conferirCredenciais({ dbUrl: montada, serviceKey: CHAVE_BOA, ref: REF })).toEqual([]);
  });

  // O caractere que mais dói aqui é o `@`: cru, ele vira o separador de host da
  // própria URI, e o endereço passa a apontar para outro lugar. Uma senha do
  // painel pode conter qualquer um destes.
  it("escapa senha com @ : / ? # — crus, eles reescreveriam o endereço", () => {
    const montada = montarConnectionString(URI_DO_PAINEL, "p@ss:w/rd?x#y");

    const url = new URL(montada);
    expect(url.hostname).toBe(`db.${REF}.supabase.co`);
    expect(decodeURIComponent(url.password)).toBe("p@ss:w/rd?x#y");
    expect(conferirCredenciais({ dbUrl: montada, serviceKey: CHAVE_BOA, ref: REF })).toEqual([]);
  });

  // Sem marcador não há o que substituir. Devolver a URI intacta seria pior do
  // que devolver nada: o chamador acharia que montou algo e seguiria em frente
  // sem avisar que a senha apareceu na tela.
  it("devolve null quando não há marcador — quem chama decide, não este módulo", () => {
    expect(montarConnectionString(`postgresql://postgres:jaTemSenha@db.x.co:5432/p`, "outra")).toBeNull();
  });
});
