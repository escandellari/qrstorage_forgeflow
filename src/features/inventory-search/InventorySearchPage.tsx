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

  useEffect(() => {
    void (async () => {
      try {
        const workspace = await getActiveWorkspace();
        if (!workspace) {
          setHasWorkspace(false);
          setErrorMessage('We could not load the search. Sign in again.');
          return;
        }
        setWorkspaceId(workspace.workspaceId);
      } catch {
        setHasWorkspace(false);
        setErrorMessage('We could not load the search. Sign in again.');
      }
    })();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!workspaceId) {
      return;
    }

    try {
      const rows = await searchInventory(query, workspaceId);
      setResults(sortResults(rows));
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

  return (
    <main>
      <h1>Search</h1>
      <form aria-label="Find items" onSubmit={handleSubmit}>
        <label htmlFor="search-query">Search</label>
        <input
          id="search-query"
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        {errorMessage ? <p role="alert">{errorMessage}</p> : null}
        <button type="submit">Search</button>
      </form>
      <ul>
        {results.map((result, index) => (
          <li key={`${result.boxRowId}-${result.rankSource}-${index}`}>
            <Link href={`/boxes/${result.boxId}`}>
              <span>{result.boxId}</span>
              <span>{result.boxName}</span>
            </Link>
            <span>{result.location}</span>
            <span>{result.matchContext}</span>
          </li>
        ))}
      </ul>
    </main>
  );
}
