/**
 * CONFERÊNCIA DAS CREDENCIAIS DE BACKUP — pura, sem efeito nenhum.
 *
 * Mora em arquivo próprio porque precisa ser importável por um teste. O
 * configurador é um script que roda ao ser carregado (pergunta, escreve, sai);
 * importá-lo para testar a validação executaria o script. Lógica que se quer
 * testar não pode viver dentro de um roteiro.
 *
 * O que cada conferência aqui evita é um erro que já aconteceu com alguém, e o
 * pior deles é o SILENCIOSO: um `.env.backup.local` com o marcador
 * `[YOUR-PASSWORD]` do painel parece configurado, não reclama, e só falha no
 * dia em que alguém precisar do backup — que é exatamente o dia em que não dá
 * para consertar.
 */

/**
 * OCULTAR A DIGITAÇÃO — e por que isto virou função própria, com teste.
 *
 * A primeira versão morava dentro do configurador e tinha a condição
 * INVERTIDA: escondia o rótulo do prompt e ecoava o que era digitado. Ou
 * seja, fazia exatamente o oposto do que prometia, e só se descobriu quando
 * o Fundador rodou e viu o texto na tela (25/08).
 *
 * Nenhuma credencial foi exposta naquele dia por sorte — ele colou comandos,
 * não segredos. Não se deixa uma coisa dessas dependendo de sorte duas vezes.
 *
 * Recebe o `rl` e a função que escreve na tela em vez de tocar
 * `process.stdout` direto: é isso que permite um teste provar que, com a
 * ocultação ligada, NADA chega à tela.
 */
export function instalarOcultacao(rl, escreverNaTela) {
  let oculto = false;

  rl._writeToOutput = (texto) => {
    if (oculto) return;
    escreverNaTela(texto);
  };

  return {
    ocultar: () => {
      oculto = true;
    },
    revelar: () => {
      oculto = false;
    },
    estaOculto: () => oculto,
  };
}

export function conferirCredenciais({ dbUrl, serviceKey, ref }) {
  const problemas = [];

  if (!dbUrl) {
    problemas.push("a connection string veio vazia");
  } else {
    let u = null;
    try {
      u = new URL(dbUrl);
    } catch {
      problemas.push("a connection string não é uma URL válida");
    }
    if (u) {
      if (!u.protocol.startsWith("postgres")) {
        problemas.push("a connection string não começa com postgresql://");
      }
      if (!u.password) {
        problemas.push("a connection string não tem senha (o trecho depois de 'postgres:')");
      } else if (decodeURIComponent(u.password).includes("YOUR-PASSWORD")) {
        problemas.push("a senha ainda é o marcador do painel — substitua pelo valor real");
      }
      const host = u.hostname;
      if (host === "localhost" || host === "127.0.0.1") {
        problemas.push("a connection string aponta para o banco LOCAL, não para produção");
      } else if (ref && !host.includes(ref)) {
        problemas.push(
          `a connection string aponta para ${host}, que não contém o ref do projeto vinculado (${ref})`,
        );
      }
    }
  }

  if (!serviceKey) {
    problemas.push("a service role key veio vazia");
  } else if (serviceKey.length < 30) {
    problemas.push("a service role key parece curta demais");
  } else if (serviceKey.startsWith("sb_publishable_") || serviceKey.includes('"role":"anon"')) {
    problemas.push("essa é a chave publishable/anon, não a service_role");
  }

  return problemas;
}
