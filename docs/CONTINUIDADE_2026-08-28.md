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

**E O SÁBADO ESTÁ VERIFICADO PRONTO** (verificação final de 30/08, rodada — não
afirmada): repo = produção, pasta da mesa **18/18** byte a byte, conteúdo
crítico **12/12**, R$ 450 morto em toda superfície, 13 guardas verdes, Kit
**14/14** no ar. O que resta para o Ensaio de 05/09 é humano e está no PRE-VOO
da pasta da mesa: as quatro pessoas, a impressão com a separação das folhas, e
telefone-relógio-canetas.

---

## 2 · O que mudou de regra nesta sessão

**Oito ADRs, e juntas elas redesenham a operação humana da Curadoria.** Leia as
oito antes de mexer em papel, guia ou tela — elas se apoiam, e cada uma responde
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

**A ADR-073 segue em vigor**, e foi atravessada duas vezes nesta sessão a
pedido explícito do Fundador (a cena nova em `/solicitar-atendimento`). Dito em
voz alta antes e registrado no commit, que é o padrão a manter.

---

## 3 · O estado real, em uma frase

**Continua sendo a operação, não o código** — e a evidência agora é dupla: a
Landing foi revisada inteira (notebook e celular, nada a consertar), e uma
**auditoria fina de todo o site público** fechou com **um** defeito real — as
âncoras da navegação (`SIM-64`), corrigido e com guarda endurecida no mesmo
commit. Vocabulário, promessas, rotas, links, alt de imagem e console: limpos.

---

## 4 · Decisões que estão com o Fundador

| O quê | Situação em 28/08 |
| --- | --- |
| ~~**Entrada e parcelas**~~ | **DECIDIDO — ADR-107.** R$ 500 pelo ano, em até **12× de R$ 41,67, sem entrada**. Sai da lista. O R$ 450 anterior vivia em quatro lugares, um deles a página pública `/o-que-e`, e agora está na guarda de vocabulário: preço velho sobrevivente reprova a suíte. |
| **Quem é a primeira pessoa** | A ADR-096 só se sustenta se for alguém de dentro. **Decidida ela, o Case sai por consequência** — e o `61da4e7e`, herdado de julho, para de ser pergunta. É dado de produção; o repositório não sabe de quem ele é. |
| **Quem conduz** | **As ADR-100 a 105 já dizem o que cada um faz, e quem entra em qual sala — falta dizer QUEM é cada um.** Curador, Supervisor, Concierge e um observador que não trabalhe, com nome, antes do dia. Na Consulta Inicial ficam **duas** pessoas da Aliviar (Curador conduzindo, Supervisor calado e só se ela autorizar); o observador entra nos outros atos. |
| **Onde a jornada para** | Os três profissionais da Rede são reais. Decidir **antes**. |
| **ADR-095** — tamanho da Mesa | Esperar o uso real. |
| **Domínio próprio** | Serve para estranhos. A primeira Curadoria não tem estranhos. |
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
quatro peças de rede) e *"Para ler antes — na ordem"* (os dez guias, em pares
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
("PRE-VOO - sabado 05-09.txt", onde será usado) e em
`docs/rede/ensaio/pre-voo-2026-09-05.txt` (onde vira registro). A metade
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
célula é contar `<td`, não linhas.**

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

**11 · Renumerar uma lista quebra em silêncio toda referência numérica a ela.**
O Ensaio ganhou um ato no começo e a linha do observador — escrita quando a
Consulta Inicial era o ato 1 — passou a mandá-lo para dentro da sala proibida,
citando a ADR certa. Referência por número não sobrevive a inserção: ao inserir
item em lista numerada, **grep pelos números antigos em tudo que a cita**. E é o
segundo parente do `SIM-57` em dois dias: a linha parecia certa porque citava a
regra certa — o defeito estava no que o número passou a apontar.

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
  `Área de Trabalho › Aliviar - Kit da Curadoria`, em duas subpastas ("Para
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
  **PRE-VOO do sábado**. **Estado em 31/08: 18/18 arquivos, byte a byte com o
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
- **TRÊS destinos de PDF, e a diferença é o que se publica** (atualizado em
  28/08, quando os guias entraram no Kit):
  `docs/guias/pdf/` **ignorado** pelo Git — cópia local de trabalho;
  `public/guias/` **versionado e publicado** — os dez guias, baixáveis no Kit;
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

1. ~~Marcar o Ensaio Geral~~ — **MARCADO pelo Fundador em 30/08: sábado,
   05/09/2026.** A data está carimbada no próprio `ensaio-geral.html` (e no PDF
   que vai para a mesa). É a **segunda** marcação — a primeira (ADR-076,
   22–23/08) não aconteceu, e a diferença desta é que agora o Ensaio testa a
   operação certa, conferida três vezes.

   **O que a data cobra até sexta, e é pouco:** confirmar as pessoas — quem
   interpreta o assistido (pessoa de confiança), quem faz o Supervisor (segunda
   pessoa da equipe), quem atende os telefones dos dois médicos, e o observador
   que não trabalha. Imprimir da pasta da mesa ou do `/admin`. Nada de código.
   **O pré-voo está pronto e entregue** ("PRE-VOO - sabado 05-09.txt", na pasta
   da mesa): o que era verificável por máquina já está [OK]; as caixas vazias
   são as quatro pessoas, a impressão (com a pegadinha das fichas secretas) e a
   logística. As três perguntas do Diário estão no rodapé dele.

2. **Quem é a primeira pessoa** — a decisão que destrava mais coisa e que o
   Fundador toma sozinho.
3. **`SIM-62` grupo (b)** — `admin-dashboard.spec.ts` vermelho desde 24/08.
4. **`SIM-60`** — o gate de aceite, mina registrada, não pedido de obra.
5. **`PRIV-04`** — a exclusão não alcança o storage. P0, depende da D-08.

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
