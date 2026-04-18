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
      <main>
        <h1>Search</h1>
        <p role="alert">{errorMessage}</p>
      </main>
    );
  }

  if (isLoadingWorkspace) {
    return (
      <main>
        <h1>Search</h1>
        <p>Loading search…</p>
      </main>
    );
  }

  return (
    <main>
      <h1>Search</h1>
      <form aria-label="Inventory search" onSubmit={handleSubmit}>
        <label htmlFor="search-query">Search</label>
        <input
          id="search-query"
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setErrorMessage(null);
          }}
        />
        {errorMessage ? <p role="alert">{errorMessage}</p> : null}
        <button type="submit">Search</button>
      </form>
      {hasSearched && results.length === 0 ? (
        <p>No search results found.</p>
      ) : results.length > 0 ? (
        <ul>
          {results.map((result) => (
            <li
              key={`${result.boxRowId}:${result.boxId}:${result.rankSource}:${result.matchContext}`}
            >
              <Link href={`/boxes/${result.boxId}`}>
                <span>{result.boxId}</span>
                <span>{result.boxName ?? 'Unnamed box'}</span>
              </Link>
              <p>{result.location}</p>
              <p>{result.matchContext}</p>
            </li>
          ))}
        </ul>
      ) : null}
    </main>
  );
}
