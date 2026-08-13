import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  CAMPOS_PERMITIDOS,
  FRONTEIRA_FECHADA,
  MENSAGEM_DE_SUCESSO,
  pareceRobo,
  validarSolicitacao,
  type SolicitacaoPublica,
} from "@/modules/crm/solicitacao-publica";
import { normalizeEmail, normalizePhone } from "@/modules/crm/lead";

/**
 * T-A-3 · A FRONTEIRA DA PORTA PÚBLICA É UM CONJUNTO FECHADO.
 *
 * A régua não é procurar palavra proibida — é comparar o conjunto. Procurar
 * `diagnostico` pega quem usa esse nome, e mais nada: `queixa`, `quadro` ou
 * `resumoClinico` atravessariam calados. Aqui, qualquer chave a mais reprova,
 * tenha o nome que tiver.
 */

const RAIZ = process.cwd();

function pedido(sobre: Partial<Record<string, unknown>> = {}): Record<string, unknown> {
  return {
    nome: "Fixture Sintética",
    email: "fixture.sintetica@validation.aliviar.local",
    telefone: "",
    destinatario: "para_mim",
    consentimento: true,
    website: "",
    ...sobre,
  };
}

describe("T-A-3 · o payload aceito é exatamente o conjunto aprovado", () => {
  it("a lista e o tipo não divergem (guarda estática)", () => {
    expect(FRONTEIRA_FECHADA).toBe(true);
    expect([...CAMPOS_PERMITIDOS].sort()).toEqual(
      ["consentimento", "destinatario", "email", "nome", "telefone", "website"].sort(),
    );
  });

  it.each([
    "diagnostico",
    "sintoma",
    "condicao",
    "especialidade",
    "exame",
    "documento",
    "anexo",
    "historia",
    "motivo",
    "observacao",
    "quadroClinico",
  ])("recusa o campo clínico ou narrativo `%s`", (campo) => {
    const resultado = validarSolicitacao(pedido({ [campo]: "qualquer coisa" }));
    expect(resultado.ok, `\`${campo}\` atravessou a fronteira da porta pública`).toBe(false);
  });

  it("a recusa não confirma qual campo foi sondado", () => {
    const resultado = validarSolicitacao(pedido({ diagnostico: "x" }));
    expect(resultado.ok).toBe(false);
    if (resultado.ok) return;
    expect(resultado.mensagem).not.toContain("diagnostico");
  });

  it("o valor validado não carrega nada além do conjunto", () => {
    const resultado = validarSolicitacao(pedido());
    expect(resultado.ok).toBe(true);
    if (!resultado.ok) return;
    expect(Object.keys(resultado.valor).sort()).toEqual([...CAMPOS_PERMITIDOS].sort());
  });

  it("payload que não é objeto é recusado", () => {
    for (const bruto of [null, "texto", 42, [], undefined]) {
      expect(validarSolicitacao(bruto).ok).toBe(false);
    }
  });
});

