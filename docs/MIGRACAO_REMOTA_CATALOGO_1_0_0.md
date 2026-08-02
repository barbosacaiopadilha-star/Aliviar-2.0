# Dossiê de aplicação remota — Catálogo Canônico 1.0.0

> **Estado: AGUARDANDO AUTORIZAÇÃO EXPLÍCITA.** Nada foi aplicado no projeto
> hospedado. Todos os números abaixo vieram de **consultas somente de leitura**
> contra o banco remoto, em 2026-08-02. As duas migrations já estão aplicadas e
> validadas no banco local.

## 1. Migrations exatas, em ordem

| # | Arquivo | Natureza |
|---|---|---|
| 1 | `supabase/migrations/20260802100000_catalogo_canonico_1_0_0.sql` | DDL aditiva + seed do catálogo |
| 2 | `supabase/migrations/20260802110000_migracao_dados_para_catalogo_1_0_0.sql` | Migração de dados com proveniência |
| 3 | `supabase/migrations/20260802120000_uma_historia_em_rascunho_por_paciente.sql` | Consolidação + índice único parcial |

A ordem entre 1 e 2 é obrigatória: a segunda referencia códigos que a primeira
insere. A terceira é **independente das duas** (toca outra tabela e outro
domínio) — o timestamp a coloca por último, e é assim que `db push` a aplica.

### 1B. A terceira migration — uma história em rascunho por paciente

**O que resolve:** `getOrCreateActiveStory` lê-depois-insere sem trava, e
`/sua-historia/continuar` é um GET que grava. O prefetch do Next.js executa
esse GET sem clique; observado em execução real, uma paciente terminou com
**duas histórias criadas com 47 microssegundos de diferença** — a do prefetch
vazia, a do clique com as respostas dela.

**Operações:** (a) guarda que **aborta** se algum paciente tiver mais de um
rascunho com conteúdo; (b) `delete` dos rascunhos **vazios** quando existe
outro rascunho do mesmo paciente; (c) `create unique index … (profile_id)
where status = 'rascunho'`.

**Definição de "conteúdo relevante":** `data` cujo texto, após `btrim`, não é
`''`, `'{}'` nem `'null'`. Uma única resposta gravada já qualifica. O critério é
conteúdo — `created_at` só desempata **entre dois vazios**. A regra inicial
usava só a data e teria descartado o que a paciente escreveu; a correção está
coberta por 7 cenários em
`tests/integration/consolidacao-rascunhos-duplicados.integration.test.ts`.

**Estimativa remota (leitura, 2026-08-02):**

| Métrica | Remoto |
|---|---|
| Pacientes | 2 |
| Histórias (total) | 8 — 3 rascunhos, 5 enviadas |
| Pacientes com **1** rascunho | 3 |
| Pacientes com **mais de 1** rascunho | **0** |
| Pares vazio + conteúdo | 0 |
| Pares com dois conteúdos (abortariam) | **0** |
| Linhas que seriam consolidadas | **0** |

Conclusão: no remoto de hoje a migration **não apaga linha nenhuma** e não
aborta — cria apenas o índice. Histórias `enviada` ficam fora do predicado, e
uma nova história continua podendo nascer depois que a anterior é enviada
(cenário coberto por teste).

**Risco de bloqueio durante a criação:** `CREATE UNIQUE INDEX` sem `CONCURRENTLY`
toma `SHARE` em `patient_stories` e bloqueia escritas enquanto constrói. Com 8
linhas, é instantâneo. Se a tabela crescer antes da janela, trocar por
`CREATE UNIQUE INDEX CONCURRENTLY` — que **não pode** rodar dentro de
transação, exigindo aplicar essa migration à parte.

**Rollback:** `drop index curadoria.patient_stories_um_rascunho_por_paciente;`
Nenhum dado é recriado, porque nenhum foi apagado (0 linhas consolidadas).

**Revisão manual:** se, entre esta leitura e a aplicação, surgir um paciente
com dois rascunhos com conteúdo, a migration **para** e nomeia quantos são.
A decisão é humana: abrir os dois, ver qual conta a história dela, e enviar ou
descartar o outro pela interface — nunca por SQL às cegas.

**Compatibilidade com o código novo:** o índice exige o tratamento de `23505`
em `getOrCreateActiveStory` (nesta release). Aplicar a migration **sem** o
código novo faria a corrida virar erro visível para a paciente em vez de
resolução silenciosa. Vale a mesma regra de janela única das outras duas.

## 2. Operações, por migration

**20260802100000 — Catálogo 1.0.0**

- `alter table curadoria.method_subcriteria`: substitui o CHECK de `"group"`
  (acrescenta `VIABILIDADE`) e **adiciona colunas** — `axis`, `catalog_version`,
  `professional_question`, `patient_question`, `response_type`, `cruzamento`,
  `required`, `conditional_rules`, `evidence_source`, `review_months`. Nenhuma
  coluna existente é alterada ou removida.
