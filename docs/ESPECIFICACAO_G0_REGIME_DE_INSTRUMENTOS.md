# Especificação G0 — Regime de Instrumentos

Fundação técnica do regime de Instrumento: inventário do que existe, desenho do delta necessário, plano de compatibilidade, interface com o Protocolo da Prática e plano de testes.

**Status:** especificação. **Nada foi implementado.** Nenhuma migration criada, nenhum objeto de banco alterado, nenhuma tela escrita, nenhum documento publicado, nenhum `.docx` convertido, nenhum conteúdo jurídico tocado, nenhum commit.

**Precedentes:** [`ARQUITETURA_DO_MODULO_DE_GOVERNANCA_DOCUMENTAL.md`](ARQUITETURA_DO_MODULO_DE_GOVERNANCA_DOCUMENTAL.md) rev. 2 · [`DECISOES_DO_MODULO_DE_GOVERNANCA_DOCUMENTAL.md`](DECISOES_DO_MODULO_DE_GOVERNANCA_DOCUMENTAL.md)

**Decisões que sustentam este desenho:**

- **D-5 (aprovada, 2026-08-03)** — Contrato e Anexo LGPD concluídos antes da história clínica; Procuração apenas quando houver representação administrativa; assinatura e evidência **independentes por documento**.
- **D-4 (aprovada, 2026-08-03)** — revogação modelada **por documento e por escopo**; sem revogação genérica do aceite inteiro para todos os casos.
- **Pendentes do Jurídico:** D-3 (nível de assinatura), D-6 (testemunhas e forma), D-7 (representante legal), D-8 (prazo de DSR) e as lacunas documentais da Parte 6 do documento de decisões.

**Princípio que governa todo o delta:** o desenho abaixo comporta as quatro decisões pendentes **sem refatoração** — nenhuma delas é presumida, e nenhuma delas, ao ser respondida, obriga a reescrever estrutura já criada. Onde a resposta jurídica muda o comportamento, ela muda **dado publicado**, não esquema.

---

## 1. Escopo do G0

**O G0 entrega:** a correção da arquitetura (feita, rev. 2), este inventário, a especificação de banco do delta, o plano de compatibilidade e o plano de testes.

**O G0 não entrega:** migration, tela, conteúdo jurídico, publicação de documento, pipeline de PDF, integração com Curadoria. O primeiro incremento executável está na §7 — e só começa depois de este documento ser aprovado.

---

# 2. Inventário do estado existente

Tudo verificado no código publicado. Nada aqui é proposta.

## 2.1 Tabelas

### Do módulo de governança documental

| Tabela | Origem | Papel | Imutabilidade |
|---|---|---|---|
| `curadoria.legal_documents` | `20260803140000` | Catálogo de documentos: slug, nome, resumo, audiência, obrigatório, revogável, ativo | Metadados editáveis |
| `curadoria.legal_document_versions` | `20260803140000` | Redação publicada: `conteudo`, `conteudo_hash` (coluna gerada), idioma, `requires_reacceptance`, `effective_at`, `published_at`, `published_by` | **Append-only por trigger** |
| `curadoria.legal_acceptances` | `20260803140000` + `20260803150000` | O livro de atos: sujeito (conta XOR perfil profissional), versão, hash carimbado, circunstância, origem, natureza, proveniência do registro | **Append-only por trigger** |
| `curadoria.legal_acceptance_revocations` | `20260803140000` | Revogação de um aceite, com data, motivo e circunstância | **Append-only**, uma por aceite |
| `curadoria.data_subject_requests` | `20260803140000` | Pedido de titular: tipo, status, prazo, desfecho | Editável com check de coerência |
| `curadoria.data_subject_request_items` | `20260803140000` | Inventário do pedido por recurso, com estado e verificação | Progressão unidirecional, **não removível** |

### Adjacentes que o módulo usa ou usará

| Tabela | Papel no módulo |
|---|---|
| `curadoria.audit_logs` | Livro de auditoria (`actor_id`, `action`, `target_profile_id`, `metadata`, `created_at`). **Recebe os valores de enum do módulo e nenhuma linha** |
| `curadoria.profiles` / `professional_profiles` | Sujeitos dos atos |
| `curadoria.professional_documents` | Documentos administrativos do profissional, bucket `professional-documents` |
| `curadoria.patient_documents` | Documentos clínicos do paciente, bucket `patient-documents` |
| `curadoria.practice_evidence` | Base de Evidências — o conteúdo que o Termo de Idoneidade declara (§5) |
| `curadoria.practice_protocol_drafts` | Rascunho do Protocolo da Prática, uma linha por profissional |

## 2.2 Tipos

| Tipo | Valores | Situação |
|---|---|---|
| `curadoria.legal_audience` | `paciente`, `profissional`, `equipe` | Em uso |
| `curadoria.legal_acceptance_origin` | `primeiro_acesso`, `reaceite_por_nova_versao`, `escolha_de_profissional`, `portal_da_conta` | Em uso |
| `curadoria.legal_acceptance_nature` | `eletronico_pelo_titular`, `registrado_pela_equipe` | Em uso |
| `curadoria.dsr_kind` | `acesso`, `correcao`, `exclusao`, `portabilidade`, `revogacao` | Em uso |
| `curadoria.dsr_status` | `recebido`, `em_execucao`, `concluido`, `recusado` | Em uso |
| `curadoria.dsr_item_state` | `pendente`, `removido`, `retido_por_obrigacao_legal`, `falhou` | Em uso |
| `curadoria.audit_action` | +6 valores do módulo: `legal_document_published`, `legal_acceptance_registered`, `legal_acceptance_revoked`, `data_subject_request_opened`, `data_subject_request_closed`, `professional_acceptance_registered` | **Criados e nunca escritos** |

