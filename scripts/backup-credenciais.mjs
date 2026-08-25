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

/**
 * MONTAR A CONNECTION STRING — o passo que dava errado, feito pelo programa.
 *
 * O painel entrega a URI com o literal `[YOUR-PASSWORD]` no lugar da senha, e
 * a versão anterior deste configurador esperava que a pessoa substituísse o
 * marcador à mão ANTES de colar, num campo cujo eco estava desligado. Editar
 * texto no escuro e colar sem conferir foi exatamente o que falhou em 25/08.
 *
 * A senha vai ESCAPADA. Senhas do Supabase podem trazer @ : / ? #, e todos
 * esses caracteres têm significado dentro de uma URI: colados crus, produzem
 * um "não é uma URL válida" cuja culpa seria nossa, não de quem digitou.
 *
 * Devolve `null` quando não há marcador — quem chama decide o que fazer com
 * isso, porque uma URI que já traz senha é um caso diferente (apareceu na
 * tela) e merece um aviso, não um remendo silencioso.
 */
export const MARCADOR_DE_SENHA = "[YOUR-PASSWORD]";

export function montarConnectionString(uriCrua, senha) {
  if (!uriCrua.includes(MARCADOR_DE_SENHA)) return null;
  return uriCrua.replace(MARCADOR_DE_SENHA, encodeURIComponent(senha));
}

/**
 * O QUE CHEGOU, SEM DIZER O QUE É — diagnóstico que não vaza.
 *
 * Nasceu de um travamento real (25/08): o Fundador colou algo com 32
 * caracteres e recebeu só "a connection string não é uma URL válida". A
 * conferência SABIA que eram 32 caracteres e que não começavam com
 * `postgresql://`, e não contou nenhuma das duas coisas. Ele ficou sem saber
 * se tinha colado o campo errado, se a colagem havia truncado, ou se o
 * programa estava quebrado — e um backup de produção não aconteceu.
 *
 * Cada observação daqui é ESTRUTURAL: um comprimento, um prefixo conhecido,
 * a presença de um caractere separador. Nenhuma devolve trecho do valor, e é
 * por isso que elas podem ser impressas numa tela que alguém pode estar
 * compartilhando. O que a mensagem diz é a FORMA do que chegou, nunca o
 * conteúdo.
 */
export function descreverFormato(valor) {
  const pistas = [`recebi ${valor.length} caracteres`];

  if (/\s/.test(valor)) {
    pistas.push("com espaço ou quebra de linha no meio — a colagem provavelmente trouxe mais do que a string");
  }
  if (valor.startsWith("eyJ")) {
    pistas.push("e eles têm o formato de um token JWT — isso é uma CHAVE, não a connection string");
  } else if (valor.startsWith("sb_")) {
    pistas.push("e eles começam com `sb_` — isso é uma chave do painel, não a connection string");
  } else if (!/^postgres(ql)?:\/\//.test(valor)) {
    pistas.push("e eles não começam com `postgresql://` — o campo certo do painel é Connection string → URI");
  } else if (!valor.includes("@")) {
    pistas.push("e não há `@` separando a senha do endereço");
  }

  return pistas.join(", ");
}

export function conferirCredenciais({ dbUrl, serviceKey, ref, chaveOpcional = false }) {
  const problemas = [];

  if (!dbUrl) {
    problemas.push("a connection string veio vazia");
  } else {
    let u = null;
    try {
      u = new URL(dbUrl);
    } catch {
      problemas.push(
        `a connection string não é uma URL válida — ${descreverFormato(dbUrl)}`,
      );
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
      } else if (ref && !host.includes(ref) && !u.username.includes(ref)) {
        // O ref pode estar no HOST (conexão direta,
        // `db.<ref>.supabase.co`) ou no USUÁRIO (pooler,
        // `postgres.<ref>@aws-0-<regiao>.pooler.supabase.com`). Procurar só no
        // host recusaria a string do pooler — que é justamente a que o painel
        // oferece por padrão hoje. Descoberto travando o Fundador em 25/08.
        problemas.push(
          `a connection string aponta para ${host} com usuário ${u.username}, e o ref do projeto vinculado (${ref}) não aparece em nenhum dos dois`,
        );
      }
    }
  }

  // A chave é OPCIONAL quando quem chama diz que é: ela serve só aos bytes do
  // storage, e exigi-la transformava "fazer um backup hoje" num problema de
  // dois segredos — cujo resultado prático era ficar sem backup nenhum.
  if (!serviceKey) {
    if (!chaveOpcional) problemas.push("a service role key veio vazia");
  } else if (serviceKey.length < 30) {
    problemas.push("a service role key parece curta demais");
  } else if (serviceKey.startsWith("sb_publishable_") || serviceKey.includes('"role":"anon"')) {
    problemas.push("essa é a chave publishable/anon, não a service_role");
  }

  return problemas;
}
