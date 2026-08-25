import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { ACKNOWLEDGMENT_STATES } from "@/modules/curadoria/protocolos";

/**
 * ITEM 1.10B — OS QUATRO DESFECHOS, E QUEM PODE ESCREVÊ-LOS (PP-03C).
 *
 * Este arquivo verificava o contrato do DT-22 sobre `acknowledgePersonNeed` —
 * o escritor do Curador. Ele deixou de existir: gravava, pela mão dele, o ato
 * que o Método reserva a ela, e o registro dizia "reconhecida por ela" sem que
 * ninguém pudesse provar que foi ela.
 *
 * O contrato do DT-22 não mudou de conteúdo; mudou de dono e de camada. A
 * exigência do texto em `CORRIGIDA` e `RECUSADA` vive hoje na RPC
 * `acknowledge_case_need` e no CHECK do banco — dois lugares que nenhuma
 * superfície contorna. O que este arquivo passa a proteger é o que sobrou de
 * mais frágil: **que exista um escritor só**.
 *
 * A varredura é da árvore inteira, não de uma lista curada: um segundo caminho
 * aberto no futuro cai aqui, mesmo que ninguém se lembre deste teste.
 */

const RAIZ = process.cwd();
const ler = (relativo: string) => readFileSync(join(RAIZ, relativo), "utf8");

function varrer(dir: string): string[] {
  return readdirSync(join(RAIZ, dir), { withFileTypes: true }).flatMap((entrada) => {
    const caminho = `${dir}/${entrada.name}`;
    if (entrada.isDirectory()) return varrer(caminho);
    return /\.tsx?$/.test(entrada.name) ? [caminho] : [];
  });
}

/** O único caminho autorizado (PP-03A/B/C). */
const RPC = "acknowledge_case_need";
const ACTION_DELA = "src/modules/paciente/desfecho-actions.ts";

