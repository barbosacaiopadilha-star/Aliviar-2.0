import { describe, expect, it } from "vitest";

import {
  ACCEPT_DE_DOCUMENTO,
  TAMANHO_MAXIMO_DOCUMENTO_BYTES,
  nomeDeArquivoParaCaminho,
  validarArquivoDeDocumento,
} from "@/modules/profiles/document-file-policy";

/**
 * D-12.2 · A ALLOWLIST, EM FORMA DE CÓDIGO.
 *
 * Antes desta fatia os writers aceitavam qualquer arquivo com `size > 0` e
 * gravavam `content_type` direto de `file.type`. A decisão do DT-01 fixou
 * 20 MB, PDF e imagens, e `content_type` vazio recusado — para os DOIS
 * writers.
 *
 * O que esta suíte defende, e o que quebra se alguém afrouxar:
 *
 * - **O teto existe** e vale em bytes, não em promessa.
 * - **A lista é fechada.** Tipo fora dela não entra, mesmo bem-comportado.
 * - **Tipo vazio não passa.** Sem tipo não há o que conferir.
 * - **Os BYTES mandam, não a etiqueta.** Um executável anunciado como PDF é
 *   recusado — a garantia que separa allowlist de rótulo.
 * - **O nome não mexe no caminho.** `foldername()[1..3]` é como as policies
 *   da D-12.1 leem dona, namespace e Case; um nome com barra deslocaria isso.
 */

const PDF = [0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37];
const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const JPEG = [0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46];

/** RIFF + 4 bytes de tamanho + WEBP. */
const WEBP = [0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50];

/** ISO-BMFF: 4 bytes de tamanho, "ftyp", marca "heic". */
const HEIC = [
  0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x68, 0x65, 0x69, 0x63,
];

/** MZ — cabeçalho de executável do Windows. */
const EXECUTAVEL = [0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00];

function arquivo(bytes: number[], nome: string, tipo: string, tamanhoTotal?: number): File {
  const corpo = new Uint8Array(tamanhoTotal ?? bytes.length);
  corpo.set(bytes, 0);
  return new File([corpo], nome, { type: tipo });
}

