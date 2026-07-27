# Aliviar Curadoria — Release Notes v1.0.0 (2026-07-27)

Primeira versão consolidada da plataforma de Curadoria Médica sobre o
**Modelo da Curadoria v1.0** (`docs/curadoria/MODELO_CURADORIA_V1.md`),
com o domínio **congelado** (§13): mudança conceitual exige ADR.

## Principais funcionalidades

- **Modelo da Curadoria v1.0** — quatro camadas (Filtros Eliminatórios,
  Perfil Técnico 100 pts, Perfil Assistencial sem pontuação, Perfil de
  Prioridades 100 pts) e **dois cruzamentos independentes** (Avaliação
  Técnica e Compatibilidade Assistencial, 0–100 cada, com cobertura própria
  — o total combinado não existe e há teste que pina a ausência).
- **Mesa do Curador** (`/coa/curadoria`) — cabeçalho do Case, orçamento de
  pontos com saldo vivo, declaração de área com os dois textos lado a lado,
  comparação com evidências no lugar, seleção de exatamente três.
- **Política de Fontes** — encontrar não é verificar: cinco estados de
  verificação, proveniência obrigatória para `verificado` (constraint),
  divergências preservadas com as duas versões, publicação com requisitos
  (gatilho), validade temporal de dado volátil.
- **Cadastro enriquecido** — sete tabelas de dossiê profissional com
  proveniência por dado; prontidão por quantidade verificada, nunca mérito.
- **Relatório Inteligente** — rascunho determinístico e rastreável (cada
  frase com origem; sem LLM), ciclo revisão → aprovação (autoria do
  Curador) → emissão (documento congelado por gatilho).
- **Experiência do Paciente** — Perfil como importância em palavras (nunca
  número), jornada com mensagem por etapa, três caminhos com a narrativa
  literal do Relatório, escolha e acompanhamento. Fronteira de vocabulário
  (`PATIENT_FORBIDDEN_TERMS`) varrida por teste.
- **Isolamento operacional** — demonstração e fixture de certificação nunca
  alcançam paciente (CHECKs + gatilhos + emparelhamento fixture↔Case de
  certificação nas duas direções).
- **Manuais** — Manual Operacional do Curador v1.0 e runbook da primeira
  operação real.

## Mudanças incompatíveis (nesta linha de release)

- `CruzamentoResult` sem `total`/`coverage` combinados; cobertura por
  cruzamento; critérios renomeados (`HISTORICO`,
  `CONTINUIDADE_DO_CUIDADO`, `MODELO_DE_ATENDIMENTO`) em código e banco.
- Emissão de Relatório exige aprovação prévia registrada; Relatório emitido
  é imutável (conteúdo e opções).
- `listApprovedProviders` exige publicado e exclui divergência crítica
  aberta; escritores operacionais do ACE removidos (ADR-035/036/037 — o ACE
  permanece como motor histórico sob observação).

## Requisitos mínimos

Node 20+ · Next.js 15.5 · Supabase (Postgres 17) com schema `curadoria` e as
46 migrations do repositório aplicadas · variáveis
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY` (as `NEXT_PUBLIC_*` são fixadas no build).

## Limitações conhecidas

- **Motor legado de compatibilidade** (100 pontos, seis critérios próprios)
  segue alimentando a comparação COS legada ao lado do Modelo v1.0; a
  convergência total é evolução pós-v1 (registrada no Modelo §11).
- **Ordenação interna de leitura sem chave definida** — a comparação
  apresenta na ordem da Rede; definir a chave exige ADR.
- **Reabertura de Perfil validado** não tem fluxo no sistema — procedimento
  humano descrito no Manual; materialização exige ADR.
- **Autovalidação do Perfil pelo paciente** (botões Sim/Revisar como
  escrita) não implementada — a validação é registrada pelo Curador na
  conversa; mudança exige ADR.

## Pendências assumidas

- **Rede real ainda não cadastrada** — zero profissionais reais; primeira
  operação bloqueada na entrada de dados (runbook pronto em
  `docs/OPERACAO_PRIMEIRA_CURADORIA.md`).
- **Sessão humana de usabilidade da Mesa** (PROMPT 8) pendente — ambiente e
  ficha prontos (`docs/VALIDACAO_USABILIDADE_MESA.md`); é o gate declarado
  para operar com dados reais.
- Dois Cases reais em `WAITING_FOR_INFORMATION`; o `61da4e7e` é o candidato
  à primeira Curadoria real.
