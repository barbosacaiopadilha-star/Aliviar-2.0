# AUDITORIA 07 — UX, ACESSIBILIDADE, CONTEÚDO E COERÊNCIA DA EXPERIÊNCIA

**Data:** 2026-08-02 · **Fase:** 7 da Auditoria Geral (após Fases 1–6)
**Natureza:** inspeção somente de código e conteúdo — nenhum texto, componente, CSS ou tela foi alterado. Sem execução de axe/Lighthouse; contrastes calculados sobre tokens estáticos, com certeza declarada. **Nenhuma conformidade WCAG é declarada.**
**Pergunta:** *a experiência é compreensível, segura, acessível, coerente e adequada aos papéis, inclusive em erro e exceção?*

## 1. Resumo executivo

**Veredicto: a experiência ainda possui riscos de compreensão, acessibilidade ou confiança.**

O produto tem uma **voz** — e ela é boa: confirmações que dizem o que vai acontecer, vazios que legitimam o estado e dão o próximo passo, acessibilidade imposta pelo compilador (rótulo obrigatório por tipagem), o wizard da história como referência de carga cognitiva, e os textos de escolha/pós-escolha da paciente como o melhor conteúdo do produto. A cultura existe e está documentada em comentários que registram aprendizados de bugs reais.

Os riscos se concentram em quatro famílias:

1. **A experiência promete o que o sistema não sustenta** (herança direta das Fases 3–4, agora com o texto na mão): "registrado e permanente" sobre checkbox reeditável; "cada movimento fica registrado com autor" sobre `useState` volátil; "congela quando emitido" quando só trava na entrega; "a seleção é sempre de uma pessoa, com nome" — e `curatorName: null` **hardcoded** na tela onde as três opções aparecem; a pendência de publicação apontando para um **painel que não existe**.
2. **Os momentos mais delicados têm os piores textos**: sessão expirada no reconhecimento = **"Este Perfil não é seu."**; o CTA central da jornada da paciente ainda diz **"Validar meu Perfil de Prioridades"** (o termo que a ADR-042 aposentou); o limbo pós-envio é uma frase sem sujeito, sem prazo e sem canal — para sempre; o 404 é HTML cru que despeja gente logada na landing.
3. **Papéis que leem trabalho que não podem executar**: o Curador é cobrado eternamente por uma avaliação sem superfície (crítico — provavelmente trava toda Curadoria real); o Concierge lê imperativos sem um único botão, sobre Cases identificados por hash; o atendente é barrado da tela chamada "Atendimento"; o profissional nunca sabe que foi escolhido e, sem vínculo de perfil, vê só a saudação.
4. **Acessibilidade: base forte, seis furos altos**: `aria-describedby` existe **uma vez** no repositório (erros nunca vinculados aos campos); dois `<main>` aninhados na Mesa, um deles **live region inteira**; Dialog/Drawer sem focus trap; página do perfil sem heading; e perigos silenciosos de destruição — a lixeira que apaga documento clínico **sem confirmação, no componente que a paciente também usa**.

## 2. Escopo e método

Quatro frentes novas (acessibilidade quantificada; linguagem/microcopy; carga cognitiva+estados+responsividade; experiência por papel+falha) + consolidação das Fases 2/4/6 para navegação, feedback e prevenção de erro. Duas premissas de fases anteriores foram **corrigidas** por esta inspeção: a Mesa **usa** progressive disclosure real na área de trabalho (o problema é o aside), e o LeadWorkspace mostra **uma** etapa por vez (o melhor disclosure do backoffice). Evidência sempre rota/componente/linha; certeza declarada.

## 3. Mapa de jornadas (síntese)

