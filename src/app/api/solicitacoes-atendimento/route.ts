import { NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  MENSAGEM_DE_SUCESSO,
  VERSAO_DO_CONSENTIMENTO,
  pareceRobo,
  validarSolicitacao,
} from "@/modules/crm/solicitacao-publica";

/**
 * A PORTA PÚBLICA — `POST /api/solicitacoes-atendimento`.
 *
 * Route Handler, e não Server Action, por uma razão medida: a Action faz POST
 * no path da própria página, com header opaco. O firewall da borda não
 * consegue mirar isso de forma estável — e a regra de rate-limit precisa de um
 * path real e fixo. Este é o path.
 *
 * O QUE ESTE ENDPOINT NUNCA FAZ:
 *   · não cria conta, paciente nem Case — quem converte é o Atendimento;
 *   · não devolve objeto do CRM, id, estado ou qualquer coisa que sirva para
 *     descobrir se a pessoa já existe;
 *   · não registra o payload em log — nem em erro;
 *   · não põe PII em URL.
 *
 * A RESPOSTA É SEMPRE A MESMA. Contato novo, contato repetido dentro da
 * janela, pessoa que já tem conta, robô no honeypot: todos recebem o mesmo 200
 * e o mesmo texto. Distinguir seria enumerar — e enumerar é o vazamento.
 *
 * O rate-limit **não mora aqui**: fica na borda, por IP, e o aplicativo não
 * guarda IP nem derivado dele. A idempotência do servidor permanece
 * obrigatória de todo jeito, porque contadores de borda podem ser regionais.
 */

/** Limite pequeno e deliberado: este pedido cabe em poucos bytes. */
const LIMITE_DO_CORPO = 4 * 1024;

/** A resposta pública, indistinguível por desenho. */
function recebido() {
  return NextResponse.json({ mensagem: MENSAGEM_DE_SUCESSO }, { status: 200 });
}

function recusa(campo: string, mensagem: string) {
  return NextResponse.json({ campo, mensagem }, { status: 400 });
}

export async function POST(request: Request): Promise<NextResponse> {
  if (!(request.headers.get("content-type") ?? "").includes("application/json")) {
    return recusa("payload", "Não foi possível ler o pedido.");
  }

  const bruto = await request.text();
  if (bruto.length > LIMITE_DO_CORPO) {
    return recusa("payload", "Não foi possível ler o pedido.");
  }

  let json: unknown;
  try {
    json = JSON.parse(bruto);
  } catch {
    return recusa("payload", "Não foi possível ler o pedido.");
  }

  const validado = validarSolicitacao(json);
  if (!validado.ok) {
    return recusa(validado.campo, validado.mensagem);
  }

  // Robô entra, nada é criado, e a resposta é a mesma de quem foi recebido.
  // Dizer "bloqueamos você" ensinaria o robô a tentar de outro jeito.
  if (pareceRobo(validado.valor)) {
    return recebido();
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc("solicitar_atendimento_publico", {
    _nome: validado.valor.nome,
    _email: validado.valor.email,
    _telefone: validado.valor.telefone,
    _para_outra_pessoa: validado.valor.destinatario === "para_outra_pessoa",
    _consentimento_versao: VERSAO_DO_CONSENTIMENTO,
  });

  if (error) {
    // ⛔ O payload não vai para o log. O que se registra é que falhou e onde —
    // nunca quem, nem o quê. Uma linha de log com e-mail é vazamento.
    console.error("[solicitacoes-atendimento] writer recusou a solicitação", {
      code: error.code ?? null,
    });
    return NextResponse.json(
      { campo: "payload", mensagem: "Não conseguimos registrar agora. Tente de novo em instantes." },
      { status: 503 },
    );
  }

  return recebido();
}

/** Só POST. Qualquer outro verbo não existe aqui. */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ mensagem: "Método não suportado." }, { status: 405 });
}
