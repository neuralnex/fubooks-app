import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, StyleSheet, View } from 'react-native';
import LottieView from 'lottie-react-native';

interface LottieIllustrationProps {
  source: React.ComponentProps<typeof LottieView>['source'];
  size: number;
  label: string;
  loop?: boolean;
}

/** Locally bundled illustration; pauses automatically when reduced motion is enabled. */
export function LottieIllustration({ source, size, label, loop = false }: LottieIllustrationProps) {
  const [reduceMotion, setReduceMotion] = useState<boolean | null>(null);
  const animationRef = useRef<LottieView>(null);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => { if (mounted) setReduceMotion(enabled); })
      .catch(() => { if (mounted) setReduceMotion(false); });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (reduceMotion === true) animationRef.current?.pause();
    if (reduceMotion === false) animationRef.current?.play();
  }, [reduceMotion]);

  return (
    <View style={[styles.frame, { width: size, height: size }]} accessible accessibilityRole="image" accessibilityLabel={label}>
      {reduceMotion === null ? null : (
        <LottieView
          ref={animationRef}
          source={source}
          autoPlay={reduceMotion === false}
          loop={loop && !reduceMotion}
          progress={reduceMotion ? 1 : undefined}
          resizeMode="contain"
          style={StyleSheet.absoluteFill}
          cacheComposition
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { alignItems: 'center', justifyContent: 'center' },
});
