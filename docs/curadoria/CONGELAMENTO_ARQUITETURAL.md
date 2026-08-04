# Congelamento Arquitetural da Curadoria

> **Data:** 2026-08-01 · **HEAD:** `f2904bc` · **Árvore:** limpa
> **Status:** arquitetura operacional **CONGELADA**. A partir deste documento, toda alteração é evolução da plataforma — nunca implementação do Método.
>
> ## ⚖️ Emenda de 2026-08-04 — Curadoria 2.0 (pacote A-01)
>
> Três decisões do Fundador, aprovadas constitucionalmente pelo Guardião e lavradas como **ADR-066**, **ADR-067** e **ADR-068**, tocam este documento. O registro está no **§5.1** (invariantes), **§5.2** (princípios promovidos) e **§4.9** (o que não mudou):
>
> 1. **A invariante I-10 foi reaberta em substância** — a distinção formal entre as escalas permanece; a correspondência declarada entre elas passa a existir. **Valores estáveis só após Cases reais.**
> 2. **P-07, P-08 e P-10 foram promovidos a princípios oficiais de domínio.**
> 3. **A RLS do Mapa do Profissional (§4.7 · ADR-040 item 6) NÃO foi reaberta** — examinada e mantida intacta.
>
> Nenhum outro item deste congelamento foi tocado. As oito garantias do §4 permanecem, e duas delas foram **reforçadas**.

## 1. Estado final da arquitetura

A cadeia de autoridade, do Método ao resultado, verificada no código:

```
Método → Catálogo Canônico 1.0.0 → Mapa de Prioridades (Case)
                                 → Mapa do Profissional
                                 → Motor de Compatibilidade → leitura
                                                             ↓
Base de Evidências de Prática (permanente) ────────→ o Curador decide
```

**Números do congelamento:** 61 migrations · 123 arquivos de teste unitário (1.632 testes) · 44 de componente (375) · 38 de integração (336, 1 skipped) · typecheck limpo.

Duas falhas conhecidas e não corrigidas, ambas ambientais: os dois testes do `env-guard` que exigem `.env.local` apontando para projeto hospedado. Não são regressão e não bloqueiam nada — dependem da restauração das credenciais.

## 2. Componentes CONGELADOS

Alteração exige **nova ADR**.

| Componente | Autoridade | Prova de integridade |
|---|---|---|
| **Motor de Compatibilidade** (`motor-compatibilidade.ts`) | ADR-041 | **zero commits** desde `d394fa3`; 15 células; 4 resultados |
| **Catálogo Canônico 1.0.0** | Catálogo congelado 2026-07-31 | 28 conceitos, eixos 4/5/5/12/2, guarda de coerência ativa |
| **Escala de importância** (5 níveis) | ADR-039 | única entrada do Motor pelo lado do Case |
| **Estados do Mapa do Profissional** (3) | ADR-040 | sem intermediários, sem adjetivo de qualidade |
| **Protocolos Oficiais** | Protocolos aprovados | Q1..Q28 e P1..P16, bijeção pinada por teste |
| **Append-only da Base** | migration `20260731220000` | UPDATE recusado até para o service role |
| **Separação Base × Case** | desta arquitetura | `practice_evidence` **não tem `case_id`** (zero ocorrências) |
| **RLS do Mapa do Profissional** | ADR-040 item 6 | permanece restrita ao interno, com teste |

## 3. Componentes ainda EVOLUTIVOS

Alteração livre, sem ADR, desde que não toque o congelado:

- **Superfícies e componentes de interface** — Mesa, portal do profissional, dashboards, textos de tela.
- **Identidade visual e linguagem de apresentação**, respeitando a gramática (nada de ranking, score, percentual ou juízo sobre pessoa).
- **Repositórios e camadas de carregamento** — foi o que permitiu corrigir o N+1 sem tocar regra.
- **Catálogo do banco (`method_subcriteria`)** — a virada para o 1.0.0 é evolução prevista e já sequenciada.
- **Cobertura de testes**.

## 4. O que NÃO pode mudar sem nova ADR

