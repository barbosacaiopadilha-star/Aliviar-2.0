# Procedimento da Via C — Invocação Administrativa Controlada do Emissor

| Campo | Valor |
|---|---|
| **Versão** | v1.0 |
| **Autor** | Agente 03 — Engenheiro/Implementador |
| **Data** | 2026-08-09 |
| **Decisão que o origina** | **DT-01 escolheu a VIA C** para o acionamento inicial do emissor (missão de pré-flight/go-live, §1) |
| **Base** | `41229d5` — Emenda DR3 publicada, ledger 116, Regra 001 `VIGENTE`/`PROVISÓRIA` |
| **Natureza** | procedimento operacional. **Zero código, zero migration, zero grant, zero Action, zero endpoint** |
| **Estado** | **PREPARADO — NÃO EXECUTADO.** Nenhum profissional escolhido, nenhuma evidência criada, nenhuma proposta emitida |

> Este documento **prepara** o ato. Ele não o executa e não autoriza executá-lo
> antes de existir um caso real, nascido do fluxo normal de coleta.

---

## 1. O que a Via C é — e o que ela não é

A Via C é **um ato administrativo pontual**: uma única invocação autorizada de
`curadoria.emitir_proposta_de_estado(...)` pelo canal privilegiado de
administração do banco, para **um** profissional real, **uma** vez.

| A Via C **é** | A Via C **não é** |
|---|---|
| ato administrativo, nominal e datado | fluxo |
| repetível caso a caso, sempre por decisão explícita | automatismo |
| autoridade residual **zero** | superfície permanente |
| o mesmo padrão já aceito no nascimento e na promoção da Regra 001 | precedente para a Via A |

**Se em algum momento o caminho técnico exigir criar superfície permanente —
`grant`, função nova, Action, endpoint, trigger — PARAR e devolver ao DT-01.**
Isso seria a **Via A disfarçada**, e a escolha entre A e C é do Fundador, não da
engenharia (§13 da missão).

## 2. Por que ela funciona sem nenhum grant

`curadoria.emitir_proposta_de_estado(uuid, text, uuid)` tem **zero `EXECUTE`**
para `anon`, `authenticated` e `PUBLIC` — revogado na migration do 2.C e
novamente na Emenda DR3. Verificado em produção nesta data:

```
11.2 emissor profissional · grant permanente → NENHUM (correto)
11.6 quem chama o emissor                    → NENHUM
11.7 triggers que chamam o emissor           → NENHUM
```

O **dono** da função a executa independentemente de grants — é assim que o
Postgres funciona. O canal administrativo do Supabase (SQL Editor / MCP
`execute_sql`) roda com esse papel. Portanto:

> **A invocação administrativa não cria permissão: ela usa a permissão que o
> papel de administração já tem, e não deixa nada para trás.**

Provado empiricamente no smoke da publicação da Emenda DR3 (2026-08-09): o
emissor executou por esse canal, com desfechos corretos, sem grant algum.

## 3. Pré-condições — todas obrigatórias, verificadas antes do ato

| # | Pré-condição | Como verificar |
|---|---|---|
| 1 | Existe `practice_evidence` **real** do profissional em `CONTINUIDADE_COORDENACAO` | consulta §4 |
| 2 | A evidência nasceu do **fluxo normal** (`registerPracticeEvidence`), não de SQL direto | proveniência: `collected_by` = pessoa real, `source_tier`/`source` = a entrevista |
| 3 | O profissional **não** tem declaração manual vigente no conceito | consulta §4 — `not exists` em `professional_subcriterion_map` |
| 4 | `catalog_version` da evidência **bate** com a do conceito | senão o desfecho será `CATALOGO_DIVERGENTE` |
| 5 | A Regra 001 continua `VIGENTE` no momento do ato | `curadoria.derivation_rule_state(...)` |
| 6 | A **Fronteira está publicada e alcançável** pelo administrador | ver §8 — hoje **não está** |

