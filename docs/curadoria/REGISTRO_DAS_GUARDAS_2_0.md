# Registro das Guardas Executáveis — Curadoria 2.0

| Campo | Valor |
|---|---|
| **Versão** | v1.0 |
| **Autor** | Agente 03 — Implementador (pacote F-01) |
| **Data** | 2026-08-04 · **HEAD:** `97ed8b2` |
| **Status** | **Vigente** — nível derivado; documenta guardas, não cria domínio |
| **Dependências** | [`ARQUITETURA_CURADORIA_2_0.md`](ARQUITETURA_CURADORIA_2_0.md) §17 · [`CONGELAMENTO_ARQUITETURAL.md`](CONGELAMENTO_ARQUITETURAL.md) §4–§5 |
| **Documentos relacionados** | [`MAPA_DOS_PACOTES.md`](MAPA_DOS_PACOTES.md) · [`REGISTRO_DE_GOVERNANCA.md`](REGISTRO_DE_GOVERNANCA.md) |
| **Origem** | Pacote F-01 — Guardas Executáveis da Curadoria 2.0 |
| **Código** | `tests/unit/guardas-curadoria-2-0/` — 6 arquivos, 53 testes |

> **O que este pacote fez:** transformou dez princípios que só existiam em documento
> em **21 guardas executáveis**, mais **1 caracterização** que produz a evidência de uma
> decisão pendente. **Nenhuma linha de código de produto foi alterada** — as guardas são
> testes que leem o sistema real e falham quando ele deixa de cumprir o que promete.
>
> **Regra permanente (missão F-01):** nenhum pacote posterior pode reduzir ou contornar
> qualquer guarda deste registro. Alterar uma exige retorno ao Guardião, ao Arquiteto e à
> Governança **antes** de qualquer implementação.

---

## 1. Guardas por grupo

Cada guarda declara: objetivo · princípio protegido · arquivos · validação · teste ·
modo de falha · detecção.

### Grupo A — Domínio (`grupo-a-dominio.test.ts`, 11 testes)

| Guarda | Objetivo | Princípio | Arquivos | Como falha | Como é detectada |
|---|---|---|---|---|---|
| **A-01** Contagens invioláveis *(corrigida em F-01A)* | Todo conceito ativo do código foi **semeado por migration**; o 29º é o da ADR-065; as contagens não mudam em silêncio | Congelamento §4.1/§4.2; ADR-065 | `evidencias-pratica.ts` · `mapa-prioridades.ts` · `mapa-profissional.ts` · `motor-compatibilidade.ts` · as duas migrations do catálogo | conceito editado à mão no código sem migration; o 29º conceito muda de origem; contagem alterada | comparação contra a **fonte versionada do banco** (SQL das migrations) |
| **A-02** Proibição do total combinado | Nenhum resumo ganha campo agregado | Congelamento §4.8; Arquitetura §4.4 (A6) | os dois motores | nasce um `total`, `score`, `nota` ou `percentual` | conjunto de chaves pinado |
| **A-03** As leituras nunca se somam | Compatibilidade e Relacional não viram uma nota | Arquitetura §4.4 e §10.2 | os dois motores | chaves passam a coincidir (um spread funde) ou uma célula devolve número | comparação de chaves + tipo das células |
| **A-04** Nenhum rótulo julga a pessoa | O vocabulário descreve a leitura, não o profissional | Congelamento I-5/I-9; Arquitetura §11.5 | `motor-compatibilidade.ts` | um rótulo ganha "melhor", "ideal", "recomendado" | varredura léxica |

### Grupo B — Motor (`grupo-b-motor.test.ts`, 13 testes)

