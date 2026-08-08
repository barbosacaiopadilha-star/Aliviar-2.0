# Dossiê de Fechamento Formal das Ondas 1 e 2 — Curadoria 2.0

| Campo | Valor |
|---|---|
| **Versão** | v1.0 |
| **Autor** | Agente 02 — Arquiteto da Curadoria 2.0 |
| **Data** | 2026-08-08 |
| **Status** | **Emitido** — consolidação arquitetural/documental; nível derivado, datado |
| **Base** | `aaffd52` (Item 2.C formalmente encerrado; Fronteira aberta no recorte autorizado) |
| **Escopo** | Consolidar o fechamento **formal** das Ondas 1 e 2 — sem operação, sem nova semântica material, sem ampliar a Fronteira |

> **Tese do dossiê:** *o arco material fechou; o arco formal fechou junto e ninguém
> registrou num lugar só.* Esta consolidação **não descobre pendência material
> nenhuma** — e a maior parte do que parecia pendente já tinha sido resolvida por
> atos lavrados que os relatórios posteriores não releram.

---

## 1. Matriz canônica das Ondas 1 e 2

| Item | Objeto | Material | Documental | Verificação | Encerramento | Situação final |
|---|---|---|---|---|---|---|
| **1.1** | guarda de participação no Motor | `f1a7427`+`36dde31` | corrigido 07/08 | regressão certificada | mapa | **FORMALMENTE ENCERRADO** |
| **1.2** | assinatura do Curador (G-10) | resolvido **dentro do 2.6** (`01f45dc`) | carregado→resolvido | certificado no 2.6 | 2.6 | **FORMALMENTE ENCERRADO (por absorção no 2.6, com autoridade — PA-14)** |
| **1.3** | abertura preservada (P12) | 04/08 | ok | 9 testes, falseabilidade | mapa | **FORMALMENTE ENCERRADO** |
| **1.4** | dependência falsa COMPAT→AVALIAÇÃO | `fae6465` | corrigido 07/08 | regressão certificada | mapa | **FORMALMENTE ENCERRADO** |
| **1.5** | checkboxes derivados (P13) | `9f6ee86` | Ato 3 do ciclo (`9afaead`) | regressão | ciclo de lavraturas | **FORMALMENTE ENCERRADO** |
| **1.6** | painel de prontidão | `56ccfd0` | reconciliado | verificado + certificado 08/08 | mapa | **FORMALMENTE ENCERRADO** |
| **1.7** | segunda entrega e superfícies mortas | `2c039a3` | Ato 4 (`9afaead`), sob DP-2 lavrada | regressão | ciclo de lavraturas | **FORMALMENTE ENCERRADO** |
| **1.8 (+R1/MR1)** | Ficha de Explicação | `c3242ea`→`041b423`→`095054e` | Contrato cumprido | sem ressalvas | DT-01 | **FORMALMENTE ENCERRADO** |
| **1.9** | cadeia de proveniência | `30d8163` | corrigido 07/08 | via cadeia do 1.8 | mapa | **FORMALMENTE ENCERRADO** |
| **1.10** | reconhecimento em duas colunas | série `1.10B-P2`/`C-A` | corrigido 07/08 | integração | mapa | **FORMALMENTE ENCERRADO** |
| **1.11 (+MR1)** | painel de discordância | `4928af6`+`cfbcc41` | PA-14 família | Agente 04 + 05 | certificado | **FORMALMENTE ENCERRADO** |
| **1.12 (+MR1)** | mecanismo de discordância | `cdf485d`+`2c52832` | PA-12 | Agente 04 + 05 | certificado | **FORMALMENTE ENCERRADO** |
| **1.A** | função pura de derivação | `c03cc26` | PA-13 | certificado | certificado | **FORMALMENTE ENCERRADO** |
| **2.1** | `derivation_proposals` inerte | `1ed29f8` | reconciliado 07/08 | guardas C-01 família | mapa | **FORMALMENTE ENCERRADO** |
| **2.2A/MR1/B/B-R1/C/C-R1** | regra, ciclo de vida, ponte | `30c6809`…`36dde31` | §3.1–§3.4 do mapa | Agente 04 | DT-01 (`eca57bc`) | **FORMALMENTE ENCERRADO** (com dívidas não bloqueadoras registradas) |
| **2.3** | divisão da AVALIAÇÃO | `8305d97` | PA-16 | Agente 04 (13 mutações) | Agente 05 | **FORMALMENTE ENCERRADO** |
| **2.4** | `curator_judgments` | `2f6ec05` | PA-15 | Agente 04 | Agente 05 | **FORMALMENTE ENCERRADO** |
| **2.5** | regime de confirmação em bloco | — | §5.4.0 | — | — | **PROIBIDO POR ADR** (enquanto DP-5 aberta) |
| **2.6** | governança de quem confirma + G-10 | `01f45dc` | PA-14 | Agente 04 | Agente 05 | **FORMALMENTE ENCERRADO** |
| **2.C** | Fronteira do Mapa do Profissional | pacote de abertura | PA-17 | Agente 04 | `aaffd52` | **FORMALMENTE ENCERRADO** |

