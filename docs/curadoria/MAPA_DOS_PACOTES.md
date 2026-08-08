# Mapa dos Pacotes — Curadoria 2.0

| Campo | Valor |
|---|---|
| **Versão** | v1.0 |
| **Autor** | Agente 03 — Implementador (pacote F-00) |
| **Data** | 2026-08-04 |
| **Status** | **Vigente — fonte única dos pacotes da Curadoria 2.0** (nível derivado) |
| **Dependências** | [`ARQUITETURA_CURADORIA_2_0.md`](ARQUITETURA_CURADORIA_2_0.md) §15 (autoridade sobre ondas e escopo) · [`REGISTRO_DE_GOVERNANCA.md`](REGISTRO_DE_GOVERNANCA.md) |
| **Documentos relacionados** | [`ROADMAP_EXECUTIVO_CURADORIA_2_0.md`](ROADMAP_EXECUTIVO_CURADORIA_2_0.md) · [`PLANO_EXECUTIVO_CURADORIA_2_0.md`](PLANO_EXECUTIVO_CURADORIA_2_0.md) (superado em parte, §5) |
| **Origem** | Pacote F-00 |

> **Taxonomia adotada:** a da **Arquitetura §15** (Ondas 0–5, itens `0.x`, `1.x`, `1.A`,
> `2.x`, `2.C`, `3.x`). A taxonomia anterior do Implementador (`F-`, `C-`, `L-`, `K-`) fica
> **superada** e é preservada apenas na coluna de rastreabilidade e no §5.
>
> **Estados possíveis:** `PLANEJADO` · `AUTORIZADO` · `EM EXECUÇÃO` · `CONCLUÍDO` ·
> `BLOQUEADO` · `RETIRADO`. Hoje, **um** pacote está fora de `BLOQUEADO`/`PLANEJADO`.

---

## 1. Onda 0 — Verificar e decidir (nenhuma linha de código)

| Código | Nome | Objetivo | Dependências | Critérios de aceite | Estado | Responsável | Rollback |
|---|---|---|---|---|---|---|---|
| **0.1** | Veredito sobre P15 | Confirmar/refutar se o Motor recebe viabilidade | — | Veredito escrito, sem ambiguidade: guarda executável **ou** correção do Congelamento §4.3 | **BLOQUEADO** (DP-1) | Arquiteto + Guardião | n/a |
| **0.2** | Destino formal do ACE | Descontinuado, suspenso ou ativo; destino do dado histórico e das superfícies | — | Decisão registrada (ADR-E) | **DECIDIDO** — **DP-2 fechada pelo Fundador em 2026-08-08** (motor anterior congelado, histórico preservado; Registro de Governança §4). **ADR-E permanece recomendada, não bloqueante** | **Fundador** | n/a |
| **0.3** | Listas provisórias P3–P7 | Fechar as cinco listas `OPCOES_PROVISORIAS_*` | — | Listas definitivas; efeito sobre dados gravados declarado | **BLOQUEADO** (DP-3) | Método | n/a |
| **0.4** | Aprovação da Arquitetura | Tornar a v1.2 canônica nas seções DOMÍNIO/ARQUITETURA/GOVERNANÇA | 0.1 | Parecer do Guardião **versionado** (DP-11) e cabeçalho da Arquitetura atualizado (G-01) | **BLOQUEADO** | Agente 00 | n/a |
| **0.5** | Nomear a Autoridade de Método sobre Regras de Derivação | Dar dono à regra de derivação (§10.5) | — | Ocupante nomeado por escrito | **BLOQUEADO** (DP-4 / RR-3) | **Fundador** | n/a |
| **0.6** | **Versionar os documentos da 2.0** | Governança documental controlada e rastreável | — | Documentos criados, indexados, versionados; pacote de segurança separado; commit autorizado | **EM EXECUÇÃO — este pacote (F-00)**; commit **pendente de autorização** | Implementador + engenharia | remover os arquivos criados |

## 2. Onda 1 — Corrigir defeitos e construir a base de auditabilidade

> ### ONDA 1 FORMALMENTE ENCERRADA — 2026-08-08
>
> Decisão do **Guardião da CURADORIA 2.0** sobre o dossiê
> [`DOSSIE_FECHAMENTO_ONDA_1_ENTRADA_ONDA_2.md`](DOSSIE_FECHAMENTO_ONDA_1_ENTRADA_ONDA_2.md)
> (`ddadcd7`), executada pelo ciclo de lavraturas (Ato 1: `66717ab` — porte de
> M-001/M-003 e do Processo; Atos 2–7: este commit), com o **ato do Fundador
> que fechou a DP-2** (2026-08-08).
>
> **Composição:** 12 itens implementados e encerrados — 1.1, 1.3, 1.4, **1.5**
> (`9f6ee86`, M-001/M-003/DT-06), 1.6 (`56ccfd0`), **1.7** (`2c039a3`, DP-2),
> 1.8+R1+MR1, 1.9, 1.10, 1.11+MR1, 1.12+MR1, 1.A. O **1.2** foi **CARREGADO
> PARA A ONDA 2** (G-10/RLS, junto à releitura do 2.6) — **pendência carregada ≠
> falha de encerramento**; nenhuma policy foi alterada retroativamente.
>
> **As dez condições do §15.0: 10/10 satisfeitas e testadas** (dossiê §12).
> Dívidas não bloqueantes consolidadas no dossiê §15. Nenhum item de engenharia
> permanece aberto na onda.

**Entrada:** Onda 0 fechada · P15 com veredito · Autoridade nomeada.
**Proibição da onda:** nenhuma proposta persistida, nenhuma proposta apresentada a humano.

### 2.1 Correções de defeito

