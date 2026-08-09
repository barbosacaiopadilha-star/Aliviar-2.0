# Gates Normativos de Ativação — Assistência de Redação por IA

| Campo | Valor |
|---|---|
| **Versão** | v1.0 |
| **Autor** | Agente 02 — Arquiteto da Curadoria 2.0 |
| **Data** | 2026-08-09 |
| **Base** | `a365c4e` |
| **Estado técnico** | **VERIFICADO / APTO** (parecer do `04 VERIFICADOR`) — consumido como fato, não reaberto |
| **Ativação** | **BLOQUEADA** — e permanece bloqueada ao fim desta missão |
| **Delta** | somente documentação. **Zero código, zero migration, zero env, zero feature flag** |

---

## 1. Os três gates

| Gate | Objeto | Estado ao fim desta missão |
|---|---|---|
| **A-1** | conflito textual da **G-2.3-5** | 🟢 **VERDE** — emendada |
| **A-2** | **copy normativa** da tela | 🟢 **VERDE** — texto canônico lavrado (§3) |
| **A-3** | **privacidade / suboperador** | 🔴 **VERMELHO** — depende de ato externo (§4) |

---

## 2. GATE A-1 — G-2.3-5 · 🟢

### 2.1 O conflito era menor do que parecia — e existia num só lugar

| Documento | Redação anterior | Tem `sugestão`? |
|---|---|---|
| [`CONTRATO_2_3`](CONTRATO_2_3_DIVISAO_DA_AVALIACAO.md) §15 | *"sem pré-julgamento — campo de conclusão nasce vazio; **zero minuta/sugestão/carry-forward**"* | **sim** |
| [`REGISTRO_DAS_GUARDAS_2_0`](REGISTRO_DAS_GUARDAS_2_0.md) | *"sem pré-julgamento — conclusão nasce vazia; **zero minuta/carry-forward** (inclusive pós-JS3)"* | **não** |

**O conflito textual existia apenas no Contrato.** Nenhuma busca-e-substituição
cega foi feita: os dois documentos foram lidos, comparados e alinhados.

### 2.2 Redação nova

> **G-2.3-5** — sem pré-julgamento — campo de conclusão nasce vazio; **zero
> minuta automática, zero pré-preenchimento, zero carry-forward** (emendada em
> 2026-08-09 — §22). *Cai se:* UI inicializa conclusão com texto (inclusive a
> anterior pós-JS3).

A **mutação de falseabilidade não mudou** — é a mesma frase de antes.

### 2.3 O fundamento da distinção

> **A guarda nunca mediu a origem do texto; mediu a passividade do Curador.**
>
> Se o texto entra no campo **sem** ato dele, é pré-preenchimento — **proibido**.
> Se ele **pede**, vê **fora** do campo, e o texto só entra quando **ele** manda,
> é assistência de redação — **permitida**.

A tabela PROIBIDO/PERMITIDO está lavrada no `CONTRATO_2_3` §22.1.

### 2.4 Achado extra — o §5 do mesmo Contrato

O §5 (*"Ergonomia sem pré-julgamento"*) proíbe quatro atos, incluindo *"oferecer
'aceitar'"* e *"ordenar conclusões candidatas"* — que poderiam ser lidos como
conflito futuro. **Conferidos um a um: nenhum se aplica.** O rótulo é `Usar`
(copiar para editar, não aceitar juízo), e as três alternativas **não são
conclusões nem estão ranqueadas** — são registros de linguagem lado a lado.
**§5 permanece íntegro, sem emenda**, e a conferência ficou registrada para não
precisar ser refeita.

### 2.5 Nenhum código alterado

A guarda executável já protege corretamente: campo nasce vazio · sem
`defaultValue` · sem `.conclusao` prévia · sem carry-forward pós-JS3. **A
assistência verificada não executa nenhum dos cinco atos proibidos.** Emenda de
redação normativa, não de proteção.

---

## 3. GATE A-2 — copy normativa · 🟢

### 3.1 A frase atual fica falsa

`painel-de-juizo.tsx`, cabeçalho do bloco:

> *"O Motor lê e sinaliza; a conclusão é sua — registrada, versionada e
> auditável. **Nada aqui é sugerido, pré-preenchido ou copiado.**"*

Com a assistência ativa, **"sugerido" deixa de ser verdade**. "Pré-preenchido" e
"copiado" continuam verdadeiros.

### 3.2 A solução: **dois textos, um seletor que já existe**

O componente **já recebe** `assistenciaDisponivel` — decidido no servidor,
fechado por omissão. **A copy deve usar o mesmo seletor.**

| Estado | Texto canônico |
|---|---|
| **assistência indisponível** *(hoje, e sempre que o servidor a fechar)* | *"O Motor lê e sinaliza; a conclusão é sua — registrada, versionada e auditável. **Nada aqui é sugerido, pré-preenchido ou copiado.**"* — **inalterado** |
| **assistência disponível** | *"O Motor lê e sinaliza; a conclusão é sua — registrada, versionada e auditável. **Nada é pré-preenchido ou copiado. Se quiser, peça uma sugestão de redação e edite livremente antes de registrar.**"* |

