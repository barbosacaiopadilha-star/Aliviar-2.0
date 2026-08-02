# AUDITORIA GERAL — FASE 8: HISTÓRICO, PROMPTS, ADRs, DOCUMENTAÇÃO E RASTREABILIDADE

**Data:** 2026-08-02
**Natureza:** inspeção somente. Nenhum documento foi corrigido, nenhuma ADR foi criada, nenhum índice foi alterado, nenhum arquivo foi movido ou apagado.
**Base inspecionada:** `C:\Users\barbo\Projects\aliviar-conexao`, HEAD `fd031d9` (2026-08-01 18:58), árvore de trabalho de 2026-08-02. 45 ADRs em `docs/DECISIONS.md`, ~250 documentos em `docs/`, 76 migrations em `supabase/migrations/`.

---

## 1. Resumo executivo

O repositório tem uma disciplina de registro rara — ADRs append-only com o prompt do Fundador transcrito como prova de aprovação, migrations com cabeçalhos que explicam a decisão, cancelamentos preservados em vez de apagados — e, ao mesmo tempo, quatro falhas estruturais que permitem deriva:

1. **A release inteira de 02/08 não está no histórico.** O HEAD é de 01/08; as 5 migrations do Catálogo Canônico (`20260802100000`–`140000`), a ADR-045 no texto atual de `DECISIONS.md`, o dossiê de migração remota e os 7 documentos de auditoria das Fases 1–7 estão todos **untracked** (`??` no git). Hoje, o estado que a certificação 12/12 provou não é reproduzível a partir de nenhum commit. *(Crítico, certeza alta — `git status` direto.)*
2. **O Catálogo Canônico 1.0.0 — a fonte de autoridade do Método vigente — nunca foi formalmente aprovado.** O cabeçalho de `CATALOGO_CANONICO_PROPOSTA.md:3` diz "proposta de Método, **não aprovada**. Não implementar antes de decisão registrada em ADR" — e as migrations existem e estão aplicadas localmente; cinco protocolos se declaram "instrumento oficial derivado do Catálogo Canônico 1.0.0 (congelado 2026-07-31)"; a ADR-042 o cita como topo da cadeia de autoridade sem nunca aprová-lo. A autoridade real da implementação foi a ordem explícita do responsável **na sessão de trabalho de 02/08** — que não está no repositório. *(Crítico, certeza alta.)*
3. **A supersessão de ADRs é unidirecional e invisível.** Zero das 45 ADRs carrega marca de "Substituída"; quem lê a ADR-017, 021 ou 026 não descobre que foram parcialmente superadas sem ler as 20 seguintes. Três ADRs vigentes (041, 043, 044) contêm afirmações hoje falsas sobre o estado da implementação. *(Alto, certeza alta.)*
4. **98 documentos estão fora do INDEX**, incluindo 12 que se autodeclaram canônicos/oficiais — a pasta `experiencia/` inteira (24 docs, a mais recente do repositório), os protocolos da Curadoria e as duas "Decisões do Fundador" de 24/07. A regra 8 da própria política de governança ("todo documento novo entra no INDEX no mesmo ciclo em que nasce") é a mais violada do repositório. *(Alto, certeza alta.)*

O padrão dominante não é ausência de registro — é registro **fora do lugar onde seria encontrado**: decisões em cabeçalhos de migration em vez de ADR; canonicidade autodeclarada em vez de indexada; supersessão na ADR nova em vez da antiga; e as decisões mais recentes (Catálogo, reabertura pós-congelamento, prompts das certificações) só na memória das sessões de trabalho.

**Veredicto (antecipado, fundamentado no §23):** O histórico e a documentação **ainda permitem deriva ou reinterpretação**.

---

## 2. Escopo e método

- **Fontes:** `docs/DECISIONS.md` (íntegra), `docs/INDEX.md`, `docs/DOCUMENTATION_GOVERNANCE_POLICY.md`, cabeçalhos de todos os ~250 documentos de `docs/`, cabeçalhos das 76 migrations, `git log`/`git status`, código de `src/` e `tests/` por grep dirigido, e os relatórios das Fases 1–7 desta auditoria.
- **Método:** quatro varreduras independentes (linha do tempo + matriz de ADRs; prompts, cancelados e "o que ficou para trás"; rastreabilidade, vocabulário e papéis; inventário documental e governança), consolidadas neste documento. Cada achado carrega evidência (`arquivo:linha`, migration ou commit), gravidade e nível de certeza.
- **Limite declarado:** o que existe apenas fora do repositório (prompts de sessão, decisões verbais) não pôde ser inspecionado — foi registrado como **lacuna**, nunca reconstruído por inferência. Este auditor participou das sessões de 02/08 (Release e Auditoria) e declara em primeira mão, no §21, o que dessas sessões não está registrado.

---

## 3. Inventário documental

Contagem: **98 documentos não indexados** (47 na raiz de `docs/` + 51 em subpastas), fora `docs/tasks/` (6) e `docs/ace/04-specs/` (50), cobertos por link de pasta no INDEX. *(Certeza alta — verificação mecânica de link literal em `INDEX.md`.)*

Por classe (síntese; inventário completo levantado documento a documento):

