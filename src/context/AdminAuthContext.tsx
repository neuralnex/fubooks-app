import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { apiClient, ApiClientError } from '../services/apiClient';

const ADMIN_TOKEN_KEY = 'fubooks_admin_token';

interface AdminInfo {
  id: string;
  email: string;
  fullName: string;
  role: 'SUPER_ADMIN' | 'ADMIN';
  accessLevel: 'FULL' | 'CATALOG_ONLY' | 'ORDERS_ONLY' | 'READ_ONLY';
}

interface AdminAuthContextValue {
  admin: AdminInfo | null;
  token: string | null;
  isReady: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextValue | undefined>(undefined);

/**
 * Admin sessions are entirely separate from the student Privy session — a different
 * JWT, stored under a different SecureStore key, issued by our own /admin/auth/login
 * endpoint. This keeps the two trust boundaries (student vs admin) from ever overlapping
 * in the client, mirroring the backend's separate Admin model and middleware.
 *
 * L-2: on app launch with a stored token, we eagerly call `/admin/me` to repopulate
 * the admin profile (role, accessLevel) so screens that gate UI on `admin.role`
 * don't briefly think the user isn't a super admin.
 */
export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<AdminInfo | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  const fetchProfile = useCallback(async (): Promise<AdminInfo | null> => {
    try {
      const res = await apiClient.get<{ admin: AdminInfo }>(
        '/api/v1/admin/auth/me',
        async () => token
      );
      return res.admin;
    } catch (err) {
      if (err instanceof ApiClientError && (err.statusCode === 401 || err.statusCode === 403)) {
        // Token revoked or admin deactivated — wipe local state.
        await SecureStore.deleteItemAsync(ADMIN_TOKEN_KEY);
        setToken(null);
        setAdmin(null);
        return null;
      }
      // Network error: keep the token, just leave admin null. Screens will retry.
      return null;
    }
  }, [token]);

  useEffect(() => {
    (async () => {
      const stored = await SecureStore.getItemAsync(ADMIN_TOKEN_KEY);
      if (stored) {
        setToken(stored);
        const profile = await fetchProfile();
        if (profile) setAdmin(profile);
      }
      setIsReady(true);
    })();
    // We intentionally only run this on mount; token changes mid-session trigger
    // a manual refresh() call from the caller.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiClient.post<{ token: string; admin: AdminInfo }>(
      '/api/v1/admin/auth/login',
      { email, password }
    );
    await SecureStore.setItemAsync(ADMIN_TOKEN_KEY, res.token);
    setToken(res.token);
    setAdmin(res.admin);
  }, []);

  const logout = useCallback(async () => {
    await SecureStore.deleteItemAsync(ADMIN_TOKEN_KEY);
    setToken(null);
    setAdmin(null);
  }, []);

  const refresh = useCallback(async () => {
    const profile = await fetchProfile();
    if (profile) setAdmin(profile);
  }, [fetchProfile]);

  return (
    <AdminAuthContext.Provider value={{ admin, token, isReady, login, logout, refresh }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth(): AdminAuthContextValue {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  return ctx;
}

/** Bound getToken function matching the shape apiClient expects, for admin-authed calls. */
export function useAdminGetToken() {
  const { token } = useAdminAuth();
  return useCallback(async () => token, [token]);
}
