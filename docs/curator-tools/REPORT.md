# EPIC-22 — Ferramentas Operacionais do Curador

## 1. Pesquisa

Pesquisa global unificada em `GET /api/v1/curador/ferramentas/pesquisa?q=`.

Localiza: paciente, jornada, médico, documento, protocolo e número da jornada.

UI: barra de pesquisa na fila (`CuradorGlobalSearch`).

## 2. Favoritos

Marcar jornadas, médicos e documentos via `curator_favorites`.

API: `GET/POST /api/v1/curador/ferramentas/favoritos`, `DELETE .../favoritos/[tipo]/[id]`.

Organização pessoal por curador (RLS).

## 3. Anotações

Notas privadas em `curator_private_notes`.

API: `GET/POST /api/v1/curador/ferramentas/notas`.

Nunca visíveis ao paciente. Evento de auditoria `CURATOR_NOTA`.

## 4. Checklist

Lista configurável em `curator_checklists`.

Itens padrão: documentação, exames, critérios, entrega.

Não bloqueia fluxo — apenas marcação pessoal.

## 5. Templates

Modelos em `curator_templates` (mensagem, justificativa, observação).

Sempre editáveis. Nunca publicados automaticamente.

## 6. Histórico

`GET /api/v1/curador/ferramentas/historico/[jornadaId]`.

Consolida timeline da jornada, documentos, ações operacionais e auditoria.

## 7. Métricas

`GET /api/v1/curador/ferramentas/produtividade`.

Tempo médio por caso, casos em andamento, tempo em revisão, tempo até entrega.

Sem ranking de pessoas.

## 8. Autoauditoria

**Tempo operacional economizado:** estimativa qualitativa de 15–30% em tarefas de localização, organização e registro (pesquisa global, favoritos, checklist, templates e histórico consolidado reduzem navegação entre telas e reescrita manual). Evidência: cada entrega elimina busca fragmentada em múltiplas superfícies.

**Alteração do método Aliviar:** nenhuma. Não há automação clínica, ranking, recomendação médica ou publicação automática. Checklist não bloqueia fluxo. Templates exigem edição manual. Métricas são agregadas sem identificação individual.

## 9. Próximo programa

PROGRAM-12 / EPIC-23 — Integração operacional com notificações e alertas proativos (sem decisão clínica).
