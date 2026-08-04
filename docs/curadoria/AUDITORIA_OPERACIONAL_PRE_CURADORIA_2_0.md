# Auditoria Operacional da Curadoria — preparação da Curadoria 2.0

> **Natureza:** auditoria de compreensão. Nenhum código, migration, banco, interface,
> componente, API ou documento existente foi alterado. Este arquivo é o único
> produto da missão.
>
> **Data:** 2026-08-04 · **Branch:** `seguranca/menor-privilegio-funcoes-governanca` · **HEAD:** `97ed8b2`
>
> **Fontes:** leitura direta do código (`src/modules/`, `src/app/`), dos documentos
> canônicos ([`MODELO_CURADORIA_V1.md`](MODELO_CURADORIA_V1.md) v2.0,
> [`CONGELAMENTO_ARQUITETURAL.md`](CONGELAMENTO_ARQUITETURAL.md),
> [`../PRODUCT_ARCHITECTURE.md`](../PRODUCT_ARCHITECTURE.md), `../DECISIONS.md` ADR-035 a ADR-065).
> Onde documento e código divergem, este relatório registra a divergência — não a resolve.
>
> **Limite declarado:** a Rede real é inexistente em produção (zero profissionais
> publicados reais — pendência 2 do Congelamento). Toda observação sobre volume,
> carga e gargalo é **estrutural**, derivada do código, não empírica.

---

## Sumário executivo — as sete descobertas que orientam a 2.0

| # | Descoberta | Consequência para a 2.0 |
|---|---|---|
| **D1** | **O Motor não consome a declaração da pessoa.** Ele consome a *interpretação* que o Curador fez dela. `case_needs` (P1–P17, o que ela disse) **não alcança** o Motor de Compatibilidade; quem alcança é `case_priority_map`, digitado pelo Curador. | É o ponto exato onde o Curador é "centro decisório" sem que ninguém tenha decidido isso. Mover o eixo aqui é a virada da 2.0. |
| **D2** | **O Motor não consome a declaração do profissional.** `practice_evidence` (Q1–Q28, com proveniência, versão e verificação) **não alimenta** `professional_subcriterion_map`, que é digitado por um administrador. | O trabalho de verificação que a Base já fez é jogado fora e refeito à mão, sem proveniência. |
| **D3** | **Existem duas avaliações paralelas sobre os mesmos seis grupos**: a leitura do Motor (28 células) e as `criterion_declarations` (6 critérios × 4 estados), digitadas uma a uma por profissional. | A etapa AVALIAÇÃO da Mesa é, hoje, retrabalho manual sobre o que o Motor já leu — exceto no bloco técnico, onde o juízo é legítimo. |
| **D4** | **O que a paciente lê por dimensão vem da mão do Curador, não do Motor.** `patient-curadoria.ts` monta as cinco dimensões a partir de `criterion_declarations`. Se o Curador não declarar, ela lê "ainda precisamos confirmar" em tudo — mesmo com o Motor com leitura completa. | A transparência prometida à paciente está desconectada do motor que a produziria. |
| **D5** | **Dois motores de Curadoria coexistem.** O ACE (P001–P010) tem orquestrador, artefatos, dashboards e entrega própria; `runAceExecution` **não tem nenhum chamador** em `src/`. A página da paciente carrega **os dois formatos de entrega** ao mesmo tempo. | Superfície morta com custo de manutenção, e risco real de a paciente ver dois documentos concorrentes. |
| **D6** | **Seis modelos de progresso paralelos** descrevem o mesmo caso: funil do CRM (18 etapas), status do Case (9), fases do COS (9), jornada do Curador (4), etapas da Mesa (6), jornada da paciente (7). Nenhum é derivado do outro por contrato. | Sincronizar seis relógios é trabalho invisível e permanente da operação. |
| **D7** | **A mesma pessoa é perguntada três vezes** (`sua-historia` → briefing PA1–PA5 → Protocolo P1–P17) e o mesmo profissional, duas vezes (briefing ME1–ME5 → Protocolo Q1–Q28), além do cadastro administrativo. | Cada rodada extra é fricção com quem já respondeu e mais uma fonte para divergir. |

---

## 1. Mapa completo da operação atual

### 1.1 Os quatro atores e suas superfícies

| Ator | Papel no banco | Superfícies reais | Superfícies mortas |
|---|---|---|---|
| **Assistido (paciente)** | `paciente` | `/paciente` (home), `/paciente/curadoria`, `/paciente/perfil`, `/paciente/linha-do-tempo`, `/paciente/documentos`, `/sua-historia/*` | `/portal-paciente/*` — redirect permanente intercepta antes do roteamento |
| **Curador** | `curador_medico` | `/coa/curadoria` → rewrite para `/portal-curador/*`: `casos/[id]`, `casos/[id]/[etapa]`, `casos/[id]/curadoria_tecnica` (a Mesa) | `/curador/*` — redirect intercepta; arquivos de página inalcançáveis |
| **Atendimento / Concierge** | `administrador` (via CRM) | `/coa`, `/coa/atendimento`, `/coa/concierge`, `/atendimento/[leadId]`, `/admin/crm/*` | — |
| **Administrador** | `administrador` | `/admin`, `/admin/pacientes/*`, `/admin/profissionais/*`, `/admin/casos/*`, `/admin/equipe` | `/admin/ace/*` — observabilidade de um motor que não executa |
| **Profissional** | `profissional` | `/profissional` (Protocolo Q1–Q28, próprias evidências, divergências) | — |

### 1.2 Fluxo do Assistido (paciente) — ponta a ponta

```
Lead (CRM, 18 etapas)
   └─ atendimento humano → qualificação → contratação → pagamento
        └─ Administrador cria a conta (ADR-018: nunca autocadastro)
             └─ credenciais entregues fora do sistema
                  └─ `sua-historia` (wizard de 6 passos, autosave, `patient_stories`)
                       └─ Administrador cria o Case manualmente (`createCaseAction`)
                            └─ Consulta Inicial (conversa; Curador registra)
                                 └─ Perfil de Prioridades → RECONHECIMENTO dela (único ato dela no meio)
                                      └─ [caixa-preta para ela: Mesa de Curadoria]
                                           └─ Relatório emitido → entregue
                                                └─ Devolutiva (conversa humana)
                                                     └─ decisão dela (CHOSEN | NONE_OF_THEM)
                                                          └─ Connection → Relationship (acompanhamento)
```

