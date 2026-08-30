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

---

## 2 · O que mudou de regra nesta sessão

A **ADR-100** redefiniu um papel: o **Atendente deixou de ser recepção e virou o
Supervisor do processo**. O primeiro contato já é com ele, e ele não desaparece
no repasse — acompanha até o encerramento. O Curador continua conduzindo a
Consulta Inicial.

Três regras entraram junto, e elas não são detalhe:

1. **O Supervisor não colhe história clínica no primeiro contato.** Ela é do
   Curador, com a Ficha. Um resumo clínico escrito antes chegaria ao Curador
   como versão pronta, e ele passaria a conferir uma história em vez de ouvi-la.
2. **Preço fixo, sem comissão por conversão** — promovida a decisão própria na
   **ADR-101**, porque é política comercial e não corolário de um papel. Com o
   papel unificado, quem comunica o preço é quem depois acompanha a decisão. O
   conflito não está em quem diz o número — está em quem ganha com a resposta.
3. **Depois que o Curador assume, o Supervisor nunca opina sobre qual dos três
   caminhos.** Esta só apareceu ao editar o guia, e é a que protege o produto:
   antes, quem convenceu ia embora; agora fica na sala.

**A ADR-073 segue em vigor**, e foi atravessada duas vezes nesta sessão a
pedido explícito do Fundador (a cena nova em `/solicitar-atendimento`). Dito em
voz alta antes e registrado no commit, que é o padrão a manter.

---

## 3 · O estado real, em uma frase

**Continua sendo a operação, não o código** — e agora com uma evidência a mais:
a Landing foi revisada inteira nesta sessão, medida em notebook e celular, e
não tinha nada para consertar.

---

## 4 · Decisões que estão com o Fundador

| O quê | Situação em 28/08 |
| --- | --- |
| **Entrada e parcelas** | **Subiu de prioridade com a ADR-101.** O preço JÁ está definido — **R$ 450 pelo ano**, no roteiro — e agora é **fixo, sem desconto na conversa**. Isso torna o parcelamento a **única** saída para quem disser que não cabe: deixou de ser pendência menor e virou bloqueador de operação. Em branco só a entrada e o número de parcelas. |
| **Quem é a primeira pessoa** | A ADR-096 só se sustenta se for alguém de dentro. **Decidida ela, o Case sai por consequência** — e o `61da4e7e`, herdado de julho, para de ser pergunta. É dado de produção; o repositório não sabe de quem ele é. |
| **Quem conduz** | Curador, Supervisor e Concierge com nome, antes do dia. E um observador que não trabalhe. |
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

**A ADR-100 e a sua chegada aos documentos** (`e032b63`, `3a96e01`) — Correção
de Domínio emendada, o aviso do `/admin/equipe` corrigido, o rótulo de tela
virando "Supervisor" em oito mapas, e os dois guias reescritos.

**`SIM-62`** — a suíte E2E cobrava texto de tela que não existe mais, e ninguém
via porque E2E não roda no ambiente local. Quatro pontos corrigidos.
**Fica ABERTO** um segundo grupo, anterior e independente:
`admin-dashboard.spec.ts` exige cinco indicadores removidos de propósito em
24/08 — consertá-lo é reescrever o teste, não trocar uma palavra.

---

## 6 · As lições desta sessão

**1 · O viés do instrumento apareceu três vezes, e quase virou defeito
reportado.** A inércia do Motor da Caminhada faz a tela ficar atrás do
`scrollY`: capturas pegaram os cartões em branco e o rodapé vazio, e o DOM
dizia opacidade 1 nas duas vezes. **Nesta página, espere 3 segundos antes de
capturar** — e confira o `scrollY` antes de concluir qualquer coisa sobre
posição. É o `SIM-57` de novo, com outro instrumento.

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
- **Os PDFs de `docs/guias/pdf` são ignorados pelo Git**; os de `docs/rede/` e
  `public/rede/` são versionados e têm gerador.
- Rodam aqui: `typecheck`, `test` (2.656), `test:components` (624),
  `npx eslint <arquivos>`. Não rodam: `lint`, `build`, integração e E2E.

---

## 8 · O trabalho aberto, em ordem de valor

1. **Marcar o Ensaio Geral.** Não rodá-lo — **marcá-lo.** Ele está escrito e
   completo em `docs/rede/ensaio/`, foi marcado pela ADR-076 para 22–23/08 e
   **não aconteceu**: não existe Diário de Observação em lugar nenhum do
   repositório. Não depende de nenhuma decisão pendente — ninguém paga, os três
   médicos são fictícios em papel, nada entra no sistema. Entrega o número que
   ninguém tem: o tempo de relógio dos ~50 atos de juízo do Curador.
2. **Quem é a primeira pessoa** — a decisão que destrava mais coisa e que o
   Fundador toma sozinho.
3. **A entrada e as parcelas.** Com a **ADR-101** o preço virou fixo e sem
   desconto na conversa, então o parcelamento é a única resposta possível a
   "não cabe no meu bolso". Sem os dois números, o Roteiro do Supervisor não
   pode ser usado numa ligação real — e o aviso dentro dele proíbe improvisar.
4. **`SIM-62` grupo (b)** — `admin-dashboard.spec.ts` vermelho desde 24/08.
5. **`SIM-60`** — o gate de aceite, mina registrada, não pedido de obra.
6. **`PRIV-04`** — a exclusão não alcança o storage. P0, depende da D-08.

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