**Nenhuma linha em `ENCERRADO MATERIALMENTE — FALTA ATO FORMAL`. Nenhuma em
`PENDENTE`.**

## 2. Item 1.5 — cadeia documental completa

**Objeto**: checkboxes derivados do Acolhimento (P13). **Implementação**:
`9f6ee86`, citando **nominalmente** M-001 (predicado, ramos, monotonicidade),
M-003 (caminho de escrita) e DT-06. **Verificação**: coberto pela regressão
certificada desde então. **Ato de encerramento**: **Ato 3 do ciclo de
lavraturas** (commit `9afaead`), sob decisão do Guardião sobre o dossiê
`ddadcd7`. **Documento que prova**: célula do 1.5 no mapa + bloco "ONDA 1
FORMALMENTE ENCERRADA" + o próprio commit.

**Por que registros posteriores ainda o listaram como pendente:** a leitura do
Certificador é **anterior ao ciclo de lavraturas** — F-REC-1 foi aberto quando o
lastro (M-001/M-003) estava noutro branch, e o Ato 1 (`66717ab`) resolveu isso
horas antes do Ato 3. **Falta apenas reconhecimento**, e nem ele é ato novo: é
releitura. **Nenhum ato pendente.**

## 3. Item 1.7 — cadeia própria, distinta da do 1.5

**Objeto**: retirada da segunda entrega e das superfícies mortas (P9/P20/RI5).
**Implementação**: `2c039a3`, citando a **Decisão Executiva DP-2** com teor
integral. **A diferença material em relação ao 1.5**: aqui faltava a **lavratura
de uma decisão do Fundador**, não o porte de um documento. Isso **parou o ciclo**
(veredito `CICLO PAUSADO — AGUARDA ATO DO FUNDADOR PARA DP-2`) e só retomou com
o ato: **DP-2 FECHADA pelo Fundador em 2026-08-08** (Registro §4). **Encerramento**:
**Ato 4** do ciclo (`9afaead`). **Nenhum ato pendente.**

## 4. F-REC-1..3

| Achado | Origem | Conteúdo | Evidência de resolução | Material | Formal | Ato necessário |
|---|---|---|---|---|---|---|
| **F-REC-1** | Arquiteto, dossiê `ddadcd7` | 1.5 implementado, lastro fora do branch | Ato 1 `66717ab` (porte byte-idêntico) + Ato 3 | **resolvido** | **resolvido** — o encerramento do 1.5 o consome | **nenhum**; baixa é reconhecimento do Certificador |
| **F-REC-2** | idem | 1.7 sob DP-2 decidida mas não lavrada | Ato 2 (DP-2 FECHADA, Registro §4) + Ato 4 | **resolvido** | **resolvido** | **nenhum**; idem |
| **F-REC-3** | idem | M-001/M-003 ausentes do branch | `66717ab` — quatro documentos portados, `git diff` contra o branch de origem = **vazio** | **resolvido** | **resolvido** | **nenhum**; idem |