## 2.3 Funções

| Função | Tipo | O que garante |
|---|---|---|
| `versao_vigente(uuid)` | `stable security definer` | Definição única de vigência: maior `effective_at` já alcançado |
| `register_legal_acceptances(uuid[], text, text, text, jsonb)` | `security definer` | Porta única de escrita do aceite do titular: valida vigência, carimba hash do banco, tudo-ou-nada |
| `revoke_legal_acceptance(uuid, text, text, text)` | `security definer` | Só o titular revoga o próprio aceite, e só onde o documento permite |
| `register_professional_acceptances(uuid, uuid[], text, text, timestamptz)` | `security definer` | Registro pela Curadoria: exige papel, forma de obtenção e data não futura |
| `pendencias_legais_do_profissional(uuid)` | `stable security definer` | Responde o que falta — **não bloqueia nada** |
| `enforce_legal_append_only()` | trigger | Recusa `UPDATE`/`DELETE` nas três tabelas de prova |
| `enforce_dsr_item_progressao()` | trigger | Estado terminal é final; item não é removível |

## 2.4 Triggers e constraints

**Triggers:** `legal_document_versions_append_only`, `legal_acceptances_append_only`, `legal_acceptance_revocations_append_only`, `data_subject_request_items_progressao`.

**Constraints estruturais de `legal_acceptances`:**

- `legal_acceptances_um_sujeito` — conta XOR perfil profissional, nunca ambos, nunca nenhum;
- `legal_acceptances_proveniencia_coerente` — registro pela equipe exige `registrado_por` **e** `forma_de_obtencao`; aceite eletrônico exige que ambos sejam nulos;
- `legal_acceptances_natureza_do_sujeito` — perfil profissional só entra pelo caminho registrado.

**Índice único relevante:** `legal_acceptance_revocations_unica (acceptance_id)` — **uma revogação por aceite**. É exatamente o que a revogação por escopo (D-4) precisa alterar; ver §3.5.

## 2.5 Policies e privilégios

| Policy | Tabela | Alcance |
|---|---|---|
| `legal_documents_leitura_publica` | `legal_documents` | `anon` + `authenticated`, quando `ativo` |
| `legal_document_versions_leitura_publica` | `legal_document_versions` | `anon` + `authenticated`, sempre — é o permalink de prova |
| `legal_acceptances_leitura_propria` | `legal_acceptances` | Titular ou administrador |
| `legal_acceptances_leitura_equipe` | `legal_acceptances` | Administrador e curador, quando o sujeito é perfil profissional |
| `legal_acceptance_revocations_leitura_propria` | revogações | Titular do aceite ou administrador |
| `data_subject_requests_proprio` / `_abertura_propria` | DSR | Titular lê e abre; administrador lê |
| `data_subject_request_items_proprio` | itens | Titular do pedido ou administrador |

**Privilégios (camada anterior à policy):** `select` de documentos e versões para `anon` e `authenticated`; `select` dos atos para `authenticated`; `insert` apenas em `data_subject_requests`. **`insert` de aceite e de revogação não é concedido a ninguém** — a escrita passa obrigatoriamente pelas funções. `service_role` tem `all`.

## 2.6 Módulos da aplicação

| Arquivo | Papel | Depende de banco? |
|---|---|---|
| `src/modules/governanca/documentos.ts` | Domínio puro: vigência, audiência por papel, pendências, permalink | Não — testável isolado |
| `src/modules/governanca/repository.ts` | Leitura por RLS, escrita por RPC, estado de governança, DSR | Sim |
| `src/modules/governanca/professional-repository.ts` | Aceites e pendências por perfil profissional | Sim |
| `src/modules/governanca/actions.ts` | Actions do titular; coleta IP e user-agent do cabeçalho | Sim |
| `src/modules/governanca/professional-actions.ts` | Registro pela Curadoria; exige papel; forma de obtenção com mínimo de 10 caracteres | Sim |
| `src/modules/governanca/gate.ts` | Gate no servidor, com rotas livres — **sem ponto de uso** | Sim |
| `src/components/governanca/documento-legal.tsx` | Leitura pública com versão, vigência e permalink | Não |
| `src/components/governanca/pagina-de-documento.tsx` | Página por slug, com "ainda não publicado" de primeira classe | Sim |
| `src/components/governanca/lista-de-aceites.tsx` | Histórico do titular | Não |

**Nota de nomenclatura:** `tests/unit/governanca-alcancavel.test.ts`, `tests/unit/evidencias-governanca.test.ts` e `tests/integration/governanca-evidencias.integration.test.ts` **não pertencem a este módulo** — são da governança da Base de Evidências de Prática. Domínio diferente, mesma palavra.

## 2.7 Rotas e APIs

| Superfície | Situação |
|---|---|
| `/termos`, `/privacidade`, `/consentimentos/[slug]` | Implementadas, servindo "ainda não publicado" |
| `/legal/[slug]/v/[versao]` | Permalink de prova, implementado |
| `/paciente/documentos-e-consentimentos` | Área do titular, implementada |
| `/aceites` | **Não existe.** `gate.ts` redireciona para ela |
| Rotas HTTP de governança | **Nenhuma.** O módulo é todo Server Actions |

**Detalhe de infraestrutura que o delta precisa respeitar:** os clientes Supabase são criados com `db: { schema: DB_SCHEMA }` (`src/lib/supabase/{server,browser,middleware,admin}.ts`). Por isso o repositório chama `.from("legal_documents")` sem prefixo, e as RPCs usam `.schema("curadoria").rpc(...)`. Qualquer objeto novo precisa estar no mesmo esquema para ser alcançável sem mudança de cliente.

## 2.8 Testes existentes

