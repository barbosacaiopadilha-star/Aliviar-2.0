# JOURNEYS — As jornadas dos cinco perfis

**Estado**: Proposto (Missão 0, 2026-07-25). Par de `ALIVIAR_GUIDED_EXPERIENCE.md`.

Formato de cada perfil: missão · pergunta · objetivos (em prioridade) · decisões humanas reais · ansiedades e como a interface as reduz · próxima ação. As jornadas usam os nomes humanos; o mapa para rotas atuais está em `INFORMATION_ARCHITECTURE.md`.

---

## 1. Paciente

**Missão**: viver uma decisão de saúde importante acompanhado — entender, participar e decidir sem carregar o processo nas costas.

**Pergunta ao abrir**: *"Estão cuidando de mim? O que falta, e o que é meu para fazer?"*

**Objetivos** (prioridade):
1. Saber que o caso está andando (e com quem está)
2. Contar a própria história uma única vez e nunca repeti-la
3. Entender as opções quando chegarem — em linguagem de gente, sem número, sem ranking
4. Decidir com segurança e ser acompanhado depois da decisão

**Decisões humanas**: contar ou não determinado fato · confirmar que a história registrada é fiel · validar as prioridades ("é isso que importa para mim") · escolher um dos três caminhos — ou nenhum · aceitar/agendar · encerrar, trocar ou reabrir.

**Ansiedades → resposta da interface**:
- *"Fui esquecido?"* → todo estado tem data e autor; "em andamento" sempre diz com quem está
- *"Preciso fazer algo e não sei?"* → quando o caso está com a equipe, **nenhum botão de ação existe** (contrato testado) — ausência de ação é a mensagem "está tudo com a gente"
- *"Vou ter que recontar tudo?"* → a história é acumulativa e visível; "o paciente nunca recomeça do zero" é regra de Motor, e a tela a repete
- *"Escolhi errado?"* → três caminhos legítimos, sem ordem de preferência; limitações visíveis ("Vale considerar"); a escolha é reversível e o texto diz isso

**Jornada**: Chegar (Landing → convite humano) → **Contar** (minha história, no meu ritmo, rascunho salvo) → **Confirmar** (o que entendemos do que você contou) → **Aguardar acompanhado** (estado vivo, sem ação exigida) → **Receber** (o relatório para reler com calma; três caminhos) → **Decidir** → **Ser acompanhado** (agendamento, retornos) → **Encerrar** (ou trocar/reabrir sem punição).

**Próxima ação**: no máximo UMA por momento; quando não há, a tela declara que não há.

---

## 2. Atendente (Nível 1)

**Missão**: transformar um contato humano em um Case bem iniciado — acolher, qualificar, converter, abrir, encaminhar.

**Pergunta**: *"Quem chegou e quem está esperando um passo meu?"*

**Objetivos**: 1) nenhum contato sem resposta · 2) qualificar com verdade (nem todo lead vira paciente) · 3) zero duplicidade de pessoa · 4) entregar ao Curador um Case que não precise voltar.

**Decisões humanas**: este contato é para a Aliviar? · é a mesma pessoa que já existe? (a interface mostra as correspondências; quem decide é o Atendente) · o que a pessoa contou merece entrar como história inicial? · para qual Curador encaminhar, e por quê (motivo obrigatório, auditado).

**Ansiedades → resposta**:
- *"Esqueci alguém?"* → fila ordenada **pelo que falta fazer**, não pela data; contagem "N contatos aguardam sua próxima ação"
- *"Vou criar pessoa duplicada?"* → dedup por telefone/e-mail normalizados aparece ANTES de converter, com o porquê; nome igual é rotulado pista fraca
- *"Encaminhei e sumiu?"* → após entregar, o Case sai da fila com registro visível da passagem — perder acesso é o sinal de dever cumprido, e a tela explica isso

**Jornada**: **Acolher** (novo contato) → **Qualificar** → **Converter em paciente** (origem preservada, credencial pelo fluxo do sistema) → **Abrir atendimento** (o Case nasce com dono) → **Encaminhar ao Curador** (motivo + destinatário com papel real) → fila segue.

**Próxima ação**: o botão da etapa atual do lead, nomeado pelo efeito — nunca "Continuar".

---

## 3. Curador (Nível 2)

**Missão**: conduzir a Curadoria de UMA pessoa por vez — do acolhimento à entrega — com o Motor organizando e o Curador decidindo.

**Pergunta**: *"Quem precisa de mim agora, e qual é o próximo passo dessa pessoa?"*

**Objetivos**: 1) nunca iniciar conversa sem contexto revisado · 2) cada peso do Perfil com a palavra do paciente (Evidência de Curadoria) · 3) três caminhos honestos, com limitações ditas · 4) entregar um relatório que o paciente relê sozinho e entende.

