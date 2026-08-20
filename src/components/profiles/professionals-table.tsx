"use client";

import Link from "next/link";
import { useCallback } from "react";

import { usePaginatedFilter } from "@/components/admin/use-paginated-filter";
import { Badge } from "@/components/ui/badge";
import { elegibilidadeEfetiva } from "@/modules/profiles/ciclo-do-profissional";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { SearchField } from "@/components/ui/search-field";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import type { ProfessionalProfile } from "@/modules/profiles/types";

type ProfessionalsTableProps = {
  professionals: ProfessionalProfile[];
};

export function ProfessionalsTable({ professionals }: ProfessionalsTableProps) {
  const matchesQuery = useCallback(
    (professional: ProfessionalProfile, query: string) =>
      professional.displayName.toLowerCase().includes(query) ||
      professional.professionalIdentifier.toLowerCase().includes(query),
    [],
  );

  const { query, setQuery, page, setPage, totalPages, pageItems, totalMatches } = usePaginatedFilter(
    professionals,
    matchesQuery,
  );

  if (professionals.length === 0) {
    return (
      <EmptyState
        title="Ainda não há profissionais cadastrados."
        description="Crie o primeiro registro para começar a formar a Rede Aliviar."
      />
    );
  }

  return (
    <div className="space-y-4">
      <SearchField
        label="Buscar por nome ou identificação"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        className="max-w-sm"
      />

      {totalMatches === 0 ? (
        <EmptyState
          title="Nenhum profissional encontrado."
          description="Tente buscar por outro nome ou identificação."
        />
      ) : (
        <Card padding="sm">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Nome</TableHeaderCell>
                <TableHeaderCell>Identificação</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>Publicação</TableHeaderCell>
                <TableHeaderCell>Elegibilidade</TableHeaderCell>
                <TableHeaderCell>
                  {/*
                    C7R · `sr-only` é position:absolute. Sem um ancestral
                    posicionado DENTRO do contêiner de rolagem, o span ancora
                    na raiz e estica document.scrollWidth até a borda da tabela
                    (663px em viewport 390): a página ganhava scroll horizontal
                    mesmo com o wrapper contendo a tabela direitinho. A âncora
                    relative prende o span aqui dentro — e o clip volta a valer.
                  */}
                  <span className="relative inline-block">
                    <span className="sr-only">Ações</span>
                  </span>
                </TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pageItems.map((professional) => (
                <TableRow key={professional.id}>
                  <TableCell>
                    <span className="font-medium text-ink">{professional.displayName}</span>
                  </TableCell>
                  <TableCell>{professional.professionalIdentifier}</TableCell>
                  <TableCell>
                    <Badge variant={professional.status === "ativo" ? "sage" : "default"}>
                      {professional.status === "ativo" ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={professional.publicationStatus === "publicado" ? "gold" : "default"}>
                      {professional.publicationStatus === "publicado" ? "Publicado" : "Não publicado"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {/*
                      "Ativo" e "Publicado" são dois eixos que, juntos, ainda não
                      respondem a única pergunta que importa: esta pessoa pode
                      ser apresentada a uma paciente AGORA? A elegibilidade
                      efetiva responde — e, quando é não, diz por quê.
                    */}
                    {(() => {
                      const elegibilidade = elegibilidadeEfetiva({
                        ciclo: professional.ciclo,
                        isDemo: professional.isDemo,
                        isTestFixture: professional.isTestFixture,
                      });
                      if (elegibilidade.elegivel) return <Badge variant="sage">Elegível</Badge>;
                      // `motivo` é sempre preenchido quando não é elegível; o
                      // fallback existe só para o compilador, e diz a verdade.
                      const porque = elegibilidade.motivo ?? "Motivo não informado";
                      return (
                        <Badge variant="default">{`Não elegível — ${porque}`}</Badge>
                      );
                    })()}
                  </TableCell>
                  <TableCell>
                    {/* Duas ações, não uma. "Editar" abre o cadastro; o ciclo
                        de vida (pausar, arquivar, retomar) vive na aba Rede e
                        não tinha caminho a partir daqui — quem administrava a
                        Rede pela listagem não encontrava a única ação capaz de
                        tirar alguém de circulação. */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                      <Link
                        href={`/admin/profissionais/${professional.id}`}
                        className="font-medium text-brand-primary hover:text-brand-primary-deep"
                      >
                        Editar
                      </Link>
                      <Link
                        href={`/admin/profissionais/${professional.id}/rede`}
                        className="font-medium text-brand-primary hover:text-brand-primary-deep"
                      >
                        Ciclo de vida
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {totalPages > 1 ? <Pagination page={page} totalPages={totalPages} onPageChange={setPage} /> : null}
    </div>
  );
}
