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
