# Achado de segurança — funções de governança executáveis por `PUBLIC`

Registro técnico de um achado observado durante a revisão do G0.1. **Não corrigido neste incremento, de propósito:** a correção altera privilégios de funções publicadas e merece migration, testes e decisão próprios.

**Origem:** revisão final do G0.1 (2026-08-03), branch `g0-1-regime-de-instrumentos`.
**Escopo afetado:** migrations `20260803140000_governanca_documentos_aceites_lgpd.sql` e `20260803150000_governanca_aceite_do_profissional.sql`.
**Classificação de risco: BAIXO.** Superfície exposta real; nenhuma via de leitura ou escrita de dado pessoal encontrada.

---

## 1. Funções afetadas e ACL observada

Consulta a `pg_proc.proacl` no banco local, com as 92 migrations aplicadas:

| Função | ACL observada | Validação interna |
|---|---|---|
| `curadoria.register_legal_acceptances(uuid[], text, text, text, jsonb)` | `=X/postgres` · `postgres=X` · `authenticated=X` | Recusa sem `auth.uid()` |
| `curadoria.revoke_legal_acceptance(uuid, text, text, text)` | `=X/postgres` · `postgres=X` · `authenticated=X` | Recusa sem `auth.uid()`; exige ser o titular |
| `curadoria.register_professional_acceptances(uuid, uuid[], text, text, timestamptz)` | `=X/postgres` · `postgres=X` · `authenticated=X` | Recusa sem `auth.uid()`; exige papel |
| `curadoria.pendencias_legais_do_profissional(uuid)` | `=X/postgres` · `postgres=X` · `authenticated=X` | **Nenhuma** |
| `curadoria.versao_vigente(uuid)` | `=X/postgres` · `postgres=X` · `anon=X` · `authenticated=X` | Nenhuma — **e isso é o desenho** |

**A entrada que importa é `=X/postgres`:** grantee vazio significa `PUBLIC`. Como `anon` pertence a `PUBLIC`, as cinco são chamáveis sem sessão.

Uma sexta, de menor relevância: `curadoria.enforce_legal_append_only()` está com o `EXECUTE` padrão a `PUBLIC`. É função de trigger cujo corpo só levanta exceção — chamá-la diretamente não produz efeito algum além do erro. Entra na mesma correção por consistência, não por risco.

**Contraste verificado no mesmo banco:** as sete funções criadas pelo G0.1 (`criar_instancia_de_documento`, `assinar_instancia`, `revogar_por_escopo`, `rescindir_instrumento` e as três de trigger) aparecem como `restrito` — nenhuma alcançável por `PUBLIC` ou `anon`.

**Causa:** `CREATE FUNCTION` concede `EXECUTE` a `PUBLIC` por padrão no PostgreSQL. As duas migrations concederam explicitamente a `authenticated` — o que é correto — mas não revogaram o padrão. O `GRANT` explícito dá a impressão de que o privilégio foi delimitado; ele apenas foi somado ao que já estava aberto.

---

## 2. Por que não existe brecha de dados imediata

- **As três funções de escrita recusam sem sessão.** `register_legal_acceptances`, `revoke_legal_acceptance` e `register_professional_acceptances` começam por `auth.uid()` e levantam `42501` quando ele é nulo. Um chamador anônimo recebe erro; nenhum aceite, revogação ou registro é criado.
- **`versao_vigente` é pública por decisão.** Ela devolve a versão vigente de um documento publicado — exatamente o que o portal legal serve a quem ainda não tem sessão, e o que a policy `legal_document_versions_leitura_publica` já permite ler por `SELECT`. Aqui `PUBLIC` não acrescenta superfície: o `GRANT ... to anon` é explícito e intencional.
- **`pendencias_legais_do_profissional` é o caso a observar.** Ela não valida ator nenhum e devolve `slug`, `nome` e `versao` dos documentos obrigatórios que faltam a um perfil profissional. O argumento é um UUID v4 — não enumerável por força bruta em prática —, e a resposta não contém dado pessoal do profissional (nome, CRM, contato). O que ela confirma, a quem já conheça um UUID válido, é a **existência do perfil e seu estado de homologação documental**.

