# Mensagem para o advogado — pronta para enviar

Texto curto para copiar e colar em e-mail ou WhatsApp.

**Atualizada em 31/08.** Os anexos passaram de um para três:

| Anexar | O que é | O pedido |
|---|---|---|
| **Perguntas ao advogado** (14p) | Todas as pendências, com campo de resposta em cada uma | Preencher |
| **Política de Privacidade** (5p) | Documento NOVO, escrito por nós | **Revisar**, não redigir |
| **Leitura técnica** (9p) — *opcional* | A nossa hipótese de trabalho para cada pendência | Confirmar ou corrigir |

A leitura técnica é opcional e tem efeito prático: **algumas pessoas respondem
muito mais rápido a "confirma ou corrige isto?" do que a uma folha em branco.**
Se enviar, envie com o aviso da capa intacto — é leitura de engenharia, não
parecer.

---

## Versão para e-mail

**Assunto:** Documentos da Aliviar — perguntas objetivas antes da assinatura eletrônica

Olá, [nome],

Recebemos os cinco documentos (Contrato de Prestação de Serviços, Anexo I de LGPD, Procuração Particular, Termo LGPD do Médico e Termo de Idoneidade) e fizemos a análise deles para colocar a assinatura eletrônica no ar.

Deixo claro de saída: **nenhuma cláusula foi alterada, reescrita ou sugerida.** A análise foi só sobre como transformar esses documentos em experiência digital — como a pessoa vai ler, assinar, guardar e reencontrar cada um deles.

Dessa leitura surgiram algumas decisões objetivas que só você pode tomar, e que precisamos ter antes de implementar o fluxo de assinatura. As principais:

- qual forma de assinatura eletrônica é suficiente para cada documento;
- se o Contrato realmente exige duas testemunhas e duas vias (o fecho pede isso, e a cláusula 11 do mesmo contrato reconhece a assinatura eletrônica como válida);
- se haverá modelo para paciente representado (menor, idoso, familiar conduzindo);
- prazo de resposta aos pedidos de dados, quem é o Encarregado e qual o canal;
- os campos que seguem em branco nos cinco documentos: representante legal e CPF, foro, prazo de vigência, aviso prévio e prazo da procuração.

**Dois campos já foram resolvidos do nosso lado:** a identificação da empresa (razão social, CNPJ e sede estão preenchidos no anexo) e o **preço — R$ 500 por 12 meses, parcelável em até 12× de R$ 41,67, sem entrada**, que fecha a cláusula 9.1.

O arquivo de perguntas concentra **todas** as pendências, organizadas por documento, com campo para resposta em cada uma. São perguntas de sim/não ou de preencher — não é preciso redigir nada novo neste momento.

**Vai também a Política de Privacidade do site**, que escrevemos aqui a partir do que o sistema faz de fato. Ela **não é um dos cinco** — os cinco regem a relação de serviço, e a Política rege o uso do site, valendo para qualquer visitante. **O pedido nela é de revisão, não de redação.** Os quatro pontos que dependem de decisão estão isolados no fim dela, e três deles são nossos, não seus.

Essas respostas são o que falta para implementarmos o fluxo de assinatura. A parte técnica já está construída e testada; ela só não pode entrar no ar com documento incompleto ou com forma de assinatura indefinida.

Se for mais prático, podemos marcar 30 minutos e passar pela lista junto.

Obrigado,
[seu nome]

---

## Versão para WhatsApp

Oi, [nome], tudo bem?

Analisamos os cinco documentos que você mandou (contrato, anexo de LGPD, procuração e os dois termos do médico) para implementar a assinatura eletrônica no sistema. **Nenhuma cláusula foi mexida** — a análise foi só sobre como a pessoa vai ler, assinar e guardar cada documento.

Surgiram algumas decisões que só você pode tomar. As mais importantes: qual forma de assinatura eletrônica vale para cada documento, se o contrato exige mesmo duas testemunhas e duas vias (o fecho pede, mas a cláusula 11 aceita assinatura eletrônica), e os campos que estão em branco nos cinco (razão social, CNPJ, sede, preço, prazo, foro).

Te mandei um arquivo com todas as perguntas organizadas por documento, com campo pra resposta em cada uma. São perguntas de marcar ou preencher, não precisa redigir nada agora.

Mandei junto a **Política de Privacidade do site**, que a gente escreveu aqui a partir do que o sistema faz. Ela não é um dos cinco — rege o uso do site, não a relação de serviço. **O pedido nela é só de revisão.**

Sem essas respostas a gente não consegue ligar a assinatura — a parte técnica já está pronta e testada, mas não pode ir ao ar com documento incompleto.

Se preferir, marcamos 30 min e passamos pela lista junto. 🙏

---

## Se ele perguntar "o que é mais urgente?"

Duas coisas, e nessa ordem:

1. **As testemunhas do contrato** — se permanecerem, o contrato não se completa numa sessão digital e o tamanho da implementação muda bastante.
2. **Os campos do fecho** — representante legal e CPF, foro e prazo da procuração. A identificação da empresa e o preço já estão resolvidos; sem os que sobram, nenhum documento pode ser publicado, porque aparecem em todos os cinco.

E se ele só puder responder **uma** pergunta, que seja esta:

> **O nosso modelo de assinatura — documento gerado com os dados da pessoa, rolagem obrigatória até o fim, nome digitado e conferido com o cadastro, registro de quem/quando/de onde e uma impressão digital do texto exato — é suficiente para o Contrato, e dispensa as duas testemunhas do fecho?**

Ela carrega a forma de assinatura e as testemunhas juntas, e é a única cuja resposta muda o **tamanho** da implementação, não só o conteúdo dela.

---

## Uma pergunta à parte, que não bloqueia nada

Esta não trava documento nenhum — pode vir depois das outras, e é a única de
**produto**, não de contrato:

> **Podemos publicar, sobre cada profissional da Rede, fatos acadêmicos e de
> formação verificáveis — com a fonte e a data da conferência ao lado —, ligados
> ao caso da pessoa, sem ranking, sem nota e sem adjetivo?**

O contexto, para a resposta sair direta:

- **O que queremos publicar:** *"residência em ortopedia (CRM-PB, conferido em
  01/09/2026)"*, *"orienta residentes em cirurgia de coluna (Lattes, link)"*,
  *"publicou sobre hérnia discal em 2024 (DOI)"*.
- **O que NÃO queremos, e já é proibido pela nossa própria doutrina:** superlativo
  (*"referência nacional"*), ordenação entre profissionais, nota, selo, e título
  de especialista sem RQE registrado.
- **A origem do dado:** o próprio profissional declara num formulário que ele
  **assina** (Termo de Veracidade), e nós conferimos contra fonte pública —
  CRM/RQE, Lattes, DOI. **Toda informação chega ao assistido com origem e data**,
  e o que não deu para confirmar é dito como não confirmado, nunca preenchido.
- **Por que perguntamos:** a Resolução CFM 2.336/2023 trata de publicidade médica,
  e queremos saber **onde fica a linha** entre *informar fato verificável* e
  *fazer publicidade de terceiro* — e se há algo que o **nosso** contrato com o
  profissional precisa dizer para autorizar essa publicação.

**Se a resposta for "sim, com condições", as condições viram regra da casa** — é
assim que trabalhamos com todas as outras.