describe("T-A-8 · o consentimento é obrigatório e nunca vem pronto", () => {
  it("sem consentimento não passa", () => {
    const r = validarSolicitacao(pedido({ consentimento: false }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.campo).toBe("consentimento");
  });

  it("valor que não seja `true` estrito não passa", () => {
    for (const valor of ["true", 1, "on", null, undefined]) {
      expect(validarSolicitacao(pedido({ consentimento: valor })).ok).toBe(false);
    }
  });

});

describe("T-A-9 · o honeypot impede a criação, sem dizer que impediu", () => {
  it("campo preenchido é reconhecido como robô", () => {
    const r = validarSolicitacao(pedido({ website: "https://spam.example" }));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(pareceRobo(r.valor)).toBe(true);
  });

  it("campo vazio é gente", () => {
    const r = validarSolicitacao(pedido());
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(pareceRobo(r.valor)).toBe(false);
  });

  it("o endpoint devolve a mesma resposta ao robô — e não chama o writer", () => {
    const rota = readFileSync(path.join(RAIZ, "src/app/api/solicitacoes-atendimento/route.ts"), "utf8");
    // O corpo da função, não o bloco de imports: `pareceRobo` aparece nos dois.
    const corpo = rota.slice(rota.indexOf("export async function POST"));
    const guarda = corpo.indexOf("pareceRobo");
    const writer = corpo.indexOf("createServerSupabaseClient");
    expect(guarda, "a guarda do honeypot sumiu do corpo").toBeGreaterThan(-1);
    expect(guarda, "o honeypot é verificado DEPOIS de chamar o writer").toBeLessThan(writer);
    expect(corpo.slice(guarda, writer), "o robô cai antes do writer").toContain("return recebido();");
  });
});

describe("T-A-7 · a confirmação não promete prazo", () => {
  it("a copy de sucesso é a aprovada, e não fala em tempo", () => {
    expect(MENSAGEM_DE_SUCESSO).toBe("Recebemos. Uma pessoa da Aliviar vai procurar você.");
    for (const prazo of [/\bhoje\b/i, /\d+\s*h(oras?)?\b/i, /\bdias?\b/i, /\bútil/i, /\bem breve\b/i, /\bprazo\b/i]) {
      expect(MENSAGEM_DE_SUCESSO, `a confirmação prometeu tempo: ${prazo}`).not.toMatch(prazo);
    }
  });
});

describe("T-A-6 · a resposta não revela conta nem contato anterior", () => {
  it("o endpoint devolve só `mensagem` no caminho de sucesso", () => {
    const rota = readFileSync(path.join(RAIZ, "src/app/api/solicitacoes-atendimento/route.ts"), "utf8");
    expect(rota).toContain("NextResponse.json({ mensagem: MENSAGEM_DE_SUCESSO }, { status: 200 })");

    // A régua é o que o endpoint RESPONDE, não o que ele comenta: a doutrina
    // fala de "já existe" justamente para proibir. Comentários saem antes.
    const codigo = rota.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
    for (const proibido of ["contactId", "contato.id", "row.id", "data.id", "já existe", "já cadastr"]) {
      expect(codigo, `a resposta pública expôs \`${proibido}\``).not.toContain(proibido);
    }
  });

  it("a RPC devolve apenas boolean — não há id para vazar", () => {
    const sql = readFileSync(
      path.join(RAIZ, "supabase/migrations/20260812210000_porta_publica_solicitacao_de_atendimento.sql"),
      "utf8",
    );
    expect(sql).toMatch(/create or replace function curadoria\.solicitar_atendimento_publico[\s\S]*?returns boolean/);
  });
});

describe("T-A-15 · nem payload nem PII entram em URL ou log", () => {
  it("o endpoint não registra o pedido", () => {
    const rota = readFileSync(path.join(RAIZ, "src/app/api/solicitacoes-atendimento/route.ts"), "utf8");
    const logs = [...rota.matchAll(/console\.(log|error|warn|info)\(([\s\S]{0,200}?)\)/g)].map((m) => m[2] ?? "");
    for (const chamada of logs) {
      for (const pii of ["validado", "valor", "bruto", "json", "email", "telefone", "nome"]) {
        expect(chamada, `um log carregou \`${pii}\``).not.toContain(pii);
      }
    }
  });

  it("o método é POST, e o pedido viaja no corpo — nunca na query", () => {
    const rota = readFileSync(path.join(RAIZ, "src/app/api/solicitacoes-atendimento/route.ts"), "utf8");
    expect(rota).toContain("export async function POST");
    expect(rota, "o endpoint leu a query string").not.toContain("searchParams");
  });
});

describe("a normalização do banco espelha a do produto", () => {
  // O índice único da janela de 24 h usa a versão SQL. Se as duas divergirem, a
  // idempotência passa a valer para um conjunto e a busca para outro — e a
  // mesma pessoa vira dois contatos sem ninguém perceber.
  const sql = readFileSync(
    path.join(RAIZ, "supabase/migrations/20260812210000_porta_publica_solicitacao_de_atendimento.sql"),
    "utf8",
  );

  it("a regra do telefone é a mesma, caso a caso", () => {
    expect(normalizePhone("(11) 97903-7133")).toBe("5511979037133");
    expect(normalizePhone("11979037133")).toBe("5511979037133");
    expect(normalizePhone("+55 11 97903-7133")).toBe("5511979037133");
    expect(normalizePhone("")).toBeNull();
    // E o SQL declara os mesmos três ramos.
    expect(sql).toContain("length(digitos) >= 12 and left(digitos, 2) = '55'");
    expect(sql).toContain("length(digitos) in (10, 11)");
  });

  it("a regra do e-mail é a mesma", () => {
    expect(normalizeEmail("  Fixture@Exemplo.COM ")).toBe("fixture@exemplo.com");
    expect(normalizeEmail("   ")).toBeNull();
    expect(sql).toContain("nullif(lower(trim(coalesce(_bruto, ''))), '')");
  });
});

describe("o writer público não aceita autoridade vinda do cliente", () => {
  const sql = readFileSync(
    path.join(RAIZ, "supabase/migrations/20260812210000_porta_publica_solicitacao_de_atendimento.sql"),
    "utf8",
  );

  it("a assinatura tem cinco argumentos, e nenhum é estado, dono, paciente ou Case", () => {
    const assinatura = sql.slice(
      sql.indexOf("create or replace function curadoria.solicitar_atendimento_publico"),
      sql.indexOf("returns boolean"),
    );
    for (const proibido of ["_status", "_assigned", "_patient", "_case", "_pipeline", "_owner"]) {
      expect(assinatura, `a porta pública aceita \`${proibido}\` do cliente`).not.toContain(proibido);
    }
    expect(assinatura).toContain("_nome");
    expect(assinatura).toContain("_consentimento_versao");
  });

  it("privilégio é delimitado, não somado", () => {
    expect(sql).toContain("revoke execute on function curadoria.solicitar_atendimento_publico");
    expect(sql).toMatch(/grant execute on function curadoria\.solicitar_atendimento_publico[\s\S]*?to anon, authenticated/);
    expect(sql, "a função abriu SQL dinâmico").not.toMatch(/execute\s+format\(/i);
    expect(sql).toContain("set search_path = ''");
  });

  it("o contato nasce sem responsável, no estado canônico", () => {
    expect(sql).toContain("'new_contact'");
    expect(sql).toMatch(/null,\s*--\s*⛔ nasce SEM responsável/);
  });

  it("a idempotência é do banco, não de um `select` antes do `insert`", () => {
    expect(sql).toContain("on conflict do nothing");
    expect(sql).toContain("crm_contacts_janela_publica_email_uidx");
    expect(sql).toContain("crm_contacts_janela_publica_telefone_uidx");
  });

  it("contato já convertido não é tocado por envio público", () => {
    expect(sql).toContain("c.converted_at is not null");
  });
});

describe("T-A-13 · a solicitação pública não cria conta nem Case", () => {
  const sql = readFileSync(
    path.join(RAIZ, "supabase/migrations/20260812210000_porta_publica_solicitacao_de_atendimento.sql"),
    "utf8",
  );
  const rota = readFileSync(path.join(RAIZ, "src/app/api/solicitacoes-atendimento/route.ts"), "utf8");

  it("nada no caminho público escreve em cases, profiles ou auth", () => {
    const corpo = sql.slice(sql.indexOf("solicitar_atendimento_publico"));
    for (const tabela of ["curadoria.cases", "curadoria.profiles", "auth.users", "patient_stories"]) {
      expect(corpo, `a porta pública escreveu em \`${tabela}\``).not.toContain("into " + tabela);
    }
    expect(corpo.match(/insert into/g) ?? [], "a porta pública faz mais de um insert").toHaveLength(1);
  });

  it("o endpoint chama exatamente uma RPC, e é a da porta", () => {
    const chamadas = [...rota.matchAll(/\.rpc\("([^"]+)"/g)].map((m) => m[1]);
    expect(chamadas).toEqual(["solicitar_atendimento_publico"]);
    for (const proibido of ["admin.createUser", "signUp", "service_role", "SERVICE_ROLE"]) {
      expect(rota, `o endpoint tocou \`${proibido}\``).not.toContain(proibido);
    }
  });
});

describe("validações de forma da solicitação", () => {
  it("nome é obrigatório", () => {
    expect(validarSolicitacao(pedido({ nome: "   " })).ok).toBe(false);
  });

  it("exige e-mail OU telefone, e aceita os dois", () => {
    expect(validarSolicitacao(pedido({ email: "", telefone: "" })).ok).toBe(false);
    expect(validarSolicitacao(pedido({ email: "", telefone: "(11) 97903-7133" })).ok).toBe(true);
    expect(validarSolicitacao(pedido({ telefone: "(11) 97903-7133" })).ok).toBe(true);
  });

  it("destinatário é um dos dois valores canônicos", () => {
    expect(validarSolicitacao(pedido({ destinatario: "para_outra_pessoa" })).ok).toBe(true);
    expect(validarSolicitacao(pedido({ destinatario: "outro" })).ok).toBe(false);
  });

  it("e-mail e telefone malformados são recusados perto do campo", () => {
    const e = validarSolicitacao(pedido({ email: "sem-arroba" }));
    expect(e.ok).toBe(false);
    if (!e.ok) expect(e.campo).toBe("email");
    const t = validarSolicitacao(pedido({ email: "", telefone: "123" }));
    expect(t.ok).toBe(false);
    if (!t.ok) expect(t.campo).toBe("telefone");
  });
});

/** Usado pela suíte de integração para montar o pedido canônico. */
export const PEDIDO_SINTETICO: SolicitacaoPublica = {
  nome: "Fixture Sintética",
  email: "fixture.sintetica@validation.aliviar.local",
  telefone: "",
  destinatario: "para_mim",
  consentimento: true,
  website: "",
};
