# Invariantes Arquiteturais Consolidados

Lista única de todos os invariantes que atravessam mais de um domínio, ou que são fundacionais o suficiente para merecer estar num só lugar. Cada `DOMAIN_*.md` lista apenas os invariantes que lhe são próprios e referencia este documento para os demais. Nenhum invariante aqui contradiz outro.

## Autoridade e hierarquia

1. A Constituição da Aliviar tem autoridade máxima; nenhum domínio, ADR ou decisão de produto pode contrariá-la.
2. O Kernel e a Ontologia do ACE regem disciplina técnica e vocabulário comum; nenhum protocolo do ACE pode contrariá-los.
3. Nenhum domínio novo pode ser criado sem justificar explicitamente por que os sete domínios existentes não conseguem absorver a nova responsabilidade (regra institucional de 2026-07-15).

## Sobre decisão e autonomia do paciente

4. O paciente é sempre o decisor final. Nenhum domínio pode tomar essa decisão em seu lugar.
5. P010 comunica, nunca decide (ADR-016).
6. `comparisonSummary` nunca ranqueia; `methodExplanation` sempre atribui a escolha final ao paciente (especificação de P010).
7. Nenhuma Shortlist chega ao paciente sem passar por Human Review humano (P009) — não existe caminho de entrega direta ACE → paciente.

## Sobre dados e evidência

8. Campos permanentemente banidos (popularidade, tempo de cadastro, demografia, avaliação por estrelas, volume de atendimentos) nunca podem ser usados como evidência ou critério de compatibilidade, em nenhum domínio (ADR-014).
9. Confiança de evidência, quando existir (Compatibility Intelligence), é sempre qualitativa — nunca numérica ou score.
10. Retratação ou exclusão de dado pelo paciente é sempre honrada, inclusive retroativamente para uso futuro.
11. Aprendizado agregado (L4 do CI) nunca produz julgamento sobre um indivíduo — só sobre padrões coletivos.

## Sobre reprodutibilidade

12. Dado o mesmo estado de entrada, um protocolo deve produzir uma saída consistente com sua especificação — variação de estilo é aceitável, variação de regra não é (Kernel §4).
13. Um Caso não pode ter mais de um Human Review validado (ADR-025).
14. Nenhum Caso já `DELIVERED` pode ser reaberto ou reescrito para incorporar aprendizado posterior — reabertura de relacionamento é sempre um estado novo, nunca uma edição retroativa do artefato entregue.

## Sobre governança de conhecimento

15. Compatibility Intelligence propõe; nunca aprova, rejeita ou retira um padrão sozinho.
16. Aprovação, rejeição e retirada de conhecimento são sempre decisões coletivas da Equipe Clínica — nunca de uma única pessoa.
17. Veto técnico sobre um padrão só pode ocorrer por violação de invariante (ex.: dependência de campo banido) — nunca por mérito clínico.

## Sobre observação e evolução

18. O Observatório da Experiência nunca age unprompted durante o Shadow Launch — apenas observa e relata.
19. Nenhuma evolução de produto é implementada a partir de especulação — apenas a partir de comportamento real observado (Observatório) ou evidência elegível (Compatibility Intelligence).

## Verificação de não-contradição

Nenhum dos 19 invariantes acima nega outro: os de autonomia do paciente (4-7) e os de reprodutibilidade (12-14) operam em momentos distintos do fluxo (decisão vs. execução); os de dados (8-11) e os de governança (15-17) operam em domínios distintos (CI vs. Governança) com papéis complementares, não sobrepostos; os de observação (18-19) restringem apenas iniciativa, não capacidade de registro.

## Documentos relacionados

Todos os `DOMAIN_*.md` e o `ARCHITECTURE_BLUEPRINT.md`.
