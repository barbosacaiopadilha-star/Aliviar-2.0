# CRM Aliviar — Permissões

| Permissão | Administrador | Concierge | Curador |
|-----------|:-------------:|:---------:|:-------:|
| Ver todos os contatos | ✅ | fila própria + não atribuídos | casos encaminhados |
| Criar/editar contato | ✅ | ✅ | ❌ |
| Arquivar contato | ✅ | ✅ | ❌ |
| Mudar etapa | ✅ | ✅ | ❌ |
| Registrar interação | ✅ | ✅ | ❌ |
| Gerenciar tarefas | ✅ | ✅ | ❌ |
| Gerenciar agenda | ✅ | ✅ | ❌ |
| Ver auditoria | ✅ | ❌ | ❌ |
| Configurações CRM | ✅ | ❌ | ❌ |
| Ver notas restritas | ✅ | ❌ | ❌ |

Autorização é aplicada em Server Actions (`src/modules/crm/actions.ts`) e reforçada por RLS no banco (`20260724190000_crm_operational_foundation.sql`).

## Concessão do papel Concierge

```sql
insert into curadoria.user_roles (profile_id, role_id)
select '<profile-uuid>', r.id
from curadoria.roles r
where r.slug = 'concierge';
```
