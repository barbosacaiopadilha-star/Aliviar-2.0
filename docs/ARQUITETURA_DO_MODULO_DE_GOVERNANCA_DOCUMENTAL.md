# Arquitetura do Módulo de Governança Documental — Aliviar 1.0

Especificação oficial do módulo que transforma documentos jurídicos em parte da experiência do produto: publicação versionada, aceite auditável, assinatura eletrônica, evidência preservada e download controlado.

**Revisão 2 — 2026-08-03.** Correção de regime documental após a leitura integral dos cinco documentos jurídicos recebidos.

| Rev. | Data | O que mudou | Por quê |
|---|---|---|---|
| 1 | 2026-08-03 | Versão inicial, escrita antes de os textos jurídicos estarem disponíveis | Projeto de arquitetura sobre o código existente |
| 2 | 2026-08-03 | **Os cinco documentos recebidos passam de Adesão para Instrumento** (§2.3); modelo/versão/instância explicitados (§4.2); vigência própria do instrumento (§5.3); revogação por escopo e rescisão separadas (§4.4); vínculo opcional com artefato (§4.2); D-4 e D-5 aprovadas (§19) | A revisão 1 classificou quatro dos cinco como Adesão sem ter lido os textos. Os cinco nomeiam e qualificam o titular **dentro do corpo assinado** — nenhum é texto idêntico para todos. Ver [`DECISOES_DO_MODULO_DE_GOVERNANCA_DOCUMENTAL.md`](DECISOES_DO_MODULO_DE_GOVERNANCA_DOCUMENTAL.md) e [`ESPECIFICACAO_G0_REGIME_DE_INSTRUMENTOS.md`](ESPECIFICACAO_G0_REGIME_DE_INSTRUMENTOS.md) |

**Consequência da revisão 2 no roadmap:** G3 (regime de instrumento) deixa de ser incremento posterior e passa a ser **pré-requisito de qualquer publicação dos cinco documentos**. G1 continua entregando catálogo ativo, rota de aceites e gate ligado — mas o primeiro documento em produção depende de G3. Ver §18.

**Natureza deste documento:** projeto de arquitetura. Nenhuma linha de código, migration, página ou documento jurídico é criada, alterada ou interpretada aqui. Nenhuma cláusula é lida como norma: cláusulas são insumo, e este documento trata do sistema que as carrega.

**Método:** leitura direta do código real — `supabase/migrations/20260803140000_governanca_documentos_aceites_lgpd.sql`, `supabase/migrations/20260803150000_governanca_aceite_do_profissional.sql`, `src/modules/governanca/*`, `src/modules/profiles/{patient,professional}-document-repository.ts`, `src/components/governanca/*`, `src/app/(public)/legal/*`, `src/app/paciente/documentos-e-consentimentos/`, `src/app/admin/profissionais/[id]/`, `src/middleware.ts` — cruzada com `docs/DECISIONS.md` (ADR-018, ADR-047, ADR-048, ADR-054, ADR-055, ADR-056, ADR-060, ADR-064), `docs/PATIENT_ENTRY_ARCHITECTURE.md` e `docs/DOCUMENTATION_GOVERNANCE_POLICY.md`.

**Convenção de leitura:** cada afirmação está marcada como **[HOJE]** (verificado no código publicado), **[LACUNA]** (ausente e necessário) ou **[PROPOSTO]** (desenho deste documento, ainda não implementado).

---

## 0. Estado verificado antes de projetar

Projetar sem isto produziria um módulo duplicado. O que existe hoje, em produção:

**[HOJE] Banco — o livro de documentos, versões e atos.** `curadoria.legal_documents`, `curadoria.legal_document_versions`, `curadoria.legal_acceptances`, `curadoria.legal_acceptance_revocations`, `curadoria.data_subject_requests`, `curadoria.data_subject_request_items`. Regras já garantidas pelo banco, não pelo código de aplicação:

- o **texto integral** mora em `legal_document_versions.conteudo` — nunca um caminho de arquivo;
- o **hash é coluna gerada** (`sha256` sobre `conteudo`): gerador e verificador não podem divergir, e o cliente nunca informa hash;
- versões, aceites e revogações são **append-only por trigger** (`enforce_legal_append_only`) — `UPDATE`/`DELETE` levantam exceção;
- o aceite carrega **cópia carimbada do hash**, tornando a prova autocontida;
- a escrita passa obrigatoriamente por `register_legal_acceptances` (`security definer`), que valida vigência e carimba o hash do servidor; `INSERT` direto não é concedido a `authenticated`;
- o aceite do profissional tem **natureza declarada** (`eletronico_pelo_titular` | `registrado_pela_equipe`), sujeito exclusivo (conta XOR perfil profissional), `registrado_por` e `forma_de_obtencao` obrigatórios no registro pela equipe;
- `pendencias_legais_do_profissional()` **responde** o que falta, sem bloquear nada.

**[HOJE] Aplicação.** `src/modules/governanca/documentos.ts` (domínio puro: vigência, pendência, permalink), `repository.ts` e `professional-repository.ts` (leitura por RLS, escrita por RPC), `actions.ts` e `professional-actions.ts` (coleta de IP e user-agent do cabeçalho), `gate.ts` (gate de aceite no servidor, com as exceções de rotas livres). Componentes: `DocumentoLegalView`, `PaginaDeDocumento`, `ListaDeAceites`.

**[HOJE] Superfícies.** Portal público de leitura (`/termos`, `/privacidade`, `/consentimentos/[slug]`, `/legal/[slug]/v/[versao]` — o permalink de prova) e a área do paciente `/paciente/documentos-e-consentimentos`.

**[HOJE] Cobertura de teste.** `tests/integration/governanca-aceites.integration.test.ts` prova: hash gerado pelo banco, imutabilidade de versão e de aceite, recusa de versão superada, revogação que não apaga, `INSERT` direto recusado no privilégio, e registro pela Curadoria com forma de obtenção obrigatória.

### 0.1 Lacunas verificadas

| # | Lacuna | Evidência | Efeito |
|---|---|---|---|
| L1 | **Nenhum documento publicado.** As tabelas estão vazias e não existe ferramenta de publicação — a escrita é de `service_role` e nenhum script ou tela a exerce. | `scripts/` não tem publicador; `legal_documents` sem seed | Todo o módulo está inerte |
| L2 | **A rota `/aceites` não existe.** `gate.ts` redireciona para ela. | `src/app/` não tem `aceites/`; `gate.ts:83` | O gate, se ligado hoje, levaria a 404 |
| L3 | **O gate não é chamado por nenhum layout.** `requireAceitesEmDia` não tem ponto de uso. | busca por chamadas: só a própria definição | Não há bloqueio real; o aceite é opcional de fato |
| L4 | **Os atos de governança não entram no livro de auditoria.** Os valores `legal_document_published`, `legal_acceptance_registered`, `legal_acceptance_revoked`, `professional_acceptance_registered` foram adicionados ao enum `audit_action` e **nada os escreve**. | migrations 140000/150000; `curadoria.audit_logs` sem gatilho | AU-03 fica meio fechado |
| L5 | **Não existe regime de documento personalizado.** O modelo suporta texto único para todos. Contrato e Procuração carregam nome, qualificação e objeto do titular. | `legal_document_versions.conteudo` é o texto da versão, não da pessoa | Assinar-se-ia o modelo, não o instrumento |
| L6 | **Não existe download de documento jurídico.** `DocumentsPanel` faz upload e exclusão; não há link de leitura nem `createSignedUrl` em lugar algum do código. | `src/components/profiles/documents-panel.tsx`; busca por `createSignedUrl` sem resultado | O dossiê do profissional não é consultável |
| L7 | **A exclusão de documento é destrutiva e sem trilha.** `deleteProfessionalDocument` apaga a linha e o objeto, sem confirmação, sem tombstone, sem auditoria — o oposto do que a ADR-054 decidiu. | `professional-document-repository.ts:90` | Perda de evidência possível |
| L8 | **Não há log de download.** A ADR-055 decidiu registrar download de documento clínico como escopo mínimo da v1. | nenhuma tabela de download | Decisão aprovada não implementada |
| L9 | **Não há geração de PDF.** O único artefato imprimível é uma página com CSS de impressão (`/paciente/curadoria/imprimir`). | `src/app/paciente/curadoria/imprimir/page.tsx` | Nenhum artefato entregável fora da tela |

Estas nove lacunas são o backlog real. O roadmap da §18 as endereça em ordem de dependência.

---

## 1. Objetivos do módulo