**O que ela vê durante a Curadoria:** sete etapas em `jornada.ts` com frase por etapa
(`experiencia.ts:STAGE_MESSAGES`) e o responsável atual por nome
(`coa/journey-responsibility.ts`). Nenhum artefato interno atravessa — a fronteira de
vocabulário é mecânica (`PATIENT_FORBIDDEN_TERMS`, com teste).

**Os dois únicos atos dela no sistema:** reconhecer o Perfil e registrar a decisão.
Tudo mais é leitura.

### 1.3 Fluxo do Curador — as nove fases, as quatro etapas e as seis da Mesa

Três camadas sobrepostas, todas ativas:

- **COS — 9 fases canônicas** (`cos/phases.ts`): ACOLHIMENTO · HISTORIA · CASO · FILTROS ·
  PRIORIDADES · VALIDACAO · CURADORIA_TECNICA · RELATORIO · DEVOLUTIVA. Cada uma com
  critérios de entrada/saída avaliados sobre a Memória (`CuradoriaRecord`).
- **Jornada do Curador — 4 etapas** (`cos/journey.ts`): ACOLHER · COMPARAR (Mesa) ·
  RELATORIO · FINALIZAR. Projeção pura das nove.
  *(O cabeçalho do arquivo diz "seis etapas"; o array tem quatro — deriva de comentário.)*
- **Mesa — 6 etapas** (`mesa-etapas.ts`): PERFIL · REDE · AVALIACAO · COMPATIBILIDADE ·
  CAMINHOS · RELATORIO. Nenhuma bloqueia; a Mesa calcula "a próxima decisão".

### 1.4 Fluxo do Concierge / Atendimento

O COA (`modules/coa`) define três níveis — ATENDIMENTO, CURADORIA, CONCIERGE — e resolve
**um responsável por vez** visível ao Assistido. A fase é inferida do estágio do funil
(`resolveJourneyPhase`) ou, na ausência dele, da Memória da Curadoria
(`inferPhaseFromCuradoria`). O Concierge assume em `escolha`/`acompanhamento`/`encerramento`.

**Observação:** a inferência tem duas fontes e uma delas ganha por precedência
(`pipelineStage` vence). Se o funil não avançar, a paciente vê "Curador" enquanto o
Concierge já a acompanha — e vice-versa.

### 1.5 Fluxo administrativo

Cadastro de paciente (conta + papel via service role, senha exibida uma vez),
cadastro/publicação de profissional, criação do Case, **preenchimento do Mapa do
Profissional** (`saveProfessionalSubcriterionAction`, papel `administrador`),
verificação de evidências, resolução de divergências, equipe, CRM.

### 1.6 A Mesa de Curadoria — o que ela carrega em uma tela

`loadMesaCruzamento` (`mesa-cruzamento.ts`) monta, por Case:

1. `is_certification` (isola fixture de certificação da Rede real);
2. Perfil de Prioridades + filtros obrigatórios (área, UF, cuidado contínuo);
3. reconhecimento da paciente (`isProfileAcknowledged`) — **gate real da Mesa**;
4. a Rede: `professional_profiles` ativos, publicados, não-demo, com o mesmo
   `is_test_fixture` do Case, **menos** os bloqueados por divergência crítica aberta;
5. área de atuação + modelo de atendimento de cada um;
6. classificação de elegibilidade (gate de área + filtros obrigatórios);
7. `criterion_declarations` já feitas e as pendentes (`awaitingDeclaration`);
8. a leitura do Motor por elegível (`crossPriorityAndProfessional`);
9. as necessidades do Protocolo da Pessoa (`case_needs`) — **exibidas, nunca cruzadas**
   pelo Motor principal.

### 1.7 Os três motores

| Motor | Arquivo | Entrada A | Entrada B | Saída | Congelado? |
|---|---|---|---|---|---|
| **Compatibilidade** | `motor-compatibilidade.ts` | importância do Case (5 níveis) | estado do profissional (3) | 4 resultados por subcritério, matriz 5×3 = 15 células | Sim (ADR-041) |
| **Relacional** | `motor-relacional.ts` | grau da pessoa (4 níveis, de `case_needs`) | condutas declaradas (de `practice_evidence`) | 4 resultados + `AGUARDA_JUIZO_DO_CURADOR`, matriz 4×3 | Novo (ADR-065) |
| **Cruzamento (legado)** | `cruzamento.ts` | — | — | Só sobrevive o vocabulário: gate de área, 6 critérios, 4 estados de avaliação. O cálculo de 100 pontos foi removido (ADR-042). | Aposentado |

**O ponto mais importante desta tabela:** o motor **relacional** lê as declarações
originais dos dois lados. O motor **principal** lê duas transcrições manuais. O modelo
mais novo já provou que a arquitetura desejada é possível — em seis conceitos.

### 1.8 Geração do Relatório

`relatorio-inteligente.ts` (776 linhas, puro, determinístico, versionado
`relatorio-inteligente/2.1.0`) produz, por opção: justificativa, relação com prioridades,
leitura relacional, pontos de atenção, pontos favoráveis, perguntas sugeridas, lacunas —
**cada frase com proveniência** (`ProvenanceRef`). Recusa-se a escrever o que não pode
sustentar: sem confirmação nenhuma, a justificativa nasce `requiresCurator`; sem ponto de
atenção, o campo fica pendente ("opção só com virtudes é recomendação").

`relatorio-assistido.ts` monta a entrada a partir do banco e persiste **nas mesmas
tabelas** do Relatório humano — um documento só. Ciclo: gerar → revisar (salvar =
revisar) → aprovar → emitir → entregar. Duas guardas de emissão (ADR-064): recusa emitir
com a frase-sentinela de juízo relacional pendente, e recusa emitir com a abertura ainda
no texto de rascunho.

### 1.9 Entrega das recomendações

`deliver_curadoria` (RPC transacional, ADR-048) executa seleção + Relatório + evento +
auditoria em um ato só. A paciente lê via `loadPatientCuradoria` → `CaminhosPanel`
(cartas sequenciais, uma aberta por vez, comparação opcional, sem ranking).

---

## 2. Etapa a etapa — as dez perguntas

Legenda de automatização: **H** obrigatoriamente humana · **P** parcialmente automatizável ·
**A** totalmente automatizável.

### 2.1 Captação e qualificação (CRM)

