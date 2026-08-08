# Dossiê de Fechamento da Onda 1 e Entrada da Onda 2

| Campo | Valor |
|---|---|
| **Versão** | v1.0 |
| **Autor** | Agente 02 — Arquiteto da Curadoria 2.0 |
| **Data** | 2026-08-08 |
| **Status** | **DECIDIDO E EXECUTADO** — Guardião aprovou (`ONDA 1 APROVADA PARA ENCERRAMENTO — ENTRADA DA ONDA 2 AUTORIZADA APÓS LAVRATURAS`); Fundador fechou a DP-2 (2026-08-08); ciclo de lavraturas executado (Ato 1 `66717ab`; Atos 2–7 no commit seguinte). **ONDA 1 FORMALMENTE ENCERRADA · ONDA 2 FORMALMENTE ABERTA · FRONTEIRA FECHADA** |
| **Base** | `1389183` (mapa reconciliado com 1.6 e 1.A encerrados) |
| **Decide** | Guardião da CURADORIA 2.0 (e, onde indicado, Fundador / Autoridade de Método) |
| **Regressão desta preparação** | `tsc` limpo · **253/253** testes verdes (guardas completas + módulos-chave), executados sobre a base |

---

## 1. Resumo executivo

A Onda 1 está **materialmente esgotada**: dos treze itens, **doze estão
implementados** — dez formalmente encerrados ou concluídos e verificados, e
**dois implementados sem lavratura** (1.5 e 1.7, ambos citando no próprio commit
as autoridades que os ampararam). O único não implementado, **1.2**, era
**inexecutável dentro da própria onda** (exigiria mudança de RLS, vedada à Onda
1 por definição). As **dez condições do §15.0 estão satisfeitas e testadas**.

O fechamento **formal** depende de quatro atos de governança, nenhum de
engenharia: lavrar/portar o lastro de 1.5 (M-001/M-003) · lavrar a Decisão
Executiva DP-2 que amparou o 1.7 · dispor do 1.2 · declarar o fechamento e as
condições de entrada da Onda 2. **A entrada da Onda 2 não abre a Fronteira
Humana** — são atos distintos, e os grants do 1.12 permanecem zero.

## 2. Estado final da Onda 1 — visão

**Material: concluída** (nenhum trabalho de engenharia executável resta dentro
das regras da onda). **Formal: pendente** — exatamente das disposições listadas
no §19.

## 3. Inventário item a item

| Item | Estado documental (mapa) | Estado real (git) | Commit(s) | Verificação/certificação | Divergência | Decisão necessária |
|---|---|---|---|---|---|---|
| **1.1** | CONCLUÍDO | implementado | `f1a7427` · `36dde31` | coberto por regressões certificadas | corrigida em 2026-08-07 | nenhuma |
| **1.2** | **BLOQUEADO** | **não implementado** (G-10; `curatorName` flui com semântica degradada sob RLS) | — | n/a | nenhuma | **SIM — disposição (§5)** |
| **1.3** | CONCLUÍDO | implementado | 2026-08-04 | falseabilidade provada | nenhuma | nenhuma |
| **1.4** | CONCLUÍDO | implementado | `fae6465` | regressão certificada; sem verificação dedicada | corrigida em 2026-08-07 | nenhuma |
| **1.5** | **BLOQUEADO (decisão de Método)** | **IMPLEMENTADO, MAS NÃO LAVRADO** | `9f6ee86` | regressão verde desde então | **F-REC-1** | **SIM — lavratura (§6)** |
| **1.6** | FORMALMENTE ENCERRADO | implementado | `56ccfd0` | verificado e certificado 2026-08-08 | corrigida | nenhuma |
| **1.7** | **BLOQUEADO (DP-2)** | **IMPLEMENTADO, MAS NÃO LAVRADO** | `2c039a3` | regressão verde desde então | **F-REC-2** | **SIM — lavratura da DP-2 (§7)** |
| **1.8** (+R1/MR1) | CONCLUÍDO E VERIFICADO | implementado | `c3242ea` → `041b423` → `095054e` | sem ressalvas; encerrado pelo DT-01 | nenhuma | nenhuma |
| **1.9** | CONCLUÍDO | implementado | `30d8163` | coberto pela cadeia do 1.8 | corrigida em 2026-08-07 | nenhuma |
| **1.10** | CONCLUÍDO | implementado | série `1.10B-P2`/`1.10C-A` | integração ponta a ponta | corrigida em 2026-08-07 | nenhuma |
| **1.11** (+MR1) | FORMALMENTE ENCERRADO *(célula corrigida neste dossiê)* | implementado | `4928af6` + `cfbcc41` | certificado | **era a 5ª divergência — corrigida** | nenhuma |
| **1.12** (+MR1) | FORMALMENTE ENCERRADO *(célula corrigida neste dossiê)* | implementado | `cdf485d` + `2c52832` | reverificado; F-1.12-1 quitada; certificação do Agente 05 | **era divergência — corrigida** | nenhuma |
| **1.A** | FORMALMENTE ENCERRADO | implementado | `c03cc26` | certificado | corrigida em `1389183` | nenhuma |

