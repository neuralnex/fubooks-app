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
      const updated = await apiClient.patch<UserProfileDTO>('/api/v1/me', data, getToken);
      setProfile(updated);
      return updated;
    },
    [getToken]
  );

  const saveDeliveryDetails = useCallback(
    async (data: DeliveryDetailsDTO) => {
      const saved = await apiClient.put<DeliveryDetailsDTO>(
        '/api/v1/me/delivery-details',
        data,
        getToken
      );
      setProfile((prev) => (prev ? { ...prev, hasDeliveryDetails: true } : prev));
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
      throw err;
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
