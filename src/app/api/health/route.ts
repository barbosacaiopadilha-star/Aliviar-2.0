import { NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * SAÚDE REAL — Bloco I (OBS-01).
 *
 * O achado: não existia endpoint de saúde. `/api/build-info` foi usado como
 * substituto e não serve: ele responde **200 com o banco caído**, porque só
 * lê arquivo local. Um monitor apontado para lá dorme tranquilo enquanto
 * nenhuma paciente consegue entrar.
 *
 * Este endpoint TOCA as dependências:
 *   - banco  — uma leitura real de tabela (não `select 1`: precisa provar
 *              que o schema existe e que o papel tem privilégio, que foi
 *              exatamente o que quebrou o painel do /admin em silêncio);
 *   - auth   — o serviço de sessão responde.
 *
 * Contrato para o monitor externo:
 *   200 = tudo respondendo · 503 = alguma dependência fora.
 * O status HTTP é o sinal; o corpo diz QUAL dependência caiu, para o plantão
 * não precisar adivinhar.
 *
 * Nunca expõe segredo, host de banco, versão de dependência ou contagem de
 * dado — página de saúde é pública por natureza e não conta nada sobre quem
 * está lá dentro.
 */

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Dependencia = { nome: string; ok: boolean; latencia_ms: number; detalhe?: string };

async function medir(nome: string, sonda: () => Promise<void>): Promise<Dependencia> {
  const inicio = Date.now();
  try {
    await sonda();
    return { nome, ok: true, latencia_ms: Date.now() - inicio };
  } catch (erro) {
    return {
      nome,
      ok: false,
      latencia_ms: Date.now() - inicio,
      // Mensagem da falha, sem stack e sem dado — o suficiente para o plantão
      // saber para onde correr, insuficiente para vazar qualquer coisa.
      detalhe: erro instanceof Error ? erro.message.slice(0, 120) : "falha desconhecida",
    };
  }
}

export async function GET() {
  const dependencias: Dependencia[] = [];

  dependencias.push(
    await medir("banco", async () => {
      const supabase = await createServerSupabaseClient();
      // Leitura de tabela real: prova schema + privilégio + RLS de pé.
      //
      // A sonda é `legal_documents` porque a requisição do monitor chega SEM
      // sessão — o papel é `anon`, e sondar uma tabela que `anon` não deve
      // ler produziria 503 permanente. Alarme que toca sempre é alarme que
      // ninguém escuta. `legal_documents` é justamente o que o visitante
      // anônimo lê no portal legal.
      const { error } = await supabase.from("legal_documents").select("slug").limit(1);
      if (error) throw new Error(error.message);
    }),
  );

  dependencias.push(
    await medir("auth", async () => {
      const supabase = await createServerSupabaseClient();
      const { error } = await supabase.auth.getSession();
      if (error) throw new Error(error.message);
    }),
  );

  const saudavel = dependencias.every((d) => d.ok);

  return NextResponse.json(
    {
      status: saudavel ? "ok" : "degradado",
      verificado_em: new Date().toISOString(),
      dependencias,
    },
    {
      status: saudavel ? 200 : 503,
      headers: { "cache-control": "no-store" },
    },
  );
}
