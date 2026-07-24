import { describe, expect, it, beforeEach, vi } from "vitest";

import type { CrmEstadualAdapterConfig } from "../types";
import {
  buildConsultarEnvelope,
  createCrmEstadualConnector,
  createCrmEstadualConnectorWithMetrics,
  getCrmEstadualAdapterMetrics,
  isCrmEstadualConfigured,
  loadCrmEstadualConfig,
} from "../index";
import { CfmSoapClient, parseConsultarResponse } from "../cfm-soap-client";
import { CrmEstadualAdapterMetrics } from "../metrics";

const SAMPLE_RESPONSE = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <ConsultarResponse>
      <CRM>45210</CRM>
      <UF>ES</UF>
      <Nome>Dr. Ricardo Almeida</Nome>
      <Situacao>ATIVO</Situacao>
      <TipoInscricao>Principal</TipoInscricao>
      <Especialidade>Ortopedia e Traumatologia</Especialidade>
    </ConsultarResponse>
  </soap:Body>
</soap:Envelope>`;

const baseConfig: CrmEstadualAdapterConfig = {
  uf: "ES",
  apiKey: "test-key",
  seedCrms: ["45210"],
  serviceUrl: "https://example.com/soap",
  enabled: true,
  requestTimeoutMs: 1000,
};

describe("CRM Estadual Adapter", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("carrega configuração a partir de variáveis de ambiente", () => {
    const config = loadCrmEstadualConfig({
      ALICIA_CRM_ESTADUAL_UF: "es",
      ALICIA_CFM_WS_CHAVE: "secret",
      ALICIA_CRM_ESTADUAL_SEED_CRMS: "45210,51332",
    });

    expect(config.uf).toBe("ES");
    expect(config.apiKey).toBe("secret");
    expect(config.seedCrms).toEqual(["45210", "51332"]);
    expect(isCrmEstadualConfigured(config)).toBe(true);
  });

  it("aceita chave alternativa CFM_WS_CHAVE e desabilita via env", () => {
    const config = loadCrmEstadualConfig({
      CFM_WS_CHAVE: "alt-key",
      ALICIA_CRM_ESTADUAL_ENABLED: "false",
    });

    expect(config.apiKey).toBe("alt-key");
    expect(config.enabled).toBe(false);
    expect(isCrmEstadualConfigured(config)).toBe(false);
  });

  it("parseia envelope SOAP do CFM WS", () => {
    const parsed = parseConsultarResponse(SAMPLE_RESPONSE);
    expect(parsed?.crm).toBe("45210");
    expect(parsed?.nome).toBe("Dr. Ricardo Almeida");
    expect(parsed?.especialidades).toContain("Ortopedia e Traumatologia");
  });

  it("parseia especialidades separadas por vírgula e SituacaoInscricao", () => {
    const xml = `<soap:Envelope><soap:Body>
      <CRM>1</CRM><Nome>Dr. Teste</Nome>
      <SituacaoInscricao>REGULAR</SituacaoInscricao>
      <Especialidades>Cardiologia, Clínica Médica</Especialidades>
    </soap:Body></soap:Envelope>`;
    const parsed = parseConsultarResponse(xml);
    expect(parsed?.situacao).toBe("REGULAR");
    expect(parsed?.especialidades).toEqual(["Cardiologia", "Clínica Médica"]);
  });

  it("monta envelope Consultar", () => {
    const xml = buildConsultarEnvelope({ crm: "45210", uf: "ES", chave: "key" });
    expect(xml).toContain("<web:CRM>45210</web:CRM>");
    expect(xml).toContain("<web:UF>ES</web:UF>");
  });

  it("degrada graciosamente sem chave configurada", async () => {
    const connector = createCrmEstadualConnectorWithMetrics({
      config: {
        uf: "ES",
        apiKey: null,
        seedCrms: ["45210"],
        serviceUrl: "https://example.com",
        enabled: true,
        requestTimeoutMs: 1000,
      },
    });

    expect(connector.health()).toBe("DEGRADED");
    const result = await connector.fetch();
    expect(result.success).toBe(false);
    expect(result.error).toContain("Chave CFM WS");
    expect(connector.health()).toBe("DEGRADED");
  });

  it("degrada quando conector está desabilitado ou sem seeds", async () => {
    const disabled = createCrmEstadualConnectorWithMetrics({
      config: { ...baseConfig, enabled: false },
    });
    const disabledResult = await disabled.fetch();
    expect(disabledResult.success).toBe(false);
    expect(disabled.health()).toBe("OFFLINE");

    const noSeeds = createCrmEstadualConnectorWithMetrics({
      config: { ...baseConfig, seedCrms: [] },
    });
    const noSeedsResult = await noSeeds.fetch();
    expect(noSeedsResult.success).toBe(false);
    expect(noSeedsResult.error).toContain("seed");
    expect(noSeeds.health()).toBe("DEGRADED");
  });

  it("busca registros via CFM WS com client injetado", async () => {
    const transport = vi.fn(async () => ({
      status: 200,
      body: SAMPLE_RESPONSE,
    }));

    const client = new CfmSoapClient({
      serviceUrl: "https://example.com/soap",
      transport,
    });

    const metrics = new CrmEstadualAdapterMetrics();
    const connector = createCrmEstadualConnectorWithMetrics({
      config: { ...baseConfig },
      client,
      metrics,
    });

    const fetchResult = await connector.fetch();
    expect(fetchResult.success).toBe(true);
    expect(fetchResult.data).toHaveLength(1);
    expect(fetchResult.data[0]!.nome).toBe("Dr. Ricardo Almeida");

    const normalized = connector.normalize(fetchResult.data[0]!);
    expect(normalized[0]!.crm).toBe("CRM-ES 45210");
    expect(normalized[0]!.sourceType).toBe("crm-estadual");

    const adapterMetrics = getCrmEstadualAdapterMetrics(connector);
    expect(adapterMetrics?.snapshot().successes).toBe(1);
    expect(connector.health()).toBe("ONLINE");
  });

  it("trata falha SOAP como degradação do conector", async () => {
    const client = new CfmSoapClient({
      serviceUrl: "https://example.com/soap",
      transport: async () => {
        throw new Error("timeout");
      },
    });

    const connector = createCrmEstadualConnectorWithMetrics({
      config: { ...baseConfig },
      client,
    });

    const result = await connector.fetch();
    expect(result.success).toBe(false);
    expect(result.error).toContain("timeout");
    expect(connector.health()).toBe("DEGRADED");
  });

  it("trata HTTP 4xx/5xx como falha do conector", async () => {
    const client500 = new CfmSoapClient({
      serviceUrl: "https://example.com/soap",
      transport: async () => ({ status: 503, body: "" }),
    });
    await expect(
      client500.consultar({ crm: "1", uf: "ES", chave: "k" }),
    ).rejects.toThrow(/indisponível/);

    const client400 = new CfmSoapClient({
      serviceUrl: "https://example.com/soap",
      transport: async () => ({ status: 401, body: "" }),
    });
    await expect(
      client400.consultar({ crm: "1", uf: "ES", chave: "k" }),
    ).rejects.toThrow(/rejeitou/);
  });

  it("registra notFound quando CRM não retorna dados", async () => {
    const metrics = new CrmEstadualAdapterMetrics();
    const client = new CfmSoapClient({
      serviceUrl: "https://example.com/soap",
      transport: async () => ({
        status: 200,
        body: "<soap:Envelope><soap:Body></soap:Body></soap:Envelope>",
      }),
    });

    const connector = createCrmEstadualConnectorWithMetrics({
      config: { ...baseConfig },
      client,
      metrics,
    });

    const result = await connector.fetch();
    expect(result.success).toBe(false);
    expect(metrics.snapshot().notFound).toBe(1);
    expect(connector.health()).toBe("DEGRADED");
  });

  it("retorna sucesso parcial com warning quando alguns CRMs falham", async () => {
    let call = 0;
    const client = new CfmSoapClient({
      serviceUrl: "https://example.com/soap",
      transport: async () => {
        call += 1;
        if (call === 1) {
          return { status: 200, body: SAMPLE_RESPONSE };
        }
        throw new Error("falha no segundo CRM");
      },
    });

    const connector = createCrmEstadualConnectorWithMetrics({
      config: { ...baseConfig, seedCrms: ["45210", "99999"] },
      client,
    });

    const result = await connector.fetch();
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(1);
    expect(result.error).toContain("falha no segundo CRM");
    expect(connector.health()).toBe("DEGRADED");
  });

  it("normaliza confidence por situação e usa tipoInscricao como fallback", () => {
    const connector = createCrmEstadualConnectorWithMetrics({ config: { ...baseConfig } });

    const ativo = connector.normalize({
      crm: "1",
      uf: "ES",
      nome: "Dr. Ativo",
      situacao: "ATIVO",
      especialidades: ["Cardiologia"],
      fetchedAt: new Date().toISOString(),
      sourceUrl: "https://example.com",
    });
    expect(ativo[0]!.confidence).toBe(0.92);

    const aposentado = connector.normalize({
      crm: "2",
      uf: "ES",
      nome: "Dr. Aposentado",
      situacao: "APOSENTADO",
      especialidades: [],
      tipoInscricao: "Secundária",
      fetchedAt: new Date().toISOString(),
      sourceUrl: "https://example.com",
    });
    expect(aposentado[0]!.confidence).toBe(0.75);
    expect(aposentado[0]!.especialidade).toBe("Secundária");

    const outro = connector.normalize({
      crm: "3",
      uf: "ES",
      nome: "Dr. Suspenso",
      situacao: "SUSPENSO",
      especialidades: [],
      fetchedAt: new Date().toISOString(),
      sourceUrl: "https://example.com",
    });
    expect(outro[0]!.confidence).toBe(0.6);
    expect(outro[0]!.especialidade).toBe("Medicina");
  });

  it("valida registro normalizado e exige crmUf", () => {
    const connector = createCrmEstadualConnectorWithMetrics({ config: { ...baseConfig } });
    const valid = connector.normalize({
      crm: "1",
      uf: "ES",
      nome: "Dr. Teste",
      situacao: "ATIVO",
      especialidades: ["Clínica"],
      fetchedAt: new Date().toISOString(),
      sourceUrl: "https://example.com",
    });
    expect(connector.validate(valid[0]!).valid).toBe(true);

    const invalid = { ...valid[0]!, crmUf: undefined } as unknown as Parameters<
      typeof connector.validate
    >[0];
    const validation = connector.validate(invalid);
    expect(validation.valid).toBe(false);
    expect(validation.issues.some((issue) => issue.field === "crmUf")).toBe(true);
  });

  it("parseConsultarResponse retorna null quando médico não encontrado", () => {
    const empty = parseConsultarResponse("<soap:Envelope><soap:Body></soap:Body></soap:Envelope>");
    expect(empty).toBeNull();
  });

  it("parseConsultarResponse lança em fault SOAP", () => {
    expect(() =>
      parseConsultarResponse('<soap:Envelope><faultstring>Chave inválida</faultstring></soap:Envelope>'),
    ).toThrow(/Chave inválida/);
  });

  it("métricas registram reset e retornam null sem wrapper", () => {
    const metrics = new CrmEstadualAdapterMetrics();
    metrics.setConfigured(true);
    metrics.recordRequest();
    metrics.recordNotFound(10);
    metrics.recordDegraded("teste");
    expect(metrics.snapshot().notFound).toBe(1);
    expect(metrics.snapshot().degradedEvents).toBe(1);
    expect(metrics.snapshot().averageLatencyMs).toBe(10);

    metrics.reset();
    expect(metrics.snapshot().requests).toBe(0);
    expect(metrics.snapshot().configured).toBe(false);

    const plain = createCrmEstadualConnector({ config: { ...baseConfig } });
    expect(getCrmEstadualAdapterMetrics(plain)).toBeNull();
  });

  it("usa defaultTransport com fetch mockado", async () => {
    const fetchMock = vi.fn(async () => ({
      status: 200,
      text: async () => SAMPLE_RESPONSE,
    }));
    vi.stubGlobal("fetch", fetchMock);

    const client = new CfmSoapClient({
      serviceUrl: "https://example.com/soap",
      timeoutMs: 5000,
    });

    const result = await client.consultar({ crm: "45210", uf: "ES", chave: "key" });
    expect(result?.nome).toBe("Dr. Ricardo Almeida");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://example.com/soap",
      expect.objectContaining({ method: "POST" }),
    );
  });
});
