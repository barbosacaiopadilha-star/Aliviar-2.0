# 35 · Bloco 7 / D-1 — fechamento

**Estado:** implementado, pronto para o **04 VERIFICADOR** · 2026-08-12
**Contrato que este documento fecha:** [34](34_BLOCO_7_LANDING_D1.md)
**Base:** `dea21f1` · ledger **121** · nenhuma migration, rota, RLS ou backend

> ### Quem chegava pela primeira vez não encontrava o que a Aliviar faz.
>
> O header tinha logo e `Entrar` — que fala com quem já é de casa. Não havia
> navegação, não havia "Nosso Método", não havia "Concierge", e o único convite
> era entrar numa conta que a pessoa não tem.

---

## 1 · A reconciliação 7×8 — e por que ela precisou existir

A referência-mestra mostra **sete** blocos; a landing viva montava **oito**, e
quatro não aparecem na imagem. **D-1 foi resolvida como leitura ②: a referência
é a espinha visual, e os quatro blocos ficam.**

A prova não é um parecer — é o que a Track D **fez**: apagou 23 arquivos de
landing e, no mesmo contrato, blindou `landing/editorial/**` por escrito. Quem
quisesse a página mais curta tinha ali o momento exato.

**Preservados, e guardados por teste:** `ProblemaSection` · `RespiroSection` ·
`FaqCompactSection` · `ConviteSection`.

Houve uma segunda reconciliação, que o contrato não podia antecipar: o que a
referência chama de **"Como funciona"** é a seção densa das cinco etapas que a
página **já tinha**, com eyebrow `O Método`. Manter esse eyebrow ao lado de uma
seção nova chamada "Nosso Método" colocaria a palavra *Método* em dois lugares
dizendo coisas diferentes. O eyebrow passou a ser `Como funciona`, e o `id`
`#como-funciona` foi para lá.

## 2 · Ordem final da página

```
Header (5 âncoras + Começar + Entrar)
Hero "Capítulo Zero"          duas colunas ≥1024px
Problema                      #problema        ← preservado
Respiro                                        ← preservado
Nosso Método (4 pilares)      #metodo          ← NOVO
Suas prioridades              #para-quem
Concierge Aliviar (3 pilares) #concierge       ← NOVO
Como funciona (5 etapas)      #como-funciona
Bloco institucional           #quem-somos      ← 4 linhas + 4 diferenciais
FAQ                                            ← preservado
Convite                                        ← preservado
```

## 3 · Navegação e CTA

`Quem somos` · `Para quem é` · `Como funciona` · `Nossa curadoria` ·
`Concierge`. **Cada `href` aponta para um `id` que existe**, e T-7-2 confere a
correspondência **nos dois sentidos** — renderiza a página, coleta os `id`
reais e exige que todo link do header caia num deles.

**CTA anônimo: `Começar` → `/sua-historia`**, com 44px medidos no navegador,
alcançável por teclado e presente **também** quando há `portalCta` — quem já
entrou também pode começar uma história. **`Entrar` permanece** e continua
sendo outro gesto: reconhecimento, não convite. `portalCta` autenticado ficou
intacto.

**Mobile:** os links vão para um drawer com `aria-expanded`, fechamento por
`Esc`, foco preso e devolvido a quem abriu — e **o CTA nunca entra no drawer**:
fica na barra. Um convite que se esconde atrás de um menu não é convite.

## 4 · Copy — literal, e por quê

Quatro pilares do Método, três do Concierge, quatro linhas editoriais (a quarta
dourada) e quatro diferenciais, todos palavra por palavra do contrato §6.3/§6.4
e guardados por teste, frase a frase.

**A colisão do Concierge, resolvida na copy.** A referência pede a seção; o
produto diz que até a decisão quem responde é o **Curador**, que não existe
identidade persistida de Concierge (`GAP-D12-C1`) e que não há SLA aprovado.
Então a seção descreve **o serviço**, nunca uma pessoa — e o terceiro pilar
começa literalmente por **"Depois que você escolhe"**, que é onde o Concierge
entra. A seção também vem **depois** de "Suas prioridades": posição é
argumento.

A frase que saiu do eyebrow do Hero — *"Curadoria médica independente"* — não
se perdeu: virou o **primeiro diferencial**, onde é verificável em vez de
decorativa. Por isso a seção de independência do plano §B.2 **não** foi criada.

## 5 · Regra de promessa

