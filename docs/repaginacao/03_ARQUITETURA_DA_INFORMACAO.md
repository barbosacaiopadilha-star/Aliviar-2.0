# 03 · Arquitetura da informação

## 1. Shells — de quatro para dois, mais a moldura pública

A Rodada 1 encontrou **quatro cascas de aplicação para um produto só** (D-1),
**duas pastas para o mesmo domínio** (`paciente/` e `patient/`, D-10) e **dois
menus de usuário mais um rodapé duplicando a navegação** (D-15).

| Shell alvo | Papéis | Densidade | Navegação |
|---|---|---|---|
| **PublicShell** | visitante | editorial | header com âncoras + CTA |
| **PatientShell** | paciente | íntima, **mobile-first** | 5 destinos + Concierge persistente |
| **OperationShell** | Curador · Concierge · Admin | densa | lateral por papel, mesma gramática |

**Três shells, não quatro.** Curador, Concierge e Admin **compartilham a casca** e
divergem só no conteúdo da navegação — a divergência de shell entre eles é
acidental, não funcional.

**`paciente/` é a pasta canônica. `patient/` é deprecada** (§14).

## 2. Navegação da paciente

| Destino | Rota | Responde |
|---|---|---|
| **Início** | `/paciente` | onde estou, o que falta, o que vem |
| **Minha jornada** | `/paciente/jornada` | o que já aconteceu, em ordem |
| **Minha Curadoria** | `/paciente/curadoria` | os três caminhos e o relatório |
| **Documentos** | `/paciente/documentos` | tudo que enviei e recebi |
| **Meu perfil** | `/paciente/perfil` | meus dados |
| *(persistente)* | — | **Falar com a Aliviar** |

**Sua História não é destino de navegação** — é uma tarefa que vive no Início
enquanto estiver aberta, e vira **documento** depois de enviada (§07, §08).

**Vocabulário:** primeira pessoa da paciente (*"Minha"*, *"Meu"*), nunca
administrativo. **`/paciente/linha-do-tempo` é absorvida** por *Minha jornada*
(D2-1, P6).

## 3. Navegação do Curador

| Destino | Responde |
|---|---|
| **Fila** | o que precisa de mim |
| **Caso** → *Acolhimento · Mesa · Relatório* | o trabalho |
| **Discordância** | observação do Método |

A Mesa mantém suas **seis etapas** e sua arquitetura de quatro painéis. **Não é
tocada por este contrato** — só recebe o que os documentos 05, 11 e 13 pedirem.

## 4. Nomenclatura — o que sai da tela

A Rodada 2 registrou três termos que atravessam a fronteira errada:

| Termo | Onde | Decisão |
|---|---|---|
| **"Case"** | fila e estados do Curador | → **"Caso"**. Inglês capitalizado numa tela sobre uma pessoa |
| **"H8–H11"** | *"Juízo do Curador (H8–H11)"* | **sai da interface**. É código de contrato; vive na documentação |
| **"Mesa"** | interno **e** na tela da paciente | **permanece nos dois** — vem explicado, e é vocabulário da marca |

**"Rede elegível"**, **"Três caminhos"**, **"Conversa"** e **"Escolha"** foram
avaliados como consistentes pela auditoria e **permanecem**.

## 5. Regra de fronteira

> Termo do Método aparece para a paciente **somente** quando (a) vem explicado na
> mesma tela, **ou** (b) é o nome de algo que ela recebe. **Código, sigla e
> abreviação nunca.**
