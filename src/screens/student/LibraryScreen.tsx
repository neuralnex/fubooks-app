import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';
import { spacing, typography } from '../../theme/colors';
import { BookCard } from '../../components/BookCard';
import { apiClient, ApiClientError } from '../../services/apiClient';
import { useAuthToken } from '../../hooks/useAuthToken';
import type { BookDTO } from '../../sharedTypes';

interface LibraryBook extends BookDTO {
  purchasedAt: string;
  pricePaid: string;
}

export function LibraryScreen() {
  const { colors } = useTheme();
  const { getToken } = useAuthToken();
  const [books, setBooks] = useState<LibraryBook[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<{ books: LibraryBook[] }>('/api/v1/library', getToken);
      setBooks(res.books);
    } catch (err) {
      // Silent fail with empty state; ApiClientError already surfaces a readable message
      // if we wanted to show a toast here.
      if (!(err instanceof ApiClientError)) throw err;
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      <Text style={[typography.h1, { color: colors.textPrimary, margin: spacing.lg }]}>
        My Library
      </Text>
      <FlatList
        data={books}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.grid}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.primary} />
        }
        renderItem={({ item }) => <BookCard book={item} onPress={() => {}} owned />}
        ListEmptyComponent={
          !loading ? (
            <Text
              style={[
                typography.body,
                { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xxl },
              ]}
            >
              You haven't purchased any books yet. Browse the catalog to get started!
            </Text>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  grid: { paddingHorizontal: spacing.sm, paddingBottom: spacing.xl },
});
