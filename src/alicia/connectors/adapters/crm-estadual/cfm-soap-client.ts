import type { CfmConsultaRequest, CfmConsultaResponse } from "./types";

export type CfmSoapTransport = (
  url: string,
  body: string,
  timeoutMs: number,
) => Promise<{ status: number; body: string }>;

export type CfmSoapClientOptions = {
  serviceUrl: string;
  timeoutMs?: number;
  transport?: CfmSoapTransport;
};

function extractTag(xml: string, tag: string): string | undefined {
  const pattern = new RegExp(`<(?:[a-zA-Z0-9]+:)?${tag}[^>]*>([\\s\\S]*?)</(?:[a-zA-Z0-9]+:)?${tag}>`, "i");
  const match = xml.match(pattern);
  return match?.[1]?.trim();
}

function extractSpecialties(xml: string): string[] {
  const values: string[] = [];
  const pattern = /<(?:[a-zA-Z0-9]+:)?Especialidade[^>]*>([\s\S]*?)<\/(?:[a-zA-Z0-9]+:)?Especialidade>/gi;
  let match = pattern.exec(xml);
  while (match) {
    const value = match[1]?.trim();
    if (value) {
      values.push(value);
    }
    match = pattern.exec(xml);
  }

  const single = extractTag(xml, "Especialidades");
  if (single && values.length === 0) {
    return single
      .split(/[,;|]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return values;
}

export function buildConsultarEnvelope(request: CfmConsultaRequest): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:web="http://servico.cfm.org.br/">
  <soapenv:Header/>
  <soapenv:Body>
    <web:Consultar>
      <web:CRM>${request.crm}</web:CRM>
      <web:UF>${request.uf}</web:UF>
      <web:ChaveIdentificacao>${request.chave}</web:ChaveIdentificacao>
    </web:Consultar>
  </soapenv:Body>
</soapenv:Envelope>`;
}

export function parseConsultarResponse(xml: string): CfmConsultaResponse | null {
  const fault = extractTag(xml, "faultstring") ?? extractTag(xml, "Fault");
  if (fault) {
    throw new Error(fault);
  }

  const crm = extractTag(xml, "CRM");
  const nome = extractTag(xml, "Nome");
  if (!crm || !nome) {
    return null;
  }

  return {
    crm,
    uf: extractTag(xml, "UF") ?? "ES",
    nome,
    situacao: extractTag(xml, "Situacao") ?? extractTag(xml, "SituacaoInscricao") ?? "DESCONHECIDA",
    tipoInscricao: extractTag(xml, "TipoInscricao"),
    especialidades: extractSpecialties(xml),
  };
}

async function defaultTransport(
  url: string,
  body: string,
  timeoutMs: number,
): Promise<{ status: number; body: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "text/xml; charset=utf-8",
        SOAPAction: "Consultar",
      },
      body,
      signal: controller.signal,
    });

    return {
      status: response.status,
      body: await response.text(),
    };
  } finally {
    clearTimeout(timeout);
  }
}

export class CfmSoapClient {
  private readonly serviceUrl: string;
  private readonly timeoutMs: number;
  private readonly transport: CfmSoapTransport;

  constructor(options: CfmSoapClientOptions) {
    this.serviceUrl = options.serviceUrl;
    this.timeoutMs = options.timeoutMs ?? 15_000;
    this.transport = options.transport ?? defaultTransport;
  }

  async consultar(request: CfmConsultaRequest): Promise<CfmConsultaResponse | null> {
    const envelope = buildConsultarEnvelope(request);
    const response = await this.transport(this.serviceUrl, envelope, this.timeoutMs);

    if (response.status >= 500) {
      throw new Error(`CFM WS indisponível (HTTP ${response.status}).`);
    }

    if (response.status >= 400) {
      throw new Error(`CFM WS rejeitou a requisição (HTTP ${response.status}).`);
    }

    return parseConsultarResponse(response.body);
  }
}
