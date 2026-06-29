import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { PrivyProvider, usePrivy } from '@privy-io/expo';
import Constants from 'expo-constants';
import { Pressable, Text, View, StyleSheet, ActivityIndicator } from 'react-native';
import type { PropsWithChildren } from 'react';
import type { ViewProps } from 'react-native';

import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { AdminAuthProvider, useAdminAuth } from './src/context/AdminAuthContext';
import { LoginScreen } from './src/screens/LoginScreen';
import { StudentNavigator } from './src/navigation/StudentNavigator';
import { AdminLoginScreen } from './src/screens/admin/AdminLoginScreen';
import { AdminNavigator } from './src/navigation/AdminNavigator';
import { spacing, typography } from './src/theme/colors';

// Read from app.json's expo.extra (see app.json + eas.json for per-environment values).
const PRIVY_APP_ID = (Constants.expoConfig?.extra?.privyAppId as string) ?? '';
const PRIVY_CLIENT_ID = (Constants.expoConfig?.extra?.privyClientId as string) ?? '';

type AppMode = 'student' | 'admin';
const GestureRootView = GestureHandlerRootView as React.ComponentType<PropsWithChildren<ViewProps>>;

function StudentApp() {
  const { isReady, user } = usePrivy();
  const { colors } = useTheme();

  if (!isReady) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return user ? <StudentNavigator /> : <LoginScreen />;
}

function AdminApp() {
  const { token, isReady } = useAdminAuth();
  const { colors } = useTheme();

  if (!isReady) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return token ? <AdminNavigator /> : <AdminLoginScreen />;
}

/**
 * Small, unobtrusive switcher between the Student app and the Admin dashboard.
 * In a real deployment this would likely be two separate EAS build profiles/app
 * bundles (a "FUBOOKS" app for students and a "FUBOOKS Admin" app for staff) — see
 * eas.json's `admin-*` profiles. This in-app toggle is kept for convenience during
 * development/testing within a single Expo Go session, and is only rendered in dev.
 */
function ModeSwitcher({ mode, onChange }: { mode: AppMode; onChange: (m: AppMode) => void }) {
  const { colors } = useTheme();
  return (
    <View
      style={[styles.switcher, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      {(['student', 'admin'] as const).map((m) => (
        <Pressable
          key={m}
          onPress={() => onChange(m)}
          style={[
            styles.switcherChip,
            { backgroundColor: mode === m ? colors.primary : 'transparent' },
          ]}
        >
          <Text
            style={[
              typography.small,
              { color: mode === m ? '#FFFFFF' : colors.textSecondary, fontWeight: '700' },
            ]}
          >
            {m === 'student' ? 'STUDENT' : 'ADMIN'}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function RootContent() {
  const [mode, setMode] = useState<AppMode>('student');
  const { colors } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <NavigationContainer>
        {mode === 'student' ? <StudentApp /> : <AdminApp />}
      </NavigationContainer>
      {__DEV__ && <ModeSwitcher mode={mode} onChange={setMode} />}
    </View>
  );
}

export default function App() {
  return (
    <GestureRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <PrivyProvider appId={PRIVY_APP_ID} clientId={PRIVY_CLIENT_ID}>
            <AdminAuthProvider>
              <StatusBar style="auto" />
              <RootContent />
            </AdminAuthProvider>
          </PrivyProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureRootView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  switcher: {
    position: 'absolute',
    top: 50,
    right: spacing.md,
    flexDirection: 'row',
    borderRadius: 999,
    borderWidth: 1,
    overflow: 'hidden',
  },
  switcherChip: { paddingHorizontal: spacing.sm, paddingVertical: 4 },
});
