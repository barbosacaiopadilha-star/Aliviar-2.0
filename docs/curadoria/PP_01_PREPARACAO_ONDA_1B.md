# PP-01 — Preparação da Onda 1B

| Campo | Valor |
|---|---|
| **Identificador** | **PP-01** |
| **Versão** | v1.0 |
| **Autor** | Agente 02 — Arquiteto da Curadoria 2.0 |
| **Data de emissão** | 2026-08-04 · **HEAD na emissão:** `1599390` |
| **Data de versionamento** | 2026-08-04 (pacote DOC-01B) |
| **Estado** | **Parecer arquitetural emitido** — encaminhado ao DT-01 |
| **Natureza** | Preparação de programa. **Não altera domínio, arquitetura, ADR ou guarda** |
| **Decisão** | **ONDA 1B PARCIALMENTE LIBERADA** |
| **Origem** | Missão PP-01 — resposta ao veredito "ONDA 1B BLOQUEADA" do Programa de Engenharia |

> **Nota de versionamento (DOC-01B).** Este documento **reproduz fielmente** o
> parecer PP-01 emitido na missão homônima. Nenhuma decisão foi acrescentada,
> nenhuma conclusão reinterpretada, nenhuma ressalva removida. O parecer havia
> sido emitido apenas como resultado de missão — a missão PP-01 proibia alterar
> documentos, e a ressalva **R-5** registrou essa tensão com o **P-01**. O pacote
> DOC-01B fecha exatamente essa pendência.
>
> **Nenhum código, banco, migration, teste ou item foi tocado**, na emissão ou no
> versionamento.

---

## 1. Resumo executivo

**Correção prévia registrada na emissão:** em missão anterior o Arquiteto
registrou que o corpus da 2.0 havia desaparecido da árvore. **Estava errado
quanto à permanência** — o corpus foi recuperado e commitado (`8453e90`), as
ADR-066/067/068 estão lavradas, e os itens 1.3 a 1.7 foram mergeados. O alarme
foi retirado no próprio parecer.

Sobre os três bloqueios estruturais: **dois são reais e um não existe.**

| # | Bloqueio alegado | Veredito |
|---|---|---|
| **1** | DP-1 é a raiz do grafo | **Real, mas superdeclarado.** O `MAPA_DOS_PACOTES` encadeia toda a Onda 1B em `1.8 → 1.1 → DP-1`. Somente **1.8 e 1.A** dependem de DP-1. **1.9, 1.10 e 1.11 não dependem** |
| **2** | 1.9 e 1.10 exigem autoria inexistente | **Real e confirmado.** `case_priority_map` e `professional_subcriterion_map` **não têm nenhuma coluna de autoria** — apenas `created_at` / `updated_at` |
| **3** | 1.8, 1.10 e 1.12 × guarda C-01 | **Não existe contradição.** Apenas **1.12** precisa de `derivation_proposals`, e 1.12 está na onda errada. **1.8 e 1.10 não precisam da tabela** |

**A tese do parecer:**

> A Onda 1B não está bloqueada por três muros. Está bloqueada por **um grafo mal
> declarado**. Corrigido o grafo e criada uma migration mínima de autoria,
> **quatro dos seis itens abrem sem tocar DP-1 e sem afrouxar guarda nenhuma**.

---

## 2. Diagnóstico dos três bloqueios

### 2.1 · DP-1 — por que continua sendo a raiz

**Porque o mapa a declarou como tal, item por item:**

```
1.8 → 1.1 → DP-1     1.9 → 1.8     1.10 → 1.9     1.11 → 1.8     1.12 → 1.11     1.A → 1.1
```

Uma cadeia linear em que **tudo** pende de 1.8, e 1.8 de DP-1. Cada aresta foi
examinada:

| Item | Depende de DP-1? | Análise |
|---|---|---|
| **1.A** | **SIM** | A função pura precisa saber o que fazer com `MOTOR_PARTICIPATION: "NUNCA"` (`evidencias-pratica.ts:107`). Sem o veredito, o contrato nasce indefinido |
| **1.8** | **SIM, parcialmente** | A Ficha responde *"quais critérios NÃO influenciaram — (a) fora do Motor por Método"*. Se o código contraria o Congelamento §4.3, a resposta muda com o veredito. **AC-EXPLICA é tudo-ou-nada**: não há como entregar a Ficha sem a pergunta 4 |
| **1.9** | **NÃO** | Cadeia de proveniência rastreia **origem**, não participação no Motor. Depende de **autoria**, não de DP-1 |
| **1.10** | **NÃO** | Duas colunas mostram o que ela declarou × como foi traduzido. Depende de **autoria** |
| **1.11** | **NÃO** | Painel vazio não consulta o Motor |
| **1.12** | **NÃO** | Depende da camada de derivação (Onda 2) |

**Erro de aresta encontrado — `1.9 → 1.8` está invertida.** A cadeia de
proveniência é **dado**; a Ficha é **superfície que a consome**. Dado precede
apresentação. O mesmo vale para `1.10 → 1.9`: o reconhecimento em duas colunas
precisa da autoria, não da Ficha.

> **Resposta:** existe subescopo independente de DP-1 — **1.9, 1.10 e 1.11**.

### 2.2 · Migration de autoria

**CONFIRMADO no DDL:**

```sql
-- 20260728010000_mapa_de_prioridades_do_case.sql:78
create table curadoria.case_priority_map (
  id, case_id, subcriterion_id, importance, created_at, updated_at  -- sem autoria
);
-- 20260728020000_mapa_do_profissional.sql:41
create table curadoria.professional_subcriterion_map (
  id, professional_profile_id, subcriterion_id, status, note, created_at, updated_at  -- sem autoria
);
```

| Pergunta | Resposta |
|---|---|
| **Quais tabelas realmente precisam?** | **Exatamente duas** — `case_priority_map` (ramo da importância) e `professional_subcriterion_map` (ramo do estado). São os dois ramos da árvore do §11.4 da Arquitetura. Nenhuma outra: `consultation_records` já tem `curator_id NOT NULL`; `criterion_declarations` e `priority_profile_filters` já registram autor |
| **Menor contrato possível** | **Uma coluna por tabela: `declared_by` → `profiles(id)`, NULLABLE.** O "quando" já existe (`created_at` / `updated_at`) |
| **Por que nullable** | Linhas existentes **não têm autor conhecido**. `NOT NULL` exigiria backfill, e inventar proveniência retroativa é proibido (R-05 da Arquitetura). **`null` significa, explicitamente, "digitação anterior ao regime de autoria"** — e a superfície deve dizê-lo, não escondê-lo |
| **Onda 1B ou pré-pacote?** | **PRÉ-PACOTE.** Três razões: é migration (janela de publicação própria); mistura de escopo com itens de superfície é proibida; e **destrava dois itens de uma vez**, independentemente de DP-1 |

### 2.3 · `derivation_proposals` × C-01 — demonstração documental

**C-01 declara o próprio gatilho** (`tests/unit/guardas-curadoria-2-0/grupo-c-derivacao.test.ts:17-18`):

> *"impedir que `derivation_proposals` nasça **antes da ADR-A e das dez
> dependências do §15.0**"*

E assere três ausências absolutas:

| # | Asserção | Alcance |
|---|---|---|
| 1 | `derivation_proposals` não existe **em migration nenhuma** | **a infraestrutura** |
| 2 | nenhum módulo conhece `derivation_proposals` \| `derivationProposal` | o código |
| 3 | nenhum módulo persiste `PROPOSTA` como estado de domínio | o comportamento |

> **Resposta formal:** **não há espaço entre infraestrutura e utilização.** A
> asserção 1 alcança a própria migration. **Criar infraestrutura sem
> comportamento falharia C-01 exatamente igual.** A guarda é deliberadamente
> absoluta, e está certa: uma tabela criada "só para ter" é a Camada de Derivação
> nascendo sem fronteira humana.

**Mas a contradição alegada não existe**, porque os itens não precisam da tabela:

| Item | Precisa de `derivation_proposals`? | Por quê |
|---|---|---|
| **1.8** Ficha | **NÃO** | Na Onda 1 **não existem propostas** — 1.A é inerte. A Ficha explica **leituras**. A explicação de proposta nasce junto com a proposta, na Onda 2 |
| **1.10** Duas colunas | **NÃO** | No regime atual a importância é **declarada diretamente**. A coluna 2 diz *"declarado por [Curador] em [data]"* — precisa de **autoria**, não de proposta |
| **1.12** Discordância | **SIM** | Discordar exige algo de que discordar. **Sem propostas, 1.12 não tem objeto** |

> ### Conclusão do bloqueio 3: não é conflito entre guarda e item. É um item na onda errada.
>
> **1.12 pertence à Onda 2**, imediatamente após `2.1` (`derivation_proposals`).
> Movê-lo dissolve o bloqueio **sem tocar C-01**.

### 2.4 · Reconciliação

**Não existe interpretação que permita criar infraestrutura sem violar C-01 — e
não é necessária.** Não se registra "exige nova decisão arquitetural" porque a
necessidade desaparece com o ressequenciamento.

**Achado adicional para 1.A:** C-01 asserção 3 bloqueia `\bPROPOSTA\b\s*[:=]`. A
função pura de 1.A **não pode usar o literal `PROPOSTA`** como valor atribuído,
sob pena de derrubar a guarda. Restrição de nomenclatura, não de desenho — e o
Implementador precisa sabê-la antes, não descobri-la no vermelho.

---

## 3. Grafo de dependências corrigido

```
                    ┌─────────────────────────────────────────────┐
                    │  PP-01 (este parecer) — ressequenciamento    │
                    └───────────────┬─────────────────────────────┘
                                    │ ratificação DT-01
              ┌─────────────────────┴──────────────────────┐
              ▼                                            ▼
     ┌────────────────┐                          ┌──────────────────┐
     │ 0.1 · DP-1     │                          │ PP-A · autoria   │
     │ (decisão)      │                          │ nos dois Mapas   │
     └───────┬────────┘                          └────────┬─────────┘
             ▼                                            │
     ┌────────────────┐                    ┌──────────────┴───────────┐
     │ 1.1 guarda     │                    ▼                          ▼
     └───┬────────┬───┘            ┌──────────────┐         ┌──────────────┐
         │        │                │ 1.9 cadeia   │         │ 1.10 duas    │
         ▼        ▼                │ proveniência │         │ colunas      │
   ┌─────────┐ ┌──────────┐        └──────┬───────┘         └──────────────┘
   │ 1.A     │ │ 1.8      │◀──────────────┘  (dado precede superfície)
   │ pura    │ │ Ficha    │
   └─────────┘ └──────────┘

   ┌──────────────┐
   │ 1.11 painel  │   ← sem dependência (ver ressalva R-3)
   │ vazio        │
   └──────────────┘

   ┌──────────────┐
   │ 1.12         │   ← MOVIDO PARA A ONDA 2, após 2.1
   └──────────────┘
```

**Arestas corrigidas:** `1.9 → 1.8` **invertida** · `1.10 → 1.9` **substituída**
por `1.10 → PP-A` · `1.11 → 1.8` **removida** · `1.12` **realocado**.

---

## 4. Programa Preparatório

| # | Pré-pacote | Natureza | Justificativa | Depende de |
|---|---|---|---|---|
| **PP-01** | **Ressequenciamento formal da Onda 1B** | documental | Sem ele, o grafo errado continua bloqueando itens que não têm bloqueio real. **Custo zero, destrava três itens** | — |
| **PP-A** | **Autoria nos dois Mapas** (`declared_by` nullable) | **migration** | Único caminho para 1.9 e 1.10. Isolado em pacote próprio porque migration tem janela e rollback próprios | PP-01 |
| **0.1** | **Veredito DP-1** (já existe no mapa) | decisão | Raiz real de 1.1 → 1.8 e 1.A. A **evidência já existe** (caracterização F-03 do pacote F-01); falta a decisão humana | — |

**Ordem ótima:** `PP-01` (imediato, sem custo) → `PP-A` (janela de publicação) →
em paralelo, `0.1` a qualquer momento, por ser decisão e não código.

**Restrição herdada:** PP-A é migration e **não é publicável** sem janela
autorizada para DDL em produção. Isso não impede começar — impede publicar.

