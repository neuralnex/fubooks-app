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
  const { items, add, decrement, remove } = useCart();
  const subtotal = items.reduce((sum, item) => sum + Number(item.book.price) * item.quantity, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.book.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={<Text style={[typography.h1, { color: colors.textPrimary, marginBottom: spacing.lg }]}>Your Cart</Text>}
        renderItem={({ item }) => <CartRow book={item.book} quantity={item.quantity} onAdd={() => add(item.book)} onDecrement={() => decrement(item.book.id)} onRemove={() => remove(item.book.id)} />}
        ListEmptyComponent={(
          <View style={styles.empty}>
            <LottieIllustration source={require('../../../assets/animations/cart-empty.json')} size={184} label="Two books floating above a soft shadow" loop />
            <Text style={[typography.h2, { color: colors.textPrimary }]}>Your cart is empty</Text>
            <Button label="Browse books" onPress={() => navigation.navigate('HomeTab')} style={{ marginTop: spacing.lg, minWidth: 180 }} />
          </View>
        )}
        ListFooterComponent={items.length ? (
          <View style={[styles.summary, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.totalRow}>
              <Text style={[typography.body, { color: colors.textSecondary }]}>Books ({itemCount})</Text>
              <Text style={[typography.bodyBold, { color: colors.textPrimary }]}>₦{subtotal.toLocaleString('en-NG')}</Text>
            </View>
            <Button label="Continue to checkout" onPress={() => navigation.navigate('Checkout')} style={{ marginTop: spacing.lg }} />
          </View>
        ) : null}
      />
    </SafeAreaView>
  );
}

function CartRow({ book, quantity, onAdd, onDecrement, onRemove }: { book: BookDTO; quantity: number; onAdd: () => void; onDecrement: () => void; onRemove: () => void }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {book.imageUrl ? <Image source={{ uri: book.imageUrl }} style={styles.cover} contentFit="cover" /> : <View style={[styles.cover, styles.coverFallback, { backgroundColor: colors.background }]}><Text>📘</Text></View>}
      <View style={styles.details}>
        <Text style={[typography.caption, { color: colors.textSecondary }]}>{book.courseCode} · {book.level}</Text>
        <Text numberOfLines={2} style={[typography.bodyBold, { color: colors.textPrimary, marginTop: 2 }]}>{book.title}</Text>
        <Text style={[typography.bodyBold, { color: colors.primary, marginTop: spacing.xs }]}>₦{(Number(book.price) * quantity).toLocaleString('en-NG')}</Text>
        <View style={styles.quantity}>
          <Pressable accessibilityRole="button" accessibilityLabel={`Remove one ${book.title}`} onPress={onDecrement} style={[styles.quantityButton, { borderColor: colors.border }]}><Text style={{ color: colors.textPrimary }}>−</Text></Pressable>
          <Text style={[typography.bodyBold, { color: colors.textPrimary, minWidth: 24, textAlign: 'center' }]}>{quantity}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel={`Add one ${book.title}`} onPress={onAdd} disabled={quantity >= book.stock} style={[styles.quantityButton, { borderColor: colors.border, opacity: quantity >= book.stock ? 0.4 : 1 }]}><Text style={{ color: colors.textPrimary }}>+</Text></Pressable>
        </View>
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
  quantity: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
  quantityButton: { width: 30, height: 30, borderWidth: 1, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  summary: { padding: spacing.lg, borderWidth: 1, borderRadius: radius.lg, marginTop: spacing.md },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between' },
  empty: { flex: 1, minHeight: 300, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
});