**Todos estão no repositório**, não fora dele. A **baixa formal** é ato de quem
os abriu — o Arquiteto os registrou no dossiê; o Certificador os reflete na sua
fila. **Nenhum bloqueia coisa alguma.**

## 5. M-001 / M-003 — auditoria explícita

**O que são**: decisões de **Método** do DT-01 (2026-08-04/05) — M-001 define
quando o Acolhimento está "preparado"; M-003 define o caminho de registro.
**Autoridade válida**: sim, canônicas (índice 2e/2f). **Onde estão**: **neste
repositório**, portadas em `66717ab` a partir do lastro imutável `8911c5e`
(branch `curadoria/2-0-documentacao`). **Byte-idênticas**: sim — verificado por
`git diff` contra o branch de origem, resultado vazio, **duas vezes** (no porte e
na retomada do ciclo). **Risco documental de perda**: **nenhum** — existem em
dois lugares (branch vigente + commit imutável). **Ato adicional para o
fechamento global**: **nenhum**.

> **Correção de leitura registrada:** a menção do Certificador a "M-001/M-003
> fora do repositório" descreve o estado de **antes** de `66717ab`. Hoje estão
> dentro, indexadas e vinculadas ao 1.5.

## 6. H-T-01 — higiene transversal (F-2.3-1 · F-2.4-1 · F-2.6-1 · F-2.C-1)

**O padrão, nomeado**: as quatro dizem a mesma coisa em quatro pacotes — *a
varredura estática protege o artefato lavrado atual, mas não capturaria sozinha
uma **migration futura** do mesmo regime que introduzisse deriva*. As camadas
vivas (oráculos de catálogo, testes de efeito) pinam o que **está aplicado**;
nenhuma delas pina o que **ainda não foi escrito**.

**Não é acidente de quatro pacotes: é uma característica do método de guarda.**
Manter as quatro separadas mantém quatro registros dizendo a mesma frase e
quatro obrigações de vigilância que dependem de alguém lembrar.

**Opção arquitetural recomendada — (4) guarda de regime, referenciada por um
registro transversal:** uma guarda que **enumere nominalmente as migrations que
tocam cada regime protegido** (proposta, julgamento, Mapa, capabilities) e caia
quando uma migration nova entrar sem estar na lista — o mesmo padrão de exceção
nominal que já funcionou cinco vezes (`INERTES_AUTORIZADOS`,
`LEITORES_DE_PROPOSTA_AUTORIZADOS`, C-01d, C-11, D-01). Isso converte "obrigação
de lembrar" em "a suíte avisa".

**Autoridade para decidir**: **Guardião** (é evolução de regime de guardas,
classe das evoluções de C-01d/D-01). **Não implementada aqui**; as quatro
permanecem **não bloqueantes** e **não reclassificadas**.

## 7. FECHAMENTO FORMAL DA ONDA 1

**Já ocorreu** — e tem dossiê próprio:
[`DOSSIE_FECHAMENTO_ONDA_1_ENTRADA_ONDA_2.md`](DOSSIE_FECHAMENTO_ONDA_1_ENTRADA_ONDA_2.md)
(`ddadcd7`, status DECIDIDO E EXECUTADO), com bloco lavrado no mapa: **ONDA 1
FORMALMENTE ENCERRADA — 2026-08-08**. Composição: 12 itens encerrados + 1.2
carregado (e depois **resolvido dentro do 2.6**, o que **fecha o último fio solto
da Onda 1**). Dez condições do §15.0: 10/10. Este dossiê **não reabre nada** —
apenas registra que a única pendência carregada da Onda 1 **deixou de existir**
com o encerramento do 2.6.

