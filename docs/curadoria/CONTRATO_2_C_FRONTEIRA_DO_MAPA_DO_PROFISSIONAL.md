# Contrato do Item 2.C — Persistência e Apresentação da Derivação do Mapa do Profissional, com Confirmação Item a Item

| Campo | Valor |
|---|---|
| **Versão** | v1.0 |
| **Autor** | Agente 02 — Arquiteto da Curadoria 2.0 |
| **Data** | 2026-08-08 |
| **Status** | **PROPOSTA — pronta para julgamento do Guardião da CURADORIA 2.0** |
| **Base** | `6cf87ad` ([`AUDITORIA_GATES_2C.md`](AUDITORIA_GATES_2C.md): **10/10 gates do §15.0 satisfeitos**; Fronteira medida FECHADA) |
| **Item** | **2.C** — "Ligar 1.A ao mundo real"; aceite canônico **A2c** (nove elementos) + **A2d** (ausência de ato nunca confirma) |
| **Autoridades** | Arquitetura §2.4/§15.0/§17.4 (A2b/A2c/A2d)/§16 (R-01) · ADR-066 §6–§8/§14–§16 · ADR-067 (§13.2 via 2.6 §13) · ADR-068 §14.2 · CONTRATO_1_12 (mecanismo de decisão, §7 herança do alvo profissional) · CONTRATO_1_8_R1 (vínculo `evidence_id`) · CONTRATO_1_A (função pura; PA-13) · CONTRATO_2_6 §13 · DP-5 (intocada) · PA-12..PA-16 |
| **Implementação** | **NÃO AUTORIZADA** por este documento. **A abertura da Fronteira é decidida no julgamento deste contrato — nunca por implementação** |

---

## 1. Pergunta arquitetural central — a resposta em uma frase

O sistema **emite** propostas de estado do Mapa do Profissional a partir de
evidência vigente sob regra versionada (emissor, §7) · **apresenta** cada
proposta com os nove elementos do §2.4 numa superfície interna da operação
(§10) · e permite que **quem tem autoridade sobre o campo** (administrador —
ADR-068 §14.2) **confirme ou recuse item a item** pelo mecanismo **já
contratado no 1.12** (`decidir_proposta`, estendida ao alvo profissional como o
próprio 1.12 §7 previu), gravando ato + efeito **atomicamente** — a confirmação
declara `status` **e `evidence_id`** no Mapa (o vínculo do 1.8-R1), preservando
proveniência integral e reversibilidade **sem jamais apagar fato humano**.

## 2. Pré-condições formais — satisfeitas

**10/10 gates do §15.0** — auditados individualmente em
[`AUDITORIA_GATES_2C.md`](AUDITORIA_GATES_2C.md) (base `045528e`; guardas
150/150; Fronteira medida). 1.5/1.7 encerrados; F-REC-1..3 resolvidos
(reconhecimento do Certificador é paralelo, não bloqueante); higienes
F-2.3-1/F-2.4-1/F-2.6-1 preservadas (§16). **Nada disso é reaberto aqui.**

## 3. Não-objetivos

Reabrir 2.5/DP-5 · confirmação em massa · regras materiais de correspondência
(Autoridade de Método, fora deste item) · estabilizar valores da ponte (R-1/CD-1)
· alterar 1.12/2.3/2.4/2.6/1.A · superfície da paciente · emissor Case-side ·
segunda origem de verdade.

## 4. Separação inegociável — proposta ≠ julgamento ≠ confirmação

| Ato | O que é | Quem | Destino |
|---|---|---|---|
| **Proposta** | resultado derivado pelo Método (emissor, regra versionada) | sistema | `derivation_proposals` |
| **Julgamento** | juízo humano do Curador (H8–H11) | Curador | `curator_judgments` (2.3/2.4 — intocados) |
| **Confirmação** | ato do 2.C sobre o item derivado | **administrador** (ADR-068 §14.2) | ato em `derivation_proposal_acts` + declaração no Mapa |

**Proibições estruturais**: confirmação não cria julgamento (G-2.C-6) · proposta
não vira confirmação sem ato (A2d) · Motor não antecipa confirmação · nenhum
regime de bloco (DP-5, §6). **ADR-068 §13.2 (herdada via 2.6 §13): quem confirma
o estado não julga e seleciona no mesmo Case** — com a abertura, esta
incompatibilidade **vira verificação executável** entre os dois atos (o regime
de transição lavrado no 2.6 §13 item 6 cumpre-se aqui).