| Código | Nome | Objetivo | Dep. | Aceite | Estado | Resp. | Rollback | Era |
|---|---|---|---|---|---|---|---|---|
| **1.1** | Guarda executável de participação no Motor | Tornar executável o invariante P15/RI8 | ~~0.1 / DP-1~~ — **DP-1 ratificada (PA-1)** | A4 verde: conceito `MOTOR_PARTICIPATION: NUNCA` nunca aparece em cruzamento | **CONCLUÍDO** — corrigido em 2026-08-07: DP-1 ratificada, `participacao-no-motor.ts` existe (`f1a7427`), e o **2.2C-R1** (`36dde31`) levou `MOTOR_PARTICIPATION` ao Catálogo, eliminando o `Record` manual. O estado `BLOQUEADO` anterior era divergência mapa ⟂ git | Arquiteto + Guardião, depois Implementador | reverter commit | F-01 |
| **F-01** | **Guardas executáveis da Curadoria 2.0** | 21 guardas + 1 caracterização, sem tocar código de produto | — | 53 testes verdes; suíte unitária e typecheck limpos; nenhuma alteração funcional | **CONCLUÍDO** (2026-08-04), **retificado por F-01A** | Implementador | apagar `tests/unit/guardas-curadoria-2-0/` | — |
| **F-01A** | **Retificação dirigida das guardas** | Executar os sete itens da verificação do Agente 04 | F-01; relatório do Agente 04 | achado F-01/04 removido; F-01/01 e F-01/02 reclassificados como dívida documental; F-02 protegendo de verdade; teste tautológico eliminado; 55 testes verdes | **CONCLUÍDO** (2026-08-04) — segue para o Agente 04 | Implementador | reverter os dois arquivos de teste ao estado de F-01 | — |
| **F-02** | **Modelo de Dados da 2.0** (`derivation_proposals`, `curator_judgments`) | Materializar a camada de persistência da 2.0 | **~~ADR-A/B/D~~ lavradas (066/067/068)** · restam: **Onda 1 verde**, **DP-4** (Autoridade de Método), **guarda C-01** | — | **IMPEDIDO** (2026-08-04, relatório v2.0) — o bloqueio é **declarado pelas próprias ADRs**; nada implementado | Fundador (sequenciamento e nomeação) + Guardião/Arquiteto/Governança (C-01) | n/a — nada foi criado | 2.1 + 2.4 |
| **1.2** | Assinatura do Curador | `curatorName` deixa de ser `null` | **RLS de `curadoria.profiles`** | X3 verde | **CARREGADO PARA A ONDA 2** (2026-08-08) — o mérito **não** foi encerrado: G-10 permanece (nenhuma policy permite ao paciente ler o perfil do Curador); a correção exige RLS, **vedada à Onda 1** por definição — não é falha do fechamento. **Nenhuma policy foi alterada retroativamente.** A resolução passa à releitura do **2.6**, que agora o carrega | Guardião + Arquiteto decidem a via (na Onda 2) | reverter; volta a `null` | C-10 |
| **1.3** | Abertura preservada na regeneração | Fim da sobrescrita do texto humano (P12) | — | O5 verde; guardas da ADR-064 intactas | **CONCLUÍDO** (2026-08-04) — 9 testes novos, falseabilidade provada | Implementador | reverter os dois arquivos; o pacote só deixa de destruir | C-11 |
| **1.4** | Remoção da dependência falsa COMPAT→AVALIAÇÃO | P11 | — | Estado da etapa reflete a leitura; Mesa segue não bloqueando | **CONCLUÍDO** (`fae6465`) — corrigido em 2026-08-07: o mapa dizia `PLANEJADO` mas o commit se autodeclara "Item 1.4 da Onda 1", os dois oráculos foram corrigidos nele, e toda a regressão verificada desde então o cobre. **Sem verificação independente dedicada** — coberto pela regressão certificada do 1.8-R1-MR1 | Implementador | reverter | C-12 |
| **1.5** | Checkboxes derivados do Acolhimento | P13 | ~~definição de Método~~ — **M-001/M-003 decididas e portadas** (`66717ab`, lastro `8911c5e`) | Nenhum critério de saída do COS enfraquece | **FORMALMENTE ENCERRADO** (2026-08-08) — implementação `9f6ee86` sob autoridades **M-001, M-003 e DT-06** citadas no próprio commit; lastro agora no branch vigente; **nenhuma decisão de Método nova, nenhuma reimplementação**. O `BLOQUEADO` anterior era F-REC-1 (lastro noutro branch) | Implementador | reverter | C-13 |
| **1.6** | Painel de prontidão para emissão | G6/O8 | — | O3 verde; a prontidão **deriva** das mesmas guardas, não as reimplementa | **FORMALMENTE ENCERRADO** — implementação histórica em `56ccfd0`, integrada em `1599390`; verificação independente no HEAD `c03cc26` e certificação formal em 2026-08-08: O3 verde, sincronia painel × emissão confirmada, duplicação de guardas inexistente; **R-obs-1** registrada como observação não bloqueante, fora do item. O `PLANEJADO` anterior era divergência mapa ⟂ git | Implementador | remover componente | C-14 |
| **1.7** | Retirada da segunda entrega e das superfícies mortas | P9/P20/RI5 | ~~0.2~~ — **DP-2 FECHADA pelo Fundador (2026-08-08)** | X4 verde; **nenhum dado histórico apagado** | **FORMALMENTE ENCERRADO** (2026-08-08) — implementação `2c039a3`, reconhecida pela DP-2 lavrada como **execução da decisão material prévia** (motor anterior congelado · nenhuma operação nova · histórico preservado). O `BLOQUEADO` anterior era F-REC-2 (decisão real, lavratura pendente) | Implementador | reverter | K-61 |

### 2.2 Base de auditabilidade — **nasce antes da primeira proposta**