| Classe | Exemplos e estado |
| --- | --- |
| **Canônicos indexados vigentes** | `PRODUCT_VISION.md`, `PRODUCT_PRINCIPLES.md`, `PATIENT_ENTRY_ARCHITECTURE.md`, `BRAND_GUIDELINES.md`, `ace/` (camadas 00–03), `architecture/ARCHITECTURE_BLUEPRINT.md` |
| **Canônicos indexados defasados** | `MODELO_CURADORIA_V1.md` (v1.0 descreve o motor de 100 pontos aposentado pela ADR-042; INDEX:20 ainda diz "Canônico"); `ARCHITECTURE.md` ("Frozen ADR-021", ponto supersedido pela ADR-035); `MANUAL_CURADOR.md` (traduz o Modelo v1.0); `DESIGN_SYSTEM.md` (não reflete ADR-45/Sistema Visual); `LANDING_CREATIVE_DIRECTION.md` (§4/§6 supersedidos pela ADR-033) |
| **Canônicos/oficiais autodeclarados FORA do INDEX (12)** | `experiencia/EXPERIENCE_BOOK_2_0.md` ("O documento canônico da experiência"), `experiencia/NARRATIVA_DA_EXPERIENCIA.md` ("fonte de verdade da UX"), `experiencia/LINGUAGEM_DOS_AMBIENTES.md` ("gramática oficial"), `experiencia/SISTEMA_VISUAL.md` (emendado pela ADR-045), `curadoria/CONGELAMENTO_ARQUITETURAL.md`, os 3 protocolos "instrumento oficial", `CORRECAO_DOMINIO_PAPEIS_E_CASE.md` e `PAPEL_ADMINISTRADOR_E_ENTRADA_DO_PACIENTE.md` ("Decisão do Fundador"), `architecture/MODELAGEM_CONTINUIDADE_POS_DECISAO.md` ("Local canônico"), `architecture/DECISOES_TECNICAS_CONTINUIDADE_POS_DECISAO.md` |
| **Propostos vigentes** | `FUNDAMENTOS_DO_METODO_ALIVIAR.md`, `EXPERIENCE_BIBLE.md`, `OPERATIONAL_ROLES_MODEL.md`, família ACE_* de 25/07 (6 docs, nenhum no INDEX), `CATALOGO_CANONICO_PROPOSTA.md`/`_OPERACAO.md` |
| **Históricos corretos** (marcados, preservados) | `MISSAO_3_RELEASE_CANCELADO.md`, `VIDEO_INSTITUCIONAL_LANDING.md` ("HISTÓRICO — ADR-026"), `ENGINEERING_PLAN.md` ("plano original… superado"), `DOMAIN_CONVERGENCE_PLAN.md` ("EXECUTADO E CONCLUÍDO") |
| **Pendências abertas sem dono/prazo/ADR** | `MIGRACAO_REMOTA_CATALOGO_1_0_0.md` ("AGUARDANDO AUTORIZAÇÃO EXPLÍCITA"), `curadoria/PLANO_RECONCILIACAO_LEDGER.md` ("nenhum passo executado") — nenhum dos dois no INDEX |
| **Defasados sem marca** | `PORTAL_CURADOR.md` / `PORTAL_PACIENTE.md` ("em construção… dados de demonstração" — os portais reais existem em produção); `CHANGELOG.md` (parou em 15/07); `DISCOVERY_ENGINE.md` (morto de fato, sem marca) |
| **Órfão importado** | `alicia/HOMOLOG_B6_GO.md` — homologa branch de outro repositório (o próprio texto nomeia "Aliviar-2.0"); único arquivo da pasta, nada o referencia |
| **Sobreposição de runbooks** | 5 runbooks vivos (`OPERATIONS.md`, `RUNBOOK.md`, `DEPLOY_RUNBOOK.md`, `RECOVERY.md`, `operations/RC1_GO_LIVE_PLAYBOOK.md`), só 1 indexado, sem autoridade única declarada — exatamente o caso "Duplicado" que a política proíbe (`DOCUMENTATION_GOVERNANCE_POLICY.md:38`) |
| **Possível duplicata** | `experiencia/A_SALA_DA_DECISAO.md` × `experiencia/SALA_DA_DECISAO_EXPERIENCE.md` — mesmo ambiente, mesma data, sem nota de relação *(certeza baixa — só cabeçalhos comparados)* |

**Divergências INDEX × documento** (o índice afirma o contrário do que o documento declara):

| INDEX diz | Documento diz | Evidência |
| --- | --- | --- |
| `RETENCAO_E_DESCARTE_DE_CASES.md` = "proposta" (INDEX:119) | "Aprovada e implementada — 2026-07-27" | doc:3; `DECISIONS.md:619`; migration `20260727140000` |
| `LANDING_CREATIVE_DIRECTION.md` = "vigente (12 seções)" (INDEX:96) | §4/§6 supersedidos | `DECISIONS.md:553` (ADR-033) |
| `MODELO_CURADORIA_V1.md` = "Canônico" (INDEX:20) | v1.0 descreve motor aposentado | ADR-042 (`DECISIONS.md:677`) |
| `tasks/` = "arquivo histórico" (INDEX:121) | 4 de 6 dizem "Planejada / não implementada ainda" | `TASK-002:3`, `TASK-004A:3`, `TASK-005A:3` |
| `ARCHITECTURE.md` = "estado atual" (INDEX:60) | "V1.0 — Frozen (ADR-021)" | doc:3 vs `DECISIONS.md:581` |

---

## 4. Linha do tempo

Reconstruída de `git log`, datas de ADR e cabeçalhos de migration. *(Certeza alta para os marcos; datas de ADR ausentes em 34/45 verbetes — ver §5.)*

| Período | Marco | Registro |
| --- | --- | --- |
| ~2026-07-10..15 | Fundação documental: visão, princípios, ENGINEERING_PLAN, série LANDING (6 docs), ADR-001..020 | `docs/tasks/` (morre em TASK-005B), CHANGELOG até 1.0.0-landing |
| 2026-07-15 | Ciclo de arquitetura conceitual (Landing, Patient Entry, Knowledge Map, política de governança) | memória de projeto + docs correspondentes; **CHANGELOG para aqui** |
| 2026-07-23 | Migrations stage1–stage8 (fundação de identidade, curadoria, connection); MISSÃO 201/207; GO_LIVE_READINESS = NO GO | `20260723164021`+ |
| 2026-07-24 | Correção de domínio (papéis/Case/CRM plataforma — "Decisão do Fundador", sem ADR); papel `atendente`; `concierge` (uma linha, sem ADR); MISSAO_3 **cancelada nos Gates 1 e 5** (release, não produto); CONSOLIDACAO_ESTRUTURAL reconcilia 33 migrations | `CORRECAO_DOMINIO_PAPEIS_E_CASE.md`; `20260724191858`; `MISSAO_3_RELEASE_CANCELADO.md` |
| 2026-07-25 | Convergência B2/B4 (remoção `crm_cases`); ampliação de acesso do Curador **sem ADR** (contradiz texto da ADR-019); família ACE_* proposta | `20260725230458`; `DOMAIN_CONVERGENCE_PLAN.md` |
| 2026-07-26..27 | Desativação controlada do ACE (ADR-035/036/037); Modelo da Curadoria v1.0 consolidado e congelado (§13); renomeação de critérios **sem ADR** (`FORMA_DE_CUIDADO`→`CONTINUIDADE_DO_CUIDADO` etc., com UPDATE de dados); v1.0.0 publicada | `20260727100000`; `MODELO_CURADORIA_V1.md`; CHANGELOG_v1.0 |
| 2026-07-28 | **Virada do Modelo**: ADR-039/040/041/042 — Mapa de Prioridades substitui os 100 pontos; nenhuma das 4 ADRs atualiza a versão do Modelo (que o §12 exige) | `DECISIONS.md:630,647,663,677`; `20260728010000..050000` |
| 2026-07-30..31 | Seleção sem banda; Base de Evidências; "decisão de Método de 2026-07-31" citada 8× **sem ADR**; Catálogo declarado "congelado 2026-07-31" pelos protocolos | `20260730100000`; `20260731220000`+; `protocolos/*:cabeçalhos` |
| 2026-08-01 | RC1 (certificação, publicação dos 3 profissionais); pasta `experiencia/` inteira (24 docs); Continuidade Incremento 2 (ADR-043/044); Identidade Visual 2.0 → ADR-045; **HEAD atual `fd031d9` 18:58** | commits `f10f308..fd031d9`; `RC1_FINAL.md` |
| 2026-08-02 | Release de Reconstrução: Catálogo 1.0.0 nas migrations locais (`20260802100000`–`140000`), correções RECONHECE-REFRESH-001/NAV-COMMIT-001, certificação E2E 12/12 em build de produção; Auditoria Geral Fases 1–8 | **tudo untracked — nenhum commit** *(crítico)* |