## 8. FECHAMENTO FORMAL DA ONDA 2

| Item | Estado |
|---|---|
| 2.1 · série 2.2 · 2.3 · 2.4 · 2.6 · 2.C | **todos FORMALMENTE ENCERRADOS** |
| 2.5 | **PROIBIDO POR ADR** enquanto DP-5 aberta — a onda **fecha sem ele** (§15 da Arquitetura o previu) |

> **Pacote material obrigatório restante da Onda 2: NENHUM.** Confirmado item a
> item contra o mapa e o §15.0.

## 9. Fronteira — o que está aberto e o que não está

**Aberto (recorte do 2.C, PA-17)**: um **único `EXECUTE`** da decisora
(`decidir_proposta`) para `authenticated`, com **gate interno por alvo** ·
**fluxo profissional item a item** · **painel interno** · **emissor profissional**
no regime autorizado (vazio-honesto).

**Fechado — sem alteração**: `anon` · `PUBLIC` · `service_role` como autoria ·
qualquer grant adicional · qualquer policy nova · grant de tabela · paciente ·
regime de bloco · 2.5 · **valores da ponte** · qualquer extensão não lavrada.

## 10. DP-5 e 2.5

**2.5 = PROIBIDO POR ADR enquanto DP-5 estiver aberta** — não "fechado", não
"retirado". **DP-5 não exige ato algum antes de operação/observação**: ela é
**limite normativo permanente** até que a régua de graduação por consequência e a
lista nominal do que nunca entra em bloco sejam decididas **por ADR**, pelo
Método. A operação começa **sem** o regime de bloco, e é assim que deve ser.

## 11. DP-4 — Autoridade de Método: **JÁ FECHADA**

Achado que corrige a premissa da missão:

| Pergunta | Resposta, com fonte |
|---|---|
| O que exige | dono da regra de derivação (§10.5): criar, versionar, suspender, retificar |
| Existe nomeação? | **SIM** — Registro de Governança **§1.1**: *"Decisão do DT-01 — Fundador, em 2026-08-05 (fecha a DP-4)"* |
| Ocupante | **`DT-01 — Fundador`**, situação **ATIVA**, desde 2026-08-05, em **acumulação temporária**; substituição só por decisão formal versionada |
| Autoridade conferida | aprovar regra · promover a `VIGENTE` · suspender · reativar · revogar — com obrigação de motivo e de ADR onde a ADR-069 exige |
| Ato já praticado sob ela? | sim — a promoção de estado é dela por desenho; nenhuma regra material foi promovida ainda porque **nenhuma existe** |
| Operação com regra material exige DP-4 encerrada? | **exige — e está** |

**Nenhuma nomeação é necessária. Nada foi nomeado nesta missão.** *(O Registro §4
lista a DP-4 como FECHADA desde 2026-08-05.)*

## 12. A primeira regra material — o rito

| Pergunta | Resposta |
|---|---|
| Qual regra | uma **regra de correspondência versionada** — grau→importância (Case-side, tabela `derivation_rule_degree_map`) e/ou evidência→estado (lado profissional) |
| Quem propõe | **Autoridade de Método** (`DT-01`), §10.5 — os oito atos |
| Quem aprova/promove a `VIGENTE` | **a mesma Autoridade**, e a ADR-069 §7 exige **`approved_by`, `approval_adr`, `effective_from`** — ou seja, **PROPOSTA → VIGENTE exige ADR** |
| ADR que rege o ciclo | **ADR-069** (versão é fato, transição é ato, estado é leitura derivada; sete arcos; um vigente por regra; um conceito por dona) |
| Dependência de DP-4 | **satisfeita** (§11) |
| Precisa de Case real? | **para a regra, não; para estabilizar valores, sim** — CD-1 (§13) |
| Precisa de evidência real? | para *emitir*, sim: o emissor lê `practice_evidence`/`case_needs` reais |
| Quando o emissor deixa de devolver `SEM_REGRA_VIGENTE` | no instante em que existir **uma versão `VIGENTE` cobrindo o conceito**, com cobertura total dos graus (constraint) e unicidade por conceito (2.2C-R1) |

