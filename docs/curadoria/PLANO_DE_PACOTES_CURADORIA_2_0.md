# Plano de Pacotes de Implementação — Curadoria 2.0

> **Natureza:** planejamento. **Nenhuma linha de código, migration, banco, interface ou
> documento existente foi alterada por esta missão.** Este arquivo é o único produto.
>
> **Data:** 2026-08-04 · **Branch:** `seguranca/menor-privilegio-funcoes-governanca` · **HEAD:** `97ed8b2`
>
> **Atualização documental (pacote F-00, 2026-08-04):** documento **histórico**. O
> impedimento do §1 foi respondido pelo §18 da
> [`ARQUITETURA_CURADORIA_2_0.md`](ARQUITETURA_CURADORIA_2_0.md) v1.2 (DP-1..DP-11). Pacotes
> vigentes: [`MAPA_DOS_PACOTES.md`](MAPA_DOS_PACOTES.md). Ponto de entrada da 2.0:
> [`INDICE_DA_CURADORIA_2_0.md`](INDICE_DA_CURADORIA_2_0.md).
>
> **Status:** **IMPEDIMENTO ABERTO** — falta uma entrada obrigatória (§3 do papel do
> Implementador). O plano abaixo é **condicional** e não autoriza implementação. Nenhum
> pacote pode ser aberto antes de o impedimento do §1 ser resolvido pelo Arquiteto.

---

## 1. Relatório de Impedimento

### 1.1 Ponto exato da interrupção

Antes da divisão em pacotes, na verificação das entradas obrigatórias (§3 do papel).

### 1.2 Entradas obrigatórias — situação

| Entrada obrigatória | Situação | Evidência |
|---|---|---|
| Relatório do Agente Auditor | **Presente** | [`AUDITORIA_OPERACIONAL_PRE_CURADORIA_2_0.md`](AUDITORIA_OPERACIONAL_PRE_CURADORIA_2_0.md) (untracked, 2026-08-04) |
| **Arquitetura aprovada da Curadoria 2.0 (Agente 2)** | **AUSENTE** | `grep -r "Curadoria 2.0" docs/` retorna **um único arquivo**: a própria auditoria. Não existe documento de arquitetura da 2.0 no repositório. |
| Documentos canônicos aplicáveis | Presentes | [`MODELO_CURADORIA_V1.md`](MODELO_CURADORIA_V1.md), [`CONGELAMENTO_ARQUITETURAL.md`](CONGELAMENTO_ARQUITETURAL.md), [`DOMINIO_COMPATIBILIDADE_RELACIONAL.md`](DOMINIO_COMPATIBILIDADE_RELACIONAL.md) |
| **ADRs aprovadas para a 2.0** | **AUSENTES** | Último ADR registrado em `docs/DECISIONS.md` é **ADR-065**. As três ADRs que a própria auditoria declara pré-requisito (§12.4 Fase 2) não existem. |
| Especificação técnica do pacote | **AUSENTE** | Nenhuma missão de pacote foi recebida. |
| Critérios de aceite | **AUSENTES** | Idem. |
| Estratégia de migração | **AUSENTE** | Idem. |

### 1.3 Documentos em tensão

