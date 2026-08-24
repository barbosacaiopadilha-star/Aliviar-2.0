"use client";

import { useEffect, useState } from "react";

import { CaminhoEscolhido } from "@/components/paciente/caminhos/caminho-escolhido";
import { CartaCaminho } from "@/components/paciente/caminhos/carta-caminho";
import { ComparacaoCaminhos } from "@/components/paciente/caminhos/comparacao-caminhos";
import { FaixaDoComum } from "@/components/paciente/caminhos/faixa-do-comum";
import { Limiar } from "@/components/paciente/experiencia/limiar";
import type { PatientCuradoria } from "@/modules/curadoria/patient-curadoria";

/**
 * Os três caminhos — o ambiente inteiro, com memória.
 *
 * Guarda quais cartas a pessoa já abriu (localStorage, por Curadoria): quem
 * volta dias depois vê onde parou em vez de recomeçar do zero. É memória de
 * navegação, nunca de decisão — a escolha continua sendo um ato só, registrado
 * na Connection.
 *
 * Uma carta aberta por vez: duas abertas voltariam a ser comparação
 * simultânea, que é justamente o que a leitura sequencial evita.
 */
export function CaminhosPanel({ curadoria }: { curadoria: PatientCuradoria }) {
  const chaveMemoria = `aliviar:caminhos-conhecidos:${curadoria.curatedSelectionId}`;

  const [aberta, setAberta] = useState<string | null>(null);
  const [conhecidas, setConhecidas] = useState<string[]>([]);

  // A memória só é lida no cliente: o servidor não sabe (nem precisa saber)
  // o que esta pessoa já leu.
  useEffect(() => {
    try {
      const guardado = window.localStorage.getItem(chaveMemoria);
      if (guardado) setConhecidas(JSON.parse(guardado) as string[]);
    } catch {
      // Navegador sem storage disponível: a experiência funciona igual,
      // apenas sem lembrar entre visitas.
    }
  }, [chaveMemoria]);

  function abrir(id: string) {
    setAberta(id);
    setConhecidas((atual) => {
      if (atual.includes(id)) return atual;
      const proximo = [...atual, id];
      try {
        window.localStorage.setItem(chaveMemoria, JSON.stringify(proximo));
      } catch {
        // sem storage, sem memória — e sem erro na cara da pessoa
      }
      return proximo;
    });
  }

  const todasConhecidas = curadoria.options.every((option) => conhecidas.includes(option.id));

  /* Decisão do Fundador (23/08): escolhido o caminho, ELE vira a tela — a
     entrega inteira num objeto só — e os outros dois recuam para consulta.
     Antes os três continuavam lado a lado, iguais, e o que ela escolheu
     virava só um nome numa linha de texto mais abaixo. */
  const escolhido =
    curadoria.decision?.outcome === "CHOSEN" && curadoria.decision.chosenName
      ? (curadoria.options.find(
          (opcao) => opcao.professionalName === curadoria.decision!.chosenName,
        ) ?? null)
      : null;

  if (escolhido) {
    const outros = curadoria.options.filter((opcao) => opcao.id !== escolhido.id);
    return (
      <section>
        <CaminhoEscolhido option={escolhido} decidedAt={curadoria.decision?.decidedAt} />

        {/* Os outros dois continuam disponíveis, sem competir: a Mesa não
            desaparece porque ela decidiu — só deixa de ser o assunto. */}
        <Limiar nome="Os outros dois caminhos que você considerou" />
        <div className="patient-cartas mt-6">
          {outros.map((option) => (
            <CartaCaminho
              key={option.id}
              option={option}
              aberta={aberta === option.id}
              jaConhecida={conhecidas.includes(option.id)}
              onAbrir={() => abrir(option.id)}
              onFechar={() => setAberta(null)}
            />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section>
      {/* O eco da Sala Particular: prosa com ar, nenhuma moldura de painel.
          O que uma pessoa escreveu é serifa (R3); nada aqui é clicável. */}
      <div className="max-w-[40rem] space-y-4">
        <h2 className="font-serif text-2xl font-normal text-[var(--patient-ink)]">
          Seus três caminhos
        </h2>
        <p className="max-w-prose text-sm leading-relaxed text-[var(--color-ink-muted)]">
          Preparados para o seu caso. Os três são legítimos — a ordem é de apresentação, não de
          preferência.
        </p>
        {curadoria.compositionRationale ? (
          <p className="max-w-prose font-serif text-base leading-[1.65] text-[var(--patient-ink)]">
            {curadoria.compositionRationale}
          </p>
        ) : null}
      </div>

      <Limiar nome="A Mesa" />

      {/* O Terreno Comum abre a Mesa, sempre — antes de existir qualquer
          coluna, existe uma superfície inteira (O1). É ordem de apresentação,
          nunca de liberação: nada abaixo fica trancado. */}
      <FaixaDoComum curatorName={curadoria.curatorName} />

      <div className="patient-cartas mt-8">
        {curadoria.options.map((option) => (
          <CartaCaminho
            key={option.id}
            option={option}
            aberta={aberta === option.id}
            jaConhecida={conhecidas.includes(option.id)}
            onAbrir={() => abrir(option.id)}
            onFechar={() => setAberta(null)}
          />
        ))}
      </div>

      {/* CORTE DE 23/08 (decisão do Fundador, "aplique todos os cortes"): a
          comparação deixou de exigir gesto. Antes eram quatro passos — marcar
          checkbox em duas cartas, rolar, achar o painel, escolher a aba — para
          reagrupar estados que as cartas já mostram. Agora o painel está
          simplesmente ali, com os três, uma dimensão por vez como sempre.
          O checkbox e o estado vazio saíram; nenhuma informação saiu. */}
      <div className="mt-8">
        <ComparacaoCaminhos options={curadoria.options} />
      </div>

      {/* A Conversa Consigo (A_MESA §3.4), agora numa frase só — corte de
          23/08: eram três parágrafos dizendo "não há pressa" três vezes.
          O que fica não apressa, não declara suficiência (Linguagem §6) e
          não pré-escolhe. Depois dela, o maior vazio da página: o espaço
          abaixo de uma escolha fica vazio, porque preencher ali é empurrar. */}
      {todasConhecidas && !curadoria.decision ? (
        <div className="mt-16 max-w-prose lg:mt-24">
          <p className="font-serif text-base leading-[1.65] text-[var(--patient-ink)]">
            Daqui em diante o trabalho é seu, sem pressa — reler e comparar fazem parte, e a
            escolha está logo adiante quando você quiser.
          </p>
        </div>
      ) : null}
    </section>
  );
}
