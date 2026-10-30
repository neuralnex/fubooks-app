import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useTheme } from '../../theme/ThemeContext';
import { spacing, radius, typography } from '../../theme/colors';
import { Button } from '../../components/Button';
import { useCart } from '../../hooks/useCart';
import type { BookDTO } from '../../sharedTypes';

interface BookDetailScreenProps {
  route: { params: { book: BookDTO } };
  navigation: { goBack: () => void; navigate: (screen: string) => void };
}

export function BookDetailScreen({ route, navigation }: BookDetailScreenProps) {
  const { book } = route.params;
  const { colors } = useTheme();
  const { items, add } = useCart();
  const [added, setAdded] = useState(false);
  const inCart = items.some((item) => item.id === book.id);

  const addBook = () => {
    if (book.stock <= 0) return;
    add(book);
    setAdded(true);
    Alert.alert('Added to cart', `${book.title} is ready for checkout.`);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.backButton}>
          <Text style={[typography.bodyBold, { color: colors.primary }]}>← Back</Text>
        </Pressable>
        <Pressable onPress={() => navigation.navigate('CartTab')} hitSlop={12} style={styles.backButton}>
          <Text style={[typography.bodyBold, { color: colors.primary }]}>Cart ({items.length})</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.imageWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {book.imageUrl ? <Image source={{ uri: book.imageUrl }} style={styles.image} contentFit="contain" /> : <Text style={{ fontSize: 64 }}>📘</Text>}
        </View>
        <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing.lg }]}>{book.courseCode} · {book.level} · {book.faculty}</Text>
        <Text style={[typography.h1, { color: colors.textPrimary }]}>{book.title}</Text>
        <Text style={[typography.body, { color: colors.textSecondary }]}>{book.author}</Text>
        <Text style={[typography.h2, { color: colors.primary, marginTop: spacing.md }]}>₦{Number(book.price).toLocaleString('en-NG')}</Text>
        <Text style={[typography.caption, { color: book.stock > 0 ? colors.success : colors.error, marginTop: spacing.xs }]}>{book.stock > 0 ? `${book.stock} in stock` : 'Out of stock'}</Text>
        <Button
          label={book.stock <= 0 ? 'Out of stock' : inCart || added ? 'Already in cart' : 'Add to cart'}
          onPress={addBook}
          disabled={book.stock <= 0 || inCart || added}
          style={{ marginTop: spacing.xl }}
        />
        {(inCart || added) ? <Button label="Go to cart" onPress={() => navigation.navigate('CartTab')} variant="outline" style={{ marginTop: spacing.sm }} /> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.xs, paddingBottom: spacing.sm, flexDirection: 'row', justifyContent: 'space-between' },
  backButton: { alignSelf: 'flex-start', paddingVertical: spacing.xs, paddingRight: spacing.md, minHeight: 40, justifyContent: 'center' },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  imageWrap: { width: '100%', height: 220, borderRadius: radius.lg, borderWidth: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  image: { width: '100%', height: '100%' },
});
