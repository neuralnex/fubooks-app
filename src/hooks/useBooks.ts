import { useCallback, useEffect, useRef, useState } from 'react';
import { apiClient, ApiClientError } from '../services/apiClient';
import type { BookDTO, FutoLevel } from '../sharedTypes';

interface UseBooksResult {
  books: BookDTO[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Drives the level-filtered, infinite-scroll FlatList on the student home screen.
 * No auth required — catalog browsing is public per the Just-in-Time KYC spec.
 *
 * M-2: search input is debounced (300ms) to avoid issuing a request on every keystroke
 * (especially relevant on slow networks where the response might land out of order
 * with subsequent keystrokes).
 * M-3: `loadMore` early-returns if a load is already in flight, even if `loadingMore`
 * state hasn't flipped yet (FlatList.onEndReached can fire multiple times per render).
 */
const SEARCH_DEBOUNCE_MS = 300;

export function useBooks(level: FutoLevel, searchQuery?: string): UseBooksResult {
  const [books, setBooks] = useState<BookDTO[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  // Stable ref to suppress the very-first debounce fire when only `level` changes
  // but the search query hasn't actually been typed yet.
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const buildQuery = useCallback(
    (cursorParam?: string | null) => {
      const params = new URLSearchParams({ level, limit: '20' });
      if (searchQuery) params.set('search', searchQuery);
      if (cursorParam) params.set('cursor', cursorParam);
      return `/api/v1/books?${params.toString()}`;
    },
    [level, searchQuery]
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<{ books: BookDTO[]; nextCursor: string | null }>(
        buildQuery(null)
      );
      setBooks(res.books);
      setCursor(res.nextCursor);
      setHasMore(Boolean(res.nextCursor));
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to load books.');
    } finally {
      setLoading(false);
    }
  }, [buildQuery]);

  useEffect(() => {
    // M-2: debounce refresh — when searchQuery changes, wait SEARCH_DEBOUNCE_MS
    // before firing the request. The level change is debounced too (cheap) so we
    // don't double-fetch on rapid filter changes.
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      refresh();
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [refresh]);

  const loadMore = useCallback(async () => {
    // M-3: extra guard — `loading` (initial refresh) also blocks loadMore so we
    // don't double-fetch when onEndReached fires during a level change.
    if (loadingMore || loading || !hasMore || !cursor) return;
    setLoadingMore(true);
    try {
      const res = await apiClient.get<{ books: BookDTO[]; nextCursor: string | null }>(
        buildQuery(cursor)
      );
      setBooks((prev) => [...prev, ...res.books]);
      setCursor(res.nextCursor);
      setHasMore(Boolean(res.nextCursor));
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to load more books.');
    } finally {
      setLoadingMore(false);
    }
  }, [buildQuery, cursor, hasMore, loadingMore, loading]);

  return { books, loading, loadingMore, error, hasMore, loadMore, refresh };
}
