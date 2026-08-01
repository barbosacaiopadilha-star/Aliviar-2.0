# A Narrativa da Experiência da Aliviar — Projeto Experiência Visual · Etapa 1

> **Status:** fonte de verdade da UX. Nenhuma tela será desenhada antes deste documento, e nenhuma tela desenhada poderá contradizê-lo.
> **Herda, congelados:** a arquitetura operacional do RC1 certificado · [Arquitetura da Experiência](./ARQUITETURA_DA_EXPERIENCIA.md) (F1) · [Sistema Visual](./SISTEMA_VISUAL.md) (F2) · [Dramaturgia](./DRAMATURGIA_DA_EXPERIENCIA.md) (F3) · [Arquitetura do Lugar](./ARQUITETURA_DO_LUGAR.md) (F4) · [Sala Particular](./SALA_PARTICULAR.md) (F5) · [O Encontro](./O_ENCONTRO.md) (F6) · [A Decisão](./A_DECISAO.md) (F7) · [A Mesa](./A_MESA.md) (F8) · [A Sala da Decisão](./A_SALA_DA_DECISAO.md) (F9) · [Contrato Operacional](./CONTRATO_OPERACIONAL_DA_DECISAO.md) (9B) · [Fronteiras da Continuidade](./FRONTEIRAS_OPERACIONAIS_DA_CONTINUIDADE.md) (9C.1).
> **Não altera:** domínio, banco, RLS, Motor, Curadoria, regras, estados, Connection, Relationship. Este documento reorganiza percepção, nunca funcionamento.
> **Data:** 2026-08-01

---

# 1 · Quem é a paciente quando entra

Ela não chegou navegando. Chegou depois de um diagnóstico, de uma noite ruim, de uma conversa que a assustou. Provavelmente já pesquisou sintomas às três da manhã, já viu listas de médicos com estrelas, já foi tratada como protocolo.

**O que sente.** Pressa que não é dela — é do medo. Cansaço de decidir sozinha algo grande demais. E desconfiança: de sites que vendem, de rankings que simplificam, de qualquer lugar que peça o e-mail antes de dar qualquer coisa. A desconfiança dela é inteligência, não obstáculo.

**O que procura.** Não procura "o melhor médico" — essa é a pergunta que a internet a ensinou a fazer, e é a pergunta errada. O que ela procura de verdade é **alguém que entenda o que está acontecendo com ela** antes de lhe apresentar qualquer coisa. Procura um lugar onde a história dela caiba inteira, não um formulário onde ela caiba em campos.

**O que teme.** Errar numa decisão que não se desfaz. Ser julgada — pela dúvida, pela demora, pela pergunta "boba". Ser convertida: perceber, tarde demais, que era um funil. E ficar sozinha de novo depois de escolher.

**O que espera.** Pouco. A experiência anterior dela com saúde digital calibrou a expectativa para baixo: espera ser cadastrada, classificada, apressada e abandonada. **É exatamente essa expectativa que a Aliviar existe para contrariar — e contrariá-la é a primeira coisa memorável que fazemos.**

---

# 2 · Quem é ela quando sai

Não em termos médicos — o desfecho clínico não nos pertence. Em termos humanos:

**Ela foi compreendida por alguém com nome e rosto.** Contou a história com as próprias palavras, e uma pessoa leu, escreveu de volta, citou as frases dela e teve a honestidade de perguntar o que não entendeu.

**Ela entende o próprio caso.** A confusão virou estrutura sem virar frieza: ela sabe o que importa, em que ordem, e por quê — porque a ordem é dela.

**Ela decidiu, e ninguém decidiu por ela.** Saiu de uma comparação sem ter reprovado ninguém, escolheu sabendo do que abria mão, e escreveu — se quis — a própria razão. A última palavra registrada na Curadoria é dela.

**Ela não está sozinha.** Sabe quem segue com ela, pelo nome. Sabe o que aconteceu, o que ainda não aconteceu e o que fazer se mudar de ideia.