## 5. Os nove elementos da Fronteira — matriz A2c

Aceite: **teste de componente** (A2c, Arquitetura §17.4:1976). Rollback de todos:
§13.

| # | Elemento (§2.4) | Origem | Destino/Apresentação | Ato humano | Grant | Surface | Guarda |
|---|---|---|---|---|---|---|---|
| 1 | Visualização da **declaração original** | `practice_evidence` exata (`origin_record`/`origin_version` da proposta — imutável) | painel do item | leitura | leitura via caminho servidor já autorizado | painel interno (§10) | G-2.C-4 |
| 2 | Visualização da **proposta** | `derivation_proposals` (leitora individual §21/1.8) | painel do item | leitura | já existente (capability) | idem | G-2.C-4 |
| 3 | **Origem** da proposta | itens 4–7 da ADR-066 §14.1 (registro, versão, data, autor) | painel do item | leitura | idem | idem | G-2.C-4 |
| 4 | **Versão da regra** aplicada | `rule_id`+`rule_version` (MR1.3) | painel do item | leitura | idem | idem | G-2.C-4 |
| 5 | **Confirmar/discordar equivalentes** (P-10) | CONTRATO_1_12 (capability única) | os dois atos no painel | **confirmar · recusar** | `EXECUTE` de `decidir_proposta` (§8) | idem | **O2-A/O2-B** (§9) |
| 6 | **Autoria** | `auth.uid()` → ato | ato gravado | implícito no ato | — (definer) | — | G-2.C-5 |
| 7 | **Data** | instante do ato | ato gravado | idem | — | — | G-2.C-5 |
| 8 | **Registro do desfecho** | `CONFIRMADA`·`RECUSADA`·`PROPOSTA` (pendente é leitura, nunca estado) | proposta + ato | resultado do ato | — | painel exibe | G-2.C-5 |
| 9 | **Bloqueio de avanço sem ato válido** | A2d | nenhum efeito no Mapa sem ato | — | — | painel nunca "assume" | **G-2.C-1 (A2d)** |

## 6. A2d e DP-5 — as duas cercas do ato

**A2d (aceite canônico, teste de integração — Arquitetura §17.4:1977):**
*decurso de prazo, navegação e fim de sessão deixam o desfecho em `PROPOSTA`.*
Aparece: na **persistência** (nenhum default/trigger produz `CONFIRMADA`; só a
capability com ator) · na **apresentação** (pendente = leitura da ausência,
nunca pré-marcado) · na **confirmação** (ato explícito e positivo, ADR-066 §6
condição 3). Oráculo: integração que simula os três não-atos e prova desfecho
`PROPOSTA` + Mapa intacto.

**DP-5 intocada:** o 2.5 permanece **PROIBIDO por ADR (§5.4.0)** enquanto DP-5
aberta. **Fronteira explícita**: o 2.C confirma **um item por ato** — a condição
4 do ato válido (ADR-066 §6) é estrutural na capability (um `proposal_id` por
chamada); **proibidos** atalhos equivalentes: laço de confirmação na action,
"confirmar todos", seleção múltipla que dispara N atos de um clique. Guarda
G-2.C-7 + C-02 (viva).

## 7. O emissor do lado profissional

Espelho do emissor Case-side (2.2C), sob as **mesmas oito condições da ponte**
(ADR-066 §16, F-2 incluída):

| Pergunta | Cláusula |
|---|---|
| Quem emite | função SQL única `curadoria.emitir_proposta_de_estado(professional_profile_id, subcriterion_code, ...)` — **segundo escritor nominal de `derivation_proposals`** (C-11 evolui por lavratura: `{emissor Case · emissor profissional}`) |
| O que emite | **proposta de `status`** do Mapa (`target_field='status'`, alvo `professional_profile_id` — o `alvo_unico` da estrutura já o permite) com os **doze itens** (§14.1): origem = `practice_evidence:<id>` exata + versão + data + autor da coleta |
| Sob o quê | **regra de correspondência evidência→estado, versionada e VIGENTE** (ciclo ADR-069) — **cuja semântica material NÃO existe e NÃO é criada aqui** (PA-13: autoridade da Autoridade de Método). **O 2.C nasce operacionalmente vazio-honesto**: emissor completo, zero propostas até a primeira regra lavrada — o mesmo desenho do 2.2C |
| Relação com 1.A | a função pura é o contrato de referência da mecânica (braço `PROPOSTO` com regra por argumento); o emissor é sua materialização persistente — **"ligar 1.A ao mundo real"** |
| O que **não** faz | não escreve no Mapa (A2b — DR* nunca escreve nos Mapas) · não julga (juízo é do Curador, 2.3/2.4) · não confirma · não emite para conceito `NUNCA`/humano (validador do Catálogo) |

