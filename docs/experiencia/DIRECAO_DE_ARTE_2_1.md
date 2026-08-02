# Direção de Arte — Aliviar Experience 2.1

> **Status:** revisão executada. Alterações aplicadas e validadas; revisão tipográfica ampla **documentada, não executada**, conforme instrução.
> **Método:** revisão sobre **19 capturas reais** dos sete ambientes, com login por papel, antes e depois. Nenhuma conclusão deste documento vem de leitura de código — o código só foi consultado depois, para localizar a causa do que a captura mostrou.
> **Herda:** [SISTEMA_VISUAL.md](./SISTEMA_VISUAL.md), ADR-045.
> **Data:** 2026-08-01

---

## 0 · O que a revisão encontrou antes de qualquer opinião estética

Ver as telas com os olhos de quem usa revelou **um defeito grave que nenhuma leitura de código teria encontrado**, e que estava vivo em produção.

**Vinte e uma declarações de cor não existiam.** O padrão `text-[var(--landing-linen)]/70` — opacidade aplicada sobre uma variável CSS arbitrária — **não é compilável pelo Tailwind**. A declaração é descartada em silêncio: sem erro de build, sem aviso de lint, sem teste vermelho. O texto cai para o preto padrão do navegador, e os links para o azul `#0000EE` de documento sem estilo.

Onde isso doía mais: **o rodapé institucional, sobre navy, dentro da Recepção** — a tela em que a pessoa está escrevendo por que procurou ajuda.

| Elemento | Antes | Depois |
|---|---|---|
| Texto do rodapé sobre navy | **1,85:1** (preto do navegador) | **7,75:1** |
| Links de navegação do rodapé | **1,21:1** (azul de link não estilizado) | **6,09:1** |
| Título do rodapé | 10,72:1 (era o único correto) | 10,72:1 |

Não era uma questão de gosto: **quatro dos cinco blocos daquele rodapé eram literalmente ilegíveis.** A correção criou o vocabulário que faltava — `on-dark`, `-muted`, `-faint`, `-line` —, com a transparência já embutida via `color-mix`, para que ninguém volte a alcançar o modificador que quebra. Os degraus foram calibrados contra a **mais clara** das superfícies escuras da plataforma, não contra a mais escura: calibrar pelo caso fácil é exatamente como um texto secundário desaparece.

**Este é o argumento central desta rodada.** Não se dirige a arte de uma plataforma lendo o código dela.

---

## 1 · Fachada (Landing)

**Objetivo emocional:** *"Estou em um lugar seguro."*

**O que transmite hoje.** Segurança, sim — e a chegada é o melhor momento da plataforma: serifa grande, respiração ampla, o azul institucional de volta na marca e no CTA, foto de ambiente real em vez de banco de imagens. O visitante entende em três segundos que não está num diretório de anúncios.

**O que deveria transmitir, e onde falha.** Segurança com **ritmo**. Medi as sete seções: **8.579px de altura para ~2.500 caracteres de texto** — cerca de 0,4 caractere por pixel, com 8,5rem a 12rem de respiro acima e abaixo de *cada* seção. O resultado é que a página não tem áreas abertas e áreas densas alternadas: **tem só áreas abertas.** Vazio uniforme é tão arrítmico quanto densidade uniforme — o olho não descansa porque nunca esteve tenso. A instrução de alternar conscientemente não está cumprida.

**Alterações realizadas.**
- **A sala verde desceu um degrau** (`sage-700` → gradiente `sage-800`→`sage-900`). Duas razões que apontam para o mesmo lado. Acessibilidade: sobre o verde antigo o texto secundário ficava em **4,28:1** e o terciário em **3,60:1** — reprovação de AA na única sala escura da fachada; agora são **6,04:1** e **4,91:1**. Direção de arte: um verde médio lê como *superfície colorida*; um verde profundo lê como *sala*. A profundidade veio do valor, não de sombra.
- Rodapé legível (§0).

**Coerente com a identidade?** Sim. A fachada agora entrega de fato o equilíbrio azul/verde que a narrativa cromática prometia: azul na marca, na navegação e nas ações; verde na sala escura por onde se passa.

**Fica documentado, não executado:** a compressão do ritmo (reduzir o respiro de 2–3 seções para criar contraste com as que devem respirar) mexe na sequência e na composição das seções — é decisão de conteúdo tanto quanto de arte, e a instrução manda documentar antes de executar.