**Nenhuma regra foi criada ou semeada aqui** (G-2.C-9 intacta).

## 13. CD-1 — o que exatamente limita

| Dimensão | CD-1 bloqueia? |
|---|---|
| Operação **profissional** (confirmar/recusar propostas do Mapa) | **não** — mas fica **vazia na prática** enquanto não houver regra que gere proposta |
| Operação **Case-side** | **não bloqueia o mecanismo**; a ponte permanece vazia até regra material |
| **Estabilização** de valores da ponte | **BLOQUEIA** — *nenhum valor estabiliza antes de Cases reais*; valores provisórios exigem observação |
| **Observação inicial** | **não bloqueia** — ao contrário: a observação é o caminho para estabilizar |

Ou seja: **CD-1 não impede começar; impede declarar certo cedo demais.**

## 14. R-1 — instrumentada, não resolvida

**Quando começa a observação**: no **primeiro ato real** — a primeira
confirmação ou recusa humana sobre uma proposta real, o que pressupõe a primeira
regra `VIGENTE`. **Métricas que já existem**: taxa de discordância por
conceito × versão de regra (capability agregada do 1.11), contagens dos cinco
desfechos, e o registro do ato (autor, data, atestado do visível). **O que
observar**: a taxa e sua distribuição por versão — R-02 é explícito: *discordância
alta corrige a **tabela**, não o Curador*. **Limiar/gatilho**: **nenhum lavrado**
— e não invento um. **Quem interpreta**: a **Autoridade de Método**; **quem reage
ao alarme**: a mesma, corrigindo a regra por nova versão (ADR-069). **Por que
discordância zero sustentada é alarme**: porque R-01 é o risco dominante — *"o
registro dirá 'o humano confirmou' quando ninguém leu"*; um painel que nunca
registra recusa é o sintoma do carimbo, não prova de acerto.

## 15. Operação / observação — diagnóstico decomposto

| Dimensão | Estado |
|---|---|
| Infraestrutura tecnicamente pronta | **SIM** |
| Fronteira autorizada | **SIM** — no recorte do 2.C |
| **Regra material disponível** | **NÃO** — nenhuma existe; emissores devolvem `SEM_REGRA_VIGENTE` |
| Autoridade de Método disponível | **SIM** — DP-4 fechada, ocupante ativo |
| Case real necessário | **SIM para estabilizar** (CD-1); **não para lavrar** a primeira regra |
| Observação R-1 iniciável | **NÃO ainda** — depende do primeiro ato real, que depende da primeira regra |

**Leitura honesta**: tudo o que a engenharia podia entregar está entregue e
aberto no recorte certo. O que falta **não é técnico nem processual — é o
primeiro ato de Método**: a Autoridade lavrar a primeira regra. Até lá, a
Curadoria 2.0 está **pronta e vazia por decisão**, que era exatamente o desenho.

## 16. Certificação global

O processo vigente **não prevê** um "certificado global da Curadoria 2.0". O que
existe e foi cumprido, pacote a pacote: **verificação independente (Agente 04) →
certificação (Agente 05) → encerramento formal**; e, para as ondas, **dossiê +
decisão do Guardião** (precedente: `ddadcd7` → ciclo de lavraturas). **Não invento
rito novo**: o fechamento das duas ondas segue o precedente da Onda 1 — este
dossiê, decidido pelo **Guardião**.

## 17. Perguntas obrigatórias

