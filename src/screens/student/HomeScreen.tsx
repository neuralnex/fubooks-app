import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';
import { spacing, radius, typography } from '../../theme/colors';
import { LevelSelector } from '../../components/LevelSelector';
import { BookCard } from '../../components/BookCard';
import { useBooks } from '../../hooks/useBooks';
import type { BookDTO, FutoLevel } from '../../sharedTypes';

interface HomeScreenProps {
  navigation: { navigate: (screen: string, params?: { book: BookDTO }) => void };
}

export function HomeScreen({ navigation }: HomeScreenProps) {
  const { colors } = useTheme();
  const [level, setLevel] = useState<FutoLevel>('L100');
  const [search, setSearch] = useState('');
  const { books, loading, loadingMore, loadMore, refresh } = useBooks(level, search || undefined);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      <View style={styles.header}>
        <Text style={[typography.h1, { color: colors.textPrimary }]}>FUBOOKS</Text>
        <Text style={[typography.body, { color: colors.textSecondary }]}>
          Find textbooks for your courses
        </Text>
        <TextInput
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={refresh}
          placeholder="Search by title, author, or course code"
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
              No books found for {level.replace('L', '')}L yet.
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
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  grid: { paddingHorizontal: spacing.sm, paddingBottom: spacing.xl },
});
