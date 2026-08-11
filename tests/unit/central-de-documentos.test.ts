import { describe, expect, it } from "vitest";

import type { CuradoriaRecord } from "@/modules/curadoria/cos/types";
import {
  ROTA_CONTINUAR_HISTORIA,
  ROTA_REVER_HISTORIA,
  montarCentralDeDocumentos,
  type CuradoriaDaCentral,
  type DocumentCenterItem,
  type DocumentoDaCentral,
  type EntradaDaCentral,
  type HistoriaDaCentral,
} from "@/modules/paciente/central-de-documentos";
import type { PatientDocument } from "@/modules/profiles/types";
import type { PatientStory } from "@/modules/story/types";

/**
 * D-12.2B · A CENTRAL DE DOCUMENTOS, EM FORMA DE CÓDIGO.
 *
 * O que esta suíte defende:
 *
 * - **A origem é derivada da autoria**, nunca declarada. Não existe entrada
 *   por onde o cliente pudesse pedir uma categoria.
 * - **O portão da Curadoria é `deliveredAt`, e só ele.** `emittedAt` e
 *   `presentedAt` estão na entrada exatamente para serem ignorados — e para
 *   que trocar o portão por um deles derrube um teste.
 * - **Artefato não é arquivo.** "Levar em PDF" é tela imprimível existente,
 *   e o tipo impede que vire "download".
 * - **Nada interno atravessa:** `file_path`, `uploaded_by`, `case_id`, bucket.
 * - **Sua História não é questionário** — o vocabulário faz parte do contrato.
 */

const PACIENTE = "11111111-1111-1111-1111-111111111111";
const OUTRA = "22222222-2222-2222-2222-222222222222";
const CURADOR = "33333333-3333-3333-3333-333333333333";

function documento(over: Partial<DocumentoDaCentral> = {}): DocumentoDaCentral {
  return {
    id: "doc-1",
    profileId: PACIENTE,
    uploadedBy: PACIENTE,
    fileName: "exame.pdf",
    createdAt: "2026-08-01T10:00:00Z",
    ...over,
  };
}

function curadoria(over: Partial<CuradoriaDaCentral["relatorio"]> = {}, presentedAt: string | null = null): CuradoriaDaCentral {
  return {
    relatorio: {
      emittedAt: null,
      deliveredAt: null,
      options: [{ profissional: "A" }],
      ...over,
    },
    devolutiva: { presentedAt },
  };
}

function central(over: Partial<EntradaDaCentral> = {}): DocumentCenterItem[] {
  return montarCentralDeDocumentos({
    patientProfileId: PACIENTE,
    documentos: [],
    curadoria: null,
    historia: null,
    ...over,
  });
}

const historia = (over: Partial<HistoriaDaCentral> = {}): HistoriaDaCentral => ({
  status: "rascunho",
  submittedAt: null,
  updatedAt: "2026-08-02T09:00:00Z",
  ...over,
});

