# 15 · Mobile

## 1. Estratégia por papel — com evidência

| Papel | Estratégia | Fundamento |
|---|---|---|
| **Paciente** | **mobile-first em qualidade** | ela lê a Curadoria onde estiver, provavelmente no celular, provavelmente com medo |
| **Curador** | **desktop-first, mobile de consulta** | ver §1.1 |
| **Backoffice** | desktop-first | operação sentada |

### 1.1 Por que o Curador é desktop-first — e não é preguiça

A Rodada 2 capturou **6 telas mobile do Curador**, e a Mesa **funciona** nelas.
Mas o ato central do Curador — julgar seis conceitos por profissional com o
contexto ao lado — **depende de contexto e área de trabalho simultâneos**. Num
celular, ou o contexto sai da tela, ou a área de trabalho desaparece.

**Decisão: mobile do Curador é de consulta** — ver fila, abrir caso, ler estado,
acompanhar. **Julgar, selecionar caminhos e emitir permanecem tarefas de
desktop**, e a interface **diz isso** em vez de oferecer um formulário
inutilizável.

**Isto não é degradação silenciosa: é escopo declarado.**

## 2. Paciente — tela a tela

| Tela | 375px |
|---|---|
| **Início** | ① de quem é a vez → ② pendência → ③ próximo passo → ④ marcos → ⑤ **Falar com a Aliviar**. Pendência **nunca** em gaveta |
| **Jornada** | vertical, marco atual **destacado e centralizado** na abertura |
| **Sua História** | uma pergunta por vez; progresso discreto; salvamento visível |
| **Minha Curadoria** | *"Está pronta"* → contexto → **caminhos** → o que vem → documentos |
| **Comparador** | **uma coluna por vez**, troca por gesto, aspectos fixos à esquerda. **Nunca tabela rolando na horizontal** |
| **Documentos** | seções colapsáveis, primeira aberta; nome em duas linhas |
| **Decisão** | ação e **Falar com a Aliviar** **na mesma dobra** |

## 3. Regras firmes

Nenhum texto abaixo de **14px** · alvos ≥ **44px** · **nada depende de hover** ·
ação primária alcançável **sem rolar** · **sem rolagem horizontal em nenhuma
largura** · fundo com `object-position` que preserve o foco · hierarquia
editorial mantida.

## 4. Breakpoints

| Faixa | Comportamento |
|---|---|
| **≤ 375** | uma coluna, tudo empilhado |
| **376–767** | uma coluna, mais respiro |
| **768–1023** | duas colunas onde couber; **Curador ainda em modo consulta** |
| **≥ 1024** | layout pleno; **Mesa completa** |

**O corte da Mesa é 1024, não 768** — abaixo disso não há espaço para contexto e
trabalho lado a lado.

## 5. Verificação

Toda tela tocada é conferida em **320 · 375 · 768 · 1280**. **320 é obrigatório**
— é onde a régua quebra primeiro.