| Código | Nome | Objetivo | Dep. | Aceite | Estado | Resp. | Rollback | Era |
|---|---|---|---|---|---|---|---|---|
| **1.8** | **Ficha de Explicação** (§11) | Explicabilidade obrigatória, incluindo explicação de proposta | 1.1 · **1.9** (ver §2.3) | **AC-EXPLICA** (bloqueante): sem explicação, a superfície **não renderiza**; fallback genérico proibido | **CONCLUÍDO E VERIFICADO** — cadeia de fechamento: base técnica `c3242ea` → R1 `041b423` → MR1 `095054e`; verificação independente final concluída **sem ressalvas**; **encerrado formalmente pelo DT-01 em 2026-08-07** | Implementador | remover a Ficha desliga o consumo, não a regra | **novo** |
| **1.8-R1** | **Fechamento da Proveniência da Ficha** | Cumprir integralmente o §11.4 | 1.8 · 1.9 · [`CONTRATO_1_8_R1.md`](CONTRATO_1_8_R1.md) | os **doze** critérios do §16 do Contrato | **CONCLUÍDO COM RESSALVAS FECHADAS PELO `1.8-R1-MR1`** — `041b423`, 12/12 critérios confirmados pelo Agente 04; as três ressalvas lavradas no §22 foram fechadas e verificadas em `095054e` | Implementador | reverter ao estado de `c3242ea`; as migrations são aditivas e reversíveis | **novo** |
| **1.8-R1-MR1** | **Microcorretivo de encerramento** (Micro-retificação) | Trigger recusa `NULL` na mudança de `status` de linha vinculada (§22.4) · seis testes do trigger · teste concorrente · Ficha sai de `INERTES_AUTORIZADOS` | 1.8-R1 · Contrato §22 | §22.6 + §22.7 verdes · A5/A5b fechados com a lista reduzida · `041b423` segue verde | **CONCLUÍDO E VERIFICADO** — `095054e`; reapresentação e borda `NULL` verificadas, concorrência verificada, autoridade morta da A5 removida, regressão completa verde, **sem ressalvas remanescentes** | Implementador | reverter a migration nova do trigger; a lista A5 volta com um `git revert` | **novo** |
| **1.9** | Cadeia de proveniência ponta a ponta (§11.4) | Reconstruir qualquer frase até a origem | ~~1.8~~ — **dependência invertida**, ver §2.3 | M3 verde | **CONCLUÍDO** (`30d8163`) — corrigido em 2026-08-07 | Implementador | reverter | **novo** |
| **1.10** | Reconhecimento em duas colunas (§6.2.1) | Ela lê **o que declarou** ao lado da tradução (P8) | 1.9 | X2 verde; Perfis antigos exibidos no formato da época (R-07) | **CONCLUÍDO** — série `1.10B-P2` e `1.10C-A` (`79949b5`, `9de858e`); corrigido em 2026-08-07 | Implementador + decisão sobre o texto de reconhecimento | flag; reconhecimentos feitos permanecem válidos | L-32 (antecipado) |
| **1.11** | Painel de discordância, vazio | Existir antes da primeira regra | 1.8 ✅ · [`CONTRATO_1_11_PAINEL_DE_DISCORDANCIA.md`](CONTRATO_1_11_PAINEL_DE_DISCORDANCIA.md) | O6: taxa de discordância observável por conceito e por versão · os **dez** critérios do §16 do Contrato | **FORMALMENTE ENCERRADO** — `4928af6` + microcorretivo `1.11-MR1`; encerramento certificado em `cfbcc41` (corrigido no dossiê da Onda 1, 2026-08-08) | Implementador | remover painel + `drop` da capability | **novo** |
| **1.11-MR1** | **Microcorretivo de encerramento** (Micro-retificação) | Remover 2 bytes `NUL` literais do módulo do painel · fortalecer a guarda anti-ranking (comparador multilinha) · corrigir o cabeçalho de `admin.ts` | 1.11 · Contrato §17 | §17.1 aceite (arquivo texto, chave idêntica) · §17.3 mutação cai e controle negativo passa · `4928af6` segue verde | **CONCLUÍDO** — incorporado ao encerramento do 1.11 (`cfbcc41`); corrigido no dossiê da Onda 1 | Implementador | reverter os três arquivos; nenhuma migration envolvida | **novo** |
| **1.12** | Mecanismo de discordância na Fronteira Humana | Discordar custar o mesmo que concordar | 1.11 ✅ · [`CONTRATO_1_12_MECANISMO_DE_DISCORDANCIA.md`](CONTRATO_1_12_MECANISMO_DE_DISCORDANCIA.md) | O2 verde (P-10 como contrato testado) — desdobrado em O2-A..E pelo Contrato §20/§25 | **FORMALMENTE ENCERRADO** — contrato aprovado (PA-12) · implementação `cdf485d` · MR1 `2c52832` · F-1.12-1 quitada · certificação do Agente 05 (corrigido no dossiê da Onda 1, 2026-08-08) | Implementador | remover — tudo aditivo, zero ato real nesta onda (Contrato §24) | **novo** |
| **1.A** | **Função pura de derivação do Mapa do Profissional** | Contrato puro, **sem persistência, sem consumidor, sem superfície** | 1.1 ✓ · [`CONTRATO_1_A_FUNCAO_PURA_DERIVACAO_MAPA_PROFISSIONAL.md`](CONTRATO_1_A_FUNCAO_PURA_DERIVACAO_MAPA_PROFISSIONAL.md) | Zero chamadores (verificável); lacuna nunca vira estado positivo (P-04/I-8) — operacionalizados como A1..A6 no Contrato §15 | **FORMALMENTE ENCERRADO** — contrato aprovado e lavrado (Guardião, 2026-08-08, PA-13; ressalva do §9 incorporada; três registros vinculantes); implementado em `c03cc26`; verificação independente e certificação concluídas em 2026-08-08. **Nenhuma semântica material aprovada**: zero chamadores, zero banco, `PROPOSTO`/`LACUNA` inalcançáveis; `2.C` permanece **não aberto** | Implementador | remover o módulo — não tem chamador | L-20 |

### 2.3 Item 1.8-R1 e a inversão 1.8 ↔ 1.9 — correção de 2026-08-07

**A dependência estava invertida no mapa.** O mapa declarava `1.9` dependente de
`1.8`. Na prática o **1.9 veio antes** (`30d8163`) e entregou
[`cadeia-de-proveniencia.ts`](../../src/modules/curadoria/cadeia-de-proveniencia.ts)
— a árvore do §11.4 **com os dois ramos** e com o nó `CONFIRMACAO` em cada um.

O `1.8` então criou um **segundo modelo de proveniência** (`OrigemDoConceito`),
que cobre só o ramo importância, não tem o nó confirmação e confere os fatos
**por forma**, nunca contra o banco. Não é que o ramo estado falte no
repositório: ele falta **na Ficha**, que não usou o módulo que já o tinha.

| Decisão do DT-01, 2026-08-07 |
|---|
| O **§11.4 vincula o Item 1.8**: ele só se encerra quando a árvore **aplicável** puder ser reconstruída de forma coerente |
| `c3242ea` é **BASE TÉCNICA VÁLIDA — 1.8 CONCLUÍDO PARCIALMENTE**, preservado integralmente |
| Abre-se o **`1.8-R1`**, regido por [`CONTRATO_1_8_R1.md`](CONTRATO_1_8_R1.md) |
| **Uma migration é autorizada**, exclusivamente para o vínculo `professional_subcriterion_map → practice_evidence` (versão exata). Não antecipa `2.C`, não cria proposta do lado profissional |
| **Cadeia única**: existe uma só modelagem de proveniência — `CadeiaDeProveniencia`. `OrigemDoConceito` desaparece |
| `c3242ea` **não é ligado a nenhuma superfície de produção**; a Fronteira Humana não abre antes do `1.8-R1` verificado |

#### Encerramento do Item 1.8 — DT-01, 2026-08-07

> **ITEM 1.8 — ENCERRADO.** Composição técnica: `c3242ea` (base) → `041b423`
> (1.8-R1) → `095054e` (1.8-R1-MR1). Verificação independente final **sem
> ressalvas**. As seis decisões do §22 do Contrato estão **encerradas e não se
> reabrem**: proposta como ato histórico · validade histórica ≠ estado corrente ·
> recusa de `NULL` na mudança de status de linha vinculada · compatibilidade do
> legado · concorrência certificada · Ficha fora de `INERTES_AUTORIZADOS`.

