import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';
import { spacing, radius, typography } from '../../theme/colors';
import { Button } from '../../components/Button';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { ApiClientError } from '../../services/apiClient';

export function AdminLoginScreen() {
  const { colors } = useTheme();
  const { login } = useAdminAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setError(null);
    setBusy(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Login failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <View style={styles.content}>
          <Text style={[typography.h1, { color: colors.primary }]}>FUBOOKS Admin</Text>
          <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.sm }]}>
            Sign in to manage the catalog and view analytics.
          </Text>

          <View style={{ marginTop: spacing.xxl }}>
            <Text
              style={[typography.caption, { color: colors.textSecondary, marginBottom: spacing.xs }]}
            >
              Email
            </Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholderTextColor={colors.textSecondary}
              style={[
                styles.input,
                {
                  borderColor: colors.border,
                  color: colors.textPrimary,
                  backgroundColor: colors.surface,
                },
              ]}
            />

            <Text
              style={[
                typography.caption,
                { color: colors.textSecondary, marginTop: spacing.lg, marginBottom: spacing.xs },
              ]}
            >
              Password
            </Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholderTextColor={colors.textSecondary}
              style={[
                styles.input,
                {
                  borderColor: colors.border,
                  color: colors.textPrimary,
                  backgroundColor: colors.surface,
                },
              ]}
            />

            {error && (
              <Text style={[typography.caption, { color: colors.error, marginTop: spacing.sm }]}>
                {error}
              </Text>
            )}

            <Button
              label="Sign In"
              onPress={handleLogin}
              loading={busy}
              disabled={!email || !password}
              style={{ marginTop: spacing.xl }}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  content: { flex: 1, padding: spacing.xl, justifyContent: 'center' },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
});