| Guarda | Objetivo | Princípio | Arquivos | Como falha | Como é detectada |
|---|---|---|---|---|---|
| **B-01** Ausência ≠ incompatibilidade | "Não sei" e "não tem" nunca eliminam | Congelamento I-8; Arquitetura P-04, §4.5 | `motor-compatibilidade.ts` | nasce um quinto resultado de exclusão, ou ausência passa a valer menos que MÉDIA | varredura exaustiva das 15 células |
| **B-02** O Motor não cria conhecimento | Ele lê declarações; não busca nada | Arquitetura §2.3 (pureza), §4.1 | os dois motores | entra `new Date()`, `Math.random()`, `fetch`, `process.env`, cliente de banco, `await`, ou import de repositório/action/framework | leitura do código-fonte real |
| **B-03** Não ordena, não elimina, não suprime | A ordem é a do catálogo; nenhuma linha some | Congelamento I-1, §4.8; Arquitetura P-02 | `motor-compatibilidade.ts` | permutar a entrada muda a saída, ou surge campo de posição/índice | teste de permutação + inspeção de chaves |
| **B-04** Não pontua | A frase conta, não classifica | Congelamento §4.8; Arquitetura §4.4/§4.6 | `motor-compatibilidade.ts` | a frase de resumo ganha percentual ou adjetivo | varredura léxica sobre a saída |

### Grupo C — Derivação (`grupo-c-derivacao.test.ts`, 8 testes)

Guardas de **ausência**: a Camada de Derivação não existe e, sem ADR-A, não pode existir.

| Guarda | Objetivo | Princípio | Arquivos | Como falha | Como é detectada |
|---|---|---|---|---|---|
| **C-01** Nenhuma proposta persistida é **consumida** *(emendada em 2026-08-07; **evoluída no mesmo dia — Contrato §21.6**)* | A estrutura nasce inerte e **a string da tabela volta a ser proibida em TODO o `src/`, sem exceção**: o único conhecimento de `derivation_proposals` em runtime de aplicação vive **encapsulado na capability SQL** (`ler_proposta_para_proveniencia`) | P-08; Arquitetura §15.0; Contrato §21 | `src/**` · `supabase/migrations/**` | a tabela ganha policy/grant · um estado `PROPOSTA` é persistido · **qualquer módulo de `src/` menciona a tabela — comentários incluídos** | varredura do repositório, **lista de isenção zerada** |
| **C-01b** O leitor autorizado é read-only e não decisório *(1.8-R1)* | Autorizar não autoriza consumir; os nove verbos do §18.3 seguem proibidos ao autorizado | [`CONTRATO_1_8_R1.md`](CONTRATO_1_8_R1.md) §18, §21.6 | os arquivos de `LEITORES_DE_PROPOSTA_AUTORIZADOS` — a lista **mudou de sujeito**: nomeia quem pode **invocar a capability**, não quem pode tocar a tabela | o autorizado ganha `.insert`/`.update`/`.delete`/`.upsert`, RPC de escrita, emissão, seleção de regra, cálculo do Motor ou `export` de função de decisão | varredura dos arquivos da lista nominal — fonte única |
| **C-01c** O vínculo é ponteiro, nunca busca *(1.8-R1)* | `evidence_id` aponta a linha exata; **nenhuma resolução por `max(version)`** para fins de proveniência | Contrato §4; P-07 | repositório da cadeia · leitores de evidência | nasce um `order by version desc … limit 1` (ou equivalente) alimentando proveniência | varredura + oráculo v1×v2 do A1.1 |
| **C-01d** Cada capability tem um chamador só *(1.8-R1; evoluída em 2026-08-07 pelo 1.11; **evolução para quatro APROVADA — PENDENTE DE IMPLEMENTAÇÃO**, PA-12, 2026-08-08)* | Capabilities nominais com chamadores **distintos**: `ler_proposta_para_proveniencia` → `cadeia-de-proveniencia-repository.ts` · `contar_propostas_por_desfecho` (1.11) → `painel-de-discordancia-repository.ts` · **aprovada (CONTRATO_1_12 §14): `decidir_proposta`** (decisora, invocada pelo cliente autenticado do Curador). O conjunto SQL autorizado sobre a tabela passa a **quatro** funções — `{emissor (C-11) · leitora individual · leitora agregada · decisora (1.12)}` — um **quinto** nome derruba. **Implementado hoje: três**; a quarta entra com o pacote do 1.12 | Contrato 1.8 §21.7 · [`CONTRATO_1_11`](CONTRATO_1_11_PAINEL_DE_DISCORDANCIA.md) §10 · [`CONTRATO_1_12`](CONTRATO_1_12_MECANISMO_DE_DISCORDANCIA.md) §14 | `src/**` · `supabase/migrations/**` | um módulo fora da lista chama qualquer capability · chamador cruzado · nasce função fora do conjunto · **agregação por chamadas repetidas à individual** (§10.1) | detecção em **função pura**, falseável com entrada sintética |
| **C-02** Nenhum regime de bloco (**AC-BLOCO**) | O mecanismo não existe — nem atrás de feature flag | Arquitetura §5.4.0, §17.4 | `src/**` · migrations | surge `confirmarEmBloco`, `bulkConfirm`, `confirmarTodos`… | varredura de identificadores |
| **C-03** Filtro nunca é derivado | O filtro eliminatório é declarado item a item pelo Curador | Arquitetura §5.5, RS-07 | `repository.ts` (único escritor) | um segundo escritor aparece, ou o escritor passa a conhecer grau/`ESSENCIAL` | detector de escrita por cadeia `from(...)` |
| **C-04** A derivação autorizada não persiste | `deriveRelationalState` (ADR-065) é leitura, nunca escrita | Arquitetura §2.3, §15.0 | `motor-relacional.ts` | a derivação ganha `insert/upsert/update/delete` ou cliente de banco | leitura do fonte + varredura |

