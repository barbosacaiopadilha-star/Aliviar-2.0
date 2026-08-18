import { describe, expect, it } from "vitest";

import {
  extrairTextoDePdf,
  montarTextoDaPagina,
  normalizarTextoDasPaginas,
  seccionarFormacao,
  type ItemDeTexto,
} from "@/modules/profiles/formacao-academica-extracao";

/**
 * R-1 · A ESTRUTURA DE LINHAS DO PDF SOBREVIVE À EXTRAÇÃO.
 *
 * O bug: `items.map(i => i.str).join(" ")` apagava as quebras que o PDF.js
 * entrega via `hasEOL` e injetava espaços — as quatro formações de um
 * currículo viravam UMA linha, e título/instituição/período de linhas
 * vizinhas se contaminavam.
 *
 * O oráculo aqui NÃO usa fixture com `\n` pronto: um PDF sintético REAL, com
 * as formações em linhas separadas (operador `T*`), atravessa a API
 * empacotada do unpdf e só então chega ao `seccionarFormacao`. A mutação que
 * voltar à montagem antiga morre nos testes de contagem e contaminação.
 */

// ---------------------------------------------------------------------------
// gerador de PDF real: cada string de `linhas` vira UMA linha via T*
// ---------------------------------------------------------------------------

function gerarPdfDeLinhas(paginasDeLinhas: string[][]): Uint8Array {
  const objetos: Array<{ n: number; corpo: string | null; stream?: string }> =
    [];
  const kids: string[] = [];
  let numero = 3;
  const paginas: Array<{ pageNum: number; contNum: number; stream: string }> =
    [];
  for (const linhas of paginasDeLinhas) {
    const pageNum = numero++;
    const contNum = numero++;
    kids.push(`${pageNum} 0 R`);
    let stream = "BT /F1 10 Tf 40 760 Td 14 TL\n";
    for (const linha of linhas) {
      stream += `(${linha.replace(/([()\\])/g, "\\$1")}) Tj T*\n`;
    }
    stream += "ET";
    paginas.push({ pageNum, contNum, stream });
  }
  const fontNum = numero++;
  objetos.push({ n: 1, corpo: `<</Type/Catalog/Pages 2 0 R>>` });
  objetos.push({
    n: 2,
    corpo: `<</Type/Pages/Count ${paginasDeLinhas.length}/Kids[${kids.join(" ")}]>>`,
  });
  for (const pg of paginas) {
    objetos.push({
      n: pg.pageNum,
      corpo: `<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Resources<</Font<</F1 ${fontNum} 0 R>>>>/Contents ${pg.contNum} 0 R>>`,
    });
    objetos.push({ n: pg.contNum, corpo: null, stream: pg.stream });
  }
  objetos.push({
    n: fontNum,
    corpo: `<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>`,
  });
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
  for (let n = 1; n < total; n += 1)
    pdf += `${String(offsets[n]).padStart(10, "0")} 00000 n \n`;
  pdf += `trailer<</Size ${total}/Root 1 0 R>>\nstartxref\n${xrefPos}\n%%EOF`;
  return new TextEncoder().encode(pdf);
}

const LINHAS_DO_CV = [
  "Formacao Academica",
  "Graduacao em Medicina - Universidade Federal de Minas Gerais, 2004-2010",
  "Residencia em Clinica Medica - Hospital das Clinicas da UFMG, 2010-2013",
  "Especializacao em Reumatologia - Universidade de Sao Paulo, 2014",
  "Fellowship em Doencas Autoimunes - Instituto Karolinska, 2016-2017",
];

const CV_UMA_PAGINA = gerarPdfDeLinhas([LINHAS_DO_CV]);
const CV_DUAS_PAGINAS = gerarPdfDeLinhas([
  LINHAS_DO_CV.slice(0, 3), // cabeçalho + graduação + residência
  LINHAS_DO_CV.slice(3), // especialização + fellowship
]);

const ESPERADOS: Array<{
  kind: string;
  tituloContem: string;
  instituicao: string;
  naoContem: string;
}> = [
  {
    kind: "graduacao",
    tituloContem: "Graduacao em Medicina",
    instituicao: "Universidade Federal de Minas Gerais",
    naoContem: "Residencia",
  },
  {
    kind: "residencia",
    tituloContem: "Residencia em Clinica Medica",
    instituicao: "Hospital das Clinicas da UFMG",
    naoContem: "Especializacao",
  },
  {
    kind: "especializacao",
    tituloContem: "Especializacao em Reumatologia",
    instituicao: "Universidade de Sao Paulo",
    naoContem: "Fellowship",
  },
  {
    kind: "fellowship",
    tituloContem: "Fellowship em Doencas Autoimunes",
    instituicao: "Instituto Karolinska",
    naoContem: "Graduacao",
  },
];