1. Número, nomes ou semântica dos **28 conceitos**.
2. As **15 células** da matriz, os **4 resultados**, os **5 níveis** de importância, os **3 estados** do profissional.
3. Quem entra no Motor: **viabilidade e preferências/restrições nunca entram**.
4. O caráter **append-only** e a **proveniência obrigatória** da Base.
5. A separação **Base (permanente) × Case (temporário)**.
6. A regra de que **autodeclaração nunca nasce verificada**.
7. A **RLS do Mapa do Profissional** (ADR-040 item 6).
8. A ausência de **score, ranking, ordenação e conclusão automática**.

## 5. Invariantes arquiteturais

Cada uma com guarda ativa na suíte:

**I-1.** O Motor organiza; não escolhe, não ordena, não elimina, não pontua.
**I-2.** A identidade de um conceito é o **código**, nunca o rótulo visível.
**I-3.** Existe **um** catálogo com autoridade sobre o Motor. Enquanto dois coexistem, a guarda de coerência impede deriva silenciosa.
**I-4.** **Evidência não conhece Case; Case não escreve na Base.** Dois Cases leem a mesma evidência e podem concluir o oposto.
**I-5.** **Governança ≠ Compatibilidade.** O estado da informação (verificada, vencida, divergente) nunca usa o vocabulário da correspondência (atende, não atende) — pinado por teste de componente.
**I-6.** **Resposta não é evidência verificada.** Verificar é ato humano assinado, vinculado a uma **versão específica**.
**I-7.** **Histórico é imutável.** Corrigir é gravar versão nova.
**I-8.** **Ausência de informação nunca vira ausência da característica.**
**I-9.** **Nenhuma frase automática conclui qualidade** nem promete que uma necessidade será atendida.
**I-10.** **Grau da pessoa ≠ importância do Case** — escalas sem valor em comum, e só a importância alcança o Motor. **⚠️ REABERTA EM SUBSTÂNCIA pela ADR-066 (2026-08-04) — ver §5.1.**
**I-11.** **Guarda de navegação não pode ser mais rígido que o domínio** que apresenta.
**I-12.** **O profissional lê o que é dele**; a governança sobre ele continua da operação.

## 5.1 Reabertura registrada — I-10 (ADR-066, 2026-08-04)

> **A criação de uma ponte versionada entre grau declarado pela pessoa e importância utilizada no Case reabre a invariante I-10 em substância, embora preserve a distinção formal entre as duas escalas.**

| O que permanece verdadeiro | O que deixa de ser verdadeiro |
|---|---|
| Os **domínios são disjuntos** — nenhum valor pertence às duas escalas | Que **não existe relação sistemática** entre elas |
| **Nenhuma igualdade** é afirmada entre valores | Que a tradução é sempre juízo particular daquele Curador |
| **Só a importância alcança o Motor** | Que **a origem da importância é opaca** — passa a ser rastreável |
| A conversão **nunca é automática** — exige ato humano registrado | Que **nenhuma conversão institucional existe** |

**Condições da reabertura, todas vinculantes:**

1. **Forma e governança decididas agora; valores estáveis só após Cases reais.** O critério 1 do §6 — necessidade observada em operação real — **não está satisfeito**, e a reabertura foi autorizada sob essa condição explícita.
2. Toda versão da tabela anterior à evidência operacional nasce **`PROVISÓRIA`**, com vigência limitada e revisão obrigatória.
3. **O teste `importancia-vs-grau.test.ts` não pode ser afrouxado, renomeado ou ter asserção relaxada** — ele protege a disjunção dos domínios, que continua verdadeira. Sua finalidade só muda pela própria ADR-066.
4. **Desligar a ponte é reversível sem perda de dado:** as confirmações feitas permanecem declarações humanas válidas; as propostas param de nascer.

**Nenhuma outra invariante foi reaberta.** I-1 a I-9, I-11 e I-12 permanecem íntegras — e a ADR-066 **reforça** I-6 e I-7, levando proveniência a onde hoje não há nenhuma.