**Nenhuma frase nova afirma capacidade que o produto não tem.** T-7-4 varre
**padrões**, não uma lista de palavras: prazo em horas ou dias, resposta
imediata, horário de atendimento, dias úteis, "entraremos em contato", "em
breve", agendamento, intermediação com o profissional, número de médicos,
cidades ou casos, depoimento atribuído, selo, diagnóstico ou garantia de
resultado.

A escolha de varrer padrões é a lição de **M-C3**, na Track C: varrer
vocabulário deixou passar *"Sou a Maria Silva"*, porque nome próprio não tem
lista.

## 6 · Regra de WhatsApp — a que a V-D-1 tinha perdido

⛔ `Falar com a Aliviar` **não entra na Landing**. A Track C o definiu como
canal **da paciente**, nas sete superfícies autenticadas; aqui viraria suporte
a estranho, que é capacidade inexistente. A porta pública é `Começar`, e só.

T-7-5 olha o texto **e a constante**: `wa.me`, `whatsappHref`,
`ALIVIAR_WHATSAPP`, `WhatsappContact` e `ConciergeLink`. **A mutação M-7-4 foi
feita pela constante oficial** — sem escrever `wa.me` em lugar nenhum — e a
guarda pegou.

## 7 · Mobile e acessibilidade

| viewport | `scrollWidth` | overflow | fora da viewport |
|---|---|---|---|
| 1280 | 1280 | **0** | `[]` |
| 768 | 768 | **0** | `[]` |
| 390 | 390 | **0** | `[]` |
| 320 | 320 | **0** | `[]` |

As cinco etapas ficam **verticais em 390px**, medidas pelo topo de cada `li` —
nunca por classe CSS. Alvos ≥ 44px. Um único `<h1>`, seções em `<h2>`, pilares
em `<h3>`. O vídeo **não carrega sozinho**: nenhuma requisição de mídia antes
do clique.

## 8 · Os dois seletores órfãos

`.golden-thread-path` (em `globals.css`) e `.landing-faq-book` (em
`landing-editorial.css`) saíram. **Zero consumidores em `.tsx` conferidos
antes**, e os dois eram resíduo de landing morta — o achado estava registrado
em [33 §11](33_TRACK_D_FECHAMENTO.md). `landing-editorial.css` **não foi
reescrito**: só acréscimos, mais essa remoção nomeada.

## 9 · Evidências

`evidencias/` é gitignored. Reproduzíveis com

```bash
CAPTURA=1 node scripts/with-local-supabase.mjs npx playwright test tests/e2e/bloco7-landing.spec.ts --workers=1
```

| | viewport | o que prova |
|---|---|---|
| **EV-7-001** | 1440×900 | a página inteira, na ordem |
| **EV-7-002** | 1440×900 | Hero em duas colunas, eyebrow e os dois CTAs |
| **EV-7-003** | 390×844 | as cinco etapas verticais |
| **EV-7-004** | 390×844 | drawer aberto, com `Começar` visível na barra |
| **EV-7-005** | 320×568 | nada quebra |

Landing pública e sem dados: **nenhuma fixture, nenhum cleanup, nenhum resíduo
possível**.

## 10 · Mutações

| | mutação | caiu |
|---|---|---|
| **M-7-1** | remover `FaqCompactSection` | **2** — T-7-1, incluindo a guarda nominal da D-1 |
| **M-7-2** | link do header para `#inexistente` | T-7-2 |
| **M-7-3** | *"respondemos em até 24 horas"* num pilar | T-7-4 |
| **M-7-4** | WhatsApp no rodapé **pela constante oficial** | T-7-5 |
| **M-7-5** | pilar vira `<h1>` | T-7-6 |
| **M-7-6** | montar o `<video>` antes do clique | T-7-8 |

Nenhuma permaneceu — `git status src/` limpo ao fim de cada uma.

> **M-7-6 precisou ser reinterpretada, e o motivo é honesto.** O contrato pede
> `preload="auto"` no vídeo; mas o `<video>` só monta **depois** do clique, e
> ali `preload="auto"` é o comportamento certo. A mutação fiel ao que T-7-8
> protege é montar o vídeo cedo — e foi essa que rodou.

## 11 · Duas correções que a inspeção visual pegou

**A evidência mentiu, e eu vi.** EV-7-001/002 foram capturadas **depois** do
clique em `Começar`: `/sua-historia` também tem um `<h1>`, então a espera
passou na página errada e as duas fotos saíram do wizard. As capturas passaram
a sair **antes** da navegação.

**O logotipo atrás do título.** A seção Concierge nasceu com a cena da
recepção ao fundo — e essa cena traz o logotipo gravado na parede, que caía
atrás do título. É o mesmo erro que o Hero já havia corrigido. A seção ficou
sem fundo figurativo, no linho quente.

