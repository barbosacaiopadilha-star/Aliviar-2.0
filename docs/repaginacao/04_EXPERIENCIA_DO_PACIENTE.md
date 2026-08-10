# 04 · Experiência do paciente

## 1. Início — seis perguntas, uma tela

| # | Pergunta | Como responde |
|---|---|---|
| 1 | Onde estou? | **uma frase de estado**, derivada da fonte única (§13) |
| 2 | O que já aconteceu? | três marcos mais recentes + *"ver minha jornada"* |
| 3 | O que a Aliviar está fazendo agora? | frase em voz ativa, com **o nome do Curador** |
| 4 | Preciso fazer alguma coisa? | **bloco de pendência** — ou a ausência dele, dita |
| 5 | O que vem depois? | o próximo marco, nomeado |
| 6 | Como falo com alguém? | **Falar com a Aliviar**, sempre visível (§09) |

**Hierarquia:** ① de quem é a vez → ② pendência (se houver) → ③ próximo passo →
④ marcos recentes → ⑤ atalho para Curadoria quando existir.

**Proibido:** grade de cards concorrentes; repetir a jornada inteira aqui (D2-1).

### 1.1 O defeito que a Home precisa deixar de ter

A auditoria registrou a Home afirmando estado de história **incorreto depois de
toda a Curadoria concluída**. Classificação: **§13 — estado, não UX.** A Home
passa a **ler** a fonte única; não infere.

## 2. Minha jornada — a única linha do tempo

**Absorve `/paciente/linha-do-tempo`** (D2-1, P6). Uma representação, uma
narrativa.

Mostra, em ordem: **o que aconteceu** (com data) · **onde está** (destacado) ·
**de quem é a vez** · **o que vem** (sem data prometida) · **pendências**.

**Regra:** a Home mostra **o presente**; a jornada mostra **a sequência**. Nunca
o mesmo texto nas duas.

## 3. Sua História

**Preservar o fluxo** — a auditoria não apontou atrito no preenchimento.

**Corrigir P2 — "a história enviada some":** *"`/sua-historia/revisao` mostra só
'Recebemos sua história'. O que ela escreveu não é relido, baixado nem
impresso."*

**Depois do envio, a história vira documento** em *Documentos → Questionários e
formulários*, com **visualizar** e **baixar cópia** (§07, §08).

## 4. Minha Curadoria

O momento de maior valor percebido. A entrega **não pode depender do PDF**
(P7 — *"dois caminhos para o mesmo documento"*).

**Ordem da tela:**

```
Sua Curadoria está pronta.          ← afirmação, não card
Contexto — o que foi considerado
Os três caminhos                    ← comparador (§4.1)
O que vem agora                     ← conversa com o Curador
Documentos desta Curadoria          ← relatório, sem sair da página
Falar com a Aliviar                 ← §09
```

### 4.1 Comparador — conceito preservado, visualização redesenhada

**Hoje:** a paciente alterna categorias e memoriza opções; e no estado auditado
*"os 5 aspectos dizem 'Ainda não foi possível confirmar' para os 3 caminhos"* (P4).

**Alvo: matriz editorial** — três colunas (os caminhos) × os aspectos em linhas.
Tudo visível **sem alternar aba**.

| Regra | Detalhe |
|---|---|
| ordem das colunas | **de apresentação, nunca de colocação** — dito na tela |
| lacuna | *"Ainda não foi possível confirmar"* aparece **como lacuna**, nunca como negativo |
| diferença | destaque **onde os três divergem**, sem julgar qual é melhor |
| **proibido** | ranking · estrela · nota · score · percentual · vencedor · ordenação por qualquer atributo |
| mobile | uma coluna por vez, com **troca por gesto** e os aspectos fixos — nunca tabela rolando na horizontal |

**Se todos os aspectos estiverem "não confirmado", a tela diz isso em uma frase**
antes da matriz — em vez de mostrar uma grade vazia.

## 5. Decisão — o achado mais delicado

**A evidência (B2-1, P5):** dois cliques, `connection_records = 0`, formulário
volta ao início, nenhuma mensagem. E a jornada diz que a etapa é **"Conversa"**,
com o Curador apresentando as opções pessoalmente; a etapa 4 do Curador chama-se
**"Registrar a decisão do paciente"**.

> **A auditoria não classificou como defeito, e eu também não.** É possível que o
> desenho correto seja: **a paciente sinaliza preferência; o Curador registra a
> decisão depois da conversa.**

**Isto é decisão de produto — [D-2 em 21](21_DECISOES_NECESSARIAS.md).** Três
desenhos possíveis:

| | Desenho | Consequência |
|---|---|---|
| **A** | a paciente **sinaliza preferência**; o Curador registra | o botão vira *"Tenho uma preferência"* e a tela passa a dizer *"avisamos seu Curador"* |
| **B** | a paciente **decide** e isso persiste | exige persistência e notificação — **§25 nível C/D** |
| **C** | não há ato online | o botão **sai**, e a tela conduz à conversa |

**Enquanto a decisão não vier, vale a regra P2:** o CTA atual **não pode
permanecer como está**. Um botão que não muda nada é pior que nenhum botão.

## 6. Estados vazios

Toda tela sem conteúdo diz **três coisas**: o que ainda não existe · **por quê**
· o que acontece a seguir. Nunca só *"nada aqui"*.