> **Ressalva metodológica, para não induzir a erro.** A captura de página inteira da fachada mostra as seções centrais lavadas, quase sem conteúdo. **Isso é artefato da captura**, não defeito: o `ImmersiveBackdrop` é uma camada fixa que o Chromium repinta errado em `fullPage`. Verifiquei no viewport real — as sete seções têm texto íntegro e legível. Registro aqui porque a captura anexa induz à conclusão oposta.

---

## 2 · Recepção ("Sua História")

**Objetivo emocional:** *"Alguém está me ouvindo."*

**O que transmite hoje.** Este é o **ambiente mais bem resolvido da plataforma.** Uma pergunta por tela, em serifa, com um traço de progresso sem número. O campo de resposta é generoso e o texto de apoio remove a pressão em vez de adicioná-la ("Você pode deixar em branco se preferir"). A arquitetura da atenção está correta sem esforço: pergunta → campo → continuar.

**O que deveria transmitir.** Exatamente isso. O problema não estava na tela — estava **embaixo dela**.

**Alterações realizadas.** O rodapé institucional voltou a existir (§0). Antes, quem rolasse um pixel abaixo do "Continuar" encontrava um bloco navy com quatro linhas de texto invisível — o equivalente visual de uma sala em que a luz acaba no meio da conversa.

**Coerente com a identidade?** Sim.

**Fica documentado, não executado — e é a recomendação mais forte deste relatório:** **o rodapé de marketing não deveria estar na Recepção.** "Você não precisa decidir sozinho" + navegação + copyright é a voz da fachada, dirigida a quem ainda não entrou. A pessoa que está escrevendo por que procurou ajuda **já entrou** — repetir a promessa institucional ali é a casa se apresentando a quem já está sentado dentro dela. Remover exige mexer no `(public)/layout.tsx`, que hoje serve fachada e wizard com a mesma moldura: **é mudança estrutural, e por isso está aqui e não no código.**

---

## 3 · Casa da paciente

**Objetivo emocional:** *"Minha história está sendo construída."*

**O que transmite hoje.** Calma e continuidade. O cartão "Sua história continua aqui" faz o trabalho certo, e o segundo bloco explica a espera sem inventar urgência — *"Você pode fechar esta página com tranquilidade"* é a melhor frase de estado vazio da plataforma.

**O que deveria transmitir, e onde falhava.** A hierarquia estava **invertida no primeiro ponto de atenção**. O item ativo da navegação era um comprimido navy sólido — o objeto de maior contraste de toda a tela. Numa página cujo primeiro ponto de atenção deve ser *"Olá, Paciente Teste."*, o olho pousava primeiro num rótulo de navegação. **Navegação orienta; não anuncia.** Quem já está no cômodo não precisa que o cômodo se apresente em voz alta.

**Alterações realizadas.** O estado ativo passou a ser superfície do acento + texto do acento + peso — inequívoco, e sem virar o centro de gravidade. Aplicado às três moldura autenticadas (casa da paciente, portais, Administração). `aria-current` nunca dependeu de cor, então nada mudou para leitor de tela.

**Arquitetura da atenção, depois:** ① "Olá, Paciente Teste." ② "Sua história continua aqui." + o botão azul ③ o bloco de espera, com o fio lateral ④ **descanso:** a faixa de vazio antes do rodapé.

**Coerente com a identidade?** Sim — e é o ambiente onde a narrativa cromática se lê melhor: azul no que a Aliviar comunica, verde reservado ao que avançou.

---

## 4 · Curadoria

**Objetivo emocional:** *"Especialistas estão analisando meu caso."*

**O que transmite hoje.** Sobriedade correta e zero semáforo — a Mesa é, de fato, o melhor fundo da casa. A atmosfera verde chegou e distingue o ambiente sem trocar de produto.

**O que deveria transmitir, e onde falha.** Ambiente de decisão, não lista. A **composição está desequilibrada**: o conteúdo ocupa a metade esquerda e os ~45% da direita ficam vazios — e esse vazio não é silêncio projetado, é sobra. Silêncio visual é dimensionado; sobra é o que acontece quando ninguém decidiu a largura. Além disso, os dois blocos de estado vazio têm **peso idêntico**, então não há primeiro nem segundo ponto de atenção: são dois avisos empatados.