- `create table if not exists curadoria.method_subcriterion_options` + RLS
  (select para `authenticated`) + grants.
- `update` de classificação nos 20 conceitos que permanecem (eixo, versão,
  perguntas, tipo de resposta, regras condicionais).
- `update ... set active = false` em **6 códigos aposentados**. Nunca DELETE.
- `insert ... on conflict do update` de **8 conceitos novos** e de **166 opções**.
- Bloco `do $$` final que **aborta a transação** se o catálogo não terminar com
  exatamente 28 ativos, todos com eixo e versão `1.0.0`.

**20260802110000 — Dados**

- `create table if not exists curadoria.catalog_migration_log` + RLS (admin).
- Copia as linhas de `case_priority_map` e `professional_subcriterion_map` do
  código renomeado e das duas fusões **quando as fontes concordam**; divergência
  vira `revisao_manual` (registro, nunca decisão automática).
- Registra `apenas_historico` para `HISTORICO_REGULARIDADE`.
- **Nenhum UPDATE ou DELETE em linha legada.** Só INSERT nas tabelas de destino
  e no log.

## 3. Tabelas afetadas

| Tabela | Efeito |
|---|---|
| `curadoria.method_subcriteria` | +10 colunas, CHECK ampliado, 26 linhas reclassificadas, 6 desativadas, 8 inseridas |
| `curadoria.method_subcriterion_options` | criada, 166 linhas |
| `curadoria.catalog_migration_log` | criada, ~12 linhas |
| `curadoria.case_priority_map` | +3 linhas (nenhuma alterada) |
| `curadoria.professional_subcriterion_map` | +3 linhas (nenhuma alterada) |

## 4. Estimativa de registros remotos afetados (leitura, 2026-08-02)

Estado remoto atual: **26 subcritérios** (todos ativos), **26** linhas em
`case_priority_map`, **26** em `professional_subcriterion_map`, 6 profissionais,
3 casos. `method_subcriterion_options` e `catalog_migration_log` **não existem**.

Cada código aposentado tem exatamente **1 linha** em cada um dos dois mapas.
Verificação das fusões (leitura): dentro de cada par, os valores **concordam** —
`CASOS_SEMELHANTES` e `CONDICAO_OU_PROCEDIMENTO` ambos `MUITO_IMPORTANTE`;
`PRODUCAO_ACADEMICA` e `ENSINO_E_PESQUISA` ambos `RELEVANTE`; no lado do
profissional, os quatro `CONFIRMADO`.

Projeção do relatório de migração:

| Categoria | Linhas |
|---|---|
| `renomeacao` | 2 (1 case + 1 profissional) |
| `fusao_migrada` | 8 (4 case + 4 profissional) |
| `apenas_historico` | 2 |
| `revisao_manual` | **0** (nenhuma divergência remota) |
| **Linhas novas criadas** | 6 (3 em cada mapa) |

## 5. Backup

Antes de qualquer comando, snapshot lógico das tabelas tocadas (não exige
downtime):

```bash
pg_dump "$DATABASE_URL" --schema=curadoria --data-only \
  --table=curadoria.method_subcriteria \
  --table=curadoria.case_priority_map \
  --table=curadoria.professional_subcriterion_map \
  -f backup-catalogo-pre-1.0.0.sql
```

O Supabase mantém PITR no projeto; o dump acima é a rede de segurança rápida,
específica destas tabelas.

## 6. Rollback

Nenhuma linha é apagada e nenhuma coluna é removida, então o rollback é uma
troca de vigência — não uma restauração:

```sql
-- 1. Catálogo legado volta a vigorar; o 1.0.0 adormece.
update curadoria.method_subcriteria set active = (catalog_version = '0.9.0');

-- 2. Desfaz apenas as linhas que a migração de dados criou (rastreáveis pelo log).
delete from curadoria.case_priority_map
 where id in (select migrated_row_id from curadoria.catalog_migration_log
              where source_table = 'case_priority_map' and migrated_row_id is not null);
delete from curadoria.professional_subcriterion_map
 where id in (select migrated_row_id from curadoria.catalog_migration_log
              where source_table = 'professional_subcriterion_map' and migrated_row_id is not null);
delete from curadoria.catalog_migration_log;
```

As tabelas novas e as colunas novas podem permanecer: sem consumidor, são
inertes. Removê-las é opcional e não faz parte do rollback mínimo.

## 7. Riscos

