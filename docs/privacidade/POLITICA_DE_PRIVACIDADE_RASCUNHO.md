# Política de Privacidade — RASCUNHO PARA REVISÃO JURÍDICA

> **Este documento ainda não vale.** É um rascunho escrito a partir do que o
> sistema faz de verdade (código e banco verificados em 2026-08-19), para o
> advogado revisar antes de qualquer publicação. Enquanto não for revisado e
> publicado em `legal_documents`, a página pública continua dizendo,
> corretamente, que o documento não existe.
>
> O que está entre `[colchetes]` são fatos que eu não pude verificar sozinho.
> O que precisa de decisão jurídica está reunido no fim, na seção **Para o
> advogado**.

**Versão:** 1.0-rascunho · **Data:** 2026-08-19

---

## Quem somos

A Aliviar Curadoria Médica é um serviço operado por **Aliviar Conecta
Serviços de Assessoria e Gestão Ltda**, CNPJ 63.841.181/0001-07, com sede na
R. Severino Eleutério, 158, Centro, Areial/PB, CEP 58.140-000.

Você conhece o serviço como **Aliviar Curadoria Médica**. É a mesma empresa —
a marca e a razão social são diferentes, e é isso que este parágrafo existe
para dizer.

**Encarregado pelo tratamento de dados:** Caio Padilha
**Fale com ele:** `[e-mail a confirmar]`

Esse é o canal para qualquer coisa deste documento: saber o que temos sobre
você, pedir correção, pedir exclusão, ou reclamar.

---

## O que fazemos com os seus dados, em uma frase

Guardamos o que você nos conta para encontrar profissionais que respondam ao
que **você** disse que importa, e para acompanhar seu caso até a consulta. Não
vendemos, não alugamos e não usamos seus dados para publicidade.

---

## O que coletamos, e quando

### Quando você pede atendimento pelo site

Nome, e-mail, telefone, e se o pedido é para você ou para outra pessoa.

Nada além disso. Não pedimos CPF, endereço nem qualquer informação de saúde
nesse primeiro contato.

### Quando seu caso começa

Se você segue para a Curadoria, passamos a registrar:

- **cidade e estado**, para encontrar quem atende onde você está;
- **o que você nos conta sobre o seu caso** — diagnóstico ou hipótese, exames,
  tratamentos já feitos, o contexto e as limitações que você descreve;
- **documentos que você envia** — laudos, exames, relatórios;
- **o que você diz que importa mais** para você no cuidado, e a sua decisão
  sobre qual caminho seguir.

**Isso inclui dados de saúde**, que a lei brasileira trata como sensíveis e
protege de forma mais rigorosa. É por isso que este parágrafo está em
destaque: você precisa saber exatamente o que está entregando, e a nós cabe
pedir seu consentimento de forma específica para esses dados — não escondido
num aceite genérico.

---

## Por que tratamos cada coisa

| O que | Para quê | Base legal |
|---|---|---|
| Nome, e-mail, telefone | Responder ao seu pedido e falar com você | `[a definir]` |
| Cidade e estado | Encontrar profissionais que atendam onde você está | `[a definir]` |
| Informações sobre seu caso e documentos | Montar a Curadoria — comparar sua necessidade com a prática de cada profissional | `[a definir — dado sensível, art. 11]` |
| Registro do seu consentimento | Provar que você foi informada e concordou | `[a definir]` |

---

## Quem consegue ver

Isso não é promessa: é regra no banco de dados, que recusa o acesso de quem
não está na lista, mesmo para quem já entrou no sistema.

- **A equipe da Aliviar** — administração, atendimento, concierge e o Curador
  responsável pelo seu caso.
- **Você**, na sua própria área.

**Ninguém mais.** Os profissionais da Rede **não** acessam seus dados: eles
não veem sua história, seus documentos, nem sabem que você existe até que
você decida procurá-los.

Documentos e exames ficam em armazenamento privado. Nenhum arquivo seu tem
endereço público na internet.

---

## Onde seus dados ficam

O banco de dados e os arquivos ficam em servidores da **Supabase**, na região
**São Paulo, Brasil** (`sa-east-1`) — seus dados de saúde não saem do país.

A aplicação roda na **Vercel** `[região de processamento a confirmar no
painel]`.

