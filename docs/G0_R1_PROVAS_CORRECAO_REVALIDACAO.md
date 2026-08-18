# G0-R1 — Provas reproduzíveis da correção P1/P2/P3

Data: 2026-08-18
Projeto descartável: `rvkhdkfpalgqmziuhzuw`
Baseline: 128 migrations; `main@5d53b7db889e799011d434e0df898e849e3382b9`.

## Hashes SHA-256 do conteúdo validado

- migration: `ad8f3f38ce5c4a61d8472773df6fe12e8df661182b5a57f699fb4b2ce005f967`
- suíte TypeScript (32 casos): `c06a3d45066fb557be7a23cbb3fe6b991c6787c8b63e9459567a2aa49856301f`
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

## Harness SQL final — 12/12

- T-ARTEFATO-VERSAO;
- T-IDEM-COLLISION;
- T-IDEM-CROSS-TENANT;
- T-IDEM-RETRY;
- T-JSON-CONTRACT;
- T-JSON-ORDEM-INTEIRA;
- T-JSON-UUID;
- T-N3-FRAUD;
- T-NIVEL-MULTI-BLOQUEIA;
- T-NIVEL-MULTI-FECHA;
- T-NIVEL-N2-ACEITA-N2;
- T-NIVEL-N2-BLOQUEIA-N1.

Na microrretificação, cada um dos 12 casos retornou `ok=true` antes e depois do rollback/reapply.

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

A suíte TypeScript atual foi preservada e ampliada para 32 casos, eliminando
os retornos antecipados de T13, T15 e T19. Nesta execução conectada não havia
checkout/credenciais locais para iniciar o Vitest; portanto o resultado
declarado como executado é o harness SQL 10/10 e a concorrência por duas
conexões, não “30/30 Vitest”. O próximo gate de CI deve executar os 32 casos.


## Microrretificação final

- T27 passou a usar uma segunda conta real de paciente; administrador não é mais
  usado como oráculo de recusa, pois possui autorização legítima.
- T31 rejeita ordem fracionária e T32 rejeita UUID sintaticamente inválido.
- O preflight passou a detectar resíduos de funções, índices e constraints.
- A aplicação repetida foi recusada pelo preflight antes de qualquer mutação.
- Novo ciclo: rollback 4/4 → apply → 12/12 → preflight negativo → rollback
  4/4 → reapply → 12/12.
- O resultado histórico 26/26 pertence à versão anterior da G0-R1; não é
  apresentado como execução da suíte atual.
- O commit intermediário `0b6fda0` contém uma gravação mecânica defeituosa e
  foi neutralizado integralmente por `527ab37`. O histórico não foi reescrito,
  porque não houve autorização para force-push/rebase.
