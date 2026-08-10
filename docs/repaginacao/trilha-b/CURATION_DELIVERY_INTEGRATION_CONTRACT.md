# Trilha B → Trilha A · contrato de entrega

**Decisão de produto (5A):** três fatos independentes. **Nenhum implica o outro.**

| fato | prova o quê | NÃO prova |
|---|---|---|
| `emittedAt` | a Curadoria foi preparada **dentro** da Aliviar | que ela viu · que ela recebeu |
| `presentedAt` | houve conversa em que os caminhos foram apresentados | que o conteúdo digital foi liberado |
| **`deliveredAt`** | **o conteúdo digital foi disponibilizado a ela** | — é o único que prova isto |

`deliveredAt` **nunca** é inferido de reunião, emissão, seleção, `closed_at` ou
`statusLabel`.

## Como a Jornada representa

| marco | completa por | frase |
|---|---|---|
| **DOSSIE** (*"Dossiê preparado"*) | `emittedAt` | *"{Curador} preparou seu Dossiê…"* — e só com `deliveredAt` vira *"…está **disponível para você**"* |
| **REUNIAO** | `presentedAt` | *"{Curador} apresentou as três opções…"* — independente da entrega |

O marco mede **preparação**, e é isso que o nome dele sempre disse. O que
mudou foi a frase: ela afirmava disponibilidade que a emissão não sustenta.

**O estado legítimo que isto sustenta:** preparado + apresentado + não
entregue. A régua reconhece os dois fatos que aconteceram, sem afirmar o
terceiro. A fixture certificada que o representa **não foi alterada**.

## O que cada superfície deve usar

| superfície | fato | dono |
|---|---|---|
| **Home** (macroestado) | `deliveredAt`, via `lerEstado()` da Fundação | Trilha A — **já correto** |
| **Central de Documentos** | `deliveredAt` — relatório emitido e não entregue **não aparece** | Trilha A |
| **Minha Curadoria** | `deliveredAt` — `loadPatientCuradoria` já exige, em duas verificações | Trilha B |
| **Jornada** | `emittedAt` e `presentedAt` para os marcos; `deliveredAt` para disponibilidade | Trilha B |

## O que a Trilha A precisa fazer

**Nada no código.** A Home já lê `delivered_at` pelo caminho seguro
(`loadPatientCuradoria`), então ela nunca esteve errada quanto a isto.

**Na evidência 4A:** ao capturar os EV-A1-*, o estado *"aguardando"* deve usar
uma fixture com `emittedAt` **sem** `deliveredAt` — é o cenário em que a Home e
a Jornada mais podiam divergir, e agora não divergem. Nenhuma captura anterior
precisa ser refeita, porque nenhuma foi produzida ainda.