| Papel | Jornada disponível | Qualidade | Furos de experiência |
|---|---|---|---|
| Paciente | história→espera→reconhecimento→relatório→escolha→contato | forte no que existe | limbo sem prazo/canal; pendência boa calculada e **não renderizada** (`page.tsx:75` vs `:83-99`); contradição na mesma dobra ("Em preparação" × "ainda não começou") |
| Curador | fila→acolher→mapa→portas→seleção→relatório→entrega | forte, com becos | pendência perpétua da Avaliação; correção de declaração inexistente; sem realimentação de pendências; sem autosave na Mesa |
| Admin | cadastros→verificação→publicação→casos→equipe | funcional | 6 ações destrutivas sem confirmação; becos (papéis não concedíveis, painel inexistente); auditoria só de papéis |
| Atendente | lead→qualificar→converter→abrir→encaminhar | completa e bem desenhada | barrado de `/coa/atendimento`; sem permissões CRM; senha do paciente exibida longe do botão que a gerou |
| Concierge | leitura apenas | vitrine | trabalho listado sem instrumento; avisos só contados; pessoas como hash |
| Profissional | protocolo+declarações+evidências | parcial | nunca informado da seleção; com `profile_id` NULL (100% hoje), só a saudação, sem explicação |

## 4. Navegação (consolidação Fases 2/4 + novos)

Mantidos: "Perfil"×"Conta" (um rótulo, dois conceitos, mesmo destino com dois nomes — e metadata "Meu perfil", terceiro rótulo); 3 endereços do curador; item de menu para redirect; contornos NAV/RECONHECE como dependência. Novos: **"etapa N de 7" com máximo real 4** (`portal-curador/page.tsx:118` — o comentário acima registra a correção da ambiguidade e o 7 ficou); `AvaliacaoSemElegiveis` mandando para etapa cujo nome não bate; 4 indicadores simultâneos de "onde estou" na Mesa (2 réguas + 2 timelines); botão que navega nos 7 passos do wizard (`router.push` — perde nova aba/anúncio de link).

## 5. Linguagem e vocabulário (síntese — tabela integral no relatório da frente)

**Crítico**: `jornada.ts:114` — CTA "**Validar** meu Perfil de Prioridades" (termo aposentado, no ato central, divergindo do botão real). **Altos**: `<dt>Validação</dt>` sobre "Reconhecido por você" (a linha se contradiz); timeline da Mesa nomeando etapa "Validação"; guidance do parecer instruindo "relacione com os **pesos** que o paciente **validou**" — **vaza para o documento final**; "atende **melhor**" roçando ranking; landing v2 morta descrevendo os 100 pontos abolidos (verificar antes de reativar). **Consistências boas**: "Porta" nunca vaza para UI; "Case" limpo na superfície da paciente; "cruzamento" só interno. **Variações**: os 5 campos do parecer com títulos divergentes entre Mesa e Relatório (o Curador reescreve sem saber se é o mesmo texto); "Curadoria entregue"/"Relatório entregue"/"Entregue em"/"Entrega" — 4 nomes para o mesmo evento; "Registrar a História"×"Registrar a história". **O produto proíbe o próprio vocabulário**: `admin/page.tsx:204` usa "Cases atrasados"/"Tarefas vencidas" — literalmente listados em `VOCABULARIO_PROIBIDO` (`continuity-labels.ts:97-106`) com guarda testável.

## 6. Feedback (consolidação Fase 2/6 + novos)

Padrão `isLoading` forte (30 arquivos) — mas o `Button` **troca qualquer rótulo por "Aguarde..."**, anulando textos como "Gravando a seleção e o parecer…". Novos: **"Gerar rascunho assistido" é o único botão lento sem `isLoading`** (clique→cinza→nada — reclique provável); sucesso de `declareArea` sem mensagem (refresh silencioso); upload sem progresso; sucesso do acolhimento não anunciado (a11y). Mantidos: falsa confirmação do autosave (P0 da Fase 2, agora com a leitura de conteúdo: o indicador afirma em linguagem humana o que não aconteceu); "Registrando…" eterno se o reload falhar — **com o RPC já persistido** (ela acha que falhou; o Perfil já congelou).

## 7. Prevenção de erro