## 4. Divergências mapa ⟂ git — histórico consolidado

Sete ocorrências na Onda 1, todas da mesma classe (implementação legítima sem
lavratura): 1.1, 1.4, 1.9/1.10, 2.1 *(Onda 2)*, 1.6, 1.11/1.11-MR1, 1.12 —
**todas corrigidas** (as três últimas neste dossiê). Permanecem **duas abertas
por exigirem ato de autoridade**, não correção documental: **1.5** e **1.7**
(§6–§7).

## 5. Disposição do Item 1.2 — Assinatura do Curador

**Bloqueio reconstruído:** G-10 — nenhuma policy permite ao paciente ler o
perfil do Curador; `curatorName` resolve por `displayName(profiles)` e degrada
sob a RLS da paciente. Corrigir exige **mudança de RLS, vedada à Onda 1** pela
própria definição do item ("Guardião + Arquiteto decidem a via"). **Não há
implementação parcial do item** (as superfícies consomem o nome com a semântica
degradada atual).

**Disposições possíveis** (decisão do Guardião + Arquiteto; **não decidida
aqui**):

| Opção | Efeito |
|---|---|
| **(a) Carregar para a Onda 2** como pacote de RLS, ao lado do 2.6 (mesma família: governança de leitura/papéis) — **recomendação do Arquiteto** | a Onda 1 fecha com o 1.2 transferido, não pendente |
| (b) Permanecer bloqueado fora das ondas | pendência perpétua — desaconselhado |
| (c) Encerrar por disposição formal (aceitar `null`) | contraria P7/X3 — desaconselhado |

## 6. Disposição do Item 1.5 — F-REC-1

**O que foi implementado** (`9f6ee86`): exatamente o objeto canônico (checkboxes
derivados do Acolhimento, P13) — os dois checkboxes viram o predicado
`acolhimento-preparado`; ramo A (registro de fatos/pendências) e ramo B
(conclusão por derivação na ausência de material, que **nunca afirma preparo**);
material posterior reabre a etapa; `registerHistoriaAction` cria a linha quando
ausente.

**Autoridade:** o commit cita nominalmente **M-001** (predicado, ramos,
monotonicidade), **M-003** (caminho de escrita) e **DT-06** — decisões de Método
**reais**, tomadas pelo DT-01 em missões de 2026-08-04/05. **A implementação foi
legítima em processo.** O defeito é de lastro: M-001/M-003 foram versionadas em
**outro branch** (§8).

**Conclusão proposta:** o 1.5 **pode ser formalmente encerrado por
reconstrução documental** — portar M-001/M-003 a este branch (ou referenciar o
commit imutável `8911c5e`, padrão §17 do Contrato 1.8) e lavrar o encerramento.
**Nenhuma decisão de Método nova é necessária.**