1. **Provar, anos depois, que aquela pessoa concordou com aquele texto naquele momento.** É o objetivo do qual todos os outros derivam. Tudo o que o enfraquece — texto em arquivo solto, hash calculado no cliente, registro editável — está proibido por desenho.
2. **Fazer o documento ser experiência, não anexo.** A pessoa lê no produto, decide no produto, encontra depois no produto, e nunca precisa pedir a ninguém uma cópia do que assinou.
3. **Ter uma única versão circulando.** Um documento tem exatamente uma versão vigente por vez; toda versão anterior continua endereçável para sempre, e nenhuma é reescrita.
4. **Tornar o ato auditável de ponta a ponta.** Quem, o quê, quando, de onde, sob qual texto, por qual caminho, com qual evidência — e quem registrou, quando o ato não foi eletrônico.
5. **Suportar crescimento sem refatoração.** Novo documento é *dado publicado*, nunca código novo. Nova audiência, novo momento de cobrança e novo nível de assinatura entram por configuração.
6. **Servir às duas jornadas assimétricas.** Paciente assina eletronicamente na tela; profissional não tem portal na 1.0 e seu aceite é registrado pela equipe, com proveniência declarada — e essa diferença nunca pode se apagar no registro.
7. **Nunca bloquear direito por falta de aceite.** O exercício de direitos LGPD e a leitura dos próprios documentos permanecem acessíveis mesmo com pendência aberta.

### 1.1 Não-objetivos

- **Não é módulo de pagamento.** "Contratar os serviços" no onboarding é, aqui, **a assinatura do Contrato de Prestação de Serviços**. Cobrança, meio de pagamento e faturamento não existem na 1.0 e não entram neste módulo (ver §19, decisão D-1).
- **Não interpreta cláusula.** O sistema não deriva regra de negócio do texto jurídico. Toda regra que o texto exigir entra como configuração explícita, decidida por quem assina o documento.
- **Não substitui parecer jurídico.** O nível de assinatura exigido por documento é decisão do jurídico; a arquitetura oferece os três níveis e registra qual foi usado.
- **Não é repositório de documento clínico.** Laudos e exames continuam em `patient_documents` (ADR-054). Este módulo governa o documento **jurídico**; o parentesco entre os dois está na §15.4.

---

## 2. Escopo

### 2.1 Dentro

| Domínio | Conteúdo |
|---|---|
| Catálogo | Documentos, audiência, obrigatoriedade, revogabilidade, regime, momento de cobrança |
| Ciclo de vida | Redação externa → pacote de publicação → aprovação → publicação → vigência → supersessão |
| Instrumentos | Instância personalizada por titular (Contrato, Procuração), com variáveis carimbadas |
| Atos | Aceite eletrônico, assinatura eletrônica, registro pela equipe, revogação |
| Evidência | Hash de texto e de instância, circunstância do ato, evidência externa, artefato derivado |
| Auditoria | Trilha em `audit_logs`, log de download, pacote de prova exportável |
| Distribuição | Leitura pública, permalink de versão, download por URL assinada com registro |
| Direitos | Pedidos de titular (DSR) e revogação, já modelados |

### 2.2 Fora

Redação e revisão jurídica dos textos; assinatura com certificado ICP-Brasil (previsto estruturalmente, não implementado na 1.0); Portal do Profissional (ADR-052); cobrança; contratos com terceiros e fornecedores; documento clínico.

### 2.3 Documentos da 1.0 *(corrigido na revisão 2)*

| Slug | Documento | Audiência | Regime | Obrigatoriedade | Revogação |
|---|---|---|---|---|---|
| `contrato-de-prestacao-de-servicos` | Contrato de Prestação de Serviços | paciente | **Instrumento** | obrigatório | não — **rescisão**, não revogação |
| `anexo-i-lgpd-do-contratante` | Anexo I — Termo LGPD do Contratante | paciente | **Instrumento** | obrigatório | **sim, integral** (texto, 8.1) |
| `procuracao-representacao-administrativa` | Procuração Particular para Representação Administrativa | paciente | **Instrumento** | **condicional** | **sim, integral, por escrito** (texto, 4.1) |
| `termo-lgpd-do-medico` | Termo LGPD do Médico Parceiro | profissional | **Instrumento** | obrigatório | **sim, por escopo** (texto, 9.1–9.2) |
| `termo-de-idoneidade-do-medico` | Termo de Idoneidade | profissional | **Instrumento** | obrigatório | **sim, por escopo** (texto, 8.2) |
| `politica-de-privacidade` | Política de Privacidade | paciente, profissional, equipe | Adesão | conforme jurídico | não |
| `termos-de-uso` | Termos de Uso | paciente | Adesão | conforme jurídico | não |

**A correção da revisão 2.** As cinco primeiras linhas eram Adesão na revisão 1. A leitura dos textos mostrou que **os cinco qualificam o titular dentro do corpo assinado** — o Contrato com oito campos de qualificação, o Anexo I abrindo com nome e CPF, a Procuração com a qualificação do outorgante, e os dois termos do médico com nome, CRM/UF, RQE e CPF; todos encerram com cidade, data e assinatura nominal. Dois titulares assinam textos diferentes derivados do mesmo modelo: isso é Instrumento, por definição da §4.2.

**A Adesão permanece.** Não é regime obsoleto: continua sendo o correto para documento cujo texto é **idêntico para todos os titulares**, sem campo algum preenchido por pessoa — Política de Privacidade, Termos de Uso, políticas de cookies e futuros avisos gerais. Nesses, a peça de prova é o par (texto vigente, ato carimbado), e o modelo já implementado basta sem nenhuma extensão. A regra de classificação é objetiva: **se o documento assinado contém qualquer campo preenchido com dado do titular, é Instrumento; se não contém nenhum, é Adesão.**

Os valores de obrigatoriedade e revogação são **dados de publicação**. A coluna de revogação acima não é proposta de engenharia: reproduz o que cada texto diz de si mesmo — ver a Parte 1 do documento de decisões.

---

## 3. Responsabilidades

| Ator | Responsabilidade | Limite |
|---|---|---|
| **Jurídico / Fundador (responsável LGPD, ADR-055)** | Redigir, aprovar, decidir versão material vs. editorial, obrigatoriedade, revogabilidade, prazo de DSR, nível de assinatura | Não opera o banco |
| **Administrador** | Publicar versão aprovada, gerir vigência, executar DSR, consultar dossiês, exportar prova | Não redige nem aprova o próprio texto (ADR-060) |
| **Curadoria (curador_medico)** | Registrar o aceite do profissional com forma de obtenção e evidência; consultar pendências legais na homologação | Não publica documento nem edita aceite |
| **Paciente** | Ler, aceitar, assinar, revogar o revogável, consultar o próprio histórico, exercer direitos | Não vê documento de outro titular |
| **Profissional** | Titular do ato registrado pela equipe | Sem superfície na 1.0 |
| **Módulo** | Vigência, pendência, hash, imutabilidade, trilha, URL assinada, artefato | Nunca decide conteúdo jurídico |

**Segregação de funções [PROPOSTO]:** publicar exige `aprovado_por` distinto de `published_by` quando ambas as contas existirem. A ADR-060 já previu a segunda conta; enquanto houver detentor único, o campo registra a coincidência em vez de escondê-la.

---

## 4. Tipos de documentos

A classificação que organiza todo o resto é o **regime**, porque ele determina o que é assinado.

### 4.1 Regime de Adesão

Um texto, idêntico para todos, publicado por versão. O ato do titular é **aderir**. A peça de prova é o par (texto vigente, ato carimbado).

Exemplos: Anexo LGPD, Termo LGPD do Médico, Termo de Idoneidade, Política de Privacidade, Termos de Uso.

**[HOJE]** Totalmente suportado pelo modelo existente.

### 4.2 Regime de Instrumento

O documento só existe juridicamente **preenchido**: qualificação do titular, objeto, preço, prazo, foro, poderes outorgados. Duas pessoas assinam textos diferentes derivados do mesmo modelo. O ato é **assinar um instrumento**, e a peça de prova é o par (instância renderizada, ato carimbado) — mais o vínculo com a versão do modelo que a originou.

Exemplos: **os cinco documentos recebidos** — Contrato, Anexo I LGPD, Procuração, Termo LGPD do Médico e Termo de Idoneidade.

**[LACUNA L5]** Não suportado hoje. Assinar aqui a versão-modelo registraria concordância com um texto que contém marcadores em vez dos dados da pessoa — a prova apontaria para o documento errado.

#### 4.2.1 Modelo, versão e instância — três coisas distintas

Confundi-las é o erro que a revisão 2 corrige. A distinção, com a pergunta que cada uma responde:

