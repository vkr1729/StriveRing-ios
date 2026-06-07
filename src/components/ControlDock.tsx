import { StyleSheet, View, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { ThemedText } from '@/components/themed-text';
import { Colors, Glass } from '@/constants/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface ControlDockProps {
  isActive: boolean;
  isPaused: boolean;
  hasActiveSession: boolean;
  canStart: boolean;
  onPlay: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onSimHour: () => void;
}

function PillButton({
  onPress,
  label,
  variant,
}: {
  onPress: () => void;
  label: string;
  variant: 'primary' | 'danger' | 'subtle';
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const bg = variant === 'primary' ? Colors.accent
    : variant === 'danger' ? 'rgba(255,59,48,0.18)'
    : `${Colors.accent}18`;
  const fg = variant === 'primary' ? Colors.background
    : variant === 'danger' ? Colors.strainRed
    : Colors.accent;

  return (
    <AnimatedPressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        scale.value = withSpring(0.92, { damping: 15 }, () => { scale.value = withSpring(1, { damping: 10 }); });
        onPress();
      }}
      style={[styles.pill, { backgroundColor: bg }, animatedStyle]}
    >
      <ThemedText style={{ color: fg, fontSize: 13, fontWeight: '800', letterSpacing: 1.5 }}>
        {label}
      </ThemedText>
    </AnimatedPressable>
  );
}

export function ControlDock({
  isActive,
  isPaused,
  hasActiveSession,
  canStart,
  onPlay,
  onPause,
  onResume,
  onStop,
  onSimHour,
}: ControlDockProps) {
  return (
    <View style={styles.container}>
      <View style={styles.glassDock}>
        {!hasActiveSession && (
          <PillButton onPress={canStart ? onPlay : () => {}} label="START" variant={canStart ? "primary" : "subtle"} />
        )}
        {hasActiveSession && !isPaused && (
          <View style={styles.row}>
            <PillButton onPress={onSimHour} label="+1H" variant="subtle" />
            <PillButton onPress={onPause} label="PAUSE" variant="primary" />
            <PillButton onPress={onStop} label="END" variant="danger" />
          </View>
        )}
        {hasActiveSession && isPaused && (
          <View style={styles.row}>
            <PillButton onPress={onSimHour} label="+1H" variant="subtle" />
            <PillButton onPress={onResume} label="RESUME" variant="primary" />
            <PillButton onPress={onStop} label="END" variant="danger" />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  glassDock: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignSelf: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  pill: {
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
});
