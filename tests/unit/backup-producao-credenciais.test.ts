import { describe, expect, it } from "vitest";

// Módulo operacional em .mjs. A função é pura e mora em arquivo próprio
// justamente para poder ser importada aqui: o configurador é um roteiro que
// roda ao ser carregado, e importá-lo executaria o roteiro.
import { conferirCredenciais, instalarOcultacao } from "../../scripts/backup-credenciais.mjs";

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
