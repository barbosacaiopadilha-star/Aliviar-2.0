# Aliviar Curadoria v1.1

**Publicada em produção em 2026-07-27.**
Tag `curadoria-v1.1.0` · commit `36aea63` · deploy `dpl_8aGBGQs7gchbUGi7UPhqu9WgR5j1`

Uma release inteiramente sobre **como as duas pessoas que usam a plataforma trabalham dentro dela**. Nenhum critério, peso, cruzamento ou contrato de domínio mudou. O Modelo da Curadoria v1.0 segue congelado (§13).

---

## Dashboard do Paciente

A jornada deixou de ser uma lista de estados e virou um ambiente.

- **Arquitetura da experiência** — Home com quatro blocos, navegação contínua, Progressive Disclosure: o que a pessoa precisa agora aparece inteiro; o resto continua disponível, recolhido.
- **Storytelling ambiental** — as sete etapas têm fotografia, sensação e frase próprias. A hora do dia muda a saudação.
- **Cartas dos três caminhos** — cada caminho é um objeto com peso próprio, não uma linha de tabela.
- **Comparação por dimensão** — o que cada caminho responde ao que ela declarou, em linguagem de pessoa. Sem número, sem pontuação, sem colocação.
- **Memória da jornada**, estados vazios que orientam, skeletons, tokens de design, três velocidades de leitura.
- **O Dashboard não conhece o motor da Curadoria** — consome dois contratos e nada mais.

## Mesa do Curador

> *O paciente percorre uma jornada. O Curador conduz uma investigação.*

Essa frase decidiu a arquitetura inteira.

- **Quatro painéis** — cabeçalho fixo, sete etapas, área de trabalho, contexto persistente. Trocar de etapa não troca de tela.
- **Uma decisão por vez** — a Mesa calcula onde está a próxima decisão, abre ali e diz em voz alta o que falta.
- **Nenhuma etapa é bloqueada.** A investigação é dele: entra onde quiser. Etapas que dependem de outra dizem do que dependem.
- **Comparação em matriz** — coluna por profissional, linha por critério, célula que abre sozinha. Os dois cruzamentos aparecem separados, com cabeçalho de bloco, e **nunca somam**.
- **Chips inteligentes** — quatro estados completos com fonte, data, proveniência, observações e histórico, sem abrir outra tela.
- **Painel de hipóteses** — devolve o que o próprio Curador declarou. Efêmero: não é dado, não é registro, não é recomendação.
- **Painel lateral inteligente** — só o que continua aberto, e cada item leva à etapa que resolve.
- **Linha do tempo dupla** — onde o paciente está e onde a investigação está, lado a lado.
- **Filtros instantâneos** — sem menu, sem reload, e todo recorte diz quantos ficaram de fora.
- **Atalhos** — `]` `[` etapas · `J` `K` profissionais · `O` detalhes · `C` comparação · `R` Relatório · `F` filtros · `?` ajuda.
  **Nenhum atalho executa ato irreversível.** Gerar, aprovar e emitir continuam sendo clique deliberado, na etapa própria.

## Infraestrutura — isolamento de ambientes

`.env.local` aponta deliberadamente para um projeto hospedado, e todo script local o lia como fallback silencioso — inclusive o setup da suíte de integração, que cria e apaga contas.

- **Guarda central** (`scripts/env-guard.mjs`) — valida pelo **identificador real do projeto**, com lista explícita de proibidos, e recusa **antes da primeira chamada de rede**.
- **Runner local** (`with-local-supabase.mjs`) — injeta a stack local nos comandos, sem editar arquivo nenhum.
- **`db reset` trancado** — recusa `--linked`, `--project-ref` e `--db-url` remoto.
- **Validações hospedadas com allowlist** por project ref. A allowlist nasce vazia; produção **nunca** é autorizável.
- Credenciais removidas dos comentários do `.env.local`.

## Banco

Uma migration aditiva: `20260727130000_paciente_le_avaliacao_por_criterio` — política de **leitura** que permite ao paciente ler a avaliação por critério do próprio Case, **apenas depois da entrega**. Escrita continua exclusiva do Curador (ADR-035).

Rollback: `drop policy "criterion_declarations_select_patient" on curadoria.criterion_declarations;`

## Verificação

**1.410 unitários · 367 componentes · 235 integração · `tsc`, lint e build limpos.**
Rota da Mesa: 132 kB. Sessão visual em sete dimensões (1920 → 360).

## Ressalvas registradas

1. O Dashboard do Paciente ainda não passou pela sessão completa de validação visual humana feita na Mesa. Impacto baixo; validar após o deploy.
2. As animações do caminho normal foram verificadas por implementação e tokens; a observação ocorreu em `prefers-reduced-motion`.
3. Sem Dark Mode — decisão de produto, não defeito.
4. A operação real continua pendente. Este deploy não valida Curadoria real, profissionais reais nem pacientes reais.

## Rollback

- **Código:** `vercel rollback` para o deploy anterior, ou `git checkout curadoria-v1.0.0` (`bdc9486`).
- **Banco:** a política nova é aditiva e reversível com um `drop policy`.