**Decisões humanas**: o contexto está suficientemente entendido? · o que é filtro inegociável vs preferência? · como distribuir os 100 pontos — e com que evidência? · os candidatos sobrevivem ao julgamento humano? · validar/corrigir o que o Motor organizou · fechar a Mesa com parecer por opção · devolver ao protocolo quando algo não fecha.

**Ansiedades → resposta**:
- *"Por onde começo hoje?"* → painel ordena por quem precisa dele (bloqueio > alerta > ação > acompanhamento), nunca por métrica de produtividade
- *"Confio no que o Motor trouxe?"* → toda saída com fonte; cobertura dos 100 pontos visível ("coveredWeight"); ausência marcada como ausência
- *"Esqueci uma fase?"* → as nove fases com estado e dependência explícita ("Depende de: …"); fase disponível sempre tem onde ser executada — **nenhuma tela só-explicação no fluxo** (norma nascida do achado do Acolhimento)

**Jornada** (as nove fases do COS, já em linguagem de jornada): **Acolhimento** → **História** → **Caso** → **Filtros** → **Perfil de Prioridades** → **Validação** → **Curadoria Técnica** → **Mesa/Relatório** → **Entrega** → encaminhar ao Concierge (o MESMO Case, com motivo).

**Próxima ação**: o Motor aponta a fase e o passo ("Fechar a distribuição em exatamente 100 pontos"); o botão primário da tela é esse passo.

---

## 4. Concierge (Nível 3)

**Missão**: garantir que a decisão vire cuidado real — da escolha ao encerramento, nada esfria.

**Pergunta**: *"Quem escolheu e ainda não foi atendido? Onde algo pode esfriar?"*

**Objetivos**: 1) nenhum paciente parado entre escolher e ser atendido · 2) agendamentos e retornos no prazo · 3) pendências (documento, confirmação) resolvidas · 4) encerramento digno — ou reabertura sem atrito.

**Decisões humanas**: qual acompanhamento priorizar hoje? · quando insistir num retorno sem virar cobrança? · isto é pendência operacional minha ou dúvida técnica que volta ao Curador (com registro, nunca decisão própria)? · o caso pode ser encerrado?

**Ansiedades → resposta**:
- *"Algo esfriou sem eu ver?"* → fila por tempo-sem-movimento e próxima-ação-vencida, não por ordem de chegada
- *"Posso mexer nisso?"* → decisões técnicas validadas são visivelmente somente-leitura para ele; o que é dele é operacional
- *"Sou só um lembrete ambulante?"* → agenda, tarefas e interações num só lugar (a plataforma CRM é a ferramenta dele)

**Jornada**: **Receber** (o mesmo Case, pós-Curadoria) → **Apoiar a escolha** → **Agendar** → **Acompanhar** (retornos, documentos, registro de cada contato) → **Encerrar** (ou devolver/reabrir com motivo).

**Próxima ação**: a pendência mais fria primeiro; cada card diz o que fazer e por quê agora.

---

## 5. Administrador

**Missão**: governar sem operar — ver tudo, corrigir estrutura, nunca virar o ator padrão de nenhum Case.

**Pergunta**: *"Onde a operação precisa de atenção — e há gente em cada nível?"*

**Objetivos**: 1) fluxo saudável (funil sem vazamento anômalo, nenhum Case sem responsável) · 2) pessoas certas com papéis certos (acúmulo de níveis é alerta, não configuração) · 3) exceções resolvidas com auditoria · 4) indicadores honestos (indisponível ≠ zero).

**Decisões humanas**: conceder/revogar papel · intervir numa exceção (transferência fora da jornada, duplicidade de paciente, conversão sem qualificação — sempre com motivo) · publicar profissional · priorizar o que o funil aponta.

**Ansiedades → resposta**:
- *"O número é verdade?"* → toda métrica tem fonte real; sem fonte, "Informação indisponível" — nunca 0
- *"Algo grave escondido?"* → os números que doem (Sem responsável, atrasados, acúmulo de papéis) têm destaque próprio e aparecem mesmo em zero
- *"Virei gargalo?"* → supervisiona as filas dos três níveis sem se tornar responsável; o painel alerta quando uma pessoa acumula níveis

**Jornada**: **Ler a operação** (executivo: aquisição → operação → pendências → tempos) → **Aprofundar** onde doeu (funil, fila específica, caso) → **Agir na estrutura** (papéis, perfis, exceção auditada) → **Voltar ao topo**.

**Próxima ação**: cada alerta executivo leva em UM clique ao lugar onde se age sobre ele.
