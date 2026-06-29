import React from 'react';
import { ScrollView, Pressable, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { radius, spacing, typography } from '../theme/colors';
import { FUTO_LEVELS, type FutoLevel } from '../sharedTypes';

interface LevelSelectorProps {
  selected: FutoLevel;
  onSelect: (level: FutoLevel) => void;
}

/**
 * Horizontal swipeable category bar across all FUTO academic levels (100L–600L),
 * covering both the standard 5-year engineering tracks and 6-year professional
 * programs (per spec).
 */
export function LevelSelector({ selected, onSelect }: LevelSelectorProps) {
  const { colors } = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {FUTO_LEVELS.map((level) => {
        const isActive = level === selected;
        const label = level.replace('L', '') + 'L';
        return (
          <Pressable
            key={level}
            onPress={() => onSelect(level)}
            style={[
              styles.pill,
              {
                backgroundColor: isActive ? colors.primary : colors.surface,
                borderColor: isActive ? colors.primary : colors.border,
              },
            ]}
          >
            <Text
              style={[typography.bodyBold, { color: isActive ? '#FFFFFF' : colors.textSecondary }]}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  pill: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
  },
});
