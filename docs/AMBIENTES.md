# Ambientes — procedimento único de build e execução

> Criado na Release de Reconstrução e Estabilização (ETAPA 1), depois que um
> `next build` sem o wrapper local embutiu a URL do Supabase **remoto** no
> bundle e o login local passou a falhar com "Credenciais inválidas", sem
> nenhum aviso. Este documento é o procedimento; as guardas em código são a
> garantia.

## Os dois backends

| Ambiente | Backend | Como as variáveis chegam |
|---|---|---|
| `local` | stack Supabase local (`127.0.0.1:54321`) | `scripts/with-local-supabase.mjs` lê `npx supabase status` e injeta em runtime — nunca por arquivo |
| `remoto` | projeto hospedado | `.env.local` (dev na máquina) ou variáveis do Vercel (produção) |

`.env.local` aponta para o projeto **hospedado**. Qualquer comando que deva
falar com a stack local passa pelo wrapper — sem exceção.

## Comandos oficiais

| Objetivo | Comando |
|---|---|
| Dev contra a stack local | `npm run dev:local` |
| Build local determinístico (limpa `.next`, builda sob o wrapper, verifica o bundle) | `npm run build:local` |
| Verificar qual backend está embutido em `.next` | `npm run verify:backend:local` (ou `verify:backend` com env remoto carregado) |
| E2E (verifica o bundle antes de rodar) | `npm run test:e2e` |
| Build remoto intencional na máquina | `ALIVIAR_AMBIENTE=remoto npx next build` |

## As quatro guardas

1. **Validação obrigatória no `next.config.ts`** — roda em `build`, `start` e
   `dev`. Sem `NEXT_PUBLIC_SUPABASE_URL`, o processo morre com instrução.
   Contradição (`ALIVIAR_AMBIENTE=local` com URL remota) morre. Backend remoto
   numa máquina local sem `ALIVIAR_AMBIENTE=remoto` explícito morre — no
   Vercel/CI (`VERCEL`/`CI` definidos) o remoto é o esperado e passa.
2. **Identidade do build** — `NEXT_PUBLIC_ALIVIAR_AMBIENTE`,
   `NEXT_PUBLIC_BACKEND_HOST`, `NEXT_PUBLIC_BUILD_COMMIT`,
   `NEXT_PUBLIC_BUILD_TIME`, expostos em **`GET /api/build-info`**. Diante de
   qualquer comportamento estranho, a primeira pergunta ("que build é este e
   para onde ele aponta?") tem resposta em uma requisição.
3. **`scripts/verify-bundle-backend.mjs`** — inspeciona `.next/server` e
   `.next/static` e falha se o host esperado não estiver lá **ou** se houver
   qualquer host de Supabase além dele (bundle misto). `.next/cache` fica de
   fora: o que importa é o que será servido.
4. **`scripts/clean-next-output.mjs`** — `build:local` sempre parte de `.next`
   vazio. Foi o cache do webpack que reaproveitou módulos com o backend errado;
   build determinístico não herda cache de outro env.

## Regra de bolso

Se o comando fala com a stack local, ele começa com
`node scripts/with-local-supabase.mjs` ou é um script `*:local`. Se você digitou
`next build`/`next dev` "a seco" e queria o local, a guarda 1 vai te parar —
esse é o comportamento correto.