| Camada | Entidade | Responde | Cardinalidade | Mutabilidade |
|---|---|---|---|---|
| **Modelo** | `legal_documents` | *Que documento é este?* Identidade, audiência, regime, obrigatoriedade, revogabilidade | 1 por documento | Metadados editáveis; identidade não |
| **Versão** | `legal_document_versions` | *Qual redação está valendo?* Texto do modelo com marcadores, vigência, hash da redação | N por modelo, 1 vigente por vez | **Imutável** após publicada |
| **Instância** | `legal_document_instances` **[PROPOSTA]** | *O que ESTA pessoa assinou?* Corpo renderizado com os dados dela, hash próprio | N por versão, 1 por titular e por ato | **Imutável** desde o nascimento |

Em uma frase: **o modelo diz o que é, a versão diz o que está escrito, a instância diz o que foi assinado.** No regime de Adesão, versão e instância coincidem — e por isso a Adesão não precisa da terceira camada.

#### 4.2.2 Os dois hashes

Todo ato sobre instrumento carimba **dois** hashes, e nenhum substitui o outro:

- **`conteudo_hash` — hash da versão de origem.** Prova qual redação-modelo estava vigente. É o que liga a assinatura de um titular à de todos os outros que assinaram sob a mesma redação, e o que permite responder "quantas pessoas assinaram a v2 do Contrato?".
- **`instancia_hash` — hash do conteúdo personalizado assinado.** Prova o que aquela pessoa efetivamente leu e assinou, com os dados dela dentro. É o hash que um perito confere contra o documento apresentado.

Os dois são **gerados pelo banco** e carimbados no ato, nunca informados pelo cliente e nunca recompostos por junção posterior. Perder qualquer um deles quebra metade da prova: só o da versão não identifica o instrumento; só o da instância não identifica a redação de origem.

#### 4.2.3 Snapshot imutável dos campos

A instância guarda, além do corpo renderizado, o **conjunto exato de campos que a produziu** (`variaveis`), congelado no mesmo instante. Não é redundância com o corpo: é o que permite responder, sem reprocessar texto, "qual era o endereço declarado quando ela assinou?" — e o que torna auditável qualquer divergência entre o cadastro de hoje e o instrumento de então.

O cadastro do titular continua evoluindo livremente. **O snapshot não acompanha.** Um endereço corrigido no perfil não reescreve o contrato assinado; se a correção precisar alcançar o instrumento, o caminho é nova instância — nunca edição.

#### 4.2.4 Assinantes esperados e estado da assinatura

Um instrumento pode exigir mais de uma assinatura. O Contrato, na redação recebida, prevê CONTRATADA, CONTRATANTE e **duas testemunhas** — questão aberta em D-6, e é justamente por estar aberta que a estrutura precisa comportar as duas respostas sem refatoração.

A instância declara, ao nascer, **quem precisa assinar e em que papel**; cada assinatura entra como ato próprio; e o **estado da assinatura** é derivado da comparação entre exigidos e obtidos:

```
rascunho → aguardando_assinaturas → assinado
                   ↓
              expirado | cancelado    (instância não assinada; nunca a assinada)
```

O estado é **derivado, nunca declarado à mão** — pela mesma razão que o hash é gerado pelo banco. E o instrumento só se torna eficaz quando todos os assinantes exigidos assinaram: assinatura parcial é estado real e visível, não meio-sucesso silencioso.

#### 4.2.5 Vínculo opcional com outro artefato

Uma instância pode apontar para **outro artefato do sistema cujo conteúdo ela declara** — com identificador e hash, para que a declaração seja reconstituível depois.

O caso concreto é o **Termo de Idoneidade**, cuja cláusula 2.1 declara verdadeiros "todos os dados fornecidos à PLATAFORMA". Esses dados são o **Protocolo da Prática** já implementado. Sem o vínculo, a declaração recai sobre um conjunto de dados que ninguém consegue reconstituir anos depois — o profissional atualiza a Base de Evidências e o que ele declarou some. O vínculo é **opcional** porque a maioria dos instrumentos não declara nada além de si mesmos. Interface arquitetural em [`ESPECIFICACAO_G0_REGIME_DE_INSTRUMENTOS.md`](ESPECIFICACAO_G0_REGIME_DE_INSTRUMENTOS.md) §5.

### 4.3 Eixos secundários (dados, não tipos)

- **Audiência** — `paciente` | `profissional` | `equipe` **[HOJE]**, array, um documento pode alcançar mais de uma.
- **Momento de cobrança** — `primeiro_acesso` | `contratacao` | `escolha_de_profissional` | `homologacao_profissional` | `portal_da_conta` **[PROPOSTO]**: hoje a origem existe no aceite (`legal_acceptance_origin`), mas **onde** cada documento é cobrado está implícito. Explicitá-lo em tabela é o que permite acrescentar documento novo sem tocar em código.
- **Obrigatoriedade** e **revogabilidade** — **[HOJE]**, colunas de `legal_documents`.
- **Nível de assinatura** — ver §7.

### 4.4 Revogação por escopo e rescisão *(novo na revisão 2 — decisão D-4 aprovada)*

A revisão 1 tratava revogação como ato único e total, espelhando `revoke_legal_acceptance`. Os textos recebidos exigem mais distinções, e elas não são sinônimos:

| Ato | O que atinge | Efeito | Documentos |
|---|---|---|---|
| **Revogação integral** | O consentimento inteiro daquele documento | Cessa o tratamento fundado nele, preservados os atos anteriores | Anexo I (8.1), Procuração (4.1) |
| **Revogação por escopo** | **Uma autorização específica dentro do documento** — imagem, currículo, exposição pública | Cessa apenas aquela autorização; o restante do documento continua vigente | Termo LGPD do Médico (9.1–9.2), Termo de Idoneidade (8.2) |
| **Rescisão** | O **vínculo contratual**, não um consentimento | Encerra a relação; obrigações de confidencialidade, proteção de dados e prestação de contas sobrevivem | Contrato (10.2, 10.4) |

**Três regras que decorrem disso:**

1. **Revogação nunca apaga assinatura.** O ato assinado é a prova de que houve consentimento; a revogação é um segundo ato que se soma a ele. Já garantido por trigger append-only.
2. **Revogação por escopo não invalida o instrumento.** Um Termo LGPD do Médico com a autorização de imagem revogada continua vigente para todo o resto. Modelar isso como revogação total produziria uma pendência falsa e recontrataria o médico sem necessidade.
3. **Rescisão não é revogação e não vive na mesma tabela conceitual.** É evento do vínculo, com data, motivo e efeitos que sobrevivem ao término — nunca um `legal_acceptance_revocations` sobre o aceite do Contrato. Confundi-las faria o sistema afirmar que o contrato "nunca valeu", quando o que houve foi término.

O que cada revogação por escopo produz de efeito operacional — em especial se a revogação de imagem despublica o perfil na Rede — permanece **decisão do Jurídico** (D-2/D-4).

---

## 5. Versionamento

### 5.1 Regras vigentes [HOJE]

1. Versão é **imutável**: publicada, nunca é editada nem removida (trigger append-only).
2. `unique (document_id, versao)` — o rótulo de versão é único por documento.
3. **Vigente** = a versão de maior `effective_at` já alcançado. Mesma regra nos dois lados (`curadoria.versao_vigente` e `documentos.ts:versaoVigente`), para que a tela nunca ofereça o que o banco recusaria.
4. `requires_reacceptance` separa **mudança material** (reabre pendência para quem já aceitou) de **correção editorial** (não incomoda ninguém). Quem decide é quem assina o documento.
5. Aceitar versão **não vigente** é recusado pelo banco — superada ou futura.

### 5.2 Complementos propostos

- **Rótulo semântico** `MAJOR.MINOR`: `MAJOR` para mudança material, `MINOR` para editorial — convenção validada na publicação contra `requires_reacceptance`, para que rótulo e efeito não se contradigam.
- **Vigência futura**: `effective_at` no futuro já é aceito pelo modelo; a tela pública passa a exibir "esta versão entra em vigor em ..." **[PROPOSTO]**, hoje o componente não distingue.
- **Encerramento**: documento que deixa de valer é desativado (`ativo = false`), nunca apagado; as versões continuam servindo o permalink.
- **Motivo da versão**: `motivo_da_mudanca text` **[PROPOSTO]** — o "porquê" da nova versão, exibido a quem é chamado a reaceitar. Reaceite sem explicação é ruído; com explicação, é informação.

### 5.3 Versionamento e vigência do instrumento [PROPOSTO]

A instância é imutável e aponta para a versão do modelo. Nova versão do modelo **não altera instância já assinada** — o contrato assinado continua sendo o que foi assinado. Se o novo texto precisar alcançar quem já assinou, o caminho é um **aditivo**: novo documento, novo ato, vinculado ao anterior (`instancia_substituida_id`). Reescrever a instância seria falsificar o instrumento.

