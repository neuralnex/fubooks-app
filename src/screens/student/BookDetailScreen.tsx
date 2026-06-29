import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useTheme } from '../../theme/ThemeContext';
import { spacing, radius, typography } from '../../theme/colors';
import { Button } from '../../components/Button';
import { useCheckout } from '../../hooks/useCheckout';
import { useProfile } from '../../hooks/useProfile';
import type { BookDTO, DeliveryDetailsDTO } from '../../sharedTypes';

interface BookDetailScreenProps {
  route: { params: { book: BookDTO } };
  navigation: { goBack: () => void; navigate: (screen: string) => void };
}

const EMPTY_DELIVERY: DeliveryDetailsDTO = {
  fullName: '',
  phoneNumber: '',
  hostelOrAddress: '',
  campusArea: '',
  alternatePhoneNumber: '',
};

export function BookDetailScreen({ route, navigation }: BookDetailScreenProps) {
  const { book } = route.params;
  const { colors } = useTheme();
  const { placeOrder, submitting } = useCheckout();
  const { getDeliveryDetails } = useProfile();
  const [delivery, setDelivery] = useState<DeliveryDetailsDTO>(EMPTY_DELIVERY);
  const [showCheckoutForm, setShowCheckoutForm] = useState(false);

  useEffect(() => {
    getDeliveryDetails().then((saved) => {
      if (saved) setDelivery(saved);
    });
  }, [getDeliveryDetails]);

  const validateDelivery = (): string | null => {
    if (!delivery.fullName.trim()) return 'Full name is required.';
    if (!/^(\+?234|0)[789][01]\d{8}$/.test(delivery.phoneNumber)) {
      return 'Enter a valid Nigerian phone number.';
    }
    if (!delivery.hostelOrAddress.trim() || delivery.hostelOrAddress.trim().length < 5) {
      return 'Please enter a hostel name or address.';
    }
    return null;
  };

  const handleBuy = async () => {
    const validationError = validateDelivery();
    if (validationError) {
      Alert.alert('Check your details', validationError);
      return;
    }

    const order = await placeOrder({ bookId: book.id, deliveryDetails: delivery });
    if (order) {
      Alert.alert('Purchase successful! 🎉', `${book.title} has been added to your library.`, [
        { text: 'OK', onPress: () => navigation.navigate('Library') },
      ]);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View
          style={[styles.imageWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          {book.imageUrl ? (
            <Image source={{ uri: book.imageUrl }} style={styles.image} contentFit="contain" />
          ) : (
            <Text style={{ fontSize: 64 }}>📘</Text>
          )}
        </View>

        <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing.lg }]}>
          {book.courseCode} · {book.level} · {book.faculty}
        </Text>
        <Text style={[typography.h1, { color: colors.textPrimary }]}>{book.title}</Text>
        <Text style={[typography.body, { color: colors.textSecondary }]}>{book.author}</Text>
        <Text style={[typography.h2, { color: colors.primary, marginTop: spacing.md }]}>
          ₦{Number(book.price).toLocaleString('en-NG')}
        </Text>
        <Text
          style={[
            typography.caption,
            { color: book.stock > 0 ? colors.success : colors.error, marginTop: spacing.xs },
          ]}
        >
          {book.stock > 0 ? `${book.stock} in stock` : 'Out of stock'}
        </Text>

        {!showCheckoutForm ? (
          <Button
            label={book.stock > 0 ? 'Buy Now' : 'Out of Stock'}
            onPress={() => setShowCheckoutForm(true)}
            disabled={book.stock <= 0}
            style={{ marginTop: spacing.xl }}
          />
        ) : (
          <View
            style={[styles.form, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <Text style={[typography.h3, { color: colors.textPrimary, marginBottom: spacing.sm }]}>
              Delivery Details
            </Text>

            <FormField
              label="Full Name"
              value={delivery.fullName}
              onChange={(v) => setDelivery((d) => ({ ...d, fullName: v }))}
              colors={colors}
            />
            <FormField
              label="Phone Number"
              value={delivery.phoneNumber}
              onChange={(v) => setDelivery((d) => ({ ...d, phoneNumber: v }))}
              keyboardType="phone-pad"
              colors={colors}
            />
            <FormField
              label="Hostel / Address"
              value={delivery.hostelOrAddress}
              onChange={(v) => setDelivery((d) => ({ ...d, hostelOrAddress: v }))}
              colors={colors}
            />
            <FormField
              label="Campus Area (optional)"
              value={delivery.campusArea ?? ''}
              onChange={(v) => setDelivery((d) => ({ ...d, campusArea: v }))}
              colors={colors}
            />

            <Button
              label={`Pay ₦${Number(book.price).toLocaleString('en-NG')}`}
              onPress={handleBuy}
              loading={submitting}
              style={{ marginTop: spacing.lg }}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function FormField({
  label,
  value,
  onChange,
  keyboardType,
  colors,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  keyboardType?: 'default' | 'phone-pad';
  colors: { border: string; textPrimary: string; background: string; textSecondary: string };
}) {
  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text
        style={[typography.caption, { color: colors.textSecondary, marginBottom: spacing.xs }]}
      >
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        keyboardType={keyboardType ?? 'default'}
        placeholderTextColor={colors.textSecondary}
        style={[
          styles.input,
          {
            borderColor: colors.border,
            color: colors.textPrimary,
            backgroundColor: colors.background,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.lg },
  imageWrap: {
    width: '100%',
    height: 220,
    borderRadius: radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: { width: '100%', height: '100%' },
  form: {
    marginTop: spacing.xl,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
});