**Confirmações-padrão-ouro onde existem**: reconhecimento (efeito+custo+botão nomeado), entrega ("Depois disso o documento não muda mais. Confirma?" com recusa "Ainda não"), regenerar ("descartando minhas edições"). **Zero confirmação nas 6 superfícies destrutivas do admin** (reset de senha — o aviso só aparece *depois*; despublicar — sem dizer que remove das Curadorias em curso; **lixeira de documento — imediata, no componente compartilhado com a paciente**; desativar acesso; desativar profissional; revogar papel) + a 7ª do Curador ("Remover" filtro apaga o motivo nas palavras da paciente). `window.confirm` = zero ocorrências no repositório. Botões desabilitados sem explicação no passo mais sensível (wizard `nextDisabled` mudo — contra a regra escrita da própria casa) e no LeadWorkspace (4 condições não explicadas).

## 8. Carga cognitiva

**Exemplares**: wizard (1 pergunta/tela), LeadWorkspace (1 etapa derivada), home da paciente (leve; 5 blocos, docstring diz 4), Mesa-área-de-trabalho (1 etapa por vez + "Sua vez:" como ação primária clara). **Pesados**: aside da Mesa — **9 seções simultâneas em 320px fixos** (nunca ganha espaço nem em 2560px), incluindo um CRUD de governança de 644 linhas com 5 fieldsets em scroll aninhado; **"Merece atenção" sem teto** — 4 laços sem slice viram 100+ itens idênticos e o painel de foco se autodestrói (contra o próprio docstring); mesa-workspace — até **16 textareas numa rolagem** com o Encerrar 3 telas abaixo, **sem autosave, sem beforeunload** (perda silenciosa de 20+ min, contra a promessa do docstring); report-editor repetindo os 16 campos com rótulos divergentes; admin/profissionais/[id] — 5 formulários, ≥8 submits, nenhuma ordem; coa/concierge — 9 blocos, CTA que é só um link, e a contradição interna "nenhum 'atrasado'" × KPI "Tarefas com prazo passado" 60 linhas abaixo.

## 9. Estados vazios, loading e erro

Cultura de vazio nomeado real (29 EmptyState + 5 vazios editoriais da Mesa + estados da paciente — "você não precisa ficar conferindo" é o modelo). Exceção única: **CRM Tarefas renderiza vazio como área branca**. Loading/error por segmento: **a Mesa — a rota mais pesada (~10 queries) — não tem `loading.tsx` nem `error.tsx`**: o clique não muda nada na tela ("parece travado" mais provável do produto) e qualquer falha cai no boundary raiz inexistente. `Skeleton` órfão; esqueletos só na paciente (assimetria: paciente tem esqueleto, operador tem tela parada). ERR- nunca chega ao usuário no boundary (Fase 6 confirmada); 12+ pontos entregando `error.message` cru do Postgres (CRM inteiro, responsabilidade).

## 10. Acessibilidade (síntese — relatório integral na frente)

**Base quantificada**: 399 `focus-visible` / 128 `aria-label` / 61 alvos 44px / 43 `htmlFor` / 26 `role=alert` / 16 fieldsets / zero tabindex positivo / zero drag-só-mouse / `scope="colgroup"` na matriz (acima do mercado) / a11y **por tipagem** em Input/Radio/Checkbox/IconButton. **Altos (6)**: `aria-describedby`+`aria-invalid` = **1 ocorrência no repositório** — o FormField cria o id do erro e nunca o vincula; **dois `<main>` aninhados na Mesa**; **`<main aria-live="polite">`** na região de trabalho inteira; Dialog/Drawer **sem focus trap** (Tab escapa do modal); Drawer fechado com filhos focáveis (em viewport <lg); `/paciente/perfil` sem heading. **Médios**: portal-shell sem skip link (todo o Portal do Curador); 21 rotas sem `metadata.title` (os 7 passos do wizard compartilham título de aba); tabelas sem caption/scope e wrapper rolável não-focável; atalhos de tecla única sem desativação (SC 2.1.4); input file `sr-only` sem foco visível; menu de usuário com `role="menu"` incompleto; `text-brand-gold` ≈3,09:1 como texto pequeno em 3 pontos; `ink-muted`/`recessed` ≈4,49:1 na fronteira. Três correções concentrariam ~9 dos 22 achados.

## 11. Responsividade

