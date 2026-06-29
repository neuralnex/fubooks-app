import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { spacing, radius, typography } from '../theme/colors';
import { Button } from '../components/Button';
import { useProfile } from '../hooks/useProfile';
import { useAuthToken } from '../hooks/useAuthToken';
import { FUTO_LEVELS, FUTO_FACULTIES, type FutoLevel, type Faculty } from '../sharedTypes';

export function ProfileScreen() {
  const { colors, mode, toggle } = useTheme();
  const { profile, updateProfile } = useProfile();
  const { logout } = useAuthToken();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [matricNumber, setMatricNumber] = useState('');
  const [level, setLevel] = useState<FutoLevel | undefined>(undefined);
  const [faculty, setFaculty] = useState<Faculty | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName ?? '');
      setEmail(profile.email ?? '');
      setMatricNumber(profile.matricNumber ?? '');
      setLevel(profile.level ?? undefined);
      setFaculty(profile.faculty ?? undefined);
    }
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({ fullName, email, matricNumber, level, faculty });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[typography.h1, { color: colors.textPrimary }]}>My Profile</Text>

        <Field label="Full Name" value={fullName} onChange={setFullName} colors={colors} />
        <Field
          label="Email"
          value={email}
          onChange={setEmail}
          keyboardType="email-address"
          colors={colors}
        />
        <Field
          label="Matric Number"
          value={matricNumber}
          onChange={setMatricNumber}
          colors={colors}
        />

        <Text
          style={[
            typography.caption,
            { color: colors.textSecondary, marginTop: spacing.md, marginBottom: spacing.xs },
          ]}
        >
          Level
        </Text>
        <View style={styles.chipRow}>
          {FUTO_LEVELS.map((l) => (
            <Pressable
              key={l}
              onPress={() => setLevel(l)}
              style={[
                styles.chip,
                {
                  backgroundColor: level === l ? colors.primary : colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text
                style={{ color: level === l ? '#FFFFFF' : colors.textSecondary, fontWeight: '600' }}
              >
                {l.replace('L', '')}L
              </Text>
            </Pressable>
          ))}
        </View>

        <Text
          style={[
            typography.caption,
            { color: colors.textSecondary, marginTop: spacing.md, marginBottom: spacing.xs },
          ]}
        >
          Faculty
        </Text>
        <View style={styles.chipRow}>
          {FUTO_FACULTIES.map((f) => (
            <Pressable
              key={f}
              onPress={() => setFaculty(f)}
              style={[
                styles.chip,
                {
                  backgroundColor: faculty === f ? colors.primary : colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text
                style={{ color: faculty === f ? '#FFFFFF' : colors.textSecondary, fontWeight: '600' }}
              >
                {f}
              </Text>
            </Pressable>
          ))}
        </View>

        <Button
          label="Save Changes"
          onPress={handleSave}
          loading={saving}
          style={{ marginTop: spacing.xl }}
        />

        <Pressable onPress={toggle} style={styles.themeToggle}>
          <Text style={[typography.body, { color: colors.textSecondary }]}>
            Switch to {mode === 'dark' ? 'Light' : 'Dark'} Mode
          </Text>
        </Pressable>

        <Button label="Log Out" onPress={logout} variant="outline" style={{ marginTop: spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({
  label,
  value,
  onChange,
  keyboardType,
  colors,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  keyboardType?: 'default' | 'email-address';
  colors: { border: string; textPrimary: string; surface: string; textSecondary: string };
}) {
  return (
    <View style={{ marginTop: spacing.lg }}>
      <Text
        style={[typography.caption, { color: colors.textSecondary, marginBottom: spacing.xs }]}
      >
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        keyboardType={keyboardType ?? 'default'}
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
  content: { padding: spacing.lg },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  themeToggle: { marginTop: spacing.xl, alignItems: 'center' },
});
