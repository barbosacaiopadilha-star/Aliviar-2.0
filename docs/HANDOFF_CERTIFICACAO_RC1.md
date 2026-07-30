# Handoff — Certificação RC-1 (sessão interrompida por contexto)

**Data**: 2026-07-24 · **Veredito atual**: 🔴 NÃO APTO · **Nada commitado**

Este documento existe para que a próxima sessão retome sem refazer descobertas.

---

## 1. Primeira coisa a fazer

~~Revogar o token de acesso pessoal do Supabase~~ — **feito**. O token exposto no histórico de uma conversa anterior foi revogado e substituído pelo Fundador em 2026-07-24. Nunca foi gravado em disco. O prefixo dele foi removido deste documento: mesmo truncado, um fragmento de credencial não deve entrar no histórico do Git.

---

## 2. Trabalho não commitado

8 arquivos alterados, 2 novos. Nenhum commit, push ou deploy.

| Arquivo | Correção |
|---|---|
| `src/modules/auth/role-home.ts` | `curador_medico` faltava — Curador caía na Landing ao logar. Paciente redirecionado para `/portal-paciente` |
| `tests/unit/role-home.test.ts` | Teste que impede a regressão acima |
| `src/components/curadoria/phase-navigator.tsx` | Fases sem tela de trabalho marcadas "só leitura" |
| `src/app/portal-curador/casos/[id]/[fase]/page.tsx` | Tela declara que é definição, não execução |
| `src/components/curadoria/legacy-surface-notice.tsx` *(novo)* | Aviso nas superfícies do ACE antigo |
| `src/app/curador/page.tsx` · `src/app/paciente/page.tsx` | Aviso aplicado |
| `src/modules/curadoria/cos/repository.ts` | Teto de 60 casos — contém o N+1 (~14 queries × N) |
| `supabase/schema-curadoria-producao.sql` *(novo)* | Schema real de produção, 3.911 linhas |

Fora do git: `.env.local` teve 2 linhas de texto livre comentadas — quebravam o parser da CLI do Supabase. Nenhum valor alterado.

**Verificado**: `tsc` limpo · `next lint` limpo · **799 testes** · build compila.

---

## 3. Alterações já aplicadas em produção

Autorizadas pelo Fundador, irreversíveis.

**Limpeza de dados de homologação** (outra sessão havia populado o banco):

| | Antes | Depois |
|---|---|---|
| Casos | 27 | **2** |
| Pessoas | 28 | **3** |
| Profissionais | 79 | **3** |
| Perfis / seleções / relatórios | 25 / 23 / 22 | **0** |

Preservados: os 2 casos não-automatizados e os 11 artefatos do ACE. Os 3 profissionais restantes foram completados com os campos que o Motor lê e marcados como demonstração.

**Restaram 40 contas órfãs em `auth.users`** (43 no total, 4 com perfil). São lixo de homologação. Não removi — não apago contas.

---

## 4. Fronteira decidida pelo Fundador

- **Aliviar** = `aliviar-conexao` + **CRM** → permanecem em `aliviar-2-prod`, schema `curadoria`
- **AliCIA** = produto separado → **deve sair** para projeto Supabase próprio

Isso simplifica a separação: nenhum código da Aliviar muda de env var. A migração é de **1,8 MB** e cabe a quem cuida da AliCIA.

**Zero FKs cruzam os schemas** — os dados já são independentes. O acoplamento restante é de infraestrutura: `auth.users` compartilhado, histórico de migrations único, storage `patient-documents` com 20 objetos de dono indeterminado.

Existe **um trigger** em `auth.users`: `on_auth_user_created_curadoria` → `curadoria.handle_new_user`. Ele dispara para **todo** usuário, inclusive da AliCIA.

---

## 5. Impedimentos

| | Impedimento | Estado |
|---|---|---|
| **C1** | Schema do CRM auditável | ✅ **resolvido** — no dump |
| **C2** | Testes de integração sem valor probatório | ⛔ **ver §6** |
| **C3** | Infraestrutura compartilhada com AliCIA | 🟡 plano definido, execução do outro time |
| **C4** | **Sem ponte entre `crm_cases` e `curadoria.cases`** | 🟢 **decidido** — ver `CORRECAO_DOMINIO_PAPEIS_E_CASE.md`; execução pendente |
| **A1** | `/portal-curador` → `/coa/curadoria` em produção | ⛔ **config no painel Vercel**, não no código |
| **A3** | Histórico de migrations divergente | 🟡 parcial |

### C4 — decidido pelo Fundador em 2026-07-24

Existem **duas noções de Caso** no schema `curadoria`, sem nenhuma FK entre elas:

- `curadoria.cases` — o Caso do Método (Ontologia §3.2)
- `crm_cases` — o Caso do CRM

**A decisão**: existe apenas `Case`, e é `curadoria.cases`. O mesmo Case percorre a jornada inteira, mudando de responsável, nunca de identidade. O CRM é plataforma, nunca ator.

Plano de unificação em 4 fases, migrations e os 9 testes obrigatórios: **`docs/CORRECAO_DOMINIO_PAPEIS_E_CASE.md` §5 e §8**. Exige autorização — altera produção.

### Correções de dois achados anteriores

O papel `concierge` **não é o papel do CRM** — é o **Nível 3**, o acompanhamento do paciente *depois* da Curadoria. Também **não é órfão**: tem função definida no domínio; o que falta é a superfície.

O papel `atendente` (**Nível 1**, quem abre o Case) **não existia** no catálogo. Foi criado em 2026-07-24 pela migration `papel_atendente_nivel1` — aditiva e reversível. Ninguém o tem ainda.

---

## 6. Próximo passo exato (fecha o C2)

> **ATUALIZADO 2026-07-24**: os 35 `CREATE TRIGGER` já foram extraídos via MCP e
> anexados ao `schema-curadoria-producao.sql`. Os cinco invariantes do Método
> estão presentes e verificados. **Restam apenas os passos 4 e 5** abaixo:
> `supabase db reset` local e rodar os 133 testes de integração.

O dump trouxe 46 tabelas, 119 policies e 107 funções — mas **0 `CREATE TRIGGER`**.

Isso importa: os invariantes do Método (soma exata de 100, imutabilidade do Perfil validado, exatamente três opções) são impostos por **trigger**. Um banco local recriado do dump teria as funções presentes e **nenhuma ativa**.

**O que fazer:**

1. Consultar `pg_trigger` em produção para os triggers do schema `curadoria`
2. Gerar os `CREATE TRIGGER` correspondentes
3. Anexar ao `schema-curadoria-producao.sql`
4. `supabase db reset` local
5. Rodar os 133 testes de integração — pela primeira vez com schema fiel

**Não usar `supabase db pull`.** Ele falha com conflito e sugere `migration repair --status reverted` para 26 migrations — isso reescreveria o histórico de produção, compartilhado com a AliCIA.

---

## 7. Aviso permanente

**Outra sessão escreve em produção sem coordenação.** Durante esta auditoria a AliCIA passou de 34 para 69 pacientes e surgiram 7 tabelas no schema `curadoria`.

Qualquer certificação vale até a próxima escrita concorrente. Antes de certificar de verdade, é preciso congelar a janela.

---

## 8. O que nunca foi medido

Lighthouse · Core Web Vitals · leitor de tela real · tablet, dobráveis e ultrawide · smoke test pós-deploy.