| Arquivo | Casos | O que já está provado |
|---|---|---|
| `tests/unit/governanca-documentos.test.ts` | 14 | Vigência (2), audiência por papel (3), pendências (8), permalink (1) — inclusive material vs. editorial e documento sem versão publicada |
| `tests/integration/governanca-aceites.integration.test.ts` | 9 | Hash gerado pelo banco; imutabilidade de versão e de aceite; recusa de versão superada; revogação que preserva o aceite; `INSERT` direto recusado no privilégio; registro pela Curadoria com forma obrigatória; paciente não registra aceite de profissional |

Estes **23** casos são o **contrato de regressão** do G0: o delta não pode quebrar nenhum deles. Se algum precisar mudar, é sinal de que o delta alterou semântica existente — e isso exige decisão, não ajuste de teste.

> **Correção (execução do G0.1):** a contagem publicada aqui na primeira redação era 16 + 9 = 25. O arquivo unitário tem **14** casos; o contrato de regressão é de **23**. O número foi conferido na execução, não estimado.

## 2.9 Gaps para suportar Instrumentos

| # | Gap | Consequência se ignorado |
|---|---|---|
| **I1** | Não existe entidade de **instância** | Assina-se o modelo com marcadores; a prova aponta para o documento errado |
| **I2** | Não existe **snapshot dos campos** | Impossível responder o que estava declarado no dia da assinatura |
| **I3** | Só um hash por ato (`conteudo_hash`) | Falta o hash do conteúdo personalizado — metade da prova |
| **I4** | Não existe **estado de assinatura** nem lista de assinantes exigidos | Instrumento parcialmente assinado seria indistinguível de assinado |
| **I5** | Não existe **eficácia própria** do instrumento | Procuração expirada continuaria contando como representação vigente |
| **I6** | Revogação é **uma por aceite e sempre integral** | D-4 inexequível: revogar imagem derrubaria o termo inteiro |
| **I7** | **Rescisão** não existe | Rescindir seria registrado como revogação — afirmação de que o contrato nunca valeu |
| **I8** | Não existe **vínculo com artefato** | Termo de Idoneidade declara dados irreconstituíveis |
| **I9** | Não existe **regime** no catálogo | Nenhuma regra consegue distinguir Adesão de Instrumento |
| **I10** | `audit_logs` **sem escrita** | Eventos jurídicos sem trilha |
| **I11** | Não existe **download nem log de download** | Instrumento inacessível; ADR-055 descumprida |
| **I12** | Não existe **artefato derivado** | Nada apresentável fora da tela |

Os gaps **I1 a I9** são o escopo do delta desta especificação. **I10 a I12** já estavam previstos na arquitetura (G2, G4, G5) e não mudam com esta correção.

---

# 3. Desenho técnico do delta

Especificação de banco. **Não é migration** e não deve ser copiada como tal: tipos, nomes e ordem de criação serão definidos no incremento de implementação, contra o estado real do banco no momento.

## 3.1 Tipos novos

```
curadoria.legal_regime
  'adesao' | 'instrumento'

curadoria.legal_instance_status
  'aguardando_assinaturas' | 'assinado' | 'expirado' | 'cancelado'
  -- Não existe 'rascunho': a instância nasce completa e imutável.

curadoria.legal_signature_level
  'N1' | 'N2' | 'N3'
  -- A estrutura oferece os três; QUAL vale por documento é D-3 (Jurídico).

curadoria.legal_signer_role
  'titular' | 'contratada' | 'testemunha' | 'representante_legal'
  -- Existir o valor não decide nada: quem é exigido por documento é dado
  -- publicado. 'testemunha' e 'representante_legal' existem para que as
  -- respostas de D-6 e D-7 não exijam alterar tipo depois.

curadoria.legal_event_type
  'aceite' | 'assinatura' | 'revogacao_integral' | 'revogacao_por_escopo'
  | 'rescisao' | 'substituicao_de_versao' | 'download' | 'emissao_de_prova'

curadoria.legal_termination_cause
  'acordo' | 'denuncia_imotivada' | 'infracao' | 'perda_de_objeto'
  | 'inviabilidade'
  -- Espelha as hipóteses que o Contrato recebido enumera (10.2), sem
  -- interpretá-las. Se o Jurídico alterar o texto, altera-se o dado.
```

## 3.2 Extensões em tabelas existentes

```
legal_documents
  + regime            curadoria.legal_regime not null default 'adesao'
  + categoria         text        -- contrato | procuracao | termo | politica
  + ordem_de_apresentacao smallint

legal_document_versions
  + variaveis_requeridas  jsonb   -- contrato de campos do instrumento
  + assinantes_exigidos   jsonb   -- papéis esperados e ordem, por modelo
  + escopos_revogaveis    jsonb   -- catálogo de escopos deste documento
  + nivel_exigido         curadoria.legal_signature_level
  + aprovado_por / aprovado_em / motivo_da_mudanca
```

**`escopos_revogaveis` é a peça que torna D-4 executável sem inventar categoria jurídica em código.** Cada versão publicada declara quais autorizações são revogáveis isoladamente — por exemplo, um código `uso_de_imagem` com o rótulo legível correspondente. A revogação por escopo só aceita um código declarado na versão que foi assinada. **Enquanto o Jurídico não delimitar os escopos (item 21 das lacunas), a lista nasce vazia e só a revogação integral opera** — o esquema não muda quando a resposta chegar.

**`variaveis_requeridas` e `assinantes_exigidos` são contratos declarados na versão, não no código.** É isso que permite publicar um sexto instrumento sem tocar em nada.

## 3.3 Instância documental

