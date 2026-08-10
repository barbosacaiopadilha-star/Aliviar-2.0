# 02 · Princípios de produto

Sete princípios. Cada um nasceu de uma evidência das auditorias, e cada um é
**falseável** — dá para apontar a tela que o viola.

---

## P1 · Complexidade para dentro, clareza para fora

O sistema lida com critérios, evidências, juízos, versões e autoria. A paciente
recebe **contexto, orientação e próximo passo**. O Curador recebe **densidade
útil**.

**Falseável por:** vocabulário interno vazando para a paciente, ou informação
retirada do Curador em nome de "simplificar".

## P2 · Toda ação visível tem consequência visível

**A evidência que obriga:** a paciente executou dois passos de confirmação e
*"o formulário volta ao estado inicial e nenhuma mensagem aparece"* (B2-1).

**Regra:** um botão só existe se, ao ser clicado, **alguma coisa muda na tela** —
estado, mensagem, destino. Se a consequência é humana e demorada, **a tela diz
isso**.

**Falseável por:** qualquer CTA cujo efeito não seja perceptível.

## P3 · Um estado, uma verdade

**A evidência:** Case dizia *"Relatório — Concluída"* e a Mesa, *"Relatório,
aguarda você"* (C5). Documentos vazio com relatório entregue (P3).

**Regra:** cada estado tem **uma origem de dado** e **duas traduções** — uma para
o Curador, uma para a paciente. Telas **leem**; não interpretam.

**Falseável por:** duas telas descrevendo o mesmo caso de formas incompatíveis.

## P4 · Ninguém decide sobre saúde sem ter a quem perguntar

**A evidência:** *"Nenhuma das 8 telas tem contato, canal, botão ou formulário. O
Curador é nomeado e não é clicável"* (P1).

**Regra:** em toda tela onde a paciente **decide, espera ou não entende**, existe
uma saída para uma pessoa.

**Falseável por:** uma tela de decisão sem canal.

## P5 · Escrever uma vez

**A evidência:** 19 textos livres para 3 profissionais, e *"juízo e parecer
pedem, com outras palavras, a mesma leitura"* (C1, D2-5).

**Regra:** o Curador escreve **uma vez** e **reaproveita com revisão explícita**.
Reaproveitar **nunca** é automático, e a autoria continua sendo dele.

**Falseável por:** dois campos que exigem o mesmo conteúdo sem que o segundo
ofereça o primeiro.

## P6 · O Método não se repagina

Autoria humana · responsabilidade explícita · ausência de ranking, score,
estrela, nota e percentual · incompletude legítima e dita · rastreabilidade ·
independência.

**A Rodada 2 confirmou que isso funciona hoje.** Nenhuma melhoria estética pode
custar um item desta lista.

**Falseável por:** qualquer visualização que ordene profissionais, ou qualquer
texto que prometa resultado.

## P7 · Mesma família, sotaques diferentes

Landing editorial · paciente íntimo · Curador denso · backoffice funcional.
Compartilham **tipografia, cor, espaço, motion e vocabulário de estado**. Não
compartilham densidade nem navegação.

**Falseável por:** fundo arquitetônico pesado numa tela operacional, ou um
componente de produto que pareça de outro sistema.

---

## Regra de conflito

Quando dois princípios colidirem, esta é a ordem:

**P6** (Método) → **P3** (verdade única) → **P4** (ter a quem perguntar) →
**P2** (consequência) → **P1** (clareza) → **P5** (escrever uma vez) →
**P7** (família).

> **O Método vence tudo. Depois dele, vence não mentir.**