**Alterações realizadas.** Nenhuma além da atmosfera e da navegação. **Deliberado:** só consegui capturar a Curadoria em estado vazio (a Rede real não existe no ambiente local, conforme já registrado no projeto). Redesenhar densidade, agrupamento e destaque de uma Mesa que nunca vi **com um caso dentro** seria decidir sobre o que não observei — exatamente o erro que esta rodada existe para não cometer.

**Coerente com a identidade?** Sim, no que foi possível verificar.

**Pendente de observação, não de decisão:** a Mesa com um caso real. É o único ambiente cuja direção de arte permanece sem base empírica.

---

## 5 · Sala da Decisão

**Objetivo emocional:** *"Toda a jornada existe para este momento."*

**Não foi possível revisar, e não vou fingir que foi.** A Sala só existe quando há uma Curadoria entregue com três caminhos, e o ambiente local não tem Rede real para produzir esse estado. As dezenove capturas não contêm uma única imagem dela.

Este é o ambiente que o próprio prompt define como **o ponto visual mais forte da plataforma**. Revisá-lo a partir do código seria a única seção deste relatório sem lastro no que a pessoa vê — e seria a pior possível para se ter esse lastro.

**O que já está garantido por construção:** a atmosfera volta ao papel neutro (`.ambiente-decisao`), com azul e verde em equilíbrio exato, para que nada incline a decisão — nem a orientação da Aliviar, nem o caminho já percorrido. É a única sala que **abre mão** de cor de propósito.

**Para revisar de verdade, preciso de um caso com Curadoria entregue no ambiente local.** É o próximo passo mais valioso desta linha de trabalho.

---

## 6 · Concierge

**Objetivo emocional:** *"Continuamos com você."*

**O que transmite hoje.** Continuidade e leveza; a atmosfera azul chegou e a lista respira. O tom das ausências já é o certo — explicam em vez de acusar.

**Alterações realizadas.** Atmosfera do ambiente e navegação. Nada mais: como na Curadoria, o que capturei foi a varanda vazia.

**Coerente com a identidade?** Sim.

---

## 7 · Administração

**Objetivo emocional:** *"Tenho tudo sob controle."*

**O que transmitia.** O oposto. A Visão geral abria com **doze indicadores idênticos**, cada um com um `0` em serifa grande e escura, seguidos de **seis cartões de gráfico** dizendo "Ainda não há dados neste período". Dezoito caixas de nada, todas com o mesmo peso.

O problema não era a ausência de dados — uma operação em repouso tem zeros mesmo, e escondê-los seria pior. O problema era a **hierarquia invertida**: numa tela cuja primeira seção se chama literalmente *"Onde agir agora"*, o dado mais vazio da operação era o objeto mais pesado da tela. O olho percorria doze ausências antes de encontrar qualquer coisa que exigisse ação. Isso não comunica controle — comunica um sistema quebrado.

**Alterações realizadas.** O zero recuou de peso: passa a tinta suave, corpo menor, peso regular. **Continua inteiro e legível** — a operação precisa saber que é zero, e esconder ausência é como se fabrica um dado que ninguém confere. Ele só deixou de gritar. Números com valor mantêm o corpo e a cor cheios; os que pedem ação mantêm o dourado de atenção. Aplicado ao `StatCard` da Visão geral e ao `KpiCard` do CRM.

**Arquitetura da atenção, depois:** ① "Olá, Admin Teste" ② a linha de indicadores **com** valor (quando houver) ③ Pendências / Atividade recente ④ descanso: as faixas entre grupos.

**Coerente com a identidade?** Sim. A densidade operacional permanece — é a fronteira que os documentos congelados mandam preservar —, mas deixou de ser densidade *uniforme*.

**Fica documentado, não executado:** "Atividade recente" repete oito vezes "Sistema revogou / Admin Teste concedeu o papel Paciente" com o mesmo horário. É ruído de seed, mas revela que a lista não agrupa eventos idênticos consecutivos — em operação real vai ler como log, não como memória. Agrupar é mudança de conteúdo, não de arte.

---

## 8 · Direção de arte — os eixos transversais

**Composição.** O ganho estrutural desta rodada foi remover o **falso primeiro ponto de atenção** que existia em toda superfície autenticada (o comprimido escuro da navegação). Pendente: a Curadoria, cujo conteúdo ocupa metade da largura disponível.