**Critério de saída da Onda 1:** as **dez dependências do §15.0** existem e são testadas ·
a paciente já lê o que o Motor concluiu · nenhum invariante do Motor é mais promessa sem guarda.

## 3. Onda 2 — A virada do eixo (cada item exige ADR)

> ### ONDA 2 — FORMALMENTE ENCERRADA · 2026-08-08
>
> Decisão do **Guardião da CURADORIA 2.0** sobre o dossiê
> [`DOSSIE_DE_FECHAMENTO_ONDAS_1_E_2.md`](DOSSIE_DE_FECHAMENTO_ONDAS_1_E_2.md)
> (`34132aa`): **`ONDAS 1 E 2 — ENCERRAMENTO COM PENDÊNCIAS NÃO BLOQUEANTES`**.
>
> **Composição:** 2.1 · série 2.2 (A/MR1/B/B-R1/C/C-R1) · 2.3 · 2.4 · 2.6 · 2.C —
> **todos formalmente encerrados**. **2.5 permanece PROIBIDO POR ADR** enquanto
> DP-5 estiver aberta (§5.4.0) — a onda fecha sem ele, como o §15 previu.
> **Pacote funcional obrigatório restante: NENHUM.**
>
> **Fronteira Humana: ABERTA NO RECORTE AUTORIZADO DO 2.C** — um único
> `EXECUTE` de `decidir_proposta` com gate interno por alvo; `anon`, `PUBLIC`,
> policies e grants de tabela permanecem fechados; **o recorte não se amplia sem
> nova lavratura**.
>
> **Pendências: apenas não bloqueantes** — F-2.3-1 · F-2.4-1 · F-2.6-1 · F-2.C-1,
> e a baixa recognitiva dos F-REC pelo Certificador (paralela).
> **H-T-01 aprovada (Opção C — guarda de regime)** como **missão futura
> separada**: não bloqueia o fechamento, não bloqueia a primeira regra material,
> não reabre pacote certificado; a lista nominal cresce **só por lavratura**, e
> as quatro higienes serão **consumidas por ela, nunca apagadas**.
>
> **Operação/observação: APTA CONDICIONALMENTE** — a condição única é a
> **primeira regra material `VIGENTE`**, lavrada pela **Autoridade de Método
> (DT-01)** pelo ciclo da ADR-069, seguida do **primeiro ato real**. **Não há
> bloqueio material de engenharia restante.**
>
> *(Registro histórico — a abertura formal da onda, lavrada no mesmo dia:)*
>
> ### ONDA 2 FORMALMENTE ABERTA — 2026-08-08
>
> Entrada autorizada pelo **Guardião** (condicionada apenas às lavraturas, todas
> cumpridas) e registrada após o fechamento formal da Onda 1. **A entrada não é
> abertura da Fronteira Humana** — são atos distintos.
>
> **O que a entrada destrava** — passam a poder receber **pré-voo próprio**
> (nenhum se torna implementável automaticamente): **2.3** · **2.4** · a
> **releitura do 2.6**, agora **carregando o Item 1.2** (G-10/RLS).
>
> **O que permanece como está:** **2.5 PROIBIDO** enquanto DP-5 estiver aberta ·
> **2.C BLOQUEADO** (2.6 + gates próprios + abertura própria da Fronteira) ·
> **Fronteira Humana FECHADA** — grants da capability decisora do 1.12 = **zero**;
> O2-A/B pertencem ao pacote futuro de abertura · **R-1/CD-1 preservado**:
> nenhum valor da ponte estabiliza antes de Cases reais — a abertura formal da
> onda não autoriza estabilização antecipada.

**Entrada:** Onda 1 integralmente verde · ADRs aprovadas · Autoridade ativa · DP-1 respondido.
**Rollback mestre da onda:** suspender a regra devolve o sistema ao regime de declaração
direta **sem perder dado** — confirmações feitas permanecem válidas, propostas param de nascer.