**Conclusão:** superfície exposta sim; via de vazamento, não. Nada indica necessidade de correção emergencial.

---

## 3. Por que a superfície deve ser reduzida mesmo assim

1. **Privilégio é a camada anterior à validação.** A defesa hoje depende inteiramente do corpo da função. Um caminho novo — uma função que reaproveite outra, um `default` acrescentado, uma refatoração que mova a checagem — passa a valer como controle de acesso sem que ninguém tenha decidido isso.
2. **A validação de `pendencias_legais_do_profissional` não existe.** É a única das cinco cuja proteção não é "recusa sem sessão", e sim "o UUID é difícil de adivinhar". Segurança por dificuldade de adivinhação não é a política deste projeto.
3. **O padrão já foi corrigido no incremento seguinte.** As quatro funções do G0.1 (`criar_instancia_de_documento`, `assinar_instancia`, `revogar_por_escopo`, `rescindir_instrumento`) revogam `PUBLIC` e `anon` explicitamente antes de conceder a `authenticated`. Deixar as cinco anteriores como estão cria duas convenções no mesmo módulo — e a divergência é o que faz a próxima pessoa copiar a errada.
4. **Auditoria externa vai apontar.** Uma função `security definer` executável por `PUBLIC` é achado padrão de qualquer revisão de segurança; melhor fechá-lo por decisão do que por resposta a relatório.

---

## 4. Correção recomendada

Migration própria, aditiva, sem tocar em corpo de função:

```
revoke all on function curadoria.register_legal_acceptances(...)        from public;
revoke all on function curadoria.revoke_legal_acceptance(...)           from public;
revoke all on function curadoria.register_professional_acceptances(...) from public;
revoke all on function curadoria.pendencias_legais_do_profissional(...) from public;
-- versao_vigente: revogar de PUBLIC preservando o GRANT explícito a anon,
-- que é o desenho do portal legal público.
revoke all on function curadoria.versao_vigente(uuid) from public;
grant execute on function curadoria.versao_vigente(uuid) to anon, authenticated;
```

**Ponto de atenção:** `revoke ... from public` não remove o `GRANT` já concedido a `authenticated` — os dois privilégios são independentes. Os caminhos da aplicação continuam funcionando sem alteração de código.

**Considerar no mesmo incremento** (decisão de produto, não de segurança): dar a `pendencias_legais_do_profissional` uma validação de papel — hoje qualquer conta autenticada, inclusive um paciente, pode consultá-la se conhecer o UUID de um perfil profissional. É dado de homologação da Rede, e a policy de leitura dos aceites do profissional já restringe o equivalente a administrador e curador.

---

## 5. Testes necessários

1. `anon` recebe `permission denied` ao chamar cada uma das quatro funções — não mais o erro de sessão ausente vindo de dentro do corpo.
2. `anon` **continua** executando `versao_vigente` — a regressão a evitar é fechar o portal legal público.
3. Os 23 testes de governança existentes seguem verdes sem alteração, provando que os caminhos autenticados não mudaram.
4. Se a validação de papel for adicionada a `pendencias_legais_do_profissional`: paciente autenticado recebe recusa; curador e administrador continuam obtendo a resposta.

---

## 6. Encaminhamento

**Incremento independente**, fora do G0.1 e fora do G0.2. Não depende do regime de instrumentos e não é bloqueado por nenhuma decisão pendente do Jurídico. Cabe em uma migration curta com quatro testes.

Não misturar com `20260803160000_regime_de_instrumentos.sql`: aquela migration é o regime de instrumentos, e uma correção de privilégio de funções anteriores embutida nela ficaria invisível na revisão de merge — que é exatamente o problema que este registro documenta.