Quem entra é alguém carregando uma decisão pesada demais para carregar sozinha. **Quem sai é alguém que decidiu acompanhada — e que se lembraria do lugar onde isso aconteceu.**

---

# 3 · A transformação

Em uma frase: **de assustada e sozinha diante de uma escolha, a autora de uma decisão tomada em companhia.**

A transformação não é informacional — ela não sai "sabendo mais sobre médicos". É de posição: ela entra como objeto de um problema ("algo está acontecendo comigo") e sai como sujeito de uma decisão ("eu escolhi este caminho, por esta razão minha"). O que produz a virada não é conteúdo, é sequência: ser recebida antes de ser perguntada, ser compreendida antes de ver opções, comparar antes de decidir, e decidir antes de ser acompanhada. Cada etapa só existe porque a anterior aconteceu — e é por isso que a jornada parece inevitável sem nunca parecer imposta.

O software é apenas o meio dessa transformação. Ela nunca deve sentir que está usando páginas; deve sentir que está **atravessando ambientes preparados para cada momento** — e que, em cada um, alguém preparou aquele cômodo para ela.

---

# 4 · Os capítulos

Sete momentos, nomeados pelo que acontece com ela — nunca por telas:

| # | Capítulo | O que acontece |
|---|---|---|
| 1 | **A Chegada** | ela olha de fora, desconfiada, e percebe que este lugar é diferente — nada lhe é pedido |
| 2 | **O Contar** | ela fala; a casa escuta sem interromper, uma pergunta por vez |
| 3 | **O Encontro** | uma pessoa leu, escreveu de volta, e perguntou o que não entendeu — o momento definidor da Aliviar |
| 4 | **A Compreensão** | ela vê o próprio caso organizado, na ordem dela, e entende o que faremos com isso |
| 5 | **A Comparação** | ela entende a diferença entre três caminhos legítimos — e nenhum lhe parece pior |
| 6 | **A Escolha** | ela decide, diz por quê nas próprias palavras, e ninguém celebra nem julga |
| 7 | **A Continuidade** | ela deixa de agir para ser acompanhada; a novidade espera ser encontrada |

A lei que rege a passagem entre capítulos (herdada da Dramaturgia): **um capítulo só abre o seguinte quando sua pergunta emocional foi respondida** — não quando campos foram preenchidos.

---

# 5 · Cada capítulo por dentro

## Capítulo 1 — A Chegada

- **Emoção predominante:** desconfiança acelerada. Ela chega correndo e com a guarda alta.
- **Pergunta na cabeça dela:** *"Posso confiar neste lugar?"*
- **A interface deve transmitir:** que há um lugar, cuidado por alguém, com a porta destrancada — e que nada será pedido em troca de entrar. Reconhecimento do momento dela antes de qualquer palavra sobre nós.
- **Jamais transmitir:** urgência, venda, prova social ("X pacientes atendidos"), promessa, explicação do Método, qualquer pedido de dado. Quem chega assustado não quer entender como funciona; quer saber se pode respirar.

## Capítulo 2 — O Contar

- **Emoção predominante:** expectativa cautelosa que vira alívio de ser esperada.
- **Pergunta:** *"Alguém sabe que eu cheguei?"*
- **Transmitir:** preparo prévio (a casa já sabe o nome dela e não pergunta de novo), precisão sobre quem lerá o que ela escrever, posse do rascunho (o texto é dela até que envie), e tempo — uma pergunta por vez, com ar.
- **Jamais transmitir:** contagem ("faltam 2 passos"), completude cobrada, sugestão automática, autocompletar, qualquer interrupção. Interromper alguém que conta algo difícil é a falta de educação mais comum das interfaces.

## Capítulo 3 — O Encontro

