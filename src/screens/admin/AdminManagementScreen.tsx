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
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';
import { spacing, radius, typography } from '../../theme/colors';
import { Button } from '../../components/Button';
import { apiClient, ApiClientError } from '../../services/apiClient';
import { useAdminAuth, useAdminGetToken } from '../../context/AdminAuthContext';
import { ADMIN_ROLES, type AdminDTO, type AdminRole, type AdminAccessLevel } from '../../sharedTypes';

const ACCESS_LEVELS: AdminAccessLevel[] = ['FULL', 'CATALOG_ONLY', 'ORDERS_ONLY', 'READ_ONLY'];

const EMPTY_FORM = {
  email: '',
  password: '',
  fullName: '',
  role: 'ADMIN' as AdminRole,
  accessLevel: 'READ_ONLY' as AdminAccessLevel,
};

/**
 * Only a SUPER_ADMIN sees a functional version of this screen — per spec, "admin
 * will only create other admins and handle their access levels." The backend
 * enforces this independently (requireSuperAdmin middleware); this client-side
 * check is purely a UX nicety to avoid showing a form that would just 403.
 */
export function AdminManagementScreen() {
  const { colors } = useTheme();
  const { admin } = useAdminAuth();
  const getToken = useAdminGetToken();
  const [admins, setAdmins] = useState<AdminDTO[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const isSuperAdmin = admin?.role === 'SUPER_ADMIN';

  const loadAdmins = useCallback(async () => {
    if (!isSuperAdmin) return;
    const res = await apiClient.get<{ admins: AdminDTO[] }>('/api/v1/admin/admins', getToken);
    setAdmins(res.admins);
  }, [getToken, isSuperAdmin]);

  useEffect(() => {
    loadAdmins();
  }, [loadAdmins]);

  if (!isSuperAdmin) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.content}>
          <Text style={[typography.h2, { color: colors.textPrimary }]}>Admin Management</Text>
          <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.sm }]}>
            Only super admins can create or manage other admin accounts.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleCreate = async () => {
    if (!form.email || !form.fullName || form.password.length < 12) {
      Alert.alert(
        'Check the form',
        'Password must be at least 12 characters, and all fields are required.'
      );
      return;
    }
    setSubmitting(true);
    try {
      await apiClient.post('/api/v1/admin/admins', form, getToken);
      setForm(EMPTY_FORM);
      setShowForm(false);
      await loadAdmins();
    } catch (err) {
      Alert.alert(
        'Could not create admin',
        err instanceof ApiClientError ? err.message : 'Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (target: AdminDTO) => {
    try {
      await apiClient.patch(
        `/api/v1/admin/admins/${target.id}`,
        { isActive: !target.isActive },
        getToken
      );
      await loadAdmins();
    } catch (err) {
      Alert.alert('Update failed', err instanceof ApiClientError ? err.message : 'Please try again.');
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      <View style={styles.headerRow}>
        <Text style={[typography.h1, { color: colors.textPrimary }]}>Admins</Text>
        <Button
          label={showForm ? 'Cancel' : '+ New Admin'}
          onPress={() => setShowForm((s) => !s)}
          variant={showForm ? 'outline' : 'primary'}
          fullWidth={false}
        />
      </View>

      {showForm ? (
        <ScrollView contentContainerStyle={styles.content}>
          <FormField
            label="Full Name"
            value={form.fullName}
            onChange={(v) => setForm((f) => ({ ...f, fullName: v }))}
            colors={colors}
          />
          <FormField
            label="Email"
            value={form.email}
            onChange={(v) => setForm((f) => ({ ...f, email: v }))}
            keyboardType="email-address"
            colors={colors}
          />
          <FormField
            label="Temporary Password (min 12 chars)"
            value={form.password}
            onChange={(v) => setForm((f) => ({ ...f, password: v }))}
            secureTextEntry
            colors={colors}
          />

          <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing.md }]}>
            Role
          </Text>
          <View style={styles.chipRow}>
            {ADMIN_ROLES.map((r) => (
              <Pressable
                key={r}
                onPress={() => setForm((f) => ({ ...f, role: r }))}
                style={[
                  styles.chip,
                  {
                    backgroundColor: form.role === r ? colors.primary : colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text
                  style={{
                    color: form.role === r ? '#FFFFFF' : colors.textSecondary,
                    fontSize: 12,
                    fontWeight: '600',
                  }}
                >
                  {r.replace('_', ' ')}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing.md }]}>
            Access Level
          </Text>
          <View style={styles.chipRow}>
            {ACCESS_LEVELS.map((lvl) => (
              <Pressable
                key={lvl}
                onPress={() => setForm((f) => ({ ...f, accessLevel: lvl }))}
                style={[
                  styles.chip,
                  {
                    backgroundColor: form.accessLevel === lvl ? colors.primary : colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text
                  style={{
                    color: form.accessLevel === lvl ? '#FFFFFF' : colors.textSecondary,
                    fontSize: 12,
                    fontWeight: '600',
                  }}
                >
                  {lvl.replace('_', ' ')}
                </Text>
              </Pressable>
            ))}
          </View>

          <Button
            label="Create Admin"
            onPress={handleCreate}
            loading={submitting}
            style={{ marginTop: spacing.xl }}
          />
        </ScrollView>
      ) : (
        <FlatList
          data={admins}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.content}
          renderItem={({ item }) => (
            <View
              style={[styles.adminRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[typography.bodyBold, { color: colors.textPrimary }]}>
                  {item.fullName}
                </Text>
                <Text style={[typography.caption, { color: colors.textSecondary }]}>
                  {item.email}
                </Text>
                <Text style={[typography.small, { color: colors.primary, marginTop: 2 }]}>
                  {item.role.replace('_', ' ')} · {item.accessLevel.replace('_', ' ')}
                </Text>
              </View>
              {item.id !== admin?.id && (
                <Switch
                  value={item.isActive}
                  onValueChange={() => toggleActive(item)}
                  trackColor={{ false: colors.disabled, true: colors.primary }}
                />
              )}
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

function FormField({
  label,
  value,
  onChange,
  keyboardType,
  secureTextEntry,
  colors,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  keyboardType?: 'default' | 'email-address';
  secureTextEntry?: boolean;
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
        secureTextEntry={secureTextEntry}
        autoCapitalize="none"
        placeholderTextColor={colors.textSecondary}
        style={[
          styles.input,
          { borderColor: colors.border, color: colors.textPrimary, backgroundColor: colors.surface },
        ]}
      />
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
  content: { padding: spacing.lg },
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
  adminRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
});
