# Levantamento factual para a Política de Privacidade

**Data:** 2026-08-19 · **Autor:** levantado do código e do banco, não da memória
**Para que serve:** metade de uma política de privacidade não é direito — é
descrição do que o sistema faz. Esta é essa metade, verificada. O jurídico
transforma em texto publicado; nada aqui é redação jurídica.

**Como foi levantado:** lendo `src/`, as funções e as policies de RLS do banco
local (que é o mesmo schema de produção). Cada afirmação abaixo tem origem
nomeada. O que não pude verificar está dito como não verificado — não foi
preenchido por suposição.

---

## 1 · O problema que motivou este documento

O formulário público **registra** o consentimento com a versão
`privacidade-2026-08`, fixa no código
(`src/modules/crm/solicitacao-publica.ts:137`).

A tabela `legal_documents` tem **zero linhas**.

Ou seja: pessoas consentiram a uma política que não existe em lugar nenhum e
não pode ser mostrada nem a elas nem a um auditor. A infraestrutura para
publicá-la está pronta e correta (`legal_documents`,
`legal_document_versions`, `legal_acceptances`, e a página pública diz
honestamente "ainda não foi publicado"). **Falta o texto.**

---

## 2 · O que o formulário público coleta

Porta: `POST /api/solicitacoes-atendimento`.

| campo | obrigatório | observação |
|---|---|---|
| nome | sim | |
| e-mail | sim | normalizado por `curadoria.normalizar_email_publico` |
| telefone | sim | normalizado por `curadoria.normalizar_telefone_publico` |
| destinatário | sim | "para mim" ou "para outra pessoa" |
| consentimento | sim | nasce **desmarcado**; sem ele não há envio |
| `website` | — | campo-armadilha anti-robô; não é dado da pessoa |

**Não** coleta: CPF, data de nascimento, endereço, dado de saúde, documento.

Destino: uma linha em `curadoria.crm_contacts`, gravada pela função
`curadoria.solicitar_atendimento_publico`.

**Ponto para o jurídico:** quando alguém preenche "para outra pessoa", os dados
enviados são de um terceiro que não está ali para consentir. É uma situação
real do produto e a política precisa dizer algo sobre ela.

### 2.1 · O que MUDA com a ADR-072 — ainda não implementado

A decisão de 2026-08-20 acrescenta uma segunda porta pública, e ela é de outra
natureza: **passa a coletar dado de saúde de quem não é paciente.**

| campo | obrigatório | observação |
|---|---|---|
| nome | sim | |
| telefone | sim | é a chave do vínculo — a conversa segue no WhatsApp |
| a história | sim | **texto livre, com conteúdo de saúde** |

**Não** pede e-mail, e isso é decisão, não esquecimento: o telefone é o canal, e
um segundo identificador poderia divergir do primeiro.

Três pontos que o jurídico precisa considerar, e que não existem no formulário
de hoje:

1. **É dado sensível (saúde) de pessoa sem vínculo.** O formulário atual não
   coleta nada de saúde; este coleta, e de alguém que pode nunca virar paciente.
2. **O conteúdo NUNCA é transmitido ao WhatsApp.** Quem é transferida para o
   canal é a **pessoa**, para conversar; o relato permanece na base da Aliviar.
   Nenhum dado de saúde atravessa para infraestrutura de terceiro. Este é o
   ponto que sustenta juridicamente a decisão inteira.
3. **A retenção é de 90 dias** e a promessa é feita na tela — ver §5.1.

---

## 3 · Quem consegue ler

Não é política de confiança: é RLS no banco. A leitura de `crm_contacts` passa
por `curadoria.can_access_crm_contact(id)`, que autoriza:

- `administrador`
- `atendente`
- `concierge`
- `curador_medico`
- e quem estiver **atribuído** àquele contato

Ninguém mais alcança a linha — inclusive usuários autenticados de outros
papéis. Paciente e profissional **não** leem `crm_contacts`.

---

## 4 · Documentos e arquivos

Dois buckets, **ambos privados** (`public = false`):

- `patient-documents`
- `professional-documents`

É aqui que vivem laudos e exames das pacientes. Nenhum é servido por URL
pública.

---

## 5 · Retenção — o buraco honesto