## 11.1 · V-B7-1 — FECHADO: o portão de captura

**O Verificador reproduziu o que a §11 só tinha contornado.** Eu movi a
chamada e resolvi *aquele ponto*; o `capturar()` continuou aceitando qualquer
tela, e a suíte seguia **6/6 com a evidência mentindo**. Mover a chamada não é
portão — é lembrar de não errar.

Agora `capturar()` **recusa antes de escrever** se qualquer condição divergir:

| # | Exigência |
|---|---|
| 1 | `pathname` exatamente `/` — e a mensagem nomeia a rota encontrada |
| 2 | marcador exclusivo da landing na página (`Capítulo Zero`) |
| 3 | o `h1` da landing, conferido por texto |
| 4 | **ausência** do `h1` do wizard (`Sua história merece ser contada…`) |
| 5 | viewport igual ao declarado **no nome da evidência** |
| 6 | estado esperado — para EV-7-004, drawer aberto com `aria-expanded="true"` |

Nenhuma condição sozinha bastaria: `page.url()` não distingue uma landing
quebrada de uma inteira, e conteúdo sozinho não distingue rota. **A verificação
roda sempre**, com ou sem `CAPTURA=1` — a escrita é que depende do gate. Assim
a guarda vale em execução normal, e não só quando alguém pede imagem.

Toda evidência declara viewport, enquadramento e propósito num mapa; nome fora
do mapa é erro.

## 11.2 · V-B7-5 — evidências com finalidade própria

EV-7-001 e EV-7-002 eram a mesma foto duas vezes, diferindo só no avanço das
animações. Agora:

| | Enquadramento | Prova |
|---|---|---|
| **EV-7-001** | página inteira, **reveals concluídos** | a ordem dos blocos, sem faixas vazias por conteúdo ainda oculto |
| **EV-7-002** | **recorte do topo** — header + Hero | as duas colunas em desktop, com `Começar` e `Entrar` |

A ordem dos blocos é provada **no DOM** antes da foto (posição vertical de cada
`id`), e as duas colunas por `gridTemplateColumns`. Os reveals são concluídos
marcando `data-inview` no teste — nunca alterando o produto.

## 11.3 · Provas de perda do portão

| | Mutação | Resultado |
|---|---|---|
| **H-B7-1** | capturar depois de navegar a `/sua-historia` | recusado; mensagem nomeia a rota; **PNG intacto** (tamanho e mtime idênticos) |
| **H-B7-2** | marcador exclusivo neutralizado no oráculo | recusado |
| **H-B7-3** | evidência de 390px pedida em 1280px | recusado |
| **H-B7-4** | EV-7-004 com o drawer fechado | recusado; **PNG intacto** |

Nenhuma mutação permaneceu, e nenhuma escreveu arquivo falso.

## 12 · Regressão

| | |
|---|---|
| Bloco 7 · componente | **31/31** |
| Bloco 7 · unitário | **26/26** |
| Bloco 7 · e2e | **6/6** |
| suíte de componentes | verde |
| suíte unitária | verde exceto **G-6** |
| typecheck · lint | limpos |
| `npm run build:local` | verde |
| ledger | **121** — inalterado |

**G-6 continua pré-existente e alheio:** lê `supabase/migrations/*`, e o delta
do Bloco 7 não tem um único arquivo SQL — são seis arquivos de landing e três
de teste.

## 13 · Gaps preservados

`GAP-D-1` · `GAP-D-2` · `GAP-D-3` · `GAP-C-2` · `GAP-C-3` · `GAP-B3-COPY-ID` ·
**D-5** · **D-6** · **D-7** · **D-8** · D-10 · GAP-D12-C1 · A3b/A4 · G-6 ·
V-D-1 e os três achados do detector · dívida do banco local ·
`FOUNDATION_VERIFICATION.md` fora do Git — **todos intocados**.

## 14 · Commits

| commit | o quê |
|---|---|
| `dea21f1` | contrato 34 (Arquiteto) |
| *(este)* | navegação, duas seções, Hero em duas colunas, institucional, CSS, testes, e2e e fechamento |

---

# BLOCO 7 / D-1 IMPLEMENTADO — PRONTO PARA O 04 VERIFICADOR

**Zero migration, zero rota nova, zero RLS, zero backend.** Seis arquivos de
produção, nenhum componente visual novo — `LandingSection`, `LandingEyebrow`,
`LinkButton`, `ImmersiveBackdrop` e `RevealGroup` foram reusados, como o
contrato exige.
