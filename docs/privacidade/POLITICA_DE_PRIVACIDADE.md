# Política de Privacidade — Aliviar Curadoria Médica

> **Estado: pronta para revisão jurídica, não publicada.** Escrita a partir do
> que o sistema faz de verdade — código e banco verificados em 31/08/2026.
> Enquanto não for revisada e publicada em `legal_documents`, a página
> `/privacidade` continua dizendo, corretamente, que o documento não existe.
>
> **Sucede o `POLITICA_DE_PRIVACIDADE_RASCUNHO.md` (19/08)**, que fica como
> registro. As mudanças estão listadas no fim, em *O que mudou desde o
> rascunho*.
>
> O que está entre `[colchetes]` depende de decisão do Fundador ou do
> advogado, e está reunido no fim.

**Versão:** 1.1 · **Data:** 2026-08-31

---

## Quem somos

A Aliviar Curadoria Médica é um serviço operado por **Aliviar Conecta Serviços
de Assessoria e Gestão Ltda**, CNPJ 63.841.181/0001-07, com sede na
R. Severino Eleutério, 158, Centro, Areial/PB, CEP 58.140-000.

Você conhece o serviço como **Aliviar Curadoria Médica**. É a mesma empresa — a
marca e a razão social são diferentes, e é isso que este parágrafo existe para
dizer.

**Encarregado pelo tratamento de dados:** Caio Padilha
**Fale com ele:** `[e-mail — ver decisão 1 no fim]`

Esse é o canal para qualquer coisa deste documento: saber o que temos sobre
você, pedir correção, pedir exclusão, ou reclamar.

---

## O que fazemos com os seus dados, em uma frase

Guardamos o que você nos conta para encontrar profissionais que respondam ao que
**você** disse que importa, e para acompanhar seu caso até a consulta. Não
vendemos, não alugamos e não usamos seus dados para publicidade.

---

## Duas pessoas, e só duas

Esta é a parte que a maioria das políticas não consegue dizer, e a Aliviar
consegue: **duas pessoas da nossa equipe conhecem a sua história.**

- **O seu supervisor** — quem te atendeu no primeiro dia e acompanha você até o
  fim.
- **O seu curador** — que é médico, e é quem estuda o seu caso.

Numa clínica você fala com recepção, enfermagem, médico e faturamento: quatro
pessoas, cada uma sabendo um pedaço. Aqui são duas, e as duas conhecem o caso
inteiro — o que significa que você **não repete sua história para ninguém**.

**No primeiro contato ninguém pergunta nada de saúde.** O supervisor registra
só como te procurar e o que você veio buscar em uma frase. A sua história é
contada uma vez, ao curador, na conversa própria para isso.

**Se o supervisor for assistir a essa conversa, você é perguntado antes** — e
pode dizer que prefere sem, sem precisar explicar por quê. Se mudar de ideia no
meio, ele sai.

---

## O que coletamos, e quando

### Quando você pede atendimento pelo site

Nome, e-mail ou telefone, e se a busca é para você ou para outra pessoa.
**Nada de saúde nessa página** — está escrito nela, e é verdade no sistema.

### Quando o seu caso começa

Aí sim: a sua história nas suas palavras, o que você já tentou, o que não pode
faltar num médico para você, restrições, e os documentos que você escolher
enviar (exames, laudos, relatórios).

**Isso inclui dados de saúde**, que a lei chama de sensíveis e protege mais. É
por isso que a coleta acontece numa conversa com um médico, e não num
formulário.

### Enquanto o caso corre

Registro das conversas com você (data e o que ficou combinado), o Perfil que a
Curadoria montou e você confirmou, os caminhos apresentados, e a sua decisão.

---

## O que NÃO medimos

Ferramentas de medição de audiência (analytics) rodam **apenas** nas páginas
públicas: a página inicial, o pedido de atendimento, e as próprias páginas
legais.

**A sua área não é medida.** Nem o portal do curador, nem a administração, nem
as telas em que você conta sua história. A razão é direta: a página que alguém
visita depois de já ser assistido é indício da condição de saúde dela, e isso
não se coleta por conveniência de métrica.

Isso não é intenção — é regra no código, escrita como **lista de permissão**:
uma página só é medida se alguém a escrever nessa lista de propósito. **O padrão
é não medir.**

---

## Por que tratamos cada coisa

| O que | Por quê |
|---|---|
| Contato (nome, e-mail, telefone) | Para procurar você — é o que você pediu ao preencher |
| Sua história e seus documentos | Para executar o serviço que você contratou: entender o caso e encontrar caminhos |
| Dados de saúde | **Com o seu consentimento específico e destacado**, dado à parte do contrato |
| Registro das conversas | Para que ninguém da equipe precise te perguntar duas vezes a mesma coisa |
| Documentos assinados | Para provar, anos depois, o que você leu e concordou |

---

## Quem consegue ver

Isso não é promessa: é regra no banco de dados, que recusa o acesso de quem não
está na lista, mesmo para quem já entrou no sistema.

- **As duas pessoas do seu caso** — o supervisor e o curador — e a
  administração, para o que for estritamente operacional.
- **Você**, na sua própria área.

**Ninguém mais.** Os profissionais da Rede **não** acessam seus dados: eles não
veem sua história, seus documentos, nem sabem que você existe até que você
decida procurá-los.

Documentos e exames ficam em armazenamento privado. **Nenhum arquivo seu tem
endereço público na internet.**

### Quando compartilhamos com alguém de fora

Só em duas situações, e as duas dependem de você:

1. **Com operadora de plano de saúde, ouvidoria ou ANS**, quando você nos
   autoriza a representar você numa questão administrativa. Isso exige uma
   procuração assinada por você, para aquele fim.
2. **Quando a lei obriga** — ordem judicial ou requisição de autoridade
   competente.

Fora disso, não compartilhamos com ninguém.

---

## Onde seus dados ficam

O banco de dados e os arquivos ficam em servidores da **Supabase**, na região
**São Paulo, Brasil** (`sa-east-1`) — **seus dados de saúde não saem do país.**

A aplicação roda na **Vercel**, que processa as requisições do site.

Essas duas empresas processam dados por nossa conta e não podem usá-los para
outra finalidade.

---

## Por quanto tempo guardamos

**Hoje, não excluímos nada automaticamente.** É importante que você saiba disso
com todas as letras, em vez de ler um prazo que não cumprimos.

Se você quiser que apaguemos seus dados, escreva para o encarregado ou abra o
pedido na sua área. **O pedido é atendido por uma pessoa, não por um sistema.**

`[Prazo de retenção após o fim da relação: ver decisão 2 no fim.]`

---

## Seus direitos

A lei te dá o direito de saber o que temos sobre você, corrigir o que está
errado, pedir cópia, pedir exclusão, saber com quem compartilhamos, e retirar
seu consentimento.

**Como exercer:** na sua área, em **Documentos e consentimentos**, você abre um
pedido — de acesso, correção, exclusão, portabilidade ou revogação — e acompanha
o andamento ali mesmo. Se preferir, escreva para o encarregado.

**Prazo de resposta:** `[15 dias corridos — ver decisão 3 no fim.]`

Quem executa o pedido é uma pessoa da equipe, não um automatismo — por isso ele
tem um andamento a acompanhar, e não um resultado imediato.

**Retirar o consentimento interrompe o serviço daí em diante:** sem as
informações do seu caso, não há Curadoria a fazer. Não apaga, sozinho, o que já
aconteceu.

---

## Quando o pedido é para outra pessoa

Nosso formulário permite pedir atendimento **para outra pessoa** — um pai, um
filho, alguém que não está podendo fazer isso sozinho.

Nesse caso, os dados que chegam até nós são dessa pessoa, e não de quem
preencheu. Nós a tratamos como titular: **os direitos deste documento são
dela.**

`[Como validamos a autorização de quem preenche: ver decisão 4 no fim.]`

---

## Mudanças nesta política

Cada versão fica registrada com data de vigência e endereço permanente. Se
mudarmos algo relevante, a versão anterior continua consultável — **você
consegue ver a que concordou.**

---

# O que falta decidir

Quatro pontos, e três deles são do Fundador, não do advogado.

**1 · O e-mail do encarregado.** O inventário traz
`padilhacaiobarbosa@gmail.com`. **Recomendo `privacidade@` no domínio próprio**
quando ele existir: um canal de exercício de direitos de uma empresa de dados de
saúde apontando para um Gmail pessoal não é ilegal, mas é frágil — some com a
pessoa, não sobrevive a uma troca de responsável, e comunica amadorismo na
página que existe para gerar confiança. **Decide: o Fundador.**

**2 · Prazo de retenção após o fim da relação.** Hoje não há prazo e o documento
diz isso honestamente. Definir um exige saber por quanto tempo os documentos
precisam ser guardados para defesa em processo — **decide: o advogado** (é o
item E8 do documento de pendências).

**3 · Prazo de resposta ao titular.** Proposta: **15 dias corridos**, para
todos os direitos. É o prazo que a LGPD fixa para confirmação e acesso (art. 19,
II); aplicá-lo aos demais é a prática de mercado e evita a tela ter de explicar
por que um pedido tem prazo e outro não. **Confirma: o advogado** (item D-8).

**4 · Validação de quem pede por outra pessoa.** O sistema hoje aceita o pedido
e trata a outra pessoa como titular, mas não valida a autorização de quem
preencheu. **Decide: o advogado** (item D-7) — e a recomendação de produto é
atender, na versão 1, apenas titulares maiores e capazes assinando por si,
tratando os demais casos fora do sistema e **registrando que houve
representação**.

---

# O que mudou desde o rascunho de 19/08

**Seção nova: "Duas pessoas, e só duas".** É a consequência da ADR-106 e é o
melhor argumento de privacidade que a Aliviar tem — não estava dito a ela em
lugar nenhum. Inclui a regra da ADR-100 (o primeiro contato não pergunta nada de
saúde) e a da ADR-103 (você é perguntado antes de o supervisor assistir).

**Seção nova: "O que NÃO medimos".** Em 27/08 o analytics saiu de todas as
rotas privadas — antes ele vivia no layout raiz e media `/paciente/*`, `/coa/*`
e o wizard da história. É fato verificável em produção, e a política agora o
declara, incluindo o desenho por **lista de permissão** (o padrão é não medir).

**Seção nova: "Quando compartilhamos com alguém de fora".** O rascunho dizia
"ninguém mais" e parava aí. Faltavam as duas exceções reais: a representação
perante operadora/ANS (que exige procuração) e a obrigação legal.

**Corrigido: "Quem consegue ver"** dizia *"administração, atendimento,
concierge e o Curador"* — o modelo de papéis anterior às ADR-100 a 106.

**Removido um colchete:** a região da Vercel. Não há `vercel.json` fixando
região, então afirmar uma seria inventar; o texto passa a dizer o que é
verdade — que a Vercel processa as requisições do site.

**Preenchido:** o prazo de resposta ao titular, como proposta fundamentada em
vez de lacuna.
