# Proposta de Correspondência — os três conceitos HÍBRIDOS do eixo ACESSO

| Campo | Valor |
|---|---|
| **Objeto** | Propor o `satisfied_by` de `ACESSO_MODALIDADE`, `ACESSO_DISPONIBILIDADE` e `ACESSO_PRAZO_PARA_CONSULTA` |
| **Autoridade aprovadora** | **`DT-01` — Fundador / Autoridade de Método.** Nada aqui vale sem lavratura |
| **Status** | 🟡 **PROPOSTA — não lavrada, não implementada, nenhuma migration escrita** |
| **Redação** | Agente, 2026-08-31, na auditoria do Motor |
| **Origem** | `CLASSIFICACAO_DOS_NOVE_AUTOMATICOS.md` (08/08) §4 classificou os três como HÍBRIDO e registrou: *"precisam de `satisfied_by`/faixa de correspondência para funcionar… **É pauta própria**"*. Esta é a pauta |
| **Dependência de ADR** | **Sim.** `motor-relacional.ts` fixa `RELATIONAL_AXIS = "MODELO_DE_ATENDIMENTO"` (ADR-065). Os três são de **ACESSO**: habilitá-los **emenda a ADR-065**, não preenche dado |

---

## 1 · Por que estes três, e não os outros

Dos nove conceitos `automatico`, o documento de 08/08 separou por natureza. Três
são **PAIRWISE** e já têm regra (Como explica, Acompanhantes, Alternativas), dois
vão pelo caminho do **estado absoluto** (Coordenação, Equipe de apoio), um é
**Concierge operacional** e saiu por decisão do DT-01 (Canais).

Sobraram estes três, e o motivo de serem híbridos é uma frase só, do §4:

> *"O estado `CONFIRMADO/NAO_CONFIRMADO` não tem significado absoluto. Todo
> profissional atende em algum formato, em alguma janela, com algum prazo —
> 'confirmado' só significa algo contra **o que esta pessoa precisa**."*

É exatamente a definição de correspondência. Por isso `satisfied_by`.

---

## 2 · Três buracos de mecanismo, antes das correspondências

**Nenhuma das três propostas abaixo funciona hoje**, e não é por falta de dado.
Montá-las expôs três limites do motor relacional. **O segundo é o mais grave, e
eu não o tinha visto na auditoria.**

### 2.1 · A agregação é E, e a Disponibilidade precisa de OU

O motor fecha o estado assim:

```js
const state = matches.some((m) => !m.satisfied) ? "NAO_CONFIRMADO" : "CONFIRMADO";
```

**Toda opção que ela marcou precisa ser satisfeita.** É a conjunção — e está
certa para os três conceitos que existem hoje: quem pede explicação sem jargão
**e** algo escrito quer as duas coisas.

**Disponibilidade é disjunção.** Ela marca as janelas em que *consegue* ser
atendida — manhã, tarde e sábado. Basta o profissional atender **uma**. Com a
regra atual, o médico que atende só de manhã sairia `NAO_CONFIRMADO` para
alguém que pode de manhã.

**Modalidade tem o mesmo risco** se ela marcar "preciso remoto" e "prefiro
presencial" — combinação estranha, mas o campo é múltipla escolha.

**Isto não se resolve com `satisfied_by`.** Exige que o Catálogo declare a
agregação por conceito (`E` / `OU`) e que o motor a leia. **É a decisão de
Método que vem antes de todas as correspondências abaixo.**

### 2.2 · Faixa não é lista

`ATE_15_DIAS` é satisfeito por `ATE_7_DIAS` e `DE_8_A_15_DIAS`. Dá para
enumerar — e a enumeração é o problema: **é uma ordem escrita dentro de uma
lista.** No dia em que alguém inserir `DE_61_A_90_DIAS`, toda regra que deveria
incluí-la continua válida, silenciosa e errada. É o parente do `SIM-73`
(renumerar quebra referência) aplicado a intervalos.

A alternativa honesta é o Catálogo declarar o conceito como **ordinal**, com a
posição de cada opção, e o motor comparar posição. **Decisão do DT-01.**

### 2.3 · O detalhe livre não é lido por motor nenhum

Três opções do profissional pedem detalhe em texto: `PRIMEIRA_REMOTA_CONDICIONADA`
(*sob qual condição?*), `HIBRIDO_CONFORME_O_CASO` e `VARIA_CONFORME_O_CASO`.
**O que elas satisfazem depende do que está escrito ali**, e o motor não lê
texto — por P14, e está certo.

Duas saídas, as duas legítimas: tratá-las como **nunca satisfazendo** (leitura
conservadora, o Curador decide olhando), ou como **`AGUARDA_JUIZO_DO_CURADOR`**
naquele conceito. **Decisão do DT-01.** As propostas abaixo assumem a primeira e
marcam onde isso pesa.

---

## 3 · `ACESSO_MODALIDADE` — a mais limpa das três

*"Como você consegue ser atendida?"* × *"Em quais formatos você atende hoje?"*

| Opção dela | `satisfied_by` proposto | Nota |
|---|---|---|
| `PRECISO_REMOTO` | `REMOTO` | **Só ele.** "Preciso" é impossibilidade de ir; `PRIMEIRA_PRESENCIAL_RETORNOS_REMOTOS` exige uma ida presencial e **não serve** |
| `PREFIRO_REMOTO` | `REMOTO`, `PRIMEIRA_PRESENCIAL_RETORNOS_REMOTOS` | Preferência: qualquer arranjo que ofereça remoto em algum momento |
| `PRECISO_PRESENCIAL` | `PRESENCIAL`, `PRIMEIRA_PRESENCIAL_RETORNOS_REMOTOS` | **Ver o alerta abaixo** |
| `PREFIRO_PRESENCIAL` | `PRESENCIAL`, `PRIMEIRA_PRESENCIAL_RETORNOS_REMOTOS` | |
| `TANTO_FAZ` | `*` | Qualquer formato serve |
| `NAO_SEI_INFORMAR` | *(sem regra)* | **Ver §5** |

