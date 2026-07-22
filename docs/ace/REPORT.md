# EPIC-25 — Integração Canônica do ACE Melhorado

## 1. Inventário do ACE legado

| LEGADO | NOVO |
|--------|------|
| `SupabaseAnaliseRepository` criava `journey_events` diretamente | `ImprovedAceService` + `ace_analysis_runs` |
| Análise manual sem resultado estruturado | `executarAceMelhorado()` produz `AceStructuredResult` |
| Upload não disparava ACE | Upload em HISTORIA dispara ACE Melhorado automaticamente |
| Curador sem saída ACE | `ace_analise` em `CasoDeCuradoriaView` |
| Experience sem estado ACE real | `extensoes.ace_analise` na projeção da jornada |
| Auditoria genérica `JORNADA_ALTERADA` | `ACE_ANALISE_INICIO` / `ACE_ANALISE_FIM` |

## 2. Integração

Fluxo único: Paciente → Upload → ACE Melhorado → Jornada → Curador → Entrega.

- Upload: `supabase-patient-document-repository.ts` dispara ACE em HISTORIA
- Staff: `POST /api/v1/jornadas/{id}/analise-inicial` delega ao ACE Melhorado
- Projeção avança para ACE após análise concluída

## 3. Persistência

Tabela `ace_analysis_runs`: entrada, versão, resultado, duração, status, correlationId, retries.

Resumo em `patient_journey_views.extensoes.ace_analise`.

## 4. Experience

- Paciente: estados apropriados via `mapAceExperienceModel` com `ace_analise.resumo`
- Curador: `AceAnaliseCuradorSurface` consome exclusivamente saída do ACE Melhorado

## 5. Observabilidade

Eventos `ACE_ANALISE_INICIO` e `ACE_ANALISE_FIM` com duração, versão, status — sem conteúdo sensível nos metadados.

## 6. Migração

Código legado de `journey_events` direto removido de `SupabaseAnaliseRepository`.

Adapter mantém mesma porta (`AnaliseRepositoryPort`) delegando ao pipeline v2.

## 7. Testes

`improved-ace.test.ts` — análise estruturada, PARCIAL sem docs, ausência de decisão clínica.

`smoke-e2e.test.ts` — fluxo completo Upload → ACE → Curador → Entrega.

## 8. Autoauditoria

**ACE antigo ainda em uso?** Não — `SupabaseAnaliseRepository` delega 100% ao `improvedAceService`.

**Curador consome ACE Melhorado?** Sim — `supabase-curador-query.obterCaso()` busca `ace_analysis_runs`.

**Pipeline único?** Sim — uma tabela, um engine, um service.

**Código legado removível?** `journey_events` para análise inicial não é mais criado pelo adapter de análise.
