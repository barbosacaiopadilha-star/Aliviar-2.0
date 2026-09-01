# Acessos da simulação — as seis contas, e onde cada uma entra

> **Nenhuma senha nesta folha, de propósito.** As contas são criadas por um
> comando, com senha aleatória gerada na hora, e ela fica num arquivo do seu
> computador — nunca num documento que se imprime, se sincroniza ou se manda
> por mensagem. Como abrir esse arquivo está no fim.

**Isto é o ambiente LOCAL**, na sua máquina. Não é a produção, não toca no que
está no ar, e nada do que você fizer aqui chega a pessoa nenhuma. É por isso
que dá para simular à vontade — e por isso que estas contas não são segredo.

---

## As seis contas

| Papel | E-mail | Onde entra | O que faz na simulação |
|---|---|---|---|
| **Administrador** | `admin.teste@aliviar-conexao.local` | `/admin` | Vê tudo: a Rede, os Cases, o Kit da Curadoria, a equipe |
| **Supervisor** | `atendente.teste@aliviar-conexao.local` | `/atendimento` | O primeiro contato, o preço, e o acompanhamento até o fim |
| **Curador** | `curador.teste@aliviar-conexao.local` | `/portal-curador` | A Consulta Inicial, a Mesa, o Relatório |
| **Acompanhamento** | `concierge.teste@aliviar-conexao.local` | `/acompanhamento` | A logística depois da escolha |
| **Médico da Rede** | `profissional.teste@aliviar-conexao.local` | `/profissional` | O formulário e a declaração assinada |
| **Assistida** | `paciente.teste@aliviar-conexao.local` | `/paciente` | A área dela: a história, os documentos, os três caminhos |

**O e-mail do Supervisor ainda diz `atendente`** — é o nome antigo do papel, e
mudá-lo exigiria recriar a conta. **Não é um papel diferente:** desde a ADR-100
não existe atendente, existe supervisor. O mesmo vale para `concierge`, que hoje
é o Acompanhamento (ADR-106).

---

## Como subir, na ordem

**1 · O banco local** — precisa do Docker aberto.

```
npx supabase start
```

**2 · As seis contas** — idempotente: pode rodar de novo sem quebrar nada.

```
npm run bootstrap:test-users
```

**3 · O site**, apontando para o banco local:

```
npm run dev:local
```

Abre em `http://localhost:3000`.

---

## Onde estão as senhas

No arquivo **`test-users.local.json`**, na raiz do repositório. Ele nasce do
comando do passo 2, com uma senha aleatória por conta.

**Ele nunca sai da sua máquina:** está coberto pelo `.gitignore`, não vai para o
GitHub, não entra em PDF nenhum e não é sincronizado com a pasta da área de
trabalho. Se precisar de senha nova, rode o passo 2 outra vez.

---

## Duas coisas que valem saber

**Os scripts recusam rodar em produção.** Existe um guarda (`env-guard.mjs`)
porque o `.env.local` do repositório aponta para um projeto hospedado, e os
scripts o liam por engano. Hoje, qualquer um deles que precise do banco só
conversa com o local.

**Se o banco não subir**, é quase sempre o Docker: o contêiner morre quando a
máquina desliga com ele aberto. O conserto é `npx supabase stop` e subir de
novo — foi exatamente o que aconteceu em 01/09.
