"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { pesquisarGlobal } from "@/curator-layer/api/curador-tools-client";
import type { CuratorSearchResultItem } from "@/curator-tools-flow/contracts/curator-tools";

export function CuradorGlobalSearch() {
  const [query, setQuery] = useState("");
  const [resultados, setResultados] = useState<CuratorSearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);

  const trimmedQuery = query.trim();
  const canSearch = trimmedQuery.length >= 2;
  const displayedResults = canSearch ? resultados : [];

  useEffect(() => {
    if (!canSearch) {
      return;
    }

    const timer = setTimeout(() => {
      setLoading(true);
      void pesquisarGlobal(query)
        .then((result) => setResultados(result.resultados))
        .catch(() => setResultados([]))
        .finally(() => setLoading(false));
    }, 300);

    return () => clearTimeout(timer);
  }, [canSearch, query]);

  return (
    <section className="card p-4" data-testid="curador-global-search">
      <label className="block text-sm font-medium text-ink" htmlFor="curador-search">
        Pesquisa global
      </label>
      <input
        id="curador-search"
        type="search"
        className="mt-2 w-full rounded-lg border border-line px-3 py-2 text-sm"
        placeholder="Paciente, jornada, médico, documento, protocolo..."
        value={query}
        onChange={(e) => {
          const next = e.target.value;
          setQuery(next);
          if (next.trim().length < 2) {
            setResultados([]);
          }
        }}
        data-testid="curador-search-input"
      />
      {loading ? <p className="mt-2 text-xs text-ink-soft">Buscando...</p> : null}
      {displayedResults.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {displayedResults.map((item) => (
            <li key={`${item.entity_type}:${item.entity_id}`}>
              <Link
                href={item.href}
                className="block rounded-lg border border-line/60 px-3 py-2 text-sm hover:bg-paper"
                data-testid={`search-result-${item.entity_type}`}
              >
                <span className="font-medium text-ink">{item.titulo}</span>
                <span className="mt-0.5 block text-xs text-ink-soft">
                  {item.subtitulo} — {item.entity_type.replaceAll("_", " ")}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
      {canSearch && !loading && displayedResults.length === 0 ? (
        <p className="mt-2 text-xs text-ink-soft">Nenhum resultado.</p>
      ) : null}
    </section>
  );
}
