# Plano de Reconciliação do Ledger de Produção

> **Status:** pré-condição de publicação. Nenhum passo deste plano foi executado — produção não foi tocada nesta missão.
> **Data:** 2026-08-01 · **Projeto:** `awdlmeykminwyifnygkm` (aliviar-2-prod)

## 1. A deriva, investigada

**O que aconteceu.** Em 2026-07-31, durante o gate de produção, a migration `20260730100000_selecao_sem_banda` estava pendente no banco hospedado e foi aplicada — com autorização explícita — pela ferramenta MCP do Supabase (`apply_migration`). Essa ferramenta não aceita a versão do arquivo: ela **carimba o timestamp do momento da aplicação**. O ledger de produção registrou `20260731190334_selecao_sem_banda`.

**Consequência.** O conteúdo aplicado é **idêntico** ao arquivo do repositório (verificado na ocasião: `band` anulável, comentário gravado, 3 CHECKs preservados). Mas os identificadores divergem:

| | Repositório | Produção |
|---|---|---|
| Versão | `20260730100000` | `20260731190334` |
| Conteúdo | `alter column band drop not null` + comment | o mesmo |

Qualquer comparação mecânica (o guarda da NC-23, `supabase db push`, `migration list --linked`) verá **`20260730100000` como pendente** e **`20260731190334` como desconhecida** — para sempre, até a reconciliação.

**Risco se ignorado.** `supabase db push` tentaria **reaplicar** `20260730100000` em produção. O SQL é idempotente-inofensivo neste caso específico (`drop not null` de coluna já anulável passa; `comment` sobrescreve igual), mas operar contando com a sorte do SQL é exatamente o hábito que a NC-23 existe para matar.

**Regra que fica.** Migration em ambiente hospedado se aplica pelo fluxo da CLI (`supabase migration up --linked` / `db push`), que preserva a versão do arquivo. O MCP `apply_migration` serve para emergência autorizada — e cria dívida de ledger que precisa ser paga em seguida, como esta.

## 2. O estado completo a reconciliar

Produção está **4 migrations atrás** do repositório, além da deriva de nome:

| Migration local | Situação em produção |
|---|---|
| `20260730100000_selecao_sem_banda` | **aplicada com outro nome** (`20260731190334`) |
| `20260731220000_base_de_evidencias_de_pratica` | não aplicada |
| `20260731230000_practice_evidence_grants` | não aplicada |
| `20260731234000_practice_evidence_cascade` | não aplicada |
| `20260801100000_protocolos_oficiais` | não aplicada |

Há ainda o fato conhecido e **fora do escopo** desta reconciliação: 12 migrations antigas no ledger de produção sem arquivo no repositório (journeys/domain_snapshots, pré-schema `curadoria`) — registradas desde o gate, sem ação necessária.

## 3. O plano, passo a passo

Executar **nesta ordem**, com autorização explícita, numa janela sem operação ativa (hoje trivial: a Rede está vazia).

**Passo 0 — pré-condições.** Árvore limpa; `main` local = commit a publicar; backup/ponto de restauração confirmado no painel do Supabase; `SUPABASE_ACCESS_TOKEN` disponível para a CLI (o projeto já está vinculado: `supabase/.temp/project-ref` = `awdlmeykminwyifnygkm`).

**Passo 1 — reconciliar o nome da migration da M2** pelo comando oficial de reparo (só mexe no ledger, nunca no schema):

```bash
npx supabase migration repair --status reverted 20260731190334
```

```bash
npx supabase migration repair --status applied 20260730100000
```

Resultado: o ledger passa a dizer a verdade — o conteúdo de `selecao_sem_banda` está aplicado, sob o nome que o repositório conhece.

**Passo 2 — conferir a reconciliação** antes de aplicar qualquer coisa nova:

```bash
npx supabase migration list --linked
```

Esperado: `20260730100000` aplicada; `20260731190334` ausente; as 4 novas listadas como pendentes.

**Passo 3 — aplicar as 4 pendentes** pelo fluxo oficial (todas aditivas; a de `case_needs`/drafts e as da Base não tocam tabela existente):

```bash
npx supabase migration up --linked
```

**Passo 4 — verificação pós-aplicação** (somente leitura): `migration list --linked` sem pendências; smoke das guardas — `practice_evidence` recusa UPDATE; RLS nega leitura anônima de `practice_evidence`, `case_needs` e `practice_protocol_drafts`; advisors sem ERROR novo.

**Passo 5 — só então, o push do código.** O push em `main` dispara o deploy automático no Vercel; com o banco já à frente, o código nunca chega antes do schema — a lição do gate anterior, invertida de propósito.

**Rollback.** Passo 1 é reversível pelo próprio `migration repair` (trocando os status). As 4 migrations têm rollback documentado em comentário no próprio arquivo; nenhuma destrói dado.

## 4. Critério de pronto

A publicação fica autorizada quando: `migration list --linked` = zero pendências e zero desconhecidas (fora as 12 históricas registradas); guarda da NC-23 apontada ao hospedado não acusa nada; smoke técnico pós-deploy verde.