| | |
|---|---|
| **Objetivo** | Transformar contato em Assistido contratado. |
| **Quem decide** | Atendente/Administrador. |
| **Precisa ser humana?** | **P** — a conversa é humana; a movimentação de estágio, a detecção de duplicidade (`duplicates.ts`) e a próxima ação (`next-action.ts`) já são derivadas e poderiam avançar sozinhas. |
| **Dados de entrada** | `leads` (nome, telefone normalizado, origem, canal), integrações WhatsApp/site. |
| **Produz** | `pipeline_stage`, tarefas, agenda, conversão em paciente. |
| **É usado depois?** | Sim — `resolveCurrentResponsible` deriva daí o responsável visível à paciente. |
| **Duplicidade** | Sim: o estágio do funil e o status do Case descrevem o mesmo fato com vocabulários diferentes. |
| **Retrabalho** | Mover o funil à mão depois de cada ato do Curador. |
| **Preenchimento manual evitável** | `sent_to_curator`, `curation_in_progress`, `report_ready`, `report_delivered`, `doctor_selected` são todos deriváveis de fatos já gravados. |
| **Interpretação onde caberia regra** | Sim — as cinco transições acima. |

### 2.2 Criação da conta e da história (`sua-historia`)

| | |
|---|---|
| **Objetivo** | Registrar a história nas palavras dela, antes de qualquer organização. |
| **Quem decide** | Paciente escreve; Administrador cria a conta e o Case. |
| **Precisa ser humana?** | Conta: **H** (ADR-018, decisão de produto). Abertura do Case: **A** — hoje é um clique manual sobre uma história já `enviada`. |
| **Dados de entrada** | 6 passos do wizard + anexos (`patient_stories`, `story_attachments`). |
| **Produz** | Narrativa livre, preferências, anexos. |
| **É usado depois?** | Sim, como leitura na etapa ACOLHER (`getSourceStoryText`). **Não é estruturado por ninguém automaticamente.** |
| **Duplicidade** | Sim — as "preferências de atendimento" do wizard reaparecem em PA1–PA5 (briefing) e em P1–P17 (Protocolo). |
| **Retrabalho** | Alto: a mesma pessoa responde três instrumentos sobrepostos. |
| **Manual evitável** | Abertura do Case. |
| **Regra objetiva possível** | História `enviada` + paciente com papel = Case `NEW`. |

### 2.3 Acolhimento · História · Caso (etapa ACOLHER)

| | |
|---|---|
| **Objetivo** | Ouvir inteiro e devolver organizado até ela reconhecer ("é exatamente isso"). |
| **Quem decide** | Curador. |
| **Precisa ser humana?** | **H**, sem ressalva. É o coração do Método (Fundamentos §5.2; Experience §2.2). |
| **Dados de entrada** | História enviada, documentos, contexto do CRM. |
| **Produz** | `consultation_records` (narrativa, `understanding_confirmed_at`), `case_clinical_context`. |
| **É usado depois?** | Sim — gate de entrada de FILTROS e insumo do Relatório. |
| **Duplicidade** | Havia (`priority_profiles.patient_history` × `consultation_records.narrative`); já corrigida — a action antiga foi removida com nota no código. |
| **Retrabalho** | Baixo. |
| **Manual evitável** | Marcar "contexto revisado"/"documentos revisados" é checkbox burocrático: o sistema sabe se a história e os documentos foram abertos. |
| **Regra objetiva possível** | Só nos dois checkboxes acima. |

### 2.4 Filtros eliminatórios

| | |
|---|---|
| **Objetivo** | Registrar o inegociável — o que elimina antes de qualquer leitura. |
| **Quem decide** | Curador, com a pessoa. |
| **Precisa ser humana?** | **P** — distinguir inegociável de desejo é humano; **mas** UF, modalidade, prazo e cobertura já são respostas fechadas em `case_needs` com grau `ESSENCIAL`. Transformar `ESSENCIAL` em candidato a filtro é regra, não interpretação. |
| **Dados de entrada** | Conversa; `priority_profile_filters` (kind, value, nature, motivo). |
| **Produz** | Filtros obrigatórios (área, UF, cuidado contínuo) e preferências em texto livre. |
| **É usado depois?** | Sim — `loadMesaCruzamento` os aplica como `MandatoryFilterCheck`. |
| **Duplicidade** | Sim: `ESSENCIAL` em `case_needs` e `FILTRO_OBRIGATORIO` em `priority_profile_filters` dizem a mesma coisa em dois lugares. |
| **Retrabalho** | Sim — redigitação. |
| **Manual evitável** | A **proposta** de filtro. |
| **Regra objetiva possível** | Sim, como sugestão a confirmar. |

### 2.5 Mapa de Prioridades (28 subcritérios × 5 níveis) — **etapa crítica**

| | |
|---|---|
| **Objetivo** | Declarar quanto cada subcritério importa **neste Case**. |
| **Quem decide** | **Curador** — `savePriorityMapEntries`, escrita do Curador/Admin. |
| **Precisa ser humana?** | **P, com forte inclinação a A.** Para os ~17 conceitos que têm pergunta à pessoa (P1–P17), ela **já declarou um grau** em `case_needs`. O Curador reclassifica em outra escala. Para os conceitos técnicos (FORMACAO/EXPERIENCIA/HISTORICO), que não têm lado da pessoa, a declaração é legitimamente do Curador — ele é quem sabe o que o caso exige. |
| **Dados de entrada** | Conversa. **Não lê `case_needs`.** |
| **Produz** | `case_priority_map` — a **única entrada do Motor pelo lado do Case** (ADR-039). |
| **É usado depois?** | Sim: Motor, Relatório (ordem das frases), painel do Perfil da paciente. |
| **Duplicidade** | **Sim, estrutural.** Duas escalas fechadas sobre os mesmos conceitos: grau (4) e importância (5). A separação é deliberada e guardada por teste (`importancia-vs-grau.test.ts`) — mas **não existe nenhuma ponte declarada** entre elas. |
| **Retrabalho** | **28 classificações por Case**, sendo ~17 sobre perguntas já respondidas pela pessoa. |
| **Manual evitável** | A **proposta** dos ~17. |
| **Regra objetiva possível** | Sim: uma tabela grau→importância proposta, sujeita a confirmação. Hoje isso é interpretação silenciosa dentro da cabeça do Curador — que é exatamente o oposto de auditável. |

### 2.6 Reconhecimento do Perfil (ato da paciente)

| | |
|---|---|
| **Objetivo** | Ela reconhecer o Perfil como dela. Sem isso, nada avança. |
| **Quem decide** | **Paciente**, e apenas ela (`reconhecerPerfilAction`; ADR-042 removeu a versão em que o Curador reconhecia por ela). |
| **Precisa ser humana?** | **H, absolutamente.** É a Invariante 12 da Ontologia. |
| **Dados / produz** | `priority_profiles.status`; `proximaDecisao` devolve `blocked: true` até acontecer. |
| **Duplicidade/retrabalho** | Nenhum. |
| **Observação** | É o único gate verdadeiro da Mesa — e está corretamente colocado. |