1. **Auditoria §12.4 × Congelamento §4 e §6.** A recomendação central da 2.0 (O3 — ponte
   grau → importância) toca diretamente a invariante **I-10** (*"Grau da pessoa ≠
   importância do Case — escalas sem valor em comum"*) e o item 2 do §4 do Congelamento.
   O §6 exige, cumulativamente, para reabrir: **necessidade observada em operação real**
   (Case concreto, não hipótese), demonstração de dano, análise de impacto, ADR nova e
   guarda de teste. A auditoria declara explicitamente (§limite e RI10) que **nada foi
   observado em operação real** — a Rede real é inexistente. O gatilho de reabertura,
   portanto, **não está satisfeito hoje**.
2. **Congelamento §4.3 × código (P15 da auditoria).** O documento afirma que
   *"viabilidade e preferências/restrições nunca entram [no Motor]"*; o contrato
   `MOTOR_PARTICIPATION` existe apenas em `src/modules/curadoria/evidencias-pratica.ts`
   (verificado: uma única ocorrência em `src/`) e não é consultado por
   `motor-compatibilidade.ts`. Ou o invariante precisa de guarda, ou o documento precisa
   de correção — decisão do Arquiteto, não do Implementador.

### 1.4 Impacto

Sem a arquitetura aprovada, qualquer pacote implementado seria derivado de
**recomendações** de auditoria — que a própria auditoria declara não autorizarem
alteração de código (linha final: *"Nenhuma recomendação deste documento autoriza
alteração de código"*). Implementar aqui significaria o Implementador escolhendo o
domínio — proibição absoluta (§19).

### 1.5 Alternativas técnicas possíveis (nenhuma escolhida)

- **A.** O Arquiteto produz o documento de arquitetura da 2.0 + as três ADRs da Fase 2, e
  só então os pacotes das Fases 1–3 são abertos.
- **B.** Autorizar apenas a **Fase 0** (verificação) e os pacotes de **correção de defeito**
  da Fase 1, que não dependem de arquitetura nova — cada um sob o §12 do Modelo
  (correção de defeito não reabre congelamento).
- **C.** Suspender a 2.0 até existir Rede real, satisfazendo o gatilho do §6 do
  Congelamento antes de qualquer ADR.

### 1.6 Decisão necessária do Arquiteto / responsável de negócio

1. Qual alternativa (A, B ou C).
2. Se B: quais pacotes de V-* e C-* ficam autorizados, um a um.
3. Veredito sobre P15 (guarda executável **ou** correção do documento).
4. Situação formal do ACE (descontinuado ou não) e destino do dado histórico.

### 1.7 Impedimento operacional adicional (higiene, §16)

A árvore de trabalho **não está limpa**: o branch atual carrega um pacote de segurança
ainda não commitado (`supabase/migrations/20260803170000_menor_privilegio_nas_funcoes_de_governanca.sql`
e `tests/integration/governanca-privilegios.integration.test.ts`) mais seis documentos
untracked. Nenhum pacote da 2.0 pode nascer sobre esta árvore: seria mistura de pacotes,
proibida pelo §14. **Pré-condição de qualquer pacote abaixo:** fechar ou arquivar o
pacote em curso e partir de árvore limpa, em branch próprio.

Registram-se ainda duas restrições vigentes de publicação, herdadas e **não resolvidas
por este plano**: a deriva do ledger de produção ([`PLANO_RECONCILIACAO_LEDGER.md`](PLANO_RECONCILIACAO_LEDGER.md),
pré-condição de qualquer deploy) e a ausência de janela autorizada para PR/merge em `main`
enquanto a integração Supabase↔GitHub aplicar DDL em produção. **Consequência:** todo
pacote com migration nasce *não publicável* até essa janela existir.

---

## 2. Bases de autoridade usadas neste plano

Ordem aplicada (§4 do papel): decisões do responsável de negócio → ADRs vigentes
(ADR-035, 039, 040, 041, 042, 048, 064, 065) → documentos canônicos (Modelo,
Congelamento, Domínio Relacional) → especificação do pacote → critérios de aceite →
comportamento atual → código.

**Regra transversal a todos os pacotes:** as treze decisões humanas do §4 da auditoria e
as oito garantias do §4 do Congelamento são invioláveis. Nenhum pacote abaixo cria,
altera ou remove critério, subcritério, peso, escala, célula, estado ou regra
eliminatória.

---

## 3. Critério de partição usado

Cada pacote abaixo respeita §5–§6: um objetivo único, escopo delimitado, aceite próprio,
testes próprios, rollback próprio, revisável isoladamente, deixando o sistema funcional.
Onde uma oportunidade da auditoria era grande demais (O1), ela foi dividida — **sem
alterar arquitetura nem domínio**, preservando ordem de dependência e compatibilidade.

Legenda de autorização:
**[LIVRE]** não depende de arquitetura nova nem de ADR · **[ADR]** bloqueado até ADR
existir · **[DEC]** bloqueado até decisão de Método/negócio.

---

## 4. Fase 0 — Verificação (nenhuma linha de código de produto)

### V-01 — Guarda executável do invariante "viabilidade nunca entra no Motor" **[LIVRE]**

| | |
|---|---|
| **Objetivo** | Provar, por teste, qual é o comportamento real de `crossPriorityAndProfessional` diante de subcritérios de viabilidade/preferência, e expor o veredito. |
| **Origem** | Auditoria P15 / RI8; Congelamento §4.3 e I-1. |
| **Escopo incluído** | Um arquivo de teste novo caracterizando o comportamento atual; relatório do veredito. |
| **Escopo excluído** | **Nenhuma alteração em `motor-compatibilidade.ts`.** Nenhuma alteração no Congelamento. A correção (guarda no Motor **ou** correção do documento) é pacote posterior, após decisão. |
| **Dependências** | Nenhuma. |
| **Aceite** | O teste roda verde descrevendo o comportamento **atual** (seja ele qual for) e o relatório afirma sem ambiguidade se o Congelamento §4.3 é cumprido pelo código. |
| **Testes** | Unitário do Motor: Case declarando `VIABILIDADE_*` × Mapa do Profissional com esses códigos preenchidos. |
| **Rollback** | Remover o arquivo de teste. Risco zero sobre produto. |
| **Riscos** | Nenhum técnico. Risco de processo: se o veredito for "invariante violado", abre-se decisão — não correção automática. |

### V-02 — Situação formal do ACE e do dado histórico **[DEC]**

Documental. Produto: registro da decisão (descontinuado / suspenso / ativo) e destino de
`ace_artifacts`, execuções e superfícies `/admin/ace/*`. **Decisão do Arquiteto; o
Implementador não escolhe.** Sem ela, os pacotes que tocam a página da paciente (P9 —
duas entregas concorrentes) ficam bloqueados.

### V-03 — Listas provisórias P3–P7 (`OPCOES_PROVISORIAS_*`) **[DEC]**

Documental. Decisão de Método sobre as cinco listas provisórias em código. Pré-requisito
declarado da ADR da ponte grau → importância.

---

## 5. Fase 1 — Correções de defeito e ligações (sem ADR nova)

Ordem de dependência: os pacotes C-* são independentes entre si e podem ser autorizados
individualmente. L-01a → L-01b → L-01c é cadeia estrita.

### C-01 — Assinatura do Curador no Relatório lido pela paciente **[LIVRE]**

| | |
|---|---|
| **Objetivo** | `curatorName` deixar de ser `null` fixo em `loadPatientCuradoria`. |
| **Origem** | Auditoria P7 / §3.5. |
| **Escopo incluído** | Resolução do nome do Curador responsável na carga da página da paciente; exibição. |
| **Escopo excluído** | Qualquer outro campo da entrega; o Relatório em si; a gramática de apresentação. |
| **Dependências** | Nenhuma. |
| **Aceite** | A paciente lê o nome de quem assinou; ausência de responsável não vira texto vazio nem placeholder enganoso. |
| **Testes** | Unitário de `patient-curadoria.ts` (com e sem responsável) + teste de componente (estado com assinatura / sem). |
| **Rollback** | Reverter o commit; campo volta a `null`. Sem dado novo. |
| **Riscos** | Exposição de nome de profissional interno em superfície da paciente — **verificar** contra a fronteira de vocabulário e a política de dados pessoais antes de aceitar. |

### C-02 — Preservar a abertura escrita pelo Curador ao regenerar o rascunho **[LIVRE]**

| | |
|---|---|
| **Objetivo** | `saveReport` parar de sobrescrever `composition_rationale` humano com a frase de trabalho. |
| **Origem** | Auditoria P12 / RI7. |
| **Escopo incluído** | Regra de preservação do texto humano na regeneração. |
| **Escopo excluído** | Geração do rascunho, guardas de emissão (ADR-064), demais seções. |
| **Dependências** | Nenhuma. |
| **Aceite** | Regenerar o rascunho **nunca** apaga texto de autoria humana; a frase-sentinela continua funcionando como guarda de emissão. |
| **Testes** | Unitário (regenerar após abertura humana; regenerar sem abertura) + integração do ciclo gerar→revisar→aprovar→emitir; **regressão obrigatória** das duas guardas da ADR-064. |
| **Rollback** | Reverter commit. Nenhum dado destruído — o pacote só deixa de destruir. |
| **Riscos** | Médio: interação com as guardas de emissão. Exige regressão completa do relatório. |

### C-03 — Remover a dependência inexistente COMPATIBILIDADE → AVALIAÇÃO **[LIVRE]**

| | |
|---|---|
| **Objetivo** | `mesa-etapas.ts` parar de declarar pendente uma leitura que o domínio não faz depender de `criterion_declarations`. |
| **Origem** | Auditoria P11 / §2.9. |
| **Escopo incluído** | Cálculo do estado da etapa COMPATIBILIDADE e sua frase. |
| **Escopo excluído** | As outras cinco etapas; a etapa AVALIAÇÃO (que é objeto de ADR, pacote da Fase 2); o Motor. |
| **Dependências** | Nenhuma. |
| **Aceite** | O estado da etapa reflete a leitura do Motor; nenhuma etapa passa a bloquear (a Mesa continua não bloqueando). |
| **Testes** | Unitário de `mesa-etapas.ts` cobrindo `criteriaAwaiting > 0` com leitura completa e incompleta. |
| **Rollback** | Reverter commit. |
| **Riscos** | Baixo. Risco de percepção: o Curador deixa de ver um lembrete — verificar se algo o substitui (ver C-05). |

### C-04 — Derivar os checkboxes do Acolhimento **[LIVRE]**

Objetivo: "contexto revisado"/"documentos revisados" deixarem de ser declaração e passarem
a ser fato observado. **Ressalva:** exige definir o que conta como "aberto" — se essa
definição não existir em documento canônico, o pacote vira **[DEC]** e para. Aceite:
nenhum gate do COS enfraquece. Rollback: reverter.

### C-05 — Painel de prontidão para emissão **[LIVRE]**

Objetivo (O8): mostrar antes o que hoje só se descobre ao tentar emitir (guardas da
ADR-064). Escopo: superfície apenas — **componente evolutivo (§3 do Congelamento)**,
nenhuma regra nova, nenhuma guarda alterada. Aceite: o painel reflete exatamente as
guardas existentes, nunca uma segunda interpretação delas. Testes: componente (estados
pronto/pendente/erro/sem permissão) + unitário derivando o painel das mesmas funções de
guarda. Rollback: remover o componente. Risco: duplicar a regra no frontend — proibido
pelo §11; a prontidão **deve** ser derivada da mesma função, não reimplementada.

### C-06 — Abertura automática do Case a partir de história enviada **[DEC]**

Objetivo (O6): eliminar G5. **Não [LIVRE]:** "história `enviada` + paciente com papel =
Case `NEW`" é regra de negócio nova; o Implementador não pode criá-la (§19). Requer
declaração explícita do responsável de negócio, incluindo o comportamento com histórias
já enviadas hoje (backfill: sim ou não). Envolve migration → **não publicável** enquanto
a janela do §1.7 não existir.

### L-01a — Contrato puro de derivação do Mapa do Profissional **[LIVRE]**

| | |
|---|---|
| **Objetivo** | Função pura `practice_evidence` → **proposta** de estado por subcritério, com proveniência — sem persistir nada, sem tocar o Motor. |
| **Origem** | Auditoria O1 / D2 / RI2. Precedente implementado: `deriveRelationalState` + `MOTOR_PARTICIPATION`. |
| **Escopo incluído** | Módulo de derivação puro e determinístico + testes. |
| **Escopo excluído** | Persistência, interface, qualquer chamada a partir do Motor ou da Mesa. Nada muda em produção. |
| **Dependências** | V-01 (o contrato precisa saber o que fazer com códigos `MOTOR_PARTICIPATION: "NUNCA"`). |
| **Aceite** | Toda proposta carrega origem (evidência, versão, autor, data); ausência de evidência produz **lacuna**, nunca estado positivo (I-8); nenhum estado fora dos três da ADR-040. |
| **Testes** | Unitários: evidência ausente · não verificada · verificada · vencida · versão superada · divergência aberta · código `NUNCA` · empate entre versões · reprodutibilidade. |
| **Rollback** | Remover o módulo — nenhum consumidor. |
| **Riscos** | Baixo. É código morto por desenho até L-01b. |

### L-01b — Persistência da confirmação humana da proposta **[ADR/DEC]**

Objetivo: registrar a confirmação (autor + data + proposta de origem) que transforma
proposta em declaração. **Bloqueado:** exige decisão sobre quem confirma — hoje é
exclusivamente `administrador` (G4/RI4), e alterar isso é mudança de papel, proibida ao
Implementador. Envolve migration (colunas de proveniência em
`professional_subcriterion_map`), backfill dos registros existentes (que **não têm**
proveniência) e RLS — que é item congelado (ADR-040 item 6, §4.7 do Congelamento).
**Não publicável** sem a janela do §1.7.

### L-01c — Superfície de confirmação **[ADR/DEC]**

Depende de L-01b. Requisito não negociável da auditoria §12.2: *confirmar não pode ser
mais barato que discordar* — o desenho da tela é, aqui, parte do contrato, e precisa ser
aprovado, não improvisado.

### L-02 — Dimensões da paciente derivadas do Motor **[ADR]**

Origem: O4 / D4 / P6. **Bloqueado:** substituir a fonte das cinco dimensões
(`criterion_declarations` → Motor) redefine o que a paciente lê e depende diretamente da
ADR de divisão da etapa AVALIAÇÃO (Fase 2). Não é ligação de fios: é decisão sobre a
promessa de transparência.

---

## 6. Fase 2 — Bloqueada até existir ADR

Nenhum pacote pode ser aberto. Listados apenas para rastreabilidade:

| Pacote | Depende de | Observação |
|---|---|---|
| **F2-01** Ponte grau → importância (O3) | **ADR nova** | Toca I-10 e ADR-039/042. O §6 do Congelamento exige necessidade observada em **operação real** — hoje inexistente (RI10). |
| **F2-02** Divisão da etapa AVALIAÇÃO (O2) | **ADR nova** | Define quais critérios são derivados e quais permanecem humanos. |
| **F2-03** Chave de ordenação interna de leitura (P14) | **ADR nova** | Pendência aberta do §11 do Modelo. |

---

## 7. Fase 3 — Consolidação (fora de escopo até as Fases 0–2 fecharem)

R6 (modelo de progresso derivado), R4/R5 (consolidação dos instrumentos), P17/P18
(reescrita de `MODELO_CURADORIA_V1.md` §7 e `PRODUCT_ARCHITECTURE.md`), P20 (superfícies
inalcançáveis). Cada um exige missão própria.

---

## 8. Achados fora do escopo

| # | Achado | Evidência | Impacto | Recomendação |
|---|---|---|---|---|
| A-01 | Pacote de segurança em curso não commitado na árvore | `git status`: migration + teste de integração untracked | Impede abrir pacote novo sem misturar escopos (§14) | Fechar ou arquivar antes de qualquer pacote da 2.0 |
| A-02 | Seis documentos untracked em `docs/`, incluindo a própria auditoria | `git status` | O insumo canônico da 2.0 não está versionado | Commitar a auditoria antes de derivar pacotes dela |
| A-03 | `MOTOR_PARTICIPATION` sem consumidor no Motor | única ocorrência em `src/` está em `evidencias-pratica.ts` | RI8 | Objeto de V-01 |

---

## 9. Conformidade

Este plano: **não implementa nada**; não cria regra de negócio; não altera critério,
subcritério, peso, escala ou papel; não reabre decisão congelada; e declara explicitamente
o impedimento que impede a abertura de qualquer pacote. **Nenhum pacote está autorizado**
até decisão do §1.6.