**Vigência própria do instrumento assinado** *(novo na revisão 2)*. A vigência da **versão** (quando o modelo passa a valer para novas assinaturas) é coisa distinta da vigência do **instrumento** (por quanto tempo aquele documento assinado produz efeitos). A revisão 1 só previa a primeira.

A Procuração impõe a segunda: a cláusula 4.1 fixa prazo em meses a contar da assinatura. Uma procuração assinada **expira sozinha**, sem que ninguém pratique ato algum — e o sistema precisa saber disso para não afirmar que o paciente tem representação vigente quando não tem. O Contrato também tem prazo próprio (10.1). Os demais vigoram por prazo indeterminado (Idoneidade, 8.1) ou enquanto durar a relação.

Portanto a instância carrega **início e fim de eficácia**, derivados da assinatura e do prazo carimbado no snapshot — e um instrumento pode estar, ao mesmo tempo, **assinado** (estado da assinatura) e **expirado** (eficácia). Os dois eixos são independentes e nenhum deles é o outro.

---

## 6. Publicação

### 6.1 Fluxo proposto

```
Redação (fora do sistema, jurídico)
   ↓
Pacote de publicação versionado no repositório
   docs/legal/<slug>/<versao>/{documento.md, metadados.json}
   ↓
Revisão de engenharia (o pacote confere? variáveis declaradas existem?)
   ↓
Aprovação registrada (aprovado_por, aprovado_em)
   ↓
Publicação idempotente por script service-role  (banco = autoridade)
   ↓
Trilha em audit_logs: legal_document_published
   ↓
Verificação: hash do banco == sha256 do arquivo do pacote
```

**Por que o texto fica também no repositório sendo o banco autoritativo.** É o mesmo padrão já decidido para o Catálogo (ADR-047: banco autoritativo, espelho gerado e verificado). O arquivo é **insumo de publicação** com revisão em pull request; o banco é a **fonte de verdade** consultada pelo produto. A verificação de hash impede a divergência silenciosa que a ADR-047 combate. O que o produto lê, em qualquer superfície, é sempre o banco — nunca o arquivo.

### 6.2 Invariantes de publicação

- Publicar é ato de `service_role` — **nenhum cliente escreve** (já garantido por GRANT).
- Publicação é **idempotente**: reexecutar o mesmo pacote não cria versão nova; conteúdo diferente sob o mesmo rótulo é **erro**, nunca sobrescrita.
- Todo documento publicado tem: audiência não vazia, resumo em linguagem de gente, ao menos uma versão, e — se for instrumento — o conjunto de variáveis declarado.
- Publicação sem aprovação registrada é recusada.

### 6.3 Superfície administrativa [PROPOSTO — incremento G7]

Painel `/admin/governanca` para **consultar** catálogo, vigências, cobertura de aceite e pendências; e para **agendar vigência**. A publicação continua por ferramenta versionada: subir texto jurídico por formulário é o caminho mais curto para publicar o arquivo errado sem revisão.

---

## 7. Fluxo de assinatura eletrônica

### 7.1 Níveis suportados

A arquitetura declara **qual nível foi usado em cada ato**, sem decidir qual é exigido — essa decisão é do jurídico.

| Nível | Como se materializa aqui | Status |
|---|---|---|
| **N1 — Aceite autenticado** | Sessão autenticada + versão vigente + hash do servidor + IP + user-agent + timestamp | **[HOJE]** |
| **N2 — Assinatura com declaração de vontade** | N1 + instância personalizada + confirmação explícita (nome completo digitado e conferido contra o cadastro) + navegação comprovada até o fim do texto | **[PROPOSTO]** |
| **N3 — Assinatura com evidência externa** | N2 + provedor externo (certificado ICP-Brasil, OTP por canal distinto), com `provedor` e `evidencia_externa` carimbados | **[PROPOSTO — estrutural, não implementado na 1.0]** |
| **R — Registro pela equipe** | Ato do titular fora do sistema, registrado com `natureza`, `registrado_por`, `forma_de_obtencao`, `evidencia_ref` | **[HOJE]** |

O campo `nivel` nunca é informado pelo cliente: é derivado pelo servidor do caminho efetivamente percorrido. Um cliente adulterado não consegue declarar N3 tendo feito N1.

### 7.2 Fluxo do paciente — documento de adesão [HOJE, faltando a tela]

```
1. Servidor calcula pendências (audiência × obrigatórios × vigente × aceites não revogados)
2. Tela apresenta cada documento com texto integral, versão, vigência e permalink
3. Pessoa lê; a confirmação é ato deliberado por documento — nunca um "aceito tudo" único
4. Cliente envia APENAS os version_ids que viu
5. register_legal_acceptances: valida vigência, carimba hash do banco, grava com IP/UA
6. Ou todos entram, ou nenhum (a transação é da função)
7. Trilha: legal_acceptance_registered  [LACUNA L4]
8. Gate libera a superfície do papel
```

### 7.3 Fluxo do paciente — instrumento [PROPOSTO]

```
1. Sistema resolve as variáveis do titular (nome, qualificação, contato) do cadastro
2. Falta variável obrigatória → a tela pede o dado ANTES de renderizar o instrumento
   (um instrumento com lacuna não é oferecido para assinatura)
3. criar_instancia_de_documento(version_id, sujeito, variaveis)
      → renderiza o corpo final, imutável, com hash próprio
4. Pessoa lê o instrumento com os PRÓPRIOS dados na tela
5. Declaração de vontade: digita o nome completo; o servidor confere com o cadastro
6. assinar_instancia(instance_id, declaracao): carimba hash da instância + hash da
   versão-modelo + circunstância + nível
7. Artefato PDF é gerado e vinculado ao ato  (incremento G5)
8. Trilha: legal_document_signed
```

**Regra de ouro:** o hash assinado é o da **instância**; o hash da versão-modelo acompanha como procedência. Ambos são carimbados no ato — a prova nunca depende de recompor nada por junção de tabelas.

### 7.4 Fluxo do profissional [HOJE]

Sem portal (ADR-052), o ato é do titular e o **registro** é da equipe. A Curadoria informa forma de obtenção (obrigatória por constraint), evidência quando existir e a data real do ato — que pode ser anterior ao registro, nunca futura. A `natureza` mantém a distinção de peso jurídico entre registrar e assinar, e as constraints impedem que ela se apague.

**Quando o Portal do Profissional existir**, a única linha a rever é a constraint `legal_acceptances_natureza_do_sujeito` — revisão deliberada, não acidental.

### 7.5 O que nunca acontece

Aceite fora de sessão autenticada; hash vindo do cliente; aceite de versão não vigente; aceite de terceiro em nome do titular sem registrar quem o fez e como; assinatura sem texto exibido; "aceito tudo" que grave documentos não apresentados; edição ou exclusão de qualquer ato.

---

## 8. Modelo de auditoria

### 8.1 Três camadas complementares

**Camada 1 — Imutabilidade estrutural [HOJE].** Triggers append-only. Não é log: é a impossibilidade de o fato mudar. É a camada que a ADR-048 exige — toda imutabilidade prometida ao usuário mora no banco.

**Camada 2 — Trilha de atos [LACUNA L4].** `curadoria.audit_logs` (actor, action, target, metadata, created_at) já tem os valores de enum criados e ninguém escreve. Fechar isso significa: `legal_document_published`, `legal_acceptance_registered`, `legal_acceptance_revoked`, `professional_acceptance_registered`, e os propostos `legal_document_signed`, `legal_document_downloaded`, `legal_instance_created`. A escrita deve ocorrer **dentro das mesmas funções `security definer`** que praticam o ato — trilha escrita pela aplicação é trilha que um caminho novo esquece.

**Camada 3 — Log de acesso [LACUNA L8].** A ADR-055 decidiu registrar download de documento clínico como escopo mínimo. Aqui a decisão se estende ao documento jurídico: quem baixou, o quê, quando, por qual caminho. Sem isso, "quem viu a Procuração assinada?" não tem resposta.

### 8.2 O pacote de prova [PROPOSTO]

Exportável por ato, para um pedido judicial ou de titular:

```
Identificação do titular (e do perfil profissional, quando for o caso)
Documento, versão, vigência, permalink
Texto integral tal como exibido
Instância renderizada e suas variáveis, quando instrumento
Hash da versão + hash da instância + algoritmo
Data/hora do ato, IP, user-agent, idioma, origem, nível
Natureza; e no registro pela equipe: quem registrou, como obteve, evidência
Revogação, se houver, com data e motivo
Cadeia de versões anteriores aceitas pelo mesmo titular
Trilha de downloads do artefato
```

