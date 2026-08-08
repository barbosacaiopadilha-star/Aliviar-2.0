# Índice da Curadoria 2.0 — documento mestre

| Campo | Valor |
|---|---|
| **Versão** | v1.0 |
| **Autor** | Agente 03 — Implementador (pacote F-00) |
| **Data** | 2026-08-04 |
| **Status** | **Vigente** — índice operacional, nível **derivado** (não canônico) |
| **Dependências** | nenhuma; é o ponto de entrada |
| **Documentos relacionados** | todos os listados abaixo |
| **Origem** | Pacote F-00 — Regularização da Governança da Curadoria 2.0 |

> **Regra de uso:** este é o **único ponto de entrada** da Curadoria 2.0. Nenhuma referência
> da 2.0 depende de histórico de conversa: tudo o que tem autoridade está listado aqui, com
> caminho de arquivo. O que não está listado aqui **não tem autoridade sobre a 2.0**.
>
> **Regra de precedência:** onde dois documentos divergirem, vale a ordem do
> [`REGISTRO_DE_GOVERNANCA.md`](REGISTRO_DE_GOVERNANCA.md) §2.

---

## 1. Autoridade — o que decide

| # | Documento | Nível | Status | Papel na 2.0 |
|---|---|---|---|---|
| 1 | [`MODELO_CURADORIA_V1.md`](MODELO_CURADORIA_V1.md) v2.0 | **Canônico** | Vigente | Canônico do domínio da Curadoria. **A 2.0 é subordinada a ele.** §7.1–§7.4 e §11 serão atualizados pela ADR-B |
| 2 | [`../DECISIONS.md`](../DECISIONS.md) (ADR-001..**ADR-069**) | **Canônico** | Vigente | Log de decisões. **ADR-066 (=A), ADR-067 (=B) e ADR-068 (=D) lavradas em 2026-08-04**; ADR-C retirada; **ADR-069 lavrada em 2026-08-05**; ADR-E ainda não escrita |
| 2a | [`ADR_A_PROPOSTAS_DE_DERIVACAO.md`](ADR_A_PROPOSTAS_DE_DERIVACAO.md) | **Canônico** (anexo da ADR-066) | Vigente — **emendado em 2026-08-05** (§23: F-1, F-2, F-3) | Domínio fechado de `derivation_proposals`: cinco estados, doze itens de proveniência, **oito** condições da ponte (a oitava: uma regra vigente por conceito). Participação do motor passa ao Catálogo; `SEM_CORRESPONDENCIA` é reserva não operacional |
| 2b | [`ADR_B_JUIZO_HUMANO.md`](ADR_B_JUIZO_HUMANO.md) | **Canônico** (anexo da ADR-067) | Vigente | Domínio fechado de `curator_judgments`: duas naturezas, seis conceitos, três estados |
| 2c | [`ADR_D_AUTORIDADE_DE_CONFIRMACAO.md`](ADR_D_AUTORIDADE_DE_CONFIRMACAO.md) | **Canônico** (anexo da ADR-068) | Vigente | Quem confirma, quem declara; RLS da ADR-040 item 6 **não reaberta** |
| 2d | [`ADR_069_CICLO_DE_VIDA_DAS_REGRAS.md`](ADR_069_CICLO_DE_VIDA_DAS_REGRAS.md) | **Canônico** (anexo da ADR-069) | **Vigente — aprovada pelo DT-01 em 2026-08-05**, com emendas de 2026-08-05 (§21 aritmética, §22 MR1.2) | Ciclo de vida da Regra de Derivação: versão é fato, transição é ato, estado é leitura derivada. **Sete arcos permitidos**, `REVOGADA` terminal, freio assimétrico do Curador, MR1.2 reinterpretado e garantido por trigger de cadeia + índice parcial |
| 2d | [`PARECER_CONSTITUCIONAL_DO_BLOCO_DE_DOMINIO.md`](PARECER_CONSTITUCIONAL_DO_BLOCO_DE_DOMINIO.md) | Derivado | Vigente | Parecer do Agente 00 sobre as três ADRs — responde em parte a DP-11 |
| 2e | [`METODO_ACOLHIMENTO_PREPARADO.md`](METODO_ACOLHIMENTO_PREPARADO.md) | **Canônico** (M-001) | Vigente — **portado de `8911c5e`** (branch documental) no Ato 1 do fechamento da Onda 1 | Decisão de Método: quando o Acolhimento está PREPARADO — dois ramos, predicado, monotonicidade. Desbloqueou o Item 1.5 |
| 2f | [`METODO_ACOLHIMENTO_REGISTRO.md`](METODO_ACOLHIMENTO_REGISTRO.md) | **Canônico** (M-003) | Vigente — **portado de `8911c5e`** no mesmo ato | Caminho de registro da preparação: contrato da action, emenda sobre "a história do Case", recusa de payload vazio |
| 3 | [`CONGELAMENTO_ARQUITETURAL.md`](CONGELAMENTO_ARQUITETURAL.md) | **Canônico** | **CONGELADO** (2026-08-01) | O que a 2.0 promete não violar: 8 garantias, 12 invariantes, critérios de reabertura |
| 4 | [`DOMINIO_COMPATIBILIDADE_RELACIONAL.md`](DOMINIO_COMPATIBILIDADE_RELACIONAL.md) v1.0 | **Canônico** | Aprovado e congelado (ADR-065) | Precedente que a 2.0 generaliza aos 28 conceitos |
| 5 | [`../FUNDAMENTOS_DO_METODO_ALIVIAR.md`](../FUNDAMENTOS_DO_METODO_ALIVIAR.md) | Institucional | Proposto | Método; origem das decisões humanas irredutíveis |
| 6 | [`../DOCUMENTATION_GOVERNANCE_POLICY.md`](../DOCUMENTATION_GOVERNANCE_POLICY.md) | Governança | Vigente | Regras de nascimento, autoridade e morte de documento. §4: autoridade **não** é autodeclarada |