describe("D-12.2 · allowlist de documentos", () => {
  describe("o que entra", () => {
    it.each([
      ["PDF", PDF, "exame.pdf", "application/pdf"],
      ["PNG", PNG, "exame.png", "image/png"],
      ["JPEG", JPEG, "exame.jpg", "image/jpeg"],
      ["WebP", WEBP, "exame.webp", "image/webp"],
      // HEIC é o padrão do iPhone: sem ele, a foto que ela tira do exame é
      // recusada e ela não tem como saber por quê.
      ["HEIC", HEIC, "exame.heic", "image/heic"],
    ])("aceita %s e devolve o tipo conferido", async (_rotulo, bytes, nome, tipo) => {
      const resultado = await validarArquivoDeDocumento(arquivo(bytes, nome, tipo));

      expect(resultado.aceito).toBe(true);
      if (resultado.aceito) expect(resultado.contentType).toBe(tipo);
    });

    it("aceita exatamente no teto — o limite é inclusivo", async () => {
      const noTeto = arquivo(PDF, "no-teto.pdf", "application/pdf", TAMANHO_MAXIMO_DOCUMENTO_BYTES);

      await expect(validarArquivoDeDocumento(noTeto)).resolves.toMatchObject({ aceito: true });
    });
  });

  describe("o que não entra", () => {
    it("recusa arquivo vazio", async () => {
      const resultado = await validarArquivoDeDocumento(
        new File([], "vazio.pdf", { type: "application/pdf" }),
      );

      expect(resultado.aceito).toBe(false);
    });

    it("recusa acima do teto, e diz o tamanho em vez de falhar adiante", async () => {
      const grande = arquivo(
        PDF,
        "grande.pdf",
        "application/pdf",
        TAMANHO_MAXIMO_DOCUMENTO_BYTES + 1,
      );

      const resultado = await validarArquivoDeDocumento(grande);

      expect(resultado.aceito).toBe(false);
      if (!resultado.aceito) expect(resultado.erro).toContain("20 MB");
    });

    it("recusa content_type vazio — decisão do DT-01", async () => {
      const semTipo = arquivo(PDF, "sem-tipo.pdf", "");

      await expect(validarArquivoDeDocumento(semTipo)).resolves.toMatchObject({ aceito: false });
    });

    it.each([
      ["texto", "text/plain"],
      ["documento do Word", "application/msword"],
      ["arquivo compactado", "application/zip"],
      ["executável", "application/x-msdownload"],
    ])("recusa %s — a lista é fechada", async (_rotulo, tipo) => {
      await expect(
        validarArquivoDeDocumento(arquivo(PDF, "arquivo", tipo)),
      ).resolves.toMatchObject({ aceito: false });
    });
  });

  /**
   * O coração da allowlist. `file.type` é declarado pelo CLIENTE — sem esta
   * conferência, a lista seria etiqueta, e o valor mentido ainda seria
   * gravado em `content_type` e viraria o `Content-Type` do download.
   */
  describe("os bytes mandam, não a etiqueta", () => {
    it("recusa executável anunciado como PDF", async () => {
      const disfarcado = arquivo(EXECUTAVEL, "exame.pdf", "application/pdf");

      const resultado = await validarArquivoDeDocumento(disfarcado);

      expect(resultado.aceito).toBe(false);
      if (!resultado.aceito) expect(resultado.erro).toContain("não parece ser do tipo");
    });

    it("recusa PNG anunciado como PDF — troca dentro da própria lista também não passa", async () => {
      await expect(
        validarArquivoDeDocumento(arquivo(PNG, "exame.pdf", "application/pdf")),
      ).resolves.toMatchObject({ aceito: false });
    });

    it("recusa arquivo curto demais para ter assinatura", async () => {
      await expect(
        validarArquivoDeDocumento(arquivo([0x25], "curto.pdf", "application/pdf")),
      ).resolves.toMatchObject({ aceito: false });
    });
  });

  /**
   * O nome entra no CAMINHO do objeto, e o caminho é o que as policies da
   * D-12.1 leem por posição: [1] dona, [2] namespace, [3] Case.
   */
  describe("o nome não mexe na estrutura do caminho", () => {
    // Em todos os casos sobra APENAS o nome final: a travessia não é
    // "neutralizada", ela é descartada. `../../outro-perfil/` não vira parte
    // do nome — some.
    it.each([
      ["../../outro-perfil/exame.pdf", "exame.pdf"],
      ["pasta/subpasta/exame.pdf", "exame.pdf"],
      ["C:\\Users\\alguem\\exame.pdf", "exame.pdf"],
    ])("descarta o diretório embutido em %s", (nome, esperado) => {
      const seguro = nomeDeArquivoParaCaminho(nome);

      expect(seguro).not.toContain("/");
      expect(seguro).not.toContain("\\");
      expect(seguro).toBe(esperado);
    });

    it("preserva acentos — o nome é dela", () => {
      expect(nomeDeArquivoParaCaminho("ressonância-abdômen.pdf")).toBe("ressonância-abdômen.pdf");
    });

    it("nunca devolve vazio, mesmo quando não sobra nada", () => {
      expect(nomeDeArquivoParaCaminho("///")).toBe("documento");
      expect(nomeDeArquivoParaCaminho("...")).toBe("documento");
    });

    it("não deixa o nome começar por ponto nem virar arquivo oculto", () => {
      expect(nomeDeArquivoParaCaminho(".oculto.pdf")).toBe("oculto.pdf");
    });
  });

  it("a UI lê a mesma lista — nenhuma cópia paralela", () => {
    expect(ACCEPT_DE_DOCUMENTO).toContain("application/pdf");
    expect(ACCEPT_DE_DOCUMENTO).toContain("image/heic");
    expect(ACCEPT_DE_DOCUMENTO).not.toContain("text/plain");
  });
});
