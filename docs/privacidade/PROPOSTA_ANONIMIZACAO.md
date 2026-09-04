# Proposta — anonimizar em vez de eliminar

> **Status: Proposta. Não é canônico e nada foi executado.**
> **Data:** 2026-09-04 · Levantada a pedido do Fundador, em conversa direta.
> Nasce de uma **tentativa real de eliminação que falhou em produção** nesta
> data, e não de leitura de documento.

---

## 1 · O conflito, e o dia em que ele parou de ser teoria

A casa tem duas regras que se contradizem quando uma pessoa pede para sumir:

- **O julgamento do Curador é indelével.** A tabela `curator_judgments` tem o
  gatilho `curator_judgments_sem_delete` disparando em `DELETE`, mais
  `curator_judgments_so_transicao_de_estado` no `UPDATE` e
  `curator_judgments_cadeia_coerente` no `INSERT`. Não é descuido: é desenho.
  Um juízo médico que pode ser apagado depois não é juízo, é rascunho.
- **O titular tem direito à eliminação**, e o `SIM-99` construiu a porta
  `eliminar_titular` justamente para exercê-lo.

Em **04/09** a porta foi chamada de verdade, contra uma pessoa real, com
autorização do Fundador. **Ela falhou:**

```
ERROR 23503: update or delete on table "cases" violates foreign key constraint
"curator_judgments_case_id_fkey" on table "curator_judgments"
```

Nada foi alterado — a transação voltou inteira, incluindo a escrita de
auditoria. O estado antes e depois é idêntico.

**O que isso revelou sobre o `SIM-99`:** a porta foi dada como pronta em 03/09
e **nunca funcionou para um Case que tenha julgamento**. Como a Curadoria
produz julgamento, isso significa: **todo Case que passou pelo Curador**. A
tela `/admin/pedidos` (`SIM-103`) chamaria essa porta e falharia na primeira
vez que alguém a usasse — diante de um pedido de titular real, com prazo
correndo.

**A dimensão do defeito, medida:** das **36 chaves estrangeiras que apontam
para `cases`, 35 cascateiam ou anulam. Exatamente uma bloqueia.** O conserto
técnico é pequeno. A decisão que ele exige, não.

---

## 2 · A medição que torna a proposta possível

A pergunta que decide tudo é: **o julgamento do Curador é sobre a pessoa, ou
sobre o médico?** Se for sobre a pessoa, preservá-lo enquanto se apaga a
pessoa é contradição — não há anonimização, só maquiagem.

**As colunas de `curator_judgments` respondem:** `case_id`,
`professional_profile_id`, `subcriterion_code`, `natureza`, `state`,
`conclusao`, `motivo`, `fatos_visiveis`, `catalog_version`, `versao`,
`actor_id`, `acted_at`.

**O julgamento é sobre o MÉDICO.** Ele diz se aquele profissional confirma tal
subcritério e por qual razão. A assistida entra só como `case_id` — um
vínculo, não um conteúdo.

**E o texto livre foi conferido, não suposto:** nos 9 julgamentos do Case, na
observação do Curador, nas 4 necessidades e no contexto clínico, o nome e a
cidade dela aparecem **zero vezes**.

**Ressalva honesta, e ela importa:** isso é uma *checagem*, não uma *prova*.
Ausência de nome não é ausência de identificabilidade — condição rara mais
cidade pequena identificam alguém sem citar ninguém. **Numa anonimização real,
quem lê e confirma é o Curador**, porque só ele sabe o que escreveu.

---

## 3 · O que "anonimizar" tem de significar aqui

Anonimizar identificador e deixar a narrativa legível é **pseudonimização com
nome bonito** — e a LGPD trata as duas de forma diferente. A proposta separa o
dado em três camadas, e cada uma tem destino próprio.

### Camada 1 — identidade direta · **ELIMINAR**

Conta (`auth.users`), nome (`profiles.display_name`), telefone e
cidade/estado (`patient_profiles`), documentos e os **bytes no storage**,
contato de CRM, notificações.

Não se mascara: some. É o que a `eliminar_titular` já faz bem.

### Camada 2 — a narrativa dela · **ELIMINAR**

`patient_stories` — são as palavras dela sobre si mesma. **Não existe
anonimizar um relato:** tirar o que identifica é destruir o que ele é. Some
junto.

### Camada 3 — o juízo do Curador · **PRESERVAR, órfão**

`curator_judgments` e o que descreve critério e compatibilidade
(`case_needs`, `case_clinical_context`, `curator_observations`).

**O Case sobrevive como casca anônima:** sem pessoa, sem história, sem
identidade — e os julgamentos continuam apontando para ele. O registro passa a
dizer *"num caso de ortopedia de coluna, este profissional confirmou tal
subcritério por tal razão"*, que é verdade e não é sobre ninguém.

**Nenhum julgamento é editado.** A cerca da imutabilidade continua de pé, e é
esse o ponto: a proposta não abre exceção nela — ela **corta o vínculo**, não
o conteúdo.

---

## 4 · O que a proposta NÃO resolve

- **Não decide se a Aliviar PODE reter.** Preservar juízo clínico sobre um
  caso pode exigir base legal do art. 16 da LGPD. **Quem responde é o
  advogado**, e a pergunta se soma às de 03/08.
- **Não torna o Case reidentificável nem irreidentificável por si só.** Se
  restar só um Case de ortopedia de coluna em São Paulo, ele identifica por
  singularidade. Com volume, deixa de identificar. **Hoje há três Cases** —
  volume é o que falta.
- **Não conserta a porta.** A `eliminar_titular` continua falhando enquanto o
  bloqueio existir. Anonimizar exige **um caminho novo**, e ele precisa ser
  construído — o que a ADR-073 congela, salvo pela exceção do que a lei exige.

---

## 5 · A ordem que eu recomendo

1. **Decidir o princípio** — anonimizar em vez de eliminar, quando houver
   juízo do Curador. É decisão de domínio do Fundador e vira ADR.
2. **Perguntar ao advogado** se a retenção do juízo se sustenta, e sob qual
   base. A pergunta entra na mesma leva de 03/08.
3. **Só então construir** `anonimizar_titular`, irmã da `eliminar_titular`, com
   a mesma disciplina: motivo obrigatório, executor verificado, auditoria antes
   do ato, e o storage devolvido a quem chama.
4. **O Curador lê e confirma** que os textos preservados não identificam. Sem
   isso, a anonimização é declarada, não verificada.

**Enquanto os quatro passos não acontecem, a pessoa continua em produção** — e,
se ela é de fora da equipe, o gatilho 2 da **ADR-096** segue disparado.