```
curadoria.legal_document_instances

  id                      uuid pk
  version_id              → legal_document_versions (restrict)   -- versão-modelo de origem

  -- Titular: conta XOR perfil profissional (mesmo padrão de legal_acceptances)
  profile_id              → profiles (restrict)
  professional_profile_id → professional_profiles (restrict)

  -- Contexto: por que este instrumento existe
  case_id                 → cases (set null)      -- quando nasce de um caso
  contexto                jsonb not null default '{}'

  -- Conteúdo congelado
  corpo                   text not null           -- o instrumento renderizado
  variaveis               jsonb not null          -- snapshot imutável dos campos

  -- Os dois hashes (arquitetura §4.2.2)
  instancia_hash          text GERADA sha256(corpo)
  conteudo_hash           text not null           -- cópia do hash da versão de origem

  -- Estado e datas
  status                  curadoria.legal_instance_status not null
  gerada_em               timestamptz not null default now()
  gerada_por              → profiles (set null)
  assinada_em             timestamptz             -- preenchida na última assinatura exigida
  expira_em               timestamptz             -- validade da OFERTA de assinatura

  -- Eficácia do instrumento assinado (arquitetura §5.3)
  eficaz_de               timestamptz
  eficaz_ate              timestamptz             -- Procuração: assinatura + prazo em meses

  -- Vínculo opcional com artefato declarado (§5)
  artefato_tipo           text
  artefato_ref            jsonb
  artefato_hash           text

  -- Aditivos e substituições
  instancia_substituida_id → legal_document_instances (restrict)
```

**Invariantes:**

| # | Invariante | Onde vive |
|---|---|---|
| N1 | Exatamente um titular: conta XOR perfil profissional | `check` |
| N2 | `corpo` e `variaveis` **nunca** mudam após a inserção | trigger append-only, com exceção nomeada abaixo |
| N3 | `instancia_hash` é gerado pelo banco; o cliente nunca o informa | coluna gerada |
| N4 | `conteudo_hash` é copiado da versão pelo servidor, nunca recebido | função de criação |
| N5 | A versão de origem precisa ser a **vigente** no momento da geração | função de criação |
| N6 | `status = 'assinado'` exige `assinada_em` e todas as assinaturas exigidas presentes | trigger de derivação |
| N7 | Instância assinada **nunca** vai para `expirado` ou `cancelado` — a eficácia expira, o ato não | trigger |
| N8 | `eficaz_ate` só existe se o documento declarar prazo; expirar não altera o estado da assinatura | `check` + derivação |
| N9 | Só o **regime instrumento** gera instância | `check` contra o regime do documento |

**Exceção nomeada à N2:** as únicas colunas mutáveis são `status`, `assinada_em`, `eficaz_de` e `eficaz_ate` — todas **derivadas de atos**, nunca digitadas. O trigger append-only recusa alteração em qualquer outra, e recusa `DELETE` sempre. Sem essa exceção explícita, o estado da assinatura não poderia evoluir; com ela irrestrita, o conteúdo assinado poderia ser reescrito.

**Sobre `case_id`:** a Procuração é condicional a um caso concreto (D-5), e o Contrato não é. Por isso o vínculo é opcional e nunca obrigatório por regime.

## 3.4 Assinaturas

**Duas entidades, porque expectativa e fato são coisas diferentes.**

### Assinantes exigidos — a expectativa

```
curadoria.legal_instance_signers

  id                  uuid pk
  instance_id         → legal_document_instances (cascade)
  papel               curadoria.legal_signer_role not null
  ordem               smallint not null        -- sequência, quando houver
  obrigatorio         boolean not null default true

  -- Quem é esperado, quando já se sabe
  profile_id          → profiles (set null)
  professional_profile_id → professional_profiles (set null)
  identificacao_declarada jsonb                -- nome/CPF de quem não tem conta
                                               -- (testemunha, representante)
  unique (instance_id, papel, ordem)
```

Nasce da cópia de `assinantes_exigidos` da versão, no momento da geração da instância. **É aqui que D-6 e D-7 aterrissam sem refatoração:** se o Jurídico mantiver as duas testemunhas, a instância nasce com quatro linhas; se ajustar o fecho, nasce com duas. O esquema é o mesmo.

### Assinaturas praticadas — o fato, no livro único

Não há tabela nova de assinatura. O ato entra em `legal_acceptances` — o mesmo livro, pelo mesmo argumento que a migration `20260803150000` usou ao acomodar o profissional sem criar uma segunda tabela: **auditoria com dois livros é auditoria com duas verdades.**

```
legal_acceptances (extensões)

  + instance_id       → legal_document_instances (restrict)
  + signer_id         → legal_instance_signers (restrict)
  + instancia_hash    text          -- cópia carimbada do hash da instância
  + nivel             curadoria.legal_signature_level not null default 'N1'
  + provedor          text          -- N3: quem produziu a evidência externa
  + evidencia_externa jsonb         -- N3: protocolo, id de transação, cadeia
  + declaracao_de_vontade text      -- N2: nome digitado, conferido no servidor
  + especie           GERADA: instance_id is null → 'aceite' | 'assinatura'
```

**Campos já existentes que a assinatura reaproveita integralmente:** `aceito_em`, `ip`, `user_agent`, `idioma`, `origem`, `contexto`, `natureza`, `registrado_por`, `forma_de_obtencao`, `evidencia_ref`. Nada disso precisa ser recriado — é a mesma evidência de circunstância, para um ato de espécie diferente.

**Evidência declarada pelo servidor.** Nada que compõe a prova vem do cliente: `nivel` é derivado do caminho efetivamente percorrido; `instancia_hash` e `conteudo_hash` são lidos do banco; `ip` e `user_agent` vêm do cabeçalho da requisição no servidor (como `actions.ts` já faz); `aceito_em` é do banco. O cliente informa **apenas identificadores** e a declaração de vontade digitada — que o servidor confere contra o cadastro antes de gravar.

