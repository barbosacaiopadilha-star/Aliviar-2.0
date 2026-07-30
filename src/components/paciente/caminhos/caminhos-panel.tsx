"use client";

import { useEffect, useState } from "react";

import { CartaCaminho } from "@/components/paciente/caminhos/carta-caminho";
import { ComparacaoCaminhos } from "@/components/paciente/caminhos/comparacao-caminhos";
import { ComparacaoNaoIniciada } from "@/components/paciente/experiencia/estados-vazios";
import { PatientCard } from "@/components/paciente/dashboard/patient-primitives";
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
  const [comparando, setComparando] = useState<string[]>([]);

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

  function alternarComparacao(id: string) {
    setComparando((atual) =>
      atual.includes(id) ? atual.filter((entrada) => entrada !== id) : [...atual, id],
    );
  }

  const selecionadas = curadoria.options.filter((option) => comparando.includes(option.id));
  const todasConhecidas = curadoria.options.every((option) => conhecidas.includes(option.id));

  return (
    <section className="space-y-6">
      <PatientCard>
        <h2 className="patient-section-title">Seus três caminhos</h2>
        <p className="patient-body mt-2 max-w-prose text-sm text-[var(--color-ink-muted)]">
          Preparados para o seu caso. Os três são legítimos — a ordem é de apresentação, não de
          preferência.
        </p>
        {curadoria.compositionRationale ? (
          <p className="patient-body max-w-prose text-sm leading-relaxed text-[var(--patient-ink)]">
            {curadoria.compositionRationale}
          </p>
        ) : null}
      </PatientCard>

      <div className="patient-cartas">
        {curadoria.options.map((option) => (
          <CartaCaminho
            key={option.id}
            option={option}
            aberta={aberta === option.id}
            jaConhecida={conhecidas.includes(option.id)}
            onAbrir={() => abrir(option.id)}
            onFechar={() => setAberta(null)}
            selecionadaParaComparar={comparando.includes(option.id)}
            onAlternarComparacao={() => alternarComparacao(option.id)}
          />
        ))}
      </div>

      {selecionadas.length >= 2 ? (
        <ComparacaoCaminhos options={selecionadas} />
      ) : (
        <ComparacaoNaoIniciada />
      )}

      {/* A preparação para a escolha só aparece depois que ela conheceu os
          três: convidar a decidir antes disso seria apressar. */}
      {todasConhecidas && !curadoria.decision ? (
        <PatientCard variant="note">
          <p className="patient-body max-w-prose leading-relaxed text-[var(--patient-ink)]">
            Agora você possui as informações necessárias para decidir qual caminho faz mais sentido
            para você. Não há pressa, e nenhum deles está pré-escolhido.
          </p>
        </PatientCard>
      ) : null}
    </section>
  );
}