Autocontido por desenho: quem receber não precisa de acesso ao sistema para conferir. O SHA-256 do texto anexado tem de bater com o hash carimbado — conferência que qualquer perito faz com uma linha de comando.

### 8.3 Retenção

Aceites, revogações, instâncias e trilhas são retidos **indefinidamente** — são a prova dos atos (ADR-055). Um pedido de exclusão do titular alcança dado pessoal; não alcança a prova de que ele consentiu, sob pena de destruir a própria defesa das duas partes. Onde houver conflito entre eliminação e prova, o item do DSR é marcado `retido_por_obrigacao_legal` com fundamento — estado que o modelo já prevê.

---

## 9. Modelo de banco (arquitetura — sem migrations)

Esquema `curadoria`. Colunas marcadas **[HOJE]** existem; **[PROPOSTO]** é desenho.

### 9.1 Catálogo

```
legal_documents                                                    [HOJE]
  id, slug (único, ^[a-z0-9-]+$), nome, resumo,
  audiencia legal_audience[], obrigatorio, revogavel, ativo,
  created_at, updated_at
  + regime legal_regime ('adesao' | 'instrumento')                 [PROPOSTO]
  + categoria text  (contrato | procuracao | termo | politica)     [PROPOSTO]
  + ordem_de_apresentacao smallint                                 [PROPOSTO]

legal_document_versions                                            [HOJE]
  id, document_id → legal_documents (restrict),
  versao, conteudo, conteudo_hash (GERADA: sha256(conteudo)),
  idioma, requires_reacceptance,
  effective_at, published_at, published_by, created_at
  unique (document_id, versao) · append-only por trigger
  + aprovado_por uuid → profiles                                   [PROPOSTO]
  + aprovado_em timestamptz                                        [PROPOSTO]
  + motivo_da_mudanca text                                         [PROPOSTO]
  + nivel_exigido legal_signature_level                            [PROPOSTO]
  + variaveis_requeridas jsonb  (só instrumento)                   [PROPOSTO]

legal_bindings                                                     [PROPOSTO]
  id, document_id, audiencia, momento legal_moment,
  bloqueante boolean, ativo boolean
  -- Onde cada documento é cobrado. Documento novo = linha nova, não código novo.
```

### 9.2 Instrumentos

```
legal_document_instances                                           [PROPOSTO]
  id, version_id → legal_document_versions (restrict),
  profile_id → profiles           (XOR)
  professional_profile_id → professional_profiles,
  variaveis jsonb not null,       -- snapshot congelado dos campos (§4.2.3)
  corpo text not null,            -- o instrumento renderizado, imutável
  instancia_hash text GERADA sha256(corpo),   -- hash do conteúdo assinado
  conteudo_hash text,             -- cópia do hash da versão de origem (§4.2.2)
  status,                         -- derivado: aguardando | assinado | expirado
  assinantes_exigidos jsonb,      -- quem precisa assinar, e em que papel
  eficaz_de / eficaz_ate,         -- vigência DO INSTRUMENTO (§5.3)
  case_id / vinculo de contexto,
  artefato_ref + artefato_hash,   -- vínculo opcional (§4.2.5)
  criada_em, criada_por, expira_em,
  instancia_substituida_id → legal_document_instances  -- aditivos
  check: um sujeito e apenas um   (mesmo padrão de legal_acceptances)
  append-only por trigger
```

Especificação completa dos campos, tipos e invariantes em [`ESPECIFICACAO_G0_REGIME_DE_INSTRUMENTOS.md`](ESPECIFICACAO_G0_REGIME_DE_INSTRUMENTOS.md) §3 — este bloco é o desenho conceitual, não o contrato de implementação.

Instância é **rascunho de nada**: nasce completa e imutável. Se um dado estava errado, cria-se outra instância; a anterior expira sem assinatura e a trilha mostra as duas.

### 9.3 O livro único de atos

Uma tabela para todos os atos — aceite, assinatura, registro — como a migration 150000 já argumentou ao acomodar o profissional sem criar segunda tabela.

```
legal_acceptances                                                  [HOJE]
  id, profile_id (nullable), professional_profile_id (nullable),
  version_id → legal_document_versions (restrict),
  conteudo_hash (cópia carimbada), aceito_em, ip, user_agent,
  origem legal_acceptance_origin, idioma, contexto jsonb,
  natureza legal_acceptance_nature, registrado_por,
  forma_de_obtencao, evidencia_ref
  constraints: um_sujeito · proveniencia_coerente · natureza_do_sujeito
  append-only por trigger
  + instance_id → legal_document_instances                         [PROPOSTO]
  + instancia_hash text                                            [PROPOSTO]
  + nivel legal_signature_level                                    [PROPOSTO]
  + provedor text · evidencia_externa jsonb                        [PROPOSTO]
  + declaracao_de_vontade text  (nome digitado, conferido)         [PROPOSTO]
  + check: regime instrumento ⇒ instance_id e instancia_hash presentes

legal_acceptance_revocations                                       [HOJE]
  id, acceptance_id (único), revogado_em, motivo, ip, user_agent
  append-only por trigger
```

### 9.4 Artefatos e acessos

```
legal_artifacts                                                    [PROPOSTO]
  id, acceptance_id → legal_acceptances (restrict),
  bucket, path, sha256, bytes, content_type,
  gerado_em, gerador_versao text,   -- o pipeline que produziu
  origem ('sistema' | 'upload_de_evidencia')
  unique (acceptance_id, gerador_versao)
  append-only

legal_document_downloads                                           [PROPOSTO]
  id, artifact_id (nullable), version_id (nullable),
  acceptance_id (nullable),
  ator_id → profiles not null, papel_do_ator text,
  motivo text, ip, user_agent, baixado_em
  -- Escrito ANTES de a URL assinada ser emitida. Ver §14.
```

### 9.5 Direitos do titular [HOJE]

`data_subject_requests` (tipo, status, prazo, desfecho) e `data_subject_request_items` (recurso, estado, verificado_em) — com a regra de que estado terminal exige verificação, e que o inventário não é removível: é a prova do cumprimento.

### 9.6 Funções

| Função | Status | Papel |
|---|---|---|
| `versao_vigente(document_id)` | [HOJE] | A vigência, com uma única definição no sistema |
| `register_legal_acceptances(...)` | [HOJE] | Porta única de escrita do aceite do titular |
| `revoke_legal_acceptance(...)` | [HOJE] | Revogação pelo titular, só onde permitido |
| `register_professional_acceptances(...)` | [HOJE] | Registro pela Curadoria, com proveniência |
| `pendencias_legais_do_profissional(...)` | [HOJE] | Responde, não bloqueia |
| `publish_legal_version(...)` | [PROPOSTO] | Publicação idempotente + trilha |
| `criar_instancia_de_documento(...)` | [PROPOSTO] | Renderiza e congela o instrumento |
| `assinar_instancia(...)` | [PROPOSTO] | Assinatura N2/N3 com duplo hash |
| `registrar_download_legal(...)` | [PROPOSTO] | Grava o acesso antes de liberar a URL |
| `verificar_prova(hash)` | [PROPOSTO] | Confere um hash contra versão/instância |

### 9.7 RLS

**[HOJE]** — documento e versão publicados são legíveis por `anon` e `authenticated` (quem vai aceitar precisa ler antes de ter sessão); aceite é legível pelo titular ou pelo administrador; aceite de profissional é legível por administrador e curador; DSR é do titular ou do administrador; escrita de aceite só pelas funções `security definer`, com `INSERT` não concedido.

**[PROPOSTO]** — instância legível pelo sujeito e pela equipe autorizada; nunca por `anon` (contém dado pessoal); artefato nunca legível diretamente (o acesso é sempre por URL assinada emitida por server action); log de download legível só por administrador.

---

## 10. APIs necessárias

O produto usa **Server Actions** como padrão (`src/app/api/` tem apenas `health`, `build-info` e `crm/leads`). O módulo mantém esse padrão: rota HTTP só onde há razão técnica.

### 10.1 Server Actions

| Ação | Status | Autorização |
|---|---|---|
| `registrarAceitesAction` | [HOJE] | Titular autenticado |
| `revogarAceiteAction` | [HOJE] | Titular do próprio aceite |
| `abrirPedidoDeTitularAction` | [HOJE] | Titular autenticado |
| `registrarAceitesDoProfissionalAction` | [HOJE] | Administrador ou curador |
| `prepararInstrumentoAction` | [PROPOSTO] | Titular — cria a instância |
| `assinarInstrumentoAction` | [PROPOSTO] | Titular — assina a instância |
| `emitirUrlDeDownloadAction` | [PROPOSTO] | Titular (próprio) ou equipe autorizada — registra e emite |
| `exportarPacoteDeProvaAction` | [PROPOSTO] | Administrador |
| `publicarVersaoAction` | [PROPOSTO] | Administrador, com aprovação registrada |

