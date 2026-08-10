# 13 · Modelo de estados

> **É o documento que resolve mais defeitos por linha.** C5, D2-1, D2-2, D2-8,
> P3, P6 e o estado incorreto da Home **são todos o mesmo problema**: telas
> interpretam em vez de ler.

---

## 1. A regra

> **Um estado tem uma origem de dado e duas traduções.** Nenhuma tela deduz
> estado a partir de outro; toda tela **lê**.

## 2. Catálogo

| Estado | Origem | Curador vê | Paciente vê | Ação possível | Próximo |
|---|---|---|---|---|---|
| **História — não iniciada** | ausência de `patient_stories` | *"Sem história"* | *"Conte sua história"* | preencher | enviada |
| **História — em preenchimento** | rascunho | *"Em preenchimento"* | *"Continue de onde parou"* | continuar | enviada |
| **História — enviada** | `submitted_at` | *"Recebida"*, nominal | *"Recebemos sua história"* + **rever/baixar** (§08) | — | Caso aberto |
| **Caso — aguardando Curador** | sem responsável | *"Disponível"* na fila | *"Estamos organizando"* | assumir | em curadoria |
| **Caso — em curadoria** | responsável definido | etapa atual da Mesa | *"[Nome] está cuidando"* | trabalhar | pronto |
| **Pendência — aberta** | pendência registrada | *"aguarda paciente"* | ⚠️ **hoje invisível** (B2-3) → **bloco no Início** (§06 H-2) | responder | resolvida |
| **Juízo — aguardando** | ausência de julgamento vigente | **âmbar** *"aguarda você"* | **nada** | julgar | registrado |
| **Juízo — registrado** | `curator_judgments` vigente | **verde** processual | **nada** | rever | — |
| **Caminhos — em seleção** | seleção incompleta | *"n de 3"* | **nada** | selecionar | selecionados |
| **Relatório — rascunho** | sem `emitted_at` | *"Rascunho"* | **nada** | escrever | emitido |
| **Relatório — emitido** | `emitted_at` | *"Emitido — **ainda não entregue**"* | *"A Aliviar está preparando"* (§07) | entregar | entregue |
| **Curadoria — entregue** | `delivered_at` | *"Entregue em [data]"* | **a Curadoria inteira** | conversar | decisão |
| **Preferência / decisão** | ⚠️ **[D-2](21_DECISOES_NECESSARIAS.md)** | ⚠️ indefinido | ⚠️ indefinido | ⚠️ | ⚠️ |
| **Caso — concluído** | conclusão registrada | *"Concluído"* | *"Sua Curadoria está concluída"* | — | — |

## 3. Os quatro defeitos que isto fecha

| Defeito | Causa | Correção |
|---|---|---|
| **C5** — Case *"Concluída"* × Mesa *"aguarda você"* | duas telas deduzem | ambas leem a linha do Relatório |
| **P3** — Documentos vazio com relatório entregue | Documentos não lê o relatório | passa a ler (§07) |
| **Home com história incorreta** | Home infere | Home lê a linha da História |
| **D2-1 / P6** — duas jornadas | duas montagens | uma fonte, uma tela (§04.2) |

## 4. Marca visual — cor **nunca** sozinha

Todo estado exibido tem **cor + símbolo + texto**, na gramática já certificada:
`✓` resolvido/verde · `●` ato humano/âmbar · `!` impedimento/vermelho ·
`·` neutro.

**Âmbar tem orçamento: no máximo uma região por tela.**

## 5. Uma linha permanece indefinida

**A decisão da paciente.** Não a preencho: depende de [D-2]. **Registrada como
indefinida, e é assim que deve permanecer no contrato até o DT-01 responder** —
inventar aqui seria criar regra de negócio por conveniência de UX.

## 6. Classificação (§25)

**A maior parte é nível A/B** — os dados existem (`submitted_at`, `emitted_at`,
`delivered_at`, julgamentos, seleção). **O que falta é leitura consistente.**

**Exceções:** pendência com destinatário (**C/D**) · decisão da paciente
(**depende de D-2**).
