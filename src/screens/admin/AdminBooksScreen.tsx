import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  FlatList,
  Pressable,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useTheme } from '../../theme/ThemeContext';
import { spacing, radius, typography } from '../../theme/colors';
import { Button } from '../../components/Button';
import { apiClient, ApiClientError } from '../../services/apiClient';
import { useAdminGetToken } from '../../context/AdminAuthContext';
import { FUTO_LEVELS, FUTO_FACULTIES, type FutoLevel, type Faculty } from '../../sharedTypes';

interface AdminBookRow {
  id: string;
  title: string;
  author: string;
  courseCode: string;
  level: FutoLevel;
  faculty: Faculty;
  price: string;
  stock: number;
  imageUrl: string | null;
  isActive: boolean;
}

const EMPTY_FORM = {
  title: '',
  author: '',
  courseCode: '',
  level: 'L100' as FutoLevel,
  faculty: 'SICT' as Faculty,
  price: '',
  stock: '',
  imageUrl: '' as string | null,
};

export function AdminBooksScreen() {
  const { colors } = useTheme();
  const getToken = useAdminGetToken();
  const [books, setBooks] = useState<AdminBookRow[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const loadBooks = useCallback(async () => {
    const res = await apiClient.get<{ books: AdminBookRow[] }>('/api/v1/admin/books', getToken);
    setBooks(res.books);
  }, [getToken]);

  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow photo library access to add a cover image.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      // NOTE: in production this should upload to your object storage (S3/Cloudinary/etc)
      // and use the returned public URL here. For this scaffold we keep the local URI
      // as a placeholder integration point — swap in your upload service's response URL.
      setForm((f) => ({ ...f, imageUrl: result.assets[0].uri }));
    }
  };

  const handleSubmit = async () => {
    const price = Number(form.price);
    const stock = Number(form.stock);
    if (!form.title || !form.author || !form.courseCode || !price || Number.isNaN(stock)) {
      Alert.alert('Missing fields', 'Please fill in all required fields with valid values.');
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.post(
        '/api/v1/admin/books',
        {
          title: form.title,
          author: form.author,
          courseCode: form.courseCode,
          level: form.level,
          faculty: form.faculty,
          price,
          stock,
          imageUrl: form.imageUrl || undefined,
        },
        getToken
      );
      setForm(EMPTY_FORM);
      setShowForm(false);
      await loadBooks();
    } catch (err) {
      Alert.alert(
        'Could not create book',
        err instanceof ApiClientError ? err.message : 'Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      <View style={styles.headerRow}>
        <Text style={[typography.h1, { color: colors.textPrimary }]}>Catalog</Text>
        <Button
          label={showForm ? 'Cancel' : '+ Add Book'}
          onPress={() => setShowForm((s) => !s)}
          variant={showForm ? 'outline' : 'primary'}
          fullWidth={false}
        />
      </View>

      {showForm ? (
        <ScrollView contentContainerStyle={styles.formContent}>
          <Pressable
            onPress={pickImage}
            style={[
              styles.imagePicker,
              { borderColor: colors.border, backgroundColor: colors.surface },
            ]}
          >
            {form.imageUrl ? (
              <Image
                source={{ uri: form.imageUrl }}
                style={styles.pickedImage}
                contentFit="cover"
              />
            ) : (
              <Text style={{ color: colors.textSecondary }}>
                📷 Tap to add cover image (optional)
              </Text>
            )}
          </Pressable>

          <FormInput
            label="Title"
            value={form.title}
            onChange={(v) => setForm((f) => ({ ...f, title: v }))}
            colors={colors}
          />
          <FormInput
            label="Author"
            value={form.author}
            onChange={(v) => setForm((f) => ({ ...f, author: v }))}
            colors={colors}
          />
          <FormInput
            label="Course Code (e.g. MTH101)"
            value={form.courseCode}
            onChange={(v) => setForm((f) => ({ ...f, courseCode: v }))}
            colors={colors}
          />

          <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing.md }]}>
            Level
          </Text>
          <ChipRow
            items={FUTO_LEVELS}
            selected={form.level}
            onSelect={(v) => setForm((f) => ({ ...f, level: v }))}
            colors={colors}
            formatLabel={(l) => l.replace('L', '') + 'L'}
          />

          <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing.md }]}>
            Faculty
          </Text>
          <ChipRow
            items={FUTO_FACULTIES}
            selected={form.faculty}
            onSelect={(v) => setForm((f) => ({ ...f, faculty: v }))}
            colors={colors}
          />

          <FormInput
            label="Price (₦)"
            value={form.price}
            onChange={(v) => setForm((f) => ({ ...f, price: v.replace(/[^0-9.]/g, '') }))}
            keyboardType="decimal-pad"
            colors={colors}
          />
          <FormInput
            label="Stock"
            value={form.stock}
            onChange={(v) => setForm((f) => ({ ...f, stock: v.replace(/\D/g, '') }))}
            keyboardType="number-pad"
            colors={colors}
          />

          <Button
            label="Create Book"
            onPress={handleSubmit}
            loading={submitting}
            style={{ marginTop: spacing.xl }}
          />
        </ScrollView>
      ) : (
        <FlatList
          data={books}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View
              style={[styles.bookRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[typography.bodyBold, { color: colors.textPrimary }]}>
                  {item.title}
                </Text>
                <Text style={[typography.caption, { color: colors.textSecondary }]}>
                  {item.courseCode} · {item.level} · {item.faculty} · Stock: {item.stock}
                </Text>
              </View>
              <Text style={[typography.bodyBold, { color: colors.primary }]}>
                ₦{Number(item.price).toLocaleString('en-NG')}
              </Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

function FormInput({
  label,
  value,
  onChange,
  keyboardType,
  colors,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  keyboardType?: 'default' | 'decimal-pad' | 'number-pad';
  colors: { border: string; textPrimary: string; surface: string; textSecondary: string };
}) {
  return (
    <View style={{ marginTop: spacing.md }}>
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
          { borderColor: colors.border, color: colors.textPrimary, backgroundColor: colors.surface },
        ]}
      />
    </View>
  );
}

function ChipRow<T extends string>({
  items,
  selected,
  onSelect,
  colors,
  formatLabel,
}: {
  items: readonly T[];
  selected: T;
  onSelect: (v: T) => void;
  colors: { primary: string; surface: string; border: string; textSecondary: string };
  formatLabel?: (v: T) => string;
}) {
  return (
    <View style={styles.chipRow}>
      {items.map((item) => (
        <Pressable
          key={item}
          onPress={() => onSelect(item)}
          style={[
            styles.chip,
            {
              backgroundColor: selected === item ? colors.primary : colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <Text
            style={{
              color: selected === item ? '#FFFFFF' : colors.textSecondary,
              fontWeight: '600',
              fontSize: 12,
            }}
          >
            {formatLabel ? formatLabel(item) : item}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  formContent: { padding: spacing.lg },
  imagePicker: {
    height: 140,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  pickedImage: { width: '100%', height: '100%' },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.xs },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  list: { padding: spacing.lg },
  bookRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
});
