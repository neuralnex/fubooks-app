import { useCallback, useRef, useState } from 'react';
import * as Crypto from 'expo-crypto';
import { apiClient, ApiClientError } from '../services/apiClient';
import { useAuthToken } from './useAuthToken';
import type { CreateOrderRequest, OrderDTO } from '../sharedTypes';

export function useCheckout() {
  const { getToken } = useAuthToken();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const attempt = useRef<{ bookId: string; key: string } | null>(null);

  const placeOrder = useCallback(
    async (input: CreateOrderRequest): Promise<OrderDTO | null> => {
      setSubmitting(true);
      setError(null);
      if (!attempt.current || attempt.current.bookId !== input.bookId) {
        attempt.current = { bookId: input.bookId, key: Crypto.randomUUID() };
      }
      const idempotencyKey = attempt.current.key;
      try {
        const order = await apiClient.post<OrderDTO>('/api/v1/orders', input, getToken, {
          'Idempotency-Key': idempotencyKey,
        });
        attempt.current = null;
        return order;
      } catch (err) {
        // Keep the key after a network/timeout error because the server may have
        // completed checkout. A definite API response ends that attempt, except
        // CHECKOUT_IN_PROGRESS, where the same key is needed to retrieve its result.
        if (err instanceof ApiClientError && err.code !== 'TIMEOUT' &&
            err.code !== 'NETWORK_ERROR' && err.code !== 'CHECKOUT_IN_PROGRESS') {
          attempt.current = null;
        }
        setError(
          err instanceof ApiClientError ? err.message : 'Checkout failed. Please try again.'
        );
        return null;
      } finally {
        setSubmitting(false);
      }
    },
    [getToken]
  );

  return { placeOrder, submitting, error };
}