Mobile da Mesa **bem tratado e honesto** ("no celular a Mesa é consulta" — documentado); matriz de comparação com uma-coluna-por-vez no toque (excelente); paciente fluida. Problemas: **grid da Mesa só vira 2 colunas em ≥1280px** (laptop com sidebar = aside inteiro abaixo de tudo); **4 tabelas admin com `min-w-[36rem]` cortando a coluna de ações no mobile sem indicação** (o padrão de cards existe — só no CRM); três réguas de breakpoint convivendo (lg/sm Tailwind, 767/1280 na Mesa, md na matriz — faixa morta 1024–1279); report-editor operável mas exaustivo no toque (Emitir a ~8 telas).

## 12. Paciente ("uma pessoa vulnerável entende?")

Os achados A1–A9 da frente: a pendência bem escrita **jogada fora**; o limbo eterno sem sujeito/prazo/canal; a contradição na primeira dobra; **privacidade = uma frase em todo o produto** ("acesso só seu e da nossa equipe" — equipe nunca definida; a revisão promete escopo de acesso que nada detalha); Invariante 28 dita exemplarmente **sem porta de contato** ("fale com seu Curador" — sem nome/canal); sessão expirada = acusação; texturas da comparação sem legenda (e `NAO_ATENDE` = ausência de linha, indistinguível de falha); **o melhor texto do produto** na escolha/pós-escolha ("pode trocar aqui mesmo, sem precisar explicar nada"; "Ainda não conseguimos fazer essa aproximação por você" — honestidade sobre capacidade). Resposta à pergunta-guia: **no caminho feliz, sim; na espera, no erro e na exceção, não.**

## 13. Curador ("opera sem conhecimento tácito?")

**Não, em quatro pontos**: a pendência perpétua da Avaliação (a Mesa cobra eternamente um ato sem superfície — ele não tem como saber que o botão não existe); declaração terminal sem correção visível (o backend aceita upsert; a tela some com o botão e não diz que há caminho); pendência de informação sem realimentação (só relendo o painel descobre que a resposta chegou); alerta E-02 reduzido a código na fila (a orientação de Método vive no `detail` descartado). **Autoria como UUID truncado** na Base de Evidências ("Verificada por `9b21ff04`…") — o que o Método exige rastrear é o que a tela não diz. **Positivo**: a proveniência da Mesa (exigência×declaração, fonte, verificação, histórico, divergência em duas versões) é a superfície mais honesta do produto; `mesa-investigacao` declara sua efemeridade e a cumpre (o problema de promessa é do mesa-workspace, não daqui).

## 14. Administrador ("entende o impacto e recupera?")

Não nas destrutivas (§7 — 6 sem confirmação, `window.confirm`=0) e não na recuperação: **a única auditoria visível só sabe falar de papéis** (`audit-log-list` com 2 frases) — quem apagou documento, despublicou, desativou: invisível para quem responde pela operação. Becos com texto: o dashboard **acusa** papéis zerados/acumulados em dourado e a Equipe declara gerenciar só 2; a pendência bloqueante manda "resolver no painel de evidências" que não existe; o card "Execução do ACE" vazio. E o vocabulário proibido no próprio dashboard (§5).

## 15. Atendente / Concierge / Profissional (experiência real)

**Atendente**: jornada completa e bem desenhada no `/atendimento`; barrado de `/coa/atendimento` com "Esta parte da casa não é sua." (a página de acesso-negado é boa — o problema é ela **mentir** para este papel); sem permissões CRM (Fase 2); a senha gerada aparece no topo enquanto o botão está no rodapé — perda irreversível provável. **Concierge**: a Caixa de Continuidade lista imperativos reais ("ela pediu a aproximação e não há tentativa aberta") **sem um único botão na página inteira**, sobre `Case a3f81c2e…` — trabalho ilegível e inexecutável; avisos só contados, sem onde abrir. **Profissional**: nunca informado da seleção (a paciente escolhe; a tela dele é a mesma de ontem); com `profile_id` NULL (100% dos perfis hoje — Fase 3), a página inteira colapsa para a saudação **sem nenhum texto explicando o vazio**; pedidos de revisão só visíveis para quem tem rascunho.

## 16. Microcopy (consolidado na §5 + frente)

