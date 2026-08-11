# A6 · Central de Documentos da paciente

**Base:** `15d98c0` · **Migration: nenhuma.**
**Rota:** `/paciente/documentos` · **Master Visual:** consumido, não alterado.

---

## 1 · O que a tela responde em cinco segundos

> o que a Aliviar me entregou · o que eu enviei · onde está minha História ·
> o que posso abrir ou baixar

Três áreas nomeadas, nesta ordem de utilidade:

| área | fonte | o que aparece |
|---|---|---|
| **Recebidos da Aliviar** | `patient_documents` com `uploaded_by <> profile_id` · Curadoria entregue | arquivos depositados + a Curadoria como artefato |
| **Enviados por você** | `patient_documents` com `uploaded_by = profile_id` | exames e laudos dela, com o envio no topo da área |
| **Sua História e formulários** | `patient_stories` | Sua História, com Continuar ou Rever |

**Recebidos vem primeiro quando existe algo recebido** — é a resposta que ela
veio buscar. Vazio, cede o topo para a área que tem ação: uma seção morta não
domina a primeira dobra.

## 2 · A tela não classifica nada

A página chama `carregarCentralDeDocumentos`, que lê as três fontes e as passa
à projeção da D-12.2 (`montarCentralDeDocumentos`). O componente recebe
`DocumentCenterItem[]` **prontos**.

Não existe na UI — e não por disciplina, **por tipo**:

- comparação de `uploaded_by`;
- leitura de `case_id`;
- interpretação de `file_path`;
- reconstrução do portão de `deliveredAt`;
- montagem de categoria no cliente.

Nada disso chega ao componente. Depois de um upload ou de uma remoção, a lista
volta da projeção (`router.refresh()`) em vez de ser remendada na mão — a tela
nunca inventa um item.

## 3 · Capacidades, não botões

| classe | ação primária | download |
|---|---|---|
| arquivo real (`FILE`) | **Baixar** | `FILE_DOWNLOAD` — URL assinada emitida **no clique**, 60 s |
| Curadoria (`PLATFORM_ARTIFACT`) | **Abrir** | `PRINTABLE_VIEW` — `/paciente/curadoria/imprimir`, que já existia |
| Sua História (`PLATFORM_ARTIFACT`) | **Continuar** / **Rever** | `NONE` — e a tela diz o motivo |

O bucket continua privado. A projeção entrega só o **id da linha**;
`obterLinkDeDocumentoAction` o troca por um link assinado curto, e a RLS é
quem autoriza: se a linha não é dela, não há caminho a assinar. Nenhuma URL é
renderizada no HTML nem guardada no estado da tela.

## 4 · O portão da Curadoria, duas vezes

`loadPatientCuradoria` já só devolve entrega concluída (`status = 'DELIVERED'`
**e** `report.delivered_at`). A projeção volta a exigir `deliveredAt` **e**
conteúdo real. A redundância é intencional: se o loader afrouxar, a projeção
segura — e os testes vigiam a segunda tranca sem depender do banco.

`emittedAt` e `presentedAt` não abrem a porta. Nenhum dos dois é ela ter
acesso.

## 5 · Sua História

Rascunho → **Continuar** (`/sua-historia/continuar`). Enviada → **Rever**
(`/sua-historia/revisao`). Sem download.

**Nunca chamada de questionário** — e o teste varre o texto inteiro da tela,
não só o título.

**GAP-A6-Q1 continua aberto.** Não há versão imprimível de Sua História: os
textos das perguntas vivem espalhados nas sete páginas do wizard, sem fonte
única, e duplicá-los num PDF criaria duas fontes que divergem na primeira
mudança. A tela diz *"sem versão para baixar por enquanto"* em vez de
simplesmente omitir o botão — o silêncio pareceria descuido.

**§10 respeitado:** não existindo outro formulário real, a área contém só Sua
História. Nenhum "em breve", nenhum placeholder.

## 6 · Envio e política de arquivos