| Código | Nome | Objetivo | Dep. | Aceite | Estado | Resp. | Rollback | Era |
|---|---|---|---|---|---|---|---|---|
| **2.1** | `derivation_proposals` append-only | Materializar a Camada de Derivação | **ADR-A**, todas as dez do §15.0 | A3 verde; falta de proveniência ⇒ não persiste | **CONCLUÍDO COMO ESTRUTURA INERTE** (`1ed29f8`) — corrigido em 2026-08-07: a estrutura nasceu inerte (RLS sem policy, zero grants); o escritor único veio no 2.2C (`b38cd34`) e a leitura controlada no 1.8-R1 (Contrato §21). **Consumo pelo Pipeline de Leitura continua proibido (A2)** | Implementador | migration aditiva reversível | (parte de L-21) |
| **2.2** | Ponte grau→importância — **forma e governança**, valores provisórios | Proposta de importância nos ~17 conceitos com lado da pessoa | **ADR-A**, 0.3, 2.1 | A1, A2 verdes; reabertura de I-10 declarada (§10.3.0); teste `importancia-vs-grau.test.ts` protegido até a ADR-A | **PARTICIONADO** — ver §3.1 | Implementador | flag; classificação manual permanece o caminho padrão | L-30 + L-31 |
| **2.3** | Divisão da etapa AVALIAÇÃO | 3 critérios do lado da pessoa passam a vir do Motor | **ADR-067** (ex-"ADR-B") · 1.4 ✓ · **2.4 (dependência MATERIAL — os juízos H8–H11 têm `curator_judgments` como destino; CONTRATO_2_4 §18)** | X1 verde; FORMACAO/EXPERIENCIA/HISTORICO permanecem humanos | **FORMALMENTE ENCERRADO** (2026-08-08) — contrato aprovado (PA-16, **RS-2.3-1 incorporada**: retirada exige Curador do Case **e** autor da versão vigente); implementação `8305d97` (H8–H10 sempre exigidos, H11 condicionado ao grau; regime legado 6×N preservado, zero backfill; capabilities gate-first com autoria por `auth.uid()`; trigger **JS3** — evidência nova supersede, zero carry-forward, etapa volta a `AGUARDA_JUIZO_DO_CURADOR`); verificação independente do Agente 04 **APROVADO COM RESSALVA** (30/30, concorrência real em 6 cenários, 13 famílias de mutação mordidas, rollback com resíduo zero); certificação do Agente 05 concluída; **F-2.3-1 = higiene não bloqueante** (classe de F-2.4-1/F-2.6-1); **Obs-1 corrigida por este registro:** o rollback completo do 2.3 é o drop das **quatro** functions — `registrar_julgamento`, `retirar_julgamento`, `ler_julgamentos_para_avaliacao` **e o comparador `julgamento_tem_mesmo_conteudo`** — mais o trigger JS3 e sua function (o cabeçalho da migration lavrada enumera "três" e permanece como artefato histórico; o rollback foi executado completo, com resíduo zero, pelo Agente 04); Obs-2: corridas retirada→sucessora e JS3→ato compõem em cadeia serializada válida; 2.C segue bloqueado; Fronteira fechada — [`CONTRATO_2_3_DIVISAO_DA_AVALIACAO.md`](CONTRATO_2_3_DIVISAO_DA_AVALIACAO.md) | Implementador | flag restaura 6×N | L-40 + L-41 |
| **2.4** | `curator_judgments` **sem `AREA`** | Registrar juízo humano onde não há célula | **ADR-067** (ex-"ADR-B"), 2.1 | Append-only; `AREA` ausente (RS-03) | **FORMALMENTE ENCERRADO** (2026-08-08) — contrato aprovado (PA-15, ressalva evidência×julgamento incorporada); implementação `2f6ec05` (entidade inerte: duas naturezas, seis conceitos por CHECK, três estados, append-only, um `VIGENTE` por alvo); verificação independente do Agente 04 **APROVADO COM RESSALVA** (30/30 perguntas, concorrência real, rollback e reaplicação); certificação do Agente 05 concluída; **F-2.4-1 = higiene não bloqueante** (guarda estática varre a migration lavrada, não redefinições futuras — mesma classe de F-2.6-1; a camada viva de integração pina a estrutura aplicada e fecha o vão); **nascimento inerte** (RLS sem policy, zero grant, writer é do 2.3); 2.C segue bloqueado; Fronteira fechada — [`CONTRATO_2_4_CURATOR_JUDGMENTS.md`](CONTRATO_2_4_CURATOR_JUDGMENTS.md) | Implementador | migration aditiva | **novo** |
| **2.5** | ~~Regime de confirmação em bloco~~ | — | **DP-5** | **AC-BLOCO:** nenhum mecanismo no repositório, **nem atrás de feature flag** | **PROIBIDO** até DP-5 por ADR (§5.4.0) | — | n/a | (não existia) |
| **2.6** | Governança de quem confirma o Mapa do Profissional | Corrigir G4/RI4 | **ADR-068** (ex-"ADR-D"; toca ADR-040 item 6) | RLS não enfraquece; teste de permissão por papel | **FORMALMENTE ENCERRADO** (2026-08-08) — implementação `01f45dc` (G-10 = Opção B: capability `nome_do_curador_do_caso` + guardas do Mapa), certificação concluída; **F-2.6-1 = higiene não bloqueante**; Item 1.2 resolvido por dentro; 2.C segue bloqueado; Fronteira fechada; ver [`CONTRATO_2_6_RELEITURA_DE_ESCOPO.md`](CONTRATO_2_6_RELEITURA_DE_ESCOPO.md); decisão principal: G-10 (A×B×C, recomendação B) | Implementador + Guardião | restaurar permissão anterior | L-23 |
| **2.C** | Persistência e apresentação da derivação do Mapa do Profissional — **confirmação item a item** | Ligar 1.A ao mundo real | 1.A, 2.1, 2.6, **todas as dez do §15.0** | Fronteira Humana com os nove elementos (A2c); ausência de ato nunca confirma (A2d) | **FORMALMENTE ENCERRADO** (2026-08-08) — gates 10/10 ([`AUDITORIA_GATES_2C.md`](AUDITORIA_GATES_2C.md)); contrato aprovado (PA-17, **RS-2.C-1** incorporada — C-01d evolui para **cinco** nomes com o nascimento do emissor profissional); implementação `42bca9b` (**8 novos + 13 alterados**); verificação independente do Agente 04 **APROVADO COM RESSALVA** (32/32, concorrência real, rollback com fatos humanos preservados); certificação do Agente 05 concluída. **FRONTEIRA ABERTA NO RECORTE AUTORIZADO DO 2.C** — o pacote abriu **um único novo `EXECUTE`**: `curadoria.decidir_proposta(uuid,text,text)` para **`authenticated`**, com gate interno por alvo (`anon` = false · `PUBLIC` = false · `service_role` = false); **zero grant novo de tabela criado pelo 2.C na camada de derivação/juízo** — os grants de `professional_subcriterion_map` são **históricos do regime ADR-040**, não criados nem ampliados aqui, e seguem governados pelas policies pré-existentes. Continua **fechado**: `anon`, `PUBLIC`, `service_role`, grants adicionais, policies novas, valores da ponte, regime de bloco, paciente, 2.5 e qualquer abertura lateral. **A2c** (nove elementos antes do ato) e **A2d** (decurso/navegação/fim de sessão não decidem) satisfeitos; **O2-A/O2-B** = aceites bloqueantes implementados e verificados (interações e proeminência equivalentes, recusa não escondida, motivo simétrico/opcional); ato **item a item** (um `proposal_id` por ato) com **DP-5 intacta** — 2.5 permanece **proibido por ADR**; gate do alvo profissional é `administrador` por sessão, sem parâmetro de ator, e quem julgou aquele profissional **não** confirma seu estado (§13.2, provado no banco); confirmação grava `status + evidence_id` **atomicamente**; **CD-1 preservada** (zero regra material semeada, `derivation_rule_degree_map` vazia, lado Case vazio por construção); **R-1 instrumentada e mitigada, não resolvida — discordância zero sustentada é alarme, não sucesso**; **F-2.C-1 = higiene não bloqueante**; rollback fecha a porta **sem apagar fatos humanos** (propostas, atos, confirmações, recusas, Mapa e `evidence_id` preservados; 1.12 e 2.3/2.4/2.6 intactos) — [`CONTRATO_2_C_FRONTEIRA_DO_MAPA_DO_PROFISSIONAL.md`](CONTRATO_2_C_FRONTEIRA_DO_MAPA_DO_PROFISSIONAL.md) | Implementador | flag desliga a superfície; preenchimento manual permanece | L-21 + L-22 |

### 3.1 Partição do Item 2.2 — ratificada pelo DT-01 em 2026-08-05

O Item 2.2 foi executado em subpacotes que **não estavam registrados neste mapa**
— dívida de processo apontada no Dossiê de pré-voo e agora quitada. **A partição
é ratificada; nenhum escopo foi acrescentado ou retirado do 2.2 original.**