## 2. Arquitetura da 2.0

| # | Documento | Nível | Status | Papel |
|---|---|---|---|---|
| 7 | [`ARQUITETURA_CURADORIA_2_0.md`](ARQUITETURA_CURADORIA_2_0.md) **v1.2** | Candidato a canônico (seções DOMÍNIO/ARQUITETURA/GOVERNANÇA) | **Proposta revisada — aguardando revisão constitucional do Agente 00** | **Autoridade arquitetural da 2.0.** Dois pipelines, Fronteira Humana, 12 princípios, 5 ondas, DP-1..DP-11, ADR-A..ADR-E |
| 8 | [`CATALOGO_CANONICO_PROPOSTA.md`](CATALOGO_CANONICO_PROPOSTA.md) | Proposta de Método | Não aprovada (2026-07-31) | Fonte do catálogo de 28 conceitos |
| 9 | [`CATALOGO_CANONICO_OPERACAO.md`](CATALOGO_CANONICO_OPERACAO.md) | Proposta de Método | Não aprovada — mesmo status do anterior | Matriz, perguntas, relatório, governança, decisão |

## 3. Diagnóstico e estado

| # | Documento | Nível | Status | Papel |
|---|---|---|---|---|
| 10 | [`AUDITORIA_OPERACIONAL_PRE_CURADORIA_2_0.md`](AUDITORIA_OPERACIONAL_PRE_CURADORIA_2_0.md) | Derivado | **Datado** (2026-08-04, HEAD `97ed8b2`) | Diagnóstico: D1–D7, P1–P20, R1–R10, G1–G8, O1–O9, RI1–RI10 |
| 11 | [`../INVENTARIO_ESTADO_ATUAL_CONGELAMENTO.md`](../INVENTARIO_ESTADO_ATUAL_CONGELAMENTO.md) | Derivado | Datado | Estado da Etapa 1 |
| 12 | [`PLANO_RECONCILIACAO_LEDGER.md`](PLANO_RECONCILIACAO_LEDGER.md) | Derivado | **Pré-condição de publicação, não executado** | Deriva do ledger de produção |

## 4. Execução

