/**
 * A PORTA PÚBLICA — o contrato fechado da solicitação de atendimento.
 *
 * Este módulo é a fronteira: o que não está no tipo `SolicitacaoPublica` não
 * atravessa, e a lista `CAMPOS_PERMITIDOS` é a mesma coisa dita em runtime.
 * As duas se cobram por igualdade bidirecional em tempo de compilação, para que
 * acrescentar um campo ao produto sem acrescentá-lo aqui não compile.
 *
 * ⛔ **Nada de saúde nesta porta.** Sem diagnóstico, sintoma, condição,
 * especialidade, exame, documento, anexo, história ou texto livre. A pessoa
 * conta o essencial para ser procurada; o resto é conversa com gente.
 *
 * ⛔ **Nenhum estado, dono, paciente ou Case vem do cliente.** A assinatura da
 * RPC não tem onde recebê-los.
 */

/** O conjunto fechado. Acrescentar campo aqui é decisão, nunca acidente. */
export const CAMPOS_PERMITIDOS = [
  "nome",
  "email",
  "telefone",
  "destinatario",
  "consentimento",
  "website",
] as const;

export type CampoPermitido = (typeof CAMPOS_PERMITIDOS)[number];

export const DESTINATARIOS = ["para_mim", "para_outra_pessoa"] as const;
export type Destinatario = (typeof DESTINATARIOS)[number];

export type SolicitacaoPublica = {
  nome: string;
  email: string;
  telefone: string;
  destinatario: Destinatario;
  consentimento: boolean;
  /**
   * Honeypot. Nome banal de propósito: um robô preenche o que parece campo de
   * formulário. Gente nunca vê — e por isso jamais preenche.
   */
  website: string;
};

/**
 * A GUARDA ESTÁTICA. Se o tipo e a lista divergirem — em qualquer direção —,
 * `tsc` reprova antes de qualquer teste rodar. Sem `any`, sem cast largo, sem
 * index signature aberta.
 */
type ChaveDaLista = CampoPermitido;
type ChaveDoTipo = keyof SolicitacaoPublica;
type SaoIguais<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
export const FRONTEIRA_FECHADA: SaoIguais<ChaveDaLista, ChaveDoTipo> = true;

export type ResultadoDaValidacao =
  | { ok: true; valor: SolicitacaoPublica }
  | { ok: false; campo: CampoPermitido | "payload"; mensagem: string };

/**
 * VALIDAÇÃO EM RUNTIME — a mesma régua da guarda estática, aplicada ao que
 * chega pela rede. Recusa chave desconhecida em vez de ignorá-la: um campo a
 * mais é sinal de que alguém mudou o contrato sem passar por aqui.
 */
export function validarSolicitacao(bruto: unknown): ResultadoDaValidacao {
  if (typeof bruto !== "object" || bruto === null || Array.isArray(bruto)) {
    return { ok: false, campo: "payload", mensagem: "Não foi possível ler o pedido." };
  }

  const recebidas = Object.keys(bruto as Record<string, unknown>);
  const desconhecida = recebidas.find(
    (chave) => !(CAMPOS_PERMITIDOS as readonly string[]).includes(chave),
  );
  if (desconhecida !== undefined) {
    // A mensagem não repete o nome do campo: se alguém tentar sondar o
    // contrato, a resposta não confirma nada.
    return { ok: false, campo: "payload", mensagem: "Não foi possível ler o pedido." };
  }

  const dados = bruto as Partial<Record<CampoPermitido, unknown>>;
  const texto = (v: unknown) => (typeof v === "string" ? v.trim() : "");

  const nome = texto(dados.nome);
  if (nome.length === 0) {
    return { ok: false, campo: "nome", mensagem: "Precisamos do seu nome para procurar você." };
  }
  if (nome.length > 120) {
    return { ok: false, campo: "nome", mensagem: "Esse nome é longo demais — use o nome pelo qual você é chamada." };
  }

  const email = texto(dados.email);
  const telefone = texto(dados.telefone);
  if (email.length === 0 && telefone.length === 0) {
    return { ok: false, campo: "email", mensagem: "Deixe um e-mail ou um telefone para a gente procurar você." };
  }
  if (email.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, campo: "email", mensagem: "Confira o e-mail — parece faltar alguma coisa." };
  }
  if (telefone.length > 0 && telefone.replace(/\D/g, "").length < 10) {
    return { ok: false, campo: "telefone", mensagem: "Confira o telefone — parece faltar algum número." };
  }

  const destinatario = texto(dados.destinatario);
  if (!(DESTINATARIOS as readonly string[]).includes(destinatario)) {
    return { ok: false, campo: "destinatario", mensagem: "Diga se o atendimento é para você ou para outra pessoa." };
  }

  if (dados.consentimento !== true) {
    return {
      ok: false,
      campo: "consentimento",
      mensagem: "Precisamos do seu consentimento para entrar em contato.",
    };
  }

  return {
    ok: true,
    valor: {
      nome,
      email,
      telefone,
      destinatario: destinatario as Destinatario,
      consentimento: true,
      website: texto(dados.website),
    },
  };
}

/** O honeypot foi preenchido? Só um robô faria isso. */
export function pareceRobo(valor: SolicitacaoPublica): boolean {
  return valor.website.length > 0;
}

/** A copy da confirmação. ⛔ Sem prazo — nunca prometemos data. */
export const MENSAGEM_DE_SUCESSO = "Recebemos. Uma pessoa da Aliviar vai procurar você.";

/** Versão do consentimento registrada junto do contato. */
export const VERSAO_DO_CONSENTIMENTO = "privacidade-2026-08";
