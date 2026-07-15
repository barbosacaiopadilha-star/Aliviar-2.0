# Golden-Set Testing dos protocolos LLM do ACE

Material de apoio, não normativo (ver `docs/ace/README.md`, seção "Hierarquia de autoridade"). Não altera Constituição, Framework, Ontologia, Kernel ou qualquer `specification.md`/`prompt.md` — é ferramental de engenharia em torno do Método já congelado (V1.0), coberto pelo fluxo geral de `docs/AGENTS.md`, não pelo fluxo de criação de protocolo (`docs/ace/06-governance/governance.md`).

## Propósito

O Kernel (`docs/ace/03-kernel/kernel.md`, seção 4) exige: *"dado o mesmo estado de entrada, um protocolo deve produzir uma saída consistente com sua especificação — variação de estilo é aceitável, variação de regra não é."*

A validação Zod em runtime (`src/modules/concierge/anthropic-language-model.ts`) garante que a resposta do modelo tem a **forma** certa. Ela nunca garante que o **conteúdo** obedece as regras da `specification.md` de cada protocolo (ex.: P004 classificar `urgency` corretamente dado um sinal de prazo relatado). Como toda a suíte de testes existente (`tests/integration/`, `tests/unit/`) roda contra `FakeAceLanguageModel` — determinístico por construção —, nenhum teste automatizado hoje exercita o comportamento de conteúdo do modelo Anthropic real. A suíte golden (`tests/golden/`) fecha essa lacuna.

Só os protocolos que efetivamente chamam o modelo de linguagem participam: **P002, P003, P004, P010** (ver `PROTOCOL_CONFIG` em `anthropic-language-model.ts`). P005–P008 são determinísticos, sem I/O de IA — não há o que testar aqui.

## Como está organizado

- `tests/golden/fixtures/p0XX-*.ts` — um arquivo por protocolo. Cada fixture reaproveita um caso de `docs/ace/04-specs/P0XX-*/examples.md`, com um `assert()` que verifica as regras de `tests.md` que dependem do conteúdo gerado pelo modelo (não da forma, já coberta pela validação Zod, nem de invariantes puramente estruturais como imutabilidade — essas continuam nos testes unitários de `src/modules/ace/artifacts/*`).
- `tests/golden/ace-protocols.golden.test.ts` — runner único: instancia `AnthropicAceLanguageModel` diretamente (nunca `getAceLanguageModel()`, que cairia no modelo fake fora de produção), roda cada fixture contra a API real, passa a resposta pela função de construção real do protocolo, e aplica o `assert()`.
- `vitest.golden.config.ts` / `npm run test:golden` — categoria isolada, nunca incluída em `npm test`, `test:integration`, `test:components` ou em CI automática (este repositório não tem `.github/workflows/` hoje). A suíte inteira é pulada (`describe.skipIf`) quando `CLAUDE_API_KEY` não está definida — nunca falha ruidosamente por falta de configuração, e nunca roda contra o modelo fake.

## Executando contra o modelo real (autorização obrigatória)

**A presença de `CLAUDE_API_KEY` nunca é suficiente, sozinha, para autorizar uma chamada real.** É sempre exigida também `ALLOW_REAL_MODEL_CALLS=true`, explícita e inequívoca (só a string exata `"true"`, case-insensitive — `"false"`, `"0"`, string vazia ou qualquer outro valor nunca autorizam). A checagem (`tests/golden/real-model-call-guard.ts`, função pura, sem I/O) roda antes de qualquer `AnthropicAceLanguageModel` ser instanciado:

- **Sem `ALLOW_REAL_MODEL_CALLS=true`** (com ou sem `CLAUDE_API_KEY`): a suíte inteira fica **bloqueada por padrão** — um único teste informativo explica o motivo, nenhuma chamada é tentada.
- **Com `ALLOW_REAL_MODEL_CALLS=true` mas sem `CLAUDE_API_KEY`**: falha com um erro de configuração claro — nenhuma chamada é tentada.
- **Com `ALLOW_REAL_MODEL_CALLS=true` e `CLAUDE_API_KEY` presentes**: a suíte roda normalmente contra a API real.

Comando para autorizar deliberadamente uma execução real:

```
ALLOW_REAL_MODEL_CALLS=true npm run test:golden
```

PowerShell:

```
$env:ALLOW_REAL_MODEL_CALLS = "true"; npm run test:golden
```

Nunca defina `ALLOW_REAL_MODEL_CALLS=true` de forma permanente em `.env.local` ou em qualquer perfil de shell persistente — o valor deve ser passado deliberadamente a cada execução real, exatamente para evitar o tipo de chamada acidental descrito no incidente abaixo.

### Incidente — duas chamadas reais não autorizadas (2026-07-15)