## 8. Pacote de abertura — objeto por objeto, e a tabela antes/depois

| Objeto | Antes do 2.C | Depois da abertura autorizada |
|---|---|---|
| `EXECUTE` de `decidir_proposta` | **zero** (revogado de PUBLIC/anon/authenticated) | **`authenticated`** — gate real **interno** por alvo: Case ⇒ `is_curator_for_case`; **profissional ⇒ `has_role('administrador')`** (ADR-068 §14.2). PUBLIC/anon permanecem revogados |
| `decidir_proposta` — alvo profissional | fora de escopo (1.12 §7) | **herdada conforme previsto**: mesmo mecanismo, mesmo registro do ato, mesmos desfechos (PA-12); **efeito da confirmação** = declaração em `professional_subcriterion_map` com `status` **+ `evidence_id`** (a evidência exata da proposta — 1.8-R1 §7.2 cumprido pela própria confirmação) |
| Emissor profissional (§7) | inexistente | criado, inerte a papéis (zero grants — invocação por operação autorizada, padrão 2.2C) |
| Escritores do Mapa do Profissional (D-01) | um (`mapa-profissional-repository`) | **dois nominais**: repository (manual) · `decidir_proposta` (por confirmação) — validações idênticas (G-7 do 2.6 estendida) |
| Superfície | nenhuma | **um painel interno da operação** (§10) — rota do portal interno com gate `administrador`; **nenhuma rota pública, nenhuma superfície da paciente** |
| Policies | zero nas tabelas da camada | **zero — inalterado** (leitura via caminhos servidor/capabilities; escrita só via definer) |
| Grants de tabela | zero | **zero — inalterado** |
| O2-A/B | pendentes (1.12 §20) | **aceites executáveis do 2.C** (§9) |
| 2.C | `BLOQUEADO` | `EM IMPLEMENTAÇÃO` → encerramento pelo rito |
| Fronteira | `FECHADA` | **ABERTA apenas no recorte deste pacote** — mensurável pela diferença exata desta tabela |

**Permanecem fechados/zero**: qualquer grant além do `EXECUTE` da decisora ·
qualquer policy · qualquer superfície fora do painel interno · regime de bloco ·
paciente/Curador confirmando o Mapa do Profissional.

## 9. O2-A e O2-B — de condição a aceite executável (bloqueantes)

| | Exigência normativa (CONTRATO_1_12 §5/§20; ADR-066 §7.1; §2.4 el. 5) | Implementação esperada | Oráculo | Mutação que derruba |
|---|---|---|---|---|
| **O2-A** | **mesmo número de interações** para confirmar e para recusar | os dois atos do painel disparam com o mesmo número de cliques/passos | **teste de componente** contando interações até cada desfecho — números **iguais** | um clique/etapa extra só no recusar ⇒ cai |
| **O2-B** | **mesma proeminência** na superfície | os dois controles com mesma hierarquia visual/semântica (mesmo nível, sem menu secundário, sem destaque assimétrico) | teste de componente estrutural (mesmo contêiner/papel; recusa não escondida) + varredura anti-padrões (`menu`, `dropdown` só na recusa) | recusar movido a menu secundário ⇒ cai |
| **+P-10 de custo** | motivo **oferecido, nunca exigido** (já estrutural na capability) | campo opcional nos dois atos | teste: ato sem motivo é válido | exigir motivo só na recusa ⇒ cai |

## 10. Apresentação — a superfície mínima