### Grupo D — Fronteira (`grupo-d-fronteira.test.ts`, 6 testes)

A Fronteira Humana completa só é testável quando a Derivação existir. Estas guardas
protegem a **metade que já existe**.

| Guarda | Objetivo | Princípio | Arquivos | Como falha | Como é detectada |
|---|---|---|---|---|---|
| **D-01** Uma origem por fato *(evolução **APROVADA — PENDENTE DE IMPLEMENTAÇÃO**, PA-12, 2026-08-08)* | Cada entrada do Motor tem escritor **nominal e fechado**. Vigente hoje: um por Mapa. **Aprovado pelo CONTRATO_1_12 §14:** `case_priority_map` passa a **dois** escritores nominais — `mapa-prioridades-repository.ts` (declaração manual) · `decidir_proposta` (declaração por confirmação). **Restrição vinculante: os dois caminhos aplicam validações equivalentes; divergência de validação é defeito** (guarda G-7 do contrato). O Mapa do Profissional permanece com um só | P-07; Arquitetura §4.2; CONTRATO_1_12 §14–§15 | `mapa-prioridades-repository.ts` · `mapa-profissional-repository.ts` · *(futuro)* `decidir_proposta` | um escritor fora da lista nominal grava um Mapa · validações divergem entre os dois caminhos | detector de escrita por cadeia `from(...)` + varredura de funções SQL |
| **D-02** Separação física (AC-PIPELINE antecipado) | Quem lê não importa quem escreve, e vice-versa | Arquitetura §17.4, §2.3 | motores puros e os dois repositórios | um import cruza a fronteira | análise de imports |
| **D-03** Leitura nunca é persistida | A leitura é recalculada sempre | Arquitetura §2.3 | `src/**` · contrato da leitura | nasce gravação de resultado ou campo `id`/`created_at` no contrato | varredura + inspeção de chaves |

### Grupo E — Explicabilidade (`grupo-e-explicabilidade.test.ts`, 21 testes)

E-01 a E-04 protegem a **primitiva** de que toda explicação depende. **E-05, E-06 e
E-07 nasceram com o Item 1.8** (`c3242ea`, 12 testes) e protegem a Ficha em si.

> **Ressalva de 2026-08-07.** O grupo E **não** cobre o §11.4: o `c3242ea` está
> `CONCLUÍDO PARCIALMENTE` e o ramo estado da proveniência não existe na Ficha.
> Fechar isso é o `1.8-R1` — ver [`CONTRATO_1_8_R1.md`](CONTRATO_1_8_R1.md).

