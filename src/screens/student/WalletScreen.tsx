import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';
import { radius, spacing, typography } from '../../theme/colors';
import { useWallet } from '../../hooks/useWallet';
import { ComingSoonSheet } from '../../components/ComingSoonSheet';
import { Button } from '../../components/Button';

const SOURCE_LABELS: Record<string, string> = {
  MONNIFY_DEPOSIT: 'Wallet funding',
  BOOK_PURCHASE: 'Book purchase',
  REFUND: 'Refund',
  ADMIN_ADJUSTMENT: 'Adjustment',
};

export function WalletScreen({
  navigation,
}: {
  navigation: { navigate: (screen: string) => void };
}) {
  const { colors } = useTheme();
  const { wallet, transactions, loading, refresh } = useWallet();
  const [showComingSoon, setShowComingSoon] = useState(false);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.primary} />
        }
        ListHeaderComponent={
          <View>
            <Text style={[typography.h1, { color: colors.textPrimary, marginBottom: spacing.lg }]}>
              My Wallet
            </Text>

            {/* Balance card */}
            <View style={[styles.balanceCard, { backgroundColor: colors.primary }]}>
              <Text style={[typography.caption, { color: 'rgba(255,255,255,0.8)' }]}>
                Available Balance
              </Text>
              {loading && !wallet ? (
                <ActivityIndicator color="#FFFFFF" style={{ marginTop: spacing.sm }} />
              ) : (
                <Text style={styles.balanceAmount}>
                  ₦
                  {Number(wallet?.balance ?? 0).toLocaleString('en-NG', {
                    minimumFractionDigits: 2,
                  })}
                </Text>
              )}

              <View style={styles.actionsRow}>
                <Button
                  label="Fund Wallet"
                  onPress={() => navigation.navigate('FundWallet')}
                  variant="primary"
                  style={styles.actionButton}
                />
                {/* "Withdraw Funds" — visually disabled teaser. Tapping NEVER calls an
                    API or navigates to a payout form; it only opens the Coming Soon sheet. */}
                <Pressable
                  onPress={() => setShowComingSoon(true)}
                  style={[styles.actionButton, styles.withdrawButton]}
                >
                  <Text style={styles.withdrawText}>🔒 Withdraw Funds</Text>
                </Pressable>
              </View>
            </View>

            <Text
              style={[
                typography.h3,
                { color: colors.textPrimary, marginTop: spacing.xl, marginBottom: spacing.sm },
              ]}
            >
              Recent Activity
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const isCredit = item.type === 'CREDIT';
          return (
            <View style={[styles.txRow, { borderBottomColor: colors.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={[typography.bodyBold, { color: colors.textPrimary }]}>
                  {item.description || SOURCE_LABELS[item.source] || item.source}
                </Text>
                <Text style={[typography.caption, { color: colors.textSecondary }]}>
                  {new Date(item.createdAt).toLocaleDateString('en-NG', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
              <Text
                style={[typography.bodyBold, { color: isCredit ? colors.success : colors.error }]}
              >
                {isCredit ? '+' : '-'}₦{Number(item.amount).toLocaleString('en-NG')}
              </Text>
            </View>
          );
        }}
        ListEmptyComponent={
          !loading ? (
            <Text
              style={[
                typography.body,
                { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xl },
              ]}
            >
              No transactions yet. Fund your wallet to get started!
            </Text>
          ) : null
        }
        contentContainerStyle={styles.listContent}
      />

      <ComingSoonSheet visible={showComingSoon} onClose={() => setShowComingSoon(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { padding: spacing.lg },
  balanceCard: {
    borderRadius: radius.xl,
    padding: spacing.xl,
  },
  balanceAmount: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  actionButton: {
    flex: 1,
  },
  withdrawButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.15)',
    opacity: 0.6,
  },
  withdrawText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  txRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
});
