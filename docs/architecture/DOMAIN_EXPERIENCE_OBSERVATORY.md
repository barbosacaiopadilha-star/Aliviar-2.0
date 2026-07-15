# Domínio: Observatório da Experiência

**Estado**: Protocolo ativo (Arquiteto Observador, Observatório de Evolução Contínua), sem dado real acumulado ainda — aguardando início do Shadow Launch com profissionais reais.

## Missão

Observar, de forma transversal a todos os domínios, como pacientes, Curadores e o sistema como um todo vivem a experiência real — para que a evolução futura da Aliviar seja guiada por comportamento real registrado, nunca por especulação.

## Responsabilidade

- Registrar atrito operacional e de produto em qualquer domínio (UX, fluxo, linguagem, pontos de confusão) durante o uso real.
- Aplicar o protocolo de investigação de quatro blocos ao analisar qualquer incidente ou observação: Correção, Aprendizado Arquitetural, Aprendizado de Produto, Oportunidades de Evolução.
- Permanecer estritamente observacional durante o Shadow Launch — Claude, no papel de Arquiteto Observador, nunca age unprompted sobre o que observa.

## Fronteiras

**Pertence a este domínio**: qualquer atrito de UX/produto/operação em qualquer um dos outros seis domínios, captado durante uso real.
**Não pertence**: avaliar compatibilidade humana entre paciente e profissional — isso é exclusivo de Compatibility Intelligence, mesmo quando ambos usam a palavra "evidência". O Observatório pergunta "isso funcionou bem para quem usou?"; o CI pergunta "este par foi humanamente compatível?" — perguntas disjuntas.

## Entradas

- Uso real do produto por pacientes, Curadores e equipe, uma vez iniciado o Shadow Launch.
- Incidentes registrados manualmente ou observados diretamente.

## Saídas

- Registros de investigação estruturados em quatro blocos.
- Oportunidades de evolução, propostas — nunca implementadas automaticamente.

## Dependências

- Depende de todos os outros seis domínios como fonte de observação (é o único domínio que "escuta" todos os demais).
- Nenhum outro domínio depende do Observatório para funcionar — sua saída é sempre insumo para decisão humana futura, nunca uma dependência operacional em tempo real.

## Fonte oficial da verdade

- **Registro de incidentes/observações reais e sua análise em quatro blocos**: exclusivamente o Observatório da Experiência — nenhum outro domínio mantém esse tipo de registro.

## Invariantes

- Nunca age unprompted durante o Shadow Launch — apenas observa e relata.
- Toda observação segue o protocolo de quatro blocos, sem pular etapas.
- Nunca fabrica ou infere dado de uso real que não tenha sido de fato observado.

Ver também os invariantes transversais em `ARCHITECTURAL_INVARIANTS.md`.

## O que este domínio nunca poderá fazer

- Nunca poderá avaliar ou pontuar compatibilidade humana entre paciente e profissional — escopo exclusivo do CI.
- Nunca poderá implementar uma mudança sozinho a partir do que observa — toda oportunidade de evolução é proposta, nunca executada sem autorização explícita.
- Nunca poderá operar com dado especulativo — enquanto não houver Shadow Launch real, este domínio permanece vazio por definição, não preenchido com suposição.

## Documentos relacionados

- Memória `feedback_investigation_protocol.md`, `feedback_arquiteto_observador_role.md` — protocolo operacional detalhado.
- `docs/SHADOW_LAUNCH_PLAN.md` — condição de entrada em operação real.
- `DOMAIN_COMPATIBILITY_INTELLIGENCE.md` — domínio irmão de escopo disjunto.

## Diagrama

Ver diagrama mestre em `ARCHITECTURE_BLUEPRINT.md`. Neste domínio, o trecho relevante é: `OBSERVATÓRIO ◀── (escuta todos os domínios)`.
