# 22 · Handoff ao 03 ENGENHEIRO

> **O desenho está decidido.** Nenhum bloco pede "redesenhar". Cada um tem
> objetivo, arquivos prováveis, o que **não** tocar, testes, aceite, rollback e
> risco.
>
> **Um bloco = um PR.** Bloco que quebre item de [20](20_NAO_REGRESSAO.md) é
> **revertido, não remendado**.

---

## Regras que valem para todos

**Não tocar:** banco · migration · RLS · policies · guardas da Curadoria 2.0 ·
autoria · Método · `portal-*` e `v2/*` *(mortos — Bloco 3 os remove)*.
**Não criar:** ranking · score · percentual · promessa de resultado.
**Sempre:** conferir 320/375/768/1280 · `prefers-reduced-motion` · rodar a suíte.

---

## Bloco 1 · Concierge — "Falar com a Aliviar" ⚠️ [D-3]

**Objetivo:** dar à paciente uma saída para gente nas seis superfícies de [09](09_CONCIERGE_WHATSAPP.md).
**Arquivos:** `ConciergeLink` *(novo)* · telas de `paciente/`.
**Dados:** nenhum — **nível A**.
**Não alterar:** nada além de acrescentar o elemento.
**Testes:** o link existe nas seis · a mensagem **não** contém dado clínico · `target`/`rel` corretos · alvo ≥ 44px.
**Aceite:** F1, F2. **Rollback:** remover o componente. **Risco: baixo.**

## Bloco 2 · Estados — fonte única

**Objetivo:** o catálogo de [13](13_MODELO_DE_ESTADOS.md); cada tela **lê**, nenhuma deduz.
**Arquivos:** módulo de leitura de estado *(novo)* · Home · jornada · Case · Mesa · Relatório · Documentos.
**Dados:** existentes — **A/B**.
**Não alterar:** a Mesa além da origem do rótulo.
**Testes:** E1–E5 · o mesmo Caso rende o mesmo estado em toda tela.
**Aceite:** E1–E5, C5, D2-2, D2-8. **Rollback:** revert. **Risco: médio** — toca muitas telas, mas **só leitura**.

## Bloco 3 · Limpeza dos mortos

**Objetivo:** remover 3 landings + 22 órfãos (**D-11, D-12**), com uso zero já provado.
**Não alterar:** nada vivo. **Reconferir uso zero antes de cada remoção.**
**Testes:** build passa · nenhuma rota perdida · suíte verde.
**Aceite:** V4 caminha; peso de build medido (§17).
**Rollback:** revert. **Risco: baixo** — mas **exige a reconferência**.

## Bloco 4 · Central de Documentos

**Objetivo:** três seções de [07](07_CENTRAL_DE_DOCUMENTOS.md); **relatório entregue aparece**.
**Arquivos:** `paciente/documentos` · `DocumentItem` *(novo)* · repositório de leitura.
**Dados:** existentes — **B**. ⚠️ **confirmar leitura sob RLS antes de projetar.**
**Testes:** E2 · vazio informa por seção · mobile.
**Rollback:** revert. **Risco: médio** — depende de RLS.

## Bloco 5 · Emitir ≠ entregar

**Objetivo:** os três estados de [10](10_ENTREGA_DA_CURADORIA.md) nomeados dos dois lados; aviso persistente de *"ainda não entregue"*; consolidar os dois caminhos do PDF.
**Dados:** `emitted_at`, `delivered_at` — **A**.
**Não alterar:** a confirmação em dois passos **permanece**.
**Testes:** E1 · sair após o primeiro passo **não** entrega e a tela diz isso.
**Risco: baixo.**

## Bloco 6 · Tokens e primitivos

**Objetivo:** um dicionário; `ui/` canônico; um Card, Botão, EmptyState, Dialog, Drawer, Tabs, Loading, PageHeader.
**Não alterar:** comportamento — é **substituição visual equivalente**.
**Testes:** V2, V4 · nenhuma tela muda de comportamento.
**Risco: médio-alto** — **tela a tela, nunca em massa.**

## Bloco 7 · Landing ⚠️ [D-1]

**Escopo integral no [plano próprio](../PLANO_ATUALIZACAO_LANDING_2026_08.md)** — nove passos, 18 critérios.
**Risco: médio.**

## Bloco 8 · PatientShell + Início + Jornada

**Objetivo:** shell único; Início responde as seis perguntas; **uma** jornada (absorve `linha-do-tempo`).
**Não alterar:** rotas ainda — redirects ficam no bloco de rotas.
**Testes:** E3, E5 · mobile §15.
**Risco: médio.**

## Bloco 9 · Minha Curadoria + comparador

**Objetivo:** a ordem de [10](10_ENTREGA_DA_CURADORIA.md) §4; **matriz editorial** substituindo abas.
**Não criar:** ranking, ordenação por atributo, percentual.
**Testes:** C3, C5, M2 · lacuna aparece **como lacuna**.
**Risco: médio** — **maior risco de interpretação do contrato.**

## Bloco 10 · Sua História + questionário ⚠️ [D-4]

**Objetivo:** revisão mostra o que ela escreveu; baixar cópia; questionário em branco.
**Dados:** **B** para exibir; **C** para gerar.
**Testes:** F4 · o documento **não** contém juízo nem especialista.
**Risco: médio.**

## Bloco 11 · Mesa — ergonomia e redação ⚠️ [D-6]

**Objetivo:** C4, C6, C7, C8, C9 + parecer que **oferece** o juízo (§05.3) + D2-4.
**Não alterar:** os quatro painéis · as seis etapas · a trilha · os juízos como ato de domínio · G-2.3-5.
**Testes:** F5, F6, F7, O2, O3 · o campo **nasce vazio**; nada entra sem ato do Curador.
**Risco: médio** — **C2 separado, depende de [D-6].**

## Bloco 12 · Fila do Curador

**Objetivo:** agrupamento por ato devido (§11 V-C4).
**Testes:** O1 · **⚠️ O4 — 5–10 casos simultâneos, obrigatório antes de certificar.**
**Risco: médio** — **não certificar sem os casos.**

## Bloco 13 · Login / entrada ⚠️ [D-7]

**Bloqueado até a decisão.** Sem ela, só a transição visual — e transição para um
lugar que não recebe ninguém novo é meia entrega.

## Bloco 14 · Backoffice

**Objetivo:** mesma gramática, densidade própria. **Sem fundo arquitetônico.**
**Risco: baixo.**

## Bloco 15 · Passe final

Mobile, acessibilidade ([16](16_ACESSIBILIDADE.md) integral), performance
(medições de [17](17_PERFORMANCE.md)), rotas com redirect (**D-10, D-14**).
**Risco: médio** — rotas por último, sempre com redirect.

---

## Ordem prática

**Hoje, sem depender de ninguém:** **2 → 3 → 4 → 5**.
**Assim que [D-3] vier:** **1** — e ele pode correr em paralelo, porque não toca
nada dos outros.
**Depois:** 6 → 7 → 8 → 9 → 10 → 11 → 12 → 13 → 14 → 15.