| Guarda | Objetivo | Princípio | Arquivos | Como falha | Como é detectada |
|---|---|---|---|---|---|
| **E-01** A lacuna sobrevive à leitura | "Ninguém olhou" ≠ "olharam e não souberam" | Congelamento I-8; Arquitetura §4.3, P-04 | `motor-compatibilidade.ts` | `status: null` é colapsado em `NAO_INFORMADO`, ou o contador separado some | comparação das duas leituras |
| **E-02** Nenhuma frase conclui qualidade | O Motor organiza; quem conclui é pessoa | Congelamento I-9; Arquitetura §11.5 | motor + rótulos de estado | um texto ganha "melhor", "garantido", "recomendado" | varredura léxica |
| **E-03** Nenhum texto de reserva | Erro é erro; não vira explicação | Arquitetura §17.4 AC-EXPLICA item 6 | motor + rótulos | surge "informação indisponível", traço, vazio | varredura léxica |
| **E-04** O vocabulário do Motor não alcança a paciente | A fronteira de linguagem é mecânica | Congelamento I-5; Arquitetura §11.5 | `paciente/experiencia.ts` | "motor", "cruzamento", "score", "ranking" deixam de ser barrados | `violatesPatientVocabulary` |
| **E-05** A Ficha é derivada — nada dela é persistido *(1.8)* | Explicação é leitura, nunca fato novo | Arquitetura §11.0; A5 | `ficha-de-explicacao.ts` · `-vocabulario.ts` | nasce `insert`/`upsert`/`update`/`delete`, banco, React, relógio, cache, snapshot, migration ou tabela | varredura das duas fontes + ausência de migration no pacote |
| **E-06** AC-PIPELINE — ninguém explica por fora do leitor oficial *(1.8)* | Uma explicação, uma fonte | Arquitetura §17.4 AC-PIPELINE | superfícies · adaptadores dos três vocabulários | uma superfície remonta as seis respostas por conta própria, ou o adaptador da paciente passa a conhecer regra/versão/proposta | análise de imports + varredura |
| **E-07** A confiança é qualitativa, e não vira ordem *(1.8)* | Arquitetura §11.3 — cinco proibições | `ficha-de-explicacao.ts` | a confiança vira número, percentual, contagem, ou é usada para ordenar/agrupar/comparar | estados fechados + varredura de uso |

### Grupo F — Governança (`grupo-f-governanca.test.ts`, 6 testes)

| Guarda | Objetivo | Princípio | Arquivos | Como falha | Como é detectada |
|---|---|---|---|---|---|
| **F-01** Participação sempre declarada | Nenhum conceito circula sem decisão de Motor; os quatro `NUNCA` são pinados | Congelamento §4.3; Arquitetura §4.3 item 2 | `evidencias-pratica.ts` | um conceito nasce sem decisão, ou a lista de `NUNCA` muda | leitura do catálogo executável |
| **F-02** O catálogo não muda em silêncio *(corrigida em F-01A)* | **Recomputa** o hash a partir do conteúdo real e compara com o declarado; verifica a vigência única de versão | Congelamento §2; I-3 | `catalogo-gerado.ts` · algoritmo de `scripts/gerar-catalogo-ts.mjs` | alguém edita `catalogo-gerado.ts` à mão sem regenerar | `sha256(JSON.stringify(CATALOGO_GERADO))` ≠ `CATALOGO_GERADO_HASH` |
| **F-03** *(caracterização, não guarda)* | Produzir a evidência executável do achado P15 para a decisão **DP-1** | — | motor · repositório do motor · `mesa-cruzamento.ts` | **falha quando alguém implementar a guarda A4** — que é exatamente o sinal desejado | teste de estado atual |

### Guardas do Item 1.A — **APROVADAS, PENDENTES DE IMPLEMENTAÇÃO** (PA-13, 2026-08-08)

Lavradas no [`CONTRATO_1_A`](CONTRATO_1_A_FUNCAO_PURA_DERIVACAO_MAPA_PROFISSIONAL.md) §13;
**nenhuma está implementada** — entram com o pacote técnico do 1.A.

| Guarda | Objetivo | Cai se |
|---|---|---|
| **G-1** Pureza | a função é pura por contrato | importar supabase/repository/cliente · `Date.now()`/random · env/sessão/auth · escrita · singleton mutável |
| **G-2** Zero chamadores | nenhum consumidor de produção | import operacional em `src/` (app, actions, routes, repositories, components) — **testes excluídos da varredura** |
| **G-3** P-04/I-8 — **do vazio, nada se afirma** | entrada sem evidência jamais produz `PROPOSTO` | sem evidência → estado · conceito sem regra → `PROPOSTO` · fallback/default de estado · inferência por ausência · coerção de `null`/`undefined` · heurística não lavrada |
| **G-4** Semântica ad hoc proibida | conteúdo só por regra versionada | nasce tradução literal opção→estado em TS/SQL (padrão C-12) |
| **G-5** Fronteira com 2.C | nenhuma ativação operacional | o módulo menciona tabela, capability, Fronteira ou emissor · ganha caminho de persistência/apresentação |