### 10.2 Rotas HTTP

| Rota | Status | Razão de existir |
|---|---|---|
| `GET /legal/[slug]` | [HOJE] | Leitura pública da vigente |
| `GET /legal/[slug]/v/[versao]` | [HOJE] | Permalink de prova, serve versão superada |
| `GET /api/legal/verificacao/[hash]` | [PROPOSTO] | Conferir um hash sem sessão: dado um hash, responde documento, versão e vigência — nunca conteúdo pessoal |
| `GET /api/legal/artefato/[id]` | [PROPOSTO] | Streaming do PDF quando a URL assinada não servir (auditoria de acesso no mesmo request) |

### 10.3 Contratos invariantes

Toda action de ato recebe **apenas identificadores** — nunca texto nem hash. Todo erro de autorização usa a mensagem genérica do padrão do repositório. IP e user-agent são lidos do cabeçalho no servidor **[HOJE]**, e a Política precisa declará-los: são, eles próprios, dado pessoal.

---

## 11. Componentes React

**[HOJE]**

| Componente | Papel |
|---|---|
| `DocumentoLegalView` | Leitura pública com versão, vigência e permalink; texto pré-formatado, sem reinterpretar o jurídico |
| `PaginaDeDocumento` | Página por slug, com o estado "ainda não publicado" como primeira classe |
| `ListaDeAceites` | Histórico do titular, incluindo revogado e superado |

**[PROPOSTO]**

| Componente | Papel | Nota de experiência |
|---|---|---|
| `TelaDeAceites` (rota `/aceites`) | Onde a pendência se resolve — **fecha L2/L3** | Um ato por documento; nunca "aceito tudo" |
| `LeitorDeDocumento` | Leitura com progresso e âncoras | Confirmação só habilita ao fim do texto (evidência de N2) |
| `CartaoDePendencia` | O que falta e por quê | Diz o motivo: primeiro acesso, texto atualizado, revogado |
| `InstrumentoPersonalizado` | Instrumento com os dados da pessoa | Destaca visualmente os campos preenchidos |
| `AssinaturaEletronica` | Declaração de vontade | Nome completo digitado, conferido contra o cadastro |
| `ComprovanteDeAto` | Após assinar | Documento, versão, data, hash e onde reencontrar |
| `DossieLegalDoProfissional` | Aba no dossiê admin | Aceites, evidências, pendências, download |
| `RegistroDeAceiteDoProfissional` | Formulário da Curadoria | Forma de obtenção obrigatória, data retroativa permitida |
| `PainelDeGovernanca` | Catálogo, vigências, cobertura | Só consulta e agendamento; publicação por ferramenta |
| `HistoricoDeDownloads` | Quem acessou o quê | Visível ao administrador |

**Diretriz de experiência (`docs/UX_PRINCIPLES.md`, ADR-064).** O documento jurídico é o primeiro momento em que a Aliviar pede confiança antes de ter entregado valor. A tela não pode parecer um obstáculo administrativo: diz o que é cada documento em uma frase, por que existe, e o que muda para a pessoa. Nada de rolagem forçada com botão cinza; nada de modal. E a promessa dita — "você reencontra tudo isso quando quiser" — precisa ser verdadeira no mesmo dia em que é feita: a área `/paciente/documentos-e-consentimentos` já existe e é o destino.

---

## 12. Integração

### 12.1 Curadoria

- Na **homologação do profissional**, `pendencias_legais_do_profissional()` alimenta o painel do dossiê **[HOJE, sem tela]**.
- **Decisão pendente (D-2, §19):** pendência legal impede publicar o profissional na Rede? A função *responde*; condicionar é decisão de produto/jurídico. Recomendação técnica: **impedir**, com mensagem que nomeia o documento faltante — publicar quem não aceitou o Termo de Idoneidade contradiz o próprio ato de homologar.
- O **consentimento de compartilhamento** na escolha do profissional já tem origem própria (`escolha_de_profissional`) e o `contexto jsonb` carrega o `professional_profile_id`: o consentimento é **por profissional, nomeado** — nunca genérico.
- A Curadoria **não** publica documento nem edita aceite.

### 12.2 Paciente

- O **gate** roda no servidor, no layout de `/paciente` **[LACUNA L3]** — nunca no middleware, que não conhece papel (`middleware.ts` faz só a checagem otimista de sessão; a autoritativa é `requireRole` por layout).
- Exceções preservadas **[HOJE]**: a própria tela de aceite, a área de documentos, o exercício de direitos e as rotas públicas. Bloquear direito por falta de aceite seria coagir consentimento.
- **Ordem no onboarding [PROPOSTO]:** primeiro acesso → **aceites e assinatura** → história → Curadoria. Assinar o Contrato antes de contar a história respeita a ordem real da relação: a pessoa contrata, depois se expõe.
- `derivePatientPending` (`src/modules/paciente/next-action.ts`) ganha a pendência legal como primeira da fila, com destino — a invariante daquela camada é que toda pendência tem endereço.

### 12.3 Administração

- Publicação e vigência (§6); DSR de ponta a ponta com inventário por recurso **[HOJE, estrutura]**; dossiê legal do profissional; exportação de pacote de prova; consulta de cobertura ("quem ainda não aceitou a versão vigente").
- **Provisionamento do paciente** (`/admin/pacientes/novo`) permanece como está (ADR-018): a conta nasce antes da jornada digital, e é no primeiro acesso que os documentos são apresentados. O administrador **não aceita em nome do paciente** — não há caminho técnico para isso, e não deve haver.

### 12.4 Landing e portal público

`/termos`, `/privacidade`, `/consentimentos/[slug]` e `/legal/[slug]/v/[versao]` já leem o banco. Publicado o texto, a Landing passa a linkar documento real em vez de página vazia. Nenhuma tela pública de documento **do profissional** é criada — a premissa da 1.0 é que ele não tem superfície.

---

## 13. Fluxo documental completo

### 13.1 Paciente

```
1. Administrador cria a conta                                    [HOJE]
2. Primeiro acesso: login                                        [HOJE]
3. Gate detecta pendências e desvia para /aceites                 [LACUNA L2/L3]
4. Adesão: Termos, Anexo LGPD, Política — ato por documento
5. Instrumentos: Contrato e Procuração
     variáveis do cadastro → instância imutável → leitura → assinatura
6. Comprovante na tela; artefatos gerados                         [G3/G5]
7. Gate libera; a jornada segue para a história
8. A qualquer momento: /paciente/documentos-e-consentimentos      [HOJE]
     histórico completo, texto exato, download, revogação do revogável
9. Nova versão material publicada → pendência reabre com o motivo
10. Direitos LGPD acessíveis mesmo com pendência aberta           [HOJE]
```

### 13.2 Profissional

```
1. Curadoria identifica e contata o profissional (fora do sistema)
2. Documentos entregues pelo canal da equipe; ato praticado fora da tela
3. Curadoria registra no dossiê:                                  [HOJE]
     versões vigentes + forma de obtenção (obrigatória)
     + evidência (quando existir) + data real do ato
4. Banco carimba: natureza=registrado_pela_equipe, registrado_por=auth.uid()
5. Evidência assinada arquivada em bucket privado                 [PROPOSTO]
6. Dossiê mostra aceites, pendências e evidências; download com log [G4]
7. Publicação na Rede consulta pendências legais                  [decisão D-2]
8. Nova versão material → pendência reabre; a Curadoria recontata
9. Portal do Profissional (1.1+): mesma tabela, natureza muda      [ADR-052]
```

### 13.3 Administrador

```
1. Recebe do jurídico o texto aprovado
2. Monta o pacote de publicação e abre pull request
3. Revisão de engenharia: variáveis declaradas, rótulo coerente com o efeito
4. Aprovação registrada (aprovado_por ≠ published_by quando possível)
5. Publica pela ferramenta; verifica hash do banco contra o arquivo
6. Trilha: legal_document_published
7. Acompanha cobertura de aceite e pendências
8. Executa DSR recurso a recurso, com verificação por item
9. Exporta pacote de prova quando solicitado
10. Nunca: edita ato, apaga versão, aceita por outro
```

---

## 14. Estratégia para downloads

### 14.1 Princípios

