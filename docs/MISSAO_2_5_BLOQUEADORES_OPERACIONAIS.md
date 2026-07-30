# Missão 2.5 — Bloqueadores operacionais antes do Release

**2026-07-24.** Nada commitado, nada em push, nada em deploy.

Complementa [`CORRECAO_DOMINIO_PAPEIS_E_CASE.md`](CORRECAO_DOMINIO_PAPEIS_E_CASE.md) e [`PAPEL_ADMINISTRADOR_E_ENTRADA_DO_PACIENTE.md`](PAPEL_ADMINISTRADOR_E_ENTRADA_DO_PACIENTE.md).

---

## 1. Superfície do Atendente — construída

Até aqui o Atendente existia como papel no banco e não tinha por onde trabalhar: quem chegasse com esse papel caía na Landing pública, como se não tivesse conta.

| Rota | O que é |
|---|---|
| `/atendimento` | Fila de leads, ordenada **pelo que falta fazer**, não pela data |
| `/atendimento/[leadId]` | Ficha do contato com as quatro ações da jornada |
| `/acompanhamento` | Superfície mínima do Concierge (Nível 3) |

`ROLE_HOME` agora mapeia os três níveis. **Nenhum aponta para `/admin`** — mandar um Atendente para o painel administrativo resolveria a navegação criando escalada de privilégio. Há teste de regressão para isso.

### As quatro ações

Cada botão diz o que faz. Nenhum "Continuar" — três das quatro são irreversíveis e quem clica precisa saber antes.

| Botão | Operação segura |
|---|---|
| Qualificar lead | `curadoria.qualify_lead()` |
| Converter em paciente | `curadoria.convert_lead_to_patient()` |
| Abrir atendimento | `curadoria.open_case_from_lead()` |
| Encaminhar ao Curador | `curadoria.transfer_case_responsibility()` |

**Nenhuma regra de autorização vive no cliente.** Os botões refletem o estado do lead, não a permissão de quem olha. Se o banco recusar, a mensagem dele aparece na tela como está. Repetir a regra no TypeScript criaria uma segunda autoridade que pode divergir da primeira — e a de fora do banco é sempre a que erra por excesso.

### `open_case_from_lead()` — migration nova

O Case exige `source_story_id` NOT NULL: no Método nenhum Case nasce sem que alguém tenha contado alguma coisa. No fluxo do Atendente essa História é o que a pessoa disse no primeiro contato. Ela nasce como rascunho, para o Curador aprofundar.

O Case nasce **com o Atendente como responsável** — nunca sem dono. Idempotente por lead: um duplo clique não cria a segunda ficha da mesma pessoa.

### Estados e feedback

Loading (`useTransition`), erro (`role="alert"`), sucesso (`role="status"`), vazio, confirmação de duplicidade, e **prevenção de duplo clique em duas camadas** — o `pending` desabilita os botões e as operações são idempotentes no banco. As duas, porque a rede pode reenviar.

### Deduplicação na tela

Correspondências por telefone e e-mail normalizados aparecem **antes** da conversão, com o motivo do casamento. Nome igual é marcado como pista fraca. Nada é bloqueado: há um `checkbox` de confirmação humana, e o botão de converter só libera depois dele.

O cálculo roda no servidor, contra os leads que **aquele usuário** pode ver. Se a RLS esconde um contato dele, ele não descobre que existe por meio de um aviso de duplicidade.

---

## 2. Jornada completa validada com três pessoas distintas

Executada em transação revertida, com Atendente, Curador e Concierge **separados** (perfis criados dentro da transação e descartados no fim).

| # | Passo | Resultado |
|---|---|---|
| 1-2 | Atendente qualifica o lead | ✅ |
| 3 | Atendente converte em Patient | ✅ |
| 4 | Atendente abre o Case | ✅ nasce com `responsible_role = atendente` |
| 5 | Atendente encaminha ao Curador | ✅ **mesmo `case_id`** |
| 6 | Curador recebe | ✅ vê o mesmo Case |
| 7-8 | Curador encaminha ao Concierge | ✅ **mesmo `case_id`** |
| 9 | Concierge recebe | ✅ |
| 10 | Isolamento por papel | ✅ Atendente **perde** acesso após entregar; Curador **perde** após entregar |
| 11 | Administrador | ✅ vê o Case **sem se tornar responsável** |
| 12 | Paciente sem vínculo | ✅ não acessa |
| — | Auditoria | ✅ 2 transferências + 3 registros de CRM |

Estado final conferido: **3 perfis, 2 contatos, 2 Cases, 0 transferências, 1 auditoria** (a pré-existente de smoke test). Nada persistiu.

Isso prova a arquitetura de isolamento. **Não substitui** o teste com sessões reais no navegador — ver §4.

---

## 3. Verificações automatizadas

| | |
|---|---|
| Typecheck | ✅ limpo |
| Lint | ✅ sem avisos |
| Build | ✅ compila; 3 rotas novas |
| Testes unitários | ✅ **863 passando** (+8) |
| Testes de integração | ⛔ ver §4 |

---

## 4. Bloqueadores que restam — os dois dependem de você

### A. Não existem os perfis operacionais separados

Produção continua com **uma pessoa acumulando `administrador + curador_medico + concierge`**, e ninguém com `atendente`.

Não inventei credenciais nem criei usuário fictício. **Preciso de três e-mails** — Atendente, Curador, Concierge. Com eles, uso o fluxo do próprio sistema: a senha é gerada no servidor e exibida uma única vez, sem que eu a escolha ou a digite.

Sem isso, o critério do §8 da missão não pode ser marcado como atendido — ele exige a separação **no cenário validado**, e o cenário validado hoje é uma transação revertida, não a operação real.

### B. Nenhuma tela foi aberta com sessão autenticada

`/atendimento`, `/acompanhamento` e `/admin` exigem login, e eu não insiro credenciais. O servidor sobe, compila e redireciona corretamente para `/login`, mas continuam sem verificação visual:

- o painel executivo em desktop, notebook, tablet e mobile;
- overflow, contraste, filtros de período, alternativa textual dos gráficos;
- `null` exibido como "Informação indisponível" e não como zero;
- o alerta de acúmulo de papéis;
- a superfície do Atendente em mobile.

**Como destravar**: faça login no navegador que está aberto e me avise — eu verifico e corrijo o que aparecer, na mesma sessão.

### C. Testes de integração

Os 133 testes de integração continuam bloqueados no C2 da Missão 2: dependem de `supabase db reset` local contra o schema de produção. Não faziam parte desta missão, mas seguem em aberto para a certificação.

---

## 5. Migrations aplicadas nesta missão

| Migration | O quê |
|---|---|
| `case_abertura_pelo_atendente` | `open_case_from_lead()` + policy de INSERT em `patient_stories` |

Aditiva. O rollback é `drop function curadoria.open_case_from_lead(uuid, text);` e `drop policy patient_stories_insert_atendente on curadoria.patient_stories;`.
