/**
 * Estado vazio da Jornada do Paciente.
 *
 * @metodo Jornada §4 — o Portal do Paciente nunca mostra etapa vazia e sempre explica
 * @metodo Experience §2.4 — espera é informada, nunca vazia; nada de "processando"
 * @metodo Fundamentos §13 — P11: nenhuma etapa aumenta a ansiedade do paciente
 *
 * Por que existe: quando ainda não há Curadoria, a tela precisa dizer isso com
 * clareza e apontar o próximo passo real. Uma tela muda, ou um esqueleto
 * carregando para sempre, faria o paciente supor que algo quebrou — e supor
 * que quebrou é exatamente a ansiedade que o Método existe para não produzir.
 *
 * O que nunca faz: mostrar caixas cinzas de placeholder, prometer prazo que
 * ninguém combinou, ou sugerir que há trabalho acontecendo quando não há.
 */

import { WhatsappContact } from "@/components/curadoria/whatsapp-contact";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export function SemCuradoria() {
  return (
    <div className="space-y-8">
      <header className="max-w-reading space-y-2">
        <h1 className="font-serif text-3xl text-ink">Sua Jornada</h1>
        <p className="text-base leading-relaxed text-ink-muted">
          Sua Curadoria ainda não começou.
        </p>
      </header>

      <Card padding="lg" className="max-w-reading space-y-4">
        <CardHeader>
          <CardTitle>O que acontece a seguir</CardTitle>
          <CardDescription>
            Assim que sua Consulta Inicial for marcada, esta tela passa a mostrar cada etapa: quem
            está com o seu caso, em que ponto ele está e quando você terá notícia.
          </CardDescription>
        </CardHeader>
        <p className="text-sm leading-relaxed text-ink">
          Nada está carregando e nada deu errado. Sua jornada aparece aqui inteira a partir da
          primeira conversa — e você nunca vai precisar perguntar em que etapa ela está.
        </p>
      </Card>

      <WhatsappContact topics={["duvida"]} />
    </div>
  );
}