**A pré-condição 6 não é formalidade.** Sem ela a proposta nasce e fica órfã: o
marco de R-1 é o ato humano na Fronteira, não a emissão.

## 4. Consulta de elegibilidade — leitura pura, não altera nada

```sql
select e.professional_profile_id,
       pp.display_name,
       e.id            as evidence_id,
       e.version       as evidence_version,
       e.options,
       e.status,
       e.collected_at,
       e.collected_by,
       e.catalog_version
from curadoria.practice_evidence e
join curadoria.professional_profiles pp on pp.id = e.professional_profile_id
where e.subcriterion_code = 'CONTINUIDADE_COORDENACAO'
  -- a leitura corrente é max(version), igual à do emissor
  and e.version = (
    select max(e2.version) from curadoria.practice_evidence e2
    where e2.professional_profile_id = e.professional_profile_id
      and e2.subcriterion_code = e.subcriterion_code
  )
  -- exclui quem tem declaracao manual, SEM apagar nada
  and not exists (
    select 1
    from curadoria.professional_subcriterion_map m
    join curadoria.method_subcriteria s on s.id = m.subcriterion_id
    where m.professional_profile_id = e.professional_profile_id
      and s.code = 'CONTINUIDADE_COORDENACAO'
  )
  -- ainda sem proposta desta regra
  and not exists (
    select 1 from curadoria.derivation_proposals p
    where p.professional_profile_id = e.professional_profile_id
      and p.subcriterion_code = 'CONTINUIDADE_COORDENACAO'
  )
order by e.collected_at;   -- ordem natural da fila, NUNCA por desfecho provavel
```

**Regra de seleção:** o **primeiro** da fila. Não escolher por desfecho esperado;
não procurar quem provavelmente marcaria conduta positiva
(`PROTOCOLO_PRIMEIRO_ATO_R1.md` §2).

## 5. O ato — uma chamada, sem transação de conveniência

```sql
select curadoria.emitir_proposta_de_estado(
  '<professional_profile_id>'::uuid,   -- o escolhido em §4
  'CONTINUIDADE_COORDENACAO',
  '<actor_id>'::uuid                   -- quem pratica o ato administrativo
);
```

**Executar como ato definitivo (com commit).** Não usar `begin; … rollback;` —
esse padrão é do smoke, e uma proposta revertida não é proposta.

### 5.1 Uma limitação que precisa ser dita

O parâmetro `_actor_id` é **validado** (nulo devolve `ENTRADA_INVALIDA`) mas
**não é persistido**: o `insert` em `derivation_proposals` grava
`origin_author` — o autor da **evidência** — e nenhum campo com o autor da
**invocação**.

> **Consequência:** o banco não registra quem acionou o emissor. Enquanto a Via C
> for o regime, **o registro de quem invocou vive fora do banco** e é obrigação
> deste procedimento (§6). Se isso passar a incomodar, é argumento material para
> a Via A — mas é decisão do DT-01, não correção a fazer por conta própria.

## 6. Registro do resultado — obrigatório, fora do banco

Para cada invocação, lavrar em documento do rito:

| Campo | Conteúdo |
|---|---|
| data e hora | do ato administrativo |
| quem invocou | pessoa real, nominal (o `_actor_id` usado) |
| canal | SQL Editor do Supabase / MCP `execute_sql` |
| profissional | `professional_profile_id` |
| evidência | `id` e `version` |
| opções declaradas | conforme `practice_evidence.options` |
| `status` da evidência | tipicamente `nao_verificado` |
| **desfecho devolvido** | literal, sem reinterpretar |
| proposta | `id` se nasceu; **ausência é resultado válido** |
| resíduo | confirmação de que nenhum grant/função/Action/endpoint foi criado |

**Todos os oito desfechos são resultado válido de R-1**
(`PROTOCOLO_PRIMEIRO_ATO_R1.md` §7). Não repetir a coleta buscando outro
desfecho; não trocar de profissional porque o resultado "não ficou bom".