Adicionais: "A equipe segue com o seu caso." — o fallback afirmativo exatamente quando o sistema não sabe; "Não foi possível registrar agora. Tente de novo." no ato mais delicado; o disclaimer honesto do formulário do profissional que joga o defeito em quem não pode resolver, sem canal; `route-error` sem referência (suporte cego); `{alert.code}` em font-mono antes da frase. Padrões bons a preservar nomeados no relatório.

## 17. Confiança e transparência

**Mostra bem**: Base de Evidências (versão·fonte·datas·histórico·divergência), declaração de área lado-a-lado, reconhecimento com data+curador no perfil, "Três coisas que nunca mudam" no journey-walk. **Quebra onde mais importa**: `curatorName: null` **hardcoded** (`patient-curadoria.ts:186`) — a promessa "a seleção é sempre de uma pessoa, com nome" morre na tela das três opções; emissão/entrega sem autor (Fase 3) espelhadas em texto que afirma autoria; "o que pode ou não ser alterado" comunicado em exatamente 3 lugares e ausente onde há risco real (história pós-envio, documentos já lidos pela Curadoria, declaração do Curador).

## 18. Experiência em falha (14 cenários — síntese)

Sessão expirada: a frase "sua sessão expirou" **não existe no produto** — 30+ "Não autorizado." sem link de login, mais a acusação do reconhecimento e a mentira do autosave. Erro de rede: bom quando a action responde; exceção real cai no boundary (perde estado; 6 segmentos nem boundary têm). Conflito de revisão: banner bom que não diz o destino do que ela escrevia agora. Arquivo inválido: nada valida, nada explica ("Tente novamente" para um .exe de 2GB). **404: 16 linhas de HTML cru, sem shell, mandando gente logada para a landing** (o comentário do acesso-negado dizia que aquela era a última superfície sem cuidado — o 404 continua sendo). Acesso negado: página boa, acionada indevidamente. **Relatório indisponível (C4): não é tela em branco — é pior: uma frase serena afirmando que o trabalho não terminou, enquanto do outro lado consta entregue**; ninguém é alertado. Rede vazia: texto exemplar (sem link). <3 elegíveis: dois canais dizendo coisas diferentes; na Mesa é bloqueio com `pending: null` — o "terceiro caso" que a casa proíbe para a paciente e comete com o Curador. Entrega parcial: invisível por construção — só o par de telas inconsistentes.

## 19. Relação com as Fases 1–6

Cada família mapeada à raiz: promessas×invariantes (F3/F4 — o texto agora localizado linha a linha); becos e papéis inoperantes (F2 — superfícies ausentes viram cobranças eternas e listas inexecutáveis); confirmações ausentes (F2 admin + F3 sem trilha = destruição silenciosa completa: sem aviso antes, sem registro depois); falsa confirmação e contornos (F2/F5 — dívidas com experiência residual); vocabulário aposentado (F1 docs defasados → agora no CTA da paciente); acessibilidade do FormField (F5 — mesma classe de "primitiva quase certa não generalizada"); 404/limbo (F2 estados sem dono). Nenhum achado duplicado sem a relação causal.

## 20. Achados por gravidade

**Críticos (6):** pendência perpétua da Avaliação cobrando ato sem superfície (trava operacional real) · CTA "Validar meu Perfil" no ato central · "Este Perfil não é seu." para sessão expirada + "Registrando…" eterno com RPC persistido (par do mesmo ato) · lixeira sem confirmação em componente da paciente (documento clínico, 1 toque, sem undo, sem trilha) · promessas de permanência/autoria sobre estado volátil ("registrado e permanente"; "com autor" sobre useState; painel inexistente) · upload sem validação com mensagem genérica (canal clínico).

**Altos (18 — síntese):** curatorName null hardcoded · Mesa sem loading/error.tsx · mesa-workspace sem autosave · aria-describedby ×1 no repo · 2 `<main>` + live region gigante · Dialog/Drawer sem trap · 6 destrutivas admin sem confirmação · auditoria visível só de papéis · Concierge inexecutável + avisos só contados · profissional nunca informado + vazio mudo · atendente barrado de "Atendimento" · limbo eterno sem canal · privacidade em uma frase · 404 cru · F7 (frase serena sobre entrega perdida) · "etapa N de 7" · "Merece atenção" sem teto · guidance do parecer com pesos/validou vazando ao documento.

