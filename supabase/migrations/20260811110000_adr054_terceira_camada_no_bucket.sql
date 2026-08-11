-- ============================================================================
-- D-12.3 · ADR-054, TERCEIRA CAMADA: O BUCKET PASSA A RECUSAR SOZINHO.
--
-- A ADR-054 (2026-08-02, decisão D-08) manda aplicar teto e allowlist em TRÊS
-- camadas: bucket, action e config do framework. A D-12.2 entregou só a
-- action, e o Verificador provou o buraco: um cliente autenticado subia um
-- `.exe` de 25 MB **direto ao storage**, sem passar por action nenhuma. A
-- validação existia no caminho educado e não existia no caminho real.
--
-- POR QUE O BUCKET, E NÃO MAIS UMA POLICY
--
-- `storage.objects` já tem policies — elas decidem QUEM escreve ONDE, e as da
-- D-12.1 fazem isso bem. O que nenhuma policy expressa é O QUE está sendo
-- escrito: tamanho e tipo do objeto não são colunas que a RLS avalie. Essa
-- verificação é do próprio bucket, e é por isso que a ADR pede a camada
-- separada — não é redundância, é outra pergunta.
--
-- Depois disto, as três respostas são independentes:
--   ação → recusa com a frase que explica;
--   bucket → recusa mesmo sem action;
--   framework → não corta antes dos 20 MB (V-1, em next.config.ts).
--
-- ESCOPO: só `patient-documents`.
--
-- `professional-documents` NÃO é tocado. A ADR-054 chama-se "Política de
-- documentos clínicos" e seus itens 2–4 tratam de equipe do Case, da paciente
-- e de documento anexado a Case — ela não nomeia o bucket administrativo do
-- profissional. O achado FUN-02 mencionava três actions sem validação, e a do
-- profissional segue sem: **registrado como pendência, não ampliado aqui.**
-- Aplicar contrato por analogia seria decidir no lugar de quem decide.
--
-- ZERO tabela, coluna, enum, policy ou backfill. Objetos já existentes não são
-- tocados: a verificação do bucket vale para escrita nova.
--
-- ROLLBACK
--   update storage.buckets
--      set file_size_limit = null, allowed_mime_types = null
--    where id = 'patient-documents';
--   -- Devolve exatamente o estado anterior (ambos eram NULL).
-- ============================================================================

update storage.buckets
   set
     -- 20 MB exatos, como a ADR. O teto do framework fica acima de propósito
     -- (22 MB, ver next.config.ts) para que quem recuse "20 MB + 1 byte" seja
     -- a regra da aplicação, com frase própria, e não um 413 mudo.
     file_size_limit = 20971520,
     -- Os quatro tipos da ADR-054, exatos. HEIC/HEIF não estão aqui:
     -- ampliar a allowlist é ato de revisitar a ADR.
     allowed_mime_types = array[
       'application/pdf',
       'image/jpeg',
       'image/png',
       'image/webp'
     ]
 where id = 'patient-documents';