### 2.7 Rede elegível e gate de área

| | |
|---|---|
| **Objetivo** | Decidir quem participa desta Curadoria. |
| **Quem decide** | Curador, par a par (Case × profissional). |
| **Precisa ser humana?** | **H para o veredito** (ADR-035: comparar texto livre com texto livre é inferência semântica, e o erro é invisível). **P para o preparo**: reunir área declarada, tags, fonte, estado de verificação e divergências é trabalho de sistema, e já é. |
| **Dados de entrada** | `professional_practice_areas`, `professional_care_model`, blocklist de divergência crítica, filtros do Case. |
| **Produz** | `AreaAssessment` (4 estados) → `applyAreaGate`. |
| **É usado depois?** | Sim — elegibilidade, geração do rascunho (recusa gerar sobre quem não participa), Relatório. |
| **Duplicidade** | Não. |
| **Retrabalho** | Sim, entre Cases: a mesma área do mesmo profissional é reavaliada em cada Case. Isso é **correto pelo Método** (a área responde *a este caso*), mas nada reaproveita a leitura anterior como referência. |
| **Manual evitável** | Uma **sugestão** ancorada em tags, nunca uma eliminação. |
| **Interpretação vs. regra** | Os filtros UF e cuidado contínuo **já são** regra objetiva (`passes: true/false/null`) — e corretamente devolvem `null` para "informação não localizada", nunca "não atende". |

### 2.8 Avaliação (6 critérios × 4 estados por profissional) — **etapa crítica**

| | |
|---|---|
| **Objetivo** | Declarar quanto cada profissional responde ao caso, critério a critério. |
| **Quem decide** | Curador (`declareCriterion` → `criterion_declarations`). |
| **Precisa ser humana?** | **Dividida.** FORMACAO/EXPERIENCIA/HISTORICO: **H** — `dossie.ts` argumenta o ponto de forma explícita ("deduzir mérito de contagem de diplomas seria transformar volume em qualidade"). ACESSO/CONTINUIDADE/MODELO: **A** — o próprio `dossie.ts` diz que são "duas declarações comparadas… ler, não inferir", e o Motor **já produz essa leitura** sobre os mesmos grupos. |
| **Dados de entrada** | Dossiê + evidências; o Curador digita `assessment` + `evidence` (texto livre). |
| **Produz** | `criterion_declarations`. |
| **É usado depois?** | Sim, em dois lugares: o painel de hipóteses da Mesa **e as cinco dimensões que a paciente lê** (`patient-curadoria.ts` → `PATIENT_DIMENSIONS`). |
| **Duplicidade** | **Sim, a mais cara do sistema.** Metade desta etapa reproduz à mão, em 4 estados, o que a matriz de 15 células já respondeu em 28 subcritérios. |
| **Retrabalho** | 6 declarações × N elegíveis, cada uma com texto livre de evidência. |
| **Manual evitável** | Os três critérios do lado da pessoa. |
| **Interpretação vs. regra** | Sim — e o próprio domínio já escreveu a regra. |

### 2.9 Compatibilidade (leitura do Motor)

| | |
|---|---|
| **Objetivo** | Organizar, subcritério a subcritério, o encontro entre o Mapa do Case e o do profissional. |
| **Quem decide** | **Ninguém** — o Motor organiza; não escolhe, não ordena, não elimina, não pontua (Invariante I-1). |
| **Precisa ser humana?** | **A**, e já é. |
| **Dados de entrada** | `case_priority_map` × `professional_subcriterion_map` × catálogo ativo. |
| **Produz** | `CompatibilityReading` (linhas + resumo por contagem). Nunca persistido — recalculado a cada leitura. |
| **É usado depois?** | Mesa, painel de hipóteses, Relatório assistido. **Não chega à paciente.** |
| **Duplicidade** | Ver 2.8. |
| **Retrabalho** | Nenhum. |
| **Etapa burocrática?** | **Sim, como etapa.** `mesa-etapas.ts` a marca `PENDENTE` com a frase "Faltam avaliações para fechar a leitura" quando `criteriaAwaiting > 0` — mas a leitura do Motor **não depende de `criterion_declarations`**. É uma dependência declarada na interface que não existe no domínio. |

### 2.10 Seleção dos três caminhos

| | |
|---|---|
| **Objetivo** | Escolher exatamente três caminhos legítimos, distintos, todos participantes. |
| **Quem decide** | **Curador**, com autoria registrada (ADR-035; P14 dos Fundamentos). |
| **Precisa ser humana?** | **H, absolutamente.** É a decisão que a Constituição reserva à pessoa. |
| **Dados de entrada** | Tudo acima. |
| **Produz** | `curated_selections` + `curated_selection_options` + `composition_rationale`. |
| **É usado depois?** | Sim — nasce o Relatório dela. |
| **Duplicidade** | Não. |
| **Manual evitável** | Nada da decisão. **A preparação da leitura, sim**: o §11 do Modelo registra que a chave de ordenação interna ficou **sem definição** desde a ADR-042 — hoje a comparação aparece "na ordem da Rede", ou seja, arbitrária. |

### 2.11 Relatório

| | |
|---|---|
| **Objetivo** | Escrever o documento que ela vai reler sozinha e mostrar à família. |
| **Quem decide** | Curador assume autoria; o sistema propõe rascunho. |
| **Precisa ser humana?** | **P** — e a divisão já está bem-feita: gerado com proveniência, revisado, aprovado e emitido por pessoa. |
| **Dados de entrada** | Mapa do Case, Mapa de cada profissional, declaração de área, divergências críticas abertas, leitura relacional. |
| **Produz** | `curadoria_reports` + `curadoria_report_options`. |
| **É usado depois?** | Sim — é o que a paciente lê; e `criterion_declarations` complementa as dimensões. |
| **Duplicidade** | Sim, com o formato legado do ACE (P010), ainda renderizado na mesma página. |
| **Retrabalho** | A **abertura** ("por que estas três, juntas") é 100% manual e é *sobrescrita* a cada regeneração do rascunho — trabalho humano perdido por um ato que parece inócuo. |
| **Manual evitável** | Ver §6. |

### 2.12 Devolutiva, decisão e acompanhamento