**Status do assinante é derivado**, nunca gravado: existe assinatura não revogada para aquele `signer_id` → assinado; não existe → pendente. Um `status` gravado poderia divergir do livro, e o livro é a verdade.

**Ordem entre assinantes** é declarada em `legal_instance_signers.ordem`. Se a ordem for vinculante — assinar fora de sequência é erro? — é decisão que só faz sentido depois de D-6. A estrutura registra a ordem; a **imposição** dela fica desligada até haver resposta.

## 3.5 Eventos jurídicos

O pedido é separar oito eventos. A regra desta especificação: **cada evento tem tipo próprio na trilha, e ganha tabela própria apenas quando carrega campos que os outros não têm.** Colapsar dois eventos em um tipo é o que se proíbe; multiplicar tabelas sem necessidade é o que se evita.

| Evento | Onde o fato mora | Tipo na trilha (`audit_action`) | Campos próprios |
|---|---|---|---|
| **Aceite** (adesão) | `legal_acceptances`, `especie='aceite'` | `legal_acceptance_registered` | — |
| **Assinatura** (instrumento) | `legal_acceptances`, `especie='assinatura'` | `legal_document_signed` **(novo)** | nível, instância, signatário, declaração |
| **Revogação integral** | `legal_acceptance_revocations`, `escopo is null` | `legal_acceptance_revoked` | motivo, circunstância |
| **Revogação por escopo** | `legal_acceptance_revocations`, `escopo` preenchido | `legal_scope_revoked` **(novo)** | código do escopo declarado na versão |
| **Rescisão** | `legal_instrument_terminations` **(nova)** | `legal_instrument_terminated` **(novo)** | causa, aviso prévio, efeitos sobreviventes |
| **Substituição de versão** | `legal_document_versions` + `instancia_substituida_id` | `legal_document_published` / `legal_instance_superseded` **(novo)** | versão anterior, motivo |
| **Download** | `legal_document_downloads` **(nova)** | `legal_document_downloaded` **(novo)** | ator, artefato, motivo, circunstância |
| **Emissão de prova** | `legal_artifacts` **(nova)** | `legal_proof_issued` **(novo)** | destinatário, escopo do pacote, hash |

### Revogação: o delta em `legal_acceptance_revocations`

```
legal_acceptance_revocations (extensões)

  + escopo        text     -- null = integral; preenchido = por escopo
  + escopo_rotulo text     -- o rótulo legível, copiado da versão

  -- Substituir o índice único atual:
  -  unique (acceptance_id)                       -- uma revogação por aceite
  +  unique (acceptance_id, coalesce(escopo, ''))  -- uma por aceite E escopo
```

**Por que a troca é segura:** o índice atual impede duas revogações do mesmo aceite — o que é correto para revogação integral e impeditivo para revogação por escopo, que é plural por natureza (imagem hoje, currículo depois). O novo índice preserva a garantia original (uma integral por aceite) e libera a plural. A tabela é append-only; a troca de índice não altera linha alguma.

**Validação:** revogação por escopo só aceita código presente em `escopos_revogaveis` da versão assinada. Escopo não declarado é erro, não texto livre.

### Rescisão

```
curadoria.legal_instrument_terminations

  id                     uuid pk
  instance_id            → legal_document_instances (restrict)
  causa                  curadoria.legal_termination_cause not null
  motivo                 text
  aviso_previo_dias      smallint          -- quando a causa for denúncia
  comunicada_em          timestamptz
  efetivada_em           timestamptz not null
  registrada_por         → profiles (set null)
  efeitos_sobreviventes  text              -- Contrato 10.4
  append-only por trigger
```

**Por que tabela própria e não uma revogação com rótulo diferente:** revogação é ato sobre **consentimento**, rescisão é ato sobre o **vínculo**. Confundi-las faria o sistema afirmar que o contrato nunca valeu, quando o que houve foi término — e a cláusula 10.4 do Contrato recebido diz o contrário de forma expressa. Além disso, os campos não se sobrepõem: aviso prévio, causa e efeitos sobreviventes não existem em revogação.

**Consequência de produto:** rescisão **não** reabre pendência de aceite. Encerra a relação. Quem rescindiu não volta à tela de assinatura — vai para um estado de conta encerrada, que é assunto de G2 em diante.

## 3.6 Funções novas

| Função | Garante |
|---|---|
| `criar_instancia_de_documento(version_id, sujeito, variaveis, contexto)` | Versão vigente; regime instrumento; **todas** as `variaveis_requeridas` presentes e não vazias; renderiza; copia `conteudo_hash`; cria os `signers` a partir de `assinantes_exigidos`; devolve a instância pronta |
| `assinar_instancia(instance_id, signer_id, declaracao, ip, user_agent)` | Assinante exigido e ainda pendente; instância não expirada nem cancelada; carimba os dois hashes, o nível e a circunstância; deriva `status` e `assinada_em`; calcula `eficaz_de`/`eficaz_ate` |
| `revogar_por_escopo(acceptance_id, escopo, motivo, ...)` | Escopo declarado na versão; titular do ato; grava sem tocar na assinatura |
| `rescindir_instrumento(instance_id, causa, ...)` | Papel autorizado; não confunde com revogação; registra efeitos sobreviventes |
| `snapshot_do_protocolo(professional_profile_id)` | Leitura pura da Base de Evidências, devolvendo itens e hash (§5) |
| `verificar_prova(hash)` | Dado um hash, responde se é de versão ou de instância — sem devolver conteúdo pessoal |

Todas `security definer`, com `search_path` fixo, escrita da trilha **dentro da própria função** — trilha escrita pela aplicação é trilha que um caminho novo esquece.

## 3.7 RLS do delta