## 7. Verificação de autoridade residual zero — depois de cada ato

```sql
select 'grants no emissor'  as verificacao,
       coalesce(string_agg(grantee, ' | '), 'NENHUM') as observado
from information_schema.role_routine_grants
where routine_schema='curadoria' and routine_name='emitir_proposta_de_estado'
  and grantee in ('anon','authenticated','PUBLIC')
union all
select 'chamadores do emissor',
       coalesce(string_agg(p.proname, ' | '), 'NENHUM')
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='curadoria' and p.prosrc ~* 'emitir_proposta_de_estado'
  and p.proname <> 'emitir_proposta_de_estado'
union all
select 'triggers que emitem',
       coalesce(string_agg(tg.tgname, ' | '), 'NENHUM')
from pg_trigger tg join pg_proc p on p.oid=tg.tgfoid
join pg_class t on t.oid=tg.tgrelid join pg_namespace n on n.oid=t.relnamespace
where n.nspname='curadoria' and not tg.tgisinternal
  and p.prosrc ~* 'emitir_proposta_de_estado';
```

**Esperado, invariavelmente: `NENHUM` nas três linhas.** Qualquer outra coisa
significa que uma superfície permanente sobrou — **PARAR e devolver ao DT-01**.

Nenhuma credencial é criada, armazenada ou compartilhada em nenhum passo. O
canal administrativo autentica pelo mecanismo já vigente do projeto.

## 8. Encaminhamento à Fronteira — e o impedimento atual

Se a invocação devolver `EMITIDA`, a proposta nasce em `PROPOSTA` e deve ser
encaminhada ao administrador para o ato humano em
`/admin/fronteira-do-mapa` → `decidir_proposta` → `ATO_REGISTRADO`.

> ### ⚠️ Impedimento medido em 2026-08-09
>
> **A Fronteira do Mapa não está publicada em produção.** O domínio
> `aliviar-2-0.vercel.app` serve `main@97ed8b28`, e
> `src/app/admin/fronteira-do-mapa/page.tsx` **não existe nesse commit** — ele
> vive apenas na branch `curadoria/onda-1-9-1-10-proveniencia`, ainda não
> integrada nem publicada.
>
> `decidir_proposta` **existe no banco** com o seu único `EXECUTE` para
> `authenticated`, mas **não há superfície publicada que a alcance**.
>
> **Portanto: executar a Via C hoje produziria uma proposta que ninguém pode
> decidir**, e R-1 não atingiria o seu marco. A publicação da Fronteira é
> pré-condição da Via C, e é decisão do DT-01.

## 9. O que este procedimento nunca faz

- não escolhe profissional antecipadamente;
- não cria `practice_evidence`;
- não pede ao profissional que responda de um jeito específico;
- não marca evidência como verificada para destravar nada;
- não emite proposta fora de caso real;
- não decide proposta;
- não cria grant, função, Action, endpoint ou trigger;
- não persiste credencial;
- não estabelece threshold, taxa ou número mínimo de casos.

## 10. Quando R-1 passa a estar iniciada

> **R-1 — INICIADA** no primeiro `ATO_REGISTRADO` humano sobre proposta real da
> Regra 001, nascida de `practice_evidence` real.

Até lá: **R-1 — NÃO INICIADA**. Emissão sem ato humano não inicia R-1; desfecho
de não-emissão também não — houve observação da coleta, e isso deve ser dito
assim.

## 11. Relacionados

- `PROTOCOLO_PRIMEIRO_ATO_R1.md` — critério de seleção, rito de coleta e
  registro, oito desfechos, dez observáveis, sete stop conditions
- `REGRA_001_CONTINUIDADE_COORDENACAO.md` — a ficha da regra
- `CONTRATO_2_C` — a abertura da Fronteira e o **único** grant novo
- `EMENDA_DR3` — a conexão do DR3 ao emissor, sem abrir porta