---

## 2. Achados — estado após a retificação F-01A

> **Retificação F-01A (2026-08-04),** determinada pela verificação independente do
> Agente 04. Dois achados foram **reclassificados** de "questão de domínio" para
> **dívida documental**, e um foi **removido** da base oficial por estar errado. As
> demais conclusões permanecem intactas.

| # | Achado | Classificação | Evidência | Encaminhamento |
|---|---|---|---|---|
| **F-01/01** | O domínio tem **29 conceitos ativos**; documentos anteriores dizem 28 | **DÍVIDA DOCUMENTAL** *(reclassificado)* | **ADR-065** (2026-08-03) institui a Compatibilidade Relacional e declara `MODELO_CONDUCAO_DE_NOTICIAS_DIFICEIS` como "a única adição"; a migration `20260803100000_catalogo_1_1_0_leitura_relacional.sql` diz literalmente *"Insere o 29º conceito"*. Banco e código concordam em **29** | **Atualizar os documentos para 29.** Desatualizados: `CONGELAMENTO_ARQUITETURAL.md` §2/§4.1 (de 2026-08-01, **anterior** à ADR-065), a Auditoria e a Arquitetura §2.6/§17.1 (A7). **Não existe** a alternativa de reconciliar o código para 28 — desfaria uma ADR aprovada |
| **F-01/02** | A versão vigente do catálogo é **1.1.0**; o Congelamento nomeia 1.0.0 | **DÍVIDA DOCUMENTAL** *(reclassificado)* | ADR-065 §4 ("coluna `satisfied_by` … catálogo, migration 1.1.0"); migration `20260803100000` §5 ("vigência única 1.1.0"); `CATALOGO_VERSAO === "1.1.0"` | Mesma atualização: o Congelamento (2026-08-01) é anterior à ADR-065 (2026-08-03). Documento desatualizado, não divergência de domínio |
| **F-01/03** | **P15 confirmado: o Motor cruza conceito marcado `NUNCA`** | **MANTIDO — questão de domínio aberta** | `grupo-f-governanca.test.ts` → F-03: os quatro conceitos `NUNCA` produzem `ALTA_COMPATIBILIDADE` quando declarados dos dois lados | **DP-1.** A correção (guarda no Motor **ou** correção do Congelamento §4.3) é decisão do Arquiteto e do Guardião |
| ~~**F-01/04**~~ | ~~"Três contagens do mesmo domínio: 26 · 28 · 29"~~ | **REMOVIDO — o achado estava errado** | A verificação do Agente 04 demonstrou que **banco e código têm 29 conceitos ativos**. O número **26** pertence exclusivamente à migration histórica `20260728010000_mapa_de_prioridades_do_case.sql`, superada pelo Catálogo 1.0.0 e pelo 1.1.0 | **Não integra mais a base de conhecimento.** Fica registrado aqui apenas como **fato histórico**: 26 foi o estado do catálogo em 2026-07-28 e **não descreve o sistema atual** |

---

## 3. O que este pacote **não** fez

- **Não corrigiu P15.** Colocar a guarda no Motor mudaria comportamento de componente
  congelado (ADR-041) e resolveria sozinho uma decisão reservada ao Arquiteto e ao
  Guardião (§18 da Arquitetura, DP-1).
- **Não criou** Motor, derivação, Fronteira Humana, explicabilidade, fluxo, banco, campo,
  critério, peso, API de negócio nem interface — todos expressamente proibidos pela missão.
- **Não alterou nenhuma linha de código de produto.** `git diff` sobre `src/`, `supabase/`
  e `package.json` é vazio.
- **Não cobriu** o que ainda não existe: AC-EXPLICA integral, AC-PIPELINE integral e os
  nove elementos da Fronteira Humana só serão testáveis nas Ondas 1.8–1.12 e 2.C.

## 4. Rollback

Cada guarda é um bloco `describe` isolado; cada grupo é um arquivo. Reverter é **apagar o
arquivo ou o bloco** — nenhum comportamento do sistema muda, porque nenhuma guarda é
consumida por código de produto. A rastreabilidade não se perde: os achados do §2
permanecem neste documento mesmo que as guardas sejam removidas.

