# Parecer A-4 — os sete "cards" da Curadoria Técnica

| Campo | Valor |
|---|---|
| **Versão** | v1.0 |
| **Autor** | Agente 02 — Arquiteto da Curadoria 2.0 |
| **Data** | 2026-08-09 |
| **Base** | `f477971` — ESSENCIAL e Rodadas 1, 2 e 3 certificadas |
| **Natureza** | arquitetura estrita de A-4. **Zero código** |
| **Decisão** | **DESCARTAR A-4 como especificada** — seu objeto não existe |

---

## A. Inventário — e a correção que ele impõe

Fui ao código verificar os sete cards. **Eles não são cards.**

Os sete títulos que a auditoria listou são **sete `<section className="mesa-aside__section">`** — e não estão na superfície de leitura, e sim no **painel de contexto lateral** (`aside`), passados ao `MesaShell` pela prop `contexto`.

**O CSS inteiro da classe é este:**

```css
.mesa-aside__section + .mesa-aside__section {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--mesa-line);
}
```

**Não há `border` em volta. Não há `background`. Não há `border-radius`, `box-shadow` nem caixa de padding.** Existe **um filete horizontal entre seções irmãs** — e nada mais. A primeira seção não tem sequer o filete.

> ### Isso já é exatamente a arquitetura editorial que o §11 desta missão pede.
>
> Título + conteúdo, separados por espaço e uma linha fina. **A-4 pediria para
> construir o que já está construído.**

E não é acidente: o CSS declara a doutrina duas linhas acima, para o irmão
`.mesa-bloco`:

> *"Grandes áreas, poucas bordas: separação por espaço e por uma linha fina,
> **nunca por cartão dentro de cartão**."*

**Verificação complementar: `<Card>` na página da Curadoria Técnica — zero
ocorrências.**

### De onde veio o número sete

**A responsabilidade é da minha auditoria.** A medição de densidade contou como
"card" qualquer `className` contendo `card`, `rounded-*…border`, `panel` **ou
`mesa-aside__section`**. Foi esse último termo que produziu *"sete cards"* — um
**artefato do meu regex**, não um achado da interface. A formulação seguinte,
*"sete cards e nenhuma ação"*, herdou o erro e o tornou plausível: seções de
contexto **realmente** não têm ação, porque são contexto.

## B. Matriz card por card — os sete

Nenhum é card. Todos têm o mesmo destino: **permanecer exatamente como estão.**

| # | Seção | Função | Ação? | Estado próprio? | Conteúdo autônomo? | Destino | Risco |
|---|---|---|---|---|---|---|---|
| 1 | **Investigação** | linha de investigação do Case | não | não | sim | **MANTER** | — |
| 2 | **Merece atenção** | pendências que pedem ato humano | não | **sim** — gramática de atenção certificada | sim | **MANTER** *(§13 desta missão)* | — |
| 3 | **O que suas declarações indicam** | leitura das declarações | não | não | sim | **MANTER** | — |
| 4 | **O caso** | identificação do Case | não | não | sim | **MANTER** | — |
| 5 | **Prioridades do Case** | Mapa de Prioridades | não | não | sim | **MANTER** | — |
| 6 | **Protocolo da Pessoa** | respostas do Protocolo | não | não | sim | **MANTER** | — |
| 7 | **Base de Evidências de Prática** | evidências dos profissionais | não | não | sim | **MANTER** | — |

**Aplicando o §35 — teste de perda:** *"o que desaparece além da borda,
background, radius e padding?"* **Não há borda, background, radius nem padding
para remover.** O teste não tem objeto.

**Aplicando o §36 — teste de confusão:** já resolvido pelo filete + `1.5rem` de
respiro + `<h2>` por seção. Remover o filete **criaria** a confusão que A-4
queria evitar.

**Aplicando o §5:** *"se eu remover a moldura visual, a relação continua
clara?"* — **a moldura visual não existe.**

## C. Cards funcionais

**Nenhum dos sete.** São seções editoriais de contexto.

**Mas a #2, *Merece atenção*, tem estado próprio** — carrega a gramática de
atenção certificada em E-2/S-1. Ainda que A-4 fosse executável, ela estaria
protegida pelo §13.

## D. Cards editoriais

**Todos os sete — e já estão em forma editorial.** Zero trabalho a fazer.

## E. Fusões

**Nenhuma.** Fundir seções seria **mudar ordem e agrupamento de leitura**, que é
território de A-3 — **em espera** (§41). E o §24 proíbe reordenar.

## F. Arquitetura recomendada — **OPÇÃO C**

O §29 previa a Opção C *"se a análise provar que as caixas têm função real"*.
A prova aqui é mais forte: **as caixas não existem.**

## G. Antes × depois

| Métrica | Antes | Depois proposto |
|---|---|---|
| cards (`<Card>`) na superfície | **0** | 0 |
| seções editoriais | 7 | 7 |
| bordas | **6 filetes** entre irmãs | 6 |
| backgrounds | **0** | 0 |
| `border-radius` / `box-shadow` | **0** | 0 |
| títulos | 7 | 7 |
| ações | 0 | 0 |
| conteúdo | 100% | 100% |
| altura | — | **inalterada** |

