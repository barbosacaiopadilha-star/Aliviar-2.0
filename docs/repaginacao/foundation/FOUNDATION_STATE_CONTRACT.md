# Fundação · Contrato apresentacional de estado

`src/foundation/contrato-de-estado.ts`

> **Um estado tem uma origem de dado e duas traduções. Nenhuma tela deduz;
> toda tela lê.**

O defeito que isto fecha não é de banco. A Home dizia *"você ainda não contou
sua história"* com a Curadoria entregue; Documentos aparecia vazio com relatório
entregue; o Caso dizia "concluída" enquanto a Mesa dizia "aguarda você". Nenhum
é bug de dado — **é cada tela deduzindo a partir do pedaço de fato que tinha à
mão.**

## Origem real dos dados

Nenhum campo novo. Nenhuma migration. Nenhum enum de domínio.

| Fato | Coluna real |
|---|---|
| história existe / enviada | `patient_stories`, `submitted_at` |
| Caso assumido | responsável do Caso |
| Caso encerrado | `closed_at` — gravado para CLOSED **e** CANCELLED |
| Caso cancelado | `status = CANCELLED`, lido do estado real |
| relatório emitido | `emitted_at` |
| relatório entregue | `delivered_at` |
| pendência | pendência registrada + destinatário |

## O catálogo

| Estado | Paciente lê | Curador lê | Tom | De quem é a vez |
|---|---|---|---|---|
| `HISTORIA_NAO_INICIADA` | Conte sua história. | Sem história. | atenção | **paciente** |
| `HISTORIA_EM_PREENCHIMENTO` | Continue de onde parou. | Em preenchimento. | atenção | **paciente** |
| `HISTORIA_ENVIADA` | Recebemos sua história. | História recebida. | resolvido | equipe |
| `CASO_AGUARDANDO_CURADOR` | Estamos organizando sua Curadoria. | Disponível na fila. | neutro | equipe |
| `CASO_EM_CURADORIA` | Sua Curadoria está em andamento. | Em curadoria. | neutro | **Curador** |
| `RELATORIO_EMITIDO` | A Aliviar está preparando sua Curadoria. | **Emitido — ainda não entregue.** | atenção | equipe |
| `CURADORIA_ENTREGUE` | Sua Curadoria está pronta. | Entregue. | resolvido | paciente |
| `CASO_CONCLUIDO` | Sua Curadoria está concluída. | Concluído. | resolvido | ninguém |
| `CASO_CANCELADO` | Esta Curadoria foi encerrada. | Cancelado. | neutro | ninguém |
| `CASO_ENCERRADO_SEM_ENTREGA` | Esta Curadoria foi encerrada. | Encerrado sem entrega. | neutro | ninguém |
| `INDETERMINADO` | Estamos organizando esta etapa. | Estado não determinável. | neutro | **indeterminado** |

## Por que a ordem de derivação importa

A leitura vai **do fato mais avançado para o menos**. Não é estilo: é o que
torna a contradição *inalcançável*. Com `delivered_at` presente, não existe
caminho de código que chegue ao ramo da história — então nenhuma tela pode voltar
a dizer que ela não foi contada. O teste prova isso variando a história para
`null` e para `existe: false` e obtendo `CURADORIA_ENTREGUE` nos dois casos.

## `null` não é `false`

`historia: null` significa *"não sei"* e devolve `INDETERMINADO`.
`historia: { existe: false }` significa *"sei que não começou"* e devolve
`HISTORIA_NAO_INICIADA`. Só o segundo autoriza pedir que ela comece.
**Ausência de dado nunca vira afirmação.**

## De quem é a vez

`PACIENTE` · `CURADOR` · `EQUIPE` · `SISTEMA` · `NINGUEM` · `INDETERMINADO`.

Derivado, nunca persistido. Pendência aberta manda em quem age e força tom de
atenção — o progresso não pode esconder o que falta. Pendência sem destinatário
determinável devolve `INDETERMINADO`: heurística não vira regra.

## A linha que permanece indefinida

**A decisão da paciente.** O catálogo do Arquiteto (§13.5) a deixa explicitamente
aberta, à espera de **[D-2]**. `decisaoDaPaciente()` devolve
`{ registrada: false, motivo: "AGUARDA_DECISAO_D2" }` e nada mais — para que
nenhuma tela precise inventar a diferença entre sinalizar e decidir.

## As regras de segurança, e como são testadas

Sobre **todos** os estados do catálogo, de uma vez:

- nenhum rótulo de paciente contém `_`, id, `null`, `undefined` ou o enum;
- nenhum promete prazo (`em breve`, `N dias`, `até amanhã`);
- `temConteudoParaPaciente` só é verdadeiro com entrega ou conclusão **reais**;
- todo tom pertence à gramática certificada;
- verde nunca aparece sem processo concluído.


## F-1 · encerrar não é concluir; concluir não é entregar

O Gate provou, e eu reproduzi em transação revertida:

```
PROVA >> status=CANCELLED closed_preenchido=t entregues=0
```

O gatilho grava `closed_at` para `CLOSED` **e** para `CANCELLED`. Logo
`closed_at` sozinho não distingue as duas coisas, e não pode autorizar nem
rótulo de conclusão nem conteúdo.

**Precedência (§7):** cancelamento → encerramento (com entrega ⇒ concluído; sem
entrega ⇒ encerrado sem entrega) → entrega → emissão → Caso → história →
desconhecido. O fato mais específico vence.

**Invariante, varrido sobre as 24 combinações de cancelado × encerrado ×
emitido × entregue:** conteúdo disponível ⟹ houve entrega. `VER_CURADORIA` ⟹
houve entrega. Sem exceção.

**`RESPONDER_PENDENCIA` foi removida** (F-3): nenhum ramo a produzia, porque a
pendência estruturada com destinatário ainda não existe. A pendência como FATO
permanece — ela manda em `quemAge` e em `temPendencia`; o que saiu foi a ação
sem produtor. Uma guarda impede que qualquer ação declarada volte a não ter
ramo que a produza.