---

## 5. Matriz das ADRs

**45 ADRs (001–045), sem lacunas de numeração; log append-only respeitado.** *(Certeza alta — leitura integral de `DECISIONS.md`.)*

| Medida | Resultado |
| --- | --- |
| Com linha `**Status:**` explícita | 45/45 |
| Com data no verbete | **11/45** — 34 ADRs não são datáveis sem arqueologia de git |
| Vocabulário de status | Livre ("Provisória", "Definitiva", "Aprovada e implementada", "Proposta — aguardando aprovação"...); **"Substituída/Superseded" não existe no vocabulário** |
| ADRs que supersedem outra | 3 (ADR-026→017 parcial; ADR-033→026 parcial; ADR-035→021 parcial) |
| ADRs supersedidas com marca disso **no próprio verbete** | **0 de 3** — a supersessão é sempre unidirecional (registrada só na ADR nova) |
| Fora de ordem no arquivo | ADR-020 (linha 183) antes de ADR-019 (linha 193) |
| Colisão de numeração | 1, registrada honestamente (ADR-031, `DECISIONS.md:534` — "o número 022 já estava ocupado") |
| Referência a migration inexistente | ADR-025 cita migration que não existe no repositório |

**ADRs com afirmações hoje falsas** (escritas verdadeiras, invalidadas por implementação posterior, nunca emendadas):

| ADR | Afirmação | Realidade | Gravidade |
| --- | --- | --- | --- |
| ADR-041 | "nenhum consumidor ligado" ao motor | `selecao-pelo-motor` implementado e certificado | Alto |
| ADR-043 | trata incrementos como futuros | Incremento implementado em `20260801180000/200000` | Médio |
| ADR-044 | "nada implementado" | `approach_attempts`/`team_notifications` existem | Médio |
| ADR-029 | Status "Proposta — aguardando aprovação" | ADR-044 declara o conteúdo "aprovado" — contradição interna do log | Médio |
| ADR-036 | prevê revogação de grants do ACE | Revogação nunca executada (Fase 3 confirmou grants vivos) | Alto |

**Cumprimento do §12 do Modelo** ("toda ADR que alterar a Curadoria deve referenciá-lo e atualizar a versão"): **0 de 4** ADRs aplicáveis (039 cita mas não versiona; 040/041 não versionam; **042 não contém a string "Modelo" no corpo inteiro** e aposentou exatamente o §7 do documento que continua se declarando canônico v1.0). *(Certeza alta.)*

---

## 6. Matriz dos prompts e decisões

Como uma decisão de prompt vira ADR na prática (fluxo observável, não documentado em lugar nenhum):

> prompt/missão do Fundador → agente executa e produz documento → **o trecho literal do prompt é colado no campo Status da ADR como prova de aprovação** → ADR apendada a `DECISIONS.md` → documento de missão fica em `docs/`, geralmente sem entrar no INDEX.

Evidência do padrão: `DECISIONS.md:567` (ADR-035, transcreve a frase do Fundador), `:680` (ADR-042, "Escolho o caminho A…"), `:550` (ADR-033, MISSÃO 201), e o mesmo em 034/036/037/039/040/041/043/044. **Ciclo completo mais limpo:** `experiencia/PROPOSTA_IDENTIDADE_VISUAL_2_0.md` → ADR-045 → emenda do §12 de `SISTEMA_VISUAL.md` — o único prompt→doc→ADR→emenda visível de ponta a ponta (e mesmo assim os dois docs estão fora do INDEX).

**Fragilidade estrutural:** a "aprovação explícita do responsável" é o agente citando o prompt do responsável dentro do artefato que o próprio agente escreveu. Não há assinatura, commit do responsável ou confirmação fora de banda. Funciona por disciplina de citação literal — alta neste repositório — mas não é verificável de forma independente. *(Informativo/Alto, certeza alta quanto à evidência.)*

**Itens de atenção especial solicitados** (resultado da varredura):

| Item | Achado | Certeza |
| --- | --- | --- |
| "Prompt 9 cancelado" | **Zero ocorrências em todo o repositório** (docs, código, migrations, git log). Só existe fora do repositório — **lacuna registrada, não reconstruída** | Total |
| "Modelo de cuidado" | É o critério `FORMA_DE_CUIDADO`, renomeado para `CONTINUIDADE_DO_CUIDADO` pela migration `20260727100000` (com UPDATE de dados em `cruzamento_weights` e `criterion_declarations`), **sem ADR** | Alta |
| Catálogo 1.0.0 | Implementação nunca aprovada formalmente — ver §7 e §9 | Alta |
| Dashboards | Nenhum pedido de dashboard rastreável como decisão aprovada; superfícies existentes derivam de `CORRECAO_DOMINIO_PAPEIS_E_CASE.md` (que reivindica autoridade sobre "dashboards") | Média |
| Relatório Inteligente | Implementado (`relatorio-inteligente.ts`, migration `20260727110000`) sob ADR-035 (autoria humana); **sem ADR dedicada ao assistido** | Alta |
| Critérios médicos vs preferências | Resolvido em camadas: ADR-011 ("modela decisões, não doenças") + comentário da tabela `case_clinical_context` ("a Aliviar nunca diagnostica"); tensão semântica permanece no termo "clinical context" — vigente, não resíduo | Alta |
| "Simplificação / nº de telas" | Zero vestígio como decisão registrada — lacuna | Alta |
| "Preenchimento em tempo real" | Zero vestígio como decisão; a regra escrita diz **o oposto** (`EXPERIENCIA_CURADORIA_COMPARTILHADA.md:124` — validação não acontece em tempo real) | Alta |
| Concierge | Papel criado por **uma linha de migration sem comentário e sem ADR** (`20260724054819:1`); formalizado como Nível 3 depois; ADR-043/044 constroem sobre ele | Alta |
| Atendente | Criado por "Decisão do Fundador" registrada **no cabeçalho da migration** `20260724191858` ("A tensão estava registrada cinco vezes… O Fundador decidiu"), não em ADR | Alta |

