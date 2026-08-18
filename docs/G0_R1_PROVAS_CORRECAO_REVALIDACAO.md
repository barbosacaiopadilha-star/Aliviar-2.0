# G0-R1 — Provas reproduzíveis da correção P1/P2/P3

Data: 2026-08-18
Projeto descartável: `rvkhdkfpalgqmziuhzuw`
Baseline: 128 migrations; `main@5d53b7db889e799011d434e0df898e849e3382b9`.

## Hashes SHA-256 do conteúdo validado

- migration: `9a34057b4397db1a94aa7aad2299f41eb33738406c734c7f8042eb34366ca6ef`
- suíte TypeScript (30 casos): `07586ab4f3f0261b3deb22e4deac1c05338936f9bc6350e19cb183fa26db0093`
- rollback executável: `d548aa67e2707fd3a506a7a679a47caf482e7e81a93d2c2e3f57d54806adf3fe`

Os hashes foram calculados no PostgreSQL 17 do projeto descartável com
`extensions.digest(conteudo, 'sha256')` sobre o conteúdo UTF-8 integral
obtido da branch.

## Ciclo executado

1. estado residual anterior identificado: 132 registros;
2. rollback transacional; sentinela 4/4;
3. remoção exclusiva dos quatro registros descartáveis G0 anteriores;
4. baseline comprovada: 128 migrations, tipos e tabelas G0 ausentes;
5. apply da migration corrigida;
6. harness de ataques/contratos: 10/10;
7. rollback: 4/4;
8. reapply;
9. harness: 10/10;
10. correção dos três índices de FK apontados pelo advisor;
11. rollback 4/4, reapply e harness 10/10 finais.

## Harness SQL final — 10/10

- T-ARTEFATO-VERSAO;
- T-IDEM-COLLISION;
- T-IDEM-CROSS-TENANT;
- T-IDEM-RETRY;
- T-JSON-CONTRACT;
- T-N3-FRAUD;
- T-NIVEL-MULTI-BLOQUEIA;
- T-NIVEL-MULTI-FECHA;
- T-NIVEL-N2-ACEITA-N2;
- T-NIVEL-N2-BLOQUEIA-N1.

Cada caso retornou `ok=true` nas três execuções completas.

## Concorrência real

Duas chamadas simultâneas, em conexões distintas, tentaram assinar o mesmo
`signer_id=6356feb3-51a0-4c37-8dcf-d746013445bb` da instância
`dc6a962f-eb86-4e86-9aa8-aae7507f4c5c`.

- uma conexão criou o ato `c3fb23fb-5c54-45d8-80b9-9e964dd81f73`;
- a segunda foi serializada pelo lock e recusada porque a instância já estava
  assinada;
- sentinela final: `acceptance_count=1`, `status=assinado`.

## Advisors finais

- segurança: 42 avisos preexistentes no projeto; **0 relacionados à G0-R1**;
- performance: 354 avisos globais; **0 FK G0 sem índice**;
- G0-R1: 6 INFO `unused_index`, esperados imediatamente após criação do
  schema e sem carga representativa. Nenhum WARN/ERROR G0 de performance.

## Limite da evidência

A suíte TypeScript foi preservada e ampliada de 26 para 30 casos, eliminando
os retornos antecipados de T13, T15 e T19. Nesta execução conectada não havia
checkout/credenciais locais para iniciar o Vitest; portanto o resultado
declarado como executado é o harness SQL 10/10 e a concorrência por duas
conexões, não “30/30 Vitest”. O próximo gate de CI deve executar os 30 casos.