- **Emoção predominante:** vulnerabilidade — que se resolve em *"é exatamente isso"*.
- **Pergunta:** *"Alguém entendeu o que está acontecendo comigo?"*
- **Transmitir:** que uma pessoa leu e demorou o tempo de uma pessoa; que ela cita as palavras dela; que lembrou do detalhe periférico; que admite o que não entendeu — a dúvida honesta é a assinatura da escuta real. A carta termina com uma pergunta, e o reconhecimento é consequência de respondê-la.
- **Jamais transmitir:** aparato de sistema (nenhum termo do Método atravessa a porta), aceite ("li e concordo"), validação de dados ("está correto? sim/não"), celebração ao reconhecer, vigilância enquanto ela lê. É a única tela da plataforma em que nada mais existe.

## Capítulo 4 — A Compreensão

- **Emoção predominante:** alívio novo, ainda frágil, virando confiança orientada.
- **Pergunta:** *"O que a Aliviar vai fazer com isso?"*
- **Transmitir:** o próprio caso como um todo ordenado, na linguagem dela, com os pesos visíveis por espaço e palavra — nunca por número. E a frase que reenquadra tudo o que vem: *"provavelmente mais de um vai atender."*
- **Jamais transmitir:** ação obrigatória (é o único ambiente sem nada a fazer), pontuação, vocabulário do Método, sensação de tela vazia ou inacabada, "aguarde/processando" durante a espera pelos três.

## Capítulo 5 — A Comparação

- **Emoção predominante:** curiosidade tensa, com o hábito do ranking no bolso — que se dissolve em clareza sem pressão.
- **Pergunta:** *"Qual é a diferença entre eles?"*
- **Transmitir:** primeiro o comum (a superfície indivisa: os três atendem ao indispensável), depois as pessoas em prosa, depois o Mapa na ordem e na voz dela. Que voltar é o gesto natural — a Mesa não expira, não muda por ausência, não tem relógio. Que a lacuna tem a mesma dignidade de tudo.
- **Jamais transmitir:** veredito, destaque, soma, cor que julga, "melhor", pergunta sobre se ela já decidiu, comparação de custos entre profissionais ("este abre mão de menos" é o ranking pela porta dos fundos), qualquer celebração.

## Capítulo 6 — A Escolha

- **Emoção predominante:** responsabilidade pesada — que se resolve em autonomia sem solidão.
- **Pergunta:** *"Posso decidir? É meu direito?"*
- **Transmitir:** que não existe resposta certa ("os três podem cuidar bem de você — a diferença é o jeito"); as quatro verdades antes da confirmação (o alcance do ato, quem segue com ela pelo nome, a janela de volta nas condições reais, as alternativas continuam); e a quarta porta — "quero pensar mais" — com o mesmo peso das três.
- **Jamais transmitir:** urgência ou escassez de qualquer espécie, "tem certeza?", segunda confirmação, elogio à escolha ("ótima escolha" declara que havia certo e errado), gramática de compra, celebração, julgamento de prontidão, promessa sem autoridade ("o Curador foi avisado", "a decisão é reversível" sem condição, qualquer frase com "quando").

## Capítulo 7 — A Continuidade

- **Emoção predominante:** apreensão pós-escolha — respondida com presença.
- **Pergunta:** *"Estou sozinha de novo?"*
- **Transmitir:** que a casa continua — sem tela de conclusão, sem arquivo, com os cômodos anteriores abertos. Quem está com ela agora, pelo nome. A frase que ela escreveu, sempre acessível. O tempo correndo à vista: o que aconteceu, o que está acontecendo, o que vem.
- **Jamais transmitir:** encerramento ("sua Curadoria foi concluída"), comparação renovada (é o combustível do arrependimento), interrupção (novidade espera ser encontrada, nunca invade), prazo ou horário que ninguém assumiu, "a equipe cuidará" (todo estado nomeia um papel, e o papel tem nome de pessoa).

---

# 6 · Capítulos → ambientes

Os seis ambientes já definidos, sem criar nenhum novo:

| Capítulo | Ambiente |
|---|---|
| 1 · A Chegada | **Entrada** (a Fachada e o Limiar da planta canônica, vistos como um só ambiente de chegada) |
| 2 · O Contar | **Recepção** |
| 3 · O Encontro | **a antessala da Sala Particular** — não é ambiente novo: é a passagem obrigatória entre Recepção e Sala, já prevista na planta (F4 §5) e aprofundada em O Encontro (F6). Ninguém entra no gabinete antes de ter respondido à carta |
| 4 · A Compreensão | **Sala Particular de Curadoria** |
| 5 · A Comparação | **Mesa de Comparação** |
| 6 · A Escolha | **Sala da Decisão** |
| 7 · A Continuidade | **Espaço de Acompanhamento** |

Dois elementos da planta congelada completam o mapa sem serem ambientes dela: **o corredor** (onde vive o Concierge e por onde se volta a qualquer cômodo já visitado) e **os fundos da casa** (Mesa do Curador, atendimento, administração — que nunca aparecem na planta dela, por hospitalidade, não por segredo).

---

# 7 · Cada ambiente por dentro

## Entrada

- **Ao entrar deve sentir:** *"isto aqui é cuidado por alguém — e ninguém está me pedindo nada."*
- **Ao sair deve sentir:** que desacelerou; que o mundo ficou do lado de fora.
- **Ritmo:** o mais lento da casa na travessia; a Entrada é o único lugar que se atravessa mais devagar do que se gostaria.
- **Linguagem:** sobriedade sem dramatização; a primeira frase é sobre o momento dela, não sobre nós. Nenhum imperativo.
- **Densidade:** decrescente — a Fachada mostra um vislumbre; o Limiar tem quase nada: uma frase, muito vazio.
- **Comportamento esperado:** olhar, respirar, atravessar. Nada a preencher, nada a decidir.

## Recepção

- **Ao entrar:** *"eu era esperada."* O Curador já tem nome e rosto antes de ela fazer qualquer coisa.
- **Ao sair:** *"contei tudo, do meu jeito, e alguém começou a ler."*
- **Ritmo:** o dela — uma pergunta por vez, resposta confirmada antes da próxima. É o único ambiente que conduz ativamente; depois dela, a casa fica disponível em vez de guiar.
- **Linguagem:** segunda pessoa, permissiva ("você pode deixar em branco se preferir"), com precisão sobre quem vê o quê no instante em que a dúvida nasce.
- **Densidade:** baixa — um campo por tela, ar em volta, progresso sem número.
- **Comportamento esperado:** contar. E, ao terminar, esperar sabendo o que está acontecendo: *"[Curador] está lendo sua história"* — pessoa, nunca processo.

## Sala Particular de Curadoria (e sua antessala, o Encontro)

- **Ao entrar (antessala):** *"alguém me escreveu uma carta."* Ao entrar na Sala: *"este é o meu caso, organizado — e continua sendo meu."*
- **Ao sair:** confiança orientada — ela sabe o que faremos, em que ordem, e espera três caminhos válidos, não uma prova.
- **Ritmo:** dos mais lentos da casa. Tudo já está lá quando ela chega; nada anima na entrada. A carta reabre onde ela parou, sem dizer que o faz.
- **Linguagem:** a carta em prosa, segunda pessoa, citando as palavras dela, terminando na dúvida honesta do Curador. As prioridades em zonas com títulos que são frases sobre a vida dela ("o que não pode faltar"). Nenhuma palavra do Método.
- **Densidade:** ~55% de vazio; coluna única de 60–68 caracteres; luz quente de gabinete.
- **Comportamento esperado:** responder, corrigir sem cerimônia, voltar sempre que precisar se reencontrar. É o único cômodo ao qual se volta sem constrangimento — e não tem estado "concluída".

## Mesa de Comparação