Nenhum pedido exploratório foi tratado como decisão aprovada nesta matriz: onde a evidência é só citação de missão sem artefato, o item está classificado como lacuna.

---

## 7. Decisões sem ADR

Decisões materiais (mudaram banco, papéis ou autoridade) cujo único registro é migration, doc avulso ou memória:

| # | Decisão | Registro existente | Gravidade |
| --- | --- | --- | --- |
| 1 | **Aprovação do Catálogo Canônico 1.0.0** (26→28 conceitos, 5 eixos, congelamento 2026-07-31) | Nenhum. A Proposta diz "não aprovada"; os protocolos dizem "oficial"; a "decisão de Método de 2026-07-31" é citada 8× sem ADR; a ordem de implementar veio da sessão de 02/08 (fora do repo) | **Crítico** |
| 2 | Correção de domínio papéis/Case/CRM | `CORRECAO_DOMINIO_PAPEIS_E_CASE.md` ("Decisão do Fundador"), fora do INDEX | Alto |
| 3 | Criação do papel `atendente` | Cabeçalho da migration `20260724191858` | Alto |
| 4 | Criação do papel `concierge` | Uma linha em `20260724054819:1`, sem comentário | Alto |
| 5 | Renomeação dos 3 critérios (TRAJETORIA→HISTORICO etc.) com UPDATE de dados | Migration `20260727100000` | Médio |
| 6 | Ampliação de acesso do Curador (vê qualquer paciente, assume case sem dono) — contradiz texto da ADR-019 | Migration `20260725230458` | Alto |
| 7 | Política de fontes / estados de verificação / Base de Evidências do Profissional (7 migrations, família inteira de módulos) | Só cabeçalhos de migration | Médio |
| 8 | Declaração de área pelo Curador ("até aqui essa decisão existia só em memória") | Migration `20260727081000` | Baixo (o cabeçalho é exemplar) |
| 9 | Rede Elegível — política nasce da não-conformidade NC-22, não de decisão | `rede-policy.ts:7-8` + migrations de saneamento | Médio |
| 10 | Reabertura do produto pós-congelamento ADR-021 | **Só memória** — a própria ADR-029 lista esse registro como critério não cumprido | Alto |
| 11 | Relatório assistido | Migration `20260727110000` | Baixo |
| 12 | Duas superfícies paralelas da paciente (`/paciente` × `/portal-paciente`) | Nenhum | Médio |

Padrão: **o cabeçalho de migration virou o substituto de fato da ADR.** É rastreável (melhor que nada), mas invisível ao índice de decisões — quem lê `DECISIONS.md` acredita estar vendo o conjunto completo, e não está.

---

## 8. Decisões canceladas ou superadas

| Decisão | Estado do registro | Resíduo vivo |
| --- | --- | --- |
| **MISSAO_3** | Corretamente morta (`MISSAO_3_RELEASE_CANCELADO.md`, "PUBLICAÇÃO CANCELADA"). Importante: cancelou uma **release** (Gates 1 e 5 — 33 migrations só em produção quebrando 133 testes), não escopo de produto; parcialmente resolvida depois (commit `cd37062`, `CONSOLIDACAO_ESTRUTURAL.md`) | Nenhum |
| **Motor de 100 pontos** (aposentado por ADR-041/042) | ADRs claras; superação **não propagada** | Vive como texto normativo em ~14 documentos (MODELO §7/§11, MANUAL_CURADOR, ONTOLOGIA…), em `compatibility_analyses.internal_score` **NOT NULL** (tabela morta nunca dropada), `curated_selection_options.band` (anulável, leitura histórica — resíduo controlado), `cruzamento_weights` (zero leitores) |
| **Vídeo de 10min** (ADR-026) | Correto — "HISTÓRICO — ADR-026, não-normativo" no topo. O melhor exemplo de superação bem marcada do repositório | Nenhum |
| **12 seções da Landing** (ADR-033 supersede) | ADR clara; 4 docs LANDING_* seguem descrevendo as 12 seções sem nota por seção | Docs defasados indexados como vigentes |
| **6 seções da ADR-033** | Aprovadas, **nunca implementadas** — decisão aprovada sem execução, sem registro do descarte | Lacuna inversa |
| **ACE operacional** (ADR-035/036/037) | ADRs claras; ADR-037 §3 (remoção física) **executada** — reverificado nesta fase, corrigindo dúvida da Fase 1 | Grants não revogados (ADR-036 prometeu — Fase 3 confirmou pendente); 50 specs preservadas corretamente como histórico |
| **Árvores mortas de rotas** | Sem registro de morte | `/curador/*` e `/portal-paciente/*` convivem com as superfícies vigentes (3 endereços do Curador — `AUDITORIA_07_UX.md`) |
| **Vocabulário "validação"** (aposentado pela ADR-042 em favor de "reconhecimento") | ADR clara; resíduo em 4 superfícies de UI, incluindo o CTA `jornada.ts:114` "Validar meu Perfil de Prioridades" — o resíduo mais visível à paciente | Ver §13 |
| **MODELO §11 linha 5** | Inverso: item **vigente** (rascunho assistido implementado) marcado como **pendente** | Documento canônico subestima o próprio produto |

---

## 9. Contradições documentais

Sem decidir qual versão deve vencer (a decisão é do responsável — §22), as contradições com evidência dos dois lados:

1. **`CATALOGO_CANONICO_PROPOSTA.md:3` ("não aprovada… Não implementar antes de ADR") × `protocolos/*` ("instrumento oficial derivado do Catálogo 1.0.0 congelado") × migrations `20260802100000/110000` (implementam) × ADR-042:685 (cita o Catálogo como topo da cadeia de autoridade).** Quatro fontes, três estados incompatíveis. *(Crítico.)*
2. **ADR-029 "Proposta — aguardando aprovação" × ADR-044 que declara o mesmo conteúdo "aprovado".** Contradição interna do próprio log de decisões. *(Médio.)*
3. **ADR-019 ("somente `assigned_curator_id = auth.uid()`") × migration `20260725230458`** (curador vê qualquer paciente e assume case sem dono). *(Alto — já registrada na Fase 1 §3.3, terceira citação.)*
4. **`MODELO_CURADORIA_V1.md` v1.0 "canônico" × ADR-042** que aposentou seu §7. *(Alto.)*
5. **INDEX × documentos** — as 5 divergências da tabela do §3. *(Médio.)*
6. **`EXPERIENCIA_CURADORIA_COMPARTILHADA.md:124`** (validação **não** em tempo real) × qualquer futura leitura do pedido "preenchimento em tempo real" como aprovado. *(Informativo — a contradição é preventiva.)*
7. **ADR-013** (papel desacoplado de especialidade, "Care Provider") × slug fossilizado **`curador_medico`** e ONTOLOGIA usando "Médico"/"Perfil Médico" em ≥12 pontos. *(Baixo — ONTOLOGIA é Proposto.)*
8. **`ROLE_HOME.curador_medico = "/portal-curador"` × `COA_LEVEL_HOMES.CURADORIA = "/coa/curadoria"`** — dois mapas que se declaram derivados um do outro apontando para lugares diferentes (reconciliado por reescrita, não por identidade). *(Médio.)*
9. **`tasks/` "arquivo histórico" (INDEX) × 4 arquivos dizendo "Planejada / não implementada ainda"** — e a política cita `docs/tasks/` como o exemplo **modelar** de histórico bem marcado (`DOCUMENTATION_GOVERNANCE_POLICY.md:40`). A prática contraria o exemplo que a política usa para se justificar. *(Médio.)*

---

## 10. Rastreabilidade

Cadeia completa = Requisito → Decisão (ADR) → Código → Banco → Teste → E2E. Onze funcionalidades auditadas elo a elo *(certeza alta para existência/ausência de artefatos; média onde dependeu de títulos de testes)*:

| Funcionalidade | Classificação | Elo faltante |
| --- | --- | --- |
| Sua História | **COMPLETA** — única com os 6 elos e ADR citada no próprio código (`public-paths.ts:6`, `story/repository.ts:157`) | — |
| Perfil / Mapa de Prioridades | **COMPLETA** | — |
| ↳ Catálogo 1.0.0 | PARCIAL | **Decisão inexistente** (ADR ausente) |
| Portas / Declaração de área | COMPLETA | correção pela UI impossível (Fase 2) |
| Rede Elegível | PARCIAL | Decisão substituída por incidente (NC-22); fail-open sem teste |
| Seleção dos três | **COMPLETA** — a mais densamente testada (6 suites) | congelamento `DELIVERED` só em código |
| Relatório | PARCIAL | `emitted_at` fora do congelamento; entrega não-atômica (Fase 2 C4/C7) |
| Profissional / publicação | PARCIAL | **7 migrations, zero ADR** |
| Documentos / anexos | PARCIAL | Decisão inexistente; validação MIME/tamanho ausente |
| Leads / Atendimento | PARCIAL | **Zero E2E para o papel inteiro** + decisão em doc de correção, não ADR + entrada quebrada (Fase 2 C2) |
| Continuidade / Concierge | PARCIAL | Incremento 2 sem E2E; "horário" declarado ausente pelo próprio contrato |
| Avaliação por critério (leitura da paciente) | PARCIAL | Elo de superfície: `criterion_evaluation` tem zero ocorrências em `src/` |

**Síntese:** 3 completas, 8 parciais, 0 quebradas de ponta a ponta. O elo que mais falta é o de **decisão** (5 cadeias) — sempre pelo mesmo padrão: a decisão está no cabeçalho da migration.

---

## 11. Documentação canônica

- **Quem declara canonicidade, na regra:** só o responsável; a frase "documento canônico" no topo "não é autoridade — é intenção" (`DOCUMENTATION_GOVERNANCE_POLICY.md:46-47`).
- **Na prática:** ≥12 documentos se autodeclaram canônicos/oficiais sem aprovação rastreável e sem INDEX (§3). A matriz "Fonte da Verdade" (`ARCHITECTURE_KNOWLEDGE_MAP.md` §4), eleita pela política como mecanismo antiduplicação, **não conhece nenhuma das pastas `experiencia/`, `curadoria/`, `operations/`, `coa/`, `crm/`, `alicia/`** — mais de 40 documentos, incluindo os que reivindicam a canonicidade mais forte. O instrumento central de governança desconhece a maior parte do que deveria governar. *(Alto, certeza alta.)*
- **Estado real da hierarquia:** os canônicos de negócio (Visão, Princípios, Patient Entry, Brand) estão íntegros e indexados. O canônico do **domínio central** (MODELO v1.0) está defasado no núcleo. Os canônicos mais **recentes** (Experience Book 2.0, Sistema Visual, protocolos) estão fora de qualquer registro central. A camada ACE mantém hierarquia formal própria e íntegra.

---

## 12. Certificações

| Certificação | Registro | Reproduzível? |
| --- | --- | --- |
| GO_LIVE_READINESS (23/07) | "NO GO" — histórico honesto | sim (commitada) |
| CERTIFICACAO_FINAL_RC1 / RC1_FINAL (01/08) | "APTO PARA PRODUÇÃO" | sim (commitadas) |
| HOMOLOG_B6_GO (24/07) | GO — mas de **outro repositório** | não daqui |
| **Certificação 12/12 de 02/08** (primeira mão: Admin→Curador→Paciente em build de produção, 1.2 min) | **Nenhum registro no repositório além do spec** `tests/e2e/reconstrucao-fluxo-completo.spec.ts` — que está **untracked**, junto com as migrations de que depende | **Não** — o estado certificado não corresponde a nenhum commit |
| Fases 1–7 desta auditoria (02/08) | 7 docs entregues — **todos untracked** | Não |

Delimitação já registrada na Fase 6 e mantida: a certificação 12/12 prova o **caminho feliz pela interface**, com zero oráculos de banco — é prova de fluxo, não de invariantes.

