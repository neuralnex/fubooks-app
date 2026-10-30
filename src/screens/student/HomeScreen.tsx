import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';
import { spacing, radius, typography } from '../../theme/colors';
import { LevelSelector } from '../../components/LevelSelector';
import { BookCard } from '../../components/BookCard';
import { useBooks } from '../../hooks/useBooks';
import { useAuthToken } from '../../hooks/useAuthToken';
import type { BookDTO, FutoLevel } from '../../sharedTypes';

interface HomeScreenProps {
  navigation: { navigate: (screen: string, params?: { book: BookDTO }) => void };
}

export function HomeScreen({ navigation }: HomeScreenProps) {
  const { colors } = useTheme();
  const { getToken } = useAuthToken();
  const [level, setLevel] = useState<FutoLevel>('L100');
  const [search, setSearch] = useState('');
  const { books, loading, loadingMore, loadMore, refresh } = useBooks(
    level,
    search || undefined,
    getToken
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      <View style={styles.header}>
        <Text style={[typography.h1, { color: colors.textPrimary }]}>FUBOOKS</Text>
        <TextInput
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={refresh}
          placeholder="Search books"
          placeholderTextColor={colors.textSecondary}
          style={[
            styles.search,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              color: colors.textPrimary,
            },
          ]}
        />
      </View>

      <LevelSelector selected={level} onSelect={setLevel} />

      <FlatList
        data={books}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.columnWrapper}
        onEndReachedThreshold={0.4}
        onEndReached={loadMore}
        refreshing={loading}
        onRefresh={refresh}
        renderItem={({ item }) => (
          <BookCard book={item} onPress={() => navigation.navigate('BookDetail', { book: item })} />
        )}
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator style={{ marginVertical: spacing.lg }} color={colors.primary} />
          ) : null
        }
        ListEmptyComponent={
          !loading ? (
            <Text
              style={[
                typography.body,
                { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xxl },
              ]}
            >
              No books found.
            </Text>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  search: {
    marginTop: spacing.md,
    marginBottom: 0,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  grid: { paddingHorizontal: spacing.sm, paddingBottom: spacing.xxl },
  columnWrapper: { justifyContent: 'flex-start' },
});
