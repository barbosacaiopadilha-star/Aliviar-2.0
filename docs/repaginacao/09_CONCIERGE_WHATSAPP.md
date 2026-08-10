# 09 · Concierge e WhatsApp

> **O achado mais grave das duas rodadas (P1):** *"Nenhuma das 8 telas tem
> contato, canal, botão ou formulário. O Curador é nomeado e não é clicável."*
>
> A paciente recebe **três caminhos médicos** e decide **sem ter a quem
> perguntar**. Isto é **P0**.

---

## 1. Onde o Concierge aparece

| Superfície | Forma | Mensagem pré-preenchida |
|---|---|---|
| **Início** | linha discreta, sempre visível | *"Olá, equipe Aliviar. Gostaria de ajuda com minha jornada."* |
| **Documentos** | rodapé da central | *"Gostaria de ajuda com meus documentos."* |
| **Minha Curadoria** | **junto aos três caminhos** | *"Gostaria de conversar sobre minha Curadoria."* |
| **Decisão** | **ao lado da ação** | *"Gostaria de conversar antes de decidir."* |
| **Pendência** | dentro do bloco | *"Recebi um pedido e gostaria de ajuda."* |
| **Estado vazio** | quando algo demora | *"Gostaria de saber como está minha Curadoria."* |

**A da Curadoria e a da decisão são as obrigatórias.** As outras são conforto;
essas duas são o princípio **P4**.

## 2. Forma

**Não é widget flutuante.** É **um elemento da página**, na linguagem da Aliviar:
uma linha com o rótulo **"Falar com a Aliviar"**, discreta, sem badge, sem
animação, sem bolha no canto.

**Rótulo:** *"Falar com a Aliviar"* — **nunca** *"WhatsApp"*, **nunca** o ícone
verde como identidade. **O WhatsApp é o canal por trás da ação, não a marca da
ação.**

## 3. Contexto — permitido e proibido

| ✅ Permitido na mensagem | ❌ **Proibido, sem exceção** |
|---|---|
| saudação | diagnóstico · condição · sintoma |
| que é sobre "minha jornada / meus documentos / minha Curadoria" | nome de especialista |
| **nada mais** | conteúdo de laudo ou exame · nome de instituição · qualquer dado clínico · identificador de Caso |

> **A mensagem diz o assunto, nunca o conteúdo.** Ela viaja por um canal de
> terceiro, fora do domínio da Aliviar — e por isso **nenhum dado sensível pode
> ser pré-inserido**. O que a paciente escolher escrever depois é dela.

## 4. Comportamento

| Situação | Comportamento |
|---|---|
| mobile | abre o aplicativo, `target="_blank"`, `rel="noopener"` |
| desktop | abre o WhatsApp Web |
| canal indisponível | **fallback declarado** — o rótulo mostra alternativa; **nunca botão morto** |
| persistência | **nenhuma** neste contrato — sem histórico, sem thread interna |

## 5. Relação com o Concierge interno

O Concierge é **papel operacional** com rota própria no `OperationShell`. O que
este documento cria é **o ponto de contato do lado da paciente** — não uma caixa
de entrada nova.

**Se o produto quiser conversa dentro da plataforma, isso é [D-3](21_DECISOES_NECESSARIAS.md)
— nível C/D, fora deste contrato.**

## 6. Classificação (§25)

**Nível A — somente apresentação.** Link com mensagem constante. Sem dado novo,
sem action, sem persistência.

> **É o item de maior impacto humano e menor custo técnico do contrato inteiro.**

## 7. Decisão pendente

**[D-3](21_DECISOES_NECESSARIAS.md)** — número, horário de atendimento e o que
dizer quando ninguém responder. **Sem isso o link existe e a promessa não.**