| # | Documento | Nível | Status | Papel |
|---|---|---|---|---|
| 13 | [`MAPA_DOS_PACOTES.md`](MAPA_DOS_PACOTES.md) | Derivado | **Vigente — fonte única dos pacotes** | Todos os pacotes, código a código, com estado e responsável |
| 14 | [`ROADMAP_EXECUTIVO_CURADORIA_2_0.md`](ROADMAP_EXECUTIVO_CURADORIA_2_0.md) | Derivado | Vigente | Estado, fases, cronograma, dependências, histórico |
| 15 | [`REGISTRO_DE_GOVERNANCA.md`](REGISTRO_DE_GOVERNANCA.md) | Derivado | Vigente | Autoridades, decisões pendentes, ADRs pendentes, estado |
| 16 | [`REGISTRO_DOS_PARECERES.md`](REGISTRO_DOS_PARECERES.md) | Derivado | Vigente | Catálogo dos pareceres — sem resumo |
| 16b | [`REGISTRO_DAS_GUARDAS_2_0.md`](REGISTRO_DAS_GUARDAS_2_0.md) | Derivado | Vigente | **21 guardas executáveis + 1 caracterização** (pacotes F-01 e F-01A), achados F-01/01..03 |
| 16c | [`IMPEDIMENTO_F_02_MODELO_DE_DADOS.md`](IMPEDIMENTO_F_02_MODELO_DE_DADOS.md) | Derivado | **Impedimento aberto** | Por que a camada de dados da 2.0 não pode ser criada hoje, e as 8 decisões que a desbloqueiam |
| 16d | [`CONTRATO_1_8_R1.md`](CONTRATO_1_8_R1.md) | Derivado | **Cumprido — Item 1.8 encerrado em 2026-08-07** (`c3242ea` → `041b423` → `095054e`) | Registro histórico do contrato corretivo: §11.4 vincula o 1.8 · vínculo de evidência · cadeia única · leitor controlado (§21) · condições finais (§22) · encerramento (§22.11) |
| 16e | [`CONTRATO_1_11_PAINEL_DE_DISCORDANCIA.md`](CONTRATO_1_11_PAINEL_DE_DISCORDANCIA.md) | Derivado | **Vigente — lavrado pelo DT-01 em 2026-08-07** | Leitor agregado (`contar_propostas_por_desfecho`, zero args, cinco colunas) · taxa = RECUSADA/(CONFIRMADA+RECUSADA) por conceito × versão · anti-ranking por desenho · vazio honesto · C-01d com duas capabilities · 10 critérios de aceite do 1.11 |
| 16f | [`CONTRATO_1_12_MECANISMO_DE_DISCORDANCIA.md`](CONTRATO_1_12_MECANISMO_DE_DISCORDANCIA.md) | Derivado | **APROVADO — Guardião, 2026-08-08 (PA-12)**; implementação não iniciada | Mecanismo de discordância: tabela append-only de atos (`derivation_proposal_acts`) · capability única `decidir_proposta` com gate interno · confirmação atômica (ato + declaração no Mapa) · recusa = ato + lacuna · `ATO_JA_REGISTRADO` só para mesmo ator + mesma intenção (ressalva PA-12) · motivo legível só na Auditoria (§18, Opção 1) · O2-A..E · nasce inerte na Onda 1B |
| 16g | [`CONTRATO_1_A_FUNCAO_PURA_DERIVACAO_MAPA_PROFISSIONAL.md`](CONTRATO_1_A_FUNCAO_PURA_DERIVACAO_MAPA_PROFISSIONAL.md) | Derivado | **APROVADO — Guardião, 2026-08-08 (PA-13)**; **Item 1.A formalmente encerrado** — implementado, verificado e certificado (`c03cc26`, 2026-08-08) | Item 1.A: função pura total com quatro braços · v1 = mecânica completa, derivação vazia · **do vazio, nada se afirma** (propriedade permanente; monotonicidade forte só na v1) · `sem evidência → NAO_INFORMADO` (Arq. §10.4) **superado** — ausência ⇒ `LACUNA` · regra futura **por argumento já resolvido**, versão explícita · completude da entrada é do `2.C` · G-1..G-5 implementadas (`c03cc26`) · **nenhuma semântica material aprovada** |
| 16h | [`DOSSIE_FECHAMENTO_ONDA_1_ENTRADA_ONDA_2.md`](DOSSIE_FECHAMENTO_ONDA_1_ENTRADA_ONDA_2.md) | Derivado | **PROPOSTA (2026-08-08) — pronta para decisão de governança** | Fechamento da Onda 1: inventário 13 itens · dez condições do §15.0 **todas satisfeitas** · F-REC-1..3 reconstruídos (1.5/1.7 implementados com autoridade real, lastro noutro branch/não lavrado) · disposições D-1..D-5 · entrada da Onda 2 **não** abre a Fronteira |
| 17 | [`PLANO_EXECUTIVO_CURADORIA_2_0.md`](PLANO_EXECUTIVO_CURADORIA_2_0.md) | Derivado | **Superado em parte** pelo item 13 — ver §5 do Mapa dos Pacotes | Planejamento executivo do Implementador (33 pacotes F/C/L/K) |
| 18 | [`PLANO_DE_PACOTES_CURADORIA_2_0.md`](PLANO_DE_PACOTES_CURADORIA_2_0.md) | Derivado | **Histórico** — impedimento respondido pelo §18 da Arquitetura | Registro do impedimento e da primeira partição |
| 18b | [`PP_01_PREPARACAO_ONDA_1B.md`](PP_01_PREPARACAO_ONDA_1B.md) | Derivado | **Parecer emitido** — decisão **ONDA 1B PARCIALMENTE LIBERADA** — portado de `22cb0d3` no Ato 1 | Preparação da Onda 1B: os três bloqueios (dois reais, um inexistente), grafo corrigido, sequência ótima, ressalvas R-1 a R-5 |
| 18c | [`PROCESSO_DE_ENGENHARIA_2_0.md`](PROCESSO_DE_ENGENHARIA_2_0.md) | **Processo oficial** (DT-27) | Vigente — alterável só por decisão formal do DT-01 — portado de `22cb0d3` no Ato 1 | Como a engenharia da 2.0 trabalha: níveis, fluxo, Dossiê de Prontidão, interrupção, Capacidade Operacional, 8 regras permanentes |