| | |
|---|---|
| **Objetivo** | Apresentar pessoalmente, responder devolvendo ao critério dela, registrar a decisão no tempo dela. |
| **Quem decide** | Curador apresenta; **a paciente decide** (`registerDecisionAction`, papel `paciente`). |
| **Precisa ser humana?** | **H** nos dois atos. "Nenhuma destas" é desfecho legítimo e registrável com a mesma facilidade. |
| **Produz** | `patient_curadoria_decisions`, devolutiva, `connection_records`, `relationship_records` (2 estados: ATIVO/ENCERRADO). |
| **Duplicidade** | A decisão vive em `patient_curadoria_decisions` **e** na `DevolutivaRecord` da Memória. |
| **Manual evitável** | Avanço do funil do CRM após a decisão. |

---

## 3. Perguntas dirigidas

### 3.1 Painel do Paciente — **ela entende por que os médicos foram escolhidos?**

**Parcialmente. Ela entende o que o Curador escreveu; não entende o que o Método concluiu.**

O que funciona:
- Cada carta traz justificativa, relação com as prioridades, o que a opção **custa**
  (pontos de atenção são obrigatórios), perguntas para a consulta e, desde a ADR-065, como
  o caminho conversa com a forma como ela quer ser cuidada.
- Nada de score, ranking, posição ou nome de mecanismo — a fronteira é mecânica e testada.
- A ordem é de apresentação, nunca colocação; a comparação é opcional e por escolha dela.

O que não funciona:
1. **As cinco dimensões que ela lê vêm de `criterion_declarations`** — a digitação do
   Curador —, **não do Motor**. Sem essa digitação, ela lê "ainda não foi possível
   confirmar" em todas as cinco, mesmo com a leitura do Motor completa. A promessa de
   transparência está ligada ao instrumento errado.
2. **`curatorName` é `null` fixo** em `loadPatientCuradoria` — o documento mais pessoal do
   produto chega sem assinatura de quem o escreveu.
3. **O Perfil que ela lê não é o que ela declarou.** `buildPerfilView` mostra
   `case_priority_map` (a classificação do Curador), não `case_needs` (as respostas dela).
   Ela "reconhece como seu" um Perfil que foi traduzido — e o texto de reconhecimento
   afirma que foi construído junto com ela.
4. **Dois documentos concorrentes**: quando a entrega legada do ACE existe, a página exibe
   as três cartas *e* o "relatório anterior".
5. **A etapa DOSSIÊ da jornada não tem destino** — o código comenta a ausência
   deliberadamente, mas o efeito para ela é uma etapa que não abre nada.

### 3.2 Painel do Curador — **ele está decidindo ou alimentando o motor?**

**Hoje, majoritariamente alimentando.** A contagem por Case, com N elegíveis:

| Ato | Quantidade | Natureza |
|---|---|---|
| Classificar o Mapa de Prioridades | 28 | ~17 já respondidos pela pessoa em `case_needs` → **alimentação** |
| Declarar área | N | juízo legítimo → **decisão** |
| Declarar critérios | 6 × N (com texto de evidência) | 3 × N já lidos pelo Motor → **metade alimentação** |
| Selecionar três | 1 | **decisão** — a decisão do Método |
| Escrever/aprovar/emitir o Relatório | 1 | **decisão** (autoria) |
| Registrar devolutiva | 1 | **registro** |

Com 6 elegíveis: **~68 atos**, dos quais **3 são decisões do Método** (área, seleção,
autoria do Relatório). A proporção — não o volume — é o achado.

O painel é, em compensação, honesto: a Mesa nunca bloqueia etapa, diz sempre "a próxima
decisão", devolve as hipóteses **como leitura das declarações dele** (nunca "este é
melhor"), e os itens de atenção só mostram o que ainda está aberto.

### 3.3 Mesa de Curadoria — **etapa desnecessária? informação duplicada? etapa burocrática?**

- **Etapa desnecessária:** a etapa **AVALIAÇÃO**, na parte dos três critérios do lado da
  pessoa. O Motor já responde exatamente aquela pergunta, sobre os mesmos grupos, com mais
  granularidade (28 subcritérios contra 3 critérios).
- **Informação duplicada:** (a) grau × importância sobre os mesmos conceitos; (b)
  `criterion_declarations` × leitura do Motor; (c) `ESSENCIAL` × `FILTRO_OBRIGATORIO`;
  (d) evidências digitadas em `criterion_declarations.evidence` × `practice_evidence`
  (que já tem fonte, autor, data e estado de verificação).
- **Etapa burocrática:** a dependência declarada de COMPATIBILIDADE em relação a
  AVALIAÇÃO ("faltam avaliações para fechar a leitura") — inexistente no domínio. E os dois
  checkboxes do Acolhimento.

### 3.4 Motor — **ele apenas calcula, ou também explica?**

**Ele explica melhor do que calcula — e é exatamente o que deveria fazer.**

- Não pontua, não soma, não ordena, não elimina. Devolve um resultado por célula e uma
  frase de contagem (`summarySentence`).
- Preserva a distinção que mais importa: `LACUNA_DE_INFORMACAO` com `status: null`
  ("ninguém olhou") ≠ `NAO_INFORMADO` ("olharam e não souberam") — e o Relatório escreve
  frases diferentes para cada uma.
- Recusa comparar catálogos divergentes (`assertSameCatalog`), e separa
  `notDeclaredByCase` como fato sobre o Case, nunca sobre o profissional.
- Deriva seis das quinze células a partir de três princípios escritos no próprio arquivo —
  raciocínio auditável, não tabela mágica.

**A limitação não é do Motor: é do que chega até ele.** Ele explica muito bem duas
transcrições manuais.

### 3.5 Relatórios — **o que é manual, o que poderia ser automático?**

| Parte | Hoje | Poderia ser |
|---|---|---|
| Justificativa por opção | gerada, com proveniência | mantém |
| Relação com as prioridades | gerada, ordenada por importância | mantém |
| Leitura relacional | gerada; conceitos de juízo humano ficam pendentes por desenho | mantém |
| Pontos de atenção | gerados; vazio força o Curador | mantém |
| Pontos favoráveis / perguntas | gerados | mantém |
| **Abertura ("por que estas três")** | **100% manual, e apagada a cada regeneração** | rascunho a partir da composição declarada + preservação do texto humano |
| **Observações do Curador** | sempre vazio ao nascer, por princípio | mantém |
| **Assinatura do Curador** | ausente na leitura da paciente | automática |
| **Dimensões lidas pela paciente** | de `criterion_declarations` (manual) | do Motor |

---

## 4. Mapa das decisões humanas

