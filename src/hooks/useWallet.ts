import { useCallback, useEffect, useState } from 'react';
import { apiClient, ApiClientError } from '../services/apiClient';
import { useAuthToken } from './useAuthToken';
import type { WalletDTO, InitiateFundingInput, InitiateFundingResponse } from '../sharedTypes';

interface WalletTransactionView {
  id: string;
  type: 'CREDIT' | 'DEBIT';
  source: string;
  amount: string;
  balanceAfter: string;
  description: string | null;
  createdAt: string;
}

export function useWallet() {
  const { getToken } = useAuthToken();
  const [wallet, setWallet] = useState<WalletDTO | null>(null);
  const [transactions, setTransactions] = useState<WalletTransactionView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [walletRes, txRes] = await Promise.all([
        apiClient.get<WalletDTO>('/api/v1/wallet', getToken),
        apiClient.get<{ transactions: WalletTransactionView[] }>(
          '/api/v1/wallet/transactions?limit=20',
          getToken
        ),
      ]);
      setWallet(walletRes);
      setTransactions(txRes.transactions);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to load wallet.');
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const initiateFunding = useCallback(
    async (input: InitiateFundingInput): Promise<InitiateFundingResponse> => {
      return apiClient.post<InitiateFundingResponse>('/api/v1/wallet/fund', input, getToken);
    },
    [getToken]
  );

  const getFundingAccount = useCallback(async (): Promise<InitiateFundingResponse | null> => {
    const result = await apiClient.get<{ account: InitiateFundingResponse | null }>(
      '/api/v1/wallet/funding-account', getToken
    );
    return result.account;
  }, [getToken]);

  return { wallet, transactions, loading, error, refresh, initiateFunding, getFundingAccount };
}
