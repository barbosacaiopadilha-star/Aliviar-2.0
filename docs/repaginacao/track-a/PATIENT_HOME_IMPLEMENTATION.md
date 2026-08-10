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

### 8.6 · Adendo · os fundos arquitetônicos originais

A A3b tinha acertado a paleta e errado o essencial: **o edifício sumia no
login**. Não por falta de asset — por tratamento.

**Auditoria (nenhuma imagem nova foi criada):**

| asset | onde a landing usa | onde a paciente usa |
|---|---|---|
| `public/scenes/recepcao-bright.jpg` | hero editorial (`ImmersiveBackdrop scene="landingHero" imageOpacity={62}`) | hero da Home em `CONSULTA_INICIAL` |
| `public/scenes/grand-finale.jpg` | bandas `LandingSection variant="warm"` (`imageOpacity={16}`) | **campo da página inteira** + hero em `DOSSIE` |
| `cena-2-recepcao-proxima` · `cena-3-corredor` · `cena-4-transicao` · `cena-5-quadro-planta` · `cena-6-detalhe` | `portal-scenes.ts` | hero, por etapa (`STAGE_AMBIENCES`) |

Ou seja: **os assets já eram os mesmos** — `ambiente.ts` e a landing puxam do
mesmo conjunto desde sempre. O que havia de errado:

1. **A camada atmosférica era feita à mão.** Três `div`s com gradiente próprio,
   imagem a **0.22** sob véu de 90–96%: arquitetura que existe no DOM e não
   existe na tela. Substituída pelo **`ImmersiveBackdrop`** — o mesmo
   componente da landing, que já trazia a variante `patient-intimate` e que
   esta casa **nunca havia usado**. Havia uma segunda linguagem de ambiente
   para a mesma marca.
2. **A cena do campo era um detalhe fechado** (`patientStudy` =
   `cena-6-detalhe`, uma mesa de trabalho). Pertence ao conjunto, mas não é
   *reconhecível* como o lugar da landing. Passou a ser **`landingAtrium`
   (`grand-finale.jpg`)** — o salão que a landing usa nas próprias bandas.
3. **O hero estava a 0.4** sob véu de 88–96%. Foi para **0.62**, o número
   exato do hero da landing, e o véu ganhou a mesma curva (denso onde o texto
   começa, aberto no meio).

**Opacidades — herdadas, não escolhidas:**

| superfície | valor | de onde vem |
|---|---|---|
| campo da página | **16%** | `LandingSection` |
| hero | **62%** | `hero-editorial` |

O campo foi testado a 30% e **recuado**: o salão aparecia atrás do corpo do
texto — a régua sobre o piso de madeira, o nome do Curador sobre um banco. O
§7 do adendo é explícito quanto a texto sem contraste, e legibilidade não se
troca por atmosfera. A 16% o lugar continua reconhecível.

**Crops:** a mesma imagem, `object-cover`, `sizes="100vw"`. Desktop mostra o
salão em largura; mobile mostra o recorte central da mesma foto. Nenhum
ambiente diferente inventado por viewport.

**Artefato de captura:** a camada é `position: fixed` — ela acompanha a
viewport, como um lugar em que se está parado. Na captura `fullPage` isso
produz uma emenda na altura da viewport (~900px), onde a arquitetura termina.
**Não é o que a paciente vê** ao rolar.

### 8.7 · MASTER-0 · o fundo de outro edifício saiu

**Decisão de DT-01:** a imagem de referência enviada por ele é o **Master
Visual oficial**. A landing implementada **não** é fonte de verdade visual.

A auditoria de assets (§4/§5 da missão MASTER) mostrou que **os arquivos do
Master Visual não existem neste workspace** — procurados em `public/`, no
histórico completo (`--diff-filter=D`), em 15+ branches, nos worktrees e nos
cinco repositórios irmãos, working tree e histórico git. A referência mostra
outro edifício: travertino bege, parede de pedra com o logotipo gravado no
lockup que inclui "· CONCIERGE", piso de pedra. O que o repositório tem é uma
recepção em mármore branco/rosado, com placa acrílica e piso de madeira.

E dentro dessa auditoria, um erro meu:

> **`grand-finale.jpg` não é o edifício da Aliviar.** É um apartamento vazio
> genérico — luz fria, armários escuros, piso laminado, radiador, janela
> europeia. Eu a coloquei atrás da casa inteira da paciente porque o código a
> chamava de `landingAtrium` e ela estava nas bandas da landing. **Nunca abri o
> arquivo.**

**MASTER-0 reverteu exatamente isso**, e só isso: a cena da camada atmosférica
volta a `patientStudy` (`cena-6-detalhe.jpg`), o estado imediatamente anterior,
confirmado em `18d5a04`.

| | valor | natureza |
|---|---|---|
| cena | `patientStudy` = `cena-6-detalhe.jpg` | **fallback temporário** do edifício Aliviar existente |
| componente | `ImmersiveBackdrop` · `patient-intimate` | preservado — é o da landing |
| opacidade | 16% | preservada, teto de legibilidade |

O fallback **não corresponde ao Master Visual** e não deve ser lido como tal.

### 8.8 · MASTER-0B · o último resquício sai da experiência da paciente

A MASTER-0 tirou o prédio alheio do campo da Home e deixou registrado que ele
**voltava a aparecer no hero da etapa DOSSIE**. A MASTER-0B fecha isso.

| | antes | depois |
|---|---|---|
| cena do `DOSSIE` | `grand-finale.jpg` (edifício alheio) | `recepcao.jpg` — **fallback temporário** |
| `sceneDescription` | "Um ambiente amplo e aberto…" | "A recepção da Aliviar, ampla e clara…" |

**A descrição mudou junto, e isso não é detalhe.** Ela é o que chega a quem usa
leitor de tela: mantê-la descreveria uma fotografia que a etapa não usa mais —
a interface passaria a mentir exatamente para quem não pode conferir.

**Por que `recepcao.jpg`:** é o único asset Aliviar já auditado que estava
**ocioso**. Qualquer outro tiraria a cena de uma etapa vizinha. **O custo está
registrado:** ele é quase idêntico ao de `CONSULTA_INICIAL`, então a jornada
perde, por ora, a distinção visual entre a chegada e o Relatório. O conjunto
Aliviar existente **não tem** um "ambiente amplo e aberto" — quem tinha era o
prédio alheio.

**FALLBACK TEMPORÁRIO — aguarda pacote arquitetônico oficial do Master Visual.**

**Guardas** (`tests/unit/paciente-ambiente.test.ts`), com prova de perda:

1. nenhuma etapa da jornada usa o asset alheio — por **arquivo**, não por
   etapa, para que uma etapa nova que o adotasse não passe despercebida;
2. nenhum arquivo de `src/{modules,components,app}/paciente` o referencia, com
   comentários removidos antes da varredura — estes arquivos o **citam** para
   explicar por que ele saiu, e explicação não é uso;
3. o fallback aponta para uma imagem que existe.

Devolver `grand-finale.jpg` ao `DOSSIE` derruba as três.

**Oráculo corrigido:** `paciente-experiencia.test.tsx` fixava a frase
"ambiente amplo e aberto" à mão. Passou a ler `ambienceFor("DOSSIE")` — o que o
teste protege é o par *cena escondida × descrição presente*, não a redação.

**Consumidor restante, fora da experiência da paciente:**
`landingAtrium` → `editorial-sections.tsx:151,205` (bandas "warm" da landing).
O §3 da MASTER-0 proíbe tocar a landing. **Registrado, não alterado.**

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