## 7. Disposição do Item 1.7 — F-REC-2

**O que foi implementado** (`2c039a3`): exatamente o objeto canônico (P9/P20/RI5)
— fim da segunda entrega na página da paciente; PDF passa a imprimir a Curadoria
do Método (mantendo o legado imprimível para quem só tem ele); superfícies
mortas removidas (`/curador/*`, `/portal-paciente/*`, `/admin/ace/*`). **Nenhum
dado histórico apagado** (X4).

**Autoridade:** o commit cita a **"Decisão Executiva DP-2: motor anterior
CONGELADO — nenhuma operação nova, histórico preservado integralmente"**. O
[`REGISTRO_DE_GOVERNANCA.md` §4](REGISTRO_DE_GOVERNANCA.md) ainda lista DP-2
como **"Aberta"** — a decisão foi tomada em missão executiva e **nunca lavrada**
(a mesma violação de P-01 que originou o M-002).

**Conclusão proposta:** a implementação **antecedeu a lavratura, não a
decisão**. O 1.7 pode ser encerrado **condicionado a um ato**: o **Fundador
lavra a Decisão Executiva DP-2** (o teor já está registrado no commit; a ADR-E
prevista pelo 0.2 formalizaria o destino do ACE). Sem essa lavratura, o
encerramento ficaria apoiado em citação de commit — abaixo do padrão da casa.

## 8. F-REC-3 — M-001/M-003 ausentes deste branch

**Onde nasceram:** missões M-001 (definição de "aberto"), M-002 (materialização
— exatamente porque "resultado de missão não é documento", P-01) e M-003
(caminho de registro), 2026-08-04/05. **Onde estão:** commit **`8911c5e`**
*"docs(curadoria): versiona os dois Metodos do Acolhimento (DOC-01)"*, branch
**`curadoria/2-0-documentacao`** — junto do `PROCESSO_DE_ENGENHARIA_2_0.md`
(mesma situação, já contornada pelo Contrato 1.8 §17 via commit imutável).

**Classificação do risco:** **documental** — o conteúdo existe, versionado, em
branch não integrado. Não é risco de autoridade (as decisões foram do DT-01),
não é técnico (a implementação as seguiu), não é constitucional. **A ausência
não invalida o 1.5** — mas o encerramento formal dele deve **portar ou
referenciar** o lastro (§6). Recomendação: **integrar `curadoria/2-0-documentacao`**
(ou cherry-pick dos documentos) como parte do fechamento da onda.

## 9. Item 1.12 — divergência documental

Confirmado: implementação `cdf485d` · MR1 `2c52832` · reverificação · F-1.12-1
quitada · certificação formal do Agente 05. A célula do mapa dizia *"implementação
não iniciada"* — **corrigida neste dossiê** (junto com 1.11 e 1.11-MR1, mesma
classe). Nenhuma pendência remanescente do 1.12.

## 10. Onda 1 — material × formal

**Materialmente concluída? SIM** — com a precisão: doze de treze itens
implementados; o décimo terceiro (1.2) era **inexecutável dentro da onda** por
vedação de RLS, e sua resolução sempre foi decisão externa. Não existe trabalho
de engenharia executável restante sob as regras da onda.

**Formalmente concluída? NÃO** — pendem: lavratura do 1.5 (§6) · lavratura da
DP-2 e encerramento do 1.7 (§7) · disposição do 1.2 (§5) · porte do lastro
(§8) · e o ato de fechamento em si.

## 11. Condições de entrada da Onda 2 — a regra normativa

Arquitetura §15, Onda 2: **"Entrada: Onda 1 integralmente verde; ADRs aprovadas;
Autoridade nomeada e ativa; DP-1 respondido"** (+ DP-5 apenas para o subescopo
2.5). Estado: ADRs 066/067/068/069 ✓ · Autoridade de Método ativa (DT-01, DP-4)
✓ · DP-1 respondida (PA-1) ✓ · DP-5 aberta (2.5 permanece proibido — a onda pode
fechar sem ele) · **"Onda 1 integralmente verde" = as disposições do §19**.
Nota de realidade: 2.1 e o bloco 2.2 **já executaram** por autorização expressa
caso a caso — a entrada formal regulariza e destrava o restante (2.3/2.4/2.6),
não inaugura a onda.

