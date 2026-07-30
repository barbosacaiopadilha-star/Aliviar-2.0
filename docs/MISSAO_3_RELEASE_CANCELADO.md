# Missão 3 — Release Control · **PUBLICAÇÃO CANCELADA**

**2026-07-24.** Nenhum commit, nenhum push, nenhum deploy. Produção intacta.

Cancelada no **Gate 1** e no **Gate 5**, por instrução da própria missão: *"Se essa classificação não estiver comprovada, interrompa a missão"* e *"Caso ainda exista acúmulo indevido de papéis no cenário de produção, interrompa."*

---

## Gate 1 — a pré-condição não existe

A missão exige confirmar que o relatório anterior classificou o sistema como `APTO PARA PRODUÇÃO`.

**Ele não classificou.** O relatório da Missão 2.5 terminou com a resposta literal: *"O sistema está pronto para iniciar a Missão 3: **não**."*

Nenhum relatório desta linha de trabalho emitiu `APTO PARA PRODUÇÃO`. O último veredito formal de go-live foi **NO GO** (`GO_LIVE_READINESS.md`).

---

## Gate 5 — os papéis continuam acumulados

| Pessoa | Papéis |
|---|---|
| **Administrador** | administrador · curador_medico · concierge |
| Paciente · Henrique Teste Paciente | paciente |

Ninguém tem `atendente`. **Uma única pessoa é Curador e Concierge ao mesmo tempo.**

A missão pede 1 Administrador + 1 Atendente + 1 Curador + 1 Concierge + 1 Paciente separados. Faltam três pessoas, e eu não posso inventar credenciais.

---

## Bloqueador novo — divergência banco × repositório

Encontrado durante a revisão do §4, e é o mais sério dos três.

| | |
|---|---|
| Migrations aplicadas em produção | **35** |
| Migrations versionadas no repositório | **2** |
| Divergência | **33 migrations existem só no banco remoto** |

Entre as ausentes estão **todas as 8 que apliquei nesta sessão** — RLS do Case, transferência auditada, conversão de lead, abertura do Case. Um revisor abriria o commit e não veria **uma linha** do SQL que governa quem enxerga dado de paciente.

### Não é teórico: quebra 133 testes

```
npm run test:integration
Test Files  15 failed (15)
     Tests  133 failed | 2 passed | 5 skipped (140)
```

O Supabase local está de pé. A falha é `Cannot read properties of null (reading 'id')` em massa: o banco local, reconstruído a partir das 2 migrations disponíveis, **não tem as tabelas que os testes usam**. É o bloqueador C2 da Missão 2, agora com causa identificada.

### Por que não corrigi

Tentei materializar as 8 migrations reconstruindo o SQL. A primeira já não bateu — **392 bytes locais contra 1016 no remoto**. Reconstruir de memória produz um arquivo que *parece* a migration aplicada e não é.

Transcrever à mão os 28 KB restantes é pior: é SQL que define `policy`, `SECURITY DEFINER` e `search_path`. Um erro de transcrição dentro de um `$$` publicaria uma policy diferente da que está em produção, e o repositório passaria a mentir com aparência de rigor. Apaguei o arquivo parcial: cobertura pela metade é pior que nenhuma.

**Recuperação correta** — o SQL exato está em `supabase_migrations.schema_migrations.statements`, e deve ser escrito em arquivo por extração direta, sem intermediário humano:

```bash
supabase db pull --schema curadoria
```

Se ele falhar com o conflito já conhecido, extrair via `psql` direto da tabela, um arquivo por `version`. **Não usar `migration repair --status reverted`** — reescreveria o histórico de produção.

---

## Revisão do repositório — §2, aprovada

| Verificação | Resultado |
|---|---|
| Branch · remoto | `main` · `origin` e `aliviar` apontam para `Aliviar-2.0.git` ✅ |
| `.env` versionado | Nenhum. `.gitignore:3` cobre `.env.*`; só `.env.example` rastreado ✅ |
| Segredos no diff | Nenhum ✅ |
| Dados em migration/dump | `schema-curadoria-producao.sql`: **0 `COPY`/`INSERT`**, 0 e-mails ✅ |
| `console.log` | Nenhum ✅ |
| TODO/FIXME/HACK | Nenhum ✅ |
| `@ts-ignore` · bypass de auth | Nenhum ✅ |
| `eslint-disable` | 5, todos pré-existentes e justificados em comentário ✅ |

**Uma correção aplicada**: `HANDOFF_CERTIFICACAO_RC1.md` continha o prefixo `sbp_18a4…` de um token pessoal do Supabase. O token já foi revogado, mas fragmento de credencial não entra no histórico do Git. Removido.

---

## Validações — §3

| Comando | Resultado |
|---|---|
| `npx tsc --noEmit` | ✅ exit 0 |
| `npm run lint` | ✅ sem avisos |
| `npm test` | ✅ **863 passando**, 1 todo |
| `npm run build` | ✅ compila |
| `npm run test:integration` | ⛔ **133 falhando** de 140 |

Nenhuma correção foi feita para "fazer o release passar". Nenhum `@ts-ignore`, nenhum teste removido, nenhum lint desativado.

---

## O que não foi executado

Commit · push · deploy · migrations em produção · smoke test · validação responsiva · monitoramento. Todos dependem dos gates que falharam.

---

## Gate humano final — §15

| Pergunta | Resposta |
|---|---|
| Paciente usa a plataforma sozinho? | Não verificado — exige sessão autenticada |
| Atendente qualifica, converte e abre o Case? | **Sim no banco**, com 3 pessoas distintas, em transação revertida. **Não em produção**: não existe Atendente |
| Curador conduz o Case? | Sim no banco. A superfície `/portal-curador` ainda lê dados mockados |
| Concierge acompanha? | Sim no banco. Superfície mínima criada, nunca aberta autenticada |
| Administrador governa perfis, CRM e indicadores? | Painel construído, **nunca aberto autenticado** |
| O mesmo Case percorre a jornada? | **Sim** — provado, mesmo `case_id` do Atendente ao Concierge |
| Fluxo crítico dependente de mock? | **Sim** — `/portal-curador` usa `mock-data` |
| Risco de acesso indevido? | Não encontrado. RLS provada com sessões distintas |

---

## Próxima ação prioritária

**Uma só: fechar a divergência banco × repositório**, extraindo as 33 migrations ausentes para arquivo.

Ela vem antes dos papéis e antes do login. Enquanto o repositório não puder reconstruir o schema, os 133 testes de integração não rodam, nenhum revisor consegue auditar as policies que protegem dado de paciente, e um deploy publica código cujo contrato de banco ninguém verificou.