**Ritmo.** A plataforma tem dois problemas opostos e nenhum ponto de equilíbrio: a **fachada é uniformemente vazia** (0,4 caractere por pixel de altura) e a **Administração era uniformemente densa**. A Administração já foi tratada por hierarquia; a fachada exige recomposição de seções e está documentada.

**Profundidade.** Melhorou onde foi tratada por **valor**, não por sombra: a sala verde da fachada desceu dois degraus e passou a ler como ambiente; a casa da paciente tem quatro degraus reais de superfície (ambiente → recuado → papel → elevado). A regra da rodada anterior segue valendo — só o transitório se eleva.

**Tipografia — revisão ampla identificada, DOCUMENTADA e não executada**, conforme instrução explícita:
- **83 ocorrências de caixa-alta com tracking em 42 arquivos.** Violam a F2 §6.2 ("nada em caixa alta além de siglas") e aparecem no pior lugar possível: `SUA JORNADA` é **o primeiro texto** da casa da paciente, e `NAVEGAÇÃO`/`CURADORIA · COA` repetem o padrão nos fundos. Caixa alta reduz legibilidade justamente de quem lê sob estresse.
- **Recomendação:** substituir por versalete óptico (mesmo tamanho, caixa normal, peso 500, tracking reduzido de 0,16em para 0,04em) — mantém a função de rótulo sem o grito. É uma varredura de 42 arquivos com regressão visual ampla: merece uma rodada própria, com capturas antes/depois, não um apêndice desta.

**Componentes.** A unidade visual veio da rodada anterior (tokens únicos). Esta rodada acrescentou o vocabulário que faltava para **superfícies escuras** — a única família de componentes que não tinha linguagem própria e por isso improvisava, com o resultado do §0.

**Motion — oportunidades mapeadas, nada implementado:**
| Momento | Oportunidade | Por quê |
|---|---|---|
| Troca de ambiente | travessia de 480ms já orçada, ainda não usada como travessia | é o que faz o cômodo ser percebido como cômodo |
| Autosave da Recepção | confirmação que assenta e some, sem ícone de sucesso | a pessoa precisa saber que não perdeu o que escreveu |
| Revelação de detalhe | expandir **no lugar**, 240ms | abrir por cima é modal, e modal é interrupção |
| Espera | permanece em palavras | R16' — progresso de jornada ≠ espera de sistema |

**Regra da respiração.** Cumprida em todos os ambientes capturados: nenhuma tela chega ao rodapé preenchida. A ressalva é qualitativa e já registrada — na fachada o vazio é excessivo e não alternado; na Curadoria é lateral e não projetado.

---

## 9 · Validação da identidade única

- **Cor computada no navegador**, mesmo `bg-accent` por ambiente: Fachada/Paciente/Decisão/Concierge/Administração `rgb(18,59,103)`; Curadoria `rgb(85,107,93)`. Um componente, seis atmosferas, zero código por cômodo.
- **`tests/unit/paleta-unica.test.ts`** — 11 guardas verdes: âncoras da ADR-017, nenhuma folha de ambiente redeclarando token ou carregando cor literal, nenhum componente lendo a camada interna, nenhuma família `success`/`danger` nascendo.
- **Suítes:** 1.694 unitários · 400 de componente · 1 golden · `tsc` limpo · build de produção compilando 53 páginas.
- **Nenhuma regra de negócio, API, banco, fluxo de Curadoria, comportamento ou arquitetura foi alterada.**

---

## 10 · O que fica em aberto, nomeado

1. **Sala da Decisão** — nunca observada. Exige um caso com Curadoria entregue no ambiente local. É a lacuna mais importante.
2. **Mesa do Curador com caso real** — a densidade e o agrupamento não foram revisados sobre conteúdo verdadeiro.
3. **Caixa-alta transversal** — 83 ocorrências, rodada própria.
4. **Rodapé de marketing dentro da Recepção** — remoção exige mexer em `(public)/layout.tsx`; estrutural.
5. **Ritmo da fachada** — recomposição de seções; decisão de conteúdo tanto quanto de arte.
6. **Agrupamento de eventos idênticos** em "Atividade recente".

---

> **A interface não precisa ser bonita; precisa sair da frente.** Nesta rodada, o que mais atrapalhava não era feio — era invisível: quatro blocos de texto que a pessoa simplesmente não conseguia ler, e um rótulo de navegação que roubava o primeiro olhar de quem tinha uma história para contar.