---

## 13. Vocabulário

*(Certeza alta — grep exaustivo para os termos de critério e score/band; média para extensão em docs.)*

| Termo aposentado | Vigente | Resíduo |
| --- | --- | --- |
| `TRAJETORIA` | `HISTORICO` | **Limpo** — sobrevive só como substring de identificadores vigentes (`HISTORICO_TRAJETORIA_INSTITUCIONAL`, eixo `PRATICA_E_TRAJETORIA`) e nas 2 migrations históricas |
| `FORMA_DE_CUIDADO` | `CONTINUIDADE_DO_CUIDADO` | **Limpo** (zero fora das migrations de origem/renomeação) |
| `COMPATIBILIDADE_PESSOAL` | `MODELO_DE_ATENDIMENTO` | **Limpo** |
| "validação/validar" | "reconhecimento" (ADR-042) | **4 superfícies de UI**: `jornada.ts:114` (CTA "Validar meu Perfil de Prioridades" — visto pela paciente), `portal-curador/.../curadoria_tecnica/page.tsx:262,459`, `portal-paciente/prioridades/page.tsx:122,125`, `activity-feed.tsx:24` + `mandatory-filters.tsx:80,228`; campo `validated_at` no banco; docs MANUAL/ONTOLOGIA/EXPERIENCE_BIBLE. Nenhum teste trava `jornada.ts:114` |
| score / band / internal_score | 4 resultados sem número (ADR-041/042) | **Resíduo controlado** em código (escrita bloqueada por `schema.ts:95` strict, leitura histórica comentada, 4 suites pinando a ausência); **não controlado**: `internal_score` NOT NULL em tabela morta e o texto normativo dos ~14 docs |
| "Médico" | "profissional" (ADR-013) | Código coerente; resíduo no **doc** (ONTOLOGIA ≥12 pontos) e no **slug** `curador_medico` |
| Caso ↔ Case | convivência deliberada (ADR-019) | Não é resíduo — fronteira de camada consistente (PT na superfície, EN no esquema) |
| Perfil ↔ Conta | não resolvido | Um href, três rótulos; e "Perfil" designa duas entidades distintas (conta × Perfil de Prioridades) — mantido, registrado na Fase 7 |

---

## 14. Papéis

Evolução: 4 papéis na fundação (`20260723164021:18-22`) → `concierge` (24/07, uma linha, sem ADR) → `atendente` (24/07, decisão do Fundador em migration) → ampliações de leitura por papel (27/07–02/08). **Dois dos seis papéis nasceram sem ADR.**

| Papel | Prometido e ausente (evidência) | Gravidade |
| --- | --- | --- |
| Paciente | Troca de profissional ("Paciente, exclusivo" — `OPERATIONAL_ROLES_MODEL.md:158`): sem superfície. Duas superfícies paralelas sem ADR | Médio |
| Curador | Ampliação de acesso de 25/07 sem ADR; 3 endereços de home; concorrência da Mesa inexistente | Alto |
| **Atendente** | **Zero permissões COA** — `ROLE_COA_PERMISSIONS` (`permissions.ts:13-32`) não tem entrada `atendente`; quem **abre** o Case não pode nada no COA. Zero E2E. Canais prometidos "(teoria; sem canal real hoje)" | Alto |
| Concierge | Único não-admin com `manage_leads` (resíduo reconhecido em comentário `permissions.ts:51` e não removido); "horário ausente" declarado pelo contrato; Incremento 2 sem E2E | Médio |
| Administrador | Completo; nota de design exemplar em `role-home.ts:18-20` | — |
| **Profissional** | **O papel mais descoberto**: nenhuma tabela de notificação ao profissional existe (`patient_notifications` e `team_notifications` existem; a dele, não); `OPERATIONAL_ROLES_MODEL.md:242-243` declara "Connection/Relationship: Profissional (**sem canal**)"; papel prometido na Entrega sem superfície. Ressalva de precisão: **não** localizada promessa explícita de "notificar o selecionado" — a lacuna real é a ausência de qualquer canal, declarada pelo próprio doc | Alto |

Assimetria estrutural: o papel que abre o Case não tem permissão nenhuma; o papel de Nível 3 acumula permissão do Nível 1.

---

## 15. O que ficou para trás

Respostas às dez perguntas do mandato, com o registro (ou a lacuna) de cada uma:

1. **Prompt 9:** inexistente no repositório. Lacuna total — se foi cancelado, o cancelamento só existe fora daqui. *(Certeza total.)*
2. **Missões 100–209:** existem apenas como números citados em Status de ADRs e cabeçalhos; nenhum documento de missão por número sobreviveu além dos que viraram docs nomeados. `docs/tasks/` morreu em TASK-005B.
3. **Catálogo 1.0.0:** implementado sem aprovação registrada (§7 item 1).
4. **6 seções da ADR-033:** aprovadas e nunca implementadas; nem execução nem revogação registradas.
5. **Dashboards / Relatório Inteligente / Concierge / Atendente:** ver §6 — nenhum caso de pedido exploratório promovido a decisão sem registro foi encontrado *dentro* do repo; os riscos estão nas lacunas (o que só existe em sessão).
6. **Simplificação / nº de telas / preenchimento em tempo real:** lacunas; a regra escrita contraria o tempo-real.
7. **Cancelados-ainda-vivos:** 100 pontos em ~14 docs + colunas mortas + `cruzamento_weights` sem leitores + árvores `/curador` e `/portal-paciente` + resíduos de "Validação" (§8, §13).
8. **Vigente-marcado-como-pendente:** MODELO §11 linha 5 (rascunho assistido).
9. **Decisões só-na-memória:** reabertura pós-ADR-021; "decisão de Método de 2026-07-31" (8 citações); aprovação do Catálogo; prompts das sessões de 02/08 (§21).
10. **Divergência fundadora (WhatsApp):** na sexta citação ou mais, ainda sem ADR — a regra dos 3 strikes, escrita para tornar isso inaceitável, não está instrumentada (sem contador, sem tabela de divergências abertas).

---

## 16. Dívidas e decisões de produto