## 5.2 Princípios promovidos a domínio (2026-08-04)

Aprovados pelo Fundador e lavrados na ADR-066:

| # | Princípio | Consequência |
|---|---|---|
| **P-07** | **Uma origem por fato.** Toda entrada do Motor tem exatamente uma fonte declarada, e essa fonte é sempre quem tem autoridade sobre o fato | elimina as duplicações R1, R3, R8 e R10 da auditoria |
| **P-08** | **Proposta nunca é declaração.** Nada entra no Motor sem confirmação humana registrada com autor e data | estrutura a Camada de Derivação e a Fronteira Humana |
| **P-10** | **Confirmar não pode ser mais barato que discordar** | contrato de superfície, verificável por teste |

**P-09** permanece como **contrato de proveniência** (extensão de I-6 e do `ProvenanceRef` já vigentes), não como princípio independente. **P-11** depende da ADR-067; **P-12** é princípio arquitetural, sem ADR.

## 5.3 O que foi examinado e **mantido** (2026-08-04)

| Item | Decisão |
|---|---|
| **§4.7 — RLS do Mapa do Profissional (ADR-040 item 6)** | **NÃO reaberta.** A ADR-068 §14.2 examinou a ampliação do recorte de escrita e a **recusou**: o gargalo é de carga, não de autoridade, e ampliar tornaria mais provável a coincidência entre quem confirma e quem julga. Escrita permanece `administrador`; leitura permanece `administrador` e `curador_medico`. **A pendência DP-9 fica respondida com "não ampliar"** |
| **§4.3 — viabilidade e preferências nunca entram no Motor** | mantido, e passa a ter **guarda executável** prevista (achado P15/RI8), pendente do veredito DP-1 |
| **§4.8 — ausência de score, ranking e ordenação** | mantido, e **reforçado**: a proposta de ordenar a leitura por prontidão da informação foi recusada por ser ranking por construção |
| **Todos os demais itens do §4** | intactos |

## 6. Critérios para reabrir uma decisão congelada

Reabrir exige, cumulativamente:

1. **Necessidade observada em operação real** — Case concreto, não hipótese. (A ADR-041 já fixou o gatilho para si: *"quando a experiência real mostrar que quatro estados são poucos ou demais"*.)
2. **Demonstração de que a decisão vigente causa dano** — à paciente, ao profissional ou à capacidade de explicar.
3. **Análise de impacto** sobre as invariantes desta lista.
4. **ADR nova** que não contradiga a Constituição, com plano de compatibilidade para dados existentes.
5. **Guarda de teste** que passe a proteger a decisão nova.

Não são motivo para reabrir: preferência estética, conveniência de implementação, ou "ficaria mais simples assim".

## 7. Pendências que acompanham o congelamento

Nenhuma é arquitetural; todas são de publicação ou operação:

1. **8 migrations locais não publicadas** e a **deriva do ledger de produção** (`20260731190334`) — o [PLANO_RECONCILIACAO_LEDGER.md](./PLANO_RECONCILIACAO_LEDGER.md) é pré-condição de qualquer deploy.
2. **Rede real inexistente** — zero profissionais reais em produção; a Curadoria não roda sem eles.
3. **`revalidateCaseSurfaces` sob suspeita**: revalida o caminho público (`/coa/curadoria`), mas a página renderizada é o destino do rewrite (`/portal-curador`). Risco de runtime, não de arquitetura.
4. **5 divergências de nome** entre catálogo e banco, declaradas e guardadas — resolvem-se na virada.
5. **`/curador/*`**: arquivos de página inalcançáveis (o redirect intercepta antes do roteamento).

## 8. Parecer

**Arquitetura aprovada para congelamento.** Nenhuma inconsistência restante foi encontrada nesta leitura final. As três correções mais recentes (auditoria arquitetural, governança alcançável, transparência) fecharam achados sem reabrir nenhuma decisão anterior: a única mudança em arquivo do Motor foi no repositório de carregamento (`Promise.all`), preservando a ordem de saída por construção.
