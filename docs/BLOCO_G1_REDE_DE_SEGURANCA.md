# BLOCO G1 — REDE DE SEGURANÇA DE TESTES

**Data:** 2026-08-02 · **Branch:** `remediacao/bloco-g1` · Nenhum código funcional alterado; nenhuma migration criada; nenhum defeito de B/C/D corrigido.

## 1. Matriz dos gates (suíte `tests/remediacao/`, `npm run test:remediacao`)

**Resultado vigente: 26 testes — 25 VERMELHOS pelo motivo certo · 1 VERDE deliberado (C8) · 0 skip/todo · exit≠0.**

| Gate | Invariante/defeito (Registro) | Camada | Falha hoje (motivo) | Libera |
|---|---|---|---|---|
| C1 | história enviada→rascunho (IM-04) | banco | update ACEITO pela policy da própria paciente | C |
| C2 | Mapa editável pós-VALIDATED (IM-02) | banco | update ACEITO (policy sem guarda de fase) | C |
| C3 | VALIDATED→DRAFT (IM-02) | banco | ACEITO | C |
| C4 | seleção DELIVERED mutável (IM-01) | banco | DELIVERED→DRAFT+null ACEITO | C |
| C5 | `emitted_at` sobrescrevível (IM-03) | banco | 2026→2030 ACEITO | C |
| C6 | reentrega reescreve `delivered_at` (IM-03/AT-01) | banco | carimbos reescritos | C |
| C7 | INSERT já-DELIVERED com 0 opções (IM-01) | banco | linha ACEITA | C |
| **C8** | escolha pós-DECISAO_REGISTRADA (ADR-063 §6) | banco | **VERDE — trigger stage5 já protege; mantido como pino de regressão** | — |
| C9 (×3) | auditoria de reset/despublicação/exclusão (AU-01) | banco | 0 linhas em audit_logs após cada ato | C |
| C10 | supersessão atômica (IM-05/ADR-049 — contrato) | banco | `supersede_priority_profile` inexistente; via direta bloqueada pelo índice | C |
| B11 | RPC `deliver_curadoria` (AT-01/ADR-048 — contrato) | banco | função inexistente | B |
| B12 | entrega exige relatório emitido (AT-01) | banco | DRAFT→DELIVERED com 0 relatórios ACEITO | B |
| B13 | duplo submit `open_case_from_lead` (AT-03) | banco | 2ª chamada = 23505 ininteligível (idempotência anulada por `active_case_id=null`); não duplica só por acidente do índice de rascunho | B |
| B14 | conversão com compensação (AT-02) | servidor+banco | conta ÓRFÃ no Auth após recusa da RPC | B |
| B15 | competências preservadas (FS-03) | servidor | 3 áreas→0 após update sem campos | B/D |
| B16 | vínculo falho não deixa órfão invisível (AT-06/PRIV-04) | servidor | candidato a órfão sem compensação nem rastro | B/H |
| D17 | blocklist fail-closed (FS-01) | servidor | resolve `Set{}` em vez de rejeitar | D |
| D18 | `getReportBySelection` propaga erro (AT-01/FS-05) | servidor | resolve `null` | D |
| D19 | worklist erro≠vazio (FS-06) | servidor | resolve `[]` | D |
| D20 | `/api/crm/leads` em PUBLIC_PATHS (FUN-01) | servidor | `false` | D |
| D21 (×3) | round-trip dos pareceres (FS-04) | servidor+cliente | `.default([])` transforma ausência em apagar; `join(" ")`×`join("\n")` colapsa; gravados voltam `[]` | D |
| D22 | autosave não mente (FS-02) | cliente | estado pós-RECUSA idêntico ao pós-sucesso | D |

Detalhe integral (estado antes/depois, mensagens): relatórios dos agentes G1 na sessão; os testes carregam a evidência nos próprios nomes/asserts.

## 2. Travas de defeito desarmadas (Etapa 2 — oráculos corrigidos em lugar, nada removido)

