import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '../../theme/ThemeContext';
import { radius, spacing, typography } from '../../theme/colors';
import { useWallet } from '../../hooks/useWallet';
import { Button } from '../../components/Button';
import { ApiClientError } from '../../services/apiClient';
import type { InitiateFundingResponse } from '../../sharedTypes';

type Gender = '1' | '2';

interface FundingDetails {
  firstName: string;
  lastName: string;
  mobileNumber: string;
  dateOfBirth: string;
  bvn: string;
  gender: Gender;
  address: string;
}

const EMPTY_DETAILS: FundingDetails = {
  firstName: '', lastName: '', mobileNumber: '', dateOfBirth: '', bvn: '', gender: '1', address: '',
};

interface FundWalletScreenProps {
  navigation: { goBack: () => void };
}

export function FundWalletScreen({ navigation }: FundWalletScreenProps) {
  const { colors } = useTheme();
  const { initiateFunding, getFundingAccount } = useWallet();
  const [details, setDetails] = useState<FundingDetails>(EMPTY_DETAILS);
  const [submitting, setSubmitting] = useState(false);
  const [account, setAccount] = useState<InitiateFundingResponse | null>(null);

  useEffect(() => {
    getFundingAccount().then(setAccount).catch(() => {
      // Keep the setup form usable when the account lookup is temporarily offline.
    });
  }, [getFundingAccount]);

  const update = <K extends keyof FundingDetails>(key: K, value: FundingDetails[K]) =>
    setDetails((current) => ({ ...current, [key]: value }));

  const handleSubmit = async () => {
    if (!/^\d{11}$/.test(details.bvn)) {
      Alert.alert('Invalid BVN', 'BVN must be exactly 11 digits.');
      return;
    }
    setSubmitting(true);
    try {
      const result = await initiateFunding(details);
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

  const inputStyle = [styles.input, {
    borderColor: colors.border, color: colors.textPrimary, backgroundColor: colors.surface,
  }];
  const fieldLabel = (label: string) => (
    <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing.md }]}>{label}</Text>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.backButton}>
          <Text style={[typography.bodyBold, { color: colors.primary }]}>← Back</Text>
        </Pressable>
      </View>

      {account ? (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={[typography.h1, { color: colors.textPrimary }]}>Your Funding Account</Text>
          <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.sm }]}>
            Transfer to this dedicated account number. Your wallet will be credited automatically after a successful transfer.
          </Text>
          <View style={[styles.accountCard, { backgroundColor: colors.primary }]}>
            <Text style={[typography.caption, { color: 'rgba(255,255,255,0.8)' }]}>Account Number</Text>
            <Text style={styles.accountNumber} numberOfLines={1} adjustsFontSizeToFit>{account.accountNumber}</Text>
            <Text style={[typography.body, { color: '#FFFFFF', marginTop: spacing.sm }]}>{account.bankName}</Text>
            <Text style={[typography.caption, { color: 'rgba(255,255,255,0.8)', marginTop: 2 }]}>{account.accountName}</Text>
          </View>
          <Button label="Copy Account Number" onPress={copyAccountNumber} variant="outline" style={{ marginTop: spacing.sm }} />
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={[typography.h1, { color: colors.textPrimary }]}>Fund Your Wallet</Text>
          <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.sm }]}>
            Squad requires your BVN and matching identity details to create a dedicated bank account. Your BVN is sent to Squad for verification and is not stored by FUBOOKS.
          </Text>

          {fieldLabel('First name (as registered with your BVN)')}
          <TextInput value={details.firstName} onChangeText={(v) => update('firstName', v)} autoCapitalize="words" placeholder="First name" placeholderTextColor={colors.textSecondary} style={inputStyle} />
          {fieldLabel('Last name (as registered with your BVN)')}
          <TextInput value={details.lastName} onChangeText={(v) => update('lastName', v)} autoCapitalize="words" placeholder="Last name" placeholderTextColor={colors.textSecondary} style={inputStyle} />
          {fieldLabel('Phone number')}
          <TextInput value={details.mobileNumber} onChangeText={(v) => update('mobileNumber', v.replace(/\D/g, '').slice(0, 11))} keyboardType="phone-pad" maxLength={11} placeholder="08012345678" placeholderTextColor={colors.textSecondary} style={inputStyle} />
          {fieldLabel('Date of birth (MM/DD/YYYY)')}
          <TextInput value={details.dateOfBirth} onChangeText={(v) => update('dateOfBirth', v.slice(0, 10))} keyboardType="numbers-and-punctuation" maxLength={10} placeholder="MM/DD/YYYY" placeholderTextColor={colors.textSecondary} style={inputStyle} />
          {fieldLabel('BVN')}
          <TextInput value={details.bvn} onChangeText={(v) => update('bvn', v.replace(/\D/g, '').slice(0, 11))} keyboardType="number-pad" maxLength={11} placeholder="Enter 11 digits" placeholderTextColor={colors.textSecondary} style={[inputStyle, { letterSpacing: 2 }]} />

          {fieldLabel('Gender (as registered with your BVN)')}
          <View style={styles.genderRow}>
            {([{ value: '1', label: 'Male' }, { value: '2', label: 'Female' }] as const).map((item) => {
              const selected = details.gender === item.value;
              return (
                <Pressable key={item.value} onPress={() => update('gender', item.value)} style={[styles.genderOption, { backgroundColor: selected ? colors.primary : colors.surface, borderColor: selected ? colors.primary : colors.border }]}>
                  <Text style={[typography.bodyBold, { color: selected ? '#FFFFFF' : colors.textSecondary }]}>{item.label}</Text>
                </Pressable>
              );
            })}
          </View>
          {fieldLabel('Residential address (as registered with your BVN)')}
          <TextInput value={details.address} onChangeText={(v) => update('address', v)} autoCapitalize="words" multiline placeholder="Street address" placeholderTextColor={colors.textSecondary} style={[inputStyle, styles.addressInput]} />
          <Text style={[typography.small, { color: colors.textSecondary, marginTop: spacing.sm }]}>
            Account creation requires the submitted details to match your BVN record. Only the last four BVN digits are retained for support.
          </Text>
          <Button label="Create Funding Account" onPress={handleSubmit} loading={submitting} disabled={
            !details.firstName.trim() || !details.lastName.trim() || details.mobileNumber.length !== 11 || details.dateOfBirth.length !== 10 || details.bvn.length !== 11 || !details.address.trim()
          } style={{ marginTop: spacing.xl }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.xs, paddingBottom: spacing.sm },
  backButton: { alignSelf: 'flex-start', paddingVertical: spacing.xs, paddingRight: spacing.md },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  input: { borderWidth: 1, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.md, marginTop: spacing.xs, fontSize: 16 },
  addressInput: { minHeight: 88, textAlignVertical: 'top' },
  genderRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  genderOption: { flex: 1, paddingVertical: spacing.md, borderRadius: radius.md, borderWidth: 1, alignItems: 'center' },
  accountCard: { borderRadius: radius.xl, padding: spacing.xl, marginVertical: spacing.xl },
  accountNumber: { color: '#FFFFFF', fontSize: 28, fontWeight: '700', letterSpacing: 2, marginTop: spacing.xs },
});
