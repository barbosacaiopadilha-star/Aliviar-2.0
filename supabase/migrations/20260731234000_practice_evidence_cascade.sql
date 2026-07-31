-- BASE DE EVIDÊNCIAS — o append-only não pode impedir o descarte do dono.
--
-- O gatilho de DELETE da 20260731220000 bloqueava TAMBÉM o ON DELETE CASCADE
-- de professional_profiles: descartar um profissional (fluxo administrativo
-- legítimo, mesmo desenho do Mapa e da área) ficava impossível.
--
-- Correção de desenho, com as garantias preservadas em camadas distintas:
--   * conteúdo imutável  → gatilho de UPDATE permanece (reescrita recusada);
--   * apagamento avulso  → NENHUM papel de aplicação tem GRANT de DELETE
--                          (a migration de grants concede só select/insert a
--                          authenticated);
--   * remoção legítima   → cascade do descarte do profissional volta a
--                          funcionar, como nas demais tabelas do domínio.
--
-- "Nenhuma informação verificada pode ser perdida" continua verdadeiro no
-- único sentido que importa: enquanto o profissional existe, a evidência é
-- inapagável e inreescrevível pela aplicação. Quando o profissional é
-- descartado pela porta auditada, o registro dele vai junto — como o Método
-- já decidiu para todo o resto do cadastro.

drop trigger if exists practice_evidence_no_delete on curadoria.practice_evidence;

-- ---------------------------------------------------------------------------
-- ROLLBACK
-- ---------------------------------------------------------------------------
--
--   create trigger practice_evidence_no_delete
--     before delete on curadoria.practice_evidence
--     for each row execute function curadoria.practice_evidence_append_only();
