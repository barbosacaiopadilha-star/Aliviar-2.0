# ONE ALIVIAR — Relatório da Convergência

**2026-07-25.** Nada commitado, nada em push, nada em deploy.

## 1–2. Problemas encontrados × resolvidos

| Problema | Estado | Como |
|---|---|---|
| **P1 — Fases 2/3/6 do Curador sem CTA** | ✅ **Resolvido** | `PhaseDeclarationWorkspace` (UM componente para História e Caso): texto declarado pelo Curador + confirmação-ato acumulativa; Fase 6 ganhou CTA-link "Abrir o Perfil de Prioridades" — onde a validação de fato acontece. Nenhuma fase da Curadoria termina mais sem ação. Actions novas: `registerHistoriaAction` (narrativa + reconhecimento; confirmação nunca regride), `registerCasoAction` (contexto clínico como fato relatado). Tabelas já existiam — zero banco novo |
| **P5 — Admin abria em "Aquisição"** | ✅ **Resolvido** | Home reordenada: **"Onde agir agora"** primeiro (Sem responsável, Atrasados, Vencidas, Compromissos — os que doem, em destaque), depois Operação, depois Aquisição, depois tempos e gráficos |
| **P3/P4 — dualidade de porta de entrada (Atendente/Concierge)** | ✅ **Convergido na navegação** | O hub `/coa` e `resolveCoaHomePath` apontam para as jornadas auditadas (`/atendimento`, `/acompanhamento`); Concierge deixou de "morar" no Atendimento (resíduo do papel antigo). As telas de pipeline seguem montadas como **ferramenta** — pararam de competir como home |
| **P2 — duas homes de paciente** | 📋 **Mapeado; decisão é do Fundador** | ver §5 |

## 3. Problemas bloqueados (não improvisados, como a missão exige)

1. **Absorção estrutural de `/coa/atendimento` e `/coa/concierge`** (não só a navegação): as telas operam `crm_cases.pipeline_stage`. Eliminá-las de verdade = Fases 3c/4 da unificação do Case (**altera banco — proibido nesta missão e pendente de autorização sua**). Plano em `CORRECAO_DOMINIO_PAPEIS_E_CASE.md` §5.
2. **P2 — home única do paciente**: `/paciente` (dashboard editorial: estado do caso + documentos + linha do tempo, contratos testados) × `/portal-paciente` (Jornada do Método: etapas + prioridades + como funciona). Não há razão técnica para duas — há duas filosofias visuais. **Recomendação**: `/paciente` como home única (é onde estão os contratos de ansiedade testados), absorvendo de `/portal-paciente` a régua de etapas (via `ProgressTimeline`) e "Como está sendo feita"; redirect permanente depois. É escolha de produto — não a executei sem sua palavra.

## 4–5. Dualidades

**Eliminadas**: porta de entrada dos Níveis 1 e 3 (um destino por nível, três mapas de rota → fonte única); "fase que explica sem executar" (extinta nas 9 fases); default do Concierge no nível errado.
**Remanescentes**: telas de pipeline como ferramenta (até Fases 3c/4); duas homes de paciente (até sua decisão); duas gramáticas visuais Jornada×Gestão (deliberada — unificamos princípios e componentes, não a pele).

## 6–7. Impacto por perfil / ganhos

- **Curador**: jornada completa sem beco — da fase 1 à entrega, toda tela termina em decisão
- **Atendente/Concierge**: um único caminho de entrada; fim do "outro sistema" no login
- **Admin**: abre pelo que exige ação; institucional desceu
- **Paciente**: inalterado nesta missão (aguarda decisão P2) — contratos preservados
- **Plataforma**: biblioteca `journey/` como gramática única (JourneyHeader, NextActionCard, ProgressTimeline, EmptyJourneyState)

## 8. Testes

tsc 0 · lint limpo · **942 unit · 212 components · build ok** · integração 140/140 (rodada na M1; nenhuma mudança de servidor além das 2 actions novas, cobertas pelo padrão validado do Acolhimento). Guard de rastreabilidade cobre o componente novo automaticamente.

## 9. Riscos

1. Quem usava `/coa/atendimento` como home nota a mudança de destino — as telas antigas seguem acessíveis por URL/painel admin
2. As duas actions novas escrevem em tabelas com RLS de curador já existente — mesma superfície de risco do Acolhimento (validada)
3. Sessão concorrente (Cursor) — release desta missão deve ser coordenado como os anteriores

## 10. Plano para os bloqueios

1. **Sua decisão A**: home única do paciente (recomendação: `/paciente` absorvendo a régua da Jornada) — 1 missão curta de código
2. **Sua decisão B**: autorizar Fases 3c/4 (fusão `crm_cases`→Case) — aí as telas de pipeline são absorvidas/desmontadas e a última dualidade estrutural morre
3. Depois de A+B: sweep final ONE LANGUAGE nas telas de pipeline remanescentes (hoje fora do fluxo principal)
