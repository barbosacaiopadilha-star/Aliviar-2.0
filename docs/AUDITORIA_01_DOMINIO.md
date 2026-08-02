# AUDITORIA 01 — DOMÍNIO

**Data:** 2026-08-02 · **Fase:** pós-certificação E2E (12/12 verdes, build `fd031d9-msbh0tko`, commit `fd031d9`)
**Natureza:** inspeção somente — nenhum código, migration, teste ou dado foi alterado por esta auditoria.
**Pergunta única:** *o domínio implementado hoje corresponde exatamente ao domínio aprovado?*

**Método da auditoria.** Cinco frentes de leitura independentes, cada uma verificando documento canônico × código × banco com evidência `arquivo:linha`: (1) ADRs 001–022; (2) ADRs 023–045; (3) Catálogo 1.0.0 (doc × migration × TypeScript); (4) núcleo do Método (Portas, Rede, Motor, Seleção, Relatório, §11 do Modelo); (5) as três jornadas (Paciente, Administrador, Curador). Critério de autoridade: o **corpo canônico** (MODELO_CURADORIA_V1, DECISIONS/ADRs, BASELINE, MANUAL_CURADOR, CATALOGO_CANONICO_PROPOSTA) + ADRs. Documentos marcados **"Proposto, não canônico"** no INDEX (FUNDAMENTOS, ONTOLOGIA, EXPERIENCE_BIBLE, CURATION_ENGINE_SPECIFICATION, OPERATIONAL_ROLES_MODEL) não geram divergência de domínio — geram, quando conflitam, item de revisão documental.

---

## 1. Mapa do domínio

### 1.1 As camadas aprovadas e onde vivem

| Camada do Método | Autoridade aprovada | Implementação |
|---|---|---|
| **História** | ADR-018 (conta prévia, persistência server-side, imutável após envio); STORY-* no backlog | `src/modules/story/*`; `patient_stories` (revision + trigger, índice único de rascunho `20260802120000`) |
| **Caso** | ADR-019 (taxonomia de 9 estados), ADR-020 (notas append-only), ADR-038 (descarte auditado) | `curadoria.cases` + `case_events`/`case_notes`; `discard_case_admin` (`20260727140000`) |
| **Perfil de Prioridades** | ADR-042 (reconhecimento é ato da paciente; sem 100 pontos) | `priority_profiles`; RPC `acknowledge_priority_profile` (`20260728030000`) |
| **Mapa de Prioridades** | ADR-039 (subcritérios canônicos) + Catálogo 1.0.0 (`CATALOGO_CANONICO_PROPOSTA.md`) | `method_subcriteria` + `case_priority_map`; migration `20260802100000` (28 conceitos, 5 eixos, 166 opções) |
| **Portas (Área de Atuação)** | ADR-035 (declaração humana, nunca inferência) + MODELO §3.1 | `applyAreaGate` em `cruzamento.ts:88`; `area_compatibility_declarations` com autor |
| **Rede Elegível** | MODELO §3.2/§9; NC-22 (blocklist de divergência) | `loadMesaCruzamento` (`mesa-cruzamento.ts:161`); `rede-policy.ts`; `classifyProfessional` (`mesa-cruzamento-view.ts:81`) |
| **Motor de Compatibilidade** | ADR-040 (3 estados do profissional) + ADR-041 (4 resultados, nenhum score) | `motor-compatibilidade.ts` (matriz 5×3, pura, sem banco) |
| **Seleção dos três** | MODELO §8.2 + Engine I-09..I-12 | `mesa-selecao.ts`, `mesa.ts`, `mesa-workspace.tsx`; `curated_selections`/`curated_selection_options` |
| **Relatório** | MODELO §8.3 (rascunho assistido, autoria humana) | `relatorio-inteligente.ts` (proveniência por frase), `relatorio-assistido.ts`, `report-repository.ts` (5 carimbos) |
| **Painel da Paciente** | ADR-042 + EXPERIENCE (proposto) | `src/app/paciente/*`; `patient-curadoria.ts` (só lê seleção DELIVERED + relatório entregue) |
| **ACE** | ADR-035/036/037 — **sem autoridade operacional** | `runAceExecution` inalcançável de produção (não exportado; chamadores só em testes de certificação) |
| **Connection/Relationship** | ADR-027/028/043/044 | `src/modules/connection/*`; `approach_attempts`, `team_notifications` |

