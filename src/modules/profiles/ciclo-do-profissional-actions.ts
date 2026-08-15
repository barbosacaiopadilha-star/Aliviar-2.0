"use server";

import { revalidatePath } from "next/cache";

import { falhaParaUsuario } from "@/lib/observability/erros";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireRoleForAction } from "@/modules/auth/guard";

import {
  NOTA_MAXIMA,
  NOTA_MINIMA,
  avaliarTransicao,
  preverImpacto,
  type CicloDoProfissional,
  type ImpactoDaTransicao,
  type MotivoDoCiclo,
} from "./ciclo-do-profissional";
// O ActionResult da casa não é genérico; aqui o dado importa, então o par
// sucesso/erro é declarado localmente com a mesma forma e o mesmo vocabulário.
type Resultado<T> = { success: true; data: T } | { success: false; error: string };

/**
 * OPS-G5 · CORTE 7 — o writer do ciclo.
 *
 * Três camadas, e nenhuma delas é decorativa:
 *
 * 1. O papel. Só administrador chega aqui.
 * 2. O módulo puro, que recusa cedo e em português — para que a pessoa leia o
 *    motivo em vez de um código de erro do Postgres.
 * 3. O trigger, que é a autoridade final. Se as camadas de cima falharem, ou se
 *    algum writer futuro nascer sem elas, o banco continua recusando.
 *
 * A ordem importa: validar antes NÃO substitui o trigger, ele só torna a recusa
 * legível. Quem confia apenas na primeira camada está protegendo a interface,
 * não os dados.
 */

type PedidoDeTransicao = {
  profissionalId: string;
  para: CicloDoProfissional;
  motivo: MotivoDoCiclo;
  nota?: string | null;
};

/**
 * O que muda de fato se esta transição acontecer. Lido ANTES de confirmar, para
 * que ninguém retire da rede sem enxergar o acompanhamento em curso.
 */
export async function preverImpactoDaTransicaoAction(
  profissionalId: string,
  para: CicloDoProfissional,
): Promise<Resultado<ImpactoDaTransicao>> {
  await requireRoleForAction("administrador");
  const supabase = await createServerSupabaseClient();

  try {
    const { data: profissional, error: erroPerfil } = await supabase
      .schema("curadoria")
      .from("professional_profiles")
      .select("ciclo_de_vida")
      .eq("id", profissionalId)
      .single();
    if (erroPerfil) throw erroPerfil;

    const { count, error: erroConexoes } = await supabase
      .schema("curadoria")
      .from("connection_records")
      .select("id", { count: "exact", head: true })
      .eq("professional_profile_id", profissionalId)
      .neq("status", "ENCERRADO_SEM_RELACIONAMENTO");
    if (erroConexoes) throw erroConexoes;

    const de = profissional.ciclo_de_vida as CicloDoProfissional | null;
    if (de === null) {
      // Legado sem ciclo classificado: não há de onde sair, então não há
      // impacto a prever. Dizer isso é mais útil do que arbitrar um estado.
      return {
        success: true,
        data: {
          bloqueio:
            "Este cadastro é legado e ainda não teve o ciclo classificado. A revisão registra o estado atual, com motivo e autoria, antes de qualquer mudança.",
          consequencias: [],
          preservado: [],
        },
      };
    }

    return {
      success: true,
      data: preverImpacto({ de, para, conexoesAtivas: count ?? 0 }),
    };
  } catch (erro) {
    return {
      success: false,
      error: falhaParaUsuario("profiles.impactoDoCiclo", erro, {
        mensagem: "Não foi possível calcular o impacto desta mudança.",
        contexto: { profissionalId, para },
      }),
    };
  }
}

/**
 * CLASSIFICAÇÃO DE LEGADO — ato próprio, não transição.
 *
 * Antes da remediação, o banco recusava qualquer saída de `NULL` — inclusive a
 * revisão que a própria mensagem de erro prometia. A promessa e a guarda se
 * contradiziam, e não havia caminho nenhum para classificar um cadastro legado.
 *
 * Agora há um, e ele é estreito de propósito: só de `NULL`, só com motivo
 * exclusivo, só com justificativa escrita, e com trilha de verbo próprio. ⛔ Não
 * serve para reclassificar quem já tem ciclo — para isso existe a matriz.
 */