**Irredutivelmente humanas — a 2.0 não deve tocar:**

1. Ouvir a história e devolvê-la até ela reconhecer.
2. Estruturar o contexto clínico (sem nunca diagnosticar).
3. Separar inegociável de desejo.
4. **Reconhecimento do Perfil — ato exclusivo da paciente.**
5. Declarar a compatibilidade de área, par a par.
6. Julgar formação, experiência e histórico **contra este caso**.
7. Julgar os conceitos relacionais marcados `cruzamento: "humano"`.
8. **Selecionar os três caminhos.**
9. Assumir autoria do Relatório (aprovar e emitir).
10. Apresentar pessoalmente na devolutiva.
11. **A decisão da paciente**, inclusive "nenhuma destas".
12. Verificar uma evidência (ato humano assinado, vinculado a uma versão — I-6).
13. Resolver divergência entre fontes.

## 5. Mapa das decisões automatizáveis

**Totalmente (A) — nenhuma delas é decisão de Método:**

- A leitura do Motor (já é).
- Completude do Mapa e do Perfil (já é — calculada, nunca declarada).
- Elegibilidade a partir do gate de área + filtros objetivos (já é).
- Bloqueio por divergência crítica aberta (já é).
- Vencimento de verificação (`evidenceReviewIsDue`, já é).
- **Abertura do Case a partir de história enviada.**
- **Avanço do funil do CRM a partir de fatos já gravados** (5 estágios).
- **Dimensões da paciente derivadas do Motor.**
- Assinatura do Curador no Relatório.
- Checkboxes do Acolhimento.

**Parcialmente (P) — o sistema propõe, o humano confirma e a autoria fica dele:**

- **Estado do Mapa do Profissional a partir de `practice_evidence`** (com proveniência).
- **Importância no Mapa de Prioridades a partir do grau em `case_needs`** (nos ~17
  conceitos com lado da pessoa).
- **Filtro obrigatório a partir de grau `ESSENCIAL`.**
- **Avaliação dos três critérios do lado da pessoa a partir da leitura do Motor.**
- Sugestão (nunca veredito) de compatibilidade de área a partir de tags.
- Abertura do Relatório.

## 6. Mapa dos dados

### 6.1 Lado da pessoa

| Artefato | Tabela | Escala | Autor | Alcança o Motor? |
|---|---|---|---|---|
| História livre | `patient_stories` | texto | paciente | não |
| Briefing | (briefing) PA1–PA5 | 4–5 opções fechadas | paciente | não |
| **Protocolo da Pessoa** | `case_needs` | grau (4) + opções canônicas | paciente, via Curador | **só o relacional** |
| **Mapa de Prioridades** | `case_priority_map` | importância (5) | **Curador** | **sim — única entrada** |
| Filtros | `priority_profile_filters` | binário | Curador | como gate |
| Reconhecimento | `priority_profiles.status` | ato | **paciente** | gate |
| Decisão | `patient_curadoria_decisions` | CHOSEN/NONE | **paciente** | — |

### 6.2 Lado do profissional

| Artefato | Tabela | Autor | Proveniência? | Alcança o Motor? |
|---|---|---|---|---|
| Cadastro | `professional_profiles`, `professional_care_model`, `professional_practice_areas` | admin | parcial | como filtro |
| Briefing | ME1–ME5 | profissional | não | não |
| **Base de Evidências** | `practice_evidence` (append-only, versionada) | profissional/operação | **sim, completa** | **só o relacional** |
| **Mapa do Profissional** | `professional_subcriterion_map` | **admin** | **nenhuma** | **sim — única entrada** |
| Divergências | `verification_divergences` | Curador | sim | como bloqueio |

**A assimetria fala por si:** as duas tabelas com proveniência completa e regime
append-only não alimentam o Motor. As duas que alimentam são digitação manual sem
proveniência, sem versão, sem autoria visível.

### 6.3 Dados que ninguém consome hoje

- `priority_weights` e `cruzamento_weights` (histórico preservado, sem caminho de código).
- `compatibility_analyses` (motor aposentado).
- Artefatos do ACE (`ace_artifacts`, execuções) — dashboards vivos, produtor inexistente.
- Respostas do briefing (PA/ME) — lidas em superfícies próprias, fora da cadeia decisória.

## 7. Mapa das redundâncias

| # | Redundância | Onde | Custo |
|---|---|---|---|
| R1 | Grau (pessoa) × importância (Curador) | `case_needs` × `case_priority_map` | 17 reclassificações/Case, tradução não auditável |
| R2 | Declarações de critério × leitura do Motor | `criterion_declarations` × `CompatibilityReading` | 3×N atos/Case + texto livre |
| R3 | Evidência × Mapa do Profissional | `practice_evidence` × `professional_subcriterion_map` | 28 atos/profissional, perda de proveniência |
| R4 | Três instrumentos para a pessoa | wizard, PA1–PA5, P1–P17 | fricção com quem já respondeu |
| R5 | Dois instrumentos para o profissional | ME1–ME5, Q1–Q28 | idem |
| R6 | Seis modelos de progresso | CRM(18) · Case(9) · COS(9) · Jornada Curador(4) · Mesa(6) · Jornada paciente(7) | sincronização manual permanente |
| R7 | Dois motores de curadoria | ACE × COS | superfícies mortas, dois formatos de entrega |
| R8 | `ESSENCIAL` × `FILTRO_OBRIGATORIO` | `case_needs` × filtros | redigitação |
| R9 | Decisão da paciente em dois lugares | tabela própria × Memória | risco de divergência |
| R10 | Evidência textual × Base | `criterion_declarations.evidence` × `practice_evidence` | texto livre onde há dado estruturado |

## 8. Mapa dos gargalos

| # | Gargalo | Natureza | Efeito |
|---|---|---|---|
| G1 | Mapa de Prioridades completo | **gate duro** — trava PERFIL, COMPATIBILIDADE e o reconhecimento | 28 classificações antes de qualquer leitura |
| G2 | Declaração de área por profissional | gate por par | Rede grande = Mesa proporcionalmente mais lenta |
| G3 | 6×N declarações de critério | gate declarado (parcialmente falso, ver 2.9) | maior custo linear do processo |
| G4 | Mapa do Profissional preenchido por **um único papel** (`administrador`) | gargalo de pessoa | um profissional sem Mapa vira 28 lacunas em **todos** os Cases |
| G5 | Abertura do Case manual | espera humana | história enviada parada |
| G6 | Emissão bloqueada por juízo relacional + abertura | gate correto, sem preparo | o Curador descobre o que falta só ao tentar emitir |
| G7 | **Rede real inexistente** | bloqueio operacional absoluto | a Curadoria não roda |
| G8 | Ordenação interna sem chave definida (§11 do Modelo) | falta de decisão | a comparação chega ao Curador em ordem arbitrária |

