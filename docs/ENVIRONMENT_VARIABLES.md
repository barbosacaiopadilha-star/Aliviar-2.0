# Variáveis de Ambiente

Nomes documentados em `.env.example` (nunca valores). Preencha `.env.local` (ignorado pelo Git) para desenvolvimento — gerado automaticamente por `npm run supabase:env` a partir do Supabase local. Em produção, vivem apenas na configuração de ambiente da Vercel. Ver `docs/CREDENTIALS.md` para o inventário de credenciais (metadados, nunca valores) e `docs/AGENTS.md` para as regras de segurança.

| Variável | Obrigatória | Onde é lida | Efeito |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Sim | `src/lib/supabase/env.ts`, `src/lib/supabase/admin.ts` | URL do projeto Supabase. Prefixo `NEXT_PUBLIC_` é intencional — não é segredo, mas nunca deve ser confundida com a service role key. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sim | `src/lib/supabase/env.ts` | Chave anônima do Supabase, usada pelos clients de browser/server autenticados por sessão de usuário — toda autorização real continua sendo aplicada por RLS, nunca por esta chave. |
| `SUPABASE_SERVICE_ROLE_KEY` | Sim | `src/lib/supabase/admin.ts` (server-only) | Bypassa RLS. **Nunca prefixar com `NEXT_PUBLIC_`, nunca usar no cliente.** Usada apenas para operações administrativas de conta (criação de paciente pela equipe Aliviar, redefinição de senha). |
| `CLAUDE_API_KEY` | Condicional — obrigatória em produção | `src/modules/concierge/anthropic-language-model.ts`, selecionada por `getAceLanguageModel()` (`src/modules/concierge/language-model.ts`) | Ver seção "Seleção do modelo de linguagem" abaixo — o comportamento na ausência desta chave **depende do ambiente**, não é uniforme. |
| `ANTHROPIC_MODEL` | Não | `anthropic-language-model.ts` | Sobrescreve o modelo padrão (`claude-sonnet-5`) sem alterar código. |
| `NODE_ENV` | Definida pelo runtime, nunca manual | `src/modules/concierge/language-model.ts` (`isProductionEnvironment()`) | Fonte única da verdade de "estamos em produção?" em todo o repositório — nunca reimplementada em outro arquivo. |

`CLAUDE_API_KEY`, não `ANTHROPIC_API_KEY`: contorno de um bug confirmado da própria Vercel (caso aberto no suporte deles) — uma variável chamada `ANTHROPIC_API_KEY` ficava registrada corretamente no painel, mas chegava como string vazia em `process.env` em runtime, enquanto uma variável irmã (`SUPABASE_SERVICE_ROLE_KEY`) funcionava normalmente na mesma implantação. Confirmado via log de diagnóstico temporário (`Object.keys(process.env)` continha o nome da chave, mas o valor era vazio). Nunca renomear de volta para `ANTHROPIC_API_KEY` sem antes confirmar com o suporte da Vercel que o bug foi corrigido.

## Seleção do modelo de linguagem do ACE (GO LIVE #2)

Esta é a variável com comportamento mais fácil de interpretar errado — leia antes de mexer em qualquer coisa relacionada ao ACE em produção.

| Ambiente | `CLAUDE_API_KEY` presente | `CLAUDE_API_KEY` ausente |
|---|---|---|
| Desenvolvimento/teste (`NODE_ENV` ≠ `production`) | `AnthropicAceLanguageModel` (real) | `FakeAceLanguageModel` (determinístico, seguro para dev/teste/CI) |
| Produção (`NODE_ENV === "production"`) | `AnthropicAceLanguageModel` (real) | **Falha explícita** — `AceLanguageModelConfigurationError`, propagada como execução `FAILED` com `failureCode: "ACE_MODEL_NOT_CONFIGURED"`. **Nunca** cai no modelo fake. |

Ou seja: a chave presente **sempre** vence, independente do ambiente. A chave ausente é o único caso em que o ambiente muda o comportamento — e só em produção isso é tratado como erro. Ver `docs/DEBUGGING.md` para os demais `failureCode` do modelo de linguagem, e `tests/unit/language-model-selection.test.ts` para os 5 cenários cobertos por teste.

## Adicionando uma variável nova

1. Documentar o **nome** (nunca o valor) em `.env.example`, com um comentário explicando onde é lida e o que acontece na ausência dela.
2. Registrar em `docs/CREDENTIALS.md` (identificador, finalidade, ambiente, local de armazenamento, consumidores, rotação).
3. Ler via `process.env.NOME_DA_VARIAVEL` apenas em código server-only (nunca em Client Component) — a menos que seja genuinamente pública, e nesse caso o prefixo `NEXT_PUBLIC_` é obrigatório e deliberado.
4. Atualizar esta tabela.

Com a V1 congelada, isso só se aplica a uma correção de bug que genuinamente exija uma variável nova — nunca a uma funcionalidade nova.