Dívidas registradas com genealogia rastreável (padrão bom): `BACKLOG_TECNICO.md` com STORY-GET-WRITE-001, STORY-NOVA-001, e as duas patologias de App Router documentadas na Release de 02/08 — **RECONHECE-REFRESH-001** (qualquer `revalidatePath` em action deixa o stream POST aberto; correção vigente `window.location.reload()`) e **NAV-COMMIT-001** (commit de navegação por `Link` intermitente; correção âncora `<a>`). Ambas com causa, evidência e correção descritas — porém no arquivo modificado **untracked**.

Dívidas de produto **sem** registro como decisão: tudo do §14 ("prometido e ausente"), as pendências abertas sem dono (`MIGRACAO_REMOTA_CATALOGO_1_0_0.md`, `PLANO_RECONCILIACAO_LEDGER.md`) e os grants do ACE (ADR-036).

---

## 17. Governança documental

Prescrito × praticado (síntese do quadro completo levantado):

| Regra da política | Praticada? |
| --- | --- |
| Autoridade não é autodeclarada | **Não** (≥12 autodeclarações órfãs) |
| Todo doc novo entra no INDEX no mesmo ciclo | **Não** (98 fora; o INDEX:36 admite o padrão — "adicionados juntos para não deixar órfão" — e três novos docs de `architecture/` nasceram órfãos do mesmo jeito depois) |
| Atualização direta vs ADR (critério objetivo) | **Sim** — distinção aplicada com consistência |
| Divergência nunca resolvida por omissão | **Parcial** — ADR-043 "Resolve: D1/D2" é o mecanismo funcionando (único uso do verbo); WhatsApp segue aberta |
| 3 strikes obriga decisão | **Não instrumentada** |
| Histórico nunca apagado | **Sim** — disciplina exemplar |
| Parcialmente superado sinalizado por seção | **Sim para docs, não para ADRs** |
| Só o responsável encerra auditorias | **Sim** — 8+ auditorias abertas, todas "inspeção somente" |
| Owner nominal / revisão periódica | **Inexistentes como prática e como prescrição** — única promessa de revisão do repositório ("Revisar em 90 dias") está num doc Proposto órfão (`ALIGNMENT_PROFILE.md:238`). O substituto real é o campo "Revisitar quando:" das ADRs — gatilho por evento, sem responsável por verificar; o gatilho da ADR-039:641 já disparou (ADR-042) sem cumprir a obrigação de atualizar o Modelo |
| Superação de ADR | **Vazio normativo** — a política não prescreve nada sobre marcar ADRs supersedidas |

---

## 18. Relação com as Fases 1–7

Esta fase explica a **origem** do que as anteriores mediram:

- Fase 1 (divergências doc×código) ← §7/§8: decisões em migrations e superação não propagada.
- Fase 2 (C1–C7, actions órfãs) ← §10: cadeias sem elo de decisão ou de superfície; a genealogia mostra que as órfãs vêm de propostas nunca formalmente aprovadas ou descartadas.
- Fase 3 (dossiê remoto não pronto; grants do ACE) ← §5 (ADR-036 não executada) e §12 (release untracked que o dossiê desconhece).
- Fase 4 (invariantes textuais, ONT-30 contrariada) ← §11: o corpus normativo que declara invariantes está parcialmente defasado ou fora do índice.
- Fase 5 (segredos, porteiro E2E morto) ← §16: dívidas com e sem genealogia.
- Fase 6 (falsas proteções, certificação delimitada) ← §12: a certificação mais recente não é reproduzível de commit nenhum.
- Fase 7 (CTA "Validar meu Perfil", 3 homes do Curador) ← §13/§14: resíduos de vocabulário e papéis sem ADR.

Correções que esta fase fez sobre fases anteriores: ADR-037 §3 (remoção física do ACE) **foi** executada (dúvida da Fase 1 encerrada); a leitura de "notificação ao profissional selecionado" foi precisada — não há promessa explícita descumprida, há ausência declarada de canal.

---

## 19. Achados por gravidade

**Críticos (2):**
- H-C1 — Release de 02/08 inteira untracked; estado certificado não reproduzível de nenhum commit. *(git status; certeza alta)*
- H-C2 — Catálogo Canônico 1.0.0 implementado sob proposta que proíbe implementação sem ADR; aprovação só na memória de sessão. *(`CATALOGO_CANONICO_PROPOSTA.md:3`; migrations `20260802100000/110000`; certeza alta)*

**Altos (8):**
- H-A1 — Supersessão de ADRs unidirecional; 0/3 supersedidas marcadas; vocabulário sem "Substituída".
- H-A2 — ADR-041/043/044 com afirmações hoje falsas; ADR-029 contradita pela ADR-044.
- H-A3 — MODELO v1.0 "canônico" com núcleo aposentado; §12 de versionamento cumprido em 0/4 ADRs; ADR-042 não menciona o Modelo.
- H-A4 — 98 docs fora do INDEX; 12 canônicos autodeclarados órfãos; Knowledge Map desconhece 6 pastas.
- H-A5 — ADR-036 (revogação de grants do ACE) nunca executada.
- H-A6 — Reabertura pós-ADR-021 e "decisão de Método de 2026-07-31": decisões só-na-memória citadas por artefatos vigentes.
- H-A7 — Papéis: 2/6 sem ADR; Atendente sem permissão COA e sem E2E; Profissional sem qualquer canal; ampliação do Curador sem ADR contradizendo ADR-019.
- H-A8 — Divergência fundadora (WhatsApp) na 6ª+ citação sem decisão; regra dos 3 strikes não instrumentada.

**Médios (7):** INDEX × documentos (5 divergências); renomeação de critérios com UPDATE sem ADR; 100 pontos vivos em ~14 docs; dois mapas de destino divergentes; `tasks/` contrariando o exemplo da política; pendências abertas sem dono; CHANGELOG (fonte única por ADR-021) parado em 15/07.

**Baixos (4):** slug `curador_medico`; ONTOLOGIA com "Médico" (doc Proposto); ADR-020/019 fora de ordem; possível duplicata Sala da Decisão *(certeza baixa)*.

**Informativos (3):** fluxo prompt→ADR observável mas não documentado; 34/45 ADRs sem data; padrão "decisão no cabeçalho da migration" como prática consolidada.

---

## 20. Tudo que está rastreável

O que um leitor futuro consegue reconstruir **só com o repositório**:

- As 45 decisões de `DECISIONS.md`, com o prompt do responsável transcrito em 10+ delas — incluindo as viradas ADR-035 (autoridade do Curador) e ADR-042 (Mapa substitui pontos).
- Todos os cancelamentos formais (MISSAO_3, vídeo de 10min, ENGINEERING_PLAN) — nenhum apagado, todos marcados.
- A genealogia completa de 3 funcionalidades (Sua História, Mapa de Prioridades, Seleção) e a maior parte da das outras 8.
- Toda decisão embutida em migration — os 76 cabeçalhos são, na prática, o segundo log de decisões do projeto, e vários são exemplares (`20260727081000`, `20260724191858`).
- O ciclo completo prompt→doc→ADR→emenda da Identidade Visual 2.0 (ADR-045).
- A renomeação limpa dos 3 critérios (estado anterior e ato preservados em 2 migrations).
- As certificações RC1 e os NO-GOs anteriores.
- As 7 fases anteriores desta auditoria (nos arquivos — ainda não no histórico git).

---

## 21. Tudo que depende de memória ou interpretação

O que **não** está no repositório e se perde se a memória se perder:

1. **Os prompts das sessões de 02/08** — o plano de 10 etapas da Release de Reconstrução (que ordenou implementar o Catálogo 1.0.0) e os 8 prompts da Auditoria Geral. Declaração de primeira mão deste auditor: essas ordens existem apenas na sessão de trabalho. É a instância mais recente do mesmo padrão que matou o "Prompt 9".
2. **A aprovação do Catálogo Canônico 1.0.0** e a "decisão de Método de 2026-07-31" (8 citações, zero registro).
3. **A reabertura do produto pós-congelamento ADR-021** (a ADR-029 admite o débito).
4. **O "Prompt 9 cancelado"** — conteúdo, motivo e cancelamento, integralmente fora do repo.
5. **As missões numeradas 100–209** além dos títulos citados.
6. **A data real de 34/45 ADRs** (reconstruível só por arqueologia de git, e mesmo assim não para as untracked).
7. **Quem é responsável por cada documento** (nenhum owner declarado em lugar nenhum) e **quantos strikes cada divergência acumulou** (nenhum contador).
8. **A validade da aprovação nas ADRs** — a citação do prompt é escrita pelo agente; sem commit do responsável ou assinatura, a verificação independente é impossível.

Interpretações deste documento que não são fatos: as classificações vigente/defasado/morto de documentos não lidos integralmente (certeza média, declarada no §3); a leitura de que o cabeçalho de migration "substitui" a ADR (é padrão observado, não regra escrita); a duplicata da Sala da Decisão (certeza baixa).

---

## 22. Decisões necessárias

Registradas como perguntas ao responsável — nenhuma foi tomada nesta auditoria:

1. **Versionar ou descartar a release de 02/08** (migrations, ADR-045 no texto atual, dossiê, specs, auditorias). Enquanto untracked, nada do que foi certificado é reproduzível. *(Resolve H-C1.)*
2. **Aprovar formalmente ou reverter o Catálogo Canônico 1.0.0** — e, se aprovado, atualizar o cabeçalho da Proposta e registrar a ADR que a própria Proposta exige. *(Resolve H-C2 e a contradição §9.1.)*
3. **Definir a regra de marcação de ADR supersedida** (vazio normativo hoje) e decidir se ADR-017/021/026 recebem nota retroativa — ou se o log permanece estritamente append-only com um índice de supersessões.
4. **Decidir o destino do MODELO v1.0**: emendar para v2.0, marcar §7/§11 como superados por seção, ou rebaixar a histórico — qualquer uma, mas alguma.
5. **Encerrar ou re-tensionar o INDEX**: incorporar os 98 (começando pelos 12 autodeclarados canônicos), ou declarar formalmente que o INDEX cobre só um subconjunto.
6. **Registrar as decisões só-na-memória enquanto a memória existe**: reabertura pós-021, decisão de Método de 31/07, e o conteúdo/cancelamento do Prompt 9 — ou declarar essas lacunas permanentes.
7. **Decidir a divergência fundadora do WhatsApp** (6ª+ citação) e instrumentar os 3 strikes (tabela de divergências abertas com contador).
8. **Papéis**: registrar em ADR a existência de `atendente`/`concierge` e a ampliação do Curador de 25/07 (ou revertê-la); decidir as permissões COA do Atendente e o canal do Profissional.
9. **Executar ou revogar formalmente a ADR-036** (grants do ACE).
10. **Definir dono e destino dos dois documentos-pendência** (migração remota; reconciliação do ledger).

---

## 23. Veredicto

> **O histórico e a documentação ainda permitem deriva ou reinterpretação.**

Justificativa, em ordem de peso:

1. O estado mais recente e mais importante do produto — o que foi certificado 12/12 em 02/08 — **não está no histórico** (H-C1). Qualquer reconstrução futura partirá de um commit que não contém o Catálogo, as correções nem as provas.
2. A fonte de autoridade vigente do Método (Catálogo 1.0.0) tem, no repositório, apenas registros que **se contradizem** — "não aprovada, não implementar" de um lado, "oficial e congelado" do outro — e a resolução real vive na memória de uma sessão de trabalho (H-C2). Um leitor futuro pode legitimamente concluir qualquer um dos dois estados.
3. Três ADRs vigentes afirmam coisas hoje falsas, nenhuma ADR superada carrega a marca, e o documento canônico do domínio central descreve um motor aposentado — ou seja, **ler as fontes oficiais de cima a baixo produz uma imagem errada do produto atual** (H-A1/A2/A3).
4. O mecanismo desenhado para impedir exatamente isso — política de governança, INDEX, Knowledge Map, regra dos 3 strikes — existe e é bom, mas está **desconectado da produção documental real**: 98 docs fora do índice, o mapa desconhece 6 pastas, o contador de strikes não existe, e a divergência fundadora da própria política segue sem decisão (H-A4/A8).

O que impede o veredicto de ser pior: a disciplina append-only é real e honesta (nada foi apagado ou reescrito); os cabeçalhos de migration preservam decisões que em outros projetos se perderiam; o padrão de transcrever o prompt do responsável nas ADRs cria rastreabilidade genuína; e o ciclo da ADR-045 prova que o fluxo completo prompt→doc→ADR→emenda **funciona quando executado**. A deriva possível hoje não vem de ausência de cultura de registro — vem de o registro estar fragmentado em quatro camadas (ADRs, migrations, docs autodeclarados, memória de sessão) sem um ponto único que diga qual camada vence.

---

*Fase 8 encerrada. Nenhum arquivo além deste documento foi criado; nenhum existente foi alterado.*
