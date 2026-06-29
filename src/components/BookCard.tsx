import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useTheme } from '../theme/ThemeContext';
import { radius, spacing, typography } from '../theme/colors';
import type { BookDTO } from '../sharedTypes';

interface BookCardProps {
  book: BookDTO;
  onPress: () => void;
  owned?: boolean;
}

/**
 * "Smart Image Fallback": if book.imageUrl is null/undefined, we render a local
 * vector placeholder (BookPlaceholder, built purely from theme tokens below)
 * instead of ever persisting a placeholder string in the database. The book's
 * course code is shown on the placeholder for a bit of visual distinction
 * between books that don't have real cover art yet.
 */
function BookPlaceholder({ courseCode }: { courseCode: string }) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.placeholder,
        { backgroundColor: colors.primary + '1A', borderColor: colors.border },
      ]}
    >
      <Text style={[typography.h2, { color: colors.primary }]}>📘</Text>
      <Text style={[typography.small, { color: colors.primary, marginTop: spacing.xs }]}>
        {courseCode}
      </Text>
      <Text style={[styles.placeholderLabel, { color: colors.textSecondary }]}>
        FUTO Book Placeholder
      </Text>
    </View>
  );
}

export function BookCard({ book, onPress, owned }: BookCardProps) {
  const { colors } = useTheme();
  const outOfStock = book.stock <= 0;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.9 : 1 },
      ]}
    >
      <View style={styles.imageWrap}>
        {book.imageUrl ? (
          <Image
            source={{ uri: book.imageUrl }}
            style={styles.image}
            contentFit="cover"
            transition={150}
          />
        ) : (
          <BookPlaceholder courseCode={book.courseCode} />
        )}
        {owned && (
          <View style={[styles.badge, { backgroundColor: colors.success }]}>
            <Text style={styles.badgeText}>Owned</Text>
          </View>
        )}
        {!owned && outOfStock && (
          <View style={[styles.badge, { backgroundColor: colors.error }]}>
            <Text style={styles.badgeText}>Out of stock</Text>
          </View>
        )}
      </View>

      <View style={styles.info}>
        <Text style={[typography.caption, { color: colors.textSecondary }]}>
          {book.courseCode} · {book.level}
        </Text>
        <Text style={[typography.bodyBold, { color: colors.textPrimary }]} numberOfLines={2}>
          {book.title}
        </Text>
        <Text style={[typography.caption, { color: colors.textSecondary }]} numberOfLines={1}>
          {book.author}
        </Text>
        <Text style={[typography.bodyBold, { color: colors.primary, marginTop: spacing.xs }]}>
          ₦{Number(book.price).toLocaleString('en-NG')}
        </Text>
      </View>
    </Pressable>
  );
}

const CARD_RADIUS = radius.lg;

const styles = StyleSheet.create({
  card: {
    flex: 1,
    margin: spacing.sm,
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
    overflow: 'hidden',
  },
  imageWrap: {
    width: '100%',
    aspectRatio: 3 / 4,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderLabel: {
    fontSize: 9,
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: spacing.sm,
  },
  badge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  info: {
    padding: spacing.sm,
    gap: 2,
  },
});