## 12. As dez condições do §15.0 — a tabela central

> §15.0: *"Nenhuma derivação persistida ou consumida pode começar antes de
> existirem, simultaneamente:"*

| # | Condição | Estado | Evidência (commit · item) |
|---|---|---|---|
| 1 | `derivation_proposals` | **SATISFEITA** | `1ed29f8` (2.1, estrutura inerte) · escritor único 2.2C `b38cd34` · leituras controladas §21/1.11 |
| 2 | proveniência completa | **SATISFEITA** | 1.9 `30d8163` · 1.8-R1 `041b423` · MR1 `095054e` — cadeia única, vínculo de evidência, C-01c |
| 3 | regra versionada | **SATISFEITA** | 2.2A `30c6809` · MR1 `7770d7f` · MR1.1/1.2/1.3 `20260805200000` |
| 4 | autoridade da regra | **SATISFEITA** | DP-4 fechada — DT-01 nomeado Autoridade de Método (2026-08-05); Registro §1 ATIVA |
| 5 | explicabilidade | **SATISFEITA** | Item 1.8 encerrado sem ressalvas (`c3242ea`→`095054e`); AC-EXPLICA por afirmação |
| 6 | reconhecimento em duas colunas | **SATISFEITA** | 1.10 — série `1.10B-P2`/`1.10C-A` (`79949b5`, `9de858e`) |
| 7 | mecanismo de discordância | **SATISFEITA** | 1.12 `cdf485d` + `2c52832` — inerte por desenho (a condição exige **existir**, não estar aberto) |
| 8 | painel de discordância | **SATISFEITA** | 1.11 `4928af6` + `cfbcc41` — vazio honesto, anti-ranking |
| 9 | guardas contra vazamento de critérios | **SATISFEITA** | C-03 (filtro nunca derivado) · E-04 (`PATIENT_FORBIDDEN_TERMS`) · C-16 (nenhuma superfície sobre a camada) — verdes na regressão desta preparação |
| 10 | critérios de supersessão | **SATISFEITA** | ADR-066 §9 (S1–S5) · ADR-067 (completos para as duas entidades) · MR1.2/MR1.3 |

**"…e são testadas":** 253/253 nesta preparação + as certificações da cadeia
1.8→1.A. **Veredito da tabela: DEZ DE DEZ SATISFEITAS.**

## 13. Estado de 2.1 · 2.6 · 2.C

| Item | Estado | O que falta |
|---|---|---|
| **2.1** | **CONCLUÍDO COMO ESTRUTURA INERTE** (`1ed29f8`); escritor 2.2C; leituras lavradas | nada — consumo pela leitura segue proibido (A2) |
| **2.6** | **BLOQUEADO** — e **exige releitura de escopo antes de qualquer coisa**: a ADR-068 decidiu **não reabrir** a RLS da ADR-040 item 6, que era o objeto original | releitura + eventual junção com a disposição do 1.2 (§5a) |
| **2.C** | **BLOQUEADO** | dependências: 1.A ✓ · 2.1 ✓ · dez do §15.0 ✓ · **2.6 ✗** · decisão de abertura da Fronteira ✗ |

## 14. Fronteira Humana e O2

**O2-C/D/E: verdes** (capability única, registro append-only, motivo opcional —
certificados no 1.12). **O2-A/B: pertencem à superfície futura** — lavrados como
aceite obrigatório do pacote de abertura (Contrato 1.12 §20), com a guarda G-5
provando que nenhuma superfície de decisão existe. **Grants do 1.12: zero**
(verificado na migration `20260808150000`: `revoke execute … decidir_proposta`;
atos sem policy e sem grant). **A entrada da Onda 2 NÃO implica abertura da
Fronteira** — a abertura é ato próprio, futuro, com lavratura própria (grants +
superfície + O2-A/B). **Fronteira: FECHADA.**

