import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  ERRO_PRAZO,
  extrairTextoDePdf,
  type TarefaDePdf,
} from "@/modules/profiles/formacao-academica-extracao";

/**
 * F-3 · O CANCELAMENTO REAL, FALSEÁVEL NOS DOIS NÍVEIS.
 *
 * Nível 1 — fake instrumentado: unicidade, ordem (destroy AGUARDADO antes de
 * o fluxo concluir), liberação em sucesso E erro, ausência de callback tardio
 * e de rejeição não tratada.
 *
 * Nível 2 — a API EFETIVAMENTE EMPACOTADA (`unpdf`/PDF.js serverless): um PDF
 * sintético que levaria segundos é cortado no prazo; `tarefa.destroyed` fica
 * `true` (neutralizar o destroy derruba ESTE teste — mutação coberta com a
 * API real); repetições não acumulam trabalho; e o motor segue são depois.
 *
 * Limite instrumental declarado (medido nas sondas da missão): o corte tem
 * granularidade de PÁGINA — dentro de uma única página o build não cede o
 * event loop. O teto de 20 MiB do bucket limita o pior átomo (~2 s medidos).
 */

// ---------------------------------------------------------------------------
// vigia de rejeições não tratadas — nenhuma prova vale com vazamento
// ---------------------------------------------------------------------------

const naoTratadas: unknown[] = [];
const capturar = (motivo: unknown) => {
  naoTratadas.push(motivo);
};

beforeEach(() => {
  naoTratadas.length = 0;
  process.on("unhandledRejection", capturar);
});

afterEach(async () => {
  // Dá vez à fila de microtasks/macrotasks antes de conferir o vigia.
  await new Promise((r) => setTimeout(r, 30));
  process.off("unhandledRejection", capturar);
  expect(naoTratadas, "rejeição não tratada escapou do cancelamento").toEqual([]);
});

// ---------------------------------------------------------------------------
// nível 1 · fake instrumentado
// ---------------------------------------------------------------------------

type Eventos = string[];

function fakeGetDocument(opcoes: {
  eventos: Eventos;
  paginas: number;
  msPorPagina: number;
  falharAbertura?: boolean;
  destroyLentoMs?: number;
}) {
  let destruida = false;
  let paginasLidas = 0;
  const tarefa: TarefaDePdf & { paginasLidas: () => number; destroys: () => number } = {
    destroyed: false,
    promise: opcoes.falharAbertura
      ? Promise.reject(new Error("abertura_quebrada"))
      : Promise.resolve({
          numPages: opcoes.paginas,
          getPage: async (n: number) => ({
            getTextContent: async () => {
              await new Promise((r) => setTimeout(r, opcoes.msPorPagina));
              if (destruida) throw new Error("transporte_destruido");
              paginasLidas = n;
              opcoes.eventos.push(`pagina:${n}`);
              return { items: [{ str: `pagina ${n}` }] };
            },
          }),
        }),
    destroy: async () => {
      opcoes.eventos.push("destroy:inicio");
      destruida = true;
      tarefa.destroyed = true;
      await new Promise((r) => setTimeout(r, opcoes.destroyLentoMs ?? 10));
      opcoes.eventos.push("destroy:fim");
    },
    paginasLidas: () => paginasLidas,
    destroys: () => opcoes.eventos.filter((e) => e === "destroy:inicio").length,
  };
  // A promessa de abertura rejeitada é consumida pelo fluxo; o vigia de
  // unhandledRejection do arquivo prova isso.
  tarefa.promise.catch(() => {});
  return tarefa;
}

