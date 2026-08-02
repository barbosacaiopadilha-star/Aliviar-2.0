-- ============================================================================
-- UMA HISTÓRIA EM RASCUNHO POR PACIENTE (Release de Reconstrução, ETAPA 9)
--
-- O defeito que esta migration fecha: `getOrCreateActiveStory` lê, não acha
-- rascunho, e insere. Duas requisições quase simultâneas leem antes de
-- qualquer uma inserir — e a paciente termina com DUAS histórias vazias.
-- Reproduzido no E2E do fluxo completo: 2 linhas, mesma pessoa, ambas em
-- `para-quem`.
--
-- Não é hipótese de concorrência rara: `/sua-historia/continuar` é uma rota
-- GET que grava, e o Next.js faz *prefetch* de links visíveis. O prefetch
-- executa o GET sem clique nenhum. A aplicação também deixa de prefetchar
-- (correção no componente), mas a garantia tem de viver aqui: qualquer
-- caminho de escrita, hoje ou amanhã, esbarra no índice.
--
-- Rascunho é único; histórias `enviada` continuam podendo ser várias — é
-- assim que uma segunda história nasce depois que a primeira foi enviada.
-- ============================================================================

-- Antes de criar o índice, consolidar duplicatas que já existam: mantém o
-- rascunho MAIS ANTIGO (o primeiro que a pessoa começou) e descarta os vazios
-- criados por corrida. Um rascunho com conteúdo nunca é apagado — se houver
-- mais de um com conteúdo, a migration falha e pede decisão humana.
do $$
declare
  duplicados_com_conteudo integer;
begin
  select count(*) into duplicados_com_conteudo
  from (
    select profile_id
    from curadoria.patient_stories
    where status = 'rascunho'
      and coalesce(btrim(data::text), '') not in ('', '{}', 'null')
    group by profile_id
    having count(*) > 1
  ) t;

  if duplicados_com_conteudo > 0 then
    raise exception
      'Há % paciente(s) com mais de um rascunho COM CONTEÚDO. Consolidação exige decisão humana — nenhuma história é descartada automaticamente.',
      duplicados_com_conteudo;
  end if;
end $$;

-- Descarta o rascunho VAZIO quando existe outro rascunho da mesma pessoa —
-- independentemente de qual nasceu primeiro. Na corrida observada, a linha
-- criada pelo prefetch veio 47µs ANTES da que recebeu as respostas: preferir
-- a mais antiga jogaria fora exatamente o que a pessoa escreveu. A regra é
-- sobre conteúdo, nunca sobre ordem.
delete from curadoria.patient_stories vazio
where vazio.status = 'rascunho'
  and coalesce(btrim(vazio.data::text), '') in ('', '{}', 'null')
  and exists (
    select 1 from curadoria.patient_stories manter
     where manter.profile_id = vazio.profile_id
       and manter.status = 'rascunho'
       and manter.id <> vazio.id
       -- Sobrevive quem tem conteúdo; entre vazios, o mais antigo.
       and (coalesce(btrim(manter.data::text), '') not in ('', '{}', 'null')
            or manter.created_at < vazio.created_at
            or (manter.created_at = vazio.created_at and manter.id < vazio.id))
  );

create unique index if not exists patient_stories_um_rascunho_por_paciente
  on curadoria.patient_stories (profile_id)
  where status = 'rascunho';

comment on index curadoria.patient_stories_um_rascunho_por_paciente is
  'Uma historia em rascunho por paciente. Fecha a corrida ler-depois-inserir de getOrCreateActiveStory, que produzia historias duplicadas quando duas requisicoes (inclusive prefetch do Next.js) chegavam juntas. Historias enviadas nao entram no indice: uma nova so nasce depois que a anterior foi enviada.';
