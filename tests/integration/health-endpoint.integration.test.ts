import { describe, expect, it } from "vitest";

import { createCuradoriaClient } from "./curadoria-client";

/**
 * SAÚDE — a sonda precisa ser legível por quem NÃO tem sessão.
 *
 * O achado (OBS-01): não existia health check, e `/api/build-info` era usado
 * como substituto — ele responde 200 com o banco caído, porque só lê arquivo
 * local. Um monitor apontado para lá dorme enquanto ninguém consegue entrar.
 *
 * O endpoint em si é exercitado de ponta a ponta (200 com banco de pé, 503
 * com o container derrubado). O que se prova AQUI é a fundação dele: a sonda
 * escolhida funciona sob o papel `anon`, que é o papel de um monitor externo.
 *
 * Isso não é detalhe: a primeira versão sondava `curadoria.roles`, que `anon`
 * não lê por desenho — e o health check respondia 503 permanente com o
 * sistema perfeitamente saudável. Alarme que toca sempre é alarme que
 * ninguém escuta.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

describe("Sonda de saúde — legível sem sessão (OBS-01)", () => {
  it("anon lê legal_documents: a sonda do health check funciona sem sessão", async () => {
    const anon = createCuradoriaClient(url, anonKey);
    const { error } = await anon.from("legal_documents").select("slug").limit(1);
    expect(error, `a sonda de saúde falharia para um monitor externo: ${error?.message}`).toBeNull();
  });

  it("anon NÃO lê o catálogo de papéis — a sonda antiga daria 503 permanente", async () => {
    const anon = createCuradoriaClient(url, anonKey);
    const { error } = await anon.from("roles").select("slug").limit(1);
    // Guarda de regressão do raciocínio: se um dia `anon` passar a ler
    // `roles`, alguém ampliou acesso — e este teste obriga a olhar.
    expect(error).not.toBeNull();
  });
});
