import { describe, expect, it } from "vitest";

// Módulo operacional em .mjs. A função é pura e mora em arquivo próprio
// justamente para poder ser importada aqui: o configurador é um roteiro que
// roda ao ser carregado, e importá-lo executaria o roteiro.
import { conferirCredenciais } from "../../scripts/backup-credenciais.mjs";

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
    expect(problemas.join(" ")).toContain("não contém o ref do projeto vinculado");
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