### 1.2 Papéis

- **Paciente** — entra pelo Admin (sem cadastro público), conta a história, reconhece o Perfil (ato único e idempotente), recebe o Relatório entregue com 3 caminhos qualitativos.
- **Administrador** — cadastra e verifica profissionais (sempre com fonte), publica sob gate de 5 condições no banco, cria pacientes com credenciais exibidas uma vez.
- **Curador Médico** — acolhe (história chega sozinha, nunca redigita), preenche o Mapa na conversa, declara as Portas com autoria, seleciona exatamente 3 com pareceres, emite e entrega o Relatório. Investigação não-linear: nenhuma etapa da Mesa é bloqueada; dependências são ditas.

---

## 2. Tabela — Decisão × Implementação × Status × Evidência

### 2.1 ADRs (as 45)

| ADR | Decisão | Status | Evidência-chave |
|---|---|---|---|
| 001 | Separação aliviar-conexao × aliviar-app | IMPLEMENTADA | schema `curadoria`; zero referências a aliviar-app em `src/` |
| 002 | AGENTS.md canônico | IMPLEMENTADA | CLAUDE.md:5 (ponteiro) |
| 003 | Infra só dev/gratuita, sem produção | **DIVERGENTE** | existe produção hospedada + Vercel (AMBIENTES.md) sem ADR revogadora |
| 004 | MVP busca/conexão direta | SUPERSEDIDA (021) | `src/modules/discovery/index.ts:1` (reservado) |
| 005 | Stack definitiva (incl. react-hook-form) | **PARCIAL** | react-hook-form: 0 ocorrências; formulários via Server Actions sem ADR da troca |
| 006 | Papéis por catálogo N:N | IMPLEMENTADA | `roles`/`user_roles`/`has_role` (stage1) |
| 007 | Supabase local provisório | PARCIAL | hospedado recebe migrations sem ADR de encerramento do provisório |
| 008 | Design System tokens + tipografia dupla | IMPLEMENTADA | globals.css:31-109; Fraunces/Inter |
| 009 | AppShell único, 3 papéis | **DIVERGENTE** | 3 shells (AppShell/PatientShell/PortalShellContainer); curador com 3 endereços (`/curador`, `/portal-curador`, `/coa/curadoria`) |
| 010 | 5 docs de marca/produto | CUMPRIDA (documental) | todos presentes |
| 011 | Nunca "Clinical Context" | **PARCIAL** | ACE limpo; mas `curadoria.case_clinical_context` + `clinicalContext` na Mesa (fora do escopo literal, contra o princípio) |
| 012 | core/ do ACE (ProtocolId etc.) | IMPLEMENTADA | `ace/core/protocol-id.ts` |
| 013 | "Care Provider", nunca "Specialist" | IMPLEMENTADA | `field-policy.ts:42-45` |
| 014 | Política de campos 3 camadas | IMPLEMENTADA | `field-policy.ts:26,57,120` |
| 015 | mandatoryConstraints no DecisionContext | IMPLEMENTADA | `decision-context.ts:15,55,69` |
| 016 | P010 comunica, nunca decide | IMPLEMENTADA | `final-curadoria.ts:395` (`decisional:false`) |
| 017 | Paleta + direção criativa + vídeo 10min | PARCIAL (vídeo SUPERSEDIDO 026/033) | globals.css:31 (#123b67 "ADR-017") |
| 018 | Sua História: conta prévia + concorrência otimista | PARCIAL | requireRole no wizard; `revision`+trigger; GET-que-grava fechado só por índice (STORY-GET-WRITE-001) |
| 019 | Taxonomia do Case + acesso do Curador restrito | **PARCIAL/DIVERGENTE** | taxonomia idêntica; acesso ampliado por migration `20260725230458` (fila sem dono + nome de qualquer paciente de Case) **sem ADR** |
| 020 | Notas append-only | IMPLEMENTADA | `case_notes` sem UPDATE/DELETE |
| 021 | Congelamento V1.0 | **DIVERGENTE** | ARCHITECTURE.md declara "Frozen"; ~45 migrations e módulos novos desde 24/07 sem ADR de reabertura |
| 022 | Golden Set gate do ACE | IMPLEMENTADA | `tests/golden/*`; fora do CI como a própria ADR determinou |
| 023 | Method Invariants | IMPLEMENTADA | 35 `assert*` em `ace/` |
| 024 | Content Invariant P003 | IMPLEMENTADA | `p003-case-audit.ts:117,177` |
| 025 | Um VALIDATED por Caso | IMPLEMENTADA | índice único parcial (legacy-public) |
| 026 | Vídeo Companheiro | SUPERSEDIDA (033/034) | HeroEditorial com HeroVideo |
| 027 | Connection → Implementado | IMPLEMENTADA | `src/modules/connection/*` |
| 028 | Relationship → Implementação em Auditoria | PARCIAL (por desenho) | matriz de capacidades documentada |
| 029 | Temporary Access (proposta) | NÃO IMPLEMENTADA (conforme) | nenhum módulo |
| 030 | Camada platform/ (independência mútua) | **DIVERGENTE (texto)** | 7 submódulos; `modules/ace/core → platform` autorizado pela ADR-035 §3, mas ADR-030 nunca atualizada; direção proibida (`platform → modules`) segue zero |
| 031 | Descongelamento Experience Continuity | NÃO-VERIFICÁVEL | citada no wizard layout |
| 032 | Golden Set Calibration P004/P010 | IMPLEMENTADA | `final-curadoria.ts:211-221`; `anthropic-language-model.ts` |
| 033 | Landing 2.0 — 11 seções, vídeo protagonista | **PARCIAL** | vídeo protagonista sim; produção tem 7 de 11 seções (faltam "Como funciona", "Curadoria Compartilhada", "Relatório", "Portal do Paciente", "Contato", "Como tomamos decisões") |
| 034 | Aliviar 3.0 DS proprietário | IMPLEMENTADA (pendência de ativo declarada) | `landing-editorial.css`; vídeo .webm antigo |
| 035 | Autoridade única de Curadoria (Método) | IMPLEMENTADA | `delivery-contract.ts:180-185` (precedência Método > ACE) |
| 036 | Descontinuação superfícies ACE | IMPLEMENTADA | zero painéis; `admin/ace` = observabilidade |
| 037 | ACE sem autoridade operacional | IMPLEMENTADA | `runAceExecution` não exportado; chamadores só em testes (remoção física de `submitHumanReview`/`deliverFinalCuradoria` prevista na §3 não ocorreu — sem chamador de produção) |
| 038 | Retenção/descarte de Cases | IMPLEMENTADA | `20260727140000` (Alternativa C, sem HTTP) |
| 039 | Mapa de Prioridades (26 subcritérios, 6 grupos=critérios) | **PARCIAL/DIVERGENTE** | tabelas conforme; catálogo evoluiu para 28/7 grupos + eixos por "decisão de Método 2026-07-31" **sem ADR** (a própria ADR-039 exige migration *e* ADR) |
| 040 | Mapa do Profissional (3 estados) | IMPLEMENTADA | `20260728020000`; ausência-de-linha ≠ NAO_INFORMADO preservado |
| 041 | Motor: 4 resultados, nenhum score | IMPLEMENTADA (uma lacuna nova) | matriz 5×3 pinada por teste; zero score/soma/ordenação; **exceção não prevista:** 2 conceitos de Viabilidade declaráveis pelo Case são invisíveis ao Motor (`motor:"NUNCA"`) sem categoria na ADR |
| 042 | Mapa substitui 100 pontos; reconhecimento é dela | IMPLEMENTADA | zero writes em `cruzamento_weights`/`priority_weights`; RPC com grant só `authenticated`; superfícies sem pontuação |
| 043 | Intermediação pós-decisão | PARCIAL (Incremento 1) | modos A/B (`20260801180000`); notificação externa e Q-C* seguem abertas, sem promessa nova à paciente |
| 044 | Tentativa × trabalho × notificação | IMPLEMENTADA (Status da ADR desatualizado) | `20260801200000` (4 estados, terminal=linha nova, worklist como projeção) |
| 045 | Reconvergência cromática | IMPLEMENTADA | origem única de cor + `paleta-unica.test.ts` |

### 2.2 Núcleo do Método (blocos verificados)

| Bloco | Status | Evidência |
|---|---|---|
| Portas — 4 estados, declaração humana com autor, justificativa obrigatória fora de COMPATIVEL, PARCIAL exige confirmação, INCOMPATIVEL→ELIMINADO, INSUFICIENTE→PENDENTE | **ADERENTE** | `cruzamento.ts:37-117`; `cruzamento-actions.ts:73-119`; `mesa-cruzamento-view.ts:81-136` |
| Rede — ativo+publicado+não-demo, emparelhamento certificação bidirecional, blocklist NC-22 aplicada na Mesa, exceção nunca vira Rede vazia, filtros com `null` = "verificar, não descartar" | **ADERENTE** | `mesa-cruzamento.ts:207-267`; `rede-policy.ts:31-41` |
| Motor — matriz 5×3=15 células com os 3 princípios, zero score/porcentagem/ranking/soma em todo o módulo | **ADERENTE** | `motor-compatibilidade.ts:70-96`; grep integral limpo; testes pinam a ausência |
| Seleção — exatamente 3 distintos, 3 campos obrigatórios de parecer, composição justificada, ordem=apresentação, autor humano, <3 é declarado | **ADERENTE** | `method.ts:14-30`; `mesa.ts:49-138`; `cos/conduction.ts:94-178` |
| Relatório — 5 carimbos, emitir≠entregar (2 etapas), qualitativo com proveniência por frase, rascunho assistido com revisão humana | **ADERENTE** (2 defeitos de código registrados em §5) | `relatorio-assistido.ts:218-227`; `relatorio-inteligente.ts:46-62,224-232` |
| Catálogo — doc × migration | **ADERENTE** (28/28 códigos, 5 eixos, 4/5/5/12/2, 166 opções, condicionais) | tabela integral no relatório do auditor 3 |
| Catálogo — migration × TS | **NÃO ADERENTE** | 16 divergências, 4 funcionais (ver §3.1) |
| Jornada Paciente (20 verificações) | **ADERENTE** (1 resíduo de vocabulário) | P1–P20 no relatório do auditor 5 |
| Jornada Admin (8 verificações) | **ADERENTE** (Caminho B sem superfície — lacuna já documentada) | A1–A8; gate de publicação = 5 condições no trigger `politica_de_fontes.sql:141-194` |
| Jornada Curador (13 verificações) | **ADERENTE** | C1–C13; nenhuma etapa BLOQUEADA por tipo |

---

## 3. Divergências encontradas

### 3.1 Catálogo 1.0.0 — TypeScript divergente do banco (a mais séria em código)

O doc e a migration estão **aderentes entre si**. O TypeScript, não — e existem **quatro fontes da verdade** (a tabela `method_subcriteria` + 3 arrays hard-coded: `mapa-prioridades.ts`, `evidencias-pratica.ts`, `protocolos.ts`), violando o princípio de fonte única escrito na própria migration (`20260802100000:95`). Divergências funcionais:

- **D1** — nome do eixo: TS usa `"ACESSO"`, o CHECK do banco só aceita `ACESSO_AO_CUIDADO` (`evidencias-pratica.ts:29` × migration:72).
- **D5** — 7 famílias de códigos de opção divergem do banco/doc (ex.: `TELEFONE_HORARIO_COMERCIAL` × `TELEFONE_EM_HORARIO_COMERCIAL`; faixas `FAIXA_ATE_300` × `ATE_300`; `ATE_2_ANOS` × `ATE_2`).
- **D6** — `VIABILIDADE_CUSTO_E_PAGAMENTO` achatado num único `options` no TS: permite gravar duas faixas de preço simultâneas, o que a estrutura por campos (doc+banco) impede.
- **D2/D4** — a **ordem canônica** do doc não é a do banco (`display_order` preserva a ordem legada, novos anexados ao fim; `MODELO_ALTERNATIVAS`/`PARTICIPACAO` trocados) e os três arrays TS divergem **entre si** (um segue o banco, outro segue o doc); os identificadores Q1..Q28 do Protocolo derivam da ordem de um array que nenhuma tela alimentada pelo banco exibirá.
- Menores: escapes universais só no TS (38 opções sem lastro no banco), condicional inventada (`SOB_AGENDAMENTO_ESPECIFICO`), condicionais do banco (`hide`, `value_not`) que nenhum TS lê, `minimumTier` divergente em 7 conceitos, `response_type` incapaz de representar o lado da paciente em 2 conceitos, `evidence_source` sem CHECK, perguntas cosmeticamente reescritas, `PRATICA_LIMITES_DE_ATUACAO` com prefixo `PRATICA_` em `group='EXPERIENCIA'`.
- A **prova de fechamento** garante "28 ativos versão 1.0.0" — mas não *quais* 28, nem distribuição por eixo, nem paridade com o TS.

### 3.2 Governança de decisão — mudanças reais sem ADR

- **ADR-039 → Catálogo 1.0.0:** a passagem de 26 conceitos/6 grupos para 28/7 (`VIABILIDADE`) + dimensão de eixos foi feita por migration referenciando "decisão de Método de 2026-07-31" (o doc do Catálogo) — mas a própria ADR-039 exige migration **e ADR** para mudança de catálogo. A decisão existe e está documentada; o registro no log de decisões, não.
- **ADR-041 → Viabilidade fora do Motor:** dois conceitos declaráveis pelo Case são `motor:"NUNCA"` — uma terceira categoria ("declarado e invisível ao Motor") que a ADR-041 não prevê; o resumo do Motor não a conta.
- **ADR-019 → acesso do Curador:** migration `20260725230458` amplia o acesso (fila sem dono; display_name de qualquer paciente de Case) contra o texto "somente `assigned_curator_id = auth.uid()`", sem ADR.
- **ADR-021 → congelamento:** `ARCHITECTURE.md` ainda declara "V1.0 — Frozen"; ~45 migrations e módulos inteiros entraram desde então por descongelamentos escopados que não cobrem o volume real.
- **ADR-009 → AppShell único:** três shells e três endereços de curador, sem ADR.
- **ADR-005 → react-hook-form** nunca adotado (Server Actions + Zod no lugar), numa ADR "definitiva".
- **ADR-003 → produção existe** (hospedado + Vercel) sem revogação formal.
- **ADR-011 → vocabulário `clinical_context`** reintroduzido na camada que hoje decide (`case_clinical_context`, `clinicalContext` na Mesa) — fora do escopo literal (ACE), contra o princípio elevado a permanente.

### 3.3 Documento canônico do domínio defasado (a mais séria em documentação)

**`MODELO_CURADORIA_V1.md` descreve o Método anterior à ADR-042 e nunca foi versionado.** Continua "v1.0" apresentando como vigentes os dois orçamentos de 100 pontos, os cruzamentos 0–100, a escala 100%/50%/0% e a frase de cobertura — nada disso existe no código. O próprio §12 exige que toda ADR que altere a Curadoria atualize a versão do documento; a ADR-042 não o fez. O §11 (a tabela cuja função é impedir reinterpretação silenciosa) está errado em 2 de 6 linhas: a linha 1 descreve símbolos (`BLOCK_POINTS`, `CruzamentoResult`) que já não existem, e a linha 5 marca como "pendente" o rascunho assistido do Relatório, implementado há dias (`relatorio-inteligente/2.0.0`).

### 3.4 Divergências pontuais de superfície

- Rótulo **"Validação"** na tela da paciente (`profile-card.tsx:64`) — vocabulário morto pela ADR-042 na superfície mais visível dela.
- Landing em produção com 7 das 11 seções da ADR-033 (o conceito central — vídeo protagonista — está cumprido).

---

## 4. O que está aderente (e protegido)

1. **O coração do Método.** Portas (4 estados, declaração humana com autor e justificativa), Rede (política única com blocklist, exceção nunca vira lista vazia, `null` = verificar-não-descartar), Motor (15 células, 3 princípios, **zero** score/porcentagem/ranking/soma — verificado por grep integral e pinado por testes), Seleção (exatamente 3, pareceres, composição, ordem=apresentação, autoria), Relatório (qualitativo, proveniência por frase, emitir≠entregar), Painel da paciente (nada chega antes da entrega humana; comparação por textura, sem magnitude). **Tudo com evidência e teste.**
2. **A virada ADR-042 é real e completa**: zero escritas nos pesos aposentados; o reconhecimento é ato da paciente via RPC idempotente condicionada ao Mapa completo; nenhum número de ponderação atravessa a fronteira dela.
3. **O ACE está exatamente onde as ADR-035/036/037 o puseram**: motor histórico sob observação, inalcançável de qualquer superfície de produção.
4. **Catálogo doc × banco**: 28/28 códigos idênticos, 5 eixos, distribuição 4/5/5/12/2, 166 opções, condicionais — com migração de dados conservadora (fusão só quando fontes concordam; divergência vira `revisao_manual`, nunca resolução automática).
5. **Gate de publicação** no banco (5 condições) com espelho de pendências em português sincronizado por contrato declarado.
6. **Jornadas certificadas de ponta a ponta** (E2E 12/12) coerentes com o desenho aprovado: entrada sem cadastro público, história única e retomável, acolhimento sem redigitação, Mesa não-linear com dependências ditas, curador nunca cobrado por ato que é da paciente.

## 5. O que merece revisão (registrado sem correção, conforme a regra)

**Defeitos de código observados (candidatos a correção pós-auditoria):**
1. `rede-policy.ts:34` — **fail-open**: erro na consulta de divergências devolve blocklist vazia em silêncio (reabriria a NC-22 exatamente no cenário de falha).
2. `report-repository.ts:159` — a entrega **sobrescreve `emitted_at`**, perdendo a data real da emissão.
3. `report-repository.ts:46-63` — `saveReport` só bloqueia por `delivered_at`; "congela ao emitir" depende apenas do trigger do banco.
4. `schema.ts:27,74` — schemas de peso 0–100 do modelo aposentado ainda em código executável.
5. Dois estados para "sem declaração de área": `AGUARDANDO_DECLARACAO` (Mesa) × `INFORMACAO_INSUFICIENTE` (`applyAreaGateForCase`) — mesmo fato, leituras diferentes.
6. Comentários mortos: `repository.ts:216-217` (nega a NC-22 que o mesmo arquivo aplica 19 linhas abaixo); `cos/journey.ts:1,218` ("seis etapas" para uma jornada de quatro).

**Decisões de governança pendentes:**
7. Registrar em ADR o Catálogo 1.0.0 (28/7+eixos) — a decisão existe, o registro exigido pela ADR-039 não.
8. Decidir o lugar da Viabilidade na ADR-041 (categoria "declarado, fora do Motor").
9. Regularizar ADR-021 (reabertura formal ou atualização do status em ARCHITECTURE.md), ADR-019 (acesso do Curador), ADR-009 (shells/rotas), ADR-005 (stack), ADR-003 (produção), ADR-011 (vocabulário clínico na Mesa).
10. Decidir o status do `CURATION_ENGINE_SPECIFICATION.md`: "Proposto" no cabeçalho, citado como autoridade em 6+ pontos do código.
11. `criterion_declarations` (6 critérios × 4 estados, obrigatórios na tela) — única peça viva do núcleo que nenhum documento vigente descreve.

**Documentação canônica a atualizar (sem mudar código):**
12. `MODELO_CURADORIA_V1.md` → versão pós-ADR-042 (§2, §7, §8.1, §11 linhas 1 e 5, §12).
13. `MANUAL_CURADOR.md` (portas bloqueantes, "Validação", pesos 2×100 — tudo anterior).
14. `PORTAL_PACIENTE.md` (descreve mocks de uma geração atrás) e `PORTAL_CURADOR.md` §Módulo 4 ("sem persistência").
15. `EXPERIENCE_BIBLE.md` §6/§Etapa 3 (pesos; "validação dita, não clicada" — hoje existe o aceite clicado da ADR-042, que preserva o espírito mas contradiz a letra).
16. INDEX.md: entrada do MODELO ainda anuncia "dois cruzamentos independentes" (fundidos pela M4).
17. Definir a autoridade documental da Home do paciente (revelação progressiva "Conhecer meu Perfil" só especificada em `docs/experiencia/*`).

**Consolidação técnica sugerida pela evidência (não executar nesta fase):**
18. Fonte única do Catálogo — hoje 1 tabela + 3 arrays TS que já divergiram (D1–D16); a interface não lê `conditional_rules` do banco.

---

## 6. Conclusão objetiva

**O domínio ainda possui divergências.**

Com precisão: **a espinha dorsal do Método aprovado está implementada, verificada e protegida por teste** — as quatro Portas com declaração humana, a Rede com política única e exceção jamais silenciada, o Motor de 4 resultados sem nenhum score, a seleção de exatamente três com autoria, o Relatório qualitativo com proveniência e a fronteira da paciente intacta. Nenhuma violação dos princípios inegociáveis (nenhum ranking, nenhuma pontuação, nenhuma autoridade de máquina sobre decisão humana) foi encontrada em código executável.

As divergências reais concentram-se em três famílias, por gravidade:

1. **Catálogo: o TypeScript divergiu do banco** (4 divergências funcionais + 12 menores; quatro fontes da verdade onde o aprovado exige uma). É a única família com potencial de efeito funcional silencioso.
2. **Governança: decisões reais executadas sem o registro que as próprias ADRs exigem** (Catálogo 28/7 sem ADR; acesso do Curador ampliado por migration; congelamento da ADR-021 factualmente inoperante; Viabilidade fora do Motor sem categoria na ADR-041).
3. **Documentação canônica defasada: o `MODELO_CURADORIA_V1.md` descreve o Método que a ADR-042 aposentou**, e o mecanismo desenhado para impedir exatamente isso (§11/§12) não foi acionado.

Nenhuma dessas famílias indica que a reconstrução traiu o domínio — a evidência aponta o contrário: o código executa o Método aprovado com mais fidelidade do que os documentos o descrevem. O risco vigente é de **deriva futura**: com o documento canônico apontando para o modelo antigo e o catálogo com quatro fontes, a próxima mudança bem-intencionada tem mais de um lugar "oficial" para se apoiar — e pode escolher o errado.

*Nenhuma correção foi proposta nem aplicada neste documento, conforme a regra da auditoria.*