**Um painel interno da operação** (gate `administrador`), por profissional, item
a item: item/conceito · proposta (valor sugerido) · **proveniência completa**
(declaração original com versão e data · regra+versão · emissão · catálogo) ·
estado atual do Mapa e **julgamento associado quando exista** (leitura de
`curator_judgments` — nunca edição) · os **dois atos equivalentes** · autoria e
data do desfecho quando decidido · **nenhum resumo que esconda proveniência
auditável**. Pendente = ausência exibida como aguardo (E-01/E-03); **nada
pré-marcado** (A2d).

## 11. Persistência, autoria, idempotência, concorrência, discordância — TUDO herdado do 1.12

**Nenhuma entidade nova.** Reutilização integral do já aprovado: ato em
`derivation_proposal_acts` (append-only, um ato decisório por proposta) ·
autoria `auth.uid()` **sem parâmetro de ator** · atomicidade ato+efeito
(rollback total em falha) · desfechos **PA-12**: `ATO_REGISTRADO` ·
`ATO_JA_REGISTRADO` (**só** mesmo ator + mesma intenção) · `ATO_JA_CONSUMADO`
(qualquer outro caso, inclusive outro ator no mesmo sentido) ·
`PROPOSTA_NAO_DECIDIVEL` (S1/estado) · árbitro = índice único + precondição
transacional — **nunca `SELECT→decide→write`** como autoridade. **Discordância =
`RECUSA` da mesma capability** (mutuamente exclusiva com a confirmação **por
construção** — um ato decisório por proposta); efeito: **lacuna no Mapa, nunca
valor** (ADR-066 §7.3); o painel 1.11 conta automaticamente; motivo legível só
na Auditoria (PA-12 §18). Supersessão concorrente (S1 — evidência nova):
condição 6 reavaliada na transação ⇒ `PROPOSTA_NAO_DECIDIVEL`. **Nenhum
mecanismo paralelo nasce.**

## 12. R-1 e CD-1 — requisitos materiais

| | Texto normativo | Implicação no desenho | Guarda/Aceite |
|---|---|---|---|
| **R-01** | *"A proposta vira decisão automática disfarçada. O registro dirá 'o humano confirmou' quando ninguém leu"* — risco dominante (Arquitetura §16) | tudo que encarece o carimbo: nove elementos exibidos (A2c) · ato por item (DP-5) · P-10 executável (O2-A/B) · A2d · painel de discordância observando desde o dia 1 | G-2.C-1/7 + O2-A/B + mutação "auto-confirmação" |
| **CD-1** | *"nenhum valor da ponte estabiliza antes de Cases reais"* (entrada da Onda 2; R-02) | **nenhuma regra material nasce no 2.C**; valores são da Autoridade de Método, com Cases reais; o 2.C entrega o mecanismo vazio-honesto | G-2.C-9: nenhuma migration do 2.C semeia `derivation_rules`/`degree_map`/correspondência profissional |

## 13. Rollback — fechar sem apagar

Reversível objeto a objeto: **revogar** o `EXECUTE` da decisora (volta a zero) ·
remover painel/rotas/actions · `drop` do emissor profissional · reverter guardas.
**Jamais apaga**: confirmações e recusas registradas (atos humanos) ·
julgamentos · discordâncias · propostas · declarações já gravadas no Mapa ·
estruturas de 1.12/2.3/2.4/2.6. *Rollback de código fecha a porta; fatos
humanos são história* (I-7). Desativação operacional segura = revogação do
grant, um comando, sem migração destrutiva.

## 14. Guardas — `G-2.C-*`

| # | Guarda | Cai se |
|---|---|---|
| G-2.C-1 | **A2d executável** — não-atos deixam `PROPOSTA` e Mapa intacto | decurso/navegação/fim de sessão produz efeito |
| G-2.C-2 | abertura **exata** — só o `EXECUTE` da decisora; PUBLIC/anon revogados; zero policy/grant de tabela | qualquer grant/policy além do pacote (§8) |
| G-2.C-3 | confirmação **item a item** — um `proposal_id` por ato; nenhum atalho de lote | laço/lote/"confirmar todos" (com C-02) |
| G-2.C-4 | **nove elementos presentes** (A2c) — componente não renderiza decisão sem eles | painel decide sem exibir elemento 1–4 |
| G-2.C-5 | autoria/data/desfecho do ato — sem ator de payload | `actor_id` em payload; ato sem autoria |
| G-2.C-6 | confirmação **não cria julgamento**; Motor não confirma | escrita em `curator_judgments` pelo fluxo; auto-confirmação |
| G-2.C-7 | **DP-5** — nenhum regime de bloco, nem equivalente | mecanismo de massa em qualquer camada |
| G-2.C-8 | emissor profissional **não escreve no Mapa, não julga, não confirma** (A2b) | emissor toca Mapa/juízo/ato |
| G-2.C-9 | **CD-1** — zero semeadura de regra/valor material | migration semeia correspondência |
| G-2.C-10 | proveniência ponta a ponta — confirmação grava `evidence_id` da proposta; Ficha reconstrói | efeito sem vínculo; elo quebrado |
| G-2.C-11 | separação de papéis — paciente/Curador **não** confirmam o Mapa do Profissional; §13.2 executável | gate aceita papel errado; confirmador julga no mesmo Case |
| G-2.C-12 | rollback não apaga fatos | reversão dropa atos/declarações |