Durante a verificação da suíte, `unset CLAUDE_API_KEY` foi executado no shell antes de rodar `npm run test:golden`, na expectativa de que a suíte pulasse por falta de chave. Isso não foi suficiente: `tests/golden/setup-env.ts` lê `.env.local` diretamente (arquivo que ainda continha `CLAUDE_API_KEY` de uma configuração anterior desta mesma sessão), preenchendo a variável de volta antes da suíte rodar. Resultado: **duas chamadas reais à API Anthropic ocorreram sem autorização** (fixtures de P003 e P004). Nenhum segredo foi exposto em nenhum momento. O resultado dessas duas chamadas **não foi usado como critério de decisão** — nenhuma fixture, prompt ou código foi alterado com base nele, e o histórico de calibração (`docs/ace/CALIBRATION_REPORT.md`) não foi reescrito para incorporá-lo. A proteção descrita nesta seção (`ALLOW_REAL_MODEL_CALLS`) foi adicionada especificamente para impedir a recorrência: a partir dela, a ausência de autorização explícita bloqueia a suíte antes de qualquer chamada, independentemente do que estiver presente em `.env.local` ou no shell.

### Incidente — oito chamadas reais não autorizadas durante reconstrução de histórico (2026-07-15)

Ao reorganizar o histórico de commits do Golden Set, uma versão intermediária do runner — anterior à existência desta proteção — foi reconstruída temporariamente para compor um commit-base separado. Para validar essa versão sem disparar uma chamada real, tentou-se `CLAUDE_API_KEY=` (string vazia) no shell antes de `npm run test:golden`. Isso não bloqueou nada: `tests/golden/setup-env.ts` só preenche a variável quando `!process.env[chave]`, e uma string vazia também é falsy em JavaScript — a chave real de `.env.local` foi recarregada e a suíte rodou contra a API real. Resultado: **oito chamadas reais ocorreram sem autorização** (duas falharam, seis concluíram). Nenhum segredo foi exposto. Os resultados não foram usados como evidência de nada e permaneceram apenas em `.golden-results/` (sempre ignorado pelo Git) — a pasta gerada por essa execução específica foi removida manualmente depois, sem afetar as demais.

**Decisão resultante:** a existência de qualquer ponto no histórico em que o runner pudesse rodar sem o gate — mesmo que só como estado intermediário de uma reconstrução de commits — foi considerada incompatível com o objetivo desta proteção. A infraestrutura do Golden Set e o gate `ALLOW_REAL_MODEL_CALLS` passaram a nascer no mesmo commit, eliminando a possibilidade de um checkout isolado (ou uma tentativa de validação isolada, como a que causou este incidente) encontrar uma versão do runner sem proteção.

## Quando rodar

Sob demanda — nunca a cada commit (custo real de tokens/API a cada execução):

- Depois de editar o `prompt.md` de P002, P003, P004 ou P010.
- Depois de trocar `ANTHROPIC_MODEL`/a versão do modelo em uso.
- Periodicamente, como auditoria manual de deriva de comportamento.

## Como adicionar um novo caso golden

1. O caso já deveria existir em `docs/ace/04-specs/P0XX-*/examples.md` (fonte de verdade do exemplo) — se não existir, adicione lá primeiro.
2. Identifique em `tests.md` do protocolo qual(is) T-número(s) dependem do conteúdo gerado pelo modelo (não apenas da forma).
3. Adicione uma fixture em `tests/golden/fixtures/p0XX-*.ts`, com `assert()` verificando a **regra**, nunca o texto exato — comparação de igualdade textual com a saída do modelo é sempre frágil e vai quebrar por variação de estilo legítima.
4. Rode `npm run test:golden` localmente (com `CLAUDE_API_KEY` em `.env.local`) antes de considerar a fixture pronta.

## Critério de reprovação

Uma fixture golden falhando é sinal de **deriva de regra**, não de estilo — investigue antes de simplesmente ajustar a asserção. Se a asserção original estava certa e o modelo/prompt mudou de comportamento de forma que viola a `specification.md`, o problema é no `prompt.md` ou na versão do modelo, nunca na fixture.

## Observabilidade segura (diagnóstico local de falhas)

Toda falha (nunca um sucesso) grava um artefato de diagnóstico sanitizado em `.golden-results/<execução>/<protocolo>-<fixture>.json` (`tests/golden/golden-results-writer.ts` + `tests/golden/sanitize-for-log.ts`) — `.golden-results/` está no `.gitignore`, nunca commitado, nunca enviado a nenhum serviço externo.

- Contém: protocolo, fixture, timestamp, `modelId`, duração, código de erro sanitizado, a mensagem da expectativa que falhou, e o `output` estruturado do modelo (nunca o texto bruto da resposta HTTP) — sempre passado por `sanitizeForLog` (redige por nome qualquer campo com `key`/`token`/`secret`/`password`/`credential`/`authoriza`/`prompt`/`header`/`cookie` no nome, trunca strings longas, limita arrays grandes).
- Nunca contém: a chave (`CLAUDE_API_KEY`), o `systemPrompt`, o prompt integral, headers HTTP, ou dado de paciente real (as fixtures do golden set são sempre sintéticas, nunca dado de produção).
- Best-effort: uma falha ao gravar o arquivo nunca derruba a suíte — só emite um aviso no terminal.
- O terminal continua mostrando apenas o resumo padrão do Vitest (nome do protocolo/fixture, pass/fail) — o arquivo é o único lugar com o detalhe completo, e só existe localmente.
- Existe especificamente para o caso em que a causa raiz de um FAIL depende do conteúdo exato que o modelo gerou naquela execução (estocástico — uma reexecução manual pode produzir uma amostra diferente e não reproduzir a falha original).