**Médios (seleção):** títulos do parecer divergentes · 4 nomes para entrega · "Gerar rascunho" sem loading · tabelas admin no mobile · aside 320px fixo · contradição "Em preparação"×"não começou" · texturas sem legenda · Invariante 28 sem porta de contato · alerta como código · autoria como UUID · vocabulário proibido no dashboard · CRM tarefas vazio branco · brand-gold pequeno · 21 rotas sem title · atalhos sem desativação · skip link do portal · senha longe do botão · wizard nextDisabled mudo · botão-que-navega no wizard · declaração terminal sem caminho dito.

## 21. O que está claro e coerente

O wizard inteiro · a voz das confirmações (reconhecimento/entrega/regenerar) · os vazios editoriais (Rede vazia como resultado válido; "você não precisa ficar conferindo") · escolha e pós-escolha da paciente · proveniência da Base de Evidências e da declaração de área · a Mesa como disclosure de uma-etapa-por-vez com "Sua vez:" · mobile-da-Mesa-como-consulta declarado · a base de acessibilidade por construção (tipagem, focus-visible, fieldsets, sr-only "Ações", matriz com colgroup) · autosave anunciado do wizard · acesso-negado que orienta · LeadWorkspace · a honestidade de "Ainda não conseguimos fazer essa aproximação por você".

## 22. O que pode induzir erro ou desconfiança

Tudo da §20, condensado em quatro frases: o produto **afirma permanência e autoria que não guarda**; **acusa ou silencia nos momentos frágeis** (sessão, limbo, 404, falha de entrega); **cobra dos operadores o que não lhes deu** (avaliação sem tela, continuidade sem botão, papéis sem concessão); e **destrói sem perguntar nem registrar** (documentos, senhas, publicação, competências).

## 23. Decisões necessárias

1. Política de confirmação destrutiva (as 7 superfícies) — par obrigatório com a trilha de auditoria da Fase 3.
2. Vocabulário: varredura única de aposentados (Validar/pesos/validação) com guarda ampliada aos textos de UI; unificar os 5 títulos do parecer e o nome do evento de entrega.
3. Sessão expirada como estado de primeira classe (frase própria + link de reentrada + preservação).
4. Os 3 consertos de alavancagem de a11y (FormField clonando describedby/invalid; main/live da Mesa; focus trap) + heading do perfil.
5. Dar destino ao que cobra: ou superfície para Avaliação/Continuidade/papéis, ou remover a cobrança das telas (decisão de produto da Fase 2, agora com o custo de UX quantificado).
6. Loading/error da Mesa; autosave do mesa-workspace; feedback do rascunho assistido.
7. O limbo da paciente: prazo, sujeito e canal (uma frase resolve; a ausência é política por omissão).
8. 404 dentro da casa.

## 24. Veredicto

**"A experiência ainda possui riscos de compreensão, acessibilidade ou confiança."**

O que existe de melhor aqui não é cosmético — é uma voz de produto rara, com acessibilidade estrutural e honestidade textual em vários pontos que a maioria dos produtos clínicos nunca alcança. Mas a experiência é a camada onde todas as dívidas das fases anteriores ficam *visíveis para pessoas*: cada invariante sem guarda virou uma promessa impressa que o sistema não cumpre; cada superfície ausente virou uma cobrança eterna ou uma lista inexecutável; cada lacuna de auditoria virou uma destruição sem aviso nem rastro; e os momentos de maior vulnerabilidade — a espera, o erro, a sessão que expira, o ato irreversível — receberam menos cuidado do que o caminho feliz. A boa notícia é a mesma das outras fases: o padrão certo já existe dentro do produto, tela a tela; o trabalho é levar a voz que já se tem aos lugares onde ela ainda não chegou.

*Nenhum texto, componente ou estilo foi alterado por esta auditoria.*
