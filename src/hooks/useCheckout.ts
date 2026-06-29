import { useCallback, useState } from 'react';
import { apiClient, ApiClientError } from '../services/apiClient';
import { useAuthToken } from './useAuthToken';
import type { CreateOrderRequest, OrderDTO } from '../sharedTypes';

export function useCheckout() {
  const { getToken } = useAuthToken();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const placeOrder = useCallback(
    async (input: CreateOrderRequest): Promise<OrderDTO | null> => {
      setSubmitting(true);
      setError(null);
      try {
        const order = await apiClient.post<OrderDTO>('/api/v1/orders', input, getToken);
        return order;
      } catch (err) {
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