describe("D-12.2B · projeção da Central de Documentos", () => {
  // -------------------------------------------------------------------------
  describe("P1–P3 · a origem nasce da autoria persistida", () => {
    it("P1 · o que ela enviou aparece em SENT_BY_PATIENT", () => {
      const [item] = central({ documentos: [documento()] });

      expect(item.category).toBe("SENT_BY_PATIENT");
      expect(item.kind).toBe("FILE");
    });

    it("P2 · o que a Aliviar depositou aparece em RECEIVED_FROM_ALIVIAR", () => {
      const [item] = central({ documentos: [documento({ uploadedBy: CURADOR })] });

      expect(item.category).toBe("RECEIVED_FROM_ALIVIAR");
    });

    it("P3 · não há entrada por onde forjar categoria — ela é sempre recalculada", () => {
      // A tentativa mais direta: mandar a categoria junto com a linha.
      const forjado = {
        ...documento({ uploadedBy: CURADOR }),
        category: "SENT_BY_PATIENT",
        kind: "PLATFORM_ARTIFACT",
      } as DocumentoDaCentral;

      const [item] = central({ documentos: [forjado] });

      // O campo enviado é ignorado: a autoria manda.
      expect(item.category).toBe("RECEIVED_FROM_ALIVIAR");
      expect(item.kind).toBe("FILE");
    });
  });

  // -------------------------------------------------------------------------
  describe("P4–P6 · o portão da Curadoria é deliveredAt, e só ele", () => {
    it("P4 · emittedAt sem deliveredAt → a Curadoria não aparece", () => {
      const itens = central({ curadoria: curadoria({ emittedAt: "2026-08-03T10:00:00Z" }) });

      expect(itens.filter((i) => i.sourceReference.kind === "curadoria")).toHaveLength(0);
    });

    it("P5 · presentedAt sem deliveredAt → a Curadoria não aparece", () => {
      const itens = central({
        curadoria: curadoria({ emittedAt: "2026-08-03T10:00:00Z" }, "2026-08-04T10:00:00Z"),
      });

      expect(itens.filter((i) => i.sourceReference.kind === "curadoria")).toHaveLength(0);
    });

    it("P6 · deliveredAt com conteúdo real → a Curadoria aparece como artefato", () => {
      const itens = central({ curadoria: curadoria({ deliveredAt: "2026-08-05T10:00:00Z" }) });
      const item = itens.find((i) => i.sourceReference.kind === "curadoria");

      expect(item).toBeDefined();
      expect(item?.category).toBe("RECEIVED_FROM_ALIVIAR");
      expect(item?.kind).toBe("PLATFORM_ARTIFACT");
      expect(item?.date).toBe("2026-08-05T10:00:00Z");
    });

    it("carimbo de entrega sobre Relatório vazio não vale — não se promete o vazio", () => {
      const itens = central({
        curadoria: curadoria({ deliveredAt: "2026-08-05T10:00:00Z", options: [] }),
      });

      expect(itens.filter((i) => i.sourceReference.kind === "curadoria")).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------------------
  describe("P7–P9 · Sua História", () => {
    it("P7 · rascunho → Continuar, na rota real", () => {
      const [item] = central({ historia: historia({ status: "rascunho" }) });

      expect(item.category).toBe("HISTORY_OR_FORM");
      expect(item.primaryAction.verb).toBe("CONTINUE");
      expect(item.primaryAction).toMatchObject({ label: "Continuar", href: ROTA_CONTINUAR_HISTORIA });
    });

    it("P8 · enviada → Rever, na rota real", () => {
      const [item] = central({
        historia: historia({ status: "enviada", submittedAt: "2026-08-06T10:00:00Z" }),
      });

      expect(item.primaryAction.verb).toBe("REVIEW");
      expect(item.primaryAction).toMatchObject({ label: "Rever", href: ROTA_REVER_HISTORIA });
      expect(item.date).toBe("2026-08-06T10:00:00Z");
    });

    it("P9 · Sua História NUNCA é chamada de questionário — em nenhum campo", () => {
      const itens = central({
        documentos: [documento(), documento({ id: "doc-2", uploadedBy: CURADOR })],
        curadoria: curadoria({ deliveredAt: "2026-08-05T10:00:00Z" }),
        historia: historia({ status: "enviada" }),
      });

      const tudo = JSON.stringify(itens).toLowerCase();
      expect(tudo).not.toContain("question");
      expect(tudo).not.toContain("formulário");
      expect(itens.some((i) => i.title === "Sua História")).toBe(true);
    });

    it("§11 · sem outro formulário real, a categoria tem só Sua História — nada fictício", () => {
      const itens = central({ historia: historia() });

      expect(itens.filter((i) => i.category === "HISTORY_OR_FORM")).toHaveLength(1);
    });
  });

  // -------------------------------------------------------------------------
  describe("P10 · download é capacidade, não botão", () => {
    it("arquivo real tem download de arquivo, emitido sob demanda", () => {
      const [item] = central({ documentos: [documento()] });

      expect(item.downloadCapability).toEqual({
        kind: "FILE_DOWNLOAD",
        available: true,
        via: "SIGNED_URL_ON_DEMAND",
      });
    });

    it("nenhum PLATFORM_ARTIFACT recebe download DE ARQUIVO", () => {
      const itens = central({
        curadoria: curadoria({ deliveredAt: "2026-08-05T10:00:00Z" }),
        historia: historia(),
      });

      const artefatos = itens.filter((i) => i.kind === "PLATFORM_ARTIFACT");
      expect(artefatos).toHaveLength(2);
      for (const item of artefatos) {
        expect(item.downloadCapability.kind).not.toBe("FILE_DOWNLOAD");
      }
    });

    it("Sua História não tem imprimível enquanto GAP-A6-Q1 estiver aberto", () => {
      const [item] = central({ historia: historia() });

      expect(item.downloadCapability).toEqual({
        kind: "NONE",
        available: false,
        reason: "NO_SAFE_PRINTABLE_REPRESENTATION",
      });
    });

    it("a Curadoria oferece a tela imprimível que JÁ existe — e não a chama de arquivo", () => {
      const itens = central({ curadoria: curadoria({ deliveredAt: "2026-08-05T10:00:00Z" }) });
      const item = itens.find((i) => i.sourceReference.kind === "curadoria");

      expect(item?.downloadCapability).toMatchObject({
        kind: "PRINTABLE_VIEW",
        available: true,
        href: "/paciente/curadoria/imprimir",
      });
    });
  });

  // -------------------------------------------------------------------------
  describe("P11 · nada interno atravessa", () => {
    it("nem caminho, nem autoria, nem Case, nem bucket saem na projeção", () => {
      const itens = central({
        documentos: [
          documento(),
          documento({ id: "doc-2", uploadedBy: CURADOR, fileName: "laudo.pdf" }),
        ],
        curadoria: curadoria({ deliveredAt: "2026-08-05T10:00:00Z" }),
        historia: historia(),
      });

      const serializado = JSON.stringify(itens);

      expect(serializado).not.toContain(CURADOR);
      expect(serializado).not.toContain("patient-documents");
      expect(serializado).not.toContain("received/");
      expect(serializado).not.toContain("file_path");
      expect(serializado).not.toContain("case_id");
      expect(serializado).not.toContain("uploaded_by");
    });

    it("a referência do arquivo é o id da linha — o handler é que resolve o caminho", () => {
      const [item] = central({ documentos: [documento()] });

      expect(item.sourceReference).toEqual({ kind: "patient_document", documentId: "doc-1" });
    });

    it("nenhuma URL assinada é materializada na projeção", () => {
      const itens = central({
        documentos: [documento()],
        curadoria: curadoria({ deliveredAt: "2026-08-05T10:00:00Z" }),
      });

      const serializado = JSON.stringify(itens);
      expect(serializado).not.toContain("token=");
      expect(serializado).not.toContain("/storage/v1/");
    });
  });

  // -------------------------------------------------------------------------
  /**
   * §17 · O mínimo para o A6 consumir esta projeção sem descobrir tarde uma
   * incompatibilidade. Nenhum loader especulativo foi criado — mas as formas
   * de entrada precisam aceitar os registros REAIS, e isso é verificado aqui
   * pelo compilador, não por confiança.
   */
  describe("compatibilidade com os registros reais", () => {
    it("um CuradoriaRecord real satisfaz a entrada da Curadoria", () => {
      const real: Pick<CuradoriaRecord, "relatorio" | "devolutiva"> = {
        relatorio: {
          options: [],
          compositionRationale: null,
          emittedAt: null,
          deliveredAt: null,
        },
        devolutiva: {
          presentedAt: null,
          patientQuestions: [],
          observations: [],
          decision: null,
          nextSteps: [],
        },
      };

      const entrada: CuradoriaDaCentral = real;
      expect(entrada.relatorio.deliveredAt).toBeNull();
    });

    it("um PatientStory real satisfaz a entrada de Sua História", () => {
      const real: Pick<PatientStory, "status" | "submittedAt" | "updatedAt"> = {
        status: "rascunho",
        submittedAt: null,
        updatedAt: "2026-08-02T09:00:00Z",
      };

      const entrada: HistoriaDaCentral = real;
      expect(entrada.status).toBe("rascunho");
    });

    /**
     * `PatientDocument` **não tem `profileId`** e **tem `filePath`**. As duas
     * diferenças são de propósito: quem adapta precisa informar a dona (que é
     * a própria viewer), e `filePath` fica de fora da entrada — a projeção não
     * pode vazar o que nunca recebe.
     */
    it("um PatientDocument real precisa de adaptação explícita, e ela não carrega o caminho", () => {
      const real: PatientDocument = {
        id: "doc-1",
        filePath: `${PACIENTE}/received/case/exame.pdf`,
        fileName: "exame.pdf",
        contentType: "application/pdf",
        fileSize: 10,
        uploadedBy: CURADOR,
        createdAt: "2026-08-01T10:00:00Z",
      };

      const adaptado: DocumentoDaCentral = {
        id: real.id,
        profileId: PACIENTE,
        uploadedBy: real.uploadedBy,
        fileName: real.fileName,
        createdAt: real.createdAt,
      };

      const [item] = central({ documentos: [adaptado] });

      expect(item.category).toBe("RECEIVED_FROM_ALIVIAR");
      expect(JSON.stringify(item)).not.toContain("received/");
      expect(Object.keys(adaptado)).not.toContain("filePath");
    });
  });

  // -------------------------------------------------------------------------
  describe("P12 · a paciente alheia fica de fora", () => {
    it("linha de outra paciente não sobrevive à projeção", () => {
      const itens = central({
        documentos: [
          documento(),
          documento({ id: "doc-de-outra", profileId: OUTRA, uploadedBy: OUTRA }),
        ],
      });

      expect(itens).toHaveLength(1);
      expect(itens[0].sourceReference).toMatchObject({ documentId: "doc-1" });
    });

    it("a Central de quem não tem nada é vazia, não é erro", () => {
      expect(central()).toEqual([]);
    });
  });
});
