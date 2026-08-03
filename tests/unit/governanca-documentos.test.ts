import { describe, expect, it } from "vitest";

import {
  audienciasDosPapeis,
  pendenciasDeAceite,
  permalinkDaVersao,
  versaoVigente,
  type AceiteRegistrado,
  type DocumentoLegal,
  type VersaoDeDocumento,
} from "@/modules/governanca/documentos";

/**
 * GOVERNANÇA — a mecânica de vigência e pendência, sem banco e sem texto.
 *
 * Este arquivo prova a regra que decide QUEM precisa aceitar O QUÊ. Ele não
 * depende de nenhum documento jurídico existir: a infraestrutura é entregue
 * antes dos textos, e é justamente por isso que precisa estar provada agora.
 */

const AGORA = new Date("2026-08-10T12:00:00Z");

function documento(extra: Partial<DocumentoLegal> = {}): DocumentoLegal {
  return {
    id: "doc-1",
    slug: "termos",
    nome: "Termos de Uso",
    resumo: null,
    audiencia: ["paciente"],
    obrigatorio: true,
    revogavel: false,
    ativo: true,
    ...extra,
  };
}

function versao(extra: Partial<VersaoDeDocumento> = {}): VersaoDeDocumento {
  return {
    id: "v-1",
    documentId: "doc-1",
    versao: "1.0.0",
    conteudo: "texto",
    conteudoHash: "hash-1",
    idioma: "pt-BR",
    requiresReacceptance: true,
    effectiveAt: "2026-08-01T00:00:00Z",
    publishedAt: "2026-08-01T00:00:00Z",
    ...extra,
  };
}

function aceite(extra: Partial<AceiteRegistrado> = {}): AceiteRegistrado {
  return {
    id: "a-1",
    profileId: "p-1",
    versionId: "v-1",
    conteudoHash: "hash-1",
    aceitoEm: "2026-08-02T10:00:00Z",
    origem: "primeiro_acesso",
    idioma: "pt-BR",
    contexto: {},
    revogadoEm: null,
    ...extra,
  };
}

describe("Vigência de versões", () => {
  it("vigente é a mais recente JÁ em vigor — versão futura não cobra nada", () => {
    const passada = versao({ id: "v-1", versao: "1.0.0", effectiveAt: "2026-08-01T00:00:00Z" });
    const futura = versao({ id: "v-2", versao: "2.0.0", effectiveAt: "2026-09-01T00:00:00Z" });
    expect(versaoVigente([passada, futura], AGORA)?.id).toBe("v-1");
  });

  it("sem versão publicada, não há vigente", () => {
    expect(versaoVigente([], AGORA)).toBeNull();
  });
});

describe("Audiência por papel", () => {
  it("todo papel interno cai em 'equipe' — quem lê dado clínico assume o dever", () => {
    expect(audienciasDosPapeis(["curador_medico"])).toEqual(["equipe"]);
    expect(audienciasDosPapeis(["atendente"])).toEqual(["equipe"]);
    expect(audienciasDosPapeis(["administrador"])).toEqual(["equipe"]);
  });

  it("paciente e profissional têm audiência própria; papel desconhecido não inventa nenhuma", () => {
    expect(audienciasDosPapeis(["paciente"])).toEqual(["paciente"]);
    expect(audienciasDosPapeis(["profissional"])).toEqual(["profissional"]);
    expect(audienciasDosPapeis(["papel_que_nao_existe"])).toEqual([]);
  });

  it("quem acumula papéis acumula audiências, sem repetir", () => {
    expect(audienciasDosPapeis(["curador_medico", "administrador"])).toEqual(["equipe"]);
  });
});

describe("Pendências de aceite", () => {
  const base = {
    audiencias: ["paciente"] as const,
    documentos: [documento()],
    versoesPorDocumento: new Map([["doc-1", [versao()]]]),
    agora: AGORA,
  };

  it("nunca aceitou → pendente, com o motivo dito", () => {
    const [pendencia] = pendenciasDeAceite({ ...base, aceites: [] });
    expect(pendencia.motivo).toBe("nunca_aceito");
    expect(pendencia.versao.id).toBe("v-1");
  });

  it("aceitou a vigente → nada pendente", () => {
    expect(pendenciasDeAceite({ ...base, aceites: [aceite()] })).toEqual([]);
  });

  it("aceitou e revogou → volta a pender, e o motivo diz que foi revogação", () => {
    const [pendencia] = pendenciasDeAceite({
      ...base,
      aceites: [aceite({ revogadoEm: "2026-08-05T10:00:00Z" })],
    });
    expect(pendencia.motivo).toBe("revogado");
  });

  it("versão nova MATERIAL cobra reaceite de quem já havia aceitado a anterior", () => {
    const nova = versao({ id: "v-2", versao: "2.0.0", effectiveAt: "2026-08-05T00:00:00Z", requiresReacceptance: true });
    const [pendencia] = pendenciasDeAceite({
      ...base,
      versoesPorDocumento: new Map([["doc-1", [versao(), nova]]]),
      aceites: [aceite({ versionId: "v-1" })],
    });
    expect(pendencia.motivo).toBe("versao_nova");
    expect(pendencia.versao.id).toBe("v-2");
  });

  it("versão nova EDITORIAL não incomoda quem já aceitou — é a distinção que evita ruído", () => {
    const editorial = versao({ id: "v-2", versao: "1.0.1", effectiveAt: "2026-08-05T00:00:00Z", requiresReacceptance: false });
    expect(
      pendenciasDeAceite({
        ...base,
        versoesPorDocumento: new Map([["doc-1", [versao(), editorial]]]),
        aceites: [aceite({ versionId: "v-1" })],
      }),
    ).toEqual([]);
  });

  it("documento de OUTRA audiência não é cobrado", () => {
    expect(
      pendenciasDeAceite({
        ...base,
        documentos: [documento({ audiencia: ["profissional"] })],
        aceites: [],
      }),
    ).toEqual([]);
  });

  it("documento opcional ou inativo nunca bloqueia", () => {
    expect(
      pendenciasDeAceite({ ...base, documentos: [documento({ obrigatorio: false })], aceites: [] }),
    ).toEqual([]);
    expect(
      pendenciasDeAceite({ ...base, documentos: [documento({ ativo: false })], aceites: [] }),
    ).toEqual([]);
  });

  it("documento sem versão publicada não cobra nada — a infraestrutura vem antes dos textos", () => {
    expect(
      pendenciasDeAceite({
        ...base,
        versoesPorDocumento: new Map(),
        aceites: [],
      }),
    ).toEqual([]);
  });
});

describe("Permalink de prova", () => {
  it("endereça slug e versão, com escape", () => {
    expect(permalinkDaVersao("privacidade", "2026-08-01")).toBe("/legal/privacidade/v/2026-08-01");
    expect(permalinkDaVersao("termos", "1.0 rev/2")).toBe("/legal/termos/v/1.0%20rev%2F2");
  });
});