- **Ao entrar:** *"vou entender a diferença"* — não "vou escolher".
- **Ao sair:** *"entendi a diferença entre eles, e nenhum me pareceu pior"* — idealmente sabendo o custo de cada preferência.
- **Ritmo:** ir e voltar, quantas vezes quiser; a saída é por saturação da curiosidade, nunca por conclusão. A Mesa não tem relógio.
- **Linguagem:** descritiva, ancorada na prioridade dela e na voz dela; células em frases, nunca símbolos; lacuna dita com dignidade ("ainda não foi possível confirmar").
- **Densidade:** a maior da jornada — e a luz mais honesta: neutra, de contraste alto. Comparar exige ver bem; a Aliviar não conforta aqui, mostra com clareza, e volta a acolher na sala seguinte.
- **Comportamento esperado:** espalhar, olhar, voltar. Primeiro o comum, depois as pessoas, depois o Mapa pelo Caminho (leitura vertical). Sair sem escolher é uso correto da Mesa.

## Sala da Decisão

- **Ao entrar:** *"tudo o que preciso já está aqui"* — completude imediata, nada a descobrir.
- **Ao sair:** *"eu decidi. Ninguém decidiu por mim."* Ou: *"vou pensar mais — e nada se perdeu."* As duas saídas valem o mesmo.
- **Ritmo:** parado. Nenhuma transição interna, nenhuma revelação progressiva. Uma visita, quando ela quiser.
- **Linguagem:** quase silêncio. Uma frase que autoriza ("não existe uma resposta certa aqui"), as quatro verdades, e espaço para a frase dela — opcional, curta, nas palavras dela.
- **Densidade:** a menor da casa — mais de 70% de vazio; a informação para de crescer; luz quente, o contraste mais baixo.
- **Comportamento esperado:** ficar. Decidir ou pedir tempo. Se ela sair sem confirmar, a Sala pode ter cumprido perfeitamente sua missão.

## Espaço de Acompanhamento

- **Ao entrar:** a casa simplesmente continuou — sem parabéns, sem modal, sem cerimônia. *"Sei quem está comigo agora."*
- **Ao sair:** não se sai — é a varanda, parte da casa voltada para o que vem. Ao voltar depois de meses: *"eu estive aqui."*
- **Ritmo:** o da vida real. Ela deixa de agir e passa a ser acompanhada; a plataforma trabalha e a novidade espera ser encontrada.
- **Linguagem:** registro, não preparação — o que aconteceu, o que está acontecendo, o que vem. Sempre nomeando quem, nunca prometendo quando.
- **Densidade:** média, doméstica — a luz mais quente da casa.
- **Comportamento esperado:** olhar quando quiser, reler a carta e a própria frase, encontrar novidade sem ser interrompida. Os outros dois caminhos saem de cena (nunca da história) no primeiro atendimento.

---

# 8 · As 56 telas reais, ambiente a ambiente

Legenda de destino: **Permanece** (papel e forma essencialmente certos) · **Muda visualmente** (mesmo papel e mesma funcionalidade; forma, linguagem e ritmo recalibrados pela narrativa) · **Funde-se** (conteúdo re-abrigado em outra tela; nenhuma funcionalidade se perde) · **Desaparece** (superfície sem papel na planta; a decisão de removê-la é de engenharia, fora deste documento). Nenhuma linha desta tabela altera funcionalidade.

## A planta dela

