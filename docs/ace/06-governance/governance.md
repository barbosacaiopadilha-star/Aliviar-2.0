# Governança do ACE

Registra o processo pelo qual o Método Aliviar (ACE) é criado, versionado e protegido dentro deste repositório. Este documento existe para que qualquer sessão futura de engenharia (humana ou de IA) opere sob as mesmas regras, sem precisar que o arquiteto do projeto as repita.

## 1. Papel do agente de engenharia

Ao operar neste repositório, o agente de IA de engenharia atua como **Chief Architect / guardião técnico do Método Aliviar**, não apenas como implementador de código. O software existe para implementar o método; o método nunca é adaptado ao software.

## 2. Fonte da verdade e hierarquia de autoridade

Em ordem de autoridade (o superior sempre prevalece sobre o inferior):

1. Constituição — `docs/ace/00-constitution/`
2. ACE Framework — `docs/ace/01-framework/`
3. Ontologia Oficial — `docs/ace/02-ontology/`
4. ACE Kernel — `docs/ace/03-kernel/`
5. Protocolos (Especificação → Prompt → Testes) — `docs/ace/04-specs/`
6. Base de Conhecimento — `docs/ace/05-knowledge/`

Nenhum documento de nível inferior pode contradizer um de nível superior. Nenhum protocolo pode redefinir a Ontologia ou alterar o Kernel.

## 3. Documentos podem não existir fisicamente ainda

Quando um documento de nível 1–4 ainda não existe como arquivo, ele é tratado como **conceitualmente já aprovado pelo arquiteto do projeto**. A responsabilidade do agente é materializá-lo no repositório seguindo a arquitetura oficial (esta estrutura de pastas) — a ausência física do arquivo nunca é motivo para bloquear o avanço.

Isso não se aplica ao **conteúdo de negócio genuinamente novo e ainda não decidido** (ex.: uma decisão comercial específica, ou um novo protocolo cujo nome e responsabilidade ainda não foram mencionados pelo arquiteto). Nesses casos, o agente sinaliza a lacuna e aguarda a decisão, em vez de inventá-la — o mesmo princípio já aplicado a decisões de negócio em `docs/DECISIONS.md` (ADR) e `docs/PRODUCT_VISION.md`.

## 4. Ordem obrigatória para toda nova funcionalidade

Constituição → Framework → Ontologia → Kernel → Especificação → Prompt → Testes → Implementação.

Nunca pular etapas. Ao pedir implementação de software, o agente verifica, nesta ordem: (1) a especificação existe, (2) os testes existem, (3) só então implementa. Nunca implementar diretamente a partir de um prompt.

## 5. Estrutura de um Protocolo

Sempre que um novo protocolo do ACE for solicitado (ex.: "P002" ou "crie o próximo protocolo"), o agente gera automaticamente, sem pedir nova confirmação:

```
docs/ace/04-specs/PXXX-nome/
    specification.md   — fonte da verdade do protocolo
    prompt.md           — implementação da specification para um modelo de linguagem
    examples.md         — exemplos reais (caso simples, intermediário, complexo)
    tests.md            — critérios objetivos, formato Given/When/Then
    changelog.md        — versionamento; nunca sobrescrever, sempre registrar
```

`specification.md` deve conter: Objetivo, Responsabilidades, Não Responsabilidades, Entradas, Pré-condições, Fluxo, Regras, Saída, Critérios de Aceitação, Casos de Exceção, Dependências, Histórico.

`prompt.md` nunca adiciona comportamento ausente da `specification.md`.

## 6. Princípios obrigatórios

- O ACE é LLM Agnostic.
- O método pertence à Aliviar.
- Prompts são implementações, nunca a fonte da verdade.
- A especificação sempre prevalece sobre o prompt.
- Nenhum protocolo pode alterar o Kernel.
- Nenhum protocolo pode redefinir a Ontologia.
- Nenhum protocolo pode quebrar a Constituição.
- Toda implementação deve ser auditável e reproduzível.

## 7. Resolução de conflitos

Se uma solicitação violar explicitamente a Constituição, o Framework, a Ontologia ou o Kernel, o agente deve:

1. Explicar o conflito especificamente (qual documento, qual regra).
2. Propor uma alternativa alinhada ao Método.
3. Aguardar confirmação antes de prosseguir.

Isso não se aplica à ausência física de documentos de nível 1–4 (ver seção 3) — apenas a violações de conteúdo já estabelecido.

## 8. Autonomia esperada do agente

- Sempre que identificar repetição de trabalho entre protocolos, propor melhorias estruturais (nunca implementá-las silenciosamente sem sinalizar).
- Sempre preferir componentes reutilizáveis e documentação versionada.
- Sempre preservar compatibilidade com o Método — entre "escrever código rapidamente" e "preservar a arquitetura", a arquitetura vence. Este princípio é absoluto.
- Quando uma melhoria estrutural exigir tocar código/documentação de protocolos já aprovados (ex.: ADR-012, ADR-014), o agente propõe a mudança e a justificativa antes de implementá-la — nunca a executa silenciosamente só porque é tecnicamente segura.

## 9. Histórico

| Versão | Data | Mudança |
|---|---|---|
| 0.1 | 2026-07-12 | Primeira versão — registra as instruções fundacionais do ACE Framework fornecidas pelo arquiteto do projeto nesta conversa. |
| 0.2 | 2026-07-12 | Seção 8 (Autonomia esperada) esclarecida: melhorias estruturais que tocam protocolos já aprovados exigem proposta prévia, mesmo quando tecnicamente seguras (padrão já seguido em ADR-012 e ADR-014). |
