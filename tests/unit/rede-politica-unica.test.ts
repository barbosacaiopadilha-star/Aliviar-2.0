import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it, vi } from "vitest";

// `rede-policy` consulta o banco e é `server-only` — o marcador não existe
// fora do runtime do Next, e é só isso que este mock neutraliza.
vi.mock("server-only", () => ({}));

const { listCriticalDivergenceBlocklist } = await import("@/modules/curadoria/rede-policy");

/**
 * NC-22 — A MESA APLICA A MESMA POLÍTICA DA REDE.
 *
 * A certificação dinâmica reproduziu um profissional publicado, com
 * divergência crítica em aberto, aparecendo para classificação na Mesa e
 * ausente da Rede aprovada. Dois universos para a mesma pergunta.
 *
 * Estes testes fixam a correção nos dois planos: a regra existe uma vez só, e
 * a Mesa a aplica na construção da Rede — antes de qualquer classificação, de
 * modo que a seleção dos três caminhos e o COS herdem o mesmo universo.
 */

/** Comentário que EXPLICA a regra cita o vocabulário de propósito. */
function semComentarios(fonte: string): string {
  return fonte
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .filter((linha) => !linha.trimStart().startsWith("//"))
    .join("\n");
}

const ler = (relativo: string) =>
  semComentarios(readFileSync(join(process.cwd(), relativo), "utf8"));

/** Cliente mínimo: devolve o que cada tabela responderia. */
function supabaseFake(divergentes: string[]) {
  const chamadas: Record<string, unknown>[] = [];
  const cliente = {
    chamadas,
    from(tabela: string) {
      const filtros: Record<string, unknown> = { tabela };
      chamadas.push(filtros);
      const encadeavel = {
        select() {
          return encadeavel;
        },
        eq(coluna: string, valor: unknown) {
          filtros[coluna] = valor;
          return encadeavel;
        },
        then(resolve: (r: { data: unknown[] }) => void) {
          resolve({
            data:
              tabela === "verification_divergences"
                ? divergentes.map((id) => ({ professional_profile_id: id }))
                : [],
          });
        },
      };
      return encadeavel;
    },
  };
  return cliente;
}

describe("A regra existe uma vez só", () => {
  it("a consulta de divergência crítica vive apenas em rede-policy.ts", () => {
    const policy = ler("src/modules/curadoria/rede-policy.ts");
    expect(policy).toContain('from("verification_divergences")');
    expect(policy).toContain('eq("severity", "critica")');

    // Quem monta Rede não repete a consulta — pergunta à política.
    for (const relativo of [
      "src/modules/curadoria/repository.ts",
      "src/modules/curadoria/mesa-cruzamento.ts",
    ]) {
      const texto = ler(relativo);
      expect(texto.includes('from("verification_divergences")'), relativo).toBe(false);
      expect(texto, relativo).toContain("listCriticalDivergenceBlocklist");
    }
  });

  it("a política devolve o conjunto de bloqueados, e só o que está aberto e crítico", async () => {
    const cliente = supabaseFake(["prof-1", "prof-2"]);
    // @ts-expect-error — cliente mínimo, só o que a função usa
    const bloqueados = await listCriticalDivergenceBlocklist(cliente);

    expect(bloqueados.has("prof-1")).toBe(true);
    expect(bloqueados.has("prof-2")).toBe(true);
    expect(bloqueados.has("prof-3")).toBe(false);

    const consulta = cliente.chamadas.find((c) => c.tabela === "verification_divergences")!;
    expect(consulta.status).toBe("aberta");
    expect(consulta.severity).toBe("critica");
  });

  it("sem divergência aberta, ninguém é bloqueado", async () => {
    const cliente = supabaseFake([]);
    // @ts-expect-error — cliente mínimo
    const bloqueados = await listCriticalDivergenceBlocklist(cliente);
    expect(bloqueados.size).toBe(0);
  });
});

describe("A Mesa aplica a política na construção da Rede", () => {
  const mesa = ler("src/modules/curadoria/mesa-cruzamento.ts");

  it("o bloqueio acontece antes da classificação, não depois", () => {
    const posicaoFiltro = mesa.indexOf("bloqueados.has(row.id as string)");
    const posicaoClassificacao = mesa.indexOf("classifyProfessional(");
    expect(posicaoFiltro).toBeGreaterThan(0);
    expect(posicaoFiltro).toBeLessThan(posicaoClassificacao);
  });

  it("a lista classificada é a filtrada — nenhum caminho usa a Rede crua", () => {
    expect(mesa).toContain("const professionals: MesaProfessional[] = providers.map(");
    // `providerRows` só existe dentro da desestruturação da consulta.
    const usos = mesa.split("providerRows").length - 1;
    expect(usos).toBe(2); // a desestruturação e o filtro que produz `providers`
  });

  it("os demais filtros da Rede permanecem exatamente iguais", () => {
    for (const filtro of [
      'eq("status", "ativo")',
      'eq("is_demo", false)',
      'eq("is_test_fixture", isCertification)',
      'eq("publication_status", "publicado")',
    ]) {
      expect(mesa, filtro).toContain(filtro);
    }
  });
});

describe("Os três consumidores herdam o mesmo universo", () => {
  it("CAMINHOS e COS leem a Rede pela Mesa, sem consulta própria", () => {
    const cos = ler("src/modules/curadoria/cos/repository.ts");
    const page = ler("src/app/portal-curador/casos/[id]/curadoria_tecnica/page.tsx");

    // O COS consulta `professional_profiles` só para resolver nome canônico de
    // quem já saiu da Rede (M3) — nunca para montar universo. Quem monta Rede
    // filtra por publicação; esse lookup é por id.
    expect(cos).toContain("loadMesaCruzamento");
    expect(cos.includes('eq("publication_status"'), "COS monta Rede própria").toBe(false);
    expect(cos).toContain('.in("id", idsForaDaRede)');

    expect(page).toContain("loadMesaCruzamento");
    expect(page.includes('from("professional_profiles")'), "página monta Rede própria").toBe(false);
    // A seleção nasce da comparação, que nasce dos elegíveis já filtrados.
    expect(page).toContain("candidatosDaSelecao(view.comparison");
  });
});