| Subitem | Objeto | Estado | Commit |
|---|---|---|---|
| **2.2A** | Estrutura da Regra de Derivação | **CONCLUÍDO** | `30c6809` |
| **2.2A-MR1** | Endurecimento dos invariantes | **CONCLUÍDO COM RESSALVAS REGISTRADAS** | `7770d7f` |
| **2.2B** | Ciclo de vida das Regras de Derivação | **CONCLUÍDO COM RESSALVAS REGISTRADAS** | `1a7ef86` |
| **2.2C** | **Ponte grau → importância** | **ENCERRADO** — o bloqueio de uso operacional era condicionado ao 2.2C-R1 e **foi levantado em 2026-08-07**, quando essa condição se cumpriu (ver §3.3) | `b38cd34` |
| **2.2B-R1** | Endurecimento pós-verificação (pacote corretivo) | **CONCLUÍDO E VERIFICADO** — implementação concluída, verificação independente concluída, **sem ressalvas bloqueadoras**, efeito técnico vigente na base | `72e0a2b` |
| **2.2C-R1** | **Participação do motor e unicidade por conceito** | **CONCLUÍDO E VERIFICADO** — implementação concluída, verificação independente concluída, **encerrado formalmente pelo DT-01 em 2026-08-07** (ver §3.3) | `36dde31` |

#### Ressalvas registradas no encerramento do 2.2B

Encerrado pelo DT-01 em 2026-08-05, **com ressalvas que não impedem o
encerramento** e que **serão corrigidas antes do 2.2C**:

| # | Ressalva | Destino |
|---|---|---|
| **1** | `PUBLIC` mantém `EXECUTE` nas duas funções de leitura (`derivation_rule_state`, `derivation_rule_current_version`) | **2.2B-R1** |
| **2** | A garantia do MR1.2 depende do **conjunto** trigger de cadeia **+** índice único parcial — não do índice isolado | **2.2B-R1** (documental) e §3.2 |
| **3** | A ADR-069 contém **erro aritmético** na quantidade de transições | **emenda lavrada** — ADR-069 §21 |
| **4** | Dívida de **prova comportamental completa** sobre proposta histórica após revogação | registrada; fora do 2.2B-R1 |
| **5** | A Autoridade de Método estava **vaga** até esta decisão | **DP-4 fechada** — Registro de Governança §1.1 |

**O item não é reaberto.**

#### 2.2B-R1 — escopo fechado

| Entra | Não entra |
|---|---|
| `REVOKE EXECUTE FROM PUBLIC` nas duas funções de leitura | mudança de domínio |
| teste de grants | escritor |
| confirmação de `SECURITY INVOKER` | pipeline |
| preservação de **zero policies e zero grants de aplicação** | qualquer emissão |
| documentação precisa do conjunto **trigger + índice** | alteração do grafo de estados |

> **O 2.2C só pode ser aberto após a verificação independente do 2.2B-R1.**
> **Condição satisfeita em `72e0a2b`** — implementado e verificado sem ressalvas.

#### 2.2C — contrato canônico

| Campo | Conteúdo |
|---|---|
| **Nome** | **Ponte grau → importância** |
| **Objetivo** | Produzir propostas de importância para os conceitos que possuem lado da pessoa, utilizando **regra versionada, vigente e rastreável** |
| **Dependências** | ADR-066 · ADR-069 · 0.3 ✅ · 2.1 ✅ · 2.2A ✅ · 2.2A-MR1 ✅ · 2.2B ✅ · **DP-4 fechada** ✅ · **pacote corretivo 2.2B-R1 implementado e verificado** ✅ (`72e0a2b`) |
| **Escopo** | correspondência versionada grau↔importância · primeira versão da regra em condição **`PROVISÓRIA`** · emissão conforme **DR1–DR5** · referência à **versão exata** da regra · **ausência de emissão sob regra não vigente** · preservação da classificação manual · preservação do Pipeline de Leitura |
| **Fora de escopo** | Fronteira Humana · confirmação pelo Curador · interface · painel · métricas · observabilidade · valores definitivos · Item 2.C |
| **Aceite mínimo** | regra vigente emite · `PROPOSTA`/`SUSPENSA`/`REVOGADA` **não** emitem · proposta referencia `(rule_id, version)` · proposta **não** alcança o Pipeline de Leitura · suspensão impede novas emissões · reativação permite novas · propostas históricas permanecem · **um único escritor** · rollback não elimina proposta nem declaração manual · **A1 e A2 permanecem verdes** |
| **Estado** | **PLANEJADO — AGUARDA PACOTE CORRETIVO E AUTORIZAÇÃO DE ABERTURA** |

### 3.2 Precisão do contrato MR1.2 — como a garantia é produzida

Registro exigido pela ressalva 2 do encerramento do 2.2B. **Não altera a decisão
arquitetural da ADR-069.**

> **A garantia do MR1.2 reinterpretado é produzida pelo conjunto formado pelo
> trigger de cadeia e pelo índice único parcial.**

| Componente | Papel |
|---|---|
| **Trigger de cadeia** | valida a **continuidade** · valida a **sequência** · valida o **ordinal de vigência** |
| **Índice único parcial** | **arbitra colisões** · **protege a concorrência** · impede duas entradas com a mesma chave de período de vigência |

**Não é correto afirmar que o índice, isoladamente, prova todo o invariante.** Ele
arbitra; quem valida a cadeia é o trigger. Descrever apenas um dos dois deixaria
metade do invariante sem guarda declarada.

### 3.3 Item 2.2C — encerramento e pacote corretivo 2.2C-R1

**Decisão do DT-01 em 2026-08-05**, sobre o commit verificado `b38cd34`.

#### Estado do 2.2C

> **2.2C ENCERRADO.** O bloqueio de uso operacional lavrado em 2026-08-05 era
> **condicionado à implementação e verificação do 2.2C-R1**. Essa condição
> **cumpriu-se**, e o bloqueio **foi levantado pelo DT-01 em 2026-08-07**.

**Aprovados:** estrutura · emissor · **A2** · proveniência · concorrência ·
rollback. **O item não é reaberto.**

**O levantamento não autoriza nada por si.** Materializar a primeira regra real ·
iniciar a Fronteira Humana · iniciar `2.C` · iniciar `2.3` **continuam não
autorizados**, agora por suas **próprias** dependências registradas neste mapa
(`2.C` e `2.3` seguem `BLOQUEADO` nas tabelas da Onda 2), e não mais por
pendência do 2.2C-R1.