## 15. Dívidas não bloqueantes

**Nenhuma bloqueia o fechamento.** Consolidadas: R-obs-1 (editor da Mesa — já
registrada no encerramento do 1.6 como fora do item) · §3 do
`REGISTRO_DE_GOVERNANCA.md` materialmente desatualizado (tarefa aberta) · §4 do
mesmo registro com DP-2 "Aberta" (vira parte do ato do §7) · referências
provisórias `ADR-A` nas linhas 2.1/2.2 do mapa (aguarda autorização, classe já
conhecida) · linha 0.6 do mapa ainda "EM EXECUÇÃO (F-00)" · seed da rede não
idempotente · 11 testes com container hardcoded · varredura de `display_order` ·
célula da Arquitetura linha 195 ("P-10 proposto") e linha 1317 (`§10.4`,
superada — registro vinculante no Contrato 1.A §5, emenda quando o documento for
tocado) · nota do índice sobre "ADR-001..068" (não inclui 069).

## 16. Guardas e regressão

Executado nesta preparação, sobre `1389183`: **`tsc --noEmit` limpo** · **253/253
verdes** — guardas completas (grupos A–F + C-01 família + C-14..C-16) +
`prontidao-para-emissao` + `painel-de-discordancia` + `ficha-de-explicacao` +
contratos de derivação. Integração/ledger: não executados aqui (stack
compartilhada — política de não disputar o banco local); última baseline
integral certificada na cadeia 1.6/1.A (2026-08-08), sem regressões conhecidas.

## 17. Bloqueios reais

Para **fechar a Onda 1**: apenas os atos do §19 (nenhum de engenharia). Para
**entrar na Onda 2**: o fechamento + a declaração de entrada. Para **2.3/2.4**:
a entrada formal (gate de sequenciamento da ADR-067). Para **2.6**: releitura de
escopo. Para **2.C e Fronteira**: 2.6 + ato de abertura próprio. **DP-5**
permanece aberta (2.5 proibido — não bloqueia a onda).

## 18. Decisões necessárias — a lista fechada

| # | Decisão | Autoridade |
|---|---|---|
| D-1 | Lavrar/portar M-001/M-003 (integrar `curadoria/2-0-documentacao` ou referenciar `8911c5e`) e **encerrar formalmente o 1.5** | Guardião (lavratura) — sem decisão de Método nova |
| D-2 | **Lavrar a Decisão Executiva DP-2** (teor já registrado em `2c039a3`; ADR-E do 0.2) e **encerrar formalmente o 1.7** | **Fundador** (a decisão é dele) + lavratura |
| D-3 | **Dispor do 1.2** — recomendação: carregar para a Onda 2 como pacote de RLS junto à releitura do 2.6 | Guardião + Arquiteto |
| D-4 | **Declarar a Onda 1 formalmente encerrada** (condicionada a D-1..D-3) | Guardião |
| D-5 | **Autorizar a entrada formal da Onda 2** — destravando 2.3/2.4 e a releitura do 2.6; **sem abrir a Fronteira** | Guardião |

## 19. Recomendação de governança

Executar D-1..D-5 **nesta ordem, num único ciclo de decisão**. Nenhuma exige
engenharia prévia; D-1 e D-2 são lavraturas de decisões já tomadas; D-3 é a
única escolha genuinamente aberta, e a recomendação (1.2 → Onda 2, com 2.6)
mantém a família de RLS num pacote só, com um dono só.

## 20. Próximo ato

Decisão de governança do Guardião sobre D-1..D-5, com base neste dossiê.

## 21. Perguntas obrigatórias — respostas

Ver relatório da missão (Q1–Q14) — respostas idênticas às deste documento.
