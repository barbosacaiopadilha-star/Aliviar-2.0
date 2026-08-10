# 19 · Critérios de aceite

**Formato obrigatório:** *"Usuário em estado X vê Y e não vê Z."*
**Proibido:** *"ficou mais bonito"*, *"está mais limpo"*.

---

## Visual

| # | Critério |
|---|---|
| V1 | Landing bate com a referência nos 18 pontos do [plano próprio](../PLANO_ATUALIZACAO_LANDING_2026_08.md) §I |
| V2 | paciente e Curador usam **os mesmos** tokens semânticos |
| V3 | **nenhuma** interface operacional tem fundo arquitetônico |
| V4 | **um** cartão, **um** botão, **um** vazio, **um** diálogo em todo o produto |

## Estado

| # | Critério |
|---|---|
| E1 | com relatório **emitido e não entregue**: Curador vê *"Emitido — ainda não entregue"*, paciente vê *"A Aliviar está preparando"* e **não vê** a Curadoria |
| E2 | com relatório **entregue**: aparece em Documentos **e** em Minha Curadoria; **nunca** Documentos vazio |
| E3 | com Curadoria concluída: a Home **não** afirma que a história não foi contada |
| E4 | Case e Mesa **nunca** exibem estados incompatíveis para o mesmo Relatório |
| E5 | a jornada existe em **um** lugar; a Home mostra o presente, não a sequência |

## Funcional

| # | Critério |
|---|---|
| F1 | em **toda** tela de decisão, espera ou dúvida, a paciente vê **Falar com a Aliviar** |
| F2 | a mensagem pré-preenchida **não contém** diagnóstico, especialista, condição nem identificador |
| F3 | **nenhum** CTA muda nada sem dizer o que mudou |
| F4 | a paciente **relê e baixa** a história que enviou |
| F5 | *"Encerrar e gerar o Relatório"* é **visível e desabilitado**, com o que falta ao lado |
| F6 | relatório emitido: ações de edição **indisponíveis**, não clicáveis-com-erro |
| F7 | eliminação sem justificativa é recusada **no cliente e no servidor** |
| F8 | a seleção dos três caminhos **sobrevive** à navegação entre perguntas |

## Operacional

| # | Critério |
|---|---|
| O1 | Curador identifica **em um olhar** quais casos aguardam ato dele |
| O2 | Curador **não redigita** o que já escreveu — o parecer **oferece** o juízo |
| O3 | número de textos livres por Curadoria **cai**, sem perder ato de domínio |
| O4 | **⚠️** a fila só é certificada com **5–10 casos simultâneos** em estados diferentes |

## Conteúdo

| # | Critério |
|---|---|
| C1 | **"Case"** não aparece em nenhuma tela; **"Caso"** aparece |
| C2 | **"H8–H11"** não aparece em nenhuma tela |
| C3 | **nenhum** ranking, score, nota, estrela, percentual ou "melhor" — em nenhum papel |
| C4 | **nenhuma** promessa de resultado |
| C5 | ordem dos três caminhos é declarada **de apresentação** |

## Mobile · Acessibilidade · Performance · Regressão · Segurança

| # | Critério |
|---|---|
| M1 | toda tela tocada conferida em **320 · 375 · 768 · 1280**, sem rolagem horizontal |
| M2 | comparador em 375px: **uma coluna por vez**, sem tabela horizontal |
| M3 | pendência **nunca** em gaveta no celular |
| A1 | os **16** critérios de [16](16_ACESSIBILIDADE.md) |
| P1 | LCP e CLS **não pioram**; JS por rota **não cresce** |
| P2 | vídeo **não** carrega sozinho e **não** é o LCP |
| R1 | os itens de [20](20_NAO_REGRESSAO.md), **todos** |
| S1 | **nenhum** dado clínico em URL, mensagem externa ou log |
| S2 | RLS e autorização **inalteradas** — nenhuma rota nova sem gate |

## Regra do verificador

> **Recusar bloco cujo critério não seja verificável.** Se não dá para dizer
> *"vejo Y e não vejo Z"*, o critério está mal escrito — e o problema é meu, não
> do Engenheiro.
