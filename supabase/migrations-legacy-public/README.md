# Migrations legadas — schema `public` (arquivadas, não aplicáveis)

**Estas 32 migrations nunca produziram o banco de produção.** Elas descrevem o schema da V1.0 em `public.`; a produção real (`aliviar-2-prod`, projeto `awdlmeykminwyifnygkm`) tem todas as tabelas do aliviar-conexao no schema **`curadoria`**, criadas por migrations com nomes que não existem neste diretório.

Evidência levantada na Fase 0 da MISSÃO 209:

| | |
|---|---|
| Arquivos que estavam em `supabase/migrations/` | 32 |
| Migrations aplicadas em produção | 20 |
| **Timestamps coincidentes** | **0** |
| Tabelas que estes arquivos criam em `public.` | 34 |
| Tabelas que criam em `curadoria.` | 0 |

## Por que foram arquivadas, e não apagadas

1. **Rastreabilidade.** São o registro fiel de como o schema da V1.0 foi desenhado, incluindo as decisões de RLS, os invariantes append-only e os comentários que explicam cada escolha. Nada disso está perdido.
2. **Referência de conteúdo.** O schema `curadoria` em produção é semanticamente equivalente ao que estes arquivos descrevem; a diferença é o schema de destino e o caminho de aplicação.
3. **Governança.** `docs/DOCUMENTATION_GOVERNANCE_POLICY.md` trata a morte de um documento como decisão explícita, não como remoção silenciosa.

## O que NÃO fazer com este diretório

- **Nunca** aplicar estes arquivos em `aliviar-2-prod`. Criariam 34 tabelas duplicadas no schema `public`, que pertence à **AliCIA** — outro produto, com 34 pacientes e 34 jornadas reais.
- **Nunca** rodar `supabase db push` ou `supabase db reset` a partir deste diretório contra o banco compartilhado.

## O estado correto de `supabase/migrations/`

Contém apenas o que foi de fato aplicado por esta linha de trabalho:

```
20260724022540_curadoria_stage7_metodo_curadoria_compartilhada.sql
```

O nome do arquivo agora bate exatamente com a versão registrada em `supabase_migrations.schema_migrations`.

## O que falta para a reconciliação ficar completa

As 7 migrations que construíram o schema `curadoria` (`curadoria_stage1_identity_foundation` … `curadoria_stage6_resilient_signup_trigger`) **ainda não estão versionadas neste repositório**. O SQL delas existe e é recuperável — está guardado em `supabase_migrations.schema_migrations`, ~87 KB no total.

Recuperar exige credencial que não está disponível no ambiente de desenvolvimento atual (`SUPABASE_ACCESS_TOKEN` ou a senha do banco). Com ela, o comando é:

```bash
npx supabase link --project-ref awdlmeykminwyifnygkm
npx supabase db pull --schema curadoria
```

Isso escreve os arquivos faltantes com os nomes e timestamps corretos, e a reconciliação fica completa.

### As 12 migrations do schema `public` são da AliCIA

`patient_journey_views_patient_owner_write`, `domain_snapshots`, `journeys_patient_owner_rls`, entre outras. Pertencem ao outro produto que compartilha o banco. **Não são vendoradas aqui por decisão** — este repositório não é dono delas.

Consequência a respeitar: como o histórico de migrations é compartilhado entre dois produtos no mesmo banco, este repositório **nunca** deve usar `supabase db push` contra produção. Migrations desta linha de trabalho são aplicadas de forma dirigida, uma a uma.

## Consequência conhecida, ainda aberta

Enquanto os 7 arquivos faltarem, `supabase db reset` local produz um schema **diferente** de produção. É a causa raiz do bloqueador **B6** da auditoria de readiness: os 133 testes de integração rodam contra um banco local que não corresponde ao real, então passar neles não prova nada sobre produção.