describe("nível 1 · contrato do cancelamento (fake instrumentado)", () => {
  it("prazo: destroy é chamado EXATAMENTE uma vez e AGUARDADO antes de o fluxo concluir", async () => {
    const eventos: Eventos = [];
    const tarefa = fakeGetDocument({ eventos, paginas: 50, msPorPagina: 25, destroyLentoMs: 40 });

    await expect(
      extrairTextoDePdf(new Uint8Array([1]), {
        prazoMs: 60,
        obterGetDocument: async () => () => tarefa,
      }),
    ).rejects.toThrow(ERRO_PRAZO);
    eventos.push("fluxo:concluiu");

    expect(tarefa.destroys(), "destroy deve rodar uma única vez").toBe(1);
    const iInicio = eventos.indexOf("destroy:inicio");
    const iFim = eventos.indexOf("destroy:fim");
    const iConcluiu = eventos.indexOf("fluxo:concluiu");
    expect(iInicio).toBeGreaterThan(-1);
    expect(iFim, "o destroy LENTO precisa ter terminado antes do fluxo").toBeLessThan(iConcluiu);
    expect(iInicio).toBeLessThan(iFim);
  });

  it("prazo: nenhuma página avança depois do corte — sem callback tardio", async () => {
    const eventos: Eventos = [];
    const tarefa = fakeGetDocument({ eventos, paginas: 50, msPorPagina: 25 });

    await expect(
      extrairTextoDePdf(new Uint8Array([1]), {
        prazoMs: 60,
        obterGetDocument: async () => () => tarefa,
      }),
    ).rejects.toThrow(ERRO_PRAZO);

    const lidasNoCorte = tarefa.paginasLidas();
    expect(lidasNoCorte).toBeLessThan(10);

    // Se algo continuasse rodando, mais páginas apareceriam agora.
    await new Promise((r) => setTimeout(r, 200));
    expect(tarefa.paginasLidas(), "callback tardio processou página após o corte").toBe(
      lidasNoCorte,
    );
  });

  it("SUCESSO também libera: destroy uma vez, aguardado", async () => {
    const eventos: Eventos = [];
    const tarefa = fakeGetDocument({ eventos, paginas: 3, msPorPagina: 1 });

    const r = await extrairTextoDePdf(new Uint8Array([1]), {
      prazoMs: 5_000,
      obterGetDocument: async () => () => tarefa,
    });
    eventos.push("fluxo:concluiu");

    expect(r.paginas).toBe(3);
    expect(tarefa.destroys()).toBe(1);
    expect(eventos.indexOf("destroy:fim")).toBeLessThan(eventos.indexOf("fluxo:concluiu"));
  });

  it("ERRO de abertura também libera: destroy uma vez, erro original preservado", async () => {
    const eventos: Eventos = [];
    const tarefa = fakeGetDocument({ eventos, paginas: 1, msPorPagina: 1, falharAbertura: true });

    await expect(
      extrairTextoDePdf(new Uint8Array([1]), {
        prazoMs: 5_000,
        obterGetDocument: async () => () => tarefa,
      }),
    ).rejects.toThrow("abertura_quebrada");
    expect(tarefa.destroys()).toBe(1);
  });

  it("repetição de prazos não deixa trabalho acumulado observável", async () => {
    const tarefas: Array<ReturnType<typeof fakeGetDocument>> = [];
    for (let k = 0; k < 4; k += 1) {
      const eventos: Eventos = [];
      const tarefa = fakeGetDocument({ eventos, paginas: 50, msPorPagina: 25 });
      tarefas.push(tarefa);
      await expect(
        extrairTextoDePdf(new Uint8Array([1]), {
          prazoMs: 50,
          obterGetDocument: async () => () => tarefa,
        }),
      ).rejects.toThrow(ERRO_PRAZO);
    }
    const fotografia = tarefas.map((t) => t.paginasLidas());
    await new Promise((r) => setTimeout(r, 250));
    expect(
      tarefas.map((t) => t.paginasLidas()),
      "alguma execução anterior continuou trabalhando",
    ).toEqual(fotografia);
    for (const t of tarefas) expect(t.destroys()).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// nível 2 · a API efetivamente empacotada
// ---------------------------------------------------------------------------

/** PDF válido de N páginas de texto denso, gerado em memória. */
function gerarPdfSintetico(nPaginas: number, linhasPorPagina = 40): Uint8Array {
  const objetos: Array<{ n: number; corpo: string | null; stream?: string }> = [];
  const kids: string[] = [];
  let numero = 3;
  const paginas: Array<{ pageNum: number; contNum: number; stream: string }> = [];
  for (let p = 0; p < nPaginas; p += 1) {
    const pageNum = numero++;
    const contNum = numero++;
    kids.push(`${pageNum} 0 R`);
    let stream = "BT /F1 10 Tf 40 760 Td 12 TL\n";
    for (let l = 0; l < linhasPorPagina; l += 1) {
      stream += `(Linha ${l} da pagina ${p} com texto sintetico de formacao) Tj T*\n`;
    }
    stream += "ET";
    paginas.push({ pageNum, contNum, stream });
  }
  const fontNum = numero++;
  objetos.push({ n: 1, corpo: `<</Type/Catalog/Pages 2 0 R>>` });
  objetos.push({ n: 2, corpo: `<</Type/Pages/Count ${nPaginas}/Kids[${kids.join(" ")}]>>` });
  for (const pg of paginas) {
    objetos.push({
      n: pg.pageNum,
      corpo: `<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Resources<</Font<</F1 ${fontNum} 0 R>>>>/Contents ${pg.contNum} 0 R>>`,
    });
    objetos.push({ n: pg.contNum, corpo: null, stream: pg.stream });
  }
  objetos.push({ n: fontNum, corpo: `<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>` });
  objetos.sort((a, b) => a.n - b.n);
  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  for (const o of objetos) {
    offsets[o.n] = pdf.length;
    if (o.stream != null) {
      pdf += `${o.n} 0 obj<</Length ${o.stream.length}>>stream\n${o.stream}\nendstream endobj\n`;
    } else {
      pdf += `${o.n} 0 obj${o.corpo} endobj\n`;
    }
  }
  const xrefPos = pdf.length;
  const total = objetos.length + 1;
  pdf += `xref\n0 ${total}\n0000000000 65535 f \n`;
  for (let n = 1; n < total; n += 1) pdf += `${String(offsets[n]).padStart(10, "0")} 00000 n \n`;
  pdf += `trailer<</Size ${total}/Root 1 0 R>>\nstartxref\n${xrefPos}\n%%EOF`;
  return new TextEncoder().encode(pdf);
}

describe("nível 2 · comportamento com o build serverless real", () => {
  // O teto de páginas (60) é conferido logo na abertura — corretamente, e
  // ANTES do prazo. Por isso o PESADO cabe no teto e pesa nas PÁGINAS:
  // 60 páginas densas ≈ vários segundos de parse (medido ~135 ms/página com
  // 2000 linhas), e o corte por prazo é o que está sob prova.
  const PESADO = gerarPdfSintetico(60, 2000);
  const LEVE = gerarPdfSintetico(2);

  it("o prazo corta um PDF que levaria segundos — e `destroyed` fica true (mutação de destroy derruba aqui)", async () => {
    let tarefa: TarefaDePdf | null = null;
    const inicio = performance.now();
    await expect(
      extrairTextoDePdf(PESADO, {
        prazoMs: 300,
        observarTarefa: (t) => {
          tarefa = t;
        },
      }),
    ).rejects.toThrow(ERRO_PRAZO);
    const decorrido = performance.now() - inicio;

    expect(decorrido, "o corte precisa chegar perto do prazo, não do parse inteiro").toBeLessThan(
      2_000,
    );
    expect(tarefa, "o gancho de observação não recebeu a tarefa").not.toBeNull();
    expect(
      (tarefa as unknown as TarefaDePdf).destroyed,
      "a tarefa do PDF.js NÃO foi destruída — o cancelamento virou espera",
    ).toBe(true);
  }, 30_000);

  it("três prazos seguidos: nenhum acúmulo — cada corte fecha rápido", async () => {
    for (let k = 0; k < 3; k += 1) {
      const inicio = performance.now();
      await expect(extrairTextoDePdf(PESADO, { prazoMs: 250 })).rejects.toThrow(ERRO_PRAZO);
      expect(performance.now() - inicio).toBeLessThan(2_000);
    }
  }, 30_000);

  it("depois dos cortes o motor segue são: um PDF normal extrai e também destrói a tarefa", async () => {
    let tarefa: TarefaDePdf | null = null;
    const r = await extrairTextoDePdf(LEVE, {
      prazoMs: 8_000,
      observarTarefa: (t) => {
        tarefa = t;
      },
    });
    expect(r.paginas).toBe(2);
    expect(r.texto).toContain("texto sintetico de formacao");
    expect((tarefa as unknown as TarefaDePdf).destroyed, "sucesso também libera").toBe(true);
  }, 30_000);
});