| Tela | Ambiente | Papel | Destino |
|---|---|---|---|
| `/` (landing editorial) | Entrada | a Fachada: mostrar que há um lugar | Muda visualmente — calibrar como exterior (menos argumento, mais vislumbre); já é a mais próxima do alvo |
| `/login` · `/recuperar-senha` · `/nova-senha` | Entrada | a porta de quem retorna | Muda visualmente — hoje é um cartão de sistema; deve ser a mesma porta da casa, com a luz de dentro |
| `/sua-historia` (boas-vindas) | Entrada → Recepção | o Limiar: desacelerar antes de contar | Muda visualmente — assumir explicitamente o papel de Limiar (quase nada, uma frase, muito vazio) |
| `/sua-historia/para-quem` · `motivo` · `historia` · `informacoes` · `preferencias` · `revisao` (+ `continuar`) | Recepção | o Contar: uma pergunta por vez | Permanece — o wizard já pratica a Recepção (um campo por tela, progresso sem número, autosave visível); refinamentos de linguagem e travessia apenas |
| `/paciente` (home) | o corredor | ponto de retorno: a casa que não zera, devolvendo-a ao cômodo onde estava | Muda visualmente — de "home com cards" para corredor com as quatro âncoras (nome, Curador, história, percurso) e as portas dos cômodos abertos |
| `/paciente/curadoria` | Sala Particular → Mesa → Sala da Decisão → Acompanhamento | hoje, **quatro ambientes numa página só** — a maior distância entre implementação e narrativa | Muda visualmente — a sequência funcional já existe (painéis por estado); a percepção deve virar travessia: cada bloco com a luz, a densidade e o ritmo do seu ambiente, com limiares entre eles |
| `/paciente/curadoria/imprimir` | Mesa | o Relatório que se leva — para a família, para a consulta | Permanece |
| `/paciente/documentos` | Sala Particular | o arquivo do gabinete: o que ela entregou ao caso | Muda visualmente |
| `/paciente/linha-do-tempo` | Espaço de Acompanhamento | a memória em construção | Muda visualmente — hoje lê como log de registros ("Sua conta foi criada"); deve ler como percurso de momentos |
| `/paciente/perfil` | Recepção | os dados práticos de quem chegou | Muda visualmente — única tela da área sem cabeçalho próprio |
| `/portal-paciente` | — (legado, sem endereço: 301) | duplicata da home | Desaparece |
| `/portal-paciente/prioridades` | Sala Particular | as prioridades por zonas (já sem números, ADR-042) — conteúdo sem endereço acessível hoje | Funde-se — na Sala Particular (o conteúdo é exatamente o das zonas de peso da F5) |
| `/portal-paciente/como-funciona` | Recepção | o que vai acontecer, quem faz o quê, as três coisas que nunca mudam | Funde-se — na Recepção/corredor; conteúdo valioso hoje inacessível |

## Os fundos da casa (nunca na planta dela)

| Tela(s) | Ala | Papel | Destino |
|---|---|---|---|
| `/coa/curadoria` + `casos/[id]` + `[etapa]` + `curadoria_tecnica` (4) | Mesa do Curador | a estação de trabalho do Método: condução, Mesa, relatório, devolutiva | Permanece — densidade aqui é legítima; ganha apenas coerência material com a casa |
| `/atendimento` + `/atendimento/[leadId]` (2) | Atendimento (Nível 1) | fila e ficha de leads | Permanece |
| `/acompanhamento` | posto do Concierge no corredor | worklist de continuidade | Permanece — corrigir a montagem (shell na página, sem layout) |
| `/coa` (hub) | circulação da equipe | escolha de nível operacional | Permanece |
| `/coa/atendimento` · `/coa/concierge` (2) | visões-pipeline paralelas | dashboards que duplicam a visão das superfícies de trabalho reais | Funde-se — candidatas a fundir com `/atendimento` e `/acompanhamento`; decisão de produto fora deste documento |
| `/admin` + casos (2) + pacientes (3) + profissionais (3) + equipe + ace (2) (12) | administração | operação da Rede, dos Cases e da equipe | Permanece — coerência material apenas |
| `/admin/crm/*` (8) | CRM | contatos, funil, tarefas, agenda, configurações | Permanece |
| `/profissional` | ala dos profissionais | declarações, evidências, protocolo | Permanece — futura coerência material; nunca aparece na planta dela |
| `/curador` + `casos` + `casos/[id]` (3) | legado ACE | superfície do motor antigo, paralela ao Método | Desaparece — da experiência; retirada efetiva é decisão de engenharia |
| `/acesso-negado` | porta errada | dizer com hospitalidade que aquele cômodo não é dela | Muda visualmente — hoje é HTML cru, a única superfície sem nenhum cuidado |