1. **Nenhum documento com dado pessoal tem URL pública.** Os buckets são privados **[HOJE]**; a leitura passa por URL assinada emitida no servidor.
2. **O acesso é registrado antes de ser concedido.** `registrar_download_legal` grava; só então a URL é emitida. Registrar depois perde exatamente os casos que importam (ADR-055).
3. **URL assinada de vida curta** — 60 segundos, uso imediato, nunca compartilhável por copiar e colar.
4. **Nome de arquivo determinístico**: `<slug>_v<versao>_<identificador-do-titular>_<AAAAMMDD>.pdf`. Ninguém precisa abrir para saber o que é.
5. **Documento de adesão sem dado pessoal** (Termos, Política) é público por natureza e pode ser baixado sem registro — a versão já é pública em `/legal/...`.

### 14.2 Documentos do profissional — o caso que exige mais cuidado

O profissional **não tem tela**. Todo acesso aos documentos dele acontece dentro do **dossiê interno** em `/admin/profissionais/[id]`, hoje com uma seção "Documentos" que faz upload e exclusão e **não permite ler o que está lá** (L6).

Desenho proposto:

```
Dossiê do profissional
├── Documentos administrativos   [HOJE]  diploma, certificado, comprovante
│     bucket professional-documents · admin-only por RLS
└── Documentos jurídicos         [PROPOSTO]
      ├── Termo LGPD do Médico    — versão vigente, aceite, evidência
      ├── Termo de Idoneidade     — idem
      └── Pendências              — o que falta para publicar na Rede

Ações
  Ver texto da versão aceita  → permalink /legal/<slug>/v/<versao>   sem registro
  Baixar evidência assinada   → URL assinada 60s + registro obrigatório
  Baixar dossiê completo (ZIP)→ ato único, auditado, com manifesto e hashes
```

- **Quem baixa:** administrador e curador médico. O `motivo` é campo do formulário quando o download é de evidência — "por que este acesso aconteceu" é a pergunta que uma auditoria faz primeiro.
- **Onde não existe:** nenhuma rota pública, nenhum link por e-mail, nenhuma URL de storage exposta ao cliente.
- **ZIP do dossiê:** um único ato registrado, com manifesto listando cada peça e seu SHA-256 — para que o pacote entregue seja conferível fora do sistema.

### 14.3 Documentos do paciente

Em `/paciente/documentos-e-consentimentos`: ver o texto exato de cada versão aceita **[HOJE]**, baixar o instrumento assinado com o comprovante **[PROPOSTO]**, e baixar o pacote de prova completo — que também atende ao direito de portabilidade sem procedimento manual.

### 14.4 O que a exclusão passa a significar (fecha L7)

A exclusão destrutiva atual contradiz a ADR-054, que decidiu: confirmação explícita, tombstone com trilha, e remoção do objeto **verificada** — falha na remoção é erro, não silêncio. Para documento **jurídico**, a regra é mais estrita: **não há exclusão**. Há supersessão, revogação e retenção fundamentada. Excluir a prova de um consentimento destrói a defesa das duas partes.

---

## 15. Estratégia para armazenamento

### 15.1 A hierarquia da verdade

```
1. TEXTO no banco (legal_document_versions.conteudo)  — fonte de verdade
2. INSTÂNCIA no banco (legal_document_instances.corpo) — o instrumento
3. ARTEFATO em storage (PDF)                           — derivado, conferível
4. EVIDÊNCIA em storage (digitalização, e-mail)        — insumo do registro
```

O nível 3 nunca é a prova: é a apresentação dela. Se um PDF se perder, o texto e o hash reconstroem o documento. Se o texto se perdesse, nada o reconstruiria — por isso ele está na camada com backup verificado e restore testado (ADR-059).

### 15.2 Buckets

| Bucket | Status | Conteúdo | Acesso |
|---|---|---|---|
| `patient-documents` | [HOJE] | Documentos clínicos do paciente | Titular, admin, curador do case |
| `professional-documents` | [HOJE] | Documentos administrativos | Admin |
| `legal-artifacts` | [PROPOSTO] | PDFs de instrumentos assinados | Ninguém direto; só URL assinada |
| `legal-evidence` | [PROPOSTO] | Evidências de aceite registrado | Admin e curador, com registro |

Bucket separado para evidência jurídica em vez de reaproveitar `professional-documents`: misturar diploma com prova de consentimento faz a política de retenção de um contaminar a do outro — e é a retenção que diverge entre eles.

### 15.3 Convenções

- Caminho: `<bucket>/<sujeito_id>/<slug>/<versao>/<acceptance_id>.<ext>` — endereça o ato, não o instante.
- **Sem sobrescrita**: `upsert = false` sempre. Caminho ocupado é erro.
- **Compensação obrigatória**: falha ao registrar metadados remove o objeto e, se a remoção falhar, o resíduo é logado com referência — padrão já implementado em `uploadPatientDocument` e que o módulo herda.
- Limites da ADR-054 aplicados nas três camadas (bucket, action com mensagem própria, config do framework): allowlist PDF/JPG/PNG/WEBP, teto de 20 MB.
- Backup: os buckets entram no escopo da ADR-059 (RPO ≤ 24h, RTO ≤ 4h) — hoje o texto no banco já entra; os artefatos passam a entrar.

---

## 16. Estratégia para geração futura de PDFs

### 16.1 O problema que não se resolve com biblioteca

Reprodutibilidade byte a byte de PDF é frágil: fonte, timestamp interno e versão do renderizador mudam o arquivo sem mudar o conteúdo. Portanto:

> **O hash de prova é sempre do TEXTO (ou do corpo da instância), nunca do PDF.** O PDF carrega seu próprio `sha256` como artefato, com o `gerador_versao` que o produziu.

Isso permite regenerar o PDF anos depois com outra ferramenta sem invalidar prova alguma.

### 16.2 Requisitos do pipeline

1. **Determinístico no conteúdo**: mesmo texto e mesmas variáveis produzem o mesmo documento visível.
2. **Autocontido**: fontes embutidas, nenhuma dependência de rede.
3. **Rodapé de prova em todas as páginas**: documento, versão, data do ato, hash (abreviado), URL de verificação, numeração `n/N`.
4. **Versionado**: `gerador_versao` gravado em cada artefato.
5. **Assíncrono e idempotente**: a assinatura **não espera** o PDF; ele é derivado e regenerável. O ato jamais falha porque o renderizador falhou.
6. **Sem dado de terceiros**: o PDF do titular contém apenas o titular.

### 16.3 Ordem de adoção

- **Fase 1 [G3]** — nenhum PDF. Comprovante em tela e permalink. O sistema já é auditável sem PDF nenhum.
- **Fase 2 [G5]** — PDF sob demanda, gerado na primeira solicitação e persistido em `legal-artifacts`.
- **Fase 3** — geração automática na assinatura, em fila.
- **Fase 4** — carimbo de tempo externo e/ou assinatura N3, se o jurídico exigir.

A escolha da ferramenta é decisão de implementação do incremento G5, tomada contra estes requisitos. A restrição que já se pode antecipar: o pipeline roda **no servidor**, nunca no cliente — PDF gerado no navegador não é prova de nada.

---

## 17. Critérios de segurança

### 17.1 Invariantes inegociáveis

| # | Invariante | Onde vive | Status |
|---|---|---|---|
| S1 | Hash gerado pelo banco, nunca informado pelo cliente | Coluna gerada | [HOJE] |
| S2 | Versão, aceite e revogação são append-only | Trigger | [HOJE] |
| S3 | Escrita de ato só por `security definer` | GRANT + policy | [HOJE] |
| S4 | Só a versão vigente é aceitável | Função | [HOJE] |
| S5 | Um sujeito e apenas um por ato | Constraint | [HOJE] |
| S6 | Registro pela equipe exige quem e como | Constraint | [HOJE] |
| S7 | Publicação só por `service_role` | GRANT | [HOJE] |
| S8 | Gate no servidor, nunca no cliente | Layout | [LACUNA L3] |
| S9 | Instância imutável, com duplo hash no ato | Trigger + constraint | [PROPOSTO] |
| S10 | Download registrado antes de emitido | Função | [PROPOSTO] |
| S11 | Nenhuma URL pública para dado pessoal | Bucket privado + URL assinada | [PROPOSTO] |
| S12 | Todo ato na trilha de auditoria | Dentro das funções | [LACUNA L4] |

### 17.2 Privacidade

IP e user-agent são dado pessoal coletado para provar a circunstância do ato — a circularidade é real e assumida, e **a Política precisa declará-los** (o código já registra isso em `actions.ts`). A Anthropic permanece suboperadora declarada (ADR-056) e **não toca** documento jurídico: nenhum texto de contrato ou instância entra em prompt. Analytics não roda em rota autenticada (ADR-056) — as telas deste módulo estão todas dentro dessa fronteira.

### 17.3 Autorização