export async function classificarLegadoDoProfissionalAction(pedido: {
  profissionalId: string;
  para: CicloDoProfissional;
  justificativa: string;
}): Promise<Resultado<{ para: CicloDoProfissional }>> {
  const authState = await requireRoleForAction("administrador");
  const supabase = await createServerSupabaseClient();

  const justificativa = pedido.justificativa.trim();
  if (justificativa.length < NOTA_MINIMA || justificativa.length > NOTA_MAXIMA) {
    return {
      success: false,
      error: `A classificação exige uma justificativa de ${NOTA_MINIMA} a ${NOTA_MAXIMA} caracteres.`,
    };
  }

  try {
    const { data: profissional, error: erroPerfil } = await supabase
      .schema("curadoria")
      .from("professional_profiles")
      .select("ciclo_de_vida")
      .eq("id", pedido.profissionalId)
      .single();
    if (erroPerfil) throw erroPerfil;

    if (profissional.ciclo_de_vida !== null) {
      return {
        success: false,
        error: "Este cadastro já tem ciclo classificado. Use a mudança de estado correspondente.",
      };
    }

    const { error } = await supabase
      .schema("curadoria")
      .from("professional_profiles")
      .update({
        ciclo_de_vida: pedido.para,
        ciclo_motivo: "CLASSIFICACAO_DE_LEGADO",
        ciclo_nota: justificativa,
        ciclo_alterado_por: authState.user.id,
      })
      .eq("id", pedido.profissionalId);

    if (error) {
      return {
        success: false,
        error: falhaParaUsuario("profiles.classificacaoDeLegado", error, {
          mensagem: error.message,
          contexto: { profissionalId: pedido.profissionalId, para: pedido.para },
        }),
      };
    }

    revalidatePath(`/admin/profissionais/${pedido.profissionalId}`);
    revalidatePath("/admin/profissionais");
    return { success: true, data: { para: pedido.para } };
  } catch (erro) {
    return {
      success: false,
      error: falhaParaUsuario("profiles.classificacaoDeLegado", erro, {
        mensagem: "Não foi possível classificar este cadastro legado.",
        contexto: { profissionalId: pedido.profissionalId, para: pedido.para },
      }),
    };
  }
}

export async function mudarCicloDoProfissionalAction(
  pedido: PedidoDeTransicao,
): Promise<Resultado<{ de: CicloDoProfissional; para: CicloDoProfissional }>> {
  const authState = await requireRoleForAction("administrador");
  const supabase = await createServerSupabaseClient();

  try {
    const { data: profissional, error: erroPerfil } = await supabase
      .schema("curadoria")
      .from("professional_profiles")
      .select("ciclo_de_vida")
      .eq("id", pedido.profissionalId)
      .single();
    if (erroPerfil) throw erroPerfil;

    const de = profissional.ciclo_de_vida as CicloDoProfissional | null;

    // Segunda camada: recusa cedo, com a frase que a pessoa precisa ler. O
    // impacto NÃO é consultado aqui para decidir — a guarda 11 é do trigger,
    // e duplicá-la em JavaScript criaria duas versões da mesma regra.
    const veredito = avaliarTransicao({
      de,
      para: pedido.para,
      motivo: pedido.motivo,
      nota: pedido.nota ?? null,
      autorId: authState.user.id,
      quando: new Date().toISOString(),
      temConexaoAtiva: false,
    });
    if (!veredito.ok) return { success: false, error: veredito.mensagem };

    const { error } = await supabase
      .schema("curadoria")
      .from("professional_profiles")
      .update({
        ciclo_de_vida: pedido.para,
        ciclo_motivo: pedido.motivo,
        ciclo_nota: pedido.nota ?? null,
        ciclo_alterado_por: authState.user.id,
        // OPS-G5 C7R: o instante é do banco. Mandá-lo daqui não faz diferença
        // — o trigger o sobrescreve —, e mandar mesmo assim sugeriria que o
        // relógio do cliente conta para alguma coisa. Não conta.
      })
      .eq("id", pedido.profissionalId);

    if (error) {
      // O trigger recusou. A mensagem dele já é escrita para gente — a guarda
      // 11 diz "Este profissional tem acompanhamento em curso" —, então ela
      // sobe inteira em vez de virar um "erro inesperado" genérico.
      return {
        success: false,
        error: falhaParaUsuario("profiles.cicloDoProfissional", error, {
          mensagem: error.message,
          contexto: { profissionalId: pedido.profissionalId, para: pedido.para },
        }),
      };
    }

    revalidatePath(`/admin/profissionais/${pedido.profissionalId}`);
    revalidatePath("/admin/profissionais");
    return { success: true, data: { de: de as CicloDoProfissional, para: pedido.para } };
  } catch (erro) {
    return {
      success: false,
      error: falhaParaUsuario("profiles.cicloDoProfissional", erro, {
        mensagem: "Não foi possível mudar o ciclo deste profissional.",
        contexto: { profissionalId: pedido.profissionalId, para: pedido.para },
      }),
    };
  }
}