function conferirCandidatos(candidatos: Array<Record<string, unknown>>) {
  expect(
    candidatos,
    "exatamente quatro formações — uma por linha",
  ).toHaveLength(4);
  for (const esperado of ESPERADOS) {
    const candidato = candidatos.find((c) => c.kind === esperado.kind);
    expect(candidato, `tipo ausente: ${esperado.kind}`).toBeDefined();
    const titulo = String(candidato!.title);
    expect(titulo).toContain(esperado.tituloContem);
    expect(
      titulo.includes(esperado.naoContem),
      `${esperado.kind} engoliu texto da linha vizinha ("${esperado.naoContem}")`,
    ).toBe(false);
    expect(candidato!.institution).toBe(esperado.instituicao);
  }
}

describe("R-1 · montagem de página (unidade, semântica do extractText instalado)", () => {
  it("hasEOL vira quebra; item sem str é ignorado; o join é vazio", () => {
    const itens: ItemDeTexto[] = [
      { str: "Titulo ", hasEOL: false },
      { str: "da linha", hasEOL: true },
      { str: null },
      { str: "Segunda linha", hasEOL: true },
    ];
    expect(montarTextoDaPagina(itens)).toBe("Titulo da linha\nSegunda linha\n");
  });

  it("páginas se separam por quebra e a normalização preserva linhas", () => {
    expect(normalizarTextoDasPaginas(["a  b\nc ", " d"])).toBe("a b\nc\nd");
  });
});

describe("R-1 · o PDF real, pela API empacotada, até o seccionador", () => {
  it("uma página multilinha: 4 candidatos, tipos, títulos e instituições corretos, sem contaminação", async () => {
    const { texto, paginas } = await extrairTextoDePdf(CV_UMA_PAGINA, {
      prazoMs: 8_000,
    });
    expect(paginas).toBe(1);

    // As quebras do PDF sobrevivem: cada linha do CV é uma linha do texto.
    const linhas = texto
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    for (const linha of LINHAS_DO_CV) {
      expect(linhas, `linha perdida ou fundida: "${linha}"`).toContain(linha);
    }

    conferirCandidatos(
      seccionarFormacao(texto) as Array<Record<string, unknown>>,
    );
  }, 30_000);

  it("multipágina: a separação de páginas não funde nem perde formação", async () => {
    const { texto, paginas } = await extrairTextoDePdf(CV_DUAS_PAGINAS, {
      prazoMs: 8_000,
    });
    expect(paginas).toBe(2);

    // A primeira linha da página 2 continua sendo linha própria.
    const linhas = texto.split("\n").map((l) => l.trim());
    expect(linhas).toContain(
      "Especializacao em Reumatologia - Universidade de Sao Paulo, 2014",
    );
    // E a última da página 1 não a engoliu.
    const daResidencia = linhas.find((l) => l.startsWith("Residencia"));
    expect(daResidencia).toBeDefined();
    expect(daResidencia!.includes("Especializacao")).toBe(false);

    conferirCandidatos(
      seccionarFormacao(texto) as Array<Record<string, unknown>>,
    );
  }, 30_000);

  it("equivalência normalizada com o `extractText` do próprio unpdf instalado", async () => {
    const { extractText, getDocumentProxy } = await import("unpdf");
    const proxy = await getDocumentProxy(CV_UMA_PAGINA.slice());
    const deles = await extractText(proxy, { mergePages: true });

    const nosso = await extrairTextoDePdf(CV_UMA_PAGINA, { prazoMs: 8_000 });
    expect(nosso.texto.trim()).toBe(String(deles.text).trim());
  }, 30_000);

  it("MUTAÇÃO: a montagem antiga (join com espaço, ignorando hasEOL) é morta pelo oráculo", async () => {
    // Os MESMOS itens reais, montados do jeito antigo — sem quebra nenhuma.
    const { getResolvedPDFJS } = await import("unpdf");
    const pdfjs = await getResolvedPDFJS();
    const tarefa = (
      pdfjs.getDocument as (p: Record<string, unknown>) => {
        promise: Promise<{
          getPage: (
            n: number,
          ) => Promise<{
            getTextContent: () => Promise<{ items: ItemDeTexto[] }>;
          }>;
        }>;
        destroy: () => Promise<void>;
      }
    )({
      data: CV_UMA_PAGINA.slice(),
      useWorkerFetch: false,
      isEvalSupported: false,
    });
    try {
      const doc = await tarefa.promise;
      const { items } = await (await doc.getPage(1)).getTextContent();

      const mutante = items.map((i) => i.str ?? "").join(" ") + "\n";
      const candidatosMutantes = seccionarFormacao(mutante) as Array<
        Record<string, unknown>
      >;

      // O mutante funde o currículo numa linha só: a contagem de 4 morre — a
      // MESMA asserção que protege o caminho novo. `conferirCandidatos`
      // aplicada ao mutante falharia; aqui provamos o modo de falha:
      expect(candidatosMutantes).not.toHaveLength(4);

      // E o caminho NOVO, sobre o MESMO PDF, passa inteiro:
      const { texto } = await extrairTextoDePdf(CV_UMA_PAGINA, {
        prazoMs: 8_000,
      });
      conferirCandidatos(
        seccionarFormacao(texto) as Array<Record<string, unknown>>,
      );
    } finally {
      await tarefa.destroy();
    }
  }, 30_000);
});