## 9. Mapa das oportunidades de automatização

Em ordem de **impacto ÷ risco ao Método** — as três primeiras não exigem nenhuma decisão
nova de domínio, apenas ligar coisas que já existem:

| # | Oportunidade | Ganho | Risco |
|---|---|---|---|
| **O1** | **Derivar o Mapa do Profissional de `practice_evidence`** (proposta, com proveniência; o humano confirma). O contrato já existe: `MOTOR_PARTICIPATION` (DIRETO/INDIRETO/NUNCA) e `deriveRelationalState` já fazem exatamente isso para seis conceitos. | ~28 atos por profissional; o Motor passa a ler dado com fonte, autor e data | Baixo — o precedente está implementado e testado |
| **O2** | **Derivar a avaliação dos três critérios do lado da pessoa da leitura do Motor**, deixando ao Curador só FORMACAO/EXPERIENCIA/HISTORICO. | metade da etapa AVALIAÇÃO; resolve R2 e alinha o painel da paciente | Baixo — o próprio `dossie.ts` já defende essa divisão |
| **O3** | **Propor a importância a partir do grau** nos ~17 conceitos com lado da pessoa. | ~17 atos/Case; e a tradução vira **explícita e auditável** em vez de mental | **Médio** — exige ADR: define uma correspondência entre duas escalas hoje deliberadamente separadas |
| O4 | Derivar as dimensões da paciente do Motor | resolve o achado D4 | Baixo |
| O5 | Avançar o funil do CRM por fatos gravados | elimina R6 parcialmente | Baixo |
| O6 | Abrir o Case automaticamente | elimina G5 | Baixo |
| O7 | Propor filtros a partir de `ESSENCIAL` | elimina R8 | Baixo |
| O8 | Painel de prontidão para emissão (o que falta, antes de tentar) | elimina G6 | Nenhum |
| O9 | Sugestão de compatibilidade de área por tags — **sugestão, jamais veredito** | acelera G2 | **Alto se mal feito** — a ADR-035 proíbe explicitamente automatizar o veredito |

## 10. Lista de problemas encontrados

**Arquiteturais**

- **P1.** As duas entradas do Motor principal são transcrições manuais de dados
  estruturados já existentes (D1, D2).
- **P2.** `criterion_declarations` duplica a leitura do Motor em metade do seu escopo (D3).
- **P3.** Dois motores de Curadoria coexistem; `runAceExecution` não tem chamador em
  `src/`, e a máquina de estados do Case (`IN_CURATION`, `HUMAN_REVIEW`) só é movida
  automaticamente por esse orquestrador inerte.
- **P4.** Seis modelos de progresso sem contrato de derivação entre si.
- **P5.** A escala grau × importância é isolada por guarda de teste, mas a tradução
  acontece assim mesmo — informalmente, sem registro.

**De experiência**

- **P6.** As dimensões da paciente vêm do Curador, não do Motor.
- **P7.** `curatorName: null` — Relatório sem assinatura para quem o lê.
- **P8.** O "seu Perfil" mostrado a ela é a classificação do Curador, apresentada como
  construída com ela.
- **P9.** Dois formatos de entrega na mesma página.
- **P10.** A etapa DOSSIÊ da jornada não leva a lugar nenhum.

**De processo**

- **P11.** COMPATIBILIDADE declara dependência de AVALIAÇÃO que não existe no domínio.
- **P12.** Regenerar o rascunho **apaga a abertura escrita pelo Curador** —
  `saveReport` reescreve `composition_rationale` com a frase de trabalho.
- **P13.** Checkboxes burocráticos no Acolhimento.
- **P14.** Ordenação interna de leitura sem chave definida (registrado no §11 do Modelo,
  ainda aberto).

**Divergências código × documento (a verificar com o Método, não corrigir aqui)**

- **P15.** O Congelamento §4.3 afirma que **"viabilidade e preferências/restrições nunca
  entram [no Motor]"**. `crossPriorityAndProfessional` não filtra por grupo: ele cruza
  **todo** subcritério ativo que o Case declarou, incluindo `VIABILIDADE_COBERTURA_E_CONVENIO`
  e `VIABILIDADE_CUSTO_E_PAGAMENTO`. O contrato `MOTOR_PARTICIPATION: "NUNCA"` existe em
  `evidencias-pratica.ts` e **não é consultado pelo Motor**. Hoje a exclusão depende de o
  Mapa do Profissional nunca receber `CONFIRMADO` nesses códigos — e
  `saveProfessionalSubcriterionAction` aceita qualquer subcritério ativo. **Recomendo
  verificação prioritária:** ou o invariante precisa de guarda, ou o documento precisa de
  correção.
- **P16.** `cos/journey.ts` documenta "seis etapas" e implementa quatro.
- **P17.** `MODELO_CURADORIA_V1.md` §7.1/§7.2 ainda descreve "Avaliação Técnica (0–100)" e
  "Compatibilidade Assistencial (0–100)"; a ADR-042 removeu os pontos. O §11 registra a
  supersessão, mas o corpo do documento não foi reescrito.
- **P18.** `PRODUCT_ARCHITECTURE.md` descreve como estado atual um produto (ACE, P009,
  Busca Direta, `story` só em localStorage) que a ADR-035/036/042 substituíram.
- **P19.** Cinco conceitos de tradução (P3–P7) operam com listas de opções **provisórias**
  em código, marcadas `OPCOES_PROVISORIAS_*`, aguardando decisão de Método.
- **P20.** Superfícies inalcançáveis mantidas no repositório: `/curador/*`,
  `/portal-paciente/*`, `/admin/ace/*`.

## 11. Riscos da arquitetura atual