> **Nota de execução, registrada no versionamento:** o pré-pacote nomeado **PP-A**
> neste parecer foi executado sob o identificador **PP-02** (`89c4225` —
> *"feat(proveniencia): autoria nos dois mapas do Motor (PP-02)"*). **Registro de
> correspondência, não alteração do parecer.**

---

## 5. Critérios de desbloqueio

| Bloqueio | O que precisa existir |
|---|---|
| **1 · DP-1** | **Para 1.9 / 1.10 / 1.11: nada** — o bloqueio não se aplica; basta ratificar o grafo. **Para 1.8 e 1.A:** veredito escrito de DP-1, sem ambiguidade (guarda executável **ou** correção do Congelamento §4.3), e depois 1.1 verde |
| **2 · Autoria** | PP-A aplicado: `declared_by` nullable nas duas tabelas · superfície declarando `null` como "anterior ao regime de autoria" · **nenhum backfill** |
| **3 · C-01** | **Nada a fazer na guarda.** Basta mover 1.12 para depois de 2.1. **C-01 permanece vermelha e correta** — deve continuar assim até a ADR-A **e** as dez dependências existirem |

---

## 6. Sequência ótima

| Fase | O quê | Bloqueio? |
|---|---|---|
| **1** | PP-01 ratificado pelo DT-01 | nenhum |
| **2** | PP-A — autoria nos dois Mapas | janela de publicação |
| **3** | **1.9** cadeia de proveniência · **1.10** duas colunas — **em paralelo, sem DP-1** | nenhum após PP-A |
| **4** | **1.11** painel vazio — com aceite redefinido (R-3) | nenhum |
| **5** | 0.1 · DP-1 → 1.1 → **1.8** e **1.A** em paralelo | decisão humana |
| **6** | Onda 1B fechada; **1.12** entra na Onda 2, após 2.1 | — |

---

## 7. Ressalvas

| # | Ressalva | Ação |
|---|---|---|
| **R-1** | O ressequenciamento **corrige o `MAPA_DOS_PACOTES` e o §15 da Arquitetura**. Não foram alterados — a missão PP-01 proibia. Precisa de ato próprio após ratificação | DT-01 |
| **R-2** | **1.12 sai da Onda 1.** Alteração de escopo de onda, não do Arquiteto para decidir sozinho | DT-01 |
| **R-3** | **1.11 tem aceite inverificável hoje:** o critério O6 exige "taxa observável por conceito e por versão de regra", e não há regras. Propõe-se aceite em duas partes — Onda 1: *"o painel existe e declara 'nenhuma regra em vigor'"*; Onda 2: O6 pleno | DT-01 |
| **R-4** | **Restrição de nomenclatura para 1.A:** não usar o literal `PROPOSTA` como valor atribuído, sob pena de derrubar C-01 asserção 3 | registrar na missão do item |
| **R-5** | **Este parecer não estava versionado.** A missão PP-01 proibia alterar documentos, então nenhum arquivo foi criado — mas um parecer que só existe em conversa é exatamente o que o **P-01** proíbe, e foi o que travou o Item 1.5 duas vezes. Recomendou-se autorizar a materialização como `PP_01_PREPARACAO_ONDA_1B.md` | **ATENDIDA pelo pacote DOC-01B** |

---

## DECISÃO

# **ONDA 1B PARCIALMENTE LIBERADA**

**Liberáveis sem DP-1 e sem tocar guarda alguma:** **1.9**, **1.10** (após PP-A) e
**1.11** (com aceite redefinido).

**Permanecem bloqueados por DP-1:** **1.8** e **1.A** — bloqueio legítimo, decisão
humana pendente desde o pacote F-01.

**Sai da onda:** **1.12** — não estava bloqueado, estava na onda errada.

**C-01 permanece ativa, vermelha e correta.** Nenhuma guarda foi afrouxada,
nenhum domínio alterado, nenhuma ADR tocada.

---

*Fim do PP-01. Nenhum item foi aberto, nenhum código escrito, nenhum documento
normativo alterado. Encaminhamento da emissão: **DT-01**.*
