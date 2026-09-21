import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '../../theme/ThemeContext';
import { radius, spacing, typography } from '../../theme/colors';
import { useWallet } from '../../hooks/useWallet';
import { Button } from '../../components/Button';
import { ApiClientError } from '../../services/apiClient';
import type { InitiateFundingResponse } from '../../sharedTypes';

type KycMethod = 'bvn' | 'nin';

interface FundWalletScreenProps {
  navigation: { goBack: () => void };
}

export function FundWalletScreen({ navigation }: FundWalletScreenProps) {
  const { colors } = useTheme();
  const { initiateFunding } = useWallet();
  const [method, setMethod] = useState<KycMethod>('bvn');
  const [value, setValue] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [account, setAccount] = useState<InitiateFundingResponse | null>(null);

  const handleSubmit = async () => {
    if (value.length !== 11 || !/^\d{11}$/.test(value)) {
      Alert.alert('Invalid input', `${method.toUpperCase()} must be exactly 11 digits.`);
      return;
    }
    setSubmitting(true);
    try {
      const result = await initiateFunding({ [method]: value });
      setAccount(result);
    } catch (err) {
      Alert.alert(
        'Could not set up funding',
        err instanceof ApiClientError ? err.message : 'Please try again shortly.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const copyAccountNumber = async () => {
    if (!account) return;
    await Clipboard.setStringAsync(account.accountNumber);
    Alert.alert('Copied', 'Account number copied to clipboard.');
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={12}
          style={styles.backButton}
        >
          <Text style={[typography.bodyBold, { color: colors.primary }]}>← Back</Text>
        </Pressable>
      </View>

      {account ? (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={[typography.h1, { color: colors.textPrimary }]}>Your Funding Account</Text>
          <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.sm }]}>
            Transfer any amount to this dedicated account number. Your wallet will be credited
            automatically within seconds of a successful transfer.
          </Text>

          <View style={[styles.accountCard, { backgroundColor: colors.primary }]}>
            <Text style={[typography.caption, { color: 'rgba(255,255,255,0.8)' }]}>
              Account Number
            </Text>
            <Text
              style={styles.accountNumber}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {account.accountNumber}
            </Text>
            <Text style={[typography.body, { color: '#FFFFFF', marginTop: spacing.sm }]}>
              {account.bankName}
            </Text>
            <Text style={[typography.caption, { color: 'rgba(255,255,255,0.8)', marginTop: 2 }]}>
              {account.accountName}
            </Text>
          </View>

          <Button
            label="Copy Account Number"
            onPress={copyAccountNumber}
            variant="outline"
            style={{ marginTop: spacing.sm }}
          />
        </ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[typography.h1, { color: colors.textPrimary }]}>Fund Your Wallet</Text>
          <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.sm }]}>
            To create your dedicated bank account for wallet funding, we need a quick CBN-compliant
            identity check. This only happens once.
          </Text>

          <View style={styles.methodToggle}>
            {(['bvn', 'nin'] as const).map((m) => {
              const active = method === m;
              return (
                <Pressable
                  key={m}
                  onPress={() => {
                    setMethod(m);
                    setValue('');
                  }}
                  style={[
                    styles.methodPill,
                    {
                      backgroundColor: active ? colors.primary : colors.surface,
                      borderColor: active ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      typography.bodyBold,
                      { color: active ? '#FFFFFF' : colors.textSecondary },
                    ]}
                  >
                    {m.toUpperCase()}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text
            style={[typography.caption, { color: colors.textSecondary, marginTop: spacing.lg }]}
          >
            {method === 'bvn' ? 'Bank Verification Number' : 'National Identification Number'}
          </Text>
          <TextInput
            value={value}
            onChangeText={(t) => setValue(t.replace(/\D/g, '').slice(0, 11))}
            keyboardType="number-pad"
            maxLength={11}
            placeholder="Enter 11 digits"
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

          <Text style={[typography.small, { color: colors.textSecondary, marginTop: spacing.sm }]}>
            Your {method.toUpperCase()} is sent securely to our payment processor to verify your
            identity and is never stored on our servers.
          </Text>

          <Button
            label="Continue"
            onPress={handleSubmit}
            loading={submitting}
            disabled={value.length !== 11}
            style={{ marginTop: spacing.xl }}
          />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
    paddingRight: spacing.md,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  methodToggle: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  methodPill: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
    fontSize: 18,
    letterSpacing: 2,
  },
  accountCard: {
    borderRadius: radius.xl,
    padding: spacing.xl,
    marginVertical: spacing.xl,
  },
  accountNumber: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 2,
    marginTop: spacing.xs,
  },
});
