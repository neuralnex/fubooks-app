import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useLoginWithEmail } from '@privy-io/expo';
import { useTheme } from '../theme/ThemeContext';
import { spacing, radius, typography } from '../theme/colors';
import { Button } from '../components/Button';

/**
 * Frictionless passwordless authentication via Privy (per spec), using email OTP.
 * Every authenticated user is identified server-side by their unique Privy DID —
 * see apps/api/src/middleware/requireAuth.ts.
 */
export function LoginScreen() {
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { sendCode, loginWithCode } = useLoginWithEmail({
    onError: (err) => {
      setBusy(false);
      setError(err?.message ?? 'Something went wrong. Please try again.');
    },
  });

  const handleSendCode = async () => {
    setError(null);
    setBusy(true);
    try {
      await sendCode({ email });
      setCodeSent(true);
    } catch {
      // onError above already sets the error message
    } finally {
      setBusy(false);
    }
  };

  const handleVerify = async () => {
    setError(null);
    setBusy(true);
    try {
      await loginWithCode({ code, email });
      // On success, the root navigator (App.tsx) reacts to Privy's `user` becoming
      // truthy and swaps to the authenticated stack automatically.
    } catch {
      // onError above already sets the error message
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
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.inner}>
            <View style={styles.logoWrap}>
              <Image
                source={require('../../assets/logo.png')}
                style={styles.logo}
                contentFit="contain"
              />
            </View>
            <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.sm, textAlign: 'center' }]}>
              Textbooks for FUTO students, delivered to your hostel.
            </Text>

            <View style={{ marginTop: spacing.xl }}>
              <Text
                style={[typography.caption, { color: colors.textSecondary, marginBottom: spacing.xs }]}
              >
                Email Address
              </Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                editable={!codeSent}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholder="you@futo.edu.ng"
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

              {codeSent && (
                <View style={{ marginTop: spacing.lg }}>
                  <Text
                    style={[
                      typography.caption,
                      { color: colors.textSecondary, marginBottom: spacing.xs },
                    ]}
                  >
                    Enter the 6-digit code sent to your email
                  </Text>
                  <TextInput
                    value={code}
                    onChangeText={setCode}
                    keyboardType="number-pad"
                    maxLength={6}
                    placeholder="••••••"
                    placeholderTextColor={colors.textSecondary}
                    style={[
                      styles.input,
                      {
                        borderColor: colors.border,
                        color: colors.textPrimary,
                        backgroundColor: colors.surface,
                        letterSpacing: 4,
                      },
                    ]}
                  />
                </View>
              )}

              {error && (
                <Text style={[typography.caption, { color: colors.error, marginTop: spacing.sm }]}>
                  {error}
                </Text>
              )}

              <Button
                label={codeSent ? 'Verify & Continue' : 'Send Code'}
                onPress={codeSent ? handleVerify : handleSendCode}
                loading={busy}
                disabled={codeSent ? code.length !== 6 : !email.includes('@')}
                style={{ marginTop: spacing.xl }}
              />

              {codeSent && (
                <Text
                  onPress={() => {
                    setCodeSent(false);
                    setCode('');
                  }}
                  style={[
                    typography.caption,
                    { color: colors.primary, textAlign: 'center', marginTop: spacing.lg },
                  ]}
                >
                  Use a different email
                </Text>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  inner: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
  },
  logoWrap: {
    width: 140,
    height: 140,
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    padding: spacing.sm,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 16,
  },
});
