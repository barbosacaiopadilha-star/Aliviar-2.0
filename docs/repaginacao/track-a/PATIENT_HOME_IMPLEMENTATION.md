# A3a · Home da paciente — a próxima ação passa a existir na tela

**Base:** `bed4786` · branch `d9-primeiro-encontro`
**Objeto:** tornar visível a pendência que a Home já calculava.
**Fora de escopo:** repaginação da hierarquia (A3b) e consolidação Início ×
Linha do tempo (A4).

---

## 1 · O defeito

`derivePatientPending` (`src/modules/paciente/next-action.ts`) produz, para cada
estado, quatro coisas: **título**, **motivo**, **o que acontece depois** e
**destino** (ou a declaração explícita de que o ato acontece numa conversa).

A Home calculava isso na linha 102 e descartava. O único consumo era:

```tsx
aside={
  pending.kind === "action" && !pending.action.cta
    ? `Isso acontece na conversa com ${jornada.curatorName}.`
    : undefined
}
```

Duas consequências, e a segunda é a grave:

1. o consumo estava no **nível 4** da página, dentro do `CuradoriaCard`, num
   `<p>` de 14px abaixo da mensagem principal;
2. a condição era `!pending.action.cta` — ou seja, **toda pendência que tinha
   uma tela para ser resolvida era silenciada**. Justamente os casos em que
   havia o que fazer.

A pergunta *"preciso fazer alguma coisa agora?"* não tinha resposta na Home.

### Achado colateral — duas fontes, dois destinos para o mesmo ato

No caminho sem Case, quem oferecia a ação era `PatientHomeState`, que tem o
**seu próprio** switch de estado. Para `HISTORIA_NAO_INICIADA` os dois discordam:

| fonte | destino |
|---|---|
| `PatientHomeState` | `/sua-historia/continuar` |
| `derivePatientPending` | `/sua-historia` |

Dois motores decidindo a mesma coisa é exatamente o que a Fundação existe para
impedir. **Registrado, não arbitrado** — ver §5.

---

## 2 · O que mudou

Um componente novo, `ProximaAcao`
([proxima-acao.tsx](../../../src/components/paciente/experiencia/proxima-acao.tsx)),
e três pontos de consumo na Home.

`ProximaAcao` **não decide nada**: recebe `PatientPendingState` pronto e o
apresenta. Não há switch de etapa, mapa paralelo nem `deriveHomeAction` — a
fonte continua sendo `derivePatientPending`, e o destino do CTA é literalmente
`pending.action.cta.href`, nunca remontado na tela.

Duas formas, uma por `kind`:

| `kind` | papel visual | forma |
|---|---|---|
| `action` | `atencao` (falta ato humano) | título · motivo · **uma** ação principal · *"Depois disso: …"* |
| `nothing` | `neutro` (repouso, não erro) | mensagem · o que acontece depois · **nenhum botão** |

Quando a ação existe mas não tem tela (reconhecer o Perfil, combinar a
conversa), nenhum botão é inventado: o texto diz que acontece na conversa com o
Curador. A invariante da projeção — *ou há destino, ou está declarado que é
conversa* — atravessa até a tela.

### Posição

| | antes | depois |
|---|---|---|
| caminho **com Case** | — (descartada) | nível 2, entre `AmbientHero` e `JourneyWalk` |
| caminho **sem Case** | — (descartada) | nível 2, logo após `PatientHomeState` |

### Duplicação removida (§9)

- o `aside` derivado de `pending` **saiu** do `CuradoriaCard`. A prop continua
  existindo no componente — ele não é objeto desta missão;
- `PatientHomeState` ganhou `acaoEmOutroLugar` (padrão `false`). A Home declara
  que assumiu a apresentação da ação, e o componente para de repetir o botão. O
  **estado**, que é a responsabilidade dele, continua sendo dito.

O padrão `false` foi deliberado: o oráculo certificado de `PatientHomeState`
afirma que ele exibe a própria ação, e um padrão `true` o quebraria em silêncio.

---

## 3 · Métricas objetivas

| | antes | depois |
|---|---|---|
| consumos de `pending` na Home | 1 (condicional, nível 4) | 2 (um por caminho de render, nível 2) |
| pendências **com destino** exibidas | **0** | todas |
| apresentações simultâneas da mesma pendência (sem Case) | 2 (`PatientHomeState` + `MeuResumo`) | 1 + o link de resumo |
| ações principais no bloco de pendência | 0 ou 1 | exatamente 1 |
| overflow horizontal em 390/430/768/1440 | 0 | 0 |

O link *"Começar agora"* dentro de `MeuResumo` continua sendo uma terceira
menção ao mesmo ato. É um link de **resumo**, não a declaração da pendência, e
`MeuResumo` está explicitamente protegido pelo §24 desta missão — fica para a
**A3b**.

---

## 4 · Invariantes preservadas

| regra | como |
|---|---|
| **D-9** (§13) | `ProximaAcao` não lê `meetingHeldAt` nem qualquer fato do encontro. A etapa `REUNIAO` continua sem CTA e sem afirmar realização. |
| **ADR-042** (§14) | reconhecer o Perfil segue **sem** botão e **sem** exigir `meetingHeldAt != null` — a projeção decide, e ela não mudou. |
| **Entrega** (§15) | `CURADORIA_ENTREGUE` depende de `entregueEm` (`delivered_at`). `emittedAt ≠ presentedAt ≠ deliveredAt` intacto. |
| **Cancelamento** (§16) | `CASO_CANCELADO` → `kind: "nothing"` → nenhum CTA de fluxo ativo. Guarda dedicada. |
| **Responsabilidade** (§12) | inalterada. O `nothing` nomeia o responsável; o `action` sem tela nomeia o Curador da conversa. A ação não move responsabilidade. |
| **A1** (§19) | zero overflow medido nos quatro viewports, sem `overflow-x: hidden`. |

---

## 5 · Divergência registrada, não arbitrada

**`/sua-historia` × `/sua-historia/continuar`.** O §6 desta missão é explícito:
*"Não recriar href manualmente se `pending` já fornece o caminho."* Segui a
projeção. Para `HISTORIA_NAO_INICIADA` isso significa que o CTA aponta para
`/sua-historia` (a recepção), enquanto o resto da casa — `SECONDARY_LINKS`,
`PatientHomeState` e o oráculo certificado — padronizou `/sua-historia/continuar`
("abre a história EXISTENTE, no passo em que parou").

Para quem ainda não tem história nenhuma os dois destinos funcionam. **Não é
decisão de engenharia** qual das duas fontes está certa: é decisão de produto se
a recepção deve reaparecer para quem nunca escreveu nada. Enquanto não houver
decisão, a Home segue a projeção, que é a fonte declarada.

---

## 6 · Zero domínio

Sem migration, coluna, enum, estado, derivação nova ou alteração de handoff.
`next-action.ts`, `jornada.ts` e `contrato-de-estado.ts` **não foram tocados**.