describe("PP-03C · o desfecho tem um escritor só", () => {
  const FONTES = varrer("src");

  it("a varredura cobre a árvore inteira — lista vazia passaria calada", () => {
    expect(FONTES.length).toBeGreaterThan(100);
  });

  it("exatamente um arquivo chama a RPC do desfecho", () => {
    const chamam = FONTES.filter((arquivo) => ler(arquivo).includes(`rpc("${RPC}"`));
    expect(chamam).toEqual([ACTION_DELA]);
  });

  it("o escritor concorrente do Curador não existe mais", () => {
    // Por DECLARAÇÃO, não por palavra: os dois arquivos guardam uma nota
    // explicando o que morreu ali e por quê — e a nota cita o nome de propósito.
    expect(ler("src/modules/curadoria/protocolos-repository.ts")).not.toMatch(
      /^export async function acknowledgePersonNeed/m,
    );
    expect(ler("src/modules/curadoria/protocolos-actions.ts")).not.toMatch(
      /^export async function acknowledgePersonNeedAction/m,
    );
    // E ninguém mais o importa.
    for (const arquivo of FONTES) {
      const imports = ler(arquivo)
        .split("\n")
        .filter((linha) => /^\s*(import|\s{2}acknowledgePersonNeed)/.test(linha))
        .join("\n");
      expect(imports.includes("acknowledgePersonNeed"), arquivo).toBe(false);
    }
  });

  it("a atualização do Curador não alcança `acknowledgment` nem `correction`", () => {
    // O escritor legítimo da TRADUÇÃO nomeia os dois campos ao CRIAR a linha —
    // é o nascimento dela, quando ainda não há ato para apagar. O que não pode
    // é a atualização alcançá-los: bastaria "Atualizar registro" para o
    // desfecho dela voltar a PENDENTE e o texto dela virar null.
    const repositorio = ler("src/modules/curadoria/protocolos-repository.ts");
    const inicio = repositorio.indexOf("const traducao = {");
    const traducao = repositorio.slice(inicio, repositorio.indexOf("};", inicio));

    expect(inicio, "o bloco da tradução sumiu — a varredura ficaria vazia").toBeGreaterThan(-1);
    expect(traducao).toContain("proposed_reading");
    expect(traducao.includes("acknowledgment"), "a atualização do Curador toca o desfecho").toBe(
      false,
    );
    expect(traducao.includes("correction"), "a atualização do Curador toca o texto dela").toBe(
      false,
    );
    // E o caminho da necessidade é `update`, não um `upsert` que reescreveria
    // a linha inteira. (O `upsert` de `practice_protocol_drafts`, noutra
    // função, é de outro assunto e continua onde estava.)
    const necessidade = repositorio.slice(
      repositorio.indexOf("export async function registerPersonNeed"),
      repositorio.indexOf("PP-03C — AQUI VIVIA"),
    );
    expect(necessidade.length).toBeGreaterThan(200);
    expect(necessidade.includes(".upsert("), "registerPersonNeed voltou a reescrever a linha").toBe(
      false,
    );
    expect(necessidade).toContain(".update(traducao)");
  });

  it("nenhuma superfície do Curador oferece os três desfechos", () => {
    // O painel do Protocolo saiu com a Mesa antiga (ADR-093). O ato de
    // registrar o que ela disse mora agora na LINHA da própria frase.
    const painel = ler("src/components/curadoria/mesa-preocupacoes/registrar-resposta-dela.tsx");

    for (const botao of ["Reconheceu", "Corrigiu", "Recusou"]) {
      expect(painel.includes(`>\n          ${botao}`) || painel.includes(`>${botao}<`), botao).toBe(
        false,
      );
    }
    expect(painel.includes("acknowledgePersonNeedAction")).toBe(false);
    expect(painel.includes("AcknowledgeForm")).toBe(false);
  });

  it("o Curador continua registrando a tradução e a leitura proposta", () => {
    const painel = ler("src/components/curadoria/mesa-preocupacoes/registrar-resposta-dela.tsx");

    expect(painel).toContain("registerPersonNeedAction");
    expect(painel).toContain("proposedReading");
    // A leitura nasce PENDENTE — o reconhecimento é ato dela, na jornada dela.
    expect(painel).toContain("O reconhecimento é ato dela");
  });

  // E ele continua LENDO a discordância dela: ler é dele, escrever não. Desde
  // o `SIM-48` isso mora na linha da própria frase, e não num painel separado.
  it("a discordância dela aparece ao Curador, com as palavras dela", () => {
    const comparacao = ler(
      "src/components/curadoria/mesa-preocupacoes/comparacao-por-preocupacoes.tsx",
    );

    expect(comparacao).toContain("Ela recusou esta leitura.");
    expect(comparacao).toContain("Ela corrigiu esta leitura.");
    expect(comparacao).toContain("linha.correcao");
  });

  it("a paciente continua com o caminho dela intacto", () => {
    const acao = ler(ACTION_DELA);
    expect(acao).toContain(`rpc("${RPC}"`);
    expect(acao).toContain('requireRoleForAction("paciente")');
    expect(ler("src/components/paciente/desfechos-do-conceito.tsx")).toContain(
      "registrarDesfechoAction",
    );
  });
});

describe("DT-22 · o contrato mudou de camada, não de conteúdo", () => {
  it("os quatro estados do domínio continuam os mesmos", () => {
    expect([...ACKNOWLEDGMENT_STATES]).toEqual([
      "PENDENTE",
      "RECONHECIDA",
      "CORRIGIDA",
      "RECUSADA",
    ]);
  });

  it("a exigência do texto vive na RPC — os dois que afirmam algo, e só eles", () => {
    const corpo = ler(
      "supabase/migrations/20260804170000_desfecho_da_paciente_grants_hardening.sql",
    );

    expect(corpo).toContain(
      "if _acknowledgment in ('CORRIGIDA', 'RECUSADA') and texto is null then",
    );
    expect(corpo).toContain("return 'TEXTO_OBRIGATORIO'");
    // RECONHECIDA não guarda texto: não há o que acrescentar.
    expect(corpo).toContain("if _acknowledgment = 'RECONHECIDA' then");
    expect(corpo).toContain("texto := null;");
  });

  it("o CHECK do banco segue como segunda camada", () => {
    expect(ler("supabase/migrations/20260801100000_protocolos_oficiais.sql")).toContain(
      "constraint case_needs_correcao_tem_texto",
    );
  });
});
