-- O PACIENTE LÊ O PRÓPRIO PERFIL
--
-- Os pesos do cruzamento nasceram com escrita e leitura do Curador — na Mesa.
-- Mas o Perfil é DA PESSOA: é a importância que ela declarou, com as palavras
-- dela, validada por ela. A experiência do paciente mostra essas importâncias
-- (como palavra, nunca como número — a projeção é do código), e para isso a
-- pessoa precisa poder ler as linhas do próprio Case.
--
-- Leitura, e só. A escrita continua exclusiva de quem conduz o Case.

create policy "cruzamento_weights_select_patient" on curadoria.cruzamento_weights
  for select to authenticated
  using (curadoria.is_patient_for_case(case_id));
