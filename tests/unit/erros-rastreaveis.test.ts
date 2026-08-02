// ETAPA 2 da Release de Reconstrução: o contrato de rastreabilidade de erros.
// O que este teste garante: nenhuma falha real pode voltar a virar frase
// genérica sem rastro — a causa original sobrevive no log, e a referência
// que o usuário vê aponta para a linha de log correspondente.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  ErroDaAplicacao,
  erroDeBanco,
  falhaParaUsuario,
  registrarErro,
} from "@/lib/observability/erros";

describe("erros rastreáveis", () => {
  let logado: string[];

  beforeEach(() => {
    logado = [];
    vi.spyOn(console, "error").mockImplementation((linha: unknown) => {
      logado.push(String(linha));
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("erroDeBanco preserva a causa original (code/details/hint do PostgREST)", () => {
    const causa = { code: "42501", message: "permission denied", details: "RLS", hint: null };
    const erro = erroDeBanco("Não foi possível criar o profissional.", causa, { op: "insert" });

    expect(erro).toBeInstanceOf(ErroDaAplicacao);
    expect(erro.tipo).toBe("banco");
    expect(erro.cause).toBe(causa);
    expect(erro.contexto).toEqual({ op: "insert" });
  });

  it("registrarErro grava stack, causa e contexto no log e devolve a referência", () => {
    const causa = new Error("duplicate key value violates unique constraint");
    const erro = erroDeBanco("Não foi possível salvar.", causa, { tabela: "professional_profiles" });

    const referencia = registrarErro("teste.escopo", erro, { extra: 1 });

    expect(referencia).toMatch(/^ERR-[A-Z0-9]{8}$/);
    expect(logado).toHaveLength(1);
    const linha = JSON.parse(logado[0]);
    expect(linha.referencia).toBe(referencia);
    expect(linha.escopo).toBe("teste.escopo");
    expect(linha.tipo).toBe("banco");
    expect(linha.stack).toContain("ErroDaAplicacao");
    expect(linha.causa.message).toContain("duplicate key");
    expect(linha.causa.stack).toBeTruthy();
    expect(linha.contexto).toMatchObject({ tabela: "professional_profiles", extra: 1 });
  });

  it("falhaParaUsuario devolve a frase da ação com a referência, sem detalhe técnico", () => {
    const mensagem = falhaParaUsuario("teste.acao", new Error("stack interna secreta"), {
      mensagem: "Não foi possível criar o profissional.",
    });

    expect(mensagem).toMatch(/^Não foi possível criar o profissional\. \(ref\. ERR-[A-Z0-9]{8}\)$/);
    expect(mensagem).not.toContain("secreta");
    // E a referência da mensagem é exatamente a do log:
    const linha = JSON.parse(logado[0]);
    expect(mensagem).toContain(linha.referencia);
  });

  it("classifica erros de rede e autorização por heurística quando não tipados", () => {
    falhaParaUsuario("teste.rede", new Error("fetch failed: ECONNREFUSED"));
    falhaParaUsuario("teste.rls", new Error("new row violates row-level security policy"));

    expect(JSON.parse(logado[0]).tipo).toBe("rede");
    expect(JSON.parse(logado[1]).tipo).toBe("autorizacao");
  });
});