**Não existe política de retenção.** Não é omissão deste levantamento: é
declaração de fonte primária do próprio repositório
(`RETENCAO_E_DESCARTE_DE_CASES.md §7` — prazos e anonimização estão fora de
escopo e exigem ADR própria "com quem responde por LGPD", ADR que não existe).

Consequência factual: **nenhuma entidade tem prazo, base legal de descarte,
tombstone ou anonimização.** Nada é apagado por rotina; não há expurgo
automático de nada.

**CORREÇÃO (mesma data, mais tarde):** eu havia escrito aqui que não existia
fluxo de pedido do titular. **Existe.** A tabela `data_subject_requests` e o
painel `/paciente/documentos-e-consentimentos` permitem à pessoa abrir pedido de
**acesso, correção, exclusão, portabilidade ou revogação** e acompanhar o
andamento. O que não existe é execução automática — quem cumpre o pedido é uma
pessoa — e o campo de PRAZO nasce nulo de propósito, porque o prazo é decisão
jurídica (marcado no próprio código como PRIV-03).

O que segue valendo: não há política de retenção nem descarte por rotina.

Isto precisa de decisão sua antes de virar texto — uma política que promete
prazo que o sistema não cumpre é pior que nenhuma política.

### 5.1 · A primeira retenção decidida (2026-08-20) — ADR-072

O Fundador decidiu o prazo para **um** conjunto de dados, que ainda não existe
no sistema: as histórias captadas de quem **não é paciente**, no fluxo novo da
ADR-072.

- **Prazo: 90 dias** a partir da captação.
- **Depois:** o relato é apagado.
- **Exceção:** se a pessoa virar paciente da Aliviar dentro dos 90 dias, a
  história sai deste prazo — passa a ser histórico dela, sob a mesma regra das
  demais histórias de paciente.
- **Onde a promessa é feita:** **na própria tela, enquanto a pessoa escreve** —
  não apenas na política. A decisão foi explícita neste ponto: quem se abre
  precisa saber o destino do que vai contar *antes* de contar.

Sentido a preservar na redação jurídica: *guardamos por 90 dias enquanto
conversamos; depois apagamos; se você virar paciente nesse período, a história
fica com você*.

**Atenção — nada disso está implementado.** Não há captação anônima, não há
expurgo automático e nenhuma rotina cumpre o prazo. A política **não pode
afirmar que já acontece**. Pode declarar o compromisso, desde que a
implementação seja publicada junto — e é assim que precisa ser tratado, sob pena
de a política prometer o que o sistema não faz, que é justamente o erro que este
levantamento existe para evitar.

O restante do §5 continua valendo: para todas as **outras** entidades não há
prazo nem descarte por rotina, e essa lacuna segue aberta.

---

## 6 · Subprocessadores

- **Supabase** — banco, autenticação e storage
- **Vercel** — hospedagem da aplicação

**Não verificado por mim:** a região onde os dados ficam fisicamente
armazenados em cada um. Isso se lê no painel de cada serviço, e a política
costuma precisar dizê-lo. Não preenchi por suposição.

---

## 7 · O que a política precisa afirmar, e eu não posso responder

1. **Controlador:** qual pessoa jurídica responde pelos dados, com CNPJ.
2. **Encarregado (DPO):** quem é, e o canal de contato.
3. **Base legal** de cada tratamento — consentimento não cobre tudo.
4. **Prazos de retenção**, e o que acontece ao fim deles (§5).
5. **Como o titular exerce seus direitos**, na prática, hoje.
6. **Região de armazenamento** dos subprocessadores (§6).
7. **Dados de terceiros** no fluxo "para outra pessoa" (§2).

---

## 8 · Depois que o texto existir

1. Publicar em `legal_documents` + `legal_document_versions`, com versão e
   vigência — a página pública passa a renderizar sozinha.
2. **Amarrar `VERSAO_DO_CONSENTIMENTO` ao slug/versão publicada.** Hoje é
   string solta no código: ele pode dizer uma versão e o banco ter outra, sem
   ninguém notar.
3. Teste que quebra se o formulário pedir consentimento a documento não
   publicado.

Os itens 2 e 3 são meus e ficam prontos no mesmo dia em que o texto entrar.