Essas duas empresas processam dados por nossa conta e não podem usá-los para
outra finalidade.

---

## Por quanto tempo guardamos

**Hoje, não excluímos nada automaticamente.** É importante que você saiba
disso com todas as letras, em vez de ler um prazo que não cumprimos.

Se você quiser que apaguemos seus dados, escreva para o encarregado. O pedido
é atendido por pessoa, não por sistema — e por isso pode levar alguns dias.

`[Prazo de retenção e política de descarte: a definir — ver seção "Para o
advogado", item 2.]`

---

## Seus direitos

A lei te dá o direito de saber o que temos sobre você, corrigir o que está
errado, pedir cópia, pedir exclusão, saber com quem compartilhamos, e retirar
seu consentimento.

**Como exercer:** na sua área, em **Documentos e consentimentos**, você abre um
pedido — de acesso, correção, exclusão, portabilidade ou revogação — e acompanha
o andamento dele ali mesmo. Se preferir, escreva para o encarregado no e-mail
acima.

Quem executa o pedido é uma pessoa da equipe, não um automatismo — por isso ele
tem um andamento a acompanhar, e não um resultado imediato.

Retirar o consentimento interrompe o serviço daí em diante: sem as
informações do seu caso, não há Curadoria a fazer. Não apaga, sozinho, o que
já aconteceu.

---

## Quando o pedido é para outra pessoa

Nosso formulário permite pedir atendimento **para outra pessoa** — um pai, um
filho, alguém que não está podendo fazer isso sozinho.

Nesse caso, os dados que chegam até nós são dessa pessoa, e não de quem
preencheu. Nós a tratamos como titular: os direitos deste documento são dela.

`[Como validamos a autorização de quem preenche: a definir — ver "Para o
advogado", item 3.]`

---

## Mudanças nesta política

Cada versão fica registrada com data de vigência e endereço permanente. Se
mudarmos algo relevante, a versão anterior continua consultável — você
consegue ver a que concordou.

---

# Para o advogado

O que segue não é redação: são as decisões que faltam, com o contexto técnico
verificado para cada uma.

**1. Base legal de cada tratamento.** A tabela acima está com as bases em
branco de propósito. Ponto principal: o sistema trata **dados de saúde**
(tabela `case_clinical_context`: diagnóstico, hipótese, exames, tratamentos,
limitações; mais laudos em arquivo). Se a base for consentimento, ele precisa
ser específico e destacado para esses dados — o aceite atual do formulário
público é genérico e ocorre **antes** de qualquer dado de saúde ser coletado.

**2. Retenção.** Hoje não existe política nem rotina de descarte: nada é
apagado automaticamente, nada é anonimizado, nenhuma entidade tem prazo. Isso
está declarado no próprio repositório. Duas saídas: (a) definir prazos e nós
implementamos antes de publicar; (b) publicar dizendo a verdade atual, como
está no rascunho. **Não publicar prazo que o sistema não cumpre.**

**3. Dados de terceiros.** O fluxo "para outra pessoa" recebe dados de alguém
que não está ali para consentir. Hoje não há qualquer validação de vínculo ou
autorização. Precisa de posição.

**4. Nome empresarial × marca.** A empresa é "Aliviar Conecta Serviços de
Assessoria e Gestão Ltda" e o serviço se apresenta como "Aliviar Curadoria
Médica". Não há domínio próprio: o serviço é servido pelo endereço da
hospedagem (`.vercel.app`). O rascunho declara a identidade entre a marca e a
razão social — confirmar se a forma está adequada.

**5. Objeto social.** As atividades registradas no CNPJ (assessoria e gestão,
promoção de vendas, cobrança, ensino) não incluem nada de saúde. Fica o
apontamento; a avaliação é sua.

**6. Encarregado.** Indicado: Caio Padilha, com e-mail pessoal. Uma
observação técnica: o endereço informado ainda precisa de confirmação — há
duas variantes possíveis do mesmo nome. (A alternativa de um endereço de
função no domínio do serviço deixou de existir: a Aliviar não tem domínio
próprio hoje.)

**7. Região de processamento.** Dados em repouso confirmados no Brasil
(Supabase `sa-east-1`). A região de execução da Vercel não estava declarada
em configuração e precisa ser confirmada no painel — o padrão da plataforma
é fora do Brasil quando não configurado.
