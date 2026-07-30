-- O PACIENTE LÊ A AVALIAÇÃO POR CRITÉRIO DO PRÓPRIO CASO
--
-- As cartas dos três caminhos mostram, por dimensão, o quanto cada caminho
-- responde ao que a pessoa declarou. Sem isto, a única forma de montar essa
-- leitura seria interpretar o texto do Relatório — inferência semântica sobre
-- frase gerada, exatamente o que a política de fontes existe para impedir.
--
-- Leitura, e só. A escrita continua exclusiva de quem conduz o Case: o estado
-- de cada critério é declaração do Curador (ADR-035), e nada aqui permite ao
-- paciente alterá-lo.
--
-- O que ele passa a alcançar são os quatro estados que já lhe são mostráveis
-- por decisão de experiência — atende plenamente, atende parcialmente, ainda
-- precisamos confirmar, não atende. Nenhum peso, nenhum número, nenhuma
-- cobertura atravessa: a projeção em linguagem de pessoa acontece no código.
--
-- Restrição temporal deliberada: só depois da entrega. Antes disso a Curadoria
-- ainda está sendo construída, e ler uma avaliação em rascunho seria assistir
-- ao Curador pensar.

create policy "criterion_declarations_select_patient" on curadoria.criterion_declarations
  for select to authenticated
  using (
    curadoria.is_patient_for_case(case_id)
    and exists (
      select 1
        from curadoria.curadoria_reports r
       where r.case_id = criterion_declarations.case_id
         and r.delivered_at is not null
    )
  );