| Ressalva | Achado | Destino |
|---|---|---|
| **F-1** | Conceito `MOTOR_PARTICIPATION = NUNCA` recebe correspondência e emite; a fonte vive em `Record` TypeScript, e a guarda detecta em teste, não em execução | **2.2C-R1** · emenda **ADR-066 §23.1** |
| **F-2** | Duas regras vigentes podem cobrir o mesmo conceito; o emissor arbitra por `order by rule_id` | **2.2C-R1** · emenda **ADR-066 §23.2** (oitava condição do §16) |
| **F-3** | `SEM_CORRESPONDENCIA` é inalcançável — a cobertura total dos quatro graus o impede | **2.2C-R1** (documental) · emenda **ADR-066 §23.3** |

#### 2.2C-R1 — Participação do motor e unicidade por conceito

| Campo | Conteúdo |
|---|---|
| **Identificador** | **2.2C-R1** |
| **Nome** | Participação do motor e unicidade por conceito |
| **Estado** | **CONCLUÍDO E VERIFICADO** — implementação em `36dde31`; verificação independente concluída; **encerrado formalmente pelo DT-01 em 2026-08-07** |
| **Objetivo** | materializar a participação do motor no Catálogo · impedir correspondência e emissão para conceitos `NUNCA` · garantir uma única regra vigente por conceito · declarar corretamente o contrato de `SEM_CORRESPONDENCIA` |
| **Dependências** | ADR-047 ✅ · **ADR-066 emendada** ✅ · ADR-069 ✅ · Item 2.2C verificado ✅ · **Item 2.2B-R1 verificado** ✅ (`72e0a2b`) · **ausência de regra real materializada** ✅ — **todas satisfeitas** |

**Escopo**

acrescentar `MOTOR_PARTICIPATION` ao Catálogo materializado · regenerar o
contrato TypeScript · **eliminar o `Record` manual equivalente** · impedir
correspondência para conceito `NUNCA` · impedir emissão para conceito `NUNCA` ·
garantir unicidade vigente por conceito · garantir a unicidade **na promoção e
reativação** · garantir a unicidade **na escrita de correspondência para regra
vigente** · **remover a arbitragem por `order by rule_id`** · documentar
`SEM_CORRESPONDENCIA` como reserva · testes, mutações, concorrência e rollback.

**Fora de escopo**

materializar regra real · definir valores definitivos · Fronteira Humana ·
confirmação · interface · painel · métricas · observabilidade · `2.C` · `2.3` ·
vínculo técnico da Autoridade de Método.

**Aceite mínimo — catorze critérios**

| # | Critério |
|---|---|
| 1 | O Catálogo é a **única fonte** de `MOTOR_PARTICIPATION` |
| 2 | O `Record` TypeScript manual **deixa de existir** |
| 3 | Conceito `NUNCA` **não aceita correspondência** |
| 4 | Conceito `NUNCA` **não emite** |
| 5 | **Escrita privilegiada não contorna** a proteção |
| 6 | Duas regras vigentes para o mesmo conceito são **recusadas** |
| 7 | Duas promoções concorrentes resultam em **apenas uma** cobertura vigente |
| 8 | **Reativação é recusada** quando o conceito foi assumido |
| 9 | Correspondência adicionada a regra vigente é **recusada** quando há outra dona |
| 10 | Uma regra **continua podendo cobrir vários conceitos** |
| 11 | **MR1.1, MR1.2 e MR1.3 permanecem verdes** |
| 12 | **A2 permanece verde** |
| 13 | `SEM_CORRESPONDENCIA` é **declarado não operacional** |
| 14 | **Rollback não apaga propostas nem declarações históricas** |

> **A janela é agora:** **nenhuma regra real existe**. Corrigir antes da primeira
> regra custa migration aditiva; depois, custaria migração de dados sobre
> proveniência append-only.

#### Estado do 2.2C-R1 — correção documental de 2026-08-05 *(registro histórico — superado pelo §3.4)*

> **2.2C-R1 AUTORIZADO PARA IMPLEMENTAÇÃO.** *(estado de 2026-08-05; o estado
> vigente é **CONCLUÍDO E VERIFICADO** — ver §3.4)*

O Agente 01 **interrompeu corretamente** a implementação: o mapa ainda afirmava
que o `2.2B-R1` estava pendente, quando ele já fora implementado e verificado em
`72e0a2b`. **A interrupção foi acerto de processo — a regra 1 do Processo de
Engenharia funcionando.** A divergência era documental; foi corrigida aqui.

| Confirmação | Estado |
|---|---|
| Arquitetura aprovada | ✅ |
| **ADR-066 emendada** (§23: F-1, F-2, F-3) | ✅ |
| **2.2B-R1 implementado e verificado** (`72e0a2b`) | ✅ |
| **2.2C encerrado** — uso operacional então bloqueado até o 2.2C-R1 *(condição cumprida e bloqueio levantado em 2026-08-07 — §3.4)* | ✅ |
| **Primeira regra real** | ❌ **ainda proibida** |
| **Fronteira Humana** | ❌ **ainda proibida** |
| **`2.C` e `2.3`** | ❌ **ainda fechados** |

**O 2.2C-R1 não está iniciado.** Nenhuma linha técnica foi produzida.
*(Verdadeiro em 2026-08-05. Superado em 2026-08-07: ver §3.4.)*

### 3.4 Encerramento documental do bloco 2.2 — DT-01, 2026-08-07

Decisão do DT-01 sobre a base `593d61d`. **Encerramento documental**: nenhuma
decisão de domínio é criada, alterada ou revogada aqui.

#### Estado final do bloco

| Subitem | Estado final | Commit |
|---|---|---|
| **2.2A** | CONCLUÍDO | `30c6809` |
| **2.2A-MR1** | CONCLUÍDO COM RESSALVAS REGISTRADAS | `7770d7f` |
| **2.2B** | CONCLUÍDO COM RESSALVAS REGISTRADAS | `1a7ef86` |
| **2.2C** | ENCERRADO — bloqueio operacional **levantado** (condição cumprida) | `b38cd34` |
| **2.2B-R1** | CONCLUÍDO E VERIFICADO | `72e0a2b` |
| **2.2C-R1** | **CONCLUÍDO E VERIFICADO** — encerrado formalmente nesta decisão | `36dde31` |

#### Estado do Item 2.2

> **ITEM 2.2 — CONCLUÍDO COM DÍVIDAS NÃO BLOQUEADORAS.**

As dívidas são as **ressalvas já registradas** no encerramento do 2.2A-MR1 e do
2.2B, mantidas neste documento em seus lugares de origem. Elas **não bloqueiam**
nenhum pacote seguinte e **não reabrem** nenhum subitem.

#### Correções de certificação — não são subpacotes do 2.2