| Risco | Probabilidade | Mitigação |
|---|---|---|
| Código da aplicação em produção ainda espera 26 conceitos | **Alta se o deploy não acompanhar** | Aplicar as migrations **junto** com o deploy do código desta release: `mapa-prioridades.ts` já espelha os 28 e valida o grupo `VIABILIDADE`; a versão anterior lança "grupo desconhecido: VIABILIDADE" |
| Case em curso com Mapa parcial | Média | O Mapa passa de 26 para 28 conceitos: dois novos entram como pendentes. Não corrompe nada — só reabre a completude, que é o comportamento correto do Método |
| Divergência em fusão | **Nula hoje** (0 linhas) | Se surgir entre a leitura e a aplicação, vira `revisao_manual` e nada é decidido automaticamente |
| Trigger de publicação recusando perfis | Nenhuma mudança | As migrations não tocam a política de fontes |

## 8. Validações pós-migração (somente leitura)

```sql
-- 28 ativos, todos 1.0.0 e com eixo (a própria migration aborta se falhar)
select axis, count(*) from curadoria.method_subcriteria where active group by axis order by axis;
-- esperado: ACESSO_AO_CUIDADO 4 · CONTINUIDADE_DO_CUIDADO 5 · MODELO_DE_ATENDIMENTO 5
--           PRATICA_E_TRAJETORIA 12 · VIABILIDADE_DE_ACESSO 2

select count(*) from curadoria.method_subcriterion_options;          -- esperado 166
select categoria, count(*) from curadoria.catalog_migration_log group by categoria;
-- esperado: renomeacao 2 · fusao_migrada 8 · apenas_historico 2 · revisao_manual 0

-- nada perdido: os 6 aposentados continuam existindo, apenas inativos
select code, active from curadoria.method_subcriteria where catalog_version = '0.9.0' and not active;
```

E, pela interface, em produção: abrir um profissional publicado e confirmar que
o Protocolo mostra os cinco eixos; abrir uma Mesa e confirmar que o Mapa lista
28 conceitos.

## 9. Comandos exatos, na ordem

```bash
# 0. Confirmar o alvo e o estado (nenhuma escrita)
npx supabase migration list --linked

# 1. Backup específico (seção 5)
pg_dump "$DATABASE_URL" --schema=curadoria --data-only \
  --table=curadoria.method_subcriteria \
  --table=curadoria.case_priority_map \
  --table=curadoria.professional_subcriterion_map \
  -f backup-catalogo-pre-1.0.0.sql

# 2. Aplicar as duas migrations pendentes, na ordem do timestamp
npx supabase db push --linked

# 3. Validar (seção 8), por leitura
```

`db push` aplica exatamente as duas migrations pendentes
(`20260802100000` e `20260802110000`) — o remoto está em `20260801220000`.

## 10. Ordem de execução recomendada

1. Deploy do código desta release em produção (ou janela em que os dois saem juntos).
2. Backup (seção 5).
3. `npx supabase db push --linked`.
4. Validações da seção 8.
5. Conferência pela interface (um profissional, uma Mesa).

**Nada disso acontece sem autorização explícita do usuário.**

### 1C. A quarta migration — a paciente lê o próprio Mapa

| # | Arquivo | Natureza |
|---|---|---|
| 4 | `supabase/migrations/20260802140000_paciente_le_o_proprio_mapa.sql` | Policy de SELECT (RLS) |

**O que resolve:** `case_priority_map` tinha uma única policy (admin/Curador).
A paciente não lia o próprio Mapa; o botão de reconhecimento — que só monta
quando há prioridades visíveis — nunca aparecia, e o ato central da ADR-042
("ela reconhece o Perfil como seu") era impossível pela interface. Capturado
no E2E do fluxo completo, PASSO 8, com a tela anunciando o próprio beco:
"Sem essa confirmação, nada avança".

**Policy criada:** `case_priority_map_select_patient` — `FOR SELECT TO
authenticated USING (curadoria.is_patient_for_case(case_id))`. Mesma função e
mesmo padrão das superfícies dela já existentes (`clinical_context_select_patient`).

**Escopo:** leitura, só do Case dela. **Nenhuma escrita**: a importância
continua registrada pelo Curador; o reconhecimento continua pelo RPC próprio
(`acknowledge_priority_profile`). Grants da tabela inalterados.

**Risco:** baixo — policy aditiva de SELECT, função `is_patient_for_case` já
auditada e em uso. Não afeta Curador, admin nem o Motor.

**Rollback:** `drop policy "case_priority_map_select_patient" on curadoria.case_priority_map;`

**Validações pós-deploy:** (a) paciente com Case ativo lê exatamente os itens
do próprio Mapa; (b) paciente sem Case não lê linha alguma; (c) INSERT pela
paciente recusado; (d) botão de reconhecimento visível quando o Mapa está
completo; (e) reconhecimento efetivado muda `priority_profiles.status`.

**Testes de autorização negativa:**
`tests/integration/paciente-le-o-proprio-mapa.integration.test.ts` — dona lê;
intrusa não lê; leitura não vira escrita (3 verdes, 2,2s).