| # | Risco | Severidade | Por quê |
|---|---|---|---|
| **RI1** | **A decisão da pessoa não chega ao Motor.** O que decide é a transcrição. | **Alta** | Contraria o princípio de que o Perfil é dela; e a tradução não é auditável |
| **RI2** | **Evidência verificada é descartada na entrada do Motor.** | **Alta** | O sistema promete proveniência e decide sobre dado sem ela (tensão com I-6) |
| **RI3** | **Carga por Case cresce linearmente com a Rede.** | **Alta** | ~68 atos com 6 elegíveis; com 20, a Mesa fica impraticável — o gargalo da Revisão Humana já previsto em `PRODUCT_ARCHITECTURE.md` §19 |
| **RI4** | **Um único papel escreve o Mapa do Profissional.** | Média | Gargalo de pessoa que degrada **todos** os Cases de uma vez |
| **RI5** | **Duas entregas concorrentes à paciente.** | Média | Risco de contradição no artefato mais sensível do produto |
| **RI6** | **Seis relógios de progresso.** | Média | Divergência silenciosa: ela vê "Curador" quando o Concierge já a acompanha |
| **RI7** | **Trabalho humano apagável** (P12). | Média | Perda de autoria sem aviso |
| **RI8** | **Invariante do Motor sem guarda executável** (P15). | **Alta se confirmado** | Um invariante congelado sem teste é uma promessa, não uma garantia |
| **RI9** | **Documentos canônicos descrevendo produto anterior.** | Média | Quem ler `PRODUCT_ARCHITECTURE.md` como estado atual construirá sobre um mapa vencido |
| **RI10** | **Rede real inexistente.** | **Bloqueante** | Nada acima foi observado em operação real |

---

## 12. Recomendações para a Curadoria 2.0

### 12.1 A tese

> **A Curadoria 2.0 não automatiza a decisão. Ela devolve ao Motor as declarações
> originais das duas partes — que hoje ele não recebe — e reduz o Curador ao que só ele
> pode fazer: garantir a qualidade da informação e julgar o que exige juízo.**

Isto **não é** uma mudança de método. É a remoção de duas transcrições manuais que se
interpuseram entre as declarações e o Motor. O Método já diz quem declara o quê; o
código, hoje, faz o Curador declarar por ambos.

### 12.2 O princípio de arquitetura da 2.0

Toda entrada do Motor deve ter **exatamente uma origem declarada**, e essa origem é
sempre quem tem autoridade sobre o fato:

```
o que ela declarou (case_needs)          →  proposta de importância  →  o Curador confirma  →  Motor
o que ele declarou (practice_evidence)   →  proposta de estado       →  a operação confirma →  Motor
o que este caso exige (juízo técnico)    →  o Curador declara, sem proposta                 →  Motor
```

Três regras não negociáveis para essa ponte:

1. **Proposta nunca é declaração.** Nada entra no Motor sem confirmação humana registrada
   com autor e data. O sistema pré-preenche; ele não decide.
2. **Toda proposta diz de onde veio.** A frase "proposto a partir do que você declarou em
   P11, em 12/03" é parte do dado, não do enfeite. É o mesmo contrato que
   `relatorio-inteligente.ts` já cumpre com `ProvenanceRef`.
3. **Confirmar não pode ser mais barato que discordar.** Se aceitar 28 propostas é um
   clique e recusar uma é um formulário, a proposta vira decisão automática disfarçada.

### 12.3 O papel do Curador na 2.0

| Deixa de ser | Passa a ser |
|---|---|
| Transcritor do Mapa de Prioridades | Confirmador da tradução — com o texto dela ao lado |
| Digitador de 6×N avaliações | Juiz de 3×N critérios técnicos |
| Fonte do estado do profissional | Verificador de evidência e resolvedor de divergência |
| Autor de todo o Relatório | Autor da composição e da leitura de juízo humano |
| Único a saber por que os três | Único a **decidir** os três — com o porquê legível por qualquer auditor |

**Garantidor da qualidade da informação e supervisor das exceções** — exatamente a
formulação da missão — é o que sobra quando as transcrições saem. E é mais, não menos:
verificar evidência, resolver divergência e julgar o que o catálogo marca como `humano`
são trabalhos que hoje competem por atenção com digitação.

### 12.4 Sequência recomendada

**Fase 0 — Verificações antes de qualquer decisão** (nenhuma linha de código de produto)
1. Confirmar ou refutar **P15** (viabilidade no Motor). Se confirmado, é correção de
   defeito sob o §12 do Modelo — não reabre congelamento.
2. Confirmar se o ACE está formalmente descontinuado; se sim, decidir o destino das
   superfícies e do dado histórico.
3. Decidir as listas provisórias P3–P7 (**P19**) — a 2.0 depende delas para propor
   importância.

**Fase 1 — Ligar o que já existe** (sem ADR nova; são defeitos ou evolução prevista)
4. O1 — Mapa do Profissional proposto a partir da Base.
5. O4 — dimensões da paciente derivadas do Motor.
6. P12, P7, P11, P13, O6, O8 — correções pontuais.

**Fase 2 — Exige ADR**
7. **ADR: a ponte grau → importância** (O3). É a decisão central da 2.0 e a única que
   toca o congelado (ADR-039/042). Deve declarar a tabela de correspondência, o que
   acontece com conceitos sem lado da pessoa, e o registro da confirmação.
8. **ADR: divisão da etapa AVALIAÇÃO** (O2) — quais critérios são derivados e quais
   permanecem humanos.
9. **ADR: chave de ordenação interna de leitura** — pendência aberta do §11 do Modelo, e
   pré-requisito para que a Mesa apresente a Rede de forma útil quando ela crescer.

**Fase 3 — Consolidação**
10. Um modelo de progresso derivado, com os demais projetados dele (R6).
11. Consolidar os instrumentos de captação (R4, R5).
12. Reescrever `MODELO_CURADORIA_V1.md` §7 e `PRODUCT_ARCHITECTURE.md` para o produto
    vigente (P17, P18).

### 12.5 O que a 2.0 não deve tocar

As treze decisões humanas do §4. Em especial: **o reconhecimento do Perfil, a seleção dos
três, a autoria do Relatório e a decisão dela**. E as oito garantias do §4 do
Congelamento — nenhuma recomendação acima as contraria; O1 e O2 as **reforçam**, porque
levam proveniência a onde hoje não há nenhuma.

### 12.6 Critério de sucesso

A 2.0 estará certa quando, em um Case com seis elegíveis:

- o Curador praticar **menos de 20 atos**, e todos forem juízo, confirmação ou autoria;
- **nenhuma** entrada do Motor existir sem origem declarada e rastreável;
- a paciente ler, no Relatório, as mesmas conclusões que o Motor produziu — não uma
  segunda versão digitada;
- e a resposta à pergunta *"por que este médico?"* puder ser reconstruída, do começo ao
  fim, sem que ninguém precise lembrar de nada.

---

*Fim da auditoria. Nenhuma recomendação deste documento autoriza alteração de código:
cada uma exige missão própria e, onde indicado, ADR que referencie o Modelo da Curadoria.*