| Objeto | Leitura | Escrita |
|---|---|---|
| `legal_document_instances` | Titular (própria), administrador; curador quando o sujeito é perfil profissional. **Nunca `anon`** — contém dado pessoal | Só pelas funções |
| `legal_instance_signers` | Igual à instância | Só pelas funções |
| `legal_instrument_terminations` | Titular e administrador | Só pela função |
| `legal_document_downloads` | **Só administrador** | Só pela função, antes de emitir a URL |

**A diferença que não pode ser copiada por engano:** `legal_document_versions` é legível por `anon` porque documento publicado é público por natureza. **Instância não é.** Repetir a policy pública sobre instâncias exporia contratos assinados com nome, CPF e endereço.

---

# 4. Compatibilidade

## 4.1 O modelo atual continua inteiro

Nenhuma tabela é renomeada, nenhuma coluna removida, nenhuma função alterada em assinatura ou semântica. Todo o delta é **aditivo**:

| Estrutura existente | Depois do delta |
|---|---|
| `legal_documents` | Ganha `regime` com default `'adesao'` — todo documento existente permanece Adesão sem intervenção |
| `legal_document_versions` | Ganha colunas nulas; publicação atual continua válida |
| `legal_acceptances` | Ganha colunas nulas; **`instance_id` nulo é o aceite de adesão de hoje** |
| `register_legal_acceptances` | **Não é tocada.** Continua sendo a porta da Adesão |
| `revoke_legal_acceptance` | **Não é tocada.** Continua sendo a revogação integral |
| `register_professional_acceptances` | **Não é tocada** |
| `versao_vigente`, `pendencias_legais_do_profissional` | **Não são tocadas** |
| Policies e grants existentes | Preservados; o delta só acrescenta |

**Por que não estender `register_legal_acceptances` para assinar instrumentos:** aquela função tem nove testes de integração que descrevem seu comportamento exato. Sobrecarregá-la faria a assinatura de instrumento herdar validações pensadas para adesão e obrigaria a reescrever provas já dadas. `assinar_instancia` é função nova, com testes novos, e o contrato antigo permanece verdadeiro.

## 4.2 Estado dos dados

As seis tabelas do módulo estão **vazias em todos os ambientes** — nenhum documento foi publicado (lacuna L1). Isso torna o delta trivialmente seguro. Ainda assim, o incremento de implementação deve **verificar a contagem antes de aplicar**, e não assumir: se houver linha, a constraint condicional entra como `NOT VALID` seguida de `VALIDATE`, sem bloquear.

## 4.3 Como não confundir aceite de Adesão com assinatura de Instrumento

Três camadas de separação, para que a distinção não dependa de disciplina de quem escreve consulta:

1. **Coluna gerada `especie`** — `instance_id is null → 'aceite'`, senão `'assinatura'`. Derivada, não digitada; impossível divergir do fato.
2. **Duas visões nomeadas** — `legal_acceptances_de_adesao` e `legal_signatures`, cada uma servindo a superfície correspondente. Nenhuma tela precisa filtrar à mão.
3. **Constraint condicional ao regime** — documento de regime instrumento **exige** `instance_id` e `instancia_hash`; documento de adesão **proíbe** ambos. Um aceite de instrumento sem instância deixa de ser possível.

**Na camada de aplicação**, a mesma separação:

| Hoje | Depois |
|---|---|
| `pendenciasDeAceite()` — pura, 8 testes | Preservada, **sem alteração**, atendendo Adesão |
| — | `pendenciasDeInstrumento()` — nova função pura, com a regra própria: pende quando não há instância assinada e vigente da versão vigente |
| `carregarEstadoDeGovernanca()` | Compõe as duas listas em uma só, mantendo a assinatura de retorno |
| `AceiteRegistrado` | Ganha campos opcionais; `ListaDeAceites` continua funcionando sem alteração |

A regra de pendência de instrumento **não é** a de adesão com outro nome. Diferenças: instância assinada por outro titular não conta; instância expirada na eficácia (Procuração vencida) volta a pender **se o caso ainda exigir representação**; e instrumento condicional só pende quando o evento que o exige aconteceu (D-5).

## 4.4 Ordem de aplicação do delta

Cinco passos, cada um aplicável e reversível de forma independente:

```
1. Tipos novos                          (nenhum impacto em dado existente)
2. Colunas aditivas nas tabelas atuais  (defaults preservam o comportamento)
3. Tabelas novas + RLS + grants         (isoladas; nada as referencia ainda)
4. Funções novas + trilha               (não substituem nenhuma existente)
5. Constraints condicionais ao regime   (por último: dependem de 2 e 3)
```

**Rollback:** inverso exato, exceto os valores de enum — Postgres não os remove, e a arquitetura já registra isso como irreversível por desenho.

---

# 5. Interface com o Protocolo da Prática

**Nada no Protocolo é alterado.** Esta seção define apenas como um instrumento futuro poderá referenciá-lo.

## 5.1 O que existe hoje, verificado

- `curadoria.practice_protocol_drafts` — **uma linha por profissional**, `responses jsonb`, reescrita à vontade. É área de trabalho, **não é evidência**.
- `curadoria.practice_evidence` — append-only, `unique (professional_profile_id, subcriterion_code, version)`, leitura corrente = `max(version)`. Cada linha carrega `options`, `details`, `condition_note`, `observation`, proveniência da coleta (`source_tier`, `source`, `collected_at`, `collected_by`), `status` e proveniência da verificação.

**Achado que determina o desenho: não existe entidade "submissão".** A submissão do Protocolo materializa-se como **um conjunto de versões** gravadas em `practice_evidence`. Não há id de submissão, não há data de submissão, não há autor de submissão em uma linha só.

## 5.2 Consequência

Referenciar "a submissão vigente" apenas por `professional_profile_id` + data **não é reconstituível**: `max(version)` de hoje não é o de ontem, e recompor o conjunto histórico exigiria raciocínio temporal sobre uma tabela que não guarda quando cada versão deixou de ser corrente.

