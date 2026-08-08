# Auditoria dos Gates de Abertura do Item 2.C

| Campo | Valor |
|---|---|
| **Versão** | v1.0 |
| **Autor** | Agente 02 — Arquiteto da Curadoria 2.0 |
| **Data** | 2026-08-08 |
| **Status** | **Emitida** — auditoria documental/material; nível derivado, datado |
| **Base** | `045528e` (Item 2.3 formalmente encerrado) |
| **Evidência fresca** | guardas executáveis **150/150 verdes** sobre a base; Fronteira **medida** (grants/policies/superfícies), não apenas lida |

> **Distinção que rege esta auditoria:** *pacotes entregues* ≠ *condições
> normativas de abertura*. A Onda 2 ter núcleo completo não abre nada — o que
> abre é o cumprimento dos dez gates do §15.0 **mais** o rito próprio do 2.C
> (contrato → julgamento → implementação), que ainda não começou.

## 1. Matriz canônica — os dez gates do §15.0

| # | Gate (§15.0) | Evidência atual | Estado | Bloqueia 2.C? |
|---|---|---|---|---|
| 1 | `derivation_proposals` | estrutura `1ed29f8` (2.1) · escritor único 2.2C `b38cd34` · leituras controladas §21/1.11 | **SATISFEITO** | não |
| 2 | proveniência completa | 1.9 `30d8163` · 1.8-R1 `041b423` · MR1 `095054e` — cadeia única, vínculo de evidência, C-01c | **SATISFEITO** | não |
| 3 | regra versionada | 2.2A `30c6809` · MR1.1/1.2/1.3 `7770d7f`/`20260805200000` | **SATISFEITO** | não |
| 4 | autoridade da regra | DP-4 fechada — DT-01 Autoridade de Método, Registro §1 ATIVA | **SATISFEITO** | não |
| 5 | explicabilidade | Item 1.8 encerrado sem ressalvas (`c3242ea`→`095054e`); AC-EXPLICA por afirmação | **SATISFEITO** | não |
| 6 | reconhecimento em duas colunas | 1.10 (`79949b5`, `9de858e`) | **SATISFEITO** | não |
| 7 | mecanismo de discordância | 1.12 `cdf485d`+`2c52832`, certificado; **inerte por desenho** (a condição exige existir, não estar aberto) | **SATISFEITO** | não |
| 8 | painel de discordância | 1.11 `4928af6`+`cfbcc41`, certificado; vazio honesto | **SATISFEITO** | não |
| 9 | guardas contra vazamento de critérios | C-03 · E-04 (`PATIENT_FORBIDDEN_TERMS`) · C-16 — **verdes nesta auditoria (150/150)** | **SATISFEITO** | não |
| 10 | critérios de supersessão | ADR-066 §9 (S1–S5) · ADR-067 (completos p/ as duas entidades) · MR1.2/MR1.3 · **JS1–JS4 operacionais no 2.3 (trigger JS3, `8305d97`)** | **SATISFEITO** | não |

**Contagem: 10 SATISFEITOS · 0 com higiene · 0 ato documental · 0 decisão · 0
implementação · 0 bloqueado.** *(As higienes F-2.3-1/F-2.4-1/F-2.6-1 não
pertencem a gate algum do §15.0 — ver §4.)*

## 2. Pendências 1.5 e 1.7 — diagnóstico

**Ambas já foram formalmente resolvidas** pelo ciclo de lavraturas do fechamento
da Onda 1 (Guardião + ato do Fundador, commits `66717ab` e `9afaead`):

| Item | Objeto | Material | Formal | Ato faltante |
|---|---|---|---|---|
| **1.5** | checkboxes derivados (P13) | `9f6ee86`, sob M-001/M-003/DT-06 | **FORMALMENTE ENCERRADO** (Ato 3; lastro portado no Ato 1, byte-idêntico a `8911c5e`) | **nenhum** |
| **1.7** | retirada da segunda entrega (P9/P20) | `2c039a3`, sob a Decisão Executiva DP-2 | **FORMALMENTE ENCERRADO** (Ato 4; DP-2 lavrada pelo Fundador no Ato 2 — Registro §4 FECHADA) | **nenhum** |

