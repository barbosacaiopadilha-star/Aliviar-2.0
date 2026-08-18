# G0-R1 — Relatório de reconstrução e validação descartável

Data: 2026-08-18  
Baseline GitHub: `main@5d53b7db889e799011d434e0df898e849e3382b9`  
Branch isolada: `g0-r1-regime-de-instrumentos`  
Banco descartável: `rvkhdkfpalgqmziuhzuw` (`curadoria-2-0-preview-formacao-v2`)  
Produção: não acessada por SQL e não alterada.

## 1. Schema atual

O banco descartável foi restaurado e confirmou 128/128 migrations versionadas da `main`, da
`20260723164021_curadoria_stage1_identity_foundation` à
`20260817120000_formacao_academica_visivel_ao_paciente`.

A baseline jurídica atual contém `legal_documents`, `legal_document_versions`,
`legal_acceptances` e `legal_acceptance_revocations`, além das funções de aceite,
revogação, versão vigente e menor privilégio.

## 2. Mapeamento das 263 mudanças posteriores

A comparação `97ed8b28e896d4149af1e7eee25ca0984f7691db...main` confirmou 263 commits.
O recorte foi classificado em:

- segurança e menor privilégio;
- migrations e evolução do domínio Curadoria;
- ciclo do profissional e formação;
- documentos, casos e depósitos auditados;
- jornada pública, paciente e curador;
- testes e gates;
- documentação e ADRs;
- alterações visuais sem impacto no schema G0.

Não houve migration posterior que materializasse o Regime de Instrumentos. A migration
`20260803170000` permaneceu a dependência imediata de privilégios a respeitar.

## 3. Reconstrução

Foi criada uma migration com identidade nova e preflight explícito:

`supabase/migrations/20260818193600_g0_r1_regime_de_instrumentos.sql`

Ela preserva o contrato do regime, mas nasce sobre a baseline atual, recusa presença parcial,
usa uma nova identidade de migration e ajusta chamadas de `auth.uid()` nas políticas para o
padrão de subconsulta recomendado.

## 4. Matriz de testes

Os 26 contratos da suíte histórica foram preservados em:

`tests/integration/governanca-instrumentos.integration.test.ts`

Resultado no banco descartável: **26/26 verdes**.

Cobertura:

- instância, dois hashes, congelamento e ausência de marcadores;
- rejeição de adesão, versão futura e lacunas;
- imutabilidade e variação determinística do hash;
- assinatura, duplicidade, múltiplos assinantes e nível derivado pelo servidor;
- revogação por escopo e rescisão sem perda da prova;
- RLS, isolamento entre titulares e bloqueio de `anon`;
- idempotência e autorização por papel;
- escrita direta bloqueada;
- cinco provas realmente concorrentes: T20, T21, T22, T23 e T26.

## 5. Advisors

- alertas de segurança atribuíveis à G0-R1: **0**;
- alertas de performance atribuíveis à G0-R1: **0**.

Avisos preexistentes de outros domínios não foram alterados por este pacote.

## 6. Fronteira

Nada foi integrado à `main`, aplicado em produção, implantado na Vercel ou mesclado no
Supabase de produção. A branch e o banco temporário aguardam auditoria e autorização
separadas.

## 7. Correção e revalidação P1/P2/P3 — 2026-08-18

A reauditoria independente reprovou a primeira versão. O pacote foi corrigido
sem tocar na `main`, PR, produção ou Vercel.

### P1 encerrados

- idempotência escopada por ator e chave; autorização, titular, versão e
  contrato integral são validados antes de qualquer retorno;
- colisão da mesma chave com outro contrato é recusada;
- o caminho público rejeita `_provedor` e `_evidencia_externa`: não existe
  mais promoção autodeclarada a N3;
- `nivel_exigido` é aplicado a cada assinante obrigatório. N1 não satisfaz
  N2/N3 e o instrumento só fecha após todos cumprirem o nível.

### P2/P3 encerrados

- T13, T15 e T19 não possuem mais retorno antecipado;
- matriz versionada ampliada de 26 para 30 casos;
- rollback executável em
  `supabase/rollback/g0_r1_regime_de_instrumentos.rollback.sql`;
- ciclo apply → harness → rollback → sentinela → reapply → harness executado;
- preflight cobre tipos, tabelas e todas as colunas aditivas;
- contratos JSON rejeitam elementos malformados;
- artefato exige tipo, referência-objeto, versão e hash SHA-256;
- três FKs apontadas pelo advisor receberam índices de cobertura.

### Evidência real

- baseline: 128 migrations;
- harness SQL de ataques/contratos: 10/10 em três rodadas;
- concorrência real por duas conexões: 1 assinatura persistida, estado
  `assinado`, segunda chamada recusada após serialização;
- advisor de segurança: 0 alerta G0;
- advisor de performance: 0 FK G0 sem índice; apenas 6 INFO `unused_index`
  esperados em schema recém-criado.

Hashes SHA-256 do conteúdo validado:

- migration: `9a34057b4397db1a94aa7aad2299f41eb33738406c734c7f8042eb34366ca6ef`;
- teste: `07586ab4f3f0261b3deb22e4deac1c05338936f9bc6350e19cb183fa26db0093`;
- rollback: `d548aa67e2707fd3a506a7a679a47caf482e7e81a93d2c2e3f57d54806adf3fe`.

Limite: os 30 casos TypeScript estão prontos para CI, mas não foram declarados
como executados neste gate conectado; a prova executada é o harness SQL 10/10,
a concorrência por duas conexões e o ciclo integral registrado em
`docs/G0_R1_PROVAS_CORRECAO_REVALIDACAO.md`.