**Por isso a referência precisa ser explícita, não computada.**

## 5.3 A interface

O instrumento carimba, no momento da assinatura, **a lista dos itens exatos** que compunham a declaração, mais o hash do conjunto:

```
artefato_tipo  = 'protocolo_da_pratica'

artefato_ref   = {
  professional_profile_id,
  catalog_version,                     -- ex.: '1.1.0'
  itens: [ { evidence_id, subcriterion_code, version } ],  -- a lista EXPLÍCITA
  itens_total,
  colhido_em,                          -- max(collected_at) do conjunto
  autores: [ collected_by distintos ]  -- quem colheu
}

artefato_hash  = sha256( serialização canônica do conjunto )
```

**Serialização canônica** — definida uma vez e nunca alterada sem versionar o algoritmo: itens ordenados por `subcriterion_code` ascendente; para cada item, os campos que compõem a declaração (`subcriterion_code`, `version`, `options` ordenadas, `details` com chaves ordenadas, `condition_note`, `observation`); separadores fixos; UTF-8; sem espaços supérfluos. Proveniência e estado de verificação **ficam fora do hash**: verificar uma evidência depois não pode invalidar a declaração de veracidade que o profissional fez sobre o **conteúdo**.

**Reconstituição:** com `evidence_id` e `version` explícitos, o conjunto é recuperável linha a linha, mesmo anos depois e mesmo com dezenas de versões novas por cima — porque `practice_evidence` é append-only e nada é apagado. Recalcula-se o hash e compara-se com o carimbado. Bate: a declaração é exatamente aquela. Não bate: houve alteração, e a divergência é demonstrável.

## 5.4 Função de leitura

```
snapshot_do_protocolo(professional_profile_id)
  → { itens[], itens_total, colhido_em, autores[], hash }
```

**Somente leitura.** Não escreve em `practice_evidence`, não cria submissão, não altera rascunho, não muda status de verificação. É chamada na geração da instância do Termo de Idoneidade e em nenhum outro lugar.

## 5.5 Fronteira

O vínculo é **opcional e genérico** (`artefato_tipo`): serve ao Termo de Idoneidade hoje e a qualquer instrumento futuro que declare conteúdo de outra parte do sistema. O módulo de governança **não** passa a conhecer a Base de Evidências: ele guarda uma referência opaca e um hash. Quem sabe montar o snapshot é o domínio do Protocolo — a função vive lá, e o acoplamento é de uma direção só.

---

# 6. Plano de testes

Os nove testes pedidos, mais o que a leitura mostrou ser necessário. Cada um com camada, o que prova e o que falharia sem ele.

## 6.1 Contrato de regressão

**Os 25 casos existentes (§2.8) devem passar sem alteração.** Qualquer necessidade de editá-los é sinal de que o delta mudou semântica existente — o que exige decisão explícita, nunca ajuste de teste.

## 6.2 Testes do delta

| # | Teste | Camada | Prova | Sem ele |
|---|---|---|---|---|
| **T1** | Instrumento não muda depois de gerado | Integração | `UPDATE` em `corpo` ou `variaveis` levanta exceção; `DELETE` idem; a exceção nomeada (`status`, datas) continua permitida | O conteúdo assinado poderia ser reescrito — a prova morreria em silêncio |
| **T2** | Hash muda se qualquer campo mudar antes do congelamento | Integração | Duas instâncias da mesma versão com uma variável diferente produzem `instancia_hash` diferente; iguais produzem iguais | Um instrumento poderia ser trocado por outro sob o mesmo hash |
| **T3** | Assinatura aponta para o conteúdo exato | Integração | O `instancia_hash` carimbado no ato é idêntico ao da instância, e o SHA-256 do `corpo` recuperado bate com ambos | A prova apontaria para conteúdo indeterminado |
| **T4** | Versão-modelo permanece rastreável | Integração | Publicada nova versão do modelo, a instância assinada continua apontando para a versão de origem, com o `conteudo_hash` daquela redação | Não se saberia sob qual redação a pessoa assinou |
| **T5** | Revogação parcial não apaga a assinatura histórica | Integração | Revogado o escopo, a assinatura continua legível e íntegra; a revogação é linha nova; segunda revogação do **mesmo** escopo é recusada; de **outro** escopo é aceita | D-4 seria inexequível ou destrutiva |
| **T6** | Rescisão não se confunde com revogação | Integração | Rescindir grava em `legal_instrument_terminations` com tipo próprio na trilha; **não** cria revogação; **não** reabre pendência de aceite; a assinatura permanece vigente como fato histórico | O sistema afirmaria que o contrato nunca valeu |
| **T7** | Download gera evento | Integração | Emissão de URL assinada grava `legal_document_downloads` **antes** da emissão; falha ao registrar impede a emissão | ADR-055 descumprida; acesso sem autor |
| **T8** | Documento do profissional não é exposto ao paciente | Integração (RLS) | Paciente autenticado e `anon` não leem instância, assinatura, artefato nem evidência de profissional — nem por consulta direta, nem por junção | Vazamento entre audiências |
| **T9** | Protocolo vinculado é reconstituível pelo hash | Integração | Gerado o snapshot e assinado o Termo, novas versões de evidência são criadas por cima; a reconstituição pelos `evidence_id`+`version` carimbados recompõe o conjunto e o hash bate | A declaração de veracidade recairia sobre dados irreconstituíveis |

## 6.3 Testes adicionais que a leitura exigiu