## 5. Instrumentos oficiais

| # | Documento | Status |
|---|---|---|
| 19 | [`protocolos/PROTOCOLO_PESSOA.md`](protocolos/PROTOCOLO_PESSOA.md) | Instrumento oficial (P1–P16) |
| 20 | [`protocolos/PROTOCOLO_PRATICA_PROFISSIONAL.md`](protocolos/PROTOCOLO_PRATICA_PROFISSIONAL.md) | Instrumento oficial (Q1–Q28) |
| 21 | [`protocolos/GRAMATICA_DAS_PERGUNTAS.md`](protocolos/GRAMATICA_DAS_PERGUNTAS.md) | Instrumento oficial |
| 22 | [`protocolos/MAPA_DOS_PROTOCOLOS.md`](protocolos/MAPA_DOS_PROTOCOLOS.md) | Instrumento oficial |
| 23 | [`protocolos/MATRIZ_DE_COBERTURA.md`](protocolos/MATRIZ_DE_COBERTURA.md) | Prova de completude |

## 6. Documentos externos que a 2.0 lê, mas não governa

[`../PRODUCT_ARCHITECTURE.md`](../PRODUCT_ARCHITECTURE.md) (**vencido** — P18) ·
[`../CORRECAO_DOMINIO_PAPEIS_E_CASE.md`](../CORRECAO_DOMINIO_PAPEIS_E_CASE.md) (três níveis humanos) ·
[`../ONTOLOGIA_CURADORIA_COMPARTILHADA.md`](../ONTOLOGIA_CURADORIA_COMPARTILHADA.md) (Invariante 12) ·
[`../INDEX.md`](../INDEX.md) (índice geral de `docs/` — **registra apenas 1 dos 11 documentos desta pasta**; ver pendência PD-04).

---

## 7. Mapa de leitura por pergunta

| Pergunta | Comece por |
|---|---|
| O que a 2.0 é? | Arquitetura §Tese, §1, §2 |
| O que ela **não pode** violar? | Congelamento §4 e §5 |
| Por que ela existe? | Auditoria §Sumário (D1–D7) |
| O que já está decidido? | `../DECISIONS.md` + Registro de Governança §3 |
| O que falta decidir? | Registro de Governança §4 (DP-1..DP-11) |
| O que se implementa, e quando? | Mapa dos Pacotes + Roadmap |
| Quem responde por quê? | Registro de Governança §1 |
| Quem já deu parecer? | Registro dos Pareceres |
| **Como a engenharia trabalha?** | `PROCESSO_DE_ENGENHARIA_2_0.md` — níveis, fluxo, regras permanentes |
| **Por que a Onda 1B está parcialmente liberada?** | `PP_01_PREPARACAO_ONDA_1B.md` §2 e §6 |
