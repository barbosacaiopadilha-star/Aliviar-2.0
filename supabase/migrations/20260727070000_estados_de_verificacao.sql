-- ESTADOS DE VERIFICAÇÃO — dois que faltavam
--
-- O enum nasceu com três estados e eles não bastam. Faltavam justamente os
-- dois que impedem uma conclusão apressada:
--
-- `nao_localizado` — procurou-se, com fonte adequada, e não se achou. Isso NÃO
--   é "falso". Um fellowship que o conselho não lista pode não existir ou pode
--   simplesmente não estar naquela base. Colapsar as duas leituras faria o
--   sistema afirmar que alguém mentiu quando tudo o que houve foi uma busca
--   sem resultado.
--
-- `desatualizado` — foi verificado, e a verificação venceu. Onde alguém atende
--   hoje não é onde atendia há dois anos, e um "verificado" de 2024 sobre
--   disponibilidade é mais perigoso que um "não verificado": tem a aparência
--   de conferido.
--
-- Migration própria porque `alter type ... add value` não pode aparecer na
-- mesma transação que usa o valor novo. Aqui só adiciona; quem usa é a
-- seguinte.

alter type curadoria.verification_status add value if not exists 'nao_localizado';
alter type curadoria.verification_status add value if not exists 'desatualizado';
