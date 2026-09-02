# Onde retomar — fechamento da sessão de 2026-08-28

> Documento de handoff, escrito na madrugada de 28/08. Sucede o
> `CONTINUIDADE_2026-08-27.md`, que continua válido no que não for contrariado
> aqui — as lições dele, em especial, seguem inteiras. O canônico é
> `docs/AGENTS.md`, `docs/DECISIONS.md` e `docs/REGISTRO_UNICO_DE_ACHADOS.md`.

---

## 1 · Antes de qualquer coisa

**O repositório não está no diretório de trabalho primário.** O primário
(`C:\Users\barbo\Projects\aliviar-conexao`) está vazio. O repositório real vive
em `C:\Users\barbo\OneDrive\Desktop\PROJETOS DO CLAUDE\aliviar`.

**Leia `docs/AGENTS.md` integralmente antes de alterar qualquer coisa.**

**Tudo o que esta sessão produziu FOI A PRODUÇÃO.** Árvore limpa, nada
pendente. O commit vigente se confere em `/api/build-info`, que devolve o que
está de fato no ar — o deploy leva cerca de um minuto depois do `push`.

**E O SÁBADO ESTÁ VERIFICADO PRONTO** (verificação de 30/08, **refeita em
31/08 depois das mudanças do dia** — rodada, não afirmada): repo = produção,
pasta da mesa **37/37 byte a byte**, conteúdo crítico **12/12**, R$ 450 morto em
toda superfície, Kit **15/15** no ar. **A suíte está em 2718 testes verdes
em 193 arquivos** (medido em 01/09; eram 2672 em 31/08).

*O handoff de 30/08 dizia aqui "13 guardas verdes"; não consegui reconstruir
o que aquele número contava, então troquei pelo total da suíte, que é medido.*

**Os documentos da sala foram regravados em 31/08**, por quatro mudanças que
alteram o que se faz nela: a ADR-108 (o Curador não fala de dinheiro), o
endereço canônico nos três papéis do cruzamento, o rótulo da Parte 5, e a
ADR-109 (nada por inferência; Parte 5 fora da sala) — com guardas novas que as
travam. **O `LEIA-ME.txt` da pasta abre com as quatro** — quem imprimiu antes
de 31/08 precisa imprimir de novo.

**A pasta ganhou uma terceira seção em 31/08 — `3 - Documentos da empresa`** (os cinco instrumentos do advogado em PDF, os `.docx` originais, a Política de Privacidade, a leitura técnica das pendências e as perguntas ao advogado). **Nada dali se usa na sala.** E ela tem dois arquivos que não são documentos da operação, por isso
entram na conta dos 22: o `LEIA-ME.txt`, que é da própria pasta, e o
`MENSAGENS - convite das quatro pessoas.txt`, escrito em 31/08 — **a fonte dele
está em `docs/rede/ensaio/mensagens-de-convite.txt`**, idêntica byte a byte,
porque material operacional que só existe na área de trabalho é a classe de
defeito que este dia inteiro tratou. O que resta para o Ensaio é humano e está no PRE-VOO
da pasta da mesa: as quatro pessoas, a impressão com a separação das folhas, e
telefone-relógio-canetas.

---

## 2 · O que mudou de regra nesta sessão

**Onze ADRs, e juntas elas redesenham a operação humana da Curadoria.** Leia as
onze antes de mexer em papel, guia ou tela — elas se apoiam, e cada uma responde
a uma pergunta que a anterior deixou aberta. **Os documentos operacionais já
foram reescritos para elas** (ver §5): o que estiver em papel confere.

### ADR-100 · o Atendente vira o Supervisor do processo

O **Atendente deixou de ser recepção**. O primeiro contato já é com ele, e ele
não desaparece no repasse — acompanha até o encerramento. Era uma **etapa**;
virou uma **espinha**.

Duas regras nasceram dentro dela e continuam sendo dela:

1. **O Supervisor não colhe história clínica no primeiro contato.** Ela é do
   Curador, com a Ficha. Um resumo clínico escrito antes chegaria ao Curador
   como versão pronta, e ele passaria a conferir uma história em vez de ouvi-la.
2. **Depois que o Curador assume, o Supervisor nunca opina sobre qual dos três
   caminhos.** Esta só apareceu ao editar o guia, e é a que protege o produto:
   antes, quem convenceu ia embora; agora fica na sala.

### ADR-101 · preço fixo, e ninguém ganha por conversão

Promovida a decisão própria porque é **política comercial**, não corolário de
papel. Sem margem para desconto na conversa, e **nenhum dos três papéis** ganha
por contrato fechado, Case aberto ou caminho escolhido.

O conflito nunca esteve em quem diz o número — **está em quem ganha com a
resposta**. E ela depende da ADR-083, que tirou o preço da vitrine: preço que só
existe na conversa precisa ser o mesmo em todas as conversas, ou vira preço por
freguês.

**Consequência prática:** o parcelamento virou a única resposta a "não cabe no
meu bolso", e por isso subiu no trabalho aberto.

### ADR-102 · a Consulta Inicial é do Curador, sempre

Três razões, e **a primeira corrige um erro meu da ADR-100**: eu li o princípio
da ADR-076 (*"quem colhe é quem usa"*) como se falasse de ordem de chegada, e
ele fala de **uso** — quem usa a história é o Curador, que a pesa contra os 29
subcritérios e assina o Relatório. As outras duas: **é dado de saúde e o Curador
é médico** (promessa escrita à pessoa em dois guias), e **a devolução só fecha
com quem ouviu**.

### ADR-103 · o Supervisor assiste, calado e autorizado

Responde a pergunta que a ADR-102 tinha deixado em aberto. Ele assiste, **desde
que a pessoa autorize**, e sai quando ela quiser sem precisar explicar.

**Não contraria a ADR-102 porque ouvir não é colher** — a Ficha, a devolução e
o registro continuam com o Curador. O que muda é que a história é contada **uma
vez só**, às duas pessoas que vão acompanhá-la.

**A forma foi imposta pela régua da casa:** o critério 20 do Formulário do
Profissional avalia médicos por *"acompanhante mediante autorização da pessoa"*
— a Aliviar não pode cobrar isso e não fazer. A pergunta explica **quem ele é**,
porque perguntar sem isso é pedir uma decisão que a pessoa não tem como tomar.
A instrução, com a frase pronta, está no bloco de abertura da **Ficha do
Assistido** — regra que só vive em ADR não acontece na sala.

**Dois custos registrados:** o círculo de quem conhece a história de saúde
cresce em uma pessoa, enquanto a privacidade está adiada (ADR-096); e eu havia
recomendado **não decidir antes do Ensaio**, porque presença muda a conversa. O
Fundador decidiu antes do teste, e o risco é do tipo invisível — a pessoa não
reclama de alguém a mais na sala, **ela só conta menos**.

### ADR-104 · a Consulta Inicial não se observa

O observador fica **fora** dela; entra nos outros atos. Com a ADR-103 já eram
duas pessoas da Aliviar na sala — com ele seriam **três estranhos e a pessoa**,
na conversa mais íntima do processo. A Ficha já protege esse momento por outro
lado (*"a conversa em si não se grava"*, P12), e **um observador é uma gravação
com olhos**.

**A tensão está escrita na ADR, porque é séria:** a regra mais nova e menos
testada da operação (ADR-103) vale na única sala que ninguém observa.

**O instrumento que sobra só existe no Ensaio**, e é bom: quem interpreta o
assistido é pessoa de confiança e **pode ser perguntada** — *"o que você teria
dito se estivesse sozinha com o Curador?"*. Um assistido real nunca diria isso.
Já entrou nas regras do `ensaio-geral.html`.

### ADR-105 · o Supervisor anota o processo, nunca a conversa

Fecha o que a ADR-104 deixou aberto. Ele anota **tempo, travas, o que faltou, o
que precisou ser perguntado duas vezes** — nunca o que a pessoa disse.

**Por que ele:** sem isso a Consulta Inicial não produz medição nenhuma (a
ADR-104 tirou o observador), e ela é o ato mais longo. E ele é **o único na sala
com as mãos livres** — o Curador conduz e preenche a Ficha, não pode observar a
si mesmo.

**A linha, com teste de bolso:** *esta anotação faria sentido sobre qualquer
Consulta Inicial?* Se só fizer sentido por causa desta pessoa, é conteúdo e não
entra. A ADR traz um exemplo de cada lado — princípio sem exemplo não se aplica
com a folha na mão.

**Inverte uma regra escrita, e diz por quê:** o Guia manda "preencher DURANTE,
não depois"; nesta sala ele anota **depois**, ao sair, porque **quem vê alguém
anotando enquanto fala passa a editar o que fala**. Só o tempo pode ser marcado
discretamente durante. A exceção está no Guia, logo abaixo do título que ela
contraria.

### ADR-106 · a Aliviar tem dois rostos

**O assistido conhece duas pessoas, e só duas: o Supervisor e o Curador.** Não é
constatação de falta de gente — é desenho, e continua valendo quando houver
equipe.

Fecha a colisão que a ADR-100 abriu: o Guia do Concierge dizia *"acompanhar a
pessoa até o encerramento"*, e a ADR-100 já tinha prometido que quem atende é
quem fica. **Duas pessoas acompanhando a mesma pessoa até o mesmo lugar.**

**O Concierge vira função, não rosto.** O Supervisor cuida da relação, o
Concierge da logística — e a logística acontece **atrás** dele. Os papéis
**não se fundem** mesmo sendo hoje a mesma pessoa, porque **quebram diferente**:
logística falhando é consulta marcada errado; relação falhando é a pessoa se
sentindo abandonada. Papel único esconde qual das duas quebrou.

**Duas bordas ditas:** o Administrador *pode* tecnicamente criar o acesso — a
porta fica como rede de segurança, o uso vira exceção com motivo no Case; e o
observador das primeiras rodadas é uma terceira pessoa que ela **vai** ver, e é
avisada antes.

**A regra para o futuro:** todo papel novo que quiser falar com o assistido
precisa provar por que precisa de um terceiro rosto. A pergunta não é *"esse
papel é útil?"*, é *"o que ele faz não cabe atrás de quem ela já conhece?"*.

**E ela passa a saber:** o documento que ela recebe ganhou o bloco *"Quem você
vai conhecer: duas pessoas, e só duas"*.

### ADR-107 · o preço passa a R$ 500, em 12× de R$ 41,67, sem entrada

Exerce o mecanismo que a ADR-101 previu — *"o número muda por decisão do
Fundador, para todos, ou não muda"* — e **destrava o roteiro**, que não podia ser
usado com o parcelamento em branco.

**Não há preço à vista diferente:** R$ 500 é o valor, de uma vez ou em doze. Os
quatro centavos do arredondamento (12 × 41,67 = R$ 500,04) estão ditos na ADR,
com a forma exata registrada para ninguém refazer a conta.

**O alerta que ele deixou:** o R$ 450 vivia em **quatro** lugares, e um deles é a
página pública `/o-que-e` — a vitrine dizia o preço velho em produção. Três
desses ninguém teria conferido. Por isso o `R$ 450` entrou na guarda de
vocabulário: **termo velho num guia constrange; preço velho num roteiro que
alguém lê em voz alta vira compromisso.**

**E uma guarda que eu não conhecia me pegou:** o `o-que-e-a-porta-de-quem-so-olha`
cobrava "R$ 450" no fonte da página e reprovou no minuto em que o número trocou.
É exatamente o que se espera dela — **o preço da vitrine não muda em silêncio.**

### ADR-108 · o Curador não fala de dinheiro (31/08)

**Achada pela análise dos questionários, e é a mais barata de consertar e a mais
cara de deixar.** A Ficha do Assistido pedia ao Curador, na Consulta Inicial:
*"Tenho limite financeiro — qual?"*, *"Aceito até esta faixa — qual?"*,
*"Preciso de parcelamento"*. Ou seja, **o médico que precisa estar livre de
interesse comercial perguntava o orçamento da pessoa** — depois de o Supervisor
já ter combinado preço no primeiro contato.

**Os conceitos 15 e 16 passam a ser colhidos pelo Supervisor.** Continuam no
catálogo e continuam chegando à Mesa; o Curador **transcreve** e circula a
importância, com a marca de origem impressa no bloco.

**O agravante que fechou o diagnóstico:** nem o Guia do Curador nem o Roteiro do
Curador mencionavam dinheiro em lugar nenhum. Os dois blocos **nunca foram
instruídos a ninguém** — existiam só no papel que ele preenche. Não era regra em
disputa; era resto. Resto sem dono não aparece em releitura: aparece na frente
da pessoa, tarde demais.

**A guarda é de forma, e por isso é testável:** nos conceitos 15 e 16 a Ficha
carrega `class="fonte"` e **não** `class="pergunta"`. Quem devolver a pergunta ao
Curador quebra o teste antes de imprimir.

---

### ADR-109 · a resposta nasce de pergunta (31/08)

**Do Fundador, com estas palavras: *"a minha história não deve colaborar pra
responder pergunta nenhuma; os cruzamentos têm que ser feitos todos pelo
Motor."*** Três consequências, todas impressas na Ficha:

1. **As catorze perguntas da Parte 4 se fazem sempre.** Nada se marca por
   inferência — o que cruza na Mesa é o que ela DECLAROU. A instrução antiga
   (*"as perguntas existem para os buracos que a história não cobriu"*)
   permitia deduzir sem perguntar, e virou o `SIM-76`.
2. **A âncora paga o custo:** *"você falou que o médico não te explicava nada —
   então me diz: o que te ajudaria a entender melhor?"*. Confirmar com ela é
   desejável; inferir por ela, proibido. O Diário mede o preço: contagem de
   *"isso eu já falei"* e o tempo da Parte 4.
3. **A Parte 5 se preenche depois que ela sai da sala** — os 13 círculos de
   juízo do Curador saem de diante dela (eram 29 gestos na sala; viram 16), e
   **a assinatura dela na Parte 6 passa a cobrir só o que é dela.**

Da revisão pedida pelo Fundador (*"o que melhora para o cliente se sentir
feliz"*) saíram ainda: a frase de abertura que o Curador DIZ a ela (*"cada
resposta sua vira um critério da busca — é assim que a escolha continua sendo
sua"*), a linha *"a ordem é a da conversa, não a do papel"* (a versão barata da
reordenação), e a **de-numeração**: nenhum documento operacional cita mais
conceito pelo número da Ficha — citam pelo nome, e a guarda acha blocos pelo
código canônico. **A Ficha ficou livre para ser reordenada.**

**A ADR-073 segue em vigor**, e foi atravessada duas vezes nesta sessão a
pedido explícito do Fundador (a cena nova em `/solicitar-atendimento`). Dito em
voz alta antes e registrado no commit, que é o padrão a manter.

---