## 5. Evidência de execução

**Pacote F-01 (2026-08-04):** 53 testes verdes · suíte unitária 1835 verdes · typecheck limpo.

**Pacote F-01A — retificação (2026-08-04):**

```
npx vitest run tests/unit/guardas-curadoria-2-0   → 6 arquivos, 55 testes, 55 passaram
npx vitest run                                     → 147 arquivos, 1837 passaram, 1 todo
npx tsc --noEmit                                   → limpo
```

**Prova de falseabilidade** (executada em arquivo temporário, depois removido — não faz
parte das guardas):

| Guarda | Mutação aplicada | Resultado |
|---|---|---|
| **F-02** | um espaço acrescentado à descrição do primeiro conceito | hash recomputado **difere** do declarado → a guarda falharia |
| **A-01** | busca de um código inventado (`MODELO_CONCEITO_QUE_NAO_EXISTE`) nas migrations | **não encontrado**, enquanto um código real **é** encontrado → o detector distingue, não afirma tautologia |

---

## 6. Registro da retificação F-01A

**Origem:** verificação independente do Agente 04. **Escopo:** fechado nos sete itens
determinados. Nenhuma guarda nova, nenhum conceito novo, nenhuma alteração de arquitetura,
domínio, critérios, princípios ou comportamento do sistema.

### 6.1 O que mudou

| Item | Ação | Resultado |
|---|---|---|
| 1 | **Achado F-01/04 removido** da base oficial | os "26 conceitos" são fato histórico da migration `20260728010000`; **não descrevem o estado atual** |
| 2 | **F-01/01 reclassificado** | de questão de domínio → **dívida documental da ADR-065**, com origem, ADR, migration e documentos desatualizados nomeados |
| 3 | **F-01/02 reclassificado** | idem, para a versão 1.1.0 do catálogo |
| 4 | **Guarda F-02 corrigida** | deixou de comparar um literal consigo mesmo; passa a **recomputar** o hash do conteúdo |
| 5 | **Teste tautológico eliminado** | a comparação `PRACTICE_CATALOG` × `SUBCRITERION_CATALOG` (ambos derivados do mesmo array) deu lugar à verificação contra as **migrations** |
| 6 | Este registro atualizado | §2, §5 e §6 |
| 7 | Documentação do próprio pacote atualizada | índice, registro de governança, mapa dos pacotes |

### 6.2 Proteções reais, hoje

Edição manual do catálogo · conceito no código sem migration correspondente · troca de
origem do 29º conceito · alteração de contagens, células, níveis, estados e resultados ·
agregação/soma das leituras · impureza do Motor · ordenação e supressão · nascimento da
Camada de Derivação sem ADR · regime de bloco · segundo escritor em qualquer entrada do
Motor · persistência de leitura · colapso da distinção lacuna/não-informado · frase que
conclui qualidade · texto de reserva · vazamento de vocabulário para a paciente.

### 6.3 Proteções que dependem de pacotes futuros

| Proteção | Depende de |
|---|---|
| Paridade catálogo × **banco vivo** | já existe em `tests/remediacao/paridade-catalogo.integration.test.ts` (suíte de integração, exige banco) |
| **AC-EXPLICA** integral | Ficha de Explicação — Onda 1.8 |
| **AC-PIPELINE** integral | Camada de Derivação — Onda 2 |
| Os **nove elementos** da Fronteira Humana | Onda 2.C |
| Guarda **A4** (conceito `NUNCA` fora do cruzamento) | **DP-1** |

### 6.4 Limitações conhecidas

- As guardas dos grupos **C** e **D** usam análise textual do código-fonte: um caminho
  suficientemente indireto (reexportação, indireção dinâmica) escapa. Limitação do método,
  declarada, não corrigida neste pacote.
- **F-02 não prova paridade com o banco** — e não deve: essa é a camada da suíte de
  integração. A guarda diz exatamente o que protege e o que não protege.
- **A-01 verifica presença**, não conteúdo: um conceito cujo texto divergisse entre código
  e migration passaria. O conteúdo é coberto pelo hash (F-02) contra edição manual, e pela
  paridade de integração contra o banco.
