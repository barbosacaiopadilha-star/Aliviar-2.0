# Onde retomar — fechamento da sessão de 2026-08-27

> Documento de handoff. Escrito para que uma sessão nova continue o trabalho
> sem reconstruir contexto e **sem repetir os erros que esta sessão cometeu**.
> Não é canônico: o canônico é `docs/AGENTS.md`, `docs/DECISIONS.md` e
> `docs/REGISTRO_UNICO_DE_ACHADOS.md`.

---

## 1 · Antes de qualquer coisa

**O repositório não está no diretório de trabalho primário.** O primário
(`C:\Users\barbo\Projects\aliviar-conexao`) está **vazio**. O repositório real
vive em:

```
C:\Users\barbo\OneDrive\Desktop\PROJETOS DO CLAUDE\aliviar
```

Todo comando de leitura, teste ou git roda de lá.

**Leia `docs/AGENTS.md` integralmente antes de alterar qualquer coisa** — é o
que o `CLAUDE.md` manda, e ele contém o fluxo obrigatório de oito etapas.

---

## 2 · O que está em vigor, e não pode ser contornado em silêncio

**A ADR-073 congela construção nova** até a primeira Curadoria real acontecer
de ponta a ponta. Permitido: corrigir defeito visto no uso real, e o que a lei
exigir. O `CLAUDE.md` obriga a **avisar o Fundador** quando algo esbarrar
nela, em vez de contornar.

Nesta sessão a ADR-073 foi atravessada várias vezes **a pedido explícito do
Fundador** — a Landing, o cabeçalho, a porta de acesso. Cada vez isso foi dito
em voz alta antes e registrado no commit. É o padrão a manter: não se recusa,
mas também não se finge que a regra não existe.

---

## 3 · O estado real do projeto, em uma frase

**O código não é mais o gargalo — a operação é.** Três profissionais reais
publicados em produção com Mapa completo, Motor alimentado, guias escritos,
privacidade decidida. O que falta é a **primeira Curadoria real acontecer**.

---

## 4 · Decisões que estão com o Fundador

| O quê | Por que trava |
| --- | --- |
| **Entrada e parcelas** do pagamento | O roteiro do Atendente (`docs/guias/6-*.html`) tem `[entrada de R$ ___ e ___ parcelas de R$ ___]` em branco, com aviso proibindo improvisar na ligação. Sem isso ele não pode ser usado. |
| **Qual Case** na primeira Curadoria | O runbook aponta `61da4e7e` desde julho. **Conferir de quem é**: se for pessoa de fora, contradiz a ADR-096, que decidiu paciente interna. |
| **Quem conduz** | Curador, Atendente e Concierge com nome, antes do dia. E **um observador que não trabalhe** — sem ele a sessão acontece e a observação não. |
| **Onde a jornada para** | Os três profissionais da Rede são reais. Se a jornada rodar até o fim, um médico de verdade recebe contato sobre um caso de ensaio. Decidir **antes**. |
| **ADR-095** — tamanho da Mesa | Proposta pronta, recomendação de esperar o uso real. |
| **Domínio próprio** | O site é `aliviar-2-0.vercel.app`. Para quem avalia confiar uma decisão de saúde, endereço de hospedagem lê como provisório. É a credibilidade mais barata por real gasto. |
| **"Quem somos"** | Não existe **uma linha** sobre quem está por trás, em lugar nenhum. É a maior lacuna de confiança, e é escrita — não código. |

---

## 5 · O que esta sessão entregou

**Defeitos reais corrigidos, medidos e provados em produção:**

- **PRIV-02 / ADR-056 item 2** — o `<Analytics/>` vivia no layout raiz e
  rastreava `/paciente/*`, `/coa/*` e o wizard de `/sua-historia`. Decisão de
  02/08, executada só agora. Provado por requisições de rede: `/` mede,
  `/login` e `/sua-historia` não.
- **SIM-61** — o texto da Landing sumia sobre a fotografia. O cartão de vidro
  não tinha **piso**: onde a cristalização não disparava, a letra ficava sobre
  a foto crua. Medido: contraste médio 3,62 onde o mínimo é 4,5.

**Decisões registradas:** ADR-096 (adiamento da privacidade, assinado), ADR-097
(vocabulário "assistido"), ADR-098 (vidro no cabeçalho), ADR-099 (a casa
escura — **revertida no mesmo dia**, com o motivo dentro dela).

**Guias:** de cinco para dez. Os três novos são de **conversa**, não de
sistema: roteiro de atendimento (com o preço e oito objeções), roteiro do
Curador, roteiro do Concierge. Mais dois materiais para o assistido — antes
não existia **nenhum** documento escrito *para* a pessoa, só sobre ela.

**Fachada:** "três caminhos" no lugar de "três médicos", "nenhum médico paga
para aparecer aqui", cápsula de vidro no cabeçalho, a página `/o-que-e`, e
Privacidade e Termos saindo da orfandade no rodapé.

**Porta de acesso:** cena do terraço ao entardecer + cartão de vidro fosco.

---

## 6 · As lições que custaram tempo — leia antes de mexer no visual

