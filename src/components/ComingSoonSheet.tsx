import React, { useEffect, useRef } from 'react';
import { Modal, View, Text, Pressable, StyleSheet, Animated, Dimensions } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { radius, spacing, typography } from '../theme/colors';

interface ComingSoonSheetProps {
  visible: boolean;
  onClose: () => void;
}

const SCREEN_HEIGHT = Dimensions.get('window').height;

/**
 * "Withdraw Funds" teaser bottom sheet. Tapping the (visually disabled) withdraw
 * button NEVER calls an API or navigates to a payout form — it only opens this
 * sheet, animated up from the bottom with a spring, themed in brand colors.
 */
export function ComingSoonSheet({ visible, onClose }: ComingSoonSheetProps) {
  const { colors } = useTheme();
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          damping: 18,
          stiffness: 180,
          mass: 0.9,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      translateY.setValue(SCREEN_HEIGHT);
      backdropOpacity.setValue(0);
    }
  }, [visible, translateY, backdropOpacity]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start(() => onClose());
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      <Animated.View
        style={[styles.backdrop, { opacity: backdropOpacity, backgroundColor: colors.overlay }]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
      </Animated.View>

      <Animated.View
        style={[styles.sheet, { backgroundColor: colors.surface, transform: [{ translateY }] }]}
      >
        <View style={[styles.handle, { backgroundColor: colors.border }]} />

        <View style={[styles.iconCircle, { backgroundColor: colors.primary + '1A' }]}>
          <Text style={styles.iconEmoji}>🚀</Text>
        </View>

        <Text style={[typography.h2, { color: colors.textPrimary, textAlign: 'center' }]}>
          Bank Withdrawals Coming Soon!
        </Text>

        <Text
          style={[
            typography.body,
            { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm },
          ]}
        >
          We are currently finalizing clearing integrations with our banking networks. You will
          soon be able to withdraw left-over wallet funds directly to your personal Nigerian bank
          account (GTB, Kuda, Access, etc.).
        </Text>

        <Pressable
          onPress={handleClose}
          style={[styles.gotItButton, { backgroundColor: colors.primary }]}
        >
          <Text style={[typography.bodyBold, { color: '#FFFFFF' }]}>Got it</Text>
        </Pressable>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    alignItems: 'center',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: radius.full,
    marginBottom: spacing.lg,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  iconEmoji: {
    fontSize: 28,
  },
  gotItButton: {
    marginTop: spacing.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    borderRadius: radius.md,
    width: '100%',
    alignItems: 'center',
  },
});
