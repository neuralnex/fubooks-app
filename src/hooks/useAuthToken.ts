import { usePrivy } from '@privy-io/expo';
import { useCallback } from 'react';

/**
 * Thin wrapper around Privy's usePrivy hook, exposing exactly what our API client
 * needs: a stable getToken callback (backed by Privy's getAccessToken, which
 * auto-refreshes near-expiry tokens), plus the auth/ready booleans for gating UI.
 */
export function useAuthToken() {
  const { user, isReady, getAccessToken, logout } = usePrivy();

  const getToken = useCallback(async (): Promise<string | null> => {
    if (!user) return null;
    try {
      return await getAccessToken();
    } catch {
      return null;
    }
  }, [user, getAccessToken]);

  return {
    isReady,
    isAuthenticated: Boolean(user),
    privyDid: user?.id ?? null,
    getToken,
    logout,
  };
}
