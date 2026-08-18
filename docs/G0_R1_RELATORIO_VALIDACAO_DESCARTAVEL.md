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