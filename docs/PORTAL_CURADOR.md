# Portal do Curador — registro de implementação

**Estado**: em construção (MISSÃO 100 — ÉPICO 1). Dados de demonstração; sem integração com banco, autenticação ou serviço externo.

**O que é.** O ambiente onde acontece a Curadoria Aliviar. Não é um painel administrativo — é a ferramenta de trabalho de quem conduz conversas difíceis (`docs/EXPERIENCE_BIBLE.md` §3).

**Onde vive hoje.** Rota `/portal-curador`, aberta no middleware enquanto usa dados mockados. O `/curador` atual permanece intocado, exigindo autenticação real e lendo o banco. Quando a integração acontecer, este Portal assume `/curador` e a entrada em `PUBLIC_PREFIXES` sai.

**Regra de existência.** Nenhum componente existe para preencher espaço. Todo componente em `src/components/curadoria/` declara, no topo do arquivo, de qual documento canônico nasceu — e a suíte quebra se não declarar (`tests/unit/curadoria-portal-traceability.test.ts`).

---

## Convenção de rastreabilidade

Cada componente traz, no bloco de comentário inicial:

```
@metodo <Fonte> §<seção> — <por que este comportamento existe>
```

Fontes válidas e seus documentos:

| Fonte | Documento |
|---|---|
| `Fundamentos` / `Método` | [`FUNDAMENTOS_DO_METODO_ALIVIAR.md`](FUNDAMENTOS_DO_METODO_ALIVIAR.md) |
| `Ontologia` | [`ONTOLOGIA_CURADORIA_COMPARTILHADA.md`](ONTOLOGIA_CURADORIA_COMPARTILHADA.md) |
| `Experience` | [`EXPERIENCE_BIBLE.md`](EXPERIENCE_BIBLE.md) |
| `Engine` | [`CURATION_ENGINE_SPECIFICATION.md`](CURATION_ENGINE_SPECIFICATION.md) |

Além da anotação, cada componente responde em prosa a **"Por que existe"** e **"O que nunca faz"** — também verificado por teste.

---

## Módulos

| # | Módulo | Rota | Estado |
|---|---|---|---|
| 1 | Painel Inicial | `/portal-curador` | **Implementado** |
| 2 | Consulta Inicial | `/portal-curador/casos/[id]/consulta` | Pendente |
| 3 | Perfil de Prioridades | `/portal-curador/casos/[id]/consulta` | Pendente |
| 4 | Curadoria Técnica | `/portal-curador/casos/[id]/curadoria` | Pendente |
| 5 | Relatório | `/portal-curador/casos/[id]/relatorio` | Pendente |
| 6 | Entrega | `/portal-curador/casos/[id]/entrega` | Pendente |

---

## Módulo 1 — Painel Inicial

### Qual problema do Curador esta tela resolve?

> **"Eu tenho seis pessoas em andamento. Por onde eu começo agora?"**

A tela existe para responder essa única pergunta. Tudo que não ajuda a respondê-la ficou de fora.

### Decisões de método tomadas nesta tela

| Decisão | Origem |
|---|---|
| **Nenhuma métrica de produtividade** — sem total de casos, tempo médio, gráfico de volume ou "parado há N dias" | Experience §3 — "Nenhum painel de métricas. A pressa é inimiga direta do Método" |
| **Ordenação por quem precisa de você**, não por data: bloqueio → alerta → ação → aguardando | Experience §5 (UX3) e §3 |
| **Casos aguardando o paciente vão para o fim**, com rótulo "Acompanhar — sem cobrar" em vez de botão de ação | Experience §2.6 — insistência é vetor de indução |
| **Uma única próxima ação por caso**, nomeada pelo que faz | Experience §5 (UX1, UX3) |
| **Alertas carregam o código da exceção** (E-02, C-01) e nunca sugerem a resolução | Engine §9 e §4.5 — o Motor nomeia, quantifica e para |
| **Prazo aparece como "retorno combinado"**, nunca como contagem regressiva | Experience §2.4 e §5 (UX9) |
| **Atividades nomeiam o autor**, inclusive quando é o Sistema | Engine §5.6 — trilha sempre com autor e instante |
| **Saudação por nome, sem exclamação** | Brand — serena, acolhedora sem informalidade excessiva |

### O que deliberadamente **não** existe aqui

- Contador de casos concluídos no mês.
- Gráfico de qualquer espécie.
- Badge de "urgente".
- Ação em massa (selecionar vários casos).
- Busca — com seis casos, busca é ruído; entra quando o volume justificar.

---

## Componentes

Todos em `src/components/curadoria/`, desacoplados e reutilizáveis entre módulos.

| Componente | Responsabilidade | Usado em |
|---|---|---|
| `MethodStepper` | Indicar em qual das sete etapas do raciocínio o caso está. Variantes `compact` (cabeçalho de card) e `full` (topo de tela de trabalho). Nunca mostra percentual — voltar de etapa não é retrocesso. | M1, M2, M4 |
| `CaseAlert` | Exibir uma exceção nomeada do Motor, com código rastreável, descrição e severidade. Nunca sugere resolução. | M1, M4 |
| `CaseCard` | Resumir um caso no Painel com etapa, situação, pendências, alertas e a única próxima ação. | M1 |
| `ActivityFeed` | Listar eventos recentes do catálogo do Motor, sempre com autor nomeado. | M1 |

---

## Dados de demonstração

`src/modules/curadoria/portal/mock-data.ts` — seis casos cobrindo as sete etapas e as exceções que importam, inclusive as desconfortáveis:

- **caso-2029** dispara `E-02` (menos de três elegíveis) — o Portal precisa saber mostrar o Método se recusando a entregar algo mal fundamentado.
- **caso-2033** dispara `C-01` (empate) — o Motor não desempata.
- **caso-2038** tem um Perfil validado real, com nota de validação escrita como o Curador escreveria.
- **caso-2024** está com o paciente — testa a regra de não cobrar.

Os mocks obedecem aos invariantes da Ontologia, e isso é verificado por teste (`tests/unit/curadoria-portal-mock-data.test.ts`): peso sem evidência, Perfil validado que não soma 100, ou faixa incoerente com o score quebram a suíte. Um mock que viola o Método ensina o comportamento errado — e depois o código nasce para servir a tela.

---

## Verificações do Módulo 1

| Verificação | Resultado |
|---|---|
| `tsc --noEmit` | Sem erros nos arquivos novos |
| `next lint` | Sem avisos ou erros |
| Testes de unidade | 26 novos; suíte completa 700 passando |
| Console do navegador | Sem erros |
| Responsividade | Sem overflow horizontal em 375px e 1265px; cards empilham no mobile |
| Rastreabilidade | Todos os componentes com anotação `@metodo` válida (verificado por teste) |

---

## Pendências conhecidas

1. **Rotas de destino ainda não existem** — os botões do Painel apontam para `/casos/[id]/consulta`, `/curadoria`, `/relatorio` e `/entrega`, que chegam nos Módulos 2 a 6. Hoje resultam em 404.
2. **Sem navegação entre módulos** — o cabeçalho só volta ao Painel. A navegação lateral entra quando houver mais de uma tela para navegar.
3. **Sem estado de lista vazia** — um Curador sem nenhum caso ainda não tem tela. Entra com o Módulo 2.
4. **`prefers-reduced-motion`** — não há animação nesta tela, então nada a respeitar ainda; a regra passa a valer nos módulos com transição.