| # | Resposta |
|---|---|
| Q1 | **SIM** |
| Q2 | **SIM** — desde 2026-08-08 (`9afaead`) |
| Q3 | **SIM** — `DOSSIE_FECHAMENTO_ONDA_1_ENTRADA_ONDA_2.md` |
| Q4 | **SIM** |
| Q5 | **SIM** (Ato 3) |
| Q6 | **NÃO** |
| Q7 | **SIM** |
| Q8 | **SIM** (Ato 4, após DP-2 lavrada) |
| Q9 | **NÃO** |
| Q10–Q11 | resolvido **e** formalmente consumido pelo encerramento do 1.5; baixa = reconhecimento |
| Q12–Q13 | idem, via DP-2 + 1.7 |
| Q14–Q15 | idem, via porte byte-idêntico |
| Q16 | **SIM** |
| Q17 | **SIM** |
| Q18 | **NÃO** — nenhum pacote funcional obrigatório restante |
| Q19 | **SIM** |
| Q20 | **SIM** |
| Q21 | **NÃO** |
| Q22 | **SIM** — recomendação H-T-01, opção (4); decide o Guardião |
| Q23 | **SIM — DP-4 FECHADA em 2026-08-05** |
| Q24 | **SIM** — `DT-01 — Fundador`, ATIVA, acumulação temporária |
| Q25 | **SIM** — a primeira regra material **pode ser lavrada agora** |
| Q26 | **a Autoridade de Método**, por ADR (ADR-069 §7: `approved_by`/`approval_adr`/`effective_from`) |
| Q27 | **a estabilização de valores** (não o mecanismo, não a observação) |
| Q28 | **NÃO ainda** — a observação nasce com o primeiro ato real, que exige a primeira regra |
| Q29 | **NÃO** existe rito de certificação global; existe o rito por pacote e o dossiê+Guardião por onda |
| Q30 | **Objetivamente: (a) a decisão do Guardião sobre este dossiê e (b) a primeira regra material lavrada pela Autoridade de Método.** Nada mais |

## 18. Classificação

> ### ONDAS 1 E 2 — FORMALMENTE ENCERRÁVEIS
>
> Não há pendência material. Não há ato de engenharia. Falta **um** ato de
> reconhecimento: a decisão do Guardião sobre este dossiê.

> ### OPERAÇÃO/OBSERVAÇÃO — APTA CONDICIONALMENTE
>
> **Causa precisa:** a infraestrutura está pronta, a Fronteira aberta no recorte
> e a Autoridade nomeada — mas **não existe regra material `VIGENTE`**, e sem ela
> os emissores devolvem `SEM_REGRA_VIGENTE`, nenhum ato real acontece e a
> observação de R-1 não tem o que observar. **A condição é um ato de Método, não
> de engenharia.**

## 19. Sequência canônica final

| # | Ato | Agente | Missão | Base | Bloqueia |
|---|---|---|---|---|---|
| **1** | **Decidir o fechamento formal das Ondas 1 e 2** sobre este dossiê — e decidir **H-T-01** (§6) | **Guardião da CURADORIA 2.0** | julgamento do dossiê + disposição da higiene transversal | commit deste dossiê | o encerramento formal do programa; não bloqueia a regra |
| **2** | **Lavrar a primeira regra de derivação** (proposta + promoção a `VIGENTE` por ADR, ADR-069 §7) | **Autoridade de Método — `DT-01`** | ato de Método próprio | idem | **tudo o que depende de proposta real**: emissão, ato humano, observação R-1 |
| **3** | *(consequência do 2)* primeira emissão e **primeiro ato real** na Fronteira | operação (Curador/administrador conforme alvo) | uso | — | início da observação |
| **4** | Reconhecimento/baixa de F-REC-1..3 e da reconciliação 1.5/1.7 | **Certificador** | ato de fila, **paralelo e não bloqueante** | idem | nada |
| **5** | *(se o Guardião aprovar H-T-01)* guarda de regime | Arquiteto → Engenheiro | endurecimento transversal | pós-decisão | nada |

**Condição para operação**: o ato **2** — e só ele.

**Autoridades não se misturam**: 1 é do Guardião; 2 é da Autoridade de Método; 4
é do Certificador; 5 nasce só depois de 1.
