// =============================================================================
// REGRESSÃO — revalidatePath só aponta para caminhos que EXISTEM.
//
// O defeito real (Release de Reconstrução, PASSO 8): a paciente confirmava o
// Perfil, o RPC persistia `VALIDATED`, e a home continuava dizendo "falta
// você reconhecer". A action revalidava `/portal-paciente` — que a Decisão A
// (ONE ALIVIAR, 2026-07-25) transformou em redirect permanente. Revalidar um
// redirect não toca página nenhuma: o ato dela persistia no banco e a tela
// dela ficava velha.
//
// Este teste varre o código executável por revalidatePath de caminhos
// aposentados. Se um voltar, falha aqui, nomeando o arquivo.
// =============================================================================
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const SRC = path.resolve(__dirname, "../../src");

// Caminhos que são redirect/rewrite de compatibilidade ou que simplesmente
// não existem como página. Revalidá-los é um no-op silencioso.
// "/paciente/prioridades" nunca foi rota: as superfícies reais são
// /paciente/perfil e /portal-paciente/prioridades (PASSO 8, 2026-08-02).
const APOSENTADOS = ["/portal-paciente", "/paciente/prioridades"];

function arquivos(dir: string, acc: string[] = []): string[] {
  for (const nome of readdirSync(dir)) {
    const caminho = path.join(dir, nome);
    if (statSync(caminho).isDirectory()) arquivos(caminho, acc);
    else if (/\.tsx?$/.test(nome)) acc.push(caminho);
  }
  return acc;
}

function codigoSemComentarios(arquivo: string): string {
  return readFileSync(arquivo, "utf-8")
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");
}

describe("revalidatePath aponta para páginas vigentes", () => {
  it("nenhuma action revalida caminho aposentado", () => {
    const violacoes: string[] = [];
    for (const arquivo of arquivos(SRC)) {
      const codigo = codigoSemComentarios(arquivo);
      if (!codigo.includes("revalidatePath")) continue;
      for (const aposentado of APOSENTADOS) {
        const padrao = new RegExp(
          String.raw`revalidatePath\(\s*[\x60"']` + aposentado.replaceAll("/", "\\/"),
        );
        if (padrao.test(codigo)) {
          violacoes.push(path.relative(SRC, arquivo).replace(/\\/g, "/") + " → " + aposentado);
        }
      }
    }
    expect(
      violacoes,
      "revalidar um redirect é um no-op: a página real fica velha e o usuário não vê o próprio ato",
    ).toEqual([]);
  });

  // ===========================================================================
  // PASSO 8, 5ª camada (2026-08-02): QUALQUER revalidatePath dentro de
  // reconhecerPerfilAction faz o Next embutir a re-renderização da página
  // corrente (/paciente) na resposta do POST — e esse stream nunca fecha:
  // "Registrando…" eterno com o RPC já VALIDATED no banco. Provado em três
  // variantes (revalidar /paciente; revalidar só outras rotas; zero
  // revalidação — só a última fecha o stream). Como nenhuma rota do paciente
  // é estática, revalidar também não compra nada: a página corrente atualiza
  // por router.refresh() do CLIENTE, depois do retorno da action.
  // ===========================================================================
  it("reconhecerPerfilAction não chama revalidatePath (o stream do POST nunca fecharia)", () => {
    const arquivo = path.join(SRC, "modules/paciente/reconhecimento-actions.ts");
    const codigo = codigoSemComentarios(arquivo);
    expect(
      codigo.includes("revalidatePath"),
      "revalidatePath aqui reabre o defeito do 'Registrando…' eterno — a atualização é do cliente, via router.refresh() após o retorno",
    ).toBe(false);
  });

  // RECONHECE-REFRESH-001: router.refresh() nesta superfície NÃO commita a
  // árvore nova (Next 15.5.20; flight completo chega e a UI congela em
  // "Registrando…"). A atualização é navegação de documento completa, e só
  // DEPOIS de a action retornar.
  it("a atualização é navegação de documento, depois do retorno da action", () => {
    const arquivo = path.join(SRC, "components/paciente/reconhecer-perfil.tsx");
    const codigo = codigoSemComentarios(arquivo);
    const posAwait = codigo.indexOf("await reconhecerPerfilAction");
    const posReload = codigo.indexOf("window.location.reload()");
    expect(posAwait, "o componente deve aguardar a action").toBeGreaterThan(-1);
    expect(
      posReload,
      "a atualização deve ser navegação de documento (RECONHECE-REFRESH-001)",
    ).toBeGreaterThan(-1);
    expect(
      posReload,
      "recarregar antes de a action retornar perderia o resultado e recriaria a corrida",
    ).toBeGreaterThan(posAwait);
    expect(
      codigo.includes("router.refresh()"),
      "router.refresh() aqui congela em 'Registrando…' — ver RECONHECE-REFRESH-001",
    ).toBe(false);
  });
});
