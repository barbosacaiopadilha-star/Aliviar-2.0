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

## 5 · Divergência registrada — e resolvida na A3a.1

**`/sua-historia` × `/sua-historia/continuar`.** A A3a seguiu a projeção, como o
§6 daquela missão exigia, e com isso o CTA de `HISTORIA_NAO_INICIADA` apontava
para `/sua-historia` — a fachada pública — enquanto o resto da casa padronizou
`/sua-historia/continuar`.

**Decisão de DT-01 (A3a.1):** na Home autenticada, iniciar e continuar levam ao
mesmo lugar — a entrada autenticada do wizard. A A2B já havia estabelecido a
semântica: `/sua-historia` é a página pública explicativa; `/continuar` exige
paciente, veste o `PatientShell` e resolve a história ativa, criando a primeira
quando não existe nenhuma.

A correção foi feita **na fonte** (`derivePatientPending`), não na UI —
`ProximaAcao` continua com `href={cta.href}` e sem nenhum `if` de rota. A página
pública segue existindo, pública e separada. Detalhe em
[§7 abaixo](#7--a3a1--o-destino-da-história) e nas guardas de
`tests/unit/patient-next-action.test.ts`.

---

## 7 · A3a.1 · o destino da História

| | antes | depois |
|---|---|---|
| `HISTORIA_NAO_INICIADA` | `/sua-historia` | **`/sua-historia/continuar`** |
| `HISTORIA_EM_PREENCHIMENTO` | `/sua-historia/continuar` | inalterado |

Começar e retomar passam a ser o mesmo destino, porque para a paciente são o
mesmo ato: entrar na própria história. Quem nunca escreveu nada não é mandado
para uma página que explica o que ela já decidiu fazer.

### Ocorrências auditadas de `/sua-historia`

| ocorrência | classe | ação |
|---|---|---|
| 6 links da Landing (`hero-editorial`, `editorial-sections`, `hero-experience`, `public-footer`, `portal-frames`, `final-actions`) | **A** — porta pública de quem ainda não entrou | preservados |
| `public-footer-gate.tsx:23` | **A** — teste de prefixo, não destino | preservado |
| `public-paths.ts:24` | **A** — a declaração da rota pública | preservada |
| `next-action.ts:100` (`HISTORIA_NAO_INICIADA`) | **B** — ação autenticada | **corrigido** |
| `next-action.ts:219` (`patientStageHref("CONSULTA_INICIAL")`) | ver abaixo | não alterado |

**`patientStageHref` não tem consumidor de produção.** A régua da Home usa
`WALK_HREFS` (`experiencia.ts`), que **não** mapeia `CONSULTA_INICIAL` — logo
`/sua-historia` nunca chega à tela por esse caminho. `patientStageHref` é a
projeção anterior, hoje exercitada só por teste, e seu contrato é de **leitura**
("nenhuma delas reinicia fluxo"), não de iniciar História. Alterá-la seria mexer
em código sem usuário, fora do objeto único da A3a.1.

**Fica como achado:** ou ela ganha consumidor e o destino é revisto junto, ou é
removida. Decisão de DT-01.

---

## 8 · A3b · repaginação visual e continuidade com a recepção

**Master visual:** a landing oficial da Aliviar. A regra que a governa não é
"parecer bonito", é **continuidade**: quem faz login deve sentir que atravessou
uma porta, não que abriu outro software.

### 8.1 · Estrutura

| | ANTES | DEPOIS |
|---|---|---|
| 1 | `AmbientHero` (saudação + etapa) | `AmbientHero` + **macroestado do contrato** |
| 2 | `ProximaAcao` | `ProximaAcao` (comportamento intocado) |
| 3 | `JourneyWalk` | **`QuemAcompanha`** — novo |
| 4 | `MeuResumo` | `JourneyWalk` |
| 5 | grade 2 col: `ProfileCard` + `CuradoriaCard` | `MeuResumo` |
| 6 | `QuickLinks` | `ProfileCard` · `CuradoriaCard` (em fluxo) |

### 8.2 · Redundâncias eliminadas

**1 · A mesma frase, dois blocos de distância.** Quando nada aguarda a
paciente, `derivePatientPending` usa a descrição da etapa atual como *"o que
acontece depois"* — **a mesma string** que a régua exibia logo abaixo. Estava
visível na captura BEFORE: *"Curador Teste vai ouvir sua história inteira antes
de organizar qualquer coisa."*, duas vezes. Agora a régua cala quando
coincidem; o topo responde *o que acontece agora*, a régua responde *onde isso
fica no percurso*.

**2 · `QuickLinks` era uma segunda barra de navegação.** Seus quatro destinos já
estão no menu do `PatientShell`, presente em toda a casa. Removido. **Nenhum
destino foi perdido** — inclusive `/paciente/linha-do-tempo`, que o `QuickLinks`
nem oferecia.

**3 · O eyebrow de etapa repetia a régua.** No lugar dele entrou
`leitura.rotuloPaciente` — o macroestado que a Home lia do contrato e **não
exibia em nenhum lugar do caminho com Caso**.

**4 · A grade de duas colunas** dava a Perfil e Curadoria o mesmo peso do estado
e da ação. Agora cada um recebe o peso que tem, em fluxo.

### 8.3 · Métricas objetivas (caminho com Caso)

| | ANTES | DEPOIS |
|---|---|---|
| superfícies com fundo/borda/sombra | 5 | **1** (só a cena do hero) |
| blocos principais | 6 | 7 (o responsável é novo) |
| CTAs primários possíveis | 2 | **1** |
| links secundários | 6 | **4** |
| molduras/bordas de caixa | 4 | **0** (só fios) |
| frases duplicadas | 1 | **0** |
| barras de navegação na página | 1 | **0** |
| overflow em 390/430/768/1440 | 0 | **0** |

Altura até a próxima ação (desktop, lida na captura): ~477px → ~506px. Ela
desceu ~30px de propósito — o respiro aumentou. Em 390px a posição é a mesma
(~462px) e o responsável, que **não tinha bloco nenhum**, aparece a ~745px no
desktop e ~755px no mobile.

### 8.4 · Continuidade — o que mudou de material

| | antes | depois |
|---|---|---|
| campo da página (`--patient-mist`) | `--color-bg-ambient` = 65% `indigo-50` — **cinza-azulado** | `--color-bg-canvas-warm` — **marfim** |
| véu atmosférico | terminava no frio | marfim do começo ao fim |
| topo (`PatientShell`) | `#ffffff` — branco de painel | marfim do campo |
| botão da ação | pílula própria | **`LinkButton`** — o mesmo da Aliviar pública |
| superfícies | cartão com sombra | faixa + fio |

O token compartilhado `--color-bg-ambient` **não foi tocado**: ele pertence à
narrativa cromática das seis casas. `--patient-mist` tinha um consumidor só — o
fundo da página desta casa. O azul permanece inteiro onde significa algo:
acento, avatar, links, botão, brilho.

**O topo do `PatientShell` foi alterado** (A2 é anterior a esta missão): a
faixa branca sobre marfim lia como barra de aplicativo. Está nas capturas
BEFORE/AFTER desta missão, e a suíte A2C segue verde.

### 8.5 · Gaps registrados

- **`ExpandableSection`** ("Como sua Curadoria é feita", "Conhecer meu Perfil")
  ainda usa pílula arredondada, mais SaaS que editorial. É componente
  compartilhado — fora do objeto da A3b.
- **`MeuResumo` diz "Você ainda não contou sua história"** num Caso cuja
  história foi enviada: ele lê `stories[0].data.historia`, e a história do seed
  tem esse campo vazio. **Não é da A3b** — é leitura de dado, não repaginação.
- **A4** segue pendente: Início × Linha do tempo.

---

## 6 · Zero domínio

Sem migration, coluna, enum, estado, derivação nova ou alteração de handoff.
`next-action.ts`, `jornada.ts` e `contrato-de-estado.ts` **não foram tocados**.