> **Alerta em `PRECISO_PRESENCIAL`.** Se ela *precisa* de presencial e ele faz
> a primeira presencial com retornos remotos, a primeira consulta serve e os
> retornos não. **O motor não tem "satisfaz em parte"** — só satisfaz ou não.
> Incluir produz um `CONFIRMADO` que esconde metade; excluir produz um
> `NAO_CONFIRMADO` que exagera. **Recomendo incluir e registrar a ressalva**,
> porque a alternativa reprova um profissional que atende a primeira consulta
> exatamente como ela precisa — mas é decisão de Método, não minha.

---

## 4 · `ACESSO_DISPONIBILIDADE` — trivial no dado, travada no mecanismo

Os códigos dos dois lados são **idênticos** nas cinco janelas. A correspondência
é a identidade, mais uma:

| Opção dela | `satisfied_by` proposto |
|---|---|
| `MANHA_DIAS_UTEIS` | `MANHA_DIAS_UTEIS`, `SOB_AGENDAMENTO_ESPECIFICO` |
| `TARDE_DIAS_UTEIS` | `TARDE_DIAS_UTEIS`, `SOB_AGENDAMENTO_ESPECIFICO` |
| `NOITE_APOS_18H` | `NOITE_APOS_18H`, `SOB_AGENDAMENTO_ESPECIFICO` |
| `SABADO` | `SABADO`, `SOB_AGENDAMENTO_ESPECIFICO` |
| `DOMINGO_OU_FERIADO` | `DOMINGO_OU_FERIADO`, `SOB_AGENDAMENTO_ESPECIFICO` |

**`SOB_AGENDAMENTO_ESPECIFICO` entra em todas** porque é a declaração de que ele
acomoda fora das janelas habituais — é o `*` do lado dele, que o mecanismo não
sabe expressar de outro jeito.

**Este conceito não pode ser habilitado antes do §2.1.** Sem a disjunção, ele
produz o oposto do que deveria em quase todo caso real.

---

## 5 · `ACESSO_PRAZO_PARA_CONSULTA` — cumulativa, e frágil por enumeração

| Opção dela | `satisfied_by` proposto |
|---|---|
| `ATE_7_DIAS` | `ATE_7_DIAS` |
| `ATE_15_DIAS` | `ATE_7_DIAS`, `DE_8_A_15_DIAS` |
| `ATE_30_DIAS` | `ATE_7_DIAS`, `DE_8_A_15_DIAS`, `DE_16_A_30_DIAS` |
| `SEM_URGENCIA_DECLARADA` | *(sem regra)* |
| — | `DE_31_A_60_DIAS` e `MAIS_DE_60_DIAS` **não são satisfação de nada** |

**As duas faixas lentas dele não têm contraparte dela** — é o `SIM-69`, e aqui
ele vira consequência prática: o profissional que demora mais de 30 dias sai
`NAO_CONFIRMADO` para qualquer pessoa que tenha declarado prazo, **inclusive
para quem esperaria dois meses sem problema e não teve como dizer isso.**
Consertar exige mexer na pergunta dela, o que é pauta do `SIM-69`.

`VARIA_CONFORME_O_CASO` cai no §2.3.

---

## 6 · As opções que não pedem nada

`NAO_SEI_INFORMAR` (Modalidade) e `SEM_URGENCIA_DECLARADA` (Prazo) **não são
pedidos** — são a ausência de restrição. Com o conserto do `SIM-74`, opção sem
regra deixa de produzir `ALTA_COMPATIBILIDADE` por vacuidade e passa a produzir
`NAO_RELEVANTE`.

Para `SEM_URGENCIA_DECLARADA` isso é claramente certo: ela não pediu prazo.

**Para `NAO_SEI_INFORMAR` é discutível**, e a diferença importa: *"não sei"* não
é *"não me importa"*. As três leituras possíveis são `NAO_RELEVANTE` (o que
acontece hoje), `LACUNA_DE_INFORMACAO` (que culparia o profissional por uma
incerteza dela — recomendo **não**), ou tirar o conceito do cruzamento como se
ela não tivesse respondido. **Decisão do DT-01.**

---

## 7 · O que eu recomendo, e a ordem

1. **Decidir a agregação por conceito (§2.1).** É o bloqueador. Sem ela,
   Disponibilidade sai errada e Modalidade sai frágil.
2. **Decidir ordinal vs enumeração (§2.2)** antes de escrever qualquer faixa.
3. **Só então** lavrar as correspondências, uma ADR por conceito, no rito da
   ADR-070: ficha, nascimento em `PROPOSTA`, promoção a `VIGENTE` por ato.
4. **E depois da primeira Curadoria real**, não antes — porque os três conceitos
   que **já** têm regra nunca produziram uma célula para uma pessoa de verdade,
   e um deles carregava o defeito do `SIM-74` desde que foi escrito.

**O que esta ficha não faz, de propósito:** não escreve migration, não altera o
Catálogo e não emenda a ADR-065. Propor é do agente; lavrar é do DT-01.