> **Por que dois e não um.** Um texto único ou mentiria num dos dois estados, ou
> falaria de um recurso invisível. Amarrando a copy ao mesmo booleano que
> **gate**eia a funcionalidade, **é impossível a tela afirmar algo que a
> configuração desmente** — a frase e o recurso não podem divergir.
>
> **Consequência prática:** esta mudança de copy pode ser publicada **antes** da
> ativação, sem mentir, porque enquanto o flag estiver fechado o texto exibido é
> o antigo.

### 3.3 Os outros dois textos

| Elemento | Texto canônico |
|---|---|
| **placeholder do textarea** | *"Escreva sua conclusão ou use uma sugestão de redação como ponto de partida."* — **apenas** quando a assistência estiver disponível; caso contrário permanece *"A sua conclusão — expressa, curta, sua."* |
| **botão** | **`Sugerir redação`** — sem marca comercial, sem ícone que sugira automação decisória |
| **microcopy do bloco de alternativas** | *"Sugestões de redação. Nenhuma é uma conclusão — escolha, edite ou ignore."* |

### 3.4 Vocabulário proibido na interface

Nunca: *"a IA avalia o profissional"* · *"a IA ajuda a decidir"* · *"a IA
recomenda a conclusão"* · *"o melhor texto"* · *"sugestão inteligente"* ·
qualquer marca comercial.

Sempre: **assistência de redação**. Coerente com a decisão de comunicação já
lavrada — *a mensagem é Método, Curadoria, Critério*, e o discurso baseado em IA
foi abandonado.

### 3.5 A tela não vira aula de IA

Três frases curtas, no registro da Mesa. **Nenhum bloco explicativo, nenhum
tooltip longo, nenhum aviso legal na tela de trabalho** — o que for obrigação de
transparência pertence aos instrumentos do §4, não ao cartão de julgamento.

---

## 4. GATE A-3 — privacidade / suboperador · 🔴

### 4.1 O que o repositório prova

| Verificação | Resultado |
|---|---|
| existe página de política de privacidade | **sim** — `src/app/(public)/privacidade/page.tsx` |
| a política vive em código | **não** — a página **serve a versão vigente que está no banco**; o comentário é explícito: *"É o que permite ao jurídico publicar sem tocar em código"* |
| há infraestrutura de documentos legais + aceites | **sim** — migration `20260803140000_governanca_documentos_aceites_lgpd`, com `slug` livre (`^[a-z0-9-]+$`) |
| há **gate de aceite** que cobra versão nova | **sim** — `src/modules/governanca/gate.ts`, com duas exceções deliberadas (a própria tela de aceite e o exercício de direitos LGPD) |
| há canal **próprio do profissional** | **sim** — `/termos/profissional` (slug `termos-profissional`) e `/profissional/documentos-e-consentimentos` |

> **Consequência que muda o tamanho do problema:** fechar este gate **não exige
> código nem migration**. Exige **publicar documento** — e a plataforma já sabe
> exibi-lo, versioná-lo e **cobrar o aceite do profissional automaticamente**.

### 4.2 Primeira pergunta — a política precisa nomear a Anthropic?

**SIM — e a decisão já foi tomada, não por mim.**

A **ADR-056** (2026-08-02) decidiu, em texto: *"**Anthropic permanece** como
suboperadora e **deverá ser documentada na política de privacidade** (Bloco H),
com a mitigação existente mantida (prompt nunca logado)."*

**Não é interpretação nova.** É obrigação lavrada, com prazo vinculado ao Bloco
H, **ainda não cumprida**. A assistência de redação **não cria** a obrigação —
ela **remove a folga** de continuar adiando.

### 4.3 Segunda pergunta — dado profissional está coberto?

**NÃO.**

| Dimensão | ADR-056 | Assistência de redação |
|---|---|---|
| **titular** | a **paciente** (*"o texto clínico da paciente sai para a API da Anthropic"*) | o **profissional** |
| **origem** | rascunho assistido / ACE | resumo de evidência de prática, do cartão de julgamento |
| **finalidade** | curadoria do Caso | **assistência interna de redação ao Curador** |
| **instrumento onde o titular leria** | política de privacidade (paciente) | **`termos-profissional`** — instrumento diferente |

São **três diferenças reais**: titular, finalidade e instrumento. A ADR-056
resolveu o eixo da paciente. **O eixo profissional não foi tratado por nenhum
ato**, e é o que este recurso inaugura.

### 4.4 Terceira pergunta — documentação mínima

**Dois documentos, nenhum novo tipo, nenhum arquivo criado sem necessidade:**