Privilégio antes de policy (padrão do repositório): `GRANT` mínimo e explícito, policy como defesa em profundidade e nunca como porta. Papéis: titular vê o próprio; administrador vê tudo; curador vê o do profissional; `anon` vê apenas documento e versão publicados — jamais instância, ato ou artefato.

### 17.4 Superfície de ataque considerada

Cliente adulterado informando hash (bloqueado por S1); aceite de versão superada (S4); aceite em nome de terceiro (S3+S5); adulteração retroativa (S2); URL de storage vazada (S11 + expiração curta); ato sem rastro (S12); download em massa não detectado (S10 + alerta de volume anômalo, incremento G6).

---

## 18. Roadmap de implementação

Incrementos pequenos, cada um entregável e verificável de forma independente. Nenhum depende de texto jurídico pronto, exceto onde marcado.

| # | Incremento | Fecha | Entrega | Evidência de conclusão |
|---|---|---|---|---|
| **G0** | **Ferramenta de publicação** | L1 | Pacote de publicação + script idempotente + verificação de hash | Publicar um documento de teste local, conferir hash, reexecutar sem duplicar |
| **G1** | **Tela de aceites e gate ligado** | L2, L3 | Rota `/aceites`, `LeitorDeDocumento`, gate no layout de `/paciente` | E2E: com pendência não passa; sem pendência passa; rotas livres nunca bloqueiam |
| **G2** | **Trilha de auditoria dos atos** | L4 | Escrita em `audit_logs` dentro das funções | Integração: cada ato produz exatamente uma linha, com ator correto |
| **G3** | **Regime de instrumento** | L5 | Instâncias, variáveis, assinatura N2, comprovante | Integração: instância imutável, duplo hash, instrumento com lacuna recusado |
| **G4** | **Dossiê legal do profissional** | L6 | Aba jurídica, registro pela Curadoria em tela, evidências, download com log | E2E: curador registra com forma de obtenção; pendências somem; download aparece no log |
| **G5** | **Artefatos PDF** | L9 | Pipeline server-side, bucket `legal-artifacts`, rodapé de prova | PDF regenerado bate no conteúdo; `sha256` gravado; falha do renderizador não derruba a assinatura |
| **G6** | **Verificação e pacote de prova** | — | `/api/legal/verificacao/[hash]`, exportação, alerta de volume anômalo | Perito externo confere o pacote sem acesso ao sistema |
| **G7** | **Painel de governança** | — | Catálogo, vigências, cobertura, agendamento | Administrador responde "quem falta aceitar a v2" sem SQL |
| **G8** | **DSR operacional** | — | Execução recurso a recurso com verificação, retenção fundamentada | Pedido de exclusão fecha com todos os itens verificados |
| **G9** | **Regime estrito de exclusão** | L7 | Substitui exclusão destrutiva por supersessão + tombstone (ADR-054) | Nenhum caminho apaga documento sem trilha |

**Ordem crítica *(corrigida na revisão 2)*:** G0 → G1 → G2 continuam sendo pré-requisito de tudo. Mas, como **os cinco documentos recebidos são Instrumento**, publicar qualquer um deles exige também **G3** — não apenas G0 + G1. A revisão 1 supunha que quatro deles sairiam em G1; não saem.

G1 permanece no lugar e entrega valor real — catálogo ativo, rota `/aceites`, gate ligado, trilha de auditoria — e é onde uma Política de Privacidade ou Termos de Uso (regime de Adesão) poderiam ser publicados, se e quando existirem.

**Marco de valor:** ao fim de G3, um paciente novo entra, lê, assina, e a Aliviar tem prova completa do que ele assinou. É o menor conjunto que torna o módulo real — e, desde a revisão 2, também o menor conjunto que coloca **qualquer** dos cinco documentos em produção.

---

## 19. Decisões que precisam de você

Nenhuma bloqueia a escrita desta arquitetura; todas bloqueiam a implementação do incremento indicado.

| # | Decisão | Recomendação técnica | Trava |
|---|---|---|---|
| **D-1** | "Contratar os serviços" no onboarding inclui pagamento? | **Não na 1.0.** Contratar = assinar o Contrato. Cobrança é módulo próprio, fora deste escopo. *Ressalva confirmada na leitura: preço e forma de pagamento são variáveis obrigatórias da instância (Contrato, 9.1)* | G3 |
| **D-2** | Pendência legal impede publicar o profissional na Rede? | **Impedir**, com mensagem que nomeia o documento faltante | G4 |
| **D-3** | Nível de assinatura exigido por documento | N2 para os cinco instrumentos; N1 para adesão. Confirmar com o jurídico | G3 |
| **D-4** ✅ | O Anexo LGPD e o Termo LGPD do Médico são revogáveis? | **APROVADA (2026-08-03).** Respondida pelos próprios textos; revogação modelada **por documento e por escopo** (§4.4). Efeito prático de cada revogação parcial continua com o Jurídico | — |
| **D-5** ✅ | Ordem no onboarding: documentos antes ou depois da história? | **APROVADA (2026-08-03).** Contrato e Anexo LGPD concluídos antes da história clínica; Procuração só quando houver representação administrativa; assinatura e evidência independentes por documento | — |
| **D-6** | Procuração exige testemunhas ou reconhecimento de firma? | Se sim, o fluxo digital precisa de etapa externa — muda G3 substancialmente | G3 |
| **D-7** | Paciente representado (menor, incapaz, familiar) assina como? | Estrutura suporta representante com vínculo declarado; a regra é jurídica | G3 |
| **D-8** | Prazo de resposta ao DSR | Coluna `prazo_em` existe vazia esperando a decisão (PRIV-03) | G8 |

---

## 20. O que este módulo promete a quem usa

Fechando pelo lado da pessoa, como manda a ADR-064 — nenhuma promessa que o sistema não cumpra:

- **Ao paciente:** "Você lê antes de decidir. O que você assinar fica guardado com a data e o texto exato daquele dia, e você reencontra tudo aqui quando quiser, sem pedir a ninguém."
- **Ao profissional:** "O que você concordou está registrado com a data e com a forma como foi obtido, e quem registrou tem nome."
- **À equipe:** "Nenhum ato pode ser reescrito, e todo acesso a documento sensível tem autor e data."

---

## Anexo A — Rastreabilidade

| Fonte | O que ancora |
|---|---|
| `20260803140000_governanca_documentos_aceites_lgpd.sql` | Catálogo, versões, aceites, revogações, DSR, RLS, append-only |
| `20260803150000_governanca_aceite_do_profissional.sql` | Natureza do aceite, sujeito XOR, proveniência, pendências |
| `src/modules/governanca/{documentos,repository,professional-repository,actions,gate}.ts` | Domínio, leitura, escrita, gate |
| `src/modules/profiles/{patient,professional}-document-repository.ts` | Buckets, compensação de storage, exclusão atual (L7) |
| `src/components/governanca/*`, `src/components/profiles/documents-panel.tsx` | Superfícies existentes e ausência de download (L6) |
| `src/app/(public)/legal/[slug]/v/[versao]/page.tsx` | Permalink de prova |
| `src/middleware.ts`, `src/modules/auth/guard.ts` | Por que o gate é de layout, não de middleware |
| `tests/integration/governanca-aceites.integration.test.ts` | O que já está provado |
| ADR-018 | Não há autocadastro de paciente |
| ADR-047, ADR-048 | Banco autoritativo; imutabilidade mora no banco |
| ADR-052 | Portal do Profissional fora da 1.0 |
| ADR-054 | Allowlist, teto de 20 MB, exclusão responsável, download pela equipe |
| ADR-055 | Responsável LGPD, retenção, log de download |
| ADR-056 | Suboperadores e analytics fora de rota autenticada |
| ADR-060 | Segregação de funções |
| ADR-064 | Política de Promessas ao Usuário |

## Anexo B — Glossário

**Ato** — registro imutável de aceite, assinatura ou registro pela equipe. **Adesão** — regime de texto único. **Instrumento** — regime de documento personalizado. **Instância** — instrumento renderizado para um titular, imutável. **Vigente** — versão de maior `effective_at` já alcançado. **Material vs. editorial** — mudança que reabre aceite vs. correção que não perturba. **Natureza** — eletrônico pelo titular vs. registrado pela equipe. **Permalink de prova** — endereço permanente de uma versão. **Pacote de prova** — exportação autocontida de um ato. **Artefato** — derivado apresentável (PDF). **Evidência** — insumo externo de um registro.

---

**Status:** proposta de arquitetura, aguardando aprovação. Aprovada, torna-se a especificação oficial do módulo — e as decisões D-1 a D-8 passam a ser ADRs em `docs/DECISIONS.md`.