**Contagem:** 13 telas na planta dela (+ o corredor), 36 nos fundos, 4 legadas a desaparecer, 3 fusões. Nenhuma funcionalidade criada, alterada ou removida por este documento.

---

# 9 · A matriz

| Ambiente | Objetivo emocional | Telas | Componentes existentes reaproveitáveis | Papéis de componente que faltam¹ | Mudança necessária |
|---|---|---|---|---|---|
| **Entrada** | "posso confiar" → desaceleração | `/`, `/login`, `/recuperar-senha`, `/nova-senha`, `/sua-historia` | `HeroEditorial`, `editorial-sections`, `Reveal`, `AuthCard`, `.ambient-warmth` | o Limiar de travessia (superfície limpa + nome do cômodo, ~480ms); a porta de retorno com continuidade material | menos argumento, mais exterior; login deixar de ser cartão de sistema |
| **Recepção** | "sou esperada" → contar | wizard `sua-historia/*` (7), `/paciente/perfil`, conteúdo de `como-funciona` | `StoryStepLayout`, `AutosaveIndicator`, `StoryAttachments`, `StoryNarrative`, `Radio`, `Textarea` | a apresentação do Curador (nome e rosto antes de qualquer ação); a frase de quem-vê-o-quê no instante da dúvida | refinar linguagem e travessias; incorporar o que era `como-funciona` |
| **Sala Particular** (com antessala do Encontro) | "fui compreendida" → confiança orientada | bloco inicial de `/paciente/curadoria`, `/paciente/documentos`, conteúdo de `prioridades` | `ProfileCard`, `ReconhecerPerfil`, `PatientCard`, zonas de prioridade (ADR-042), `PatientDocumentsPanel` | a Carta como objeto permanente que cresce; as zonas de peso por espaço e palavra; a Porta que passa a existir | dar à carta e às prioridades a forma da F5/F6: prosa, zonas, correção ao lado — sobre os dados que já existem |
| **Mesa de Comparação** | "nenhum é pior" → clareza sem pressão | bloco dos caminhos em `/paciente/curadoria`, `/imprimir` | `CaminhosPanel`, `CartaCaminho`, `ComparacaoCaminhos`, `Retrato` | a Faixa do Comum (superfície indivisa); o Mapa como página diagramada (linhas na voz dela, alturas proporcionais, texturas de linha); empilhamento em pastas no estreito | reordenar a percepção: comum → pessoas → mapa; remover qualquer resíduo de barra/percentual² |
| **Sala da Decisão** | "posso decidir" → autonomia sem solidão | bloco de decisão em `/paciente/curadoria` (`ConnectionChoicePanel`, `ContactModePanel`) | `ConnectionChoicePanel`, `ContactModePanel`, `CuradoriaDecisionPanel` | o cômodo vazio (70%+ de vazio, quatro portas de mesmo peso); as quatro verdades; o campo da frase dela | separar percebidamente da Mesa (limiar entre elas); silêncio absoluto pós-confirmação |
| **Espaço de Acompanhamento** | "não estou sozinha" → continuidade | bloco final de `/paciente/curadoria` (`RelationshipStatusPanel`), `/paciente/linha-do-tempo` | `RelationshipStatusPanel`, `ConnectionProgressPanel`, `JornadaTimeline`, `PatientStatusWidget` | a varanda: linha do tempo de momentos (não de registros), com quem-está-comigo nomeado e a frase dela acessível | linguagem de registro humano; futuro visível sem promessa de prazo |
| **Corredor** (elemento da planta) | "a casa não zera" | `/paciente` | `AmbientHero`, `JourneyWalk`, `PatientShell`, `QuickLinks` | as quatro âncoras permanentes; portas para cômodos abertos (voltar, nunca avançar) | de home para corredor: devolver ao cômodo onde estava |
| **Fundos da casa** | equipe eficiente, paciente invisível a eles jamais o contrário | 36 telas (`/coa/*`, `/atendimento/*`, `/acompanhamento`, `/admin/*`, `/profissional`) | `AppShell`, `PortalShell`, sistema `ads/*`, `mesa/*` | — | apenas coerência material com a casa; densidade aqui é legítima |