| # | Instrumento | O que precisa passar a dizer | Como se publica |
|---|---|---|---|
| **1** | **política de privacidade** (slug `privacidade`) | a Anthropic como **suboperadora**, com finalidade e mitigação — **cumprimento da ADR-056**, independente desta feature | nova versão pelo painel de governança; **zero código** |
| **2** | **`termos-profissional`** (ou consentimento próprio, a critério do jurídico) | que **resumos de evidência de prática** podem ser processados por suboperador de modelo de linguagem, **exclusivamente** para assistir a redação do Curador; que **não há decisão automatizada**; e o que **nunca** é enviado | nova versão pelo mesmo painel; o **gate cobra o aceite sozinho** |

**Não criar** lista de suboperadores separada, aviso interno novo, nem registro
de tratamento novo, **se** o regime vigente já os acomodar — o repositório não
mostra tais instrumentos, e inventá-los é aumentar superfície sem necessidade.
**Decisão do jurídico.**

### 4.5 A minimização reduz o escopo, não a obrigação

Verificado e registrado: o fluxo envia **apenas** conceito, natureza,
`resumo`/`version`/`status` das evidências correntes **daquele cartão**, e o
limite de caracteres. **Não envia** Case inteiro · documentos integrais · dados
da paciente · outros profissionais · outros conceitos · nome, CPF, CRM, e-mail
ou telefone (identificadores viajam como UUID) · e a saída é validada contra eco
de identificador.

> Isso **encurta o texto** que o jurídico precisa escrever. **Não elimina** a
> obrigação de transparência, se ela existir.

### 4.6 Retenção no fornecedor — **fora do repositório**

Localmente: sugestões **não persistidas**, prompt **nunca logado**, output
**não guardado**, retenção **zero** — tudo verificado.

**No fornecedor:** o repositório **não contém** os termos contratuais da API
utilizada. **Nenhum prazo é inventado aqui.**

> ⚠️ **Verificação obrigatória antes da ativação:** confirmar, na documentação
> contratual da API, o regime de retenção e de uso para treinamento. **Se o
> contrato permitir retenção ou treinamento sobre o conteúdo enviado, isso muda
> o texto dos dois instrumentos do §4.4** — e pode mudar a própria decisão.

### 4.7 Transferência internacional

O suboperador é estrangeiro; o fluxo é, na prática, **transferência
internacional de dados**. **Não extrapolo além disso** — a base legal, a
salvaguarda aplicável e a redação são **decisão jurídica**, não arquitetural.

**Nomeado explicitamente como exigindo o jurídico.**

### 4.8 Autoridade que fecha o gate

| Papel | O quê |
|---|---|
| **jurídico / compliance** | redigir os dois instrumentos e confirmar retenção e transferência (§4.6, §4.7) |
| **DT-01 — Fundador** | aprovar a publicação e **autorizar a ativação** |
| **operação de governança** | publicar as versões pelo painel |
| ~~`03 ENGENHEIRO`~~ | **não** — não há ato técnico neste gate |

### 4.9 Menor ato necessário

1. Jurídico confirma **retenção e transferência** na documentação contratual da API.
2. Jurídico redige as duas atualizações (§4.4).
3. DT-01 aprova; a operação publica as versões.
4. O **gate de aceite existente** passa a cobrar do profissional, sozinho.
5. Só então o DT-01 autoriza a ativação técnica.

**Nenhum passo exige código, migration ou alteração de flag pelo Engenheiro.**

---

## 5. Tabela final

| Gate | Estado |
|---|---|
| **G-2.3-5 reconciliada** | 🟢 **VERDE** |
| **Copy normativa reconciliada** | 🟢 **VERDE** |
| **Privacidade / suboperador** | 🔴 **VERMELHO** |

## 6. Veredito

> ### ATIVAÇÃO BLOQUEADA EXCLUSIVAMENTE POR PRIVACIDADE
>
> **A-1 e A-2 fecharam nesta missão**, sem tocar em código: a G-2.3-5 foi
> emendada com a distinção entre **sugestão de redação** e **pré-preenchimento**,
> o §5 do mesmo Contrato foi conferido e não conflita, e a copy passou a ter
> **dois textos canônicos governados pelo mesmo booleano que gateia a
> funcionalidade** — de modo que a tela não pode afirmar o que a configuração
> desmente.
>
> **A-3 não fecha aqui, e não deveria.** Depende de: (1) **cumprir a ADR-056**,
> que desde 2026-08-02 obriga documentar a Anthropic como suboperadora e segue
> pendente; (2) **tratar o eixo profissional**, que nenhum ato cobriu — titular,
> finalidade e instrumento são diferentes dos da paciente; (3) **confirmar
> retenção e transferência** na documentação contratual, que **não está no
> repositório**.
>
> **Documento:** política de privacidade (`privacidade`) e `termos-profissional`.
> **Responsável:** jurídico/compliance redige; **DT-01** aprova e autoriza.
> **Menor ato:** §4.9 — cinco passos, **nenhum deles técnico**.
>
> **A feature permanece desativada.** Nenhum env alterado, nenhuma chamada real
> com dado profissional feita nesta missão.
>
> **Não encaminhado ao `05 CERTIFICADOR`** — há gate vermelho.
