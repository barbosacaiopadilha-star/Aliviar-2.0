import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { CATALOGO_GERADO } from "@/modules/curadoria/catalogo-gerado";

/**
 * O ENDEREÇO CANÔNICO NAS PEÇAS DE PAPEL — guarda da simetria da Mesa.
 *
 * Os mesmos 29 conceitos são numerados de três formas diferentes: a Ficha do
 * Assistido segue a ordem da conversa, o Formulário do Profissional segue a
 * ordem de quem preenche sozinho, e a Folha da Mesa agrupa para comparar. **As
 * três ordens estão certas** — cada uma serve ao seu leitor. O que faltava era
 * um endereço comum.
 *
 * Sem ele, montar a Folha custa **116 buscas por nome** (29 linhas × 1 na Ficha
 * dela + 3 nos formulários assinados), em cinco papéis com três ordenações. Um
 * deslize de linha pareia o conceito errado, e nada no papel denuncia.
 *
 * O endereço existe desde sempre: é o `code` do Catálogo Canônico — estável,
 * único, e a chave de toda migration. Os três documentos passam a imprimi-lo.
 *
 * **Por que o teste lê o Catálogo, e não uma lista:** assim ele não guarda só o
 * que existe hoje. Conceito novo no Catálogo reprova o papel que ainda não o
 * tem — que é exatamente o defeito do `SIM-63`, resolvido pela raiz em vez de
 * por vigilância.
 */

const RAIZ = path.resolve(__dirname, "../..");

/** Os três papéis que a Mesa cruza — e é o cruzamento que exige o endereço. */
const PECAS = [
  "docs/rede/ficha-do-assistido.html",
  "docs/rede/formulario-do-profissional.html",
  "docs/rede/folha-da-mesa.html",
] as const;

const ATIVOS = CATALOGO_GERADO.filter((c) => c.active);

describe("O endereço canônico nas peças de papel", () => {
  it("os 29 conceitos ativos do Catálogo existem — senão o teste passa por vazio", () => {
    expect(ATIVOS.length).toBe(29);
  });

  it.each(PECAS)("%s imprime o código de todos os conceitos ativos", (peca) => {
    const texto = readFileSync(path.join(RAIZ, peca), "utf-8");
    const ausentes = ATIVOS.filter((c) => !texto.includes(c.code)).map((c) => `${c.code} (${c.name})`);
    expect(ausentes, `\nsem endereço em ${peca}:\n  ${ausentes.join("\n  ")}\n`).toEqual([]);
  });

  /**
   * A Ficha impressa tinha PERDIDO as cinco opções de `ACESSO_LOCAL_DE_ATENDIMENTO`
   * e mostrava só uma linha aberta. Não era decisão: era regressão do papel
   * contra o Catálogo — e caía justo na pergunta que pede um raio que ninguém
   * carrega na cabeça, quando o Catálogo já respondia **em tempo de viagem**.
   */
  it("a Ficha não perde de novo as opções que o Catálogo dá a ela", () => {
    const ficha = readFileSync(path.join(RAIZ, PECAS[0]), "utf-8");
    const local = ATIVOS.find((c) => c.code === "ACESSO_LOCAL_DE_ATENDIMENTO");
    const rotulos = (local?.paciente ?? []).flatMap((f) => (f.options ?? []).map((o) => o.label));

    expect(rotulos.length, "o Catálogo deixou de oferecer opções a ela neste conceito").toBe(5);
    const perdidos = rotulos.filter((r) => !ficha.includes(r));
    expect(perdidos, `\nopções do Catálogo ausentes na Ficha:\n  ${perdidos.join("\n  ")}\n`).toEqual([]);
  });
});