## 15. Falseabilidade — mutações obrigatórias

grant excessivo (`PUBLIC`/tabela) ⇒ G-2.C-2 · confirmação em bloco ⇒ G-2.C-3/7 ·
ator no payload ⇒ G-2.C-5 · Motor auto-confirma / decurso confirma ⇒ G-2.C-1/6 ·
confirmação cria julgamento ⇒ G-2.C-6 · proveniência removida do painel ⇒
G-2.C-4 · item/versão errados confirmados ⇒ atomicidade/PA-12 (ato referencia
proposta exata) · discordância ignorada (recusa vira valor no Mapa) ⇒ ADR-066
§7.3/G-2.C-10 · DP-5 contornada ⇒ G-2.C-7 · O2-A violado (clique extra) ⇒ §9 ·
O2-B violado (recusa escondida) ⇒ §9 · emissor ganha autoridade (escreve
Mapa/julga) ⇒ G-2.C-8 · rollback apaga ato humano ⇒ G-2.C-12 · regra semeada ⇒
G-2.C-9.

## 16. Higienes herdadas

F-2.3-1 · F-2.4-1 · F-2.6-1: **preservadas, não corrigidas**. O 2.C **toca os
regimes** de `derivation_proposals` (novo emissor) e do Mapa (novo escritor):
a implementação **reexecuta e mantém verdes** os oráculos vivos correspondentes
(C-11 evoluída, D-01 evoluída, validações idênticas, varreduras + camadas vivas).

## 17. Critérios de aceite do 2.C

| # | Aceite |
|---|---|
| 1 | **A2c**: teste de componente prova os nove elementos — matriz do §5 integral |
| 2 | **A2d**: teste de integração — os três não-atos deixam `PROPOSTA` e Mapa intacto |
| 3 | **O2-A e O2-B verdes** (§9), com as mutações caindo — **bloqueantes** |
| 4 | Confirmação item a item: ato por proposta; atalhos de lote impossíveis (G-2.C-3/7; C-02 viva) |
| 5 | Confirmação profissional grava `status` **+ `evidence_id`** atomicamente; recusa grava lacuna; desfechos PA-12 todos alcançáveis |
| 6 | Gate por alvo: Case ⇒ Curador do Case; profissional ⇒ `administrador`; §13.2 executável (G-2.C-11) |
| 7 | Emissor profissional: oito condições da ponte; **zero propostas reais** (nenhuma regra material — G-2.C-9); A2b intacta |
| 8 | Pacote de abertura **exatamente** o do §8 — tabela antes/depois auditável por catálogo |
| 9 | Painel 1.11 conta os desfechos reais sem alteração; Ficha reconstrói a cadeia da confirmação |
| 10 | G-2.C-1..12 verdes; mutações do §15 caem; oráculos F-2.x reexecutados verdes |
| 11 | Rollback provado: revogação fecha; nenhum fato humano apagado |
| 12 | Regressão integral verde |

## 18. Encaminhamento

Ao **Guardião da CURADORIA 2.0**, para julgamento integral — incluindo **a
decisão explícita de abertura da Fronteira** no recorte do §8, O2-A/B como
aceites bloqueantes, a extensão herdada da decisora ao alvo profissional, DP-5,
o emissor vazio-honesto, R-1/CD-1, guardas, falseabilidade e rollback. Após
julgamento e lavratura: implementação por missão própria ao Engenheiro. **Nada
foi aberto nesta missão.**
