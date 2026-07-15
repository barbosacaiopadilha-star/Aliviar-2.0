# Changelog — Aliviar Curadoria Médica

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/). Este arquivo registra o histórico de entregas por sprint; decisões de arquitetura/produto que motivaram cada entrega estão em `docs/DECISIONS.md` (ADRs); estado atual da arquitetura em `docs/ARCHITECTURE.md`.

## [1.0.0-landing] — 2026-07-15 — Portal: reconstrução da Landing institucional

Substitui a composição anterior de seções independentes da Landing (registrada no encerramento [1.0.0] abaixo como "12 seções aprovadas") por um ambiente único e contínuo.

### Adicionado
- `PortalExperience`: ambiente permanente (sticky), cobrindo Chegada → Respiro → Triagem → Análise → Curadoria, com Benefícios, Confiança e Continuação absorvidos como parte da Curadoria.
- Motor da Caminhada: interpolação contínua de scroll (`requestAnimationFrame`) conduzindo luz ambiente, presença das bordas e compactação espacial, com inércia própria por canal.
- Direção de fotografia (`portal-scenes.ts`): seis enquadramentos derivados da fotografia institucional da recepção, em crossfade contínuo entre cenas; configuração desacoplada da arquitetura do Portal.
- Fio Dourado reescrito: traço sempre inteiramente visível, sem representar progresso ou avanço da rolagem.
- Vídeo Companheiro reintegrado ao Portal, com saída conduzida pelo progresso real do scroll.

### Alterado
- Ordem das seções da Landing e composição de `src/app/(public)/page.tsx`.
- Rodapé (`PublicFooter`) com entrada própria (`SectionReveal`).

### Removido
- `HeroJourneySection`, `BenefitsSection`, `WhyTrustSection`, `DuvidasStackSection` — substituídos pelo Portal e pela Biblioteca em formato de livro.
- `faq-section.tsx`, `how-it-works-section.tsx` — componentes órfãos, sem uso em nenhum ponto do projeto.
- `.animate-fade-out-release` — CSS morto, referenciava componente já removido.

### Mantido sem alteração
- Biblioteca em formato de livro (`FaqBookSection`).
- Header sticky (`PublicHeader`).
- Convite final (`FinalCtaSection`), copy preservada.

### Preparado para V1.1
- A estrutura de cenas (`portal-scenes.ts`) permite substituir os enquadramentos atuais por fotografias reais futuras (fachada, lounge, sala de conversa, curadoria, biblioteca, espaço final) trocando apenas configuração — sem reconstrução da arquitetura do Portal.

## [1.0.0] — Encerramento da Versão 1 (Frozen)

**Produto: 1.0 · ACE: 1.0 · Status: Frozen · Desenvolvimento: Encerrado · Próxima fase: Operação** (ADR-021).

A partir desta versão, nenhuma funcionalidade nova, alteração de arquitetura, de fluxo ou de protocolo do ACE é aceita sem uma decisão explícita de iniciar uma V2. Apenas correção de bugs é permitida.

### Fundação e identidade visual
- Scaffold técnico (Next.js App Router + TypeScript strict + Tailwind + Supabase), autenticação (login, recuperação de senha, papéis via RLS), `AppShell` compartilhado e rotas reais por papel (`/admin`, `/profissional`, `/paciente`).
- Design System canônico: tokens semânticos, tipografia dupla (Fraunces/Inter), paleta oficial confirmada contra a logo da marca.
- Landing institucional: 12 seções aprovadas (Hero, CTA, vídeo institucional, como funciona, benefícios, processo, confiança, concierge, FAQ, CTA final).

### O Método ACE (Aliviar Curation Engine)
- Governança do Método formalizada: Constituição, Framework, Ontologia, Kernel, Protocolos P001–P010, cada um com especificação, prompt, exemplos, testes e changelog próprios (`docs/ace/`).
- Protocolos implementados de ponta a ponta: Intake (P001), Case Builder (P002), Case Audit (P003), Decision Context Modeler (P004), Competency Profile Builder (P005), Eligible Provider Set Builder (P006), Compatibility Matrix Builder (P007), Shortlist Builder (P008), Human Review (P009), Final Curadoria Delivery (P010).
- Integração real com a Anthropic (Claude) para os protocolos que dependem de modelo de linguagem, com saída estruturada garantida por tool-use forçado e schemas próprios por protocolo.
- Proteção obrigatória de ambiente: produção nunca cai silenciosamente no modelo fake — falha explícita, classificada e auditável quando a chave não está configurada ou o provedor falha (autenticação, rate limit, timeout, indisponibilidade, resposta inválida).

### Jornada do paciente
- **Sua História**: acolhimento em etapas (motivo, para quem, informações, preferências, revisão), persistido no servidor com concorrência otimista, exige conta pré-criada pela equipe Aliviar (nunca autocadastro).
- **Caso**: entidade operacional que conecta a História ao pipeline do ACE, com máquina de estados, log de eventos e histórico de notas append-only.
- **Curadoria Final**: entrega ao paciente de exatamente três profissionais, com explicação humana, sem scores/ranking/protocolos/artefatos técnicos visíveis, com acompanhamento pós-entrega e view de impressão.
- Dashboard, documentos e linha do tempo do paciente.

### Jornada da equipe (Administrador e Curador Médico)
- Dashboard administrativo, gestão de pacientes e profissionais (com histórico, busca, filtros e paginação), gestão de equipe e documentos profissionais.
- Execução controlada do ACE na página do Caso, com status traduzido ao paciente durante o processamento.
- Observabilidade completa do ACE: dashboard, timeline de execução, health check, métricas, histórico de execuções, visualização e diff de artefatos, logs estruturados.
- **Revisão Humana (P009)**: tela dedicada de decisão (aprovar/ajustar/rejeitar/pedir mais informação) com justificativa obrigatória, evidências, histórico auditável e versionado.

### Ativação de produção (GO LIVE)
- Seleção automática do modelo de linguagem por ambiente (Anthropic em produção, modelo fake determinístico apenas em desenvolvimento/teste), nunca configurável por engano.
- Health Check refletindo o estado real do modelo de linguagem (nunca mascarado).
- Cabeçalhos de segurança HTTP (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, `Strict-Transport-Security`).
- Runbook operacional completo para ativação do ambiente real de produção (Supabase, Anthropic, Vercel, domínio).

### Backlog registrado (não bloqueia o lançamento)
- Content Security Policy (CSP) completa — requer allowlist cuidadosa de Supabase/Vercel Analytics, registrada como próxima melhoria de segurança, não indispensável para o lançamento.
- Testes de integração (Playwright/Supabase local) não puderam ser executados neste ambiente de desenvolvimento por indisponibilidade do Docker — pendência conhecida durante toda a sessão de construção, não um defeito do código.
- Plano original de MVP restrito a "descoberta e conexão direta" (`docs/ENGINEERING_PLAN.md`) nunca foi implementado — superado pela Curadoria Médica Aliviar (ACE); módulos reservados (`community`, `institutions`, `benefits`, `programs`, `ai`, `partners`, `discovery`, `connection`) seguem vazios, sem escopo técnico próprio.
