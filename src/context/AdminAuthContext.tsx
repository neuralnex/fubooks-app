import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { apiClient } from '../services/apiClient';

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
}

const AdminAuthContext = createContext<AdminAuthContextValue | undefined>(undefined);

/**
 * Admin sessions are entirely separate from the student Privy session — a different
 * JWT, stored under a different SecureStore key, issued by our own /admin/auth/login
 * endpoint. This keeps the two trust boundaries (student vs admin) from ever overlapping
 * in the client, mirroring the backend's separate Admin model and middleware.
 */
export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<AdminInfo | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    (async () => {
      const stored = await SecureStore.getItemAsync(ADMIN_TOKEN_KEY);
      if (stored) {
        setToken(stored);
        // We don't have the admin's profile cached locally; re-derive it lazily
        // by hitting a lightweight authenticated endpoint if needed. For now we
        // just mark ready — screens that need `admin` will refetch as necessary.
      }
      setIsReady(true);
    })();
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

  return (
    <AdminAuthContext.Provider value={{ admin, token, isReady, login, logout }}>
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