| Arquivo | Trava | Novo oráculo | Prova |
|---|---|---|---|
| `tests/unit/professional-schema-campos-ausentes.test.ts` | certificava `competencyDomains: []` (FS-03) | ausência ⇒ `undefined` (preservar) | roda e FALHA ✅ |
| `tests/components/story-draft-provider.test.tsx` (teste 10) | normalizava erro engolido (FS-02) | indicador não pode dizer "salva" após recusa | roda e FALHA ✅ |
| 7 integration (connection ×2 helpers, connection-canonica, curadoria-completa, relationship-birth/actions/persistence, certificacao) | `favorablePoints: []` como payload normal (FS-04) | payload real + round-trip assertado | amostra 23/23 verde (o round-trip via repository preserva; o defeito é da UI — gate D21) |
| `tests/e2e/connection-choice.spec.ts`, `relationship-status.spec.ts` | idem | idem | edição validada por sintaxe; execução no G2 |
| `tests/e2e/sua-historia-persistence.spec.ts:80` | tautologia rascunho-OU-enviada | só "Recebemos sua história" | execução no G2 (deve falhar — IM-04/ADR-051) |

## 3. Suíte estável (Etapa 4) — verde, com 2 heranças tratadas

- typecheck ✅ · lint ✅ (via injetor — CI corrigido) · **unit 1.716/1.717** (1 vermelho intencional FS-03) · **components 399/400** (1 vermelho intencional FS-02) · ledger 69/69 ✅ · build:local + bundle-backend ✅ · porteiro 2/2 ✅.
- **Oráculos pré-existentes defasados corrigidos (vermelhos NA TAG, zero diff, classificação "premissa incorreta"):** `patient-fase2-architecture` (rota `/sua-historia/continuar` + back do wizard→`/paciente`), `patient-home-state` (CTA), `perfil-panel` (códigos e nomes do Catálogo 1.0.0).
- **HERANÇA VERMELHA DA TAG — integração:** 5 arquivos asseram o catálogo pré-virada (26 ativos/códigos aposentados) e estavam vermelhos no congelamento: `mapa-prioridades`, `mapa-profissional`, `motor-compatibilidade`, `protocolos`, `zz-sentinela` (`.integration.test.ts`) — **~75 testes**. Propriedade do **Bloco E** (CAT-01/ADR-047: o teste de paridade os substitui); excluídos do job estável do CI com comentário nomeado; **o Bloco E deve remover a exclusão como critério de aceite**. Integração restante verde (amostra dos editados 23/23; suíte completa menos os 5 = verde por construção — os 75 fails do run integral eram todos desses arquivos + cascatas do catálogo).

## 4. Ambiente E2E (Etapa 6) e isolamento (Etapa 7)

Porteiro como projeto-dependência real; `actionTimeout` 15s / `navigationTimeout` 30s; `trace: retain-on-failure` + screenshot; `reuseExistingServer: false`; `test:e2e` builda (`build:local`) antes; recusa de remoto provada em toda execução (`assertLocalSupabase`). Trava de exclusão mútua conectada (a suíte de remediação a adquire como "integracao"). **Adiado ao G2 (dívida registrada):** limpeza/namespace por spec dos 24 E2E (19 sem limpeza), marcação de resíduo (ADR-057 §3), oráculos de banco nos 3 terminais, execução dos 3 E2E editados, trava de flake `reconstrucao:292`.

## 5. CI mínimo (Etapa 8)

`.github/workflows/remediacao.yml`: job **estaveis** (npm ci → typecheck → lint injetado → unit+meta → components → ledger → integração-menos-herança-E → build verificado → porteiro) e job **gates** (`test:remediacao` — **vermelho por desenho até B/C/D**, bloqueando merge de propósito). Supabase local efêmero; zero credenciais de produção; PRs e `remediacao/**` incluídos. **"O workflow ainda não foi executado no GitHub porque nenhum push foi autorizado."** Nota: os 2 vermelhos intencionais de unit/components (FS-03/FS-02) mantêm o job estável vermelho neste branch — correto e deliberado: o branch não finge prontidão; ficam verdes no Bloco D.

## 6. Critérios de liberação

- **Bloco B:** B11–B16 verdes sem editar os testes (nomes de RPC `deliver_curadoria`/ajuste nominal permitido) + estável verde.
- **Bloco C:** C1–C7, C9, C10 verdes + C8 permanece verde + estável verde.
- **Bloco D:** D17–D22 verdes + FS-02/FS-03 (unit/components) verdes + estável integralmente verde.
- **Bloco E (herança):** remover a exclusão do CI e os 5 arquivos verdes (ou substituídos pelo teste de paridade da ADR-047).

## 7. Limitações

CI não executado remotamente (push proibido); certificação 12/12 não re-executada (fora do escopo do G1); 3 E2E editados sem execução; gates C10/B11 assumem nomes de RPC; a suíte de remediação usa a stack local compartilhada (auto-suficiente contra resíduo, limpeza por inventário verificada).