O contrato congelado da ADR-054 aparece **antes** de escolher o arquivo:
*"PDF, JPEG, PNG ou WebP · até 20 MB"*, derivado das mesmas constantes que o
servidor usa. O `accept` do campo é a mesma lista. **HEIC não é oferecido.**

O controle nativo foi escondido (não removido): ele continua sendo o campo
real, focável e associado ao rótulo. O que saiu de cena foi a moldura do
navegador, que escreve *"Choose File"* no idioma **dele** — um produto em
português não pode depender da localidade de quem visita.

Recusa vira frase humana, nunca erro técnico de storage ou framework: formato
fora da lista, arquivo acima de 20 MB, ou assinatura que desmente o tipo.

## 7 · Remover

O upload dela pode ser removido. **O que a Aliviar depositou, não** — e isso
não é regra de tela: a policy da D-12.1 já recusa, e a UI apenas não oferece o
que não existe. Um teste fixa os dois lados.

## 8 · Visual

Uma folha de papel só, não uma caixa por item. O `PatientShell` tem arquitetura
ao fundo, e sem uma superfície ela competia com a leitura de uma lista de
exames (§15) — o que a primeira versão desta tela mostrou na prática.

Títulos em serifa, linhas finas, metadado discreto embaixo do título, ação à
direita. Sem tabela, sem grade, sem ícone por extensão, sem contagem de
arquivos. **Ela não está gerenciando storage** — está vendo o que entregou e o
que recebeu no próprio cuidado.

Master Visual **consumido, não tocado**: `PatientCard`, `PatientPageHeader` e
os tokens `--patient-*`. Landing, Home, crops, pacote arquitetônico, logo e
`PatientShell` intactos.

## 9 · Mobile e acessibilidade

390px medido, não estimado: `scrollWidth - clientWidth = 0` em 390/430/768/1440,
e **nenhum alvo de ação abaixo de 44px**. Nome longo **quebra** (`break-words`),
nunca é cortado — o nome do exame dela não é detalhe que se trunca para caber.

H1 na página, H2 por área, listas semânticas. Cada ação carrega o nome do item
no rótulo acessível: o leitor de tela ouve *"Baixar ressonancia-lombar.pdf"*,
não uma fila de "Baixar" idênticos.

## 10 · Provas

`tests/components/a6-central-de-documentos.test.tsx` — **21 testes**. Os itens
**nunca** são escritos à mão: saem da projeção oficial, a mesma que a página
usa. Um teste que montasse `DocumentCenterItem` na mão não perceberia se tela e
projeção divergissem.

| guarda | o que fixa |
|---|---|
| T-A6-1 / T-A6-2 | arquivo tem ação de arquivo; artefato não ganha download |
| T-A6-3 / T-A6-4 | `emittedAt` e `presentedAt` não abrem a porta |
| T-A6-5 / T-A6-6 | cada documento na sua área, sem mistura |
| T-A6-7 / T-A6-8 | rascunho → Continuar · enviada → Rever |
| T-A6-9 | zero "questionário" no texto inteiro |
| T-A6-10 | nem no texto nem em atributo: sem uuid, bucket, `received/`, `uploaded_by` |
| §14 | remover só o que é dela |
| A6-1 | estados vazios falam como gente |

## 11 · O que esta fatia NÃO fez

- **FUN-02 / `professional-documents`** — outro dono, registrado na D-12.3.
- **O oráculo obsoleto** de `reconstrucao-fluxo-completo:244` — pré-existente
  desde `9f6ee86` (2026-08-04), registrado na D-12.3.
- **GAP-A6-Q1** — segue aberto por decisão, não por esquecimento.
- **Zero migration.** Nada nesta fatia pediu banco.

## 12 · Consequência colateral, resolvida

`PatientDocumentsPanel` ficou órfão quando a página passou a usar a Central, e
com ele o `accept` que a D-12.3 havia plumbado no painel compartilhado. Os dois
foram removidos: código morto com comentário explicando um cenário que não
existe mais é pior que código ausente. O painel do **profissional** segue
intacto, com o comportamento anterior à D-12.3.
