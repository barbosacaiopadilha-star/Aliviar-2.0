# 07 · Central de Documentos

> **O achado:** *"Existe documento emitido e entregue; a tela de Documentos
> continua vazia"* (P3, `54`).
>
> A paciente recebeu a Curadoria e, na tela que existe para guardar o que ela
> tem, **não há nada**.

---

## 1. Três origens, uma central

| Seção | O que traz | Origem |
|---|---|---|
| **A · Enviados por você** | exames, laudos, PDFs, anexos | upload da paciente |
| **B · Recebidos da Aliviar** | **o Relatório**, orientações, materiais | emissão/entrega do Curador |
| **C · Questionários e formulários** | **Sua História enviada**, consentimentos aceitos | o próprio produto (§08) |

**A seção B resolve P3.** O relatório entregue **passa a existir aqui**, não só
em *Minha Curadoria*.

## 2. Cada item

| Campo | Regra |
|---|---|
| **nome** | humano — *"Relatório da sua Curadoria"*, nunca nome de arquivo |
| **origem** | quem produziu, nomeado |
| **data** | quando ficou disponível |
| **estado** | ver §3 |
| **ações** | **Ver** · **Baixar** — e **Substituir** só nos enviados por ela |
| **marca de novo** | até ser aberto pela primeira vez |

## 3. Estados

| Estado | Paciente vê | Quando |
|---|---|---|
| `DISPONIVEL` | *"Disponível"* | pode ver e baixar |
| `NOVO` | *"Novo"* — âmbar | recebido e ainda não aberto |
| `ENVIADO_POR_VOCE` | *"Enviado por você"* | upload dela |
| `EM_PREPARO` | *"A Aliviar está preparando"* | existe, ainda não entregue |
| `AGUARDA_VOCE` | *"Precisa de você"* — âmbar | pendência de documento |

> **`EM_PREPARO` é a tradução honesta de "emitido e não entregue"** (§10). Hoje
> esse estado é invisível para a paciente — e é justamente ele que faz Documentos
> parecer vazio quando já existe trabalho pronto.

## 4. Vazio que informa

Nunca *"nenhum documento"*. Por seção: *"Você ainda não enviou nenhum exame — se
tiver algum, pode enviar aqui."* · *"Quando sua Curadoria ficar pronta, o
relatório aparece aqui."* · *"Sua história enviada fica guardada aqui."*

## 5. Reaproveitamento

| Já existe | Uso |
|---|---|
| `patient_documents`, `patient_story_attachments` | seção A |
| relatório emitido/entregue | seção B — **é leitura, não dado novo** |
| história enviada, consentimentos aceitos | seção C |
| componentes de upload | preservar |

**A seção B provavelmente é apresentação pura (§25 nível A/B)** — o dado existe.
**Confirmar antes de projetar** que a rota da paciente consegue lê-lo sob RLS.

## 6. Mobile

Lista vertical, seções colapsáveis com a **primeira aberta** · nome em duas
linhas, sem truncar · **Ver** e **Baixar** com alvo ≥ 44px · marca de *novo*
antes do nome.

## 7. Concierge

Presente no rodapé da central: **"Falar com a Aliviar"**, mensagem
*"Gostaria de ajuda com meus documentos."* (§09).