| # | Teste | Camada | Prova |
|---|---|---|---|
| **T10** | Instrumento com lacuna não nasce | Integração | Faltando qualquer `variaveis_requeridas`, a criação é recusada — nunca se gera instância com marcador não substituído |
| **T11** | Estado da assinatura é derivado | Integração | Com dois assinantes exigidos e um assinado, `status` permanece `aguardando_assinaturas`; assinado o segundo, vira `assinado` com `assinada_em` — sem ninguém escrever o estado |
| **T12** | Eficácia e assinatura são eixos independentes | Integração/Unit | Instrumento com `eficaz_ate` no passado continua `assinado` e passa a ser ineficaz; a consulta de "representação vigente" o exclui, a de "assinou?" o inclui |
| **T13** | Adesão e Instrumento não se confundem | Integração | Documento de regime instrumento recusa aceite sem instância; documento de adesão recusa aceite **com** instância; `especie` classifica corretamente os dois |
| **T14** | Escopo não declarado é recusado | Integração | Revogação com código ausente de `escopos_revogaveis` da versão assinada é erro |
| **T15** | Instância não pode ser gerada sobre versão superada | Integração | Espelha a garantia já provada para aceite, agora na porta nova |
| **T16** | Pendência de instrumento condicional só existe após o evento | Unit | A Procuração não pende no onboarding; passa a pender quando o caso declara necessidade de representação (D-5) |
| **T17** | Nível de assinatura vem do servidor | Integração | Cliente que envia `nivel: 'N3'` sem evidência externa grava o nível real do caminho percorrido |
| **T18** | Trilha existe para cada evento | Integração | Cada um dos oito eventos produz exatamente uma linha em `audit_logs`, com ator correto e tipo próprio — nenhum colapsa no tipo de outro |

## 6.4 Onde cada camada roda

- **Unit** (`tests/unit/`, vitest) — regras puras: pendência, eficácia, classificação. Sem banco, como `governanca-documentos.test.ts` já faz.
- **Integração** (`tests/integration/`, Supabase local) — tudo que depende de trigger, constraint, RLS e `security definer`. **Atenção operacional:** a stack local é compartilhada com worktrees; suítes longas exigem a stack quieta.
- **E2E** — nada em G0. A primeira tela só existe em G1.

---

# 7. Primeiro incremento executável após aprovação do G0

**G0.1 — Fundação do regime de Instrumentos no banco.** Um incremento, uma migration, nenhuma tela.

```
Entrega
  · tipos novos (§3.1)
  · colunas aditivas em legal_documents e legal_document_versions (§3.2)
  · legal_document_instances + legal_instance_signers (§3.3, §3.4)
  · extensões de legal_acceptances, com a coluna gerada `especie` (§3.4)
  · troca do índice único de revogações + colunas de escopo (§3.5)
  · legal_instrument_terminations (§3.5)
  · funções criar_instancia_de_documento e assinar_instancia (§3.6)
  · RLS e grants do delta (§3.7)
  · testes T1–T6, T10, T11, T13, T14, T15, T17

Não entrega
  · download, artefato e trilha de auditoria (G2/G4/G5, já previstos)
  · snapshot do Protocolo (G0.2)
  · qualquer tela
  · qualquer documento publicado

Evidência de conclusão
  · os 23 testes existentes passam sem alteração
  · os testes novos passam contra o banco local
  · nenhum documento publicado, nenhuma linha em produção
```

> **Executado em 2026-08-03**, no branch `g0-1-regime-de-instrumentos`, pela migration
> `20260803160000_regime_de_instrumentos.sql` e por
> `tests/integration/governanca-instrumentos.integration.test.ts` (17 casos).
> Três diferenças deliberadas em relação a esta especificação estão registradas
> no relatório do incremento: (1) nenhum valor novo em `audit_action` — a trilha
> é do G2, e criar valor que ninguém escreve foi o erro de 140000;
> (2) `legal_event_type` não foi criado, pela mesma razão; (3) assinantes que
> não são o titular passaram a poder ser vinculados a uma conta declarada na
> versão publicada — sem isso, nenhum instrumento com dois assinantes se
> completaria.

**G0.2 — Interface do Protocolo da Prática** (§5): função `snapshot_do_protocolo`, serialização canônica, testes T9 e T12. Separado porque toca outro domínio e pode ser revisto sem devolver G0.1.

**Depois disso**, e só depois, G1 (rota `/aceites`, gate ligado) e G2 (trilha), na ordem já prevista.

---

# 8. O que continua bloqueado

| Decisão | Quem | O que trava | O que **não** trava |
|---|---|---|---|
| **D-3** — nível de assinatura | Jurídico | A tela de assinatura em G3 | G0.1: a estrutura oferece N1/N2/N3 e nenhum é presumido |
| **D-6** — testemunhas e forma do Contrato | Jurídico | Publicar o Contrato; o tamanho real de G3 | G0.1: `legal_instance_signers` comporta 2 ou 4 assinantes sem mudança |
| **D-7** — representante legal | Jurídico | Atender paciente representado | G0.1: `legal_signer_role` já prevê o papel |
| **D-8** — prazo de DSR | Jurídico | G8 | G0, G1, G3 |
| **Escopos revogáveis** (lacuna 21) | Jurídico | Ligar a revogação por escopo na prática | G0.1: `escopos_revogaveis` nasce vazio e só a integral opera |
| **Razão social, CNPJ, sede** (lacuna 1) | Jurídico | Publicar qualquer instrumento | Todo o G0 |
| **Contrato do profissional** (lacuna 10) | Jurídico | Completar o dossiê | Todo o G0 |

**Nenhuma delas bloqueia G0.1.** Foi esse o critério de desenho: onde a resposta jurídica muda o comportamento, ela muda dado publicado, não esquema.

---

**Status:** especificação aguardando aprovação. Aprovada, G0.1 pode ser implementado — e as decisões D-4 e D-5, já aprovadas, viram ADRs em `docs/DECISIONS.md` no mesmo ciclo.
