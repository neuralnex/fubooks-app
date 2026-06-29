import { useCallback, useEffect, useState } from 'react';
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
 */
export function useBooks(level: FutoLevel, searchQuery?: string): UseBooksResult {
  const [books, setBooks] = useState<BookDTO[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

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
    refresh();
  }, [refresh]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || !cursor) return;
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
  }, [buildQuery, cursor, hasMore, loadingMore]);

  return { books, loading, loadingMore, error, hasMore, loadMore, refresh };
}