Registradas aqui apenas para rastreabilidade. **Classificação: manutenção /
correção de certificação.** Nenhuma delas altera produto, domínio ou invariante,
e **nenhuma origina item novo**.

| Commit | Objeto | Natureza |
|---|---|---|
| `490e4b6` | Oráculo do `mapa-prioridades` atualizado após o PP-02 | Correção de certificação |
| `593d61d` | Fixture determinística do `relatorio-assistido` | Correção de certificação |

#### Próximo pacote

| Campo | Conteúdo |
|---|---|
| **Recomendado** | **Item 1.8 — Ficha de Explicação** |
| **Estado** | **PRONTO PARA AUTORIZAÇÃO PELO DT-01** — não autorizado, não iniciado |
| **Por que** | não exige migration, não exige decisão de domínio nova, e destrava 1.9, 1.10, 1.11 e 1.12 |

Nenhum pacote posterior ao bloco 2.2 passa a `EM EXECUÇÃO` por força desta
decisão.

## 4. Ondas 3, 4 e 5

| Código | Nome | Objetivo | Dep. | Aceite | Estado | Resp. | Rollback | Era |
|---|---|---|---|---|---|---|---|---|
| **3.1** | Modelo único de progresso + projeções | Um relógio (R6/P4) | Onda 1; **DP-8** | O4: nenhuma projeção é escrita diretamente | BLOQUEADO | Implementador | manter coluna antiga em paralelo por uma janela | K-60 |
| **3.2** | Responsável derivado por fato | Fim de RI6 | 3.1 | A paciente nunca vê responsável divergente | BLOQUEADO | Implementador | idem 3.1 | C-15 |
| **3.3** | Protocolo Único da Pessoa | Uma pessoa, um instrumento (R4/D7) | Onda 1 | Nada se perde; nenhum briefing antigo reinterpretado | BLOQUEADO | Fundador + Implementador | flag por instrumento | K-63 (parte) |
| **3.4** | Instrumento único do profissional | R5 | Onda 1 | idem | BLOQUEADO | Fundador + Implementador | idem | K-63 (parte) |
| **3.5** | Fonte única da decisão da paciente | R9 | Onda 1 | Um registro só; histórico preservado | BLOQUEADO | Implementador | migration aditiva | **novo** |
| **3.6** | Reescrita de `MODELO_CURADORIA_V1.md` §7 e `PRODUCT_ARCHITECTURE.md` | P17/P18/RI9 | ondas publicadas | Zero divergência conhecida entre código e documento | BLOQUEADO | Arquiteto | reverter | K-62 |
| **4** | Refinamento | Mesma informação, melhor apresentada | Ondas 1–3 | **Não pode** introduzir explicação nova nem ordenação indireta | BLOQUEADO | Implementador | trivial (apresentação) | — |
| **5** | Calibração por operação real | Fixar valores (DP-6), dimensionar juízo relacional | **Rede real + Cases reais** | Nenhuma calibração por hipótese | **BLOQUEADO — Rede real inexistente** | Fundador + Método | n/a | F-70 |

**Sequenciamento (Arquitetura §15):**
`Onda 0 → Onda 1 → { Onda 2 → Onda 4 → Onda 5 ; Onda 3 (independente da Onda 2) }`

## 5. Reconciliação com o Plano Executivo anterior

O [`PLANO_EXECUTIVO_CURADORIA_2_0.md`](PLANO_EXECUTIVO_CURADORIA_2_0.md) foi escrito **antes**
de a Arquitetura estar disponível na árvore. Onde os dois divergem, **vence a Arquitetura**
(Registro de Governança §2). Divergências materiais:

| # | Item do Plano | Situação na Arquitetura | Efeito |
|---|---|---|---|
| **RC-1** | **F-07 + L-43** — ADR e implementação da chave de ordenação interna | **ADR-C retirada do caminho** (bloqueador B2): ordenar por prontidão é ranking por construção; fica a **ordem neutra da Rede** | **RETIRADOS.** A pendência §11 do Modelo permanece **aberta por decisão**, não por esquecimento |
| **RC-2** | **C-17** — propor filtro obrigatório a partir de grau `ESSENCIAL` | **Corrigido (RS-07/§5.5):** o sistema **sinaliza para discussão**; nunca propõe filtro pronto. Filtros são declarados **item a item**, nunca em bloco, nunca derivados | **REESCRITO.** Deixa de ser pacote de derivação e vira sinalização, dentro da Onda 1/3 conforme a ADR-A definir |
| **RC-3** | Critério de sucesso **"menos de 20 atos"** | **Abandonado (§3.6):** contagem de atos é a métrica errada — foi ela que tornou a confirmação em bloco atraente. A métrica é a **natureza** dos atos | **SUBSTITUÍDO.** Alvo: **zero atos de transcrição**; o total é consequência |
| **RC-4** | Sprint 3 colocava **L-21 (persistência da derivação)** antes da explicabilidade e do painel de discordância | **§15.0 proíbe:** nenhuma derivação persistida ou consumida antes das **dez** dependências | **RESSEQUENCIADO.** 1.A (puro, inerte) na Onda 1; persistência só em 2.C |
| **RC-5** | **L-32** (Perfil refletir o que ela declarou) posicionado depois da ponte | **Antecipado** para a Onda 1 (item 1.10, reconhecimento em duas colunas) | **ANTECIPADO** |
| **RC-6** | Cinco pacotes de base de auditabilidade **não existiam** no Plano | Arquitetura 1.8–1.12 | **ADICIONADOS** |
| **RC-7** | **C-16** (abertura automática do Case) | §5.1 item 5 marca **AUTOMATIZA**, mas o item **não aparece em nenhuma onda do §15** | **PENDÊNCIA PD-01** — sem onda atribuída |
| **RC-8** | Estimativas em dias e sprints do Plano | A Arquitetura não estima prazo | **Mantidas como referência do Implementador**, não como compromisso |

## 6. Contagem

| Onda | Pacotes | Bloqueados | Planejados | Em execução | Proibidos/Retirados |
|---|---|---|---|---|---|
| 0 | 6 | 5 | 0 | **1** (0.6) | 0 |
| 1 | 12 | 3 | 9 | 0 | 0 |
| 2 | 7 | 6 | 0 | 0 | 1 (2.5) |
| 3 | 6 | 6 | 0 | 0 | 0 |
| 4 e 5 | 2 | 2 | 0 | 0 | 0 |
| **Total** | **33** | **22** | **9** | **1** | **1** |

Mais **2 pacotes retirados** do plano anterior (RC-1) e **1 reescrito** (RC-2).