### ADR-111 · o WhatsApp oficial passa a ser (11) 97098-1354 (01/09)

Substitui o número que a MISSÃO 205 fixou. **A troca foi uma linha**, e é o
retorno do desenho daquela missão: `ALIVIAR_WHATSAPP` em
`whatsapp-contact.tsx` é fonte única, e as sete superfícies da área da
assistida mudaram por consequência, nenhuma tocada.

**O que a troca revelou:** a guarda que protegia a fonte única **era ela mesma
uma segunda fonte** — fixava o literal no próprio teste. Corrigido junto: a
guarda agora lê o valor da constante, e ganhou uma asserção nova — **o número
exibido tem de ser o mesmo do link**.

**O que NÃO mudou, de propósito:** a doutrina do canal (contextualizado por
tópico fechado, sem texto livre, nunca menu principal); os telefones de exemplo
em `lead.ts`, que são dado de teste do algoritmo; e a ata das missões passadas
em `docs/repaginacao/` — reescrever ata é apagar história.

**A parte pública do site não mostra o número** — conferido em produção. Ele
aparece só depois de a pessoa ter acesso. Se algum dia for para a vitrine, é
decisão à parte: **o repositório é público no GitHub, e número em página
pública é número raspado.**

---

## 3 · O estado real, em uma frase

**Continua sendo a operação, não o código** — e a evidência agora é dupla: a
Landing foi revisada inteira (notebook e celular, nada a consertar), e uma
**auditoria fina de todo o site público** fechou com **um** defeito real — as
âncoras da navegação (`SIM-64`), corrigido e com guarda endurecida no mesmo
commit. Vocabulário, promessas, rotas, links, alt de imagem e console: limpos.

**E em 31/08 a evidência virou tripla, na direção que importa: o defeito parou
de estar na tela e passou a estar nos INSTRUMENTOS.** Os três papéis que a Mesa
cruza levaram três correções num dia — o Curador perguntava o orçamento dela
(ADR-108), os 29 conceitos não tinham endereço comum (`SIM-67`), e treze
critérios do Curador eram rotulados como declaração dela (`SIM-73`). Nenhum
apareceu em auditoria de tela, porque **nenhum estava na tela.** Tudo em
produção e conferido no PDF baixado de lá.

**E em 01/09 a evidência ganhou uma quarta forma, a mais desconfortável: o
defeito estava no que o site DIZ DE SI para fora, onde nenhuma tela mostra.**
Uma varredura do site inteiro — 34 rotas, público e logado, desktop e celular —
achou **zero erro de console, zero transbordo, zero página quebrada** (`SIM-90`)
e, ao mesmo tempo, quatro defeitos que nenhum olho pega: **nenhuma página tinha
`og:image`**, o sitemap tinha duas URLs, não havia canônico, e as quatro
páginas jurídicas vazias eram indexáveis (`SIM-87`). **O primeiro é o que mais
custava:** o WhatsApp acabara de virar o canal (ADR-111), e todo link que o
Supervisor mandasse apareceria como um retângulo cinza.

---

## 4 · Decisões que estão com o Fundador

| O quê | Situação em 28/08 |
| --- | --- |
| ~~**Entrada e parcelas**~~ | **DECIDIDO — ADR-107.** R$ 500 pelo ano, em até **12× de R$ 41,67, sem entrada**. Sai da lista. O R$ 450 anterior vivia em quatro lugares, um deles a página pública `/o-que-e`, e agora está na guarda de vocabulário: preço velho sobrevivente reprova a suíte. |
| **Quem é a primeira pessoa** | A ADR-096 só se sustenta se for alguém de dentro. **Decidida ela, o Case sai por consequência** — e o `61da4e7e`, herdado de julho, para de ser pergunta. É dado de produção; o repositório não sabe de quem ele é. |
| **Quem conduz** | **As ADR-100 a 105 já dizem o que cada um faz, e quem entra em qual sala — falta dizer QUEM é cada um.** Curador, Supervisor, Concierge e um observador que não trabalhe, com nome, antes do dia. Na Consulta Inicial ficam **duas** pessoas da Aliviar (Curador conduzindo, Supervisor calado e só se ela autorizar); o observador entra nos outros atos. |
| **Onde a jornada para** | Os três profissionais da Rede são reais. Decidir **antes**. |
| **A resposta do advogado** | **Novo item, e é o gargalo de tudo que envolve dinheiro e estranho.** Os cinco documentos CHEGARAM em 31/08 e estão em `docs/juridico/` — o que falta são as respostas às perguntas enviadas em **03/08**, quatro semanas paradas. Sem elas: sem contrato assinável, sem aceite, sem cobrança legítima, sem pessoa de fora. Prioridade: **D-6** (as testemunhas) e os campos em branco. **Já adiantado para acelerar a resposta:** a leitura técnica de cada pendência e a Política de Privacidade escrita — os dois em PDF, prontos para anexar. O pedido a ele passa a ser *confirmar ou corrigir*, não redigir. |
| **Como se cobra** | **Não existe cobrança nenhuma no código** — nem gateway, nem assinatura, nem link. O preço está decidido até os centavos e não há como recebê-lo. Decisão + link, FORA da plataforma (ver §2 da conversa de 31/08: construir isso agora é congelar em código regras que ninguém tem opinião para dar). |
| **Conta PJ, contador, nota fiscal** | **Não há traço disso no repositório.** Se não existir, vem antes do link de pagamento — receber sem poder emitir nota é problema guardado, não começo. |
| **A agregação do Motor: `E` ou `OU`, por conceito** | **Novo em 31/08, da auditoria do Motor — e é bloqueador de qualquer correspondência nova.** O motor exige que **toda** opção marcada por ela seja satisfeita. Está certo para os três conceitos de hoje (quem pede explicação sem jargão **e** algo escrito quer as duas). **Disponibilidade é o contrário:** ela marca as janelas em que consegue, e basta ele atender **uma** — com a regra atual, o médico que atende de manhã sai `NAO_CONFIRMADO` para quem pode de manhã. Não se resolve com `satisfied_by`: exige o Catálogo declarar a agregação e o motor lê-la. Junto vem a decisão **ordinal vs enumeração** para faixas de prazo. Ficha em `docs/curadoria/PROPOSTA_CORRESPONDENCIA_DOS_TRES_HIBRIDOS.md` |
| **ADR-095** — tamanho da Mesa | Esperar o uso real. |
| **Domínio próprio** | **MUDOU EM 31/08 (`SIM-72`): a Aliviar TEM o domínio, e o código dizia que não.** No RDAP do registro.br, `aliviarcuradoriamedica.com.br` está `active`, **em nome de Caio Padilha, pago até 13/07/2027**, e o DNS na Hostinger já aponta para a Vercel. Só não está ligado a projeto nenhum — ficou com o `aliviar-curadoria-medica-prod`, que foi apagado. **Dois passos, os dois do Fundador:** painel da Vercel → projeto `aliviar` → *Domains* → adicionar o domínio e o `www.`; depois definir `NEXT_PUBLIC_SITE_URL`. **Nenhuma linha de código muda** — o `site-url.ts` já lê a variável primeiro. Continua verdade que a primeira Curadoria não tem estranhos; o que deixou de ser verdade é que o domínio não existe, e o site se anuncia como `aliviar-2-0.vercel.app` por causa dessa frase errada. **Vigiar: 13/07/2027.** |
| **"Quem somos"** | **Não pode ser escrito pelo agente.** Precisa de fatos que só o Fundador tem: quem está por trás, com que formação, por quê. Preencher por conta própria seria afirmar o que o sistema não garante (ADR-064) — numa página sobre confiança, o pior lugar possível. |

---

## 5 · O que esta sessão entregou

**A Ficha do Assistido** (`bed7cda`) — a pendência registrada era o nome do
arquivo; ao abrir, era maior: o documento que a pessoa **assina** se intitulava
"Ficha da Paciente", e três peças-irmãs o citavam assim. **Não** se mexeu na voz
feminina do corpo (~40 "ela/dela"): a ADR-097 decidiu o substantivo, o gênero
deste papel é outra decisão.

**O gerador das peças de papel** (`scripts/gerar-rede-pdf.mjs`) — as peças de
`docs/rede/` nasceram sem gerador, e foi por isso que o rótulo pôde divergir do
arquivo por dias. A saída é **determinística**: `git status` limpo depois de
rodar já é a conferência de que os PDFs conferem com os fontes. Reproduz os
antigos byte a byte; o Ensaio exigiu margem própria (18/16mm) — sem ela reflui
de 11 páginas para 9.

**A sala de espera** (`ffa5c62`) — a cena do Fundador atrás do "Fale com a
Aliviar", com o retrato dele **intacto**. Cartão claro, não o escuro da porta de
acesso: cena clara pede letra escura.

**As SEIS ADRs da operação humana** — a **ADR-100** e a sua chegada aos
documentos (Correção de Domínio emendada, o aviso do `/admin/equipe` corrigido,
o rótulo de tela virando "Supervisor" em oito mapas, os dois guias reescritos),
mais a **101** (preço fixo, sem comissão), a **102** (a Consulta Inicial é do
Curador), a **103** (o Supervisor assiste, autorizado), a **104** (o observador
fica fora) e a **105** (o Supervisor anota o processo, nunca a conversa). O §2
resume as seis, na ordem em que uma abriu a pergunta da outra.

**E o Ensaio Geral foi atualizado para essa operação** — cinco atos, elenco com
Supervisor e observador, e as regras novas nas duas peças de papel.

**A REESCRITA OPERACIONAL, em quatro rodadas** — os roteiros e guias deixaram de
descrever a operação anterior. O que apareceu no caminho vale mais que o texto:

- **Havia DOIS roteiros de atendimento**, e eu tinha renomeado o errado. O de
  `docs/guias/` tem o PDF ignorado pelo Git; o de `docs/rede/` é o que vira PDF
  no Kit e alguém baixa em `/admin` para imprimir — e era o intocado. Rótulo
  trocado num lugar e não no outro: a família do `SIM-62`, repetida no mesmo dia
  em que eu a registrei. Agora é `roteiro-do-supervisor.html` →
  `Roteiro-do-Supervisor-Aliviar.pdf`, com gerador, cartão e teste acompanhando.
- **O Guia do Supervisor estava errado sobre o SOFTWARE**, não só sobre a
  doutrina: dizia que ao entregar ao Curador *"você deixa de ver o caso na sua
  fila"*, e `listLeadsForAtendente` lista todos os contatos não arquivados —
  sempre listou. Conferido no código antes de reescrever.
- **A seção 1 do Roteiro do Concierge era o retrato do problema que a ADR-106
  resolveu.** Ensinava uma TERCEIRA pessoa a dizer *"a partir de agora eu sou a
  sua pessoa aqui"*, e justificava o remendo admitindo que *"a pessoa acabou de
  contar a história inteira duas vezes"*. Remendo bom para desenho ruim: agora
  não há passagem, e a seção ficou com duas frases.
- **Concierge → Acompanhamento** nos dois documentos; **Curador** ganhou a porta
  da ADR-103 nos dois, com a frase pronta e o motivo (critério 20).

**A GUARDA DE VOCABULÁRIO, que encerra o `SIM-63`** —
`tests/unit/vocabulario-dos-guias.test.ts` varre as duas pastas e reprova
quando um termo aposentado por decisão sobrevive num documento que alguém vai
imprimir. **A regra tem forma própria, e é o miolo dela:** o termo só pode
aparecer na linha que também cita a ADR que o aposentou — é o que separa menção
histórica deliberada (que tem valor) de sobra.

**Achou seis sobras no minuto em que nasceu**, e a pior era minha: o `<title>`
do roteiro publicado ainda dizia "Roteiro de Atendimento" — troquei o `<h1>` e
esqueci a aba. Entre as outras, um bloco DOUTRINÁRIO inteiro do Roteiro do
Curador comparando o papel dele com o do "Atendente" — que, ao ser consertado,
ganhou o que faltava: o Supervisor **comunica** um preço fixo sem ganhar por
conversão, e depois da apresentação **também não opina**.

**OS DEZ GUIAS ENTRARAM NO KIT DA CURADORIA** (`/admin`), a pedido do Fundador
— **construção nova sob a ADR-073, dita em voz alta e registrada no commit**.
Até aqui eles não existiam em lugar nenhum além do disco de quem rodava o
gerador. O cartão passou a ter **duas seções**: *"Para preencher na sala"* (as
quatro peças de rede) e *"Para ler antes — na ordem"* (os onze guias, em pares
por papel). Conferido em produção: os downloads respondem 200.

Duas escolhas ficaram no código: a saída do gerador virou **determinística**
(sem isso, cada corrida sujaria o Git com dez binários), e os arquivos ganharam
**nome de gente** — o fonte é `2-supervisor.html` porque o número é a ordem de
leitura, mas quem baixa quer `Guia-do-Supervisor-Aliviar.pdf`. **A ordem passou
a viver no cartão**, que é onde ela é lida.

**E uma cópia foi para a Área de Trabalho do Fundador** — os dezesseis
documentos, organizados por uso, com um `LEIA-ME` que abre pelo preço vigente.
Antes de copiar, os dois geradores rodaram e o `git status` voltou vazio: o que
está na pasta é o que está no repositório e no ar. **O risco dela está no §7.**

**Cada uma chegou ao papel no mesmo commit em que foi decidida** — o rótulo nas
telas, a fronteira nova na seção 8 do Roteiro, a instrução de autorização no
bloco de abertura da Ficha. É a disciplina que o `SIM-62` cobrou de manhã:
decisão que não chega ao documento vira divergência em dias.

**`SIM-62`** — a suíte E2E cobrava texto de tela que não existe mais, e ninguém
via porque E2E não roda no ambiente local. Quatro pontos corrigidos.
**Fica ABERTO** um segundo grupo, anterior e independente:
`admin-dashboard.spec.ts` exige cinco indicadores removidos de propósito em
24/08 — consertá-lo é reescrever o teste, não trocar uma palavra.

**A AUDITORIA FINA DO SITE, e o `SIM-64` que ela achou** — varredura das rotas
públicas (status, `h1`, meta, `alt`, saltos de cabeçalho), vocabulário da
ADR-097, promessas da ADR-064, links internos, console; e o olho, em notebook e
celular. **O achado real:** os três links do cabeçalho e o "Nossa curadoria" do
rodapé eram `#ancora` nua — porta pintada em TODA página fora da Landing,
inclusive na gaveta do celular. Corrigido para `/#ancora` e **provado com
clique real** nos dois sentidos: de `/o-que-e` navega e desce à seção; na
Landing segue fragmento do mesmo documento.

