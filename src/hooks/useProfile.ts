import { useCallback, useEffect, useState } from 'react';
import { apiClient, ApiClientError } from '../services/apiClient';
import { useAuthToken } from './useAuthToken';
import type { UserProfileDTO, DeliveryDetailsDTO } from '../sharedTypes';

export function useProfile() {
  const { getToken, isAuthenticated } = useAuthToken();
  const [profile, setProfile] = useState<UserProfileDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<UserProfileDTO>('/api/v1/me', getToken);
      setProfile(res);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to load profile.');
    } finally {
      setLoading(false);
    }
  }, [getToken, isAuthenticated]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const updateProfile = useCallback(
    async (
      data: Partial<Pick<UserProfileDTO, 'fullName' | 'email' | 'matricNumber' | 'level' | 'faculty'>>
    ) => {
      // M-4: strip empty strings so the server's zod .email() and matricNumber regex
      // don't reject what is meant to be "leave this field alone" in the UI.
      const cleaned: Partial<typeof data> = {};
      for (const [k, v] of Object.entries(data)) {
        if (v === undefined) continue;
        if (typeof v === 'string' && v.trim() === '') continue;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (cleaned as any)[k] = v;
      }
      if (Object.keys(cleaned).length === 0) return profile;
      const updated = await apiClient.patch<UserProfileDTO>('/api/v1/me', cleaned, getToken);
      setProfile(updated);
      return updated;
    },
    [getToken, profile]
  );

  const saveDeliveryDetails = useCallback(
    async (data: DeliveryDetailsDTO) => {
      const saved = await apiClient.put<DeliveryDetailsDTO>(
        '/api/v1/me/delivery-details',
        data,
        getToken
      );
      // L-3: update local profile with the returned delivery details (full shape),
      // not just a `hasDeliveryDetails` boolean — otherwise the next read sees stale
      // data until `refresh()` is called.
      setProfile((prev) =>
        prev ? { ...prev, hasDeliveryDetails: true, deliveryDetails: saved } : prev
      );
      return saved;
    },
    [getToken]
  );

  const getDeliveryDetails = useCallback(async (): Promise<DeliveryDetailsDTO | null> => {
    try {
      return await apiClient.get<DeliveryDetailsDTO>('/api/v1/me/delivery-details', getToken);
    } catch (err) {
      if (err instanceof ApiClientError && err.code === 'NO_DELIVERY_DETAILS') {
        return null;
      }
      // L-4: any other error (network, 500) — fall back to "no saved details"
      // so callers can prefill with an empty form rather than throwing.
      return null;
    }
  }, [getToken]);

  return {
    profile,
    loading,
    error,
    refresh,
    updateProfile,
    saveDeliveryDetails,
    getDeliveryDetails,
  };
}
