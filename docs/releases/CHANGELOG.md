# Changelog — AliCIA

Todas as mudanças notáveis deste projeto serão documentadas neste arquivo.

O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).

---

## [1.0.0-beta] — 2026-07-22

### Adicionado

- **Produto público AliCIA** em `/alicia`
  - Home com proposta de valor e navegação
  - Mapa interativo com 34 médicos no Espírito Santo
  - Busca por nome, área, cidade ou instituição
  - Filtros por especialidade, cidade e distância
  - Painel de formação e atuação
  - Perfis individuais com trajetória, fontes e pendências visíveis
  - Página de metodologia
  - Estado 404 para perfis inexistentes
- **Catálogo ES** — 17 ortopedistas + 17 neurocirurgiões em 10 cidades
- **AliCIA Studio MVP** (`/alicia/studio`) — workspace operacional interno
  - Inbox kanban por status operacional
  - Página do candidato com checklist Protocolo A–G
  - CRUD de fontes com histórico append-only
  - Dashboard operacional
- **Documentação canônica** — Protocolo, Operação, Autoridade, Moat, Fábrica, Métricas
- **Scripts operacionais** — `alicia:seed`, `alicia:coverage`
- **85 testes** na camada AliCIA (catálogo, filtros, studio, factory)

### Escopo

- Estado: Espírito Santo
- Especialidades: Ortopedia, Neurocirurgia

### Problemas conhecidos

- Home ainda diz "Piloto no Espírito Santo" (catálogo cobre 10 cidades)
- Viana no filtro sem perfis publicados
- URLs de fontes não clicáveis nos perfis públicos
- 18 perfis com campos de formação em verificação (exibidos como "Estamos verificando")
- Studio sem autenticação; dados em localStorage; não publica no catálogo automaticamente
- TMP operacional não instrumentado automaticamente

---

## [0.1.0-rc1] — 2026-07-22

### Adicionado

- Primeiro release candidate testável
- Stack AliCIA completa: domínio, catálogo, UI pública, seed ES
- 34 médicos · cobertura estadual inicial
- Rotas: `/alicia`, `/alicia/mapa`, `/alicia/metodologia`, `/alicia/medicos/[id]`

---

[1.0.0-beta]: https://github.com/aliviar/aliviar-os/releases/tag/v1.0.0-beta
[0.1.0-rc1]: https://github.com/aliviar/aliviar-os/releases/tag/v0.1.0-rc1