A leitura do Certificador que as listou como pendentes é **anterior ao ciclo de
lavraturas** — o estado vigente do mapa e do Registro as encerra com autoridade
completa (Guardião para o ciclo; Fundador para a DP-2). Nada a praticar; resta
apenas o **reconhecimento** desta reconciliação pelo Certificador no seu próximo
ato de fila.

## 3. F-REC-1..3 — reconstrução e estado

| Achado | Conteúdo | Materialidade | Estado atual | Bloqueia 2.C? |
|---|---|---|---|---|
| **F-REC-1** | 1.5 implementado sem lastro no branch | documental | **RESOLVIDO** — lastro portado (`66717ab`) e 1.5 encerrado (`9afaead`) | **não** |
| **F-REC-2** | 1.7 implementado com DP-2 decidida mas não lavrada | documental/autoridade | **RESOLVIDO** — DP-2 FECHADA pelo Fundador; 1.7 encerrado | **não** |
| **F-REC-3** | M-001/M-003 ausentes do branch | documental | **RESOLVIDO** — portados byte-idênticos, indexados (2e/2f) | **não** |

A **baixa formal** dos três achados como registros do Certificador é ato do
próprio Certificador (quem os abriu) — reconhecimento, não decisão nova.

## 4. Higienes — F-2.3-1 · F-2.4-1 · F-2.6-1

As três são da **mesma classe** (varreduras estáticas que não capturariam
deriva futura sozinhas; camadas vivas pinam o regime aplicado): **HIGIENE NÃO
BLOQUEANTE, preservadas com obrigação de vigilância** — nenhum gate do §15.0 as
exige resolvidas; **nenhuma bloqueia o 2.C**; nenhuma foi corrigida ou
reclassificada aqui.

## 5. Fronteira — estado MEDIDO

| Medição | Resultado |
|---|---|
| Grants da capability decisora (`decidir_proposta`) | **zero** — nenhum `grant execute` existe em migration alguma; só o `revoke` de nascimento |
| Policies em `derivation_proposals` / `derivation_proposal_acts` / `curator_judgments` | **zero** |
| Superfícies (`src/app` + `src/components`) tocando a camada | **nenhuma** além do painel observacional do 1.11 (autorizado) |
| Writer do 2.3 (`registrar/retirar_julgamento`, EXECUTE a `authenticated`) | **não é abertura da Fronteira** — juízo é operação interna da Mesa autorizada pela ADR-067 (O-2/PA-16); gate interno; tabela sem grant/policy |
| O2-A/B | pendentes do pacote de abertura (CONTRATO_1_12 §20), como devido |

> **Fronteira = FECHADA — materialmente confirmada.** Nenhuma abertura parcial
> não documentada.

## 6. Núcleo material da Onda 2

2.1 ✓ (estrutura inerte) · bloco 2.2 ✓ (A/B/C + R1s, dívidas não bloqueadoras) ·
2.3 ✓ (`8305d97`) · 2.4 ✓ (`2f6ec05`) · 2.6 ✓ (`01f45dc`) · **2.5: PROIBIDO
enquanto DP-5 aberta** — nota de precisão: o mapa o mantém **proibido por ADR
(§5.4.0)**, não "retirado"; a onda fecha sem ele, e reabri-lo exige DP-5 por
ADR. **Núcleo completo — consistente com mapa e §15.0.**

## 7. Resultado

> ### GATES 2.C — TODOS SATISFEITOS

**O que isso NÃO significa:** implementação. O rito vigente (contract-first,
sete precedentes) exige, antes de qualquer código do 2.C:

1. **`CONTRATO_2_C`** — proposta pelo **Arquiteto** (não existe; é o **primeiro
   ato formal faltante da cadeia**). Deve incorporar: os nove elementos da
   Fronteira (A2c) · ausência de ato nunca confirma (A2d) · ato por item
   (AC-BLOCO/DP-5) · o **pacote de abertura** (grants do 1.12 + O2-A/B como
   aceite) · emissor/confirmação do lado profissional · herança do 2.6 §13
   (seis condições, §13.2 com regime de transição) · R-1/CD-1 (nenhum valor da
   ponte estabiliza antes de Cases reais).
2. **Julgamento** pelo **Guardião** — que é onde a decisão de **abertura da
   Fronteira** será tomada (nunca por implementação).
3. Só então, missão de implementação ao Engenheiro.