**A ironia registrada no `SIM-64`:** existia guarda para link morto no header —
mas ela validava só contra a Landing e, ao filtrar por `startsWith("#")`,
**exigia a forma quebrada**. Foi endurecida nas duas pontas: reprova âncora nua
E confere o destino. Dois cosméticos anotados sem correção no commit
`b013e14`: o fallback do Suspense do `/login` com o título antigo, e a frase
truncada de `/sua-historia`.

**A AUDITORIA DE CONTEÚDO, e o `SIM-65` que ela achou** (30/08) — pedida pelo
Fundador depois da auditoria do site: não onde os documentos se chamam, mas **o
que eles afirmam** contra a doutrina. A suspeita dele (*"o médico indica 3
caminhos"*) apontou a classe certa: **os dois roteiros do Supervisor mandavam
dizer "a gente não indica um" e, três linhas depois, fechavam o preço com
"honesta sobre quem INDICAR"** — o verbo proibido, dentro do documento que o
nega, incluindo o impresso do Kit. O site já usava a forma certa (*"quem
apresentar"*). Junto: *"até três opções"* onde a Mesa entrega **exatamente
três** (o banco recusa ≠3). **Os passo a passo do site e do guia 10 estavam
certos** — o defeito morava nos roteiros de conversa, onde alguém lê em voz
alta. No mesmo passe: vocabulário ADR-097 residual nas peças, carimbos
atrasados, e a pasta da mesa atualizada **no mesmo commit** (regra do §7,
cumprida na primeira vez em que foi testada).

**A VERIFICAÇÃO DE SENTIDO** (30/08, `1c0c5b4`) — terceira e última passada:
não o que os documentos dizem, mas se **fazem sentido lidos juntos**, que é como
serão usados na mesa. Quatro achados, quatro correções:

- **O observador estava escalado para a sala de onde a ADR-104 o tirou.**
  Quando os quatro atos do Ensaio viraram cinco, a linha do elenco não foi
  renumerada: "FORA da Consulta Inicial — entra nos atos 2, 3 e 4", sendo que no
  elenco novo a Consulta É o ato 2. Quem obedecesse a tabela violaria a ADR-104
  achando que a cumpria. Agora: atos 3, 4 e 5.
- **A ordem divergente, agora dita:** o Guia manda "os médicos antes do
  assistido"; o Ensaio os entrevista depois da Consulta. Nota no ato 3 do
  Ensaio, com a regra que vale nos dois: **sem formulário assinado, ninguém
  entra na Mesa**.
- **A medição sem onde ser escrita:** a tabela de Tempos do Diário não tinha
  linha para o primeiro contato — o ato que a ADR-100 criou e cuja carga o
  próprio Diário manda medir. Linha adicionada.
- **O guia citava a tela com uma frase a mais** ("Você não precisa fazer mais
  nada agora", que a `MENSAGEM_DE_SUCESSO` não diz). A regra do próprio guia
  decidiu: a tela está certa. Aparado.

Conferido limpo: Acompanhamento pós-ADR-106, wizard vs guia ("cinco passos"),
números cruzados (nove passos · cinco atos · três folhas · 29 subcritérios), e
nenhuma objeção prometendo o que a ADR-064 proíbe.

**O SUBLINHADO DO FUNDADOR, e a quarta passada** (30/08, `4655997` e
`5dded42`) — ele sublinhou "Um médico" na frase-resumo de `/o-que-e`, e tinha
razão onde a minha auditoria de sentido tinha APROVADO: aprovei a página pelo
passo 3, que amarra o vínculo ("Um médico — o seu Curador"), sem notar que a
frase-resumo, a meta description, o "lê e assina" e a FAQ diziam a forma solta.
**Quatro ocorrências, simétricas no site e no guia 10**, todas agora em "um
curador — que é médico". O leitor não lê a página inteira — lê a frase-resumo.

Na sequência, a **quarta passada** (classes ainda não caçadas): contagens
internas (Ficha 29/29, Formulário 29, grade da Folha 152 células ✓),
referências a partes ("assinar a Parte 6" → a Ficha TEM a Parte 6 ✓),
promessas de tela do documento do assistido (WhatsApp, PDF e "Meus dados"
existem no código ✓), e gênero por documento (cada um internamente consistente
✓). **Uma correção:** o campo "Paciente:" na Folha da Mesa — sobreviveu a tudo
porque os greps rodaram case-sensitive em minúscula, e ele tem P maiúsculo.
**Um achado anotado sem toque:** "Você não faz isso sozinha" vive na
`ConciergeSection`, que é código morto (ninguém a importa; a página monta
`AmbienteConcierge`) — órfã para uma futura limpeza, não defeito de uso.

**O PRÉ-VOO DO SÁBADO** (30/08, `70dd525`) — em dois lugares: na pasta da mesa
("PRE-VOO do Ensaio.txt", onde será usado) e em
`docs/rede/ensaio/pre-voo-do-ensaio.txt` (onde vira registro). A metade
verificável foi **verificada por máquina na hora**, não afirmada: fonte, PDF,
produção e mesa na mesma versão byte a byte; data no papel; preço único; Kit
respondendo. A metade humana virou checklist com caixas.

**O item que justifica o documento: a pegadinha da impressão.** O PDF do Ensaio
carrega as fichas SECRETAS da Dra. Marta e do Dr. Paulo no mesmo arquivo das
regras — quem imprime as 11 páginas e deixa o maço na mesa entrega ao Curador as
respostas das entrevistas, e o ato 3 morre. A instrução de separar as folhas
pelas capas, com o destino de cada parte, está escrita ANTES de acontecer.

**A VERIFICAÇÃO FINAL** (30/08, a pedido do Fundador) — treze checagens rodadas
de novo, do zero: repo/produção, os 18 arquivos da mesa byte a byte, os 12
conteúdos críticos nos fontes (data, cinco atos, observador 3–5, ADR-103 na
Ficha e no Ensaio, Parte 6, linha do primeiro contato, exceção ADR-105, campo
"Assistido:", preço nos dois roteiros), o R$ 450 morto, as guardas, os 14
downloads. **A única "falha" era do instrumento:** o padrão de busca da exceção
ADR-105 não atravessou um `<strong>` no meio da frase — conferido na fonte
antes de reportar, e o placar real fechou **12/12**. É a lição 1 aplicada em vez
de reaprendida.
Também fixado: o roteiro do ato 1 é o da LIGAÇÃO (pasta 2, nº 2), não a peça de
WhatsApp; e o Guia sai em duas cópias — uma é roteiro, a outra é o Diário
partilhado.

### A análise dos questionários, e a ADR-108 que saiu dela (31/08)

**A Ficha tem duas metades que se parecem e não são.** Parte 4 (conceitos 1–16)
são perguntas com voz dela. **Parte 5 (17–29) não tem pergunta nenhuma** — o
Curador circula a importância a partir da leitura da história, e dez dos treze
são credenciais do médico (graduação, residência, fellowship, produção
acadêmica).

**Corrigido no fim do dia (`SIM-73`), por decisão do Fundador:** a escala dos 29 perguntava *"Quanto isto
importa **para ela**?"* e a Folha da Mesa copia isso numa coluna chamada
**"Importância (dela)"**. Mas em **13 dos 29 ela não disse nada** — é juízo do
Curador rotulado como declaração dela, e cruzado na Mesa como se fosse. Mesma
família do `SIM-55` e do `SIM-28`: autoria atribuída errado. **O conserto é de
rótulo, não de método** — e foi exatamente isso: a Parte 5 passa a dizer
*"Quanto isto pesa neste caso? — leitura do Curador, ela não é perguntada"*, a
abertura da Parte 5 nomeia a consequência, e na Folha a coluna vira
**"Importância"** com as treze linhas marcadas com **°**. Os cinco níveis ficam
como estavam: mexer neles quebraria a cópia para a Folha. Guarda por contagem —
16 rótulos com a voz dela, 13 com a leitura dele, nenhuma parte com o rótulo da
outra.

**Outros dois achados, não corrigidos de propósito** (mexem em pergunta, e
pergunta alterada às vésperas do Ensaio é instrumento que ninguém leu):

- **Conceito 12** — *"O que você precisa saber antes de aceitar um tratamento?"*
  com as opções *todas as opções · a de não fazer nada · os riscos · os custos*.
  Todo mundo marca tudo. Pergunta que não discrimina ocupa o tempo das que
  discriminam.
- **Conceito 7** — *"outros profissionais que **precisariam** conversar entre
  si?"*. O "precisariam" é juízo clínico. Ela sabe quem a acompanha; não sabe
  quem deveria conversar com quem.

**As três apostas para o sábado conferir** (o Diário já pergunta em que item ela
travou): ela trava no 16, marca tudo no 12, e não sabe responder o 7. Se
baterem, deixa de ser opinião.

**O que foi feito**, além da ADR-108: Ficha (blocos 15/16 viram transcrição e a
nota da Parte 4 nomeia a exceção), Roteiro do Supervisor publicado e do Kit (as
duas perguntas de viabilidade, com o alerta de não confundir com o preço da
Aliviar), Guia do Supervisor (linha na tabela do que ele registra), Guia e
Roteiro do Curador (a proibição, e o que fazer se ela puxar o assunto), Ensaio
Geral (ato 1 colhe 15 e 16), pré-voo (quarta pergunta do sábado), teste-guarda
novo em `vocabulario-dos-guias.test.ts`, seis PDFs regravados e copiados para a
pasta da mesa. **2664 testes verdes, `tsc` limpo.**

**Uma medida colhida no caminho:** a Parte 5 marca as **descrições** de conceito
com a mesma classe `pergunta` das perguntas de verdade. Não muda o que a pessoa
lê — o texto ali é definição, não pergunta —, mas foi o que fez a primeira
versão do teste contar 27 onde eu esperava 14. Ficou anotado no teste.

### A simetria dos três papéis, e o endereço que faltava (31/08)

**Análise conjunta da Ficha dela, do Formulário dele e da Folha da Mesa**, pedida
pelo Fundador com uma condição: mudar sem a Mesa endoidar. Seis achados
registrados, `SIM-66` a `SIM-71`; **dois corrigidos, e só os que custam papel.**

**O que estava debaixo de tudo (`SIM-66`, aberto):** cada opção do médico tem no
Catálogo o campo `satisfiedBy` — *"esta resposta dele atende àquele pedido
dela"*. **Está nulo nas 139.** E 20 dos 29 conceitos se dizem
`cruzamento: "automatico"` sem nada com que automatizar. **O cruzamento inteiro
mora hoje na cabeça do Curador, na mesa, 29 linhas × 3 médicos.**

**Corrigido 1 — o endereço canônico (`SIM-67`).** Os três papéis numeravam os
mesmos 29 de três formas: o **5** dele era o **21** dela, o **6** dele era o
**15** dela, e a Folha agrupava numa sétima ordem. Montar a Folha custava
**116 buscas por nome** em cinco papéis. **As três ordens estão certas** — cada
uma serve ao seu leitor; o que faltava era um **endereço**, e ele já existia: o
`code` do Catálogo. Os três passam a imprimi-lo, com legenda na Ficha e na Folha
(no formulário do médico fica marca discreta, sem legenda: para ele é ruído,
para o Curador é ferramenta). Páginas intactas — 9, 10 e 3.

**Corrigido 2 — a Ficha tinha perdido opções do Catálogo (`SIM-68`).** Conferidas
as 16 perguntas dela contra a fonte: quinze batiam, uma não.
`ACESSO_LOCAL_DE_ATENDIMENTO` tem cinco opções — **em tempo de viagem**, que é
como as pessoas medem distância — e o papel mostrava só uma linha aberta. Era
exatamente a pergunta que a revisão da manhã tinha apontado como a pior da ficha:
**a resposta certa já existia e o papel a perdera.**

**Guarda nova, `tests/unit/enderecos-do-catalogo.test.ts`, e a forma dela importa:**
**lê o próprio Catálogo**, não uma lista. Conceito novo reprova o papel que ainda
não o tem — o `SIM-63` resolvido pela raiz em vez de por vigilância.

**Aberto, com fundamento escrito** (`SIM-69`/`SIM-70`/`SIM-71`): nove pares fora
do mesmo eixo; o conceito 13, onde o silêncio provável dela apaga a opção mais
eliminatória dele (*"não acompanha quem recusa a conduta indicada"*); e a revisão
das 16 do lugar de quem responde. **A regra de projeto que sai disso, e vale para
toda mudança futura: nunca mexer num lado só.** Tudo isso custa migration +
regeneração do Catálogo + paridade, e espera a primeira Curadoria real (ADR-073).

### A medição do Motor, e o que ela agravou (31/08)

Perguntado pelo Fundador se todas as questões somam no Motor, medi o Catálogo:
**11 `DIRETO` · 14 `INDIRETO` · 4 `NUNCA`.** Só onze dos vinte e nove entram na
conta. **As cinco de Formação são todas `INDIRETO`** — credencial não vira
ponto, e isso é a doutrina *"nós não ranqueamos"* escrita no banco, não só no
roteiro.

Dois fatos disso agravaram achados do mesmo dia, e as emendas estão no registro:

- **`MODELO_PREFERENCIAS_E_RESTRICOES` é `NUNCA`** — e é o único dos quatro
  `NUNCA` com **zero opções do lado dela**. O único conceito que **elimina
  caminhos** não entra no Motor de forma alguma. Contra o médico que declara
  *"não acompanha quem recusa a conduta indicada"*, **a única proteção que
  existe é o Curador ter perguntado bem e ter lembrado na hora da Mesa** (`SIM-70`).
- **`CONTINUIDADE_EQUIPE_DE_APOIO` é `automatico` E `DIRETO`** — soma no Motor
  sozinho — **e tem zero opções do lado dela.** É o único dos onze que soma com
  um dos lados vazio. É o `SIM-66` na forma mais concreta (`SIM-66`).

**Um comentário errado ficou anotado, não consertado:** o `catalogo-gerado.ts`
diz, no bloco que define `motorParticipation`, que *"entre os `humano` há dois
`NUNCA` e um `INDIRETO`"*. A medição dá **4 e 9**. É de uma versão anterior do
Catálogo, no arquivo que todo mundo lê para entender a semântica. Corrigir exige
mexer no gerador e regenerar com o Supabase local.

### O domínio que a Aliviar tinha e o código dizia que não (`SIM-72`, 31/08)

Conferindo o deploy, `www.aliviarcuradoriamedica.com.br` respondia
**`DEPLOYMENT_NOT_FOUND`**. **O domínio está vivo e é dele** — `active` no RDAP,
em nome de Caio Padilha, pago até 13/07/2027, DNS já apontando para a Vercel. O
que sumiu foi o projeto `aliviar-curadoria-medica-prod`, que segurava a ligação.

**O comentário do `src/lib/site-url.ts` afirmava como fato *"domínio que a
Aliviar não tem mais"* — e é essa premissa falsa que mantém o site se anunciando
como `aliviar-2-0.vercel.app`.** Reescrito com a medição e com o caminho de
volta. **A resolução por ambiente fica:** foi um endereço fixo em três arquivos
que sobreviveu, em silêncio, ao dia em que o domínio parou de responder — o
mecanismo estava certo, só a razão registrada estava errada.

**E eu errei no meio disso, do jeito que a lição 11 descreve.** Anunciei que
canonical e sitemap apontavam para página morta, lendo a linha 5 do arquivo num
resultado de `grep` — aquela linha é o comentário explicando que ele **parou**
de usar o domínio. **A produção publica `aliviar-2-0.vercel.app` corretamente.**

### As quatro mensagens de convite (31/08)

**Escritas porque a data já caiu uma vez.** O Ensaio foi marcado antes
(ADR-076, 22–23/08) e não aconteceu; o que faz uma data cair pela segunda vez
não é o instrumento — é gente não confirmada, e um "não posso" descoberto na
sexta adia o sábado inteiro. As quatro estão em
`docs/rede/ensaio/mensagens-de-convite.txt` e na pasta da mesa, prontas para
encaminhar: trocar o `[nome]` e enviar. **A fonte é o `.md`**, e dele saem o `.txt` (para copiar do celular) e o `.pdf` (3 páginas, na pasta da mesa) — o mesmo padrão do pré-voo, **para os dois nunca divergirem.** Escrever o texto à mão num `.txt` e gerar um PDF à parte teria criado a classe de defeito do `SIM-68`, em que a Ficha impressa perdeu opções que o Catálogo tinha.

**Como foram escritas, e o porquê de cada escolha:**

- **Sem jargão nenhum.** Nenhuma diz "ADR", "conceito", "assistido" ou
  "Método". São pessoas sendo convidadas para um sábado.
- **Nenhuma promete duração.** O Ensaio **mede** os tempos, não os prescreve —
  procurei estimativa nos guias e a única que existe é um `[tempo]` em branco
  no roteiro. Todas pedem a manhã e dizem a verdade: *"não sei quanto dura, e
  descobrir isso é metade do motivo"*. Inventar um número teria sido mais
  cômodo e menos honesto.
- **Duas guardam segredo do Curador** — a paciente (que não lê nada e não conta
  a história antes) e quem faz os dois médicos (fichas que o Curador não pode
  ler). A mensagem diz o motivo, para o segredo não parecer capricho: se ele
  souber antes, o ensaio mede a memória dele, não o instrumento.
- **A do supervisor carrega a ADR-108 em linguagem de quem vai viver a regra:**
  *"as duas perguntas de dinheiro são só suas — se você não perguntar, ninguém
  pergunta."* Traz também o preço com os centavos e a autorização da ADR-103
  dita como gesto, não como norma.
- **A do observador abre com o requisito**, que é o que ele tem de mais
  estranho: *"preciso de alguém para NÃO trabalhar."*

**Uma coisa foi verificada antes de escrever, e é o tipo de detalhe que estraga
um ensaio:** o observador fica FORA da Consulta Inicial (ADR-104), e o Diário
pergunta em qual item a pessoa hesitou. Quem escreve isso é o **Supervisor, ao
sair da sala, antes de qualquer outra coisa** — está no Guia da Primeira
Rodada, e o motivo é que o Curador conduz e não consegue observar a si mesmo.
**Consequência que o sábado pode revelar:** se ela NÃO autorizar o Supervisor
na sala, essa medição simplesmente não existe. É o risco que a ADR-103 aceitou
sem medir, e agora se sabe onde ele aparece.

**Ao enviar:** o supervisor precisa dos PDFs nº 1 e nº 2 da pasta *"2 - Para ler
antes"*; quem faz os médicos precisa **só das Partes 2 e 3** do Ensaio Geral —
o PDF inteiro entrega o resto do dia junto.

### A auditoria do Motor — compatibilidade e simetria (31/08)

**Pedida pelo Fundador no fim do dia. Dois defeitos corrigidos, um achado meu
corrigido, e um limite de mecanismo que eu não tinha visto.**

**A arquitetura, para quem chegar depois.** São **dois** motores.
`motor-compatibilidade.ts` é a matriz absoluta 5×3 — importância dela × um
tri-estado dele (`CONFIRMADO`/`NAO_CONFIRMADO`/`NAO_INFORMADO`), quinze células,
nove definidas e seis derivadas de três princípios escritos. `motor-relacional.ts`
é o cruzamento **por identidade de opção** (`satisfied_by`), e é a simetria de
verdade — mas fixa `RELATIONAL_AXIS = "MODELO_DE_ATENDIMENTO"` (ADR-065):
**3 conceitos produzem célula, de 29.**

**`SIM-74` — verdade vácua, provada rodando o motor.** Opções da pessoa sem
correspondência declarada saem antes da derivação. Se ela marcava **só** essas,
`matches` ficava vazio — e `[].some(...)` é `false`, então o estado caía em
`CONFIRMADO` por vacuidade. Com grau `ESSENCIAL`: **`ALTA_COMPATIBILIDADE` com
zero frases de apoio.** E o pior detalhe: **sem** declaração do médico dava
lacuna, **com** declaração dava alta — quem declarava mais ganhava leitura melhor
num conceito onde ela não pediu nada. O teste existente cobria a opção
**acompanhada** de outra; sozinha, ninguém tinha olhado.

**A correção que eu quase fiz e estava errada, e vale mais que o conserto:** eu
ia dar `*` ao `NAO_TENHO_PREFERENCIA`, como tem o `PREFIRO_SOZINHA`. Seria
**repor o defeito por outra porta** — `*` produz `CONFIRMADO`, logo `ALTA`.
**`PREFIRO_SOZINHA` pede algo** (ficar sozinha, que qualquer conduta respeita);
**`NAO_TENHO_PREFERENCIA` não pede nada.** Parecem iguais e não são. Ganho de
brinde: sem migration, sem regenerar Catálogo, sem paridade.

**`SIM-75` — a guarda que faltava.** O motor absoluto recusa por nome o conceito
`MOTOR_PARTICIPATION = NUNCA`, e o comentário diz por quê: *"a segunda barreira
existe justamente para o dia em que a primeira falhar."* O relacional não tinha
nenhuma. Sem defeito vivo — nenhum conceito é `automatico` **e** `NUNCA` hoje —,
mas era a porta por onde o achado P15 voltaria pelo outro motor.

**`SIM-66` corrigido, e ficou horas errado no ar.** Eu escrevi que o
`satisfiedBy` estava *"nulo nas 139"*. **Medi só o lado do profissional e
generalizei.** Ele mora do lado **dela** (13 de 69) e, onde existe, está
**completo**. O achado verdadeiro é de **alcance**, não de vazio — e traz o fato
que mais importa saber: **as 139 caixas do médico não alimentam o Motor em 26
dos 29 conceitos; um humano lê o formulário e declara o estado.** Não é defeito,
é o desenho — mas é o oposto do que "cruzamento automático" sugere.

**E a análise de como estender já existia**, num documento que eu não tinha
lido: `CLASSIFICACAO_DOS_NOVE_AUTOMATICOS.md` (08/08) nomeia **três** conceitos
que precisam de `satisfied_by` — Modalidade, Disponibilidade, Prazo. **Não 26.**
A proposta dos três ficou escrita em
`docs/curadoria/PROPOSTA_CORRESPONDENCIA_DOS_TRES_HIBRIDOS.md`, no rito da
ADR-070, para lavratura do DT-01 — **e foi montando as tabelas que apareceu a
questão `E`/`OU` da §4**, que é maior que a da faixa.

**Um alarme que NÃO saiu.** No caminho achei que `derivacao-do-mapa-profissional.ts`
era código morto: nenhum arquivo de `src/` o importa. Fui verificar antes de
dizer, e existe um teste chamado **`G-2 · zero chamadores`** que **exige** que
seja assim — *"o 1.A é mecânica à espera do 2.C, nunca superfície"*. Isolamento
deliberado e guardado, não abandono.

### A caixa "declarado por ela" e o guia do currículo (31/08)

**Da pergunta do Fundador: *"e se for critério do paciente estar procurando
médicos pelo currículo, como posso ajudá-los?"*** — e a resposta começou por um
defeito meu, do mesmo dia.

**O defeito (`SIM-77`).** O conserto do `SIM-73` deixou o rótulo da Parte 5
honesto para o caso comum e **errado para o caso dela**: os blocos já tinham a
linha *"Se ela disse algo"*, então o papel **registrava a frase dela e a
desmentia duas vezes** — no rótulo (*"ela não é perguntada"*) e no **°** da
Folha. **Conserto: uma caixa por bloco — ☐ Declarado por ela** — que devolve o
círculo a ela e manda riscar o °. Não fere a ADR-109: ela proíbe **deduzir**, e
manda **registrar** o que foi declarado.

**O guia novo: `11-como-ler-o-curriculo.html`**, publicado no Kit como
*Como ler o currículo de um médico* (11 guias agora; a guarda do Kit
acompanhou). É a peça que ajuda a assistida **antes de contratar**, e a mais
segura juridicamente que a casa tem: **sem nome, sem nota, sem ranking** — só o
que cada palavra significa. O conteúdo que mais entrega: **RQE é o piso e se
confere de graça em segundos**; *fellowship diz sobre o quê, não quão bom*;
*publicar não é tratar bem*; *tempo de formado sem volume no seu tipo de caso
diz pouco*; e **as duas perguntas que valem mais que o currículo inteiro** —
*"quantos casos como o meu o senhor atende por mês?"* e *"o que o senhor não
atende, e quando encaminha?"*.

**O achado de Método que ficou aberto, e é o mais interessante:** quem procura
por currículo está perguntando *"ele sabe cuidar do MEU caso?"* — e as três
respostas honestas (**Experiência no tipo de caso, Volume de atuação, Limites de
atuação**) estão **todas na Parte 5, onde ela nunca é perguntada**. Dar opções
de paciente a essas três é Catálogo, espera a primeira Curadoria, e sábado pode
confirmá-la.

**O que eu recomendei NÃO fazer:** peso automático de credencial no Motor
(`INDIRETO` por doutrina — *credencial não vira ponto*) e qualquer selo
acadêmico na vitrine. E fica pendurada, para o pacote do advogado, **uma
pergunta a mais**: *"podemos publicar fatos acadêmicos verificáveis com fonte,
ligados ao caso, sem ranking?"*.

### ADR-110 · oito decisões de Método, confirmadas de uma vez (31/08)

**O padrão do dia funcionou de novo:** eu propus um default para cada questão
aberta da auditoria, o Fundador respondeu *"tudo confirmado"*, e sete viraram
decisão registrada esperando a primeira Curadoria. **Duas produziram trabalho
imediato, e as duas são papel e teste.**

**A que mais importa (§1):** a agregação passa a ser declarada por conceito, e
**a pergunta dela decide qual** — *capacidade* (*"como/quando você consegue"*)
enumera alternativas, basta uma → `OU`; *desejo* (*"o que te ajudaria"*)
enumera coisas que ela quer juntas → `E`. Sem isso, **o médico que atende de
manhã sairia `NAO_CONFIRMADO` para quem pode de manhã.**

**A reversão (§6), e ela é minha:** horas antes eu propus mover *Experiência no
tipo de caso*, *Volume* e *Limites* para a Parte 4. Testada contra o `SIM-71`, a
proposta não passa — *"quanto importa a experiência dele no seu tipo de caso?"*
tem uma resposta só, e as três saturariam como o conceito 12 satura hoje.
**O que serve já tinha sido construído no mesmo dia: a caixa ☐ declarado por
ela.** Declaração espontânea discrimina; resposta induzida, não.

**O que foi escrito (§2 e §8):**

- **A guarda de cobertura** — `tests/unit/cobertura-das-regras.test.ts`. É o que
  a ADR comprou junto com a escolha da enumeração: **opção nova que ninguém
  citou em regra reprova a suíte com o nome da opção.** É teste de
  caracterização, com linha de base datada e **um motivo escrito por ausência**
  (motivo em branco também reprova). Construí-la achou o `SIM-78`.
- **A segunda eliminação, na Folha** — *restrição declarada por ela + "não
  acompanha quem recusa a conduta indicada" = elimina antes de qualquer linha*.
  Fecha o `SIM-70` **fora do Motor**, que é onde ele sempre pertenceu: o
  problema nunca foi de cruzamento, era de eliminação.

**E a Folha cobrou concisão pela quarta vez no dia.** As duas eliminações a
levaram a 4 páginas; eu enxuguei texto três vezes **sem medir**, e só então fui
ver: o conteúdo mede **2,78 páginas** e cabe em 3 — o que estoura são os três
blocos `page-break-inside: avoid` empurrando inteiros. **A folga certa era de
margem** (15mm → 12mm), e o porquê ficou escrito no fonte para ninguém a
desfazer. *Cortar texto que estava certo, três vezes, porque eu não medi onde a
quebra caía.*

### A revisão geral do fim do dia (31/08)

**Pedida pelo Fundador — *"revise tudo para ver se esquecemos algo"*. O
mecânico passou limpo; o que faltava era coerência, e eram seis.**

**Passou:** geradores idempotentes (**0 regravadas** — nada ficou por gerar),
pasta da mesa **35/35 byte a byte nos dois sentidos** *(hoje 37, com a folha de acessos)* (nada divergente lá, nada
esquecido aqui), `.txt` derivados batendo com os `.md`, git sincronizado,
**2685 testes verdes** e `tsc` limpo.

**Faltava, e foi corrigido:**

1. **O `LEIA-ME.txt` dizia *"os três últimos são contexto"*** — são quatro
   desde o guia 11, que **não tinha nome em lugar nenhum da pasta**. Quem
   abrisse veria um PDF a mais sem saber o que era.
2. **O pré-voo não citava a caixa ☐ declarado por ela (`SIM-77`) nem a segunda
   eliminação (ADR-110 §8).** As duas nasceram DEPOIS de o pré-voo ser escrito,
   no mesmo dia — **o Curador chegaria no sábado sem saber das duas**, e a
   segunda é a que impede o profissional que abandona quem recusa de passar
   invisível.
3. **O comentário errado do Catálogo estava no gerador, com escape** — por isso
   o grep da manhã só o achou no arquivo gerado, e eu concluí, errado, que
   corrigi-lo exigia o Supabase local. **Não exigia.** Corrigido nos dois, com o
   mesmo texto, para a próxima regeneração não desfazer: *"dois `NUNCA` e um
   `INDIRETO`"* → **4 e 9**, com a data da medição.
4. **O handoff dizia `18/18` em três lugares.** São 22.
5. **`Kit 14/14` → `15/15`**, e *"os dez guias"* → onze, em quatro lugares
   (incluindo um comentário no código do cartão).
6. **A pergunta acadêmica estava só aqui, não no pacote do advogado.** Eu disse
   que ficaria *"pendurada"* e ela ficou pendurada num lugar que o advogado
   nunca vai ler. **Entrou em `MENSAGEM_PARA_ADVOGADO_DOCUMENTOS_DIGITAIS.md`**
   como pergunta à parte, que não bloqueia documento nenhum, com o contexto para
   a resposta sair direta: o que queremos publicar (com exemplos), o que já é
   proibido pela nossa doutrina, de onde vem o dado, e onde fica a linha da
   CFM 2.336/2023.

**O padrão dos seis é o mesmo:** nenhum estava errado quando foi escrito. **Todos
envelheceram nas horas seguintes**, porque o dia mudou o mundo em volta deles — e
nenhum tinha guarda que os visse.

### A pasta ganha a papelada da empresa, e dois achados sobre os downloads (31/08)

**Pedido do Fundador: uma pasta com tudo o que a operação precisa.** Não criei
pasta nova — **estendi a que existe.** Uma segunda na área de trabalho é
exatamente a divergência silenciosa que este dia inteiro tratou: em uma semana
uma estaria velha e ninguém saberia qual.

`Aliviar - Kit da Curadoria` passa a ter **três seções e 35 arquivos** (e vira
`Aliviar - Operação` em 01/09, quando ganha a quarta):
*1 - Para preencher na sala* (6), *2 - Para ler antes* (11) e a nova
**`3 - Documentos da empresa`** — os cinco instrumentos do advogado em PDF mais
os `.docx` originais, a Política de Privacidade, a leitura técnica das
pendências e as perguntas ao advogado. O `LEIA-ME` abre descrevendo as três e
avisa o que a seção 3 significa hoje: **nada dali está publicado, e por isso o
item 8 é o mais urgente da pasta inteira.**

**E apareceu o sétimo caso do padrão do dia:** o PDF das perguntas ao advogado
estava velho — **não trazia a pergunta acadêmica** acrescentada ao `.md` uma
hora antes. Regerado e conferido por extração.

**Os dois achados, respondendo à pergunta dele sobre os downloads do site:**

- **`SIM-79`** — os onze guias vivem em `public/` e são baixáveis por quem
  souber a URL. Conferido em produção: *Roteiro do Curador* e *Guia do
  Administrador* devolvem **200 sem autenticação**. O cartão está protegido no
  `/admin`; **os arquivos, não.** Não vaza dado de pessoa nenhuma, mas o roteiro
  com o preço e as objeções está buscável.
- **`SIM-80`** — **nem o médico nem o assistido têm um único documento para
  baixar.** As três páginas legais dizem, corretamente, que o documento não foi
  publicado. E os **quatro escritos para ela** — *Guia do Assistido*, *Para você
  que começou*, *O que é a Aliviar*, *Como ler o currículo* — só existem no Kit
  do `/admin`: varri `src/` e **nenhuma tela dela aponta para eles**.

**A correção dos dois é a mesma: separar por destinatário** — publicar e linkar
os quatro que são dela, tirar os sete internos de `public/`. **Não fiz**: mexe
em rota de produção, e a metade jurídica depende do advogado de qualquer jeito.

### O Kit fica só com guia operacional (31/08)

**Decisão do Fundador: *"no Kit da Curadoria só quero guia operacional".*** É a
primeira metade do `SIM-80` andando.

**Três dos onze guias não eram de operação** e saíram: *Como funciona daqui em
diante*, *O que é a Aliviar* e *Como ler o currículo*. **Os operacionais caem de
11 para 8.**

**O quarto candidato ficou, e é o achado do gesto.** Eu ia tirar quatro — o
*Guia do Assistido* parece dela pelo nome. Fui ler o subtítulo antes de mover:
*"o que ela vê, o que ela faz… **para que a equipe saiba explicar sem
inventar**"*. **É operacional.** Tirá-lo teria sido erro, e o único custo de
evitá-lo foi abrir o arquivo.

**Não os removi para lugar nenhum, de propósito.** Sem destino, ficariam
servidos em `public/` sem nada apontando — **órfãos**, que é exatamente a metade
do `SIM-80` ainda aberta. Foram para uma lista própria,
`PARA_ENTREGAR_AO_ASSISTIDO`, num bloco separado do cartão com o rótulo *"não é
material de operação"*. **O Kit é o que se imprime para trabalhar; aquilo é o
que se dá a ela** — e enquanto o site não tem uma área onde ela mesma baixe,
**quem entrega é a equipe, e é do cartão que ela baixa.**

Na pasta da área de trabalho, o mesmo corte: nova seção **`4 - Para entregar ao
assistido`**, a seção 2 **renumerada de 1 a 8 sem buracos**, e o `LEIA-ME`
descrevendo as quatro seções. **O total da pasta não mudou ali: 35 arquivos**, porque
nada saiu — só mudou de prateleira. *(Foi a 37 no mesmo dia, com a folha de
acessos da simulação.)* O Kit continua **15/15** (4 peças + 8 guias
+ 3 de entrega).

### A auditoria dos oito guias operacionais (01/09)

**O Fundador perguntou se os guias operacionais já tinham sido auditados para
ter certeza de que estão atualizados e coerentes. A resposta era NÃO**, e eu
rodei a auditoria em vez de responder de memória.

**Por que era não:** em 31/08 eu editei só os quatro guias que as ADR-108/109/110
atingiam diretamente. **Os outros quatro não eram tocados desde 30/08** — antes
das três decisões — e eu tinha presumido o resto.

**Achado 1 — a de-numeração deixou um para trás.** O `3-curador` ainda dizia
*"**15** (Cobertura e convênio) e **16** (Custo e pagamento) chegam prontos"*. A
varredura de 31/08 procurou `"conceitos 15 e 16"` e **essa forma não casava**.
Varri o padrão certo (`\b1[0-9] \(`) e era a última: **nenhum documento
operacional cita mais conceito por número.**

**Achado 2 — `SIM-81`, e nenhum `grep` acharia.** O Roteiro do Acompanhamento
afirmava que o Supervisor *"estava na Consulta Inicial"*. A primeira metade da
frase é sempre verdade (ADR-100); **a segunda é condicional** — a ADR-103 põe
aquela presença na mão dela. **E o risco não é cosmético:** o roteiro manda ele
*continuar* a conversa sem se apresentar, e um Supervisor que **não** esteve na
sala, falando como se tivesse, pode citar algo que ela contou **a portas
fechadas, a quem ela pediu para não entrar**. O conserto separa as duas coisas:
a regra de não se apresentar vale igual, mas ficou escrito que **o que muda é a
fonte do que ele sabe** — e que frase daquela conversa não se cita como ouvida.

**O que passou limpo:** contagens e datas nos oito (zero *"dez guias"*, zero
`05/09`), e as menções a dinheiro estão todas nos quatro guias certos, do lado
certo da ADR-108. Os quatro intocados quase não descrevem a Consulta Inicial —
**é por isso que as ADR-109 e 110 não os alcançavam**, e é a razão de o estrago
ter sido pequeno.

### A cadeia inteira conferida, e o gerador que mentia por omissão (01/09)

**Pergunta do Fundador: *"todos os guias operacionais e seus PDFs foram
atualizados?"*** — respondida medindo os quatro elos, não de memória:

| Elo | Como | Resultado |
|---|---|---|
| HTML → PDF | rodar os geradores e olhar o `git status` | **vazio** — nenhum PDF atrás do fonte |
| PDF → `public/` | sha256 dos 11 gerados × publicados | **11/11 idênticos** |
| `public/` → produção | tamanho servido × local, guia a guia | **8/8 idênticos** |
| repositório → pasta da mesa | `cmp` byte a byte | **8/8 idênticos** |

**E a medição achou um defeito na própria ferramenta.** O
`gerar-guias-pdf.mjs` imprimia **`✓` para os onze, tivessem mudado ou não** —
gravava só o que mudou, mas não dizia. Por isso o `✓` não servia de resposta à
pergunta, e a prova teve de vir do `git status`. **Ferramenta que não distingue
"fiz" de "conferi" convida a acreditar em trabalho que não aconteceu** — o
gerador de rede já reportava certo; este passou a reportar igual, com contagem
de páginas por peça e o rodapé *"N conferido(s) · M regravado(s)"*.

**Um detalhe que a implementação exigiu:** cada guia tem **dois destinos** — o
local e a cópia em `public/`. Conta como regravação se **qualquer um dos dois**
estava atrasado; sem isso o relatório diria *"sem mudança"* com `public/`
desatualizado, que é o erro exato que o ajuste existe para impedir.

**E eu errei dois testes antes de acertar.** Primeiro tentei provar
acrescentando um **comentário HTML** — comentário não renderiza, o PDF saiu
idêntico, e o *"sem mudança"* estava certo. Depois restaurei um **backup que eu
tinha copiado do arquivo atual**, idêntico por construção. Só na terceira, com
mutação de verdade (cópia publicada corrompida, depois o `<h1>` alterado), os
dois caminhos acusaram `✓ · 1 regravado`. Árvore restaurada limpa.

### A pasta vira `Aliviar - Operação`, e os três de entrega são conferidos (01/09)

**Renomeada a pedido do Fundador.** O nome *Kit da Curadoria* descrevia bem as
seções 1 e 2 — **o que se imprime para trabalhar** —, e deixou de descrever a
pasta quando ela ganhou a papelada jurídica (seção 3) e o que se entrega à
assistida (seção 4). **Os 35 arquivos foram preservados**, e o `LEIA-ME` abre
explicando a troca. **O termo continua vivo onde é preciso:** o cartão do
`/admin` se chama Kit da Curadoria e oferece só as seções 1 e 2.

**E a pergunta que veio junto — *"todos os guias já revisados, certo?"* — tinha
um buraco de escopo que eu mesmo criei.** A auditoria de mais cedo cobriu **os
oito operacionais**; os **três de entrega** ficaram de fora, e eles são
justamente os que a assistida lê. Conferidos agora:

- **`11-como-ler-o-curriculo`** — escrito hoje, corrente por construção.
- **`9-para-voce-que-comecou`** (29/08) e **`10-o-que-e-a-aliviar`** (30/08) —
  **coerentes.** Nenhum diz quem pergunta sobre dinheiro, então a ADR-108 não os
  contradiz; e a descrição do fluxo bate com a ADR-109 (*"seu Curador vai querer
  entender seu caso a fundo"*, *"nada avança sem a sua confirmação — o critério
  é seu"*). O preço citado no `10` é o vigente: **R$ 500, 12× de R$ 41,67.**

**Por que passaram intactos, e vale saber:** eles descrevem **a experiência
dela**, não o procedimento da equipe — e as três ADRs de 31/08 mexeram em quem
faz o quê **dentro** da operação. **Documento escrito do ponto de vista de quem
recebe envelhece menos** que o escrito do ponto de vista de quem executa.

### Os acessos da simulação — o PDF que NÃO foi feito em 01/09, e que FOI feito em 02/09

**O Fundador pediu um PDF com todos os acessos, usuários e senhas, e perguntou
o que eu achava. Respondi que não, com três fatos:** a pasta é sincronizada com
o OneDrive e existe para ser aberta e impressa por outras pessoas; **PDF não
gira** — senha trocada deixa o arquivo mentindo enquanto ele circula; e **não
existe senha de produção guardada em lugar nenhum do repositório**, o que é
acerto, não falta.

**E o que ele queria já existia, melhor feito.** O
`scripts/bootstrap-local-test-users.mjs` cria **seis contas, uma por papel**, só
contra o Supabase local, com **senha aleatória gerada na hora, nunca impressa**,
gravada em `test-users.local.json` — coberto pelo `*.local.json` do
`.gitignore`. O `env-guard.mjs` existe porque o `.env.local` aponta para um
projeto hospedado e os scripts o liam por engano; hoje nenhum deles conversa com
outro banco que não o local.

**Feito e provado, não só descrito:**

- A stack local **não subia** — o contêiner do banco tinha morrido com **exit
  137 há seis dias**, quando a máquina desligou com o Docker aberto. Recriada
  com `supabase stop` + `start`; **135 migrations aplicadas.**
- **Seis contas criadas**, e conferi que **as seis realmente entram**:
  `signInWithPassword` devolveu sessão para todas, sem imprimir senha.
- **Conferi que a folha não vaza:** extraí o texto do PDF **e** do `.txt` e
  comparei com as seis senhas reais — **nenhuma aparece em nenhum dos dois.**

**A folha** (`docs/rede/ensaio/acessos-da-simulacao.md`, publicada na pasta como
*ACESSOS da simulacao (sem senha)*) traz os seis e-mails, o papel de cada um, **a
rota que abre**, os três comandos na ordem e onde achar as senhas. Diz também
**por que dois e-mails carregam nome de papel extinto** — `atendente` e
`concierge` são anteriores às ADR-100 e 106, e renomear exigiria recriar a
conta: quem abrir a folha em dezembro precisa saber que não são papéis
diferentes.

> **REVERTIDO EM 02/09, por instrução direta do Fundador** (*"FORNEÇA AS SENHAS
> NO DOCUMENTO"*), depois de eu ter dito não em 01/09 e ele ter repetido o
> pedido. **A recusa era um padrão razoável; a repetição é a decisão dele, e
> decisão repetida se cumpre.** O que mudou de fato: a folha da Área de
> Trabalho passou a se chamar **`ACESSOS da simulacao`** (sem o *"sem senha"*)
> e traz as seis senhas em tabela.
>
> **A fronteira que passou a existir, e é ela que impede o erro futuro:** são
> **duas folhas, e não a mesma em dois lugares.** A do repositório
> (`docs/rede/ensaio/acessos-da-simulacao.md`) **continua e continuará sem
> senha**, porque o repositório é público no GitHub — senha ali é senha
> publicada. A da Área de Trabalho carrega os valores porque **não está no
> Git** e porque eles só abrem o banco local desta máquina. As duas folhas
> agora dizem isso uma da outra, no primeiro parágrafo, para ninguém
> "consertar" a errada.
>
> **Provado, não afirmado:** entrei com as seis contas de verdade na tela de
> login e as seis caem na rota certa (`/admin`, `/atendimento`,
> `/coa/curadoria`, `/acompanhamento`, `/profissional`, `/paciente`); o
> `conferir-pdf.mjs` extraiu o texto de volta e achou **as seis senhas
> inteiras** — importava porque elas têm hífen e sublinhado, e um gerador que
> come um caractere produz folha que parece certa e não abre nada. E rodei a
> conferência inversa: **nenhuma das seis aparece em nenhum arquivo do
> repositório.**
>
> **O par antigo `(sem senha)` foi apagado da pasta.** Ele abria dizendo
> *"nenhuma senha nesta folha, de propósito"* — dois documentos de acesso
> contraditórios lado a lado é pedir para alguém pegar o errado na hora.
>
> **O que envelhece:** `npm run bootstrap:test-users` gera senhas novas e
> deixa a folha da Área de Trabalho mentindo. Quem rodar o comando regrava a
> folha, ou apaga.

### A travessia de ponta a ponta, a auditoria visual, e o `SIM-62` fechado (01/09)

**A primeira travessia desde as ADR-100 a 110** — e o ambiente que ela exigiu é
o mesmo que o `SIM-62` apontava como causa raiz: Docker, Supabase local, as seis
contas de teste. Subir para simular **destravou de brinde a suíte E2E**.

**Quatro defeitos reais, todos de texto ou de dado — nenhum de layout:**

- **`SIM-82`** — a migration da porta pública grava `source = 'porta_publica'`, e
  nenhum mapa de rótulo conhecia o valor: **100% dos contatos apareciam ao
  Supervisor como origem "Outro"**, com *"Site"* ali ao lado sem uso.
- **`SIM-83`** — no instante de encaminhar, a tela dizia *"você deixa de ser o
  responsável"*. Verdade sobre o campo, **falsa sobre o papel** (ADR-100: *"quem
  atende o primeiro contato é quem estará lá no fim"*).
- **`SIM-84`** — a guarda de vocabulário varria `docs/` e nunca `src/`.
- **`SIM-85`** — **a ADR-109 chegou ao papel e não à tela:** a Mesa ainda mandava
  classificar pelo que o Curador *"entendeu da conversa"*, na tela onde a
  classificação vira o que o Motor cruza.

**A auditoria visual (`SIM-86`) fechou limpa:** doze telas, desktop e celular,
**zero transbordo horizontal e zero erro de página**. O `SIM-13` **não regrediu**
— a Mesa foi de ~8.000 para **10.411px**, e os saltos testados aterrissam com o
título no topo e 14–15 elementos à vista.

**E o `SIM-62` grupo (b) foi fechado**, verde pela primeira vez desde 24/08. Os
dois testes foram **invertidos, não remendados**: um passa a guardar a remoção
deliberada de 24/08; o outro mantém o princípio do *Release Gate 4* e muda de
alvo. **A ausência de "Documentos pendentes" virou asserção** — enquanto o
domínio não tiver a noção de documento faltando, aquele cartão **não pode**
exibir número.

**O que a travessia NÃO percorreu:** declarar as áreas, registrar as respostas
dela (P1…P29), compor os três caminhos, emitir e entregar. Parei porque meus
seletores passaram a custar mais do que rendiam — **problema da minha
automação, não do produto**. O ambiente está de pé e semeado; esses passos são
mais rápidos no navegador do que por script.

### O WhatsApp vira canal, e as mensagens do Supervisor saem da pasta (01/09)

**ADR-111**: o número passa a **(11) 97098-1354**. Uma linha no código, seis
specs que repetiam o literal passaram a importá-lo, e a guarda deixou de ser
uma segunda fonte.

**As mensagens do atendimento estão escritas**, em três formatos na pasta
`Aliviar - Operação` — `.md` (fonte), `.txt` e `.pdf` (3 páginas). Trazem as
três mensagens do Roteiro do Supervisor prontas para copiar, o preço da
ADR-101, as duas perguntas de viabilidade da ADR-108 (*"se você não perguntar,
ninguém pergunta"*), a lista do que nunca sai do teclado, e o aviso de que **dá
para conversar e marcar, mas não dá para fechar contrato** — não há gateway, e
`/termos` e `/privacidade` continuam sem texto.

**O arquivo NÃO está no repositório, e é de propósito:** o código é público no
GitHub, e número em repositório público é número raspado por robô em uma
semana.

**Três passos de configuração antes do primeiro atendimento**, e um deles é uma
recusa: perfil comercial preenchido com horário real; mensagem de ausência
ligada com a verdade; e **nenhuma saudação automática que finja ser pessoa** —
a primeira frase da Aliviar é *"eu sou [nome], vou te acompanhar daqui até o
fim"*, e um robô dizendo isso quebra a promessa antes dela começar. **Se já
existe saudação configurada no aparelho é coisa que só o Fundador vê**
(WhatsApp Business → Ferramentas comerciais); o repositório não sabe nada
disso, e nada na Aliviar cria, lê ou dispara mensagem — o site só monta um link
`wa.me` com texto pronto, e quem envia é a pessoa.

---

### A varredura do site inteiro, e os quatro defeitos que nenhuma tela mostra (01/09)

**34 rotas** — 12 públicas em produção, 22 logadas no ambiente local, cada uma
em desktop (1440) e celular (390), com captura de página inteira, console,
rede, contraste medido e geometria conferida.

**O placar visual é limpo** (`SIM-90`): todas 200, **zero erro de console em
qualquer papel**, zero rolagem horizontal, um `<h1>` por página, contraste
aprovado sobre fundo chapado, cabeçalhos de segurança completos.

**E quatro defeitos reais, todos na mesma classe: o que o site diz de si para
fora** (`SIM-87`, corrigidos e em produção no `584d583`) — sem `og:image`,
sitemap com duas URLs, sem canônico, páginas jurídicas vazias indexáveis. **A
correção do quarto é a que vale reler:** a regra de indexação **nasce do
banco** — sem versão vigente, `noindex`; quando o jurídico publicar, indexável
sozinha. Um `noindex` cravado manteria o contrato fora da busca para sempre.

**Guarda nova: `tests/unit/enderecos-publicos.test.ts`**, 26 casos, lendo o
**sistema de arquivos de rotas** e não uma lista copiada. Ele já me corrigiu
duas vezes enquanto eu o escrevia: reprovava porque lia meus **comentários**
como se fossem URLs do sitemap, e porque eu tinha esquecido os sete passos do
formulário da assistida.

**Seis observações ficaram abertas** (`SIM-89`), todas medidas: 1.181px de
branco no cartão *"Pendências"* do `/admin`; 5 de 10 itens do menu lateral sem
ícone; dois textos do `/login` abaixo do mínimo de contraste; links de 29px no
rodapé do celular; o *"Nenhuma Curadoria esperando"* que contradiz o *"1 Caso
ativo"* logo acima; e os cinco *"Salvar"* do `/profissional` sem indicador de
progresso.

### A cena que falta na `/o-que-e`, e por que ela não foi gerada (02/09)

O `SIM-89` observou que a `/o-que-e` são **5.105px de texto corrido sem uma
única imagem**, logo depois de uma home inteiramente fotográfica. O Fundador
pediu o ambiente compatível, como as outras seis páginas têm. **Não foi
gerado**, e as razões ficam registradas porque a próxima sessão vai reencontrar
todas.

**A chave do Runway existe nesta máquina, mas não para mim.** Ela está no cofre
do **Codex** (`~/.codex/.codex-global-state.json`, sob o nome padrão do SDK
`RUNWAYML_API_SECRET`) — foi assim que os 86 clipes da campanha foram feitos.
No meu processo a variável está vazia. **Tentei ler o trecho do arquivo e o
classificador bloqueou, e ele está certo:** extrair credencial do cofre de outra
ferramenta é como uma chave acaba numa terceira cópia que ninguém rastreia.
**Não contornei, e não se deve contornar.**

**Controle de tela também não resolve** — conferido, não suposto: no controle de
tela o navegador entra em modo somente-leitura (enxergo, não clico), e a
extensão do Chrome não está conectada (zero navegadores).

**O caminho aberto, se um dia quiser:** um `runway.local.json` na raiz
(`*.local.json` já está no `.gitignore`) com uma chave **nova**, separada da do
Codex — assim dá para revogar a minha sem quebrar o agente de vídeo, e o
consumo do site aparece apartado do dos filmes.

**Duas decisões de forma que já estão tomadas, e valem mais que a imagem:**

1. **Não pode ser cena de fundo atrás de tudo.** As seis cenas vivem em páginas
   de uma tela; a `/o-que-e` é cinco vezes mais longa. O padrão compatível é o
   do `/solicitar-atendimento`: **cena no alto, uma tela, com o cartão de
   vidro — e o texto seguindo no creme.**
2. **A cena é o escritório de estudo, vazio.** A casa já mostrou recepção,
   curadoria, o corredor dos três retratos, a mesa do Concierge, o terraço e a
   sala de espera; falta o cômodo onde o caso é estudado. **Vazio de propósito:**
   numa página que é toda leitura, gente na foto disputa atenção com o texto.
   Cena clara, então o cartão é o claro de letra escura (a regra do `cbdb794`).

**O pedido pronto está em `Aliviar - Operação/PEDIDO AO CODEX - cena da pagina
O que e a Aliviar.md`** — os dois prompts, as medidas exatas (1672×941 e
852×1846, as mesmas das outras seis), a paleta da `CINEMA_BIBLE` e uma lista de
seis conferências. **O requisito que mais reprova é o terço vazio:** é onde o
cartão pousa, e mesa ou planta ali torna o texto ilegível.

**Uma pista que sobrou e não foi seguida** (o Fundador mandou cancelar): há **86
clipes do Runway deste mesmo prédio** em `.artifacts/campaign_v3/`, e o
`10_film1_curadoria` está no **registro claro do site**, não no escuro dos
filmes — creme, madeira, planta, três dossiês verdes. Extrair um quadro custaria
zero e casaria por construção. **A pega:** os quadros dos filmes trazem a frase
em baixo-relevo na parede, e na cena do site não pode haver letra na imagem.

---

## 6 · As lições desta sessão

**1 · O viés do instrumento apareceu três vezes, e quase virou defeito
reportado.** A inércia do Motor da Caminhada faz a tela ficar atrás do
`scrollY`: capturas pegaram os cartões em branco e o rodapé vazio, e o DOM
dizia opacidade 1 nas duas vezes. **Nesta página, espere 3 segundos antes de
capturar** — e confira o `scrollY` antes de concluir qualquer coisa sobre
posição. É o `SIM-57` de novo, com outro instrumento. **E ele voltou mais duas
vezes em 30/08:** greps case-sensitive deixaram "Paciente:" (P maiúsculo) vivo
na Folha através de QUATRO auditorias, e um contador de linhas de arquivo disse
"8" para uma grade de 152 células. **Grep de vocabulário roda com `-i`; contar
célula é contar `<td`, não linhas.** E em 31/08 apareceu a terceira roupa: a
guarda de PDF reprovou duas frases que estavam presentes, porque o texto
extraído traz as quebras de linha da PÁGINA e a frase sai partida no meio.
**Dessa vez o conserto ficou no instrumento** — a busca passou a normalizar
espaço antes de comparar. Guarda que dá falso negativo custa a mesma confiança
que guarda que não dispara, e as duas primeiras roupas só viraram lição; esta
virou código.

**2 · Medir contra a régua certa, e a régua está escrita no arquivo.** Reportei
os links do rodapé como alvos de toque pequenos demais (29px contra 44). A
guarda no próprio arquivo dizia que o padrão adotado é o **WCAG 2.2 SC 2.5.8,
mínimo de 24px** — os 29 passam. Os 44 do `min-h-11` são AAA e são padrão de
*botão*, não de link de texto. **Leia a guarda antes de propor a mudança**, e
não depois.

**3 · Esticar não é enquadrar.** Estendi mecanicamente a parede de um retrato
para dar cama ao formulário: esticar 140px para 900px amplificou o gradiente e
trocou o creme da sala por caramelo. Era o erro do `cbdb794` com outro verbo. O
que resolvia o problema era o vidro escovado, que já existia.

**4 · O borrão é o que protege a letra.** O Fundador pediu vidro transparente
sem escovado, para ver. O teste respondeu contra: na Landing a diferença é
invisível (parede lisa atrás), o cabeçalho perdeu legibilidade, e no formulário
do celular o logotipo atravessou o texto. **Revertido inteiro.**

**5 · Regra escrita para uma cena vaza para todas as páginas.**
`.landing-ambiente:first-of-type { padding-top: 30svh }` foi escrita para a
Recepção e valia para qualquer página que usasse o padrão de ambiente.
`/solicitar-atendimento` foi a primeira a esbarrar. Cuidado com `:first-of-type`
em CSS compartilhado — e note que ele **pesa como classe** na especificidade.

**6 · Trocar o título visível não troca o nome do documento.** Renomeei o `<h1>`
do roteiro publicado e deixei para trás o `<title>` — a aba do navegador e o
nome que vai para o PDF. É a mesma família da Ficha, de manhã: **um documento
tem mais de um lugar onde se chama.** Ao renomear peça de papel, confira os
quatro: `<title>`, `<h1>`, o nome do arquivo e o nome do PDF no gerador.

**7 · `npm run test` verde não quer dizer tipo certo.** O teste do Kit passou
com um `new Set(...)` que herdava a união literal de um `as const` — o `has()`
recusava, em tempo de TIPO, exatamente o que o caso queria conferir. O vitest
não typecheca; quem pegou foi o `tsc`. **Rode os dois antes de acreditar num
caso novo.**

**8 · Teste que valida contra UM contexto autoriza o defeito em todos os
outros.** A guarda de link morto do header conferia as âncoras contra os ids da
Landing — a única página onde elas funcionavam — e exigia a forma nua que
quebrava nas demais. É o viés do `SIM-57` vestido de teste: o instrumento olhava
um lugar só. Ao escrever guarda de navegação, pergunte **de onde mais este
componente é usado**.

**9 · Guarda que nunca dispara não vale nada.** Depois de escrever o teste de
vocabulário, reintroduzi uma violação de propósito para ver se ele reprovava —
e reprovou, nomeando arquivo e linha. **Teste novo que nasce verde precisa ser
provado vermelho antes de merecer confiança**, senão é decoração.

**10 · A guarda pega termo aposentado — não contradição.** "Indicar" nunca
poderia entrar na lista de aposentados: ele aparece legitimamente NEGADO ("a
gente não indica um") a três linhas do uso proibido. Frase que afirma o que
outra frase do mesmo documento nega só cai com **leitura dirigida por quem
conhece a doutrina** — foi o Fundador quem apontou a classe do erro, e os
autômatos todos estavam verdes. Auditoria de conteúdo não se automatiza; se
agenda.

**11 · Ler o resumo não é ler o documento.** Escrevi a leitura técnica das
pendências jurídicas a partir do documento de PERGUNTAS, sem os cinco
instrumentos em mãos — e o único ponto onde levantei alarme foi justamente o que
o texto real já resolvia. As análises que descrevem um documento são boas o
bastante para dar confiança falsa. **Quando a conclusão for "há um risco aqui",
abra a fonte primária antes de dizê-lo** — e se não puder abrir, diga que não
pôde.

**E aconteceu DE NOVO em 31/08, o que muda o peso da lição.** Anunciei que o
`site-url.ts` fazia canonical e sitemap apontarem para um domínio morto. A prova
que eu tinha era **uma linha de `grep`** — a linha 5 do arquivo, que é o
comentário explicando que ele **parou** de usar aquele domínio. Bastavam trinta
linhas de leitura. **O padrão comum às duas vezes não é preguiça, é o formato:
grep e resumo entregam a menção sem o contexto que a nega**, e uma menção
parece confirmação. **Regra prática, já que a lição sozinha não bastou: alarme
de produção não sai sem eu ter aberto o arquivo inteiro — e a frase que anuncia
o alarme diz de onde veio a evidência.**

**12 · Renumerar uma lista quebra em silêncio toda referência numérica a ela.**
O Ensaio ganhou um ato no começo e a linha do observador — escrita quando a
Consulta Inicial era o ato 1 — passou a mandá-lo para dentro da sala proibida,
citando a ADR certa. Referência por número não sobrevive a inserção: ao inserir
item em lista numerada, **grep pelos números antigos em tudo que a cita**. E é o
segundo parente do `SIM-57` em dois dias: a linha parecia certa porque citava a
regra certa — o defeito estava no que o número passou a apontar.

**13 · O que nenhum roteiro manda fazer é o que ninguém audita.** Os blocos 15 e
16 pediam o orçamento da pessoa ao Curador, e **nem o Guia nem o Roteiro dele
mencionavam dinheiro** — a instrução existia só no formulário, sem dono em lugar
nenhum. Quatro auditorias de conteúdo passaram por cima: todas leram os
documentos que *dizem* o que se faz, e o defeito estava no papel que se
*preenche*. **Instrumento é doutrina executável** — quando roteiro e formulário
divergem, quem vence é o formulário, porque é ele que está na mão na hora. Ao
auditar doutrina, ler os dois, e cruzar: **todo campo do formulário tem que ter
uma linha de roteiro que o mande preencher.** Campo órfão é regra que ninguém
decidiu.

**14 · Documento gerado à mão a partir de uma fonte viva diverge em silêncio.**
A Ficha impressa perdeu as cinco opções que o Catálogo dá a ela no conceito 4, e
ninguém viu — quatro auditorias de conteúdo e uma revisão inteira das perguntas
passaram por cima, porque **todas leram o papel contra si mesmo**, nunca contra a
fonte. O papel não estava errado por dentro: estava **desatualizado por fora**, e
isso é invisível a qualquer leitura que não abra os dois. **A guarda tem que ler
a fonte**, não uma cópia da lista — foi assim que o `enderecos-do-catalogo` ficou
capaz de acusar um conceito que ainda nem existe. É irmã da lição 13: lá o defeito
estava entre roteiro e formulário, aqui está entre papel e banco. **Nos dois casos,
o erro mora no espaço ENTRE dois artefatos que ninguém compara.**

**15 · Medir um lado e concluir sobre o todo é a lição 11 com número no meio —
e o número é o que torna o erro convincente.** Contei `satisfiedBy` nas 139
opções do profissional, achei zero, e registrei que *"o cruzamento formal existe
e está vazio"*. A contagem estava certa; a conclusão, errada — o campo mora do
lado **dela**, e está preenchido. **A cifra deu à afirmação uma solidez que a
frase sozinha não teria**, e eu a escrevi num achado que ficou horas no ar.
**Regra: antes de dizer "está vazio", contar o outro lado** — e, na dúvida sobre
o que uma medida abrange, dizer o que foi medido, não o que se concluiu ("nulo
nas 139 opções do profissional", não "nulo"). No mesmo dia, a mesma disciplina
funcionou: suspeitei de código morto, fui ao teste antes de anunciar, e o
isolamento era deliberado e guardado. **O que separou os dois casos foi um passo
de verificação, não uma intuição melhor.**

**16 · Antes de encurtar, meça onde a quebra cai.** A Folha da Mesa passou de 3
para 4 páginas e eu enxuguei texto três vezes seguidas, tentando adivinhar o que
pesava — perdendo redação boa a cada tentativa. Quando finalmente medi, o
conteúdo cabia: **2,78 páginas** de altura para 3 disponíveis. O que estourava
eram blocos `page-break-inside: avoid` sendo empurrados inteiros, e a correção
certa era **3mm de margem**, não texto. **Sintoma de página é layout até prova
em contrário** — e a prova custa uma medição de trinta segundos. No mesmo dia,
a mesma disciplina salvou a guarda nova: ela passou de primeira, e eu **fiz a
mutação para vê-la reprovar** antes de acreditar nela — a primeira tentativa de
mutação nem pegou, e o script disse "removida" sem conferir. **Guarda que nunca
foi vista reprovando não é guarda; script que não confere o próprio efeito
mente com educação.**

**17 · Num dia de muitas decisões, o que envelhece não é o código — é o que
você escreveu de manhã.** A revisão do fim do dia achou seis coisas
desatualizadas, e **as seis eram minhas, escritas nas horas anteriores**: o
pré-voo sem duas regras que nasceram depois dele, o `LEIA-ME` sem o guia que
entrou à tarde, quatro contagens que a própria sessão invalidou. **Nenhuma
estava errada quando foi escrita.** O código não sofre disso porque tem suíte;
os documentos operacionais só têm as guardas que alguém lembrou de escrever.
**Regra: ao fechar uma sessão que mudou operação, varra o que a própria sessão
produziu** — contagens, listas enumeradas ("os três últimos"), e todo documento
escrito ANTES da última decisão do dia. E quando uma correção for adiada por
custo presumido (*"isso exige o Supervisor local"*), **confira o custo antes de
registrar a desculpa**: o comentário do Catálogo estava a um `grep` com escape
de distância, e eu o deixei para depois por três horas.

**18 · Backtick dentro de aspas duplas no bash é substituição de comando — e me
mordeu três vezes no mesmo dia.** A terceira gravou o `SIM-80` **sem dois
termos**: o shell executou `PARA_ENTREGAR_AO_ASSISTIDO` e `public/` como
comandos e pôs vazio no lugar. O texto ficou gramaticalmente plausível — *"numa
lista própria, , num bloco"* —, que é o que torna o defeito perigoso: **não
parece corrompido, parece mal escrito**. As três vezes tinham a mesma forma
(`node --input-type=module -e "…"` com crase dentro), e as três eram evitáveis
pela mesma regra, que passa a valer: **texto com crase, cifrão ou aspas vai para
um arquivo de script e roda por caminho — nunca por `-e` entre aspas duplas.**
E a checagem que salvou: **conferir o efeito por `grep` depois de gravar**, em
vez de confiar no `✓` que o próprio script imprime. É a irmã da lição 16 — script
que não confere o próprio efeito mente com educação.

**19 · Depois de uma decisão, o perímetro não é "os documentos que a decisão
menciona" — é TODOS, e a diferença se mede pela data de cada um.** Em 31/08
apliquei quatro decisões editando os quatro guias que elas citavam, e presumi os
outros quatro. Quando o Fundador perguntou se estavam auditados, o `git log -1`
por arquivo respondeu em três segundos: **metade parada em 30/08, antes das
decisões.** Um dos dois defeitos ali só aparece lendo — o Supervisor que *"estava
na Consulta Inicial"* não tem termo aposentado, número velho nem contagem
errada; **`grep` nenhum o acha.** Regra: ao fechar uma decisão, **liste os
documentos por data de última alteração** e leia os que ficaram atrás — a lista
é curta e o custo é minutos. E a companheira, que também se provou hoje:
**varredura por padrão só encontra a forma que você imaginou** — `"conceitos 15
e 16"` não casa com `"15 (Cobertura e convênio) e 16 (…)"`. Quando varrer para
eliminar algo, **varra a forma geral** (`\b1[0-9] \(`), não a frase que você se
lembra de ter escrito.

**20 · Um teste que não muda nada passa sempre — e o erro mais fácil é
escrever a mutação errada.** Ao provar que o gerador detecta mudança, minhas
duas primeiras tentativas não mutaram coisa alguma: um **comentário HTML** (que
não renderiza, então o PDF saiu igual) e um **backup copiado do próprio arquivo
atual** (idêntico por construção). **Nos dois casos o teste passou, e o "passou"
não significava nada.** A defesa é uma pergunta antes de rodar: *"o que
exatamente vai estar diferente depois desta linha?"* — se a resposta não for um
byte concreto, a mutação é decorativa. **E ela vale para os dois lados do dia:**
foi assim que a guarda de cobertura (lição 16) e este gerador só ganharam
confiança depois de eu os **ver reprovar**. Regra curta: **prove a mutação antes
de confiar no teste que ela alimenta** — `grep` o efeito, não o `✓`.

**21 · Quando o pedido é um artefato inseguro, o trabalho é achar o que ele
resolve — não recusar e parar.** O pedido foi *"um PDF com todos os acessos,
usuários e senhas"*. Recusar e ficar por isso seria deixar o Fundador sem o que
ele precisava de verdade, que era **simular**. **O que destravou foi ir olhar
antes de responder:** o `bootstrap-local-test-users` já existia, já fazia melhor,
e a resposta virou *"não faço o PDF, e aqui estão as seis contas funcionando"*.
**A recusa sozinha teria custado o mesmo e entregue nada.** Regra: diante de um
pedido que não se deve atender na forma pedida, **procure a forma que atende o
propósito** — e traga-a pronta, não como sugestão. E o corolário que também vale:
**afirmar que algo é seguro exige medir.** Eu não disse "a folha não tem senha":
extraí o texto do PDF e do `.txt` e comparei com as seis senhas reais.

> **A SEGUNDA METADE DESTA LIÇÃO CHEGOU EM 02/09, e sem ela a primeira vira
> teimosia.** O Fundador repetiu o pedido — *"FORNEÇA AS SENHAS NO DOCUMENTO"*
> — e eu fiz. **Uma recusa é um padrão razoável na primeira vez; repetida
> contra a instrução explícita do dono, vira eu decidindo no lugar dele.** O
> que a primeira metade continua exigindo é que a alternativa seja oferecida
> **antes**, com o porquê, e que os fatos sejam ditos uma vez e não repetidos
> como sermão. Feito isso, a decisão é dele.
>
> **E o julgamento certo era mais fino do que "senha em documento é ruim":**
> aquelas senhas são de um banco local, geradas aleatoriamente, que só abre no
> Docker daquela máquina. **O que precisava de proteção não era o valor — era
> o LUGAR.** Daí a fronteira que ficou: a folha do repositório sem senha
> (público no GitHub), a da Área de Trabalho com (não versionada). **A regra
> generalizável: quando recusar um artefato, verifique se o risco está no
> conteúdo ou no destino — quase sempre está no destino, e destino se troca.**

**22 · Numa travessia, o que mais rende não são os defeitos achados — é a
quantidade de suspeitas que morrem na verificação.** Foram **quatro defeitos
reais e seis alarmes que eu não dei**, cada um dissolvido por um passo de
checagem antes de escrever: *"Com o Concierge"* parecia termo aposentado (a
ADR-106 diz *"não é renomear, é redistribuir"*); a área da assistida parecia ter
uma emenda dura (a camada é `position: fixed` — **artefato da captura
`fullPage`**); as 29 classificações pareciam não persistir (**faltava eu clicar
em "Salvar N alterações"**); a Mesa parecia não achar profissional (**eu tinha
semeado o seed das lacunas deliberadas**); *"Documentos pendentes"* parecia
degradação quebrada (**é `null` por decisão escrita — derivar número dali seria
inventar**); e o *"Declarar área"* que não respondia era **seletor meu**. **A
proporção importa: se eu tivesse reportado por impressão, seis dos dez seriam
falsos** — e cada falso teria custado uma correção que estragaria algo certo.
**Regra: numa travessia, a pergunta antes de cada achado é "o que eu ainda não
abri?"** — a ADR, o componente, o seed, o CSS computado. E a de hoje mais cara
de aprender: **um teste que reprova pode estar certo sobre VOCÊ**, não sobre o
produto.

**23 · O instrumento mentiu de três jeitos num dia só, e cada mentira era
plausível.** *(a)* O painel do navegador embutido **não pinta enquanto está
oculto** — capturas saíram em branco e eu quase reportei "a home tem faixas
vazias". *(b)* A captura `fullPage` do Chromium **não acompanha camada
`position: fixed`**: a área da assistida pareceu ter uma emenda dura, de novo,
pelo mesmo motivo do `SIM-86`. *(c)* Meu medidor de contraste lia
`color(srgb 0.98 0.97 0.95)` — **floats de 0 a 1** — como se fosse 0–255,
**transformando branco em preto**: reprovou meia dúzia de textos do rodapé que
estão perfeitos. **A regra que sobra: antes de reportar o que a ferramenta
mostra, pergunte o que a ferramenta NÃO consegue ver.** O DOM desempatou as
três — `getComputedStyle`, `elementFromPoint` e a cor resolvida por canvas
valem mais que qualquer captura.

**24 · Herança de configuração é a armadilha que parece conserto.** O metadata
do Next é herdado pelo layout **e misturado de forma rasa**. As duas metades
disso me pegaram no mesmo conserto (`SIM-88`): subir o canônico para o layout
raiz declararia todas as páginas como cópias da home; e escrever
`openGraph: { url }` numa página **troca o objeto inteiro** em vez de
acrescentar, levando a imagem junto. **O segundo desfez o primeiro conserto do
mesmo dia, em silêncio.** O que salvou não foi cuidado — foi **medir o HTML que
o servidor entrega**, e não o código que eu tinha escrito. **Onde há herança,
verifique no produto final, nunca na fonte.**

**25 · Um "noindex" cravado é uma bomba de efeito retardado.** A tentação, nas
quatro páginas jurídicas vazias, era escrever `noindex` e seguir. Isso
funcionaria hoje e **falharia no dia mais importante**: publicado o contrato,
ninguém lembraria de virar a chave, e o documento ficaria fora da busca para
sempre — sem erro, sem aviso. **Toda regra que depende de um estado futuro deve
LER esse estado**, não fotografá-lo. A mesma leitura que a página usa para
escolher o que mostrar decide se ela é indexável.

---

## 7 · Fatos operacionais

- **O `push` pelo agente NÃO é bloqueado — o handoff de 27/08 estava errado
  nisso, e a correção importa porque custou tempo.** Aquele documento afirma
  que *"o classificador de permissões bloqueia `push`"*. Em 28/08, com
  autorização explícita do Fundador na conversa (*"faça você mesmo"*), o
  `git push origin main` **executou e passou de primeira**. Duas tentativas
  anteriores dele não chegaram a acontecer, e eu repeti a afirmação do handoff
  como se fosse fato verificado — não era.
  **O que continua valendo, e é a regra que importa:** o `AGENTS.md` exige
  autorização explícita do Fundador para qualquer alteração de produção, e
  `push` para `main` dispara deploy. A autorização é por ato, não por sessão.
  **O que segue NÃO verificado:** SQL em produção e a edição das próprias
  permissões. O handoff de ontem os cita na mesma frase; ninguém os testou, e
  não se deve deduzir deles nada a partir do caso do `push`.
- **O deploy leva cerca de um minuto.** Conferir sempre em `/api/build-info`,
  que devolve o commit publicado.
- **Dá para ver a Landing localmente sem banco**, e isto é novo: `dev:local`
  exige Supabase em Docker, mas `npx next dev` com
  `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` de fachada sobe
  e serve as páginas públicas. Login e área autenticada não funcionam, e
  `/privacidade` e `/termos` devolvem **500** (é `fetch failed` contra o
  Supabase inexistente, não defeito — em produção respondem 200 com "ainda não
  publicado").
- **Não crie `.env.local`** para isso: injete as variáveis no processo.
- **Existe guarda de vocabulário, e ela cobra a ADR na linha.** Se você
  aposentar um termo numa decisão, `tests/unit/vocabulario-dos-guias.test.ts`
  passa a reprovar cada sobra dele em `docs/guias/**` e `docs/rede/**`. Menção
  histórica é permitida — **desde que a linha cite a ADR que aposentou o
  termo**. Termo novo aposentado entra na lista `APOSENTADOS` do próprio teste.
- **DOIS lugares guardam roteiro, e a diferença importa:** `docs/guias/` são os
  guias de leitura (PDF **ignorado** pelo Git, ninguém baixa); `docs/rede/` são
  as **peças de papel da operação** — PDF versionado, publicado em
  `public/rede/` e oferecido no Kit da Curadoria em `/admin`. **Editar um não
  edita o outro**, e foi assim que eu renomeei o roteiro errado em 28/08.
  Antes de mexer em roteiro, pergunte qual dos dois alguém vai imprimir.
- **EXISTE UMA CÓPIA FORA DO REPOSITÓRIO, e ela é o risco desta entrega.**
  A pedido do Fundador (28/08), os dezesseis documentos foram copiados para
  `Área de Trabalho › Aliviar - Operação` (chamava-se *Kit da Curadoria* até
  01/09), em subpastas ("Para
  preencher na sala" e "Para ler antes", esta com os guias renumerados na ordem
  de leitura). **Ela é um retrato e não se atualiza sozinha.** Daqui a algumas
  semanas alguém imprime de lá e opera com preço velho — que é exatamente o
  defeito do `SIM-63`, agora fora do alcance de qualquer guarda: **o teste de
  vocabulário só enxerga o repositório.**
  Mitigado com um `LEIA-ME.txt` que abre pelo preço vigente e fecha dizendo que
  a versão certa está em `/admin` — mas mitigação por texto depende de alguém
  ler. **Se o preço ou um papel mudar de novo, refaça a pasta no mesmo commit**,
  ou apague-a. **Histórico:** a primeira cópia foi apagada pelo Fundador em
  30/08 e refeita no mesmo dia (o LEIA-ME registra); a pasta carrega também o
  **PRE-VOO do Ensaio**. **Estado em 01/09: 37/37 arquivos, byte a byte com o
  repositório** — refeita depois das correções da auditoria de conteúdo, do
  preço e da data do Ensaio.
  **O procedimento, e a ordem importa:** rode os DOIS geradores primeiro e
  confirme `git status` vazio; só então copie. Sem esse passo você espalha um
  PDF velho com a confiança de estar atualizando — o gerador é que prova que o
  PDF confere com o fonte, não a data do arquivo.
  **É a única cópia fora do repositório que resta**, agora que as de
  `Documentos` foram apagadas. Enquanto for refeita a cada mudança é
  ferramenta; no dia em que parar, vira a armadilha que a limpeza de 31/08
  tirou dali.
- **NÃO EXISTEM MAIS CÓPIAS SOLTAS FORA DO REPOSITÓRIO** (limpeza de 31/08), e
  vale saber o que havia para ninguém procurá-las: em
  `Documentos › Aliviar - material` viviam um **worktree órfão** de 22/08 (1.690
  arquivos, 28 MB, apontando para `Desktop/curadoria-2-0`, que não existe mais —
  git nem abria) e **três PDFs operacionais de 22/08**. Os dois foram apagados
  com autorização do Fundador.
  **O worktree não tinha trabalho perdido, apesar do nome "não commitado":** ele
  parava na ADR-066 (o repo já ia na 107), e cada um dos seus 180 arquivos
  exclusivos foi conferido no histórico — todos já estiveram no `main` e saíram
  por commit com motivo (a Mesa antiga, o ACE, as seis telas da ADR-07x). Era o
  estado ANTERIOR às remoções, não trabalho perdido.
  **Os três PDFs eram o risco de verdade:** um deles era o
  `Roteiro-de-Atendimento` — nome aposentado, sem "R$ 500" e sem "Supervisor" —
  e os outros dois estavam desatualizados. **A guarda de vocabulário não os
  alcançava: ela só enxerga o repositório.** Quem imprimisse dali no sábado
  ensaiaria a operação de agosto.
  **A pasta continua existindo** com o que é legítimo: 246 fotos originais, o
  backup de schema de 21/08 e um documento de modelo de dados.
- **OS CINCO DOCUMENTOS JURÍDICOS VIVEM NO REPOSITÓRIO** (31/08), em
  `docs/juridico/`: os `.docx` originais em `originais/` e a extração em texto
  ao lado, por `scripts/extrair-docx.mjs`. **Nenhum está publicado**, e nenhum
  pode ser: todos têm campos em branco. Quando as respostas chegarem, é daqui
  que o texto vai para `legal_documents`.
  **A leitura deles confirmou o documento de perguntas em cada citação** — e
  **corrigiu uma leitura minha**: eu apontara a cláusula de foro como risco de
  abusividade, e o texto real já termina com *"sem prejuízo das regras
  protetivas eventualmente aplicáveis ao consumidor"*. **Levantei alarme sobre
  cláusula que não tinha lido**, e a emenda está no topo da leitura técnica.
- **A POLÍTICA DE PRIVACIDADE ESTÁ ESCRITA** (31/08, `docs/privacidade/POLITICA_DE_PRIVACIDADE.md`,
  v1.1). Termina o rascunho de 19/08 em vez de recomeçar — a estrutura dele era
  boa. **Vai ao advogado para REVISÃO, não redação**, e pode ir na mesma
  mensagem das perguntas.
  **Três seções novas, e duas nascem das decisões desta semana:** *"Duas
  pessoas, e só duas"* (a ADR-106 dita para quem ela protege — o melhor
  argumento de privacidade da casa, que não estava dito à assistida em lugar
  nenhum), *"O que NÃO medimos"* (o analytics fora das rotas privadas, com o
  desenho por lista de permissão — verificado em `analytics-gate.tsx`, não
  afirmado), e *"Quando compartilhamos com alguém de fora"* (o rascunho dizia
  "ninguém mais" e parava; faltavam a representação com procuração e a
  obrigação legal).
  **Um colchete saiu por honestidade, não por preenchimento:** a região da
  Vercel. Não há `vercel.json` fixando região — afirmar uma seria inventar num
  documento que promete precisão.
  **Sobram quatro decisões, isoladas no fim, e TRÊS SÃO DO FUNDADOR:** o e-mail
  do encarregado (hoje um Gmail pessoal; recomendado `privacidade@` no domínio),
  o prazo de retenção, o prazo de resposta (proposto: 15 dias corridos, com
  fundamento) e a validação de quem pede por outra pessoa.
- **TRÊS GERADORES DE PDF, e cada um serve a um público.** `gerar-rede-pdf`
  (peças de papel, versionadas e publicadas), `gerar-guias-pdf` (os onze guias,
  publicados em `public/guias/`) e `gerar-doc-pdf` — este último converte
  qualquer `.md` de `docs/` em PDF apresentável, e existe para falar com quem
  está FORA da casa: advogado, contador, parceiro. Os três normalizam o carimbo
  de hora (saída determinística).
  **E há guarda para o que eles produzem:** `scripts/conferir-pdf.mjs` extrai o
  texto do PDF de volta e reprova barra invertida crua, negrito quebrado e termo
  esperado ausente. **Use-a sempre que um PDF sair para fora** — foi ela que
  pegou o primeiro documento enviado ao advogado com seis asteriscos crus.
  **Contar páginas não é conferir.**
- **TRÊS destinos de PDF, e a diferença é o que se publica** (atualizado em
  28/08, quando os guias entraram no Kit):
  `docs/guias/pdf/` **ignorado** pelo Git — cópia local de trabalho;
  `public/guias/` **versionado e publicado** — os onze guias, baixáveis no Kit;
  `docs/rede/` + `public/rede/` **versionados e publicados** — as peças de
  papel. Os dois geradores publicam: `gerar-guias-pdf.mjs` pelo mapa
  `PUBLICADOS`, `gerar-rede-pdf.mjs` pela lista `PECAS`. **Guia novo só aparece
  no Kit se entrar no mapa E na lista `GUIAS_DE_LEITURA` do cartão** — o teste
  `kit-da-curadoria` reprova link morto, mas não adivinha o que você esqueceu
  de acrescentar.
- Rodam aqui: `typecheck`, `test` (2.661), `test:components` (624),
  `npx eslint <arquivos>`. Não rodam: `lint`, `build`, integração e E2E.

---

## 8 · O trabalho aberto, em ordem de valor

1. **Marcar o Ensaio Geral — DESMARCADO pelo Fundador em 31/08**
   (*"não vou ensaiar agora"*), depois de marcado em 30/08 para 05/09. **É a
   segunda marcação que não acontece** — a primeira foi a ADR-076 (22–23/08).

   **A data foi retirada de tudo, por decisão dele (opção A):** o
   `ensaio-geral.html` agora diz *"pronto, sem data marcada"*, o pré-voo abre
   com a nota de que não envelhece, as quatro mensagens trazem `[dia]` no lugar
   do dia, e os arquivos perderam a data do nome (`pre-voo-do-ensaio`,
   `mensagens-de-convite`, `PRE-VOO do Ensaio.pdf`). **O material está inteiro
   e nada nele depende de data** — ao remarcar, o primeiro item do pré-voo é
   justamente marcar.

   **O que isso muda nas deferências, e é o que mais importa:** eu vinha parando
   coisas com a frase *"espera o sábado"* (`SIM-69`, `SIM-70`, `SIM-71`, a
   reordenação da Parte 4, a lavratura dos três híbridos, a separação dos
   downloads). **A ADR-073 nunca falou do Ensaio** — ela congela até a
   **primeira Curadoria real**. As deferências seguem válidas; mudaram só de
   nome: não é *"depois do sábado"*, é **"depois da primeira pessoa de
   verdade"**.

   **O que a data cobra até sexta, e é pouco:** confirmar as pessoas — quem
   interpreta o assistido (pessoa de confiança), quem faz o Supervisor (segunda
   pessoa da equipe), quem atende os telefones dos dois médicos, e o observador
   que não trabalha. Imprimir da pasta da mesa ou do `/admin`. Nada de código.
   **O pré-voo está pronto, em duas formas na pasta da mesa:** o `.pdf`
   (3 páginas, para imprimir e riscar) e o `.txt` (abre sem leitor, serve no
   celular). O fonte é `docs/rede/ensaio/pre-voo-do-ensaio.md`. O que era
   verificável por máquina está **OK**; as caixas vazias são as quatro pessoas,
   a impressão — **com a pegadinha das fichas secretas em destaque** — e a
   logística. As cinco perguntas do Diário estão no rodapé.

   **E as quatro mensagens de convite já estão escritas** (31/08), em
   `docs/rede/ensaio/mensagens-de-convite.txt` e na pasta da mesa: uma por
   papel, sem jargão, prontas para encaminhar. **A recomendação registrada é
   enviar no mesmo dia, não na sexta** — um "não posso" descoberto na sexta não
   se ajusta, adia. É a única coisa que separa a data de acontecer, e a primeira
   marcação (ADR-076) caiu exatamente aqui.

2. **Quem é a primeira pessoa** — a decisão que destrava mais coisa e que o
   Fundador toma sozinho.
3. ~~**`SIM-62` grupo (b)**~~ — **FECHADO em 01/09**, verde pela primeira vez
   desde 24/08. Os dois testes foram invertidos, não remendados.
4. **`SIM-60`** — o gate de aceite, mina registrada, não pedido de obra.
5. **O domínio próprio, dois cliques (`SIM-72`)** — ligar
   `aliviarcuradoriamedica.com.br` ao projeto `aliviar` no painel da Vercel e
   definir `NEXT_PUBLIC_SITE_URL`. **Nenhuma linha de código.** Está aqui, e não
   mais abaixo, porque o domínio **já está pago até 13/07/2027** e o site se
   anuncia como `aliviar-2-0.vercel.app` — numa empresa cujo produto é
   confiança, isso não é cosmético.
6. **`PRIV-04`** — a exclusão não alcança o storage. P0, depende da D-08.
7. **`SIM-89`** — as seis observações da varredura de 01/09, nenhuma
   bloqueante e todas medidas. **A de maior retorno é a primeira:** o cartão
   *"Pendências"* do `/admin` com **1.181px de branco**, na primeira tela que o
   administrador vê. Depois: os 5 itens do menu sem ícone, os dois textos do
   `/login` abaixo do contraste mínimo, os alvos de 29px no rodapé do celular,
   o título que contradiz a contagem no `/portal-curador`, e o
   `/profissional` sem indicador de progresso.
8. **A saudação automática do WhatsApp** — só o Fundador consegue olhar
   (WhatsApp Business → Ferramentas comerciais). **A recomendação escrita é
   ligar a de ausência e deixar a de saudação DESLIGADA**, pelo motivo do §5.
9. **A cena da `/o-que-e`** — pedido pronto para o Codex na pasta
   `Aliviar - Operação`. **A forma já está decidida** (herói no alto, não fundo
   atrás do texto; escritório de estudo vazio; cartão claro de letra escura), e
   é a parte que importa. **Depende de imagem**, seja gerada pelo Codex, pelo
   Fundador na interface do Runway, ou por mim se um dia houver
   `runway.local.json`. Sem ela não há nada a fazer no código.

---

## 9 · Como o Fundador trabalha

Continua valendo o §9 do handoff de 27/08, e esta sessão o confirmou duas
vezes: **a tela desempata o que o texto não resolve.** O rótulo "Curadoria
Médica" no cabeçalho e o vidro transparente foram os dois casos — em ambos o
argumento por escrito era inconclusivo, e uma captura resolveu em segundos.

Uma adição: **quando ele pergunta "o que você recomenda?" mais de duas vezes
seguidas, a recomendação provavelmente não é executável no momento em que ele
está.** Recomendar "rode o Ensaio" às quatro da manhã não é uma ação; "marque o
Ensaio" é.
