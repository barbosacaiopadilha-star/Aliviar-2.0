# Módulo journey-events

Timeline cronológica da Jornada do paciente.

## Responsabilidade

Registrar e apresentar acontecimentos relevantes para a Jornada, com:

- visualização cronológica;
- registro manual;
- correção não destrutiva;
- eventos automáticos do sistema;
- próximo passo em destaque.

## Regras

- Todo evento pertence a exatamente uma Jornada.
- Nenhum evento pode ser excluído.
- Correções criam um novo evento; o original permanece marcado como corrigido.
- Autoria vem da sessão (`auth.uid()`), nunca do formulário.
- Eventos automáticos usam `create_system_journey_event` (não exposta ao cliente).
- A equipe Aliviar não registra diagnósticos próprios.

## Funções SQL

| Função | Uso |
|--------|-----|
| `create_journey_event` | Eventos manuais (DBF-002) |
| `correct_journey_event` | Correção transacional (DBF-003) |
| `create_system_journey_event` | Eventos automáticos internos (DBF-004) |

## Testes de integração

Configure no `.env.local`:

```env
TEST_STAFF_EMAIL=...
TEST_STAFF_PASSWORD=...
TEST_JOURNEY_ID=...
```

Execute: `npm run test`
