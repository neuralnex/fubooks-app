/*
 * CART EMPTY-STATE STORYBOARD
 * The cart heading and book list remain immediately usable.
 * 0ms  empty-cart illustration appears in place; the books bob gently when motion is allowed.
 * Reduced-motion setting  the illustration holds on its final frame.
 */
import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';
import { radius, spacing, typography } from '../../theme/colors';
import { Button } from '../../components/Button';
import { LottieIllustration } from '../../components/LottieIllustration';
import { useCart } from '../../hooks/useCart';
import type { BookDTO } from '../../sharedTypes';

interface CartScreenProps {
  navigation: { navigate: (screen: string) => void };
}

export function CartScreen({ navigation }: CartScreenProps) {
  const { colors } = useTheme();
  const { items, remove } = useCart();
  const subtotal = items.reduce((sum, book) => sum + Number(book.price), 0);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={<Text style={[typography.h1, { color: colors.textPrimary, marginBottom: spacing.lg }]}>Your Cart</Text>}
        renderItem={({ item }) => <CartRow book={item} onRemove={() => remove(item.id)} />}
        ListEmptyComponent={(
          <View style={styles.empty}>
            <LottieIllustration source={require('../../../assets/animations/cart-empty.json')} size={184} label="Two books floating above a soft shadow" loop />
            <Text style={[typography.h2, { color: colors.textPrimary }]}>Your cart is empty</Text>
            <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.sm, textAlign: 'center' }]}>Browse the catalog and add the books you need.</Text>
            <Button label="Browse books" onPress={() => navigation.navigate('HomeTab')} style={{ marginTop: spacing.lg, minWidth: 180 }} />
          </View>
        )}
        ListFooterComponent={items.length ? (
          <View style={[styles.summary, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.totalRow}>
              <Text style={[typography.body, { color: colors.textSecondary }]}>Books ({items.length})</Text>
              <Text style={[typography.bodyBold, { color: colors.textPrimary }]}>₦{subtotal.toLocaleString('en-NG')}</Text>
            </View>
            <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing.sm }]}>Choose pickup or ₦500 delivery at checkout.</Text>
            <Button label="Continue to checkout" onPress={() => navigation.navigate('Checkout')} style={{ marginTop: spacing.lg }} />
          </View>
        ) : null}
      />
    </SafeAreaView>
  );
}

function CartRow({ book, onRemove }: { book: BookDTO; onRemove: () => void }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {book.imageUrl ? <Image source={{ uri: book.imageUrl }} style={styles.cover} contentFit="cover" /> : <View style={[styles.cover, styles.coverFallback, { backgroundColor: colors.background }]}><Text>📘</Text></View>}
      <View style={styles.details}>
        <Text style={[typography.caption, { color: colors.textSecondary }]}>{book.courseCode} · {book.level}</Text>
        <Text numberOfLines={2} style={[typography.bodyBold, { color: colors.textPrimary, marginTop: 2 }]}>{book.title}</Text>
        <Text style={[typography.bodyBold, { color: colors.primary, marginTop: spacing.xs }]}>₦{Number(book.price).toLocaleString('en-NG')}</Text>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${book.title} from cart`} onPress={onRemove} hitSlop={10} style={styles.remove}>
        <Text style={[typography.caption, { color: colors.error }]}>Remove</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: spacing.lg, paddingBottom: spacing.xxl, flexGrow: 1 },
  row: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderWidth: 1, borderRadius: radius.lg, marginBottom: spacing.sm, gap: spacing.md },
  cover: { width: 56, height: 72, borderRadius: radius.sm },
  coverFallback: { alignItems: 'center', justifyContent: 'center' },
  details: { flex: 1 },
  remove: { minHeight: 40, justifyContent: 'center', paddingHorizontal: spacing.xs },
  summary: { padding: spacing.lg, borderWidth: 1, borderRadius: radius.lg, marginTop: spacing.md },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between' },
  empty: { flex: 1, minHeight: 300, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
});
