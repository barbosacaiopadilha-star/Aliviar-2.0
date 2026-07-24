# MISSÃO 209 — Fase 0: Inventário e Plano de Impacto

**Estado**: inventário concluído. **Nenhum código alterado, nenhuma migration aplicada.**
**Aguarda**: autorização expressa do Fundador para a Fase 1.

---

## 1. Supabase de destino — confirmado

| Item | Valor |
|---|---|
| Projeto | **`aliviar-2-prod`** |
| Ref | `awdlmeykminwyifnygkm` |
| Região | `sa-east-1` |
| Postgres | 17.6.1.147 |
| Schema do app | **`curadoria`** |
| Confirmação | `.env.local` aponta para `https://awdlmeykminwyifnygkm.supabase.co` |

**A AliCIA não é tocada.** No mesmo banco, o schema `public` pertence a ela (`journeys`, `patients`, `patient_journey_views`, `curator_case_workspaces`, `feature_flags`). Nenhuma operação desta missão escreve, lê para modificar, ou cria objeto em `public`.

**A decisão de schema está tomada pelos fatos**: o app já vive inteiro em `curadoria`. Não há escolha a fazer — há uma divergência documental a corrigir (item 3).

---

## 2. Schema atual — 26 tabelas em `curadoria`

### Identidade e papéis
`roles` (4) · `profiles` (2) · `user_roles` (3) · `user_settings` · `audit_logs`

Papéis atribuídos hoje: **administrador 1 · curador_medico 1 · paciente 1 · profissional 0**.

### Perfis de domínio
`patient_profiles` (0) · `professional_profiles` (**0**) · `professional_competency_areas` (**0**) · `patient_documents` · `professional_documents` · `patient_notifications` (1)

### História e Caso
`patient_stories` (2) · `patient_story_versions` (8) · `patient_story_attachments` · `cases` (1) · `case_events` (7) · `case_notes` (0)

### ACE antigo (P001–P010)
`ace_executions` (1) · `ace_artifacts` (3) · `ace_execution_events` (8) · `human_review_results` (0) · `final_curadoria_deliveries` (0)

### Connection / Relationship
`connection_records` (0) · `connection_events` · `relationship_records` (0) · `relationship_events`

### Nenhuma tabela do Método novo existe
`priority_profiles`, `priority_weights`, `priority_profile_filters`, `compatibility_analyses`, `compatibility_criterion_results`, `curated_selections`, `curated_selection_options`, `patient_curadoria_decisions` — **todas ausentes**.

---

## 3. Migrations — divergência crítica

| | Quantidade |
|---|---|
| Arquivos no repositório | **32** |
| Aplicadas em produção | **19** |
| Timestamps coincidentes | **0** |

Os 32 arquivos do repositório criam **34 tabelas em `public.`**. Produção tem tudo em `curadoria`, por migrations com nomes que não existem no repositório (`curadoria_stage1_identity_foundation` … `curadoria_stage6_resilient_signup_trigger`).

**Conclusão:** o diretório `supabase/migrations/` **não descreve o banco de produção**. Um `supabase db reset` ou `db push` a partir dele hoje produziria um schema diferente do real.

Isto é a divergência #3 já registrada na auditoria de readiness, agora quantificada.

---

## 4. Dados legados — o que existe de verdade

Um único Caso real, e ele **não está concluído**:

| Campo | Valor |
|---|---|
| Caso | `556b6ac7-262f-4bc6-90f0-c244517dd349` |
| Status | `WAITING_FOR_INFORMATION` |
| Criado | 2026-07-23 |
| Execuções ACE | 1 |
| Artefatos | 3 — `Narrative`, `DecisionCase`, `CaseAudit` |

O pipeline parou no **P003 (Case Audit)**, com prontidão bloqueada. Nunca chegou a `DecisionContext`, `CompetencyProfile`, `CompatibilityMatrix`, `Shortlist`, revisão humana ou entrega.

**Nenhuma Curadoria foi concluída em produção. Nenhum paciente recebeu resultado. Nenhuma entrega existe.**

Consequência para a migração: **não há Curadoria concluída para migrar**. O risco de perda de resultado clínico é zero.

---

## 5. Rede médica — o bloqueio material

`professional_profiles`: **0 linhas**. `professional_competency_areas`: **0 linhas**.

As colunas que o Motor de Compatibilidade exige **existem** e estão prontas:

| Coluna | Critério do Motor |
|---|---|
| `experience_level` | Experiência |
| `intake_approach` | Forma do primeiro encontro |
| `offers_continuous_care` | Acompanhamento contínuo |
| `availability_window` | Disponibilidade |
| `crm_uf` | Localização |
| `professional_competency_areas.domain` | Área de atuação |

Sem linhas, o Motor dispara `E-01` (universo esvaziado) em 100% dos casos. **Nenhum dado será inventado** — o cadastro é ato humano da equipe Aliviar, anterior e independente de qualquer paciente (Fundamentos §13, P6).

---

## 6. Mocks — o que sai de cena

1.119 linhas em dois arquivos, consumidos por **11 arquivos**:

| Arquivo | Linhas | Papel |
|---|---|---|
| `cos/mock-records.ts` | 575 | Três Memórias completas (Marina, Joaquim, Rosa) |
| `portal/mock-data.ts` | 544 | Seis casos do Painel + compatibilidades |

Consumidores: 9 rotas dos Portais + `activity-feed.tsx` + `case-card.tsx`.

**Nada disso é descartado na Fase 1.** Os mocks continuam sendo a fonte dos testes e do preview; o que muda é que as rotas passam a ler o banco.

---

## 7. Rotas — o mapa da migração

### Produto real hoje (ACE antigo, autenticado)
`/curador`, `/curador/casos/[id]`, `/curador/casos/[id]/revisao` · `/paciente`, `/paciente/curadoria`, `/paciente/linha-do-tempo`, `/paciente/documentos` · `/admin/*`

Todas usam `modules/concierge` e `modules/ace`. **Nenhuma importa `modules/curadoria`.**

### Método novo hoje (mocks, 404 em produção)
`/portal-curador` + 4 subrotas · `/portal-paciente` + 2 subrotas

Todas usam `modules/curadoria`. Bloqueadas em produção pelo middleware desde o deploy de hoje.

### O que a migração precisa resolver
O Método novo **nunca foi ligado ao produto**. A DECISÃO 1 da MISSÃO 002 — substituir o ACE automático — não aconteceu no código que roda.

---

## 8. Autenticação

| Superfície | Proteção |
|---|---|
| `/curador`, `/paciente`, `/admin` | `requireRole()` no layout + middleware |
| `/portal-curador`, `/portal-paciente` | **nenhuma** — em `PUBLIC_PREFIXES` |
| Produção | Portais devolvem 404 (`VERCEL_ENV=production`) |

Papéis disponíveis: `administrador`, `curador_medico`, `paciente`, `profissional`. **Não existe "Atendente"** — tensão aberta desde a ADR-006, e o Método a menciona na operação.

---

## 9. Backup e rollback

| Item | Estado |
|---|---|
| Backup automático Supabase | Plano do projeto — **a confirmar no painel** |
| Snapshot pré-migration | ❌ **não existe** |
| Rollback de aplicação | ✅ Vercel, deployment `dpl_1Pm58ZR4Xv2vL4Ysk3B1xaDdixrP` |
| Rollback de schema | ❌ nenhuma migration `down` escrita |

**Mitigante forte**: a Fase 1 é **puramente aditiva** — só `CREATE TABLE` de tabelas que não existem. Nenhum `DROP`, `ALTER` destrutivo ou `UPDATE` em tabela legada. O rollback é `DROP TABLE` das 8 novas, sem tocar em nada preexistente.

---

## 10. Proposta exata de schema — Fase 1

Derivada da Ontologia (§3) e do Curation Engine (§10, §11). **Idêntica em conteúdo** à migration `20260723000000_curadoria_compartilhada.sql` já revisada, com uma única mudança: **`public.` → `curadoria.`**.

### As 8 tabelas

| Tabela | Entidade da Ontologia | Invariantes que o schema garante |
|---|---|---|
| `priority_profiles` | Perfil de Prioridades (§3.4) | Validação coerente com status; um vigente por Caso |
| `priority_profile_filters` | Restrição (§3.7) + Observações | Valor não-vazio |
| `priority_weights` | Peso (§3.6) | **`evidence` NOT NULL** (Inv. 10); um por critério |
| `compatibility_analyses` | Compatibilidade (§3.10) | Faixa fechada; **sem policy de SELECT para paciente** (Inv. 26) |
| `compatibility_criterion_results` | Dimensões | `alignment` nullable = lacuna, nunca 0 disfarçado (Inv. 34) |
| `curated_selections` | Curadoria (§3.11) | **`selected_by` NOT NULL** (Inv. 13); exatamente 3 na entrega (Inv. 17) |
| `curated_selection_options` | Opção (§3.13) | Posição 1–3; sem repetição (Inv. 19) |
| `patient_curadoria_decisions` | Escolha (§3.14) | INSERT só do paciente (Inv. 14); "nenhuma destas" legítimo |

