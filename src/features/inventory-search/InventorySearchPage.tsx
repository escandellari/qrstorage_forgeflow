'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { getActiveWorkspace } from '@/src/features/workspace-access';
import { type SearchResult, searchInventory, sortResults } from './inventorySearchService';

export function InventorySearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [hasWorkspace, setHasWorkspace] = useState(true);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoadingWorkspace, setIsLoadingWorkspace] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const workspace = await getActiveWorkspace();

        if (!workspace) {
          setHasWorkspace(false);
          setErrorMessage('We could not load the search. Sign in again.');
          return;
        }

        setHasWorkspace(true);
        setWorkspaceId(workspace.workspaceId);
        setErrorMessage(null);
      } catch {
        setHasWorkspace(false);
        setErrorMessage('We could not load the search. Sign in again.');
      } finally {
        setIsLoadingWorkspace(false);
      }
    })();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!workspaceId) {
      return;
    }

    try {
      const nextResults = await searchInventory(query, workspaceId);
      setResults(sortResults(nextResults));
      setHasSearched(true);
      setErrorMessage(null);
    } catch {
      setErrorMessage('Search failed. Try again.');
    }
  }

  if (!hasWorkspace) {
    return (
      <main className="search-shell">
        <h1 className="search-page-title">Search</h1>
        <p role="alert" className="ui-alert">{errorMessage}</p>
      </main>
    );
  }

  if (isLoadingWorkspace) {
    return (
      <main className="search-shell">
        <h1 className="search-page-title">Search</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Loading search…</p>
      </main>
    );
  }

  return (
    <main className="search-shell">
      <h1 className="search-page-title">Search</h1>

      <form aria-label="Inventory lookup form" onSubmit={handleSubmit} className="search-form-card">
        <input
          id="search-query"
          type="search"
          value={query}
          placeholder="Search boxes and items…"
          onChange={(event) => {
            setQuery(event.target.value);
            setErrorMessage(null);
          }}
          className="ui-input"
        />
        <label htmlFor="search-query" style={{ display: 'none' }}>Search</label>
        <button type="submit" className="search-submit-btn">Search</button>
      </form>

      {errorMessage ? <p role="alert" className="ui-alert" style={{ marginBottom: '12px' }}>{errorMessage}</p> : null}

      {hasSearched && results.length === 0 ? (
        <div className="inventory-list-card">
          <div className="ui-empty">
            <p className="ui-empty-title">No results found</p>
            <p className="ui-empty-body">Try a different search term</p>
          </div>
        </div>
      ) : results.length > 0 ? (
        <ul className="search-results-list">
          {results.map((result) => (
            <li
              key={`${result.boxRowId}:${result.boxId}:${result.rankSource}:${result.matchContext}`}
            >
              <Link href={`/boxes/${result.boxId}`} className="search-result-card">
                <div className="search-result-id">{result.boxId}</div>
                <div className="search-result-name">{result.boxName ?? 'Unnamed box'}</div>
                {result.location ? <div className="search-result-location">{result.location}</div> : null}
                {result.matchContext ? <div className="search-result-context">{result.matchContext}</div> : null}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </main>
  );
}