**1 · Vidro só se vê contra fundo que tenha o que mostrar.** Isto apareceu
medido **três vezes**: cabeçalho sobre teto claro, cartão sobre parede clara, e
a referência do Fundador funcionando porque o fundo dela é folhagem escura. A
transparência pode estar tecnicamente correta e visualmente inexistente.

**2 · "Escovado" vem do desfoque, não da opacidade.** Baixar a tinta para
ganhar transparência é a alavanca errada — é a que custa legibilidade. O
borrão forte **melhora** a leitura, porque dissolve as manchas escuras da
foto. Medido: `blur(32px)` com metade da opacidade entrega o mesmo pior ponto.

**3 · Contraste não é clima.** A casa escura media melhor (pior ponto de 1,66
para 4,53) e o Fundador recusou assim que viu. Nenhum número diz se quatro
cenas escuras acolhem ou pesam.

**4 · Véu não substitui fotografia.** A porta de acesso funcionou com uma
**foto** de entardecer; a Landing falhou com um **véu** sobre foto diurna. Véu
tira luz; não põe a luz que uma cena noturna tem.

**5 · A casa tem guardas, e elas acertam mais que o palpite.** Nesta sessão
elas barraram, corretamente: o blur no cabeçalho (*"só um blurzinho no
header"* — o teste nomeia a tentação), a palavra "selo" (promete certificação),
cor literal `#000` (a paleta única não admite), e um rótulo inventado onde o
CTA canônico já resolvia. **Leia a guarda antes de alterá-la.**

**6 · Medir contra o alvo certo.** Uma medição de contraste comparou o texto
com o fundo do `body` em vez da fotografia, e deu "zero reprovações" quando
havia defeito. Se o número parecer bom demais, confira o que ele mediu.

---

## 7 · Fatos operacionais

- **`push` para `main` dispara deploy em produção** (integração git da Vercel).
  Vale inclusive para commit só de documentação. Convém acumular e publicar em
  lote.
- **O agente não consegue empurrar nem tocar em produção:** o classificador de
  permissões bloqueia `push`, SQL em produção e a edição das próprias
  permissões. É por desenho. O Fundador executa.
- **Conferência pós-deploy:** `/api/build-info` devolve o commit publicado —
  use para confirmar que o que está no ar é o que se acha que está. Foi fonte
  de confusão várias vezes nesta sessão.
- **Ambiente local incompleto:** não há `.env.local` nem Docker, então
  `npm run lint`, `build` e os testes de integração/E2E **não rodam aqui**.
  Rodam: `npm run typecheck`, `npm run test` (2.656), `npm run test:components`
  (624), e `npx eslint <arquivos>` direto.
- **Fim de linha CRLF:** scripts Node que casam blocos multilinha falham. Use a
  ferramenta de edição, ou trabalhe por linhas.
- **Imagens:** `sharp` está disponível, mas só resolve rodando de **dentro** do
  projeto. As cenas vivem em `public/landing/v2/` — `-desktop` 1672×941 e
  `-mobile` 852×1846, WebP mais JPEG.

---

## 8 · O trabalho aberto, em ordem de valor

1. **A primeira Curadoria real.** Tudo espera isso. O runbook é
   `docs/OPERACAO_PRIMEIRA_CURADORIA.md`, com o pré-voo reverificado em 27/08.
2. **Os números do parcelamento**, para o roteiro do Atendente poder sair.
3. **As quatro cenas ao entardecer** — se o Fundador ainda quiser a casa
   escura. **Fica registrado que o caminho testado falhou:** o gerador de
   imagem reimagina a sala em vez de editá-la, e devolveu um cômodo diferente.
   A tentativa está em `chatgpt.com`, conversa "Recepção ao entardecer". Um
   segundo pedido, com restrição dura ("é edição, não imagem nova; mantenha as
   molduras, o ripado, o logotipo, as três pessoas"), pareceu ir melhor — não
   chegou a ser avaliado.
4. **`SIM-60`** — o gate de aceite é código morto apontando para `/aceites`,
   que não existe. Inócuo hoje; **arma-se sozinho no dia em que a política for
   publicada**.
5. **`PRIV-04`** — a exclusão não alcança o storage. P0 real, depende da D-08,
   não trava a primeira Curadoria.
6. **Pendência menor:** o PDF `/rede/Ficha-da-Paciente-Curadoria-Aliviar.pdf`
   teve o rótulo trocado para "Ficha do Assistido", mas o **arquivo** continua
   com o nome antigo.

---

## 9 · Como o Fundador trabalha, e o que funcionou

Ele responde em mensagens curtas e decide rápido. **Ele vê na tela o que
nenhuma medição pega** — foi assim que o texto sumindo sobre a foto, o livro
que virava retângulo, o nome da marca duplicado e a casa escura foram pegos.

O que funcionou: **construir, publicar, olhar, corrigir** — em voltas curtas.
O que não funcionou: argumentar por escrito sobre estética. Três vezes seguidas
a tela desempatou uma discussão que o texto não resolvia.

E quando ele insiste depois de um "está tudo bem", **ele costuma estar certo.**