¹ *Papéis, não desenhos: nomear o que precisa existir é escopo desta etapa; desenhá-lo, não.*
² *O inventário encontrou `barra-compatibilidade.tsx` entre os componentes dos caminhos — um resíduo do vocabulário proibido ("compatibilidade" como medida). A Etapa de desenho da Mesa deve substituí-lo pela gramática de texturas de linha da F2 §11.*

**Três dívidas transversais** que nenhum ambiente resolve sozinho (registradas para as próximas etapas, sem ação agora): três definições concorrentes dos mesmos tokens de cor (`globals.css` × `patient-dashboard.css` × `landing-editorial.css` — a paleta muda silenciosamente por área); cinco implementações de estado vazio e duas famílias de card sem regra de fronteira; e duas pastas de componentes do mesmo domínio em idiomas diferentes (`paciente/` e `patient/`).

---

# 10 · A história que a Aliviar conta

> **Uma pessoa chega assustada a uma decisão grande demais para tomar sozinha — e encontra uma casa onde alguém a esperava.**
>
> Ela não é cadastrada; é recebida. Ninguém lhe pede nada antes de lhe dar alguma coisa. Ela conta a história com as próprias palavras, no seu ritmo, sem ser interrompida — e então espera, sabendo que uma pessoa de verdade, com nome e rosto, está lendo. O que volta não é um resumo: é uma carta. Uma carta que cita as frases dela, que lembra do detalhe que ela mencionou de passagem, e que tem a honestidade de perguntar o que não entendeu. Esse é o momento que define tudo: **ela percebe que foi compreendida por alguém** — e responde, corrige, participa.
>
> Só então a casa lhe mostra o próprio caso, organizado na ordem que ela mesma declarou. E só depois disso lhe apresenta três caminhos — nunca um ranking, nunca um "melhor". Primeiro o que os três têm em comum; depois as pessoas, em prosa; depois as diferenças, na voz dela. Ela compara sob a luz mais honesta da casa, volta quantas vezes quiser, e sai sem ter reprovado ninguém. Quando decide — se decide, quando quer —, escreve a própria razão numa frase que fica. Ninguém celebra, ninguém julga, ninguém pergunta "tem certeza?". E "quero pensar mais" é uma porta do mesmo tamanho das outras.
>
> Depois da escolha, a casa não fecha: continua. Ela sabe quem segue com ela, pelo nome. A história, a carta, o Mapa e a frase dela permanecem abertos, no mesmo lugar, para sempre. Meses depois, ao voltar, ela não encontra uma home genérica — volta ao cômodo onde estava, e a primeira sensação é *"eu estive aqui"*.
>
> **Para quem desenha:** cada tela é um cômodo desta casa, e todo cômodo responde a uma pergunta humana antes de exibir qualquer informação. Avança-se por conclusão, nunca por menu. Serifa é voz de gente; sem-serifa é função de sistema. Nada brilha, nada soma, nada conta, nada julga, nada apressa, nada celebra. O vazio é estrutura. A lentidão é deliberada. E a pergunta de aceitação de qualquer desenho é sempre a mesma: **como esta tela faz a pessoa se sentir — e só depois, o que ela mostra.**
>
> A Aliviar não é um software que a pessoa usa. É o lugar onde alguém entendeu o que estava acontecendo com ela.

---

> **Este documento é a régua.** As próximas etapas do Projeto Experiência Visual desenham os ambientes — e cada desenho será auditado contra os capítulos, as tabelas e a página acima, na ordem de dependência definida pela F4 §15: Sala Particular primeiro, Fachada por último. Em arquitetura, o interior define a fachada — nunca o contrário.
