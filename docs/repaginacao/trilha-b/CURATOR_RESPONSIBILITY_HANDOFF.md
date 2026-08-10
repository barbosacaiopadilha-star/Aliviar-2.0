# Responsabilidade do caso — e o defeito que estava no ar

## A regra

**Antes da decisão: Curador. Depois da decisão: Concierge.** Sem exceção.

## O defeito encontrado

`resolveCurrentResponsible` decidia pela **fase**, e
`inferPhaseFromCuradoria` alcançava a fase `escolha` **apenas com
`relatorio.emittedAt`**:

```
if (record.relatorio.emittedAt) return "escolha";
...
if (phase === "acompanhamento" || phase === "encerramento" || phase === "escolha")
  → Concierge
```

Consequência: bastava o relatório ser **preparado internamente** — sem entrega
digital, sem o encontro de entrega e sem decisão — para a paciente passar a ver
o **Concierge** como responsável. No momento em que o trabalho era inteiramente
do Curador, o produto entregava o caso a outra pessoa.

Nenhum teste fixava isso: os 46 testes existentes de COA e Jornada passavam
antes e depois da correção.

## A correção

A decisão passou a ser verificada **antes** da fase, porque é o fato mais
específico — e ela já existia no registro:

```ts
if (input.curadoriaRecord && !input.curadoriaRecord.devolutiva.decision) {
  return curador;
}
```

Cinco estados pré-decisão passam a devolver Curador: nada aconteceu · 1º
encontro concluído · Curadoria preparada · 2º encontro realizado · conteúdo
entregue. Só a decisão move a responsabilidade.

**Zero domínio.** A guarda lê `devolutiva.decision`, que já existia. Nenhuma
coluna, nenhum evento, nenhuma migration.

## Diferença que a UX precisa preservar

**"De quem é a vez?"** ≠ **"Quem responde pelo caso?"**

A paciente pode dever uma ação — é a vez dela — enquanto o Curador continua
sendo o profissional responsável. O contrato da Fundação já separa os dois: o
`quemAge` responde a primeira pergunta; `currentResponsible` responde a
segunda. **Nenhuma extensão de Foundation é necessária.**
