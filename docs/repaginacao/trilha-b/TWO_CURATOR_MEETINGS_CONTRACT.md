# Os dois encontros com o Curador — mapeamento aos fatos reais

> **Nada aqui foi inventado.** Cada marco aponta para uma coluna que já existe.
> Onde não existe fato, está escrito que não existe.

| marco | objetivo | responsável | fato real | quem registra | paciente vê | próximo | gap |
|---|---|---|---|---|---|---|---|
| **História** | ela conta o que vive | Curador | `patient_stories.submitted_at` | a paciente | sim | 1º encontro | — |
| **1º ENCONTRO — alinhamento** | apresentar método, construir e validar o que importa | **Curador** | `historia.understandingConfirmedAt` (reconhecimento) + `validacao.validatedAt` (Perfil) | Curador | sim | Curadoria | ⚠️ **não há fato do encontro em si** — só dos seus produtos |
| **Curadoria em elaboração** | análise, evidências, juízos, composição | **Curador** | `curadoriaTecnica.selectedProfessionalIds` | Curador | sim | preparação | — |
| **Curadoria preparada** | relatório pronto **internamente** | **Curador** | `relatorio.emittedAt` | Curador | sim, como preparação | 2º encontro | — |
| **Entrega digital** | conteúdo disponível a ela | **Curador** | `relatorio.deliveredAt` | Curador | sim | — | — |
| **2º ENCONTRO — entrega** | apresentar caminhos, esclarecer, conduzir a decisão | **Curador** | `devolutiva.presentedAt` | Curador | sim | decisão | — |
| **Decisão** | qual caminho seguir | **Curador conduz** | `devolutiva.decision` (`outcome`, `chosenProfessionalId`, `decidedAt`) | Curador | sim | handoff | — |
| **Handoff → Concierge** | próximos passos operacionais | **Concierge** | **derivado** de `devolutiva.decision` | ninguém — é derivação | sim | acompanhamento | ⚠️ **não há fato próprio de handoff** |

## Os quatro fatos, e o que cada um NÃO prova

```
emittedAt    → preparada dentro da Aliviar   ✗ não prova entrega, encontro nem decisão
presentedAt  → houve o 2º encontro           ✗ não prova entrega digital nem decisão
deliveredAt  → conteúdo digital disponível   ✗ não prova encontro nem decisão
decision     → decisão registrada            → único que autoriza o handoff
```

## Dois gaps, ambos documentados e nenhum fabricado

**GAP-1 · o 1º encontro não tem fato próprio.** Existem os **produtos** dele
(`understandingConfirmedAt`, `validatedAt`), não o evento. Hoje é possível
dizer *"o Perfil foi reconhecido"*; não é possível dizer *"o encontro
aconteceu em tal data"*. Para a régua atual isso basta — o marco mede o
produto. Registrar o encontro exigiria coluna nova.

**GAP-2 · o handoff não tem fato próprio.** É derivado de `decision`, e a
derivação é suficiente e correta: sem decisão, Curador; com decisão de caminho
escolhido, Concierge. Um `handed_off_at` explícito só passa a ser necessário se
o handoff puder acontecer **sem** decisão, ou demorar depois dela.

**Nenhum dos dois foi implementado.** Ambos exigiriam migration.
