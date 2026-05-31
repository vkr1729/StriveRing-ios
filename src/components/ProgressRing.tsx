import { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Line, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
} from 'react-native-reanimated';
import { ThemedText } from '@/components/themed-text';
import {
  RING_RADIUS,
  RING_STROKE_WIDTH,
  RING_CIRCUMFERENCE,
  RING_VIEWBOX,
  RING_CENTER,
  Colors,
  Glass,
  Gradients,
} from '@/constants/theme';
import { ringOffset, getColorForPercent, formatScore } from '@/utils/scoring';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ProgressRingProps {
  score: number;
  target: number;
  habitName: string | null;
  accentColor: string;
}

export function ProgressRing({ score, target, habitName, accentColor }: ProgressRingProps) {
  const percentComplete = target > 0 ? Math.min(score / target, 1) : 0;
  const ringColor = getColorForPercent(percentComplete);

  const animatedPercent = useSharedValue(0);

  useEffect(() => {
    animatedPercent.value = withTiming(percentComplete, { duration: 600 });
  }, [percentComplete, animatedPercent]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: ringOffset(animatedPercent.value),
  }));

  return (
    <View style={styles.container}>
      <Svg width={280} height={280} viewBox={RING_VIEWBOX}>
        <Defs>
          <LinearGradient id="ringTrackGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={Colors.border} stopOpacity="0.6" />
            <Stop offset="100%" stopColor={Colors.border} stopOpacity="1" />
          </LinearGradient>
          <LinearGradient id="ringActiveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={ringColor} stopOpacity="1" />
            <Stop offset="100%" stopColor={ringColor} stopOpacity="0.7" />
          </LinearGradient>
        </Defs>
        <Circle
          cx={RING_CENTER}
          cy={RING_CENTER}
          r={RING_RADIUS}
          stroke="url(#ringTrackGrad)"
          strokeWidth={RING_STROKE_WIDTH}
          fill="none"
          strokeLinecap="round"
          transform={`rotate(-90 ${RING_CENTER} ${RING_CENTER})`}
        />
        <AnimatedCircle
          cx={RING_CENTER}
          cy={RING_CENTER}
          r={RING_RADIUS}
          stroke="url(#ringActiveGrad)"
          strokeWidth={RING_STROKE_WIDTH + 1}
          fill="none"
          strokeDasharray={`${RING_CIRCUMFERENCE} ${RING_CIRCUMFERENCE}`}
          animatedProps={animatedProps}
          strokeLinecap="round"
          transform={`rotate(-90 ${RING_CENTER} ${RING_CENTER})`}
        />
      </Svg>
      <View style={styles.centerText}>
        <ThemedText type="digit" style={{ color: Colors.text, fontSize: 56, lineHeight: 64 }}>
          {formatScore(score)}
        </ThemedText>
        {habitName && (
          <View style={[styles.habitBadge, { backgroundColor: Glass.medium, borderColor: Glass.border }]}>
            <View style={[styles.badgeDot, { backgroundColor: accentColor }]} />
            <ThemedText type="caption" style={{ color: accentColor, fontWeight: '600' }}>
              {habitName}
            </ThemedText>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerText: {
    position: 'absolute',
    alignItems: 'center',
    gap: 2,
  },
  habitBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: Colors.surfaceAlt,
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
