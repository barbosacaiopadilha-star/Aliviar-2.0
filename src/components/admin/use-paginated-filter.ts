"use client";

import { useMemo, useState } from "react";

const PAGE_SIZE = 10;

// Busca + paginação client-side sobre uma lista já carregada por completo no
// servidor — escala adequada para uma ferramenta de operação interna, sem
// precisar de paginação/busca real contra a Admin API do Supabase (que não
// expõe filtro por texto). `filter` decide o que conta como "match" de
// busca; a paginação é sempre aplicada depois do filtro.
export function usePaginatedFilter<T>(items: T[], filter: (item: T, query: string) => boolean) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return items;
    return items.filter((item) => filter(item, trimmed));
  }, [items, query, filter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function handleQueryChange(value: string) {
    setQuery(value);
    setPage(1);
  }

  return {
    query,
    setQuery: handleQueryChange,
    page: safePage,
    setPage,
    totalPages,
    pageItems,
    totalMatches: filtered.length,
  };
}
