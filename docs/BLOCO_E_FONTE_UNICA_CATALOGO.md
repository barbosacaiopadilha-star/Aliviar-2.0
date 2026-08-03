# BLOCO E — FONTE ÚNICA DO CATÁLOGO 1.0.0

**Data:** 2026-08-03 · **Branch:** `remediacao/bloco-e` · Executa as ADRs 046 (Catálogo aprovado) e 047 (banco autoritativo). Conteúdo aprovado intocado: 28 conceitos, 5 eixos, 7 grupos, 166 opções.

## 1. Autoridade e mecanismo

**O banco é a fonte efetiva.** `scripts/gerar-catalogo-ts.mjs` (guardado por env-guard; `npm run catalogo:gerar`) lê `method_subcriteria`+`method_subcriterion_options` do local e emite `src/modules/curadoria/catalogo-gerado.ts` (34 conceitos, 166 opções, marca DO-NOT-EDIT, SHA-256 da carga). Os 3 módulos que mantinham listas manuais (`mapa-prioridades`, `evidencias-pratica`, `protocolos`) viraram **adapters do gerado**; Zod recusa conceito/opção fora do vigente. Geração determinística provada (2 execuções, hash idêntico).

## 2. Divergências corrigidas (D1–D16 das Auditorias 1/3/5)

Eixo `ACESSO_AO_CUIDADO` vigente em todo lugar (fim do `ACESSO`) · 7 famílias de códigos de opção alinhadas ao banco (CANAIS, TEMPO, PREFERÊNCIAS, COBERTURA, CUSTO, LIMITES, escapes sem lastro removidos — doc×migration concordam) · **custo desachatado** (campos `faixa`/`formas`/`custos_adicionais`; duas faixas recusadas no TS **e** no banco) · **condicionais finalmente lidas do banco** (`conditional_rules` com show/hide/value_not/require_detail; regra da resposta-mãe definida; UI poda campos órfãos) · ordem canônica documentada (eixo→grupo→display_order) · defaults de `catalog_version` unificados em 1.0.0 (gravação nova só vigente; registro mantém a versão de criação; leitura legada explícita).

## 3. Guardas de banco — migration `20260802165000` (ledger 85/85; rollback no arquivo; congeladas intocadas)

Pré-checagens abortam **nomeando ids** (dados locais examinados antes: zero órfãos) · FK `practice_evidence.subcriterion_code`→catálogo · trigger de payload (opção ∈ vigente; escolha única; campos de details validados; 1 faixa; só conceito ativo/versão vigente) · CHECK de completude do ativo (axis/response_type/cruzamento/evidence_source) · **imutabilidade e autoria do próprio catálogo**: DELETE nunca; INSERT/UPDATE só com rationale via `set_config`, rastreado em `catalog_change_log` — a norma tão protegida quanto o dado que normatiza (contrato para migrations futuras documentado no arquivo).

## 4. Gates de paridade (15) e o teste de mutação

`tests/remediacao/paridade-catalogo.integration.test.ts`: os 12 do mandato + imutabilidade + **gate 10b** (conteúdo VIVO do gerado campo a campo). Evidência antes/depois: 10/14 vermelhos nomeados pré-correção → 15/15 verdes. **Validação independente do orquestrador**: o teste de mutação inicial expôs que o gate de hash não detectava edição manual pós-geração (label adulterado passou 14/14) — o gate 10b nasceu dessa prova; a mutação repetida agora falha nomeando `EXPERIENCIA_NO_TIPO_DE_CASO · name — esperado (banco) / encontrado (gerado)`; descartada, 15/15.

## 5. Herança reincorporada e CI integral

Os 5 arquivos excluídos desde o G1 (`mapa-prioridades`, `mapa-profissional`, `motor-compatibilidade`, `protocolos`, `zz-sentinela` .integration) foram **corrigidos, nunca reexcluídos** — oráculos atualizados ao 1.0.0 (mais específicos: 28 ativos/34 totais, códigos vigentes, contagens exatas). Sentinela: catálogo=34/28 + **oráculo dos Mapas corrigido pelo orquestrador para baseline-relativo** (o executor havia escrito zero-absoluto, que acusava as 476 linhas de resíduo E2E pré-existente da stack compartilhada — a função da sentinela é provar que a suíte devolve o banco como encontrou; `Contagens` ganhou `mapasDeCase`/`mapasDeProfissional`). CI: 5 exclusões removidas; **paridade no job estável**; nota de herança substituída; CI remoto segue não-executado (push proibido — registro honesto). Fixtures/seeds varridos por códigos aposentados (10 arquivos de teste não-herança + 5 herança atualizados).

## 6. Resultados

Suíte de remediação **68/68** (53 + 15 paridade) · **integração completa 426/427** (1 skip condicional pré-existente; primeira execução integral sem exclusões desde o G1) · unit 1728 · components 411 · typecheck limpo · ledger 85/85 · B/C/D intactos. **Flake registrado (não-regressão):** `connection-canonica · duas escolhas concorrentes` intermitente sob suíte completa (~50%), sempre verde isolado, Connection com diff vazio no bloco — corrida de teste pré-existente, dívida de isolamento → **G2**.

## 7. Ambiguidades de Método — PARADAS (aguardam decisão humana; nada foi escolhido)

1. **Listas do lado da paciente dos 7 conceitos de tradução (P3–P7, P10, P12)** — doc aprova "múltipla escolha + grau" sem materializar listas; provisórias mantidas e marcadas `OPCOES_PROVISORIAS_*` em `protocolos.ts`.
2. **P9 (EQUIPE_DE_APOIO)** — banco tem `patient_question`, DOC 5 a declara exclusiva do Curador; mantida DECLARACAO_CLINICA.
3. **`requires_detail` do lado da paciente** (operadora/faixa) — `case_needs` não tem onde guardar o detalhe; não forçado.

## 8. Riscos residuais e adiados

Q1..Q28 renumerados pela ordem canônica do banco (nenhum dado persistia Qn; divergência de ordem do doc dentro de ACESSO resolvida pelo banco — ADR-047; mudar exige migration com rationale) · rascunhos de protocolo locais com códigos antigos serão recusados na submissão (resíduo de teste; camada vazia em produção) · flip de evidência de conceito inativo exige caminho service/migration · migrations futuras do catálogo exigem o `set_config` de rationale · split do bundle por lado (otimização) e itens documentais (cabeçalhos do Catálogo citando ADR-046; docs D2/D4) → **K** · flake de Connection e isolamento entre execuções → **G2**.