**Delta: zero.**

## H. Mobile

**Sem alteração a propor**, porque não há cromo de card a recuperar. O que
existe por seção é `1.5rem` de margem + `1.5rem` de padding + 1px de filete —
**respiro entre ideias, não moldura**, e removê-lo degradaria a leitura.

Registro do que o CSS já resolveu: no celular o `aside` deixa de ser `sticky`
(a regra de `position: sticky` + `max-height` vive em `@media (min-width: …)`),
e o contexto passa a rolar com a página. **A economia que A-4 buscaria já foi
feita em outro lugar.**

**Medições em 320/375/768px: não se aplicam** — não há mudança para medir.

## I. Acessibilidade

**Nada a fazer, e nada a arriscar.** Cada seção é `<section>` com `<h2>`
(`mesa-aside__title`), dentro de `<aside aria-label="Contexto do Case">`. A
estrutura semântica **já é** a que o §28 exigiria ao final da conversão.

## J. Risco

**Global: BAIXO — porque nada muda.**

O risco real seria **executar A-4 assim mesmo**: remover os filetes ou fundir
seções faria a página perder a separação entre sete assuntos distintos, sem
nenhum ganho de altura. **Risco de executar > risco de descartar.**

## K. Delta previsto

**Nenhum.** Zero componente, zero CSS, zero teste, zero domínio.

## L. Testes

**Não se aplicam.** T-A4-1 a T-A4-8 pressupõem uma conversão de card em seção
que não tem objeto. Registrados como **não executáveis**, não como pendentes.

## M. O achado que sobra — e não é A-4

A varredura encontrou algo real, **em outro lugar da mesma superfície**:

| Fato | Onde |
|---|---|
| **6 `<Card>` de verdade** | `src/components/curadoria/mesa-workspace.tsx` |
| Renderizado na **área de trabalho**, etapa `CAMINHOS` | `curadoria_tecnica/page.tsx:488` |
| Os demais painéis da Mesa (`painel-de-juizo`, `mapa-prioridades-panel`, `rede-filtravel`) | **zero `<Card>`** |

Ou seja: a Mesa tem **dois idiomas convivendo** — o editorial (`mesa-bloco` /
`mesa-aside__section`, filete entre irmãs) e o genérico (`<Card>`, caixa
fechada). E o CSS da própria Mesa diz, em texto, **"nunca cartão dentro de
cartão"**.

> **Isto é um candidato legítimo — e é uma missão diferente da que foi
> autorizada.** O objeto muda (seis `<Card>` numa etapa da área de trabalho, não
> sete seções do contexto), o inventário do §4 teria de ser refeito sobre eles, e
> `mesa-workspace` é a superfície de **seleção dos três caminhos** — onde caixa
> pode muito bem ser função, não moldura.
>
> **Não o audito aqui.** Fazer isso repetiria exatamente o erro que este parecer
> corrige: agir sobre um objeto que ninguém verificou.

## Gate do §39

| # | Exigência | Situação |
|---|---|---|
| 1 | quais cards são editoriais | **todos os sete — e já são seções** |
| 2 | quais são funcionais | nenhum; a #2 tem estado, protegida pelo §13 |
| 3 | conteúdo 100% preservado | **trivialmente — nada muda** |
| 4 | ordem preservada | **sim — nada muda** |
| 5 | ações e estados permanecem | **sim** |
| 6 | mobile tende a melhorar | **não** — não há cromo a recuperar |
| 7 | sem impacto de domínio | **sim** |
| 8 | não se mistura com A-3 | **sim** — e fundir seções invadiria A-3 |

**O ponto 6 falha, e falha por ausência de objeto.** O §39 exige os oito
simultaneamente para autorizar. **A-4 não passa no próprio gate.**

---

# DECISÃO A-4

## DESCARTAR

Não por preferência, e não porque as caixas tenham função: **porque as caixas
não existem**. Os sete são seções editoriais separadas por um filete de 1px, que
é exatamente o resultado que A-4 buscaria produzir.

**A auditoria que originou A-4 contou `mesa-aside__section` como card. O erro é
meu, e fica registrado aqui.**

# PRÓXIMO PACOTE

**Nenhum para A-4.** A Rodada 4 fica sem objeto.

**Candidato para uma missão própria, se o DT-01 quiser:** os **seis `<Card>` de
`mesa-workspace.tsx`**, na etapa `CAMINHOS`, à luz da doutrina *"nunca cartão
dentro de cartão"* do CSS da Mesa. Exigiria inventário próprio — e **pode
terminar em MANTER**, já que ali há seleção de caminhos, onde a caixa pode ser
função.

**Continuam fora:** A-3 (em espera) · S-4(cálculo) · gráficos · copy · cores.

# PRÓXIMO AGENTE

**`DT-01 — FUNDADOR`** — não há o que implementar. A decisão de abrir ou não a
missão sobre `mesa-workspace` é dele.