### Triggers
`enforce_priority_profile_validation` (soma 100) · `protect_validated_priority_profile` (imutabilidade, Inv. 28) · `enforce_selection_has_three`

### Funções auxiliares
`curadoria.is_curator_for_case()` e `curadoria.is_patient_for_case()`, com `search_path` fixo — **corrigindo de saída** o padrão que os advisors acusam nas funções legadas.

### Duas policies em tabela existente
Sobre `professional_profiles`: leitura para `curador_medico` (hoje só admin lê) e leitura ao paciente restrita aos profissionais das 3 opções entregues a ele.

**São as duas únicas alterações em objeto preexistente.** Ambas aditivas — `CREATE POLICY`, nenhum `DROP`.

---

## 11. Plano de impacto

| Área | Impacto | Risco |
|---|---|---|
| AliCIA (`public`) | **Nenhum** | — |
| ACE antigo | **Nenhum** — nenhuma tabela alterada | — |
| Caso legado | **Nenhum** — segue em `WAITING_FOR_INFORMATION` | — |
| `professional_profiles` | +2 policies de leitura | Baixo |
| Aplicação | **Nenhum na Fase 1** — nenhuma rota passa a ler as tabelas novas | — |
| Produção no ar | **Nenhum** — Portais seguem 404 | — |

**A Fase 1 é invisível para qualquer usuário.** Cria estrutura; não liga nada.

---

## 12. Casos legados em modo seguro

O único Caso real usa o ACE antigo e está bloqueado no P003. Proposta:

- **Preservar intocado.** Nenhuma tentativa de convertê-lo ao Método novo — não há Perfil de Prioridades validado, e fabricar um violaria o Inv. 33 (nada é inferido).
- **Rastreabilidade**: as tabelas novas não têm vínculo com `ace_artifacts`; um Caso pertence a um dos dois mundos, nunca aos dois.
- **Quando retomado**: por ser um Caso sem resultado entregue, pode reiniciar pelo Método novo com uma Consulta Inicial real — sem perda, porque não há nada a perder.

---

## 13. O que a Fase 0 encontrou e não estava previsto

1. **A divergência de migrations é maior do que "os arquivos usam `public`"** — os 19 nomes aplicados não existem no repositório. Reconciliar não é renomear schema; é reconstruir o histórico ou adotar o banco como fonte da verdade.
2. **`practical_considerations` existe em `professional_profiles`** (array, NOT NULL) e não está mapeada em `ProviderSnapshot`. Dado real disponível que o Motor ignora.
3. **`profiles` tem 2 linhas para 3 papéis** — uma mesma pessoa acumula papéis, como a ADR-006 prevê.

---

## 14. Sequência proposta — e onde cada porta exige sua palavra

| Fase | O que faz | Precisa de autorização? |
|---|---|---|
| **0** | Inventário (este documento) | — concluída |
| **1** | Criar as 8 tabelas em `curadoria` | ✅ **sua autorização** |
| **2** | Reconciliar `supabase/migrations/` com produção | Não (só repositório) |
| **3** | Ligar Portais ao banco, removendo mocks das rotas | Não (sem deploy) |
| **4** | Autenticação real nos Portais; sair de `PUBLIC_PREFIXES` | Não (sem deploy) |
| **5** | Cadastrar rede médica inicial | ✅ **sua autorização** (dado real) |
| **6** | Remover bloqueio de produção e apontar `/curador` e `/paciente` | ✅ **sua autorização** (deploy) |

---

## Recomendação para a Fase 1

**Aplicar.** É aditiva, reversível por `DROP` das 8 tabelas, invisível para usuários, não toca na AliCIA nem no ACE antigo, e não há Curadoria concluída em risco.

Peço, antes: **confirmar no painel Supabase que o backup automático do projeto está ativo.** Não consigo verificar isso pelas ferramentas disponíveis, e é a única salvaguarda que não depende de mim.
