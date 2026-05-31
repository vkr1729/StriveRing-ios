import { useEffect } from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { ThemedText } from '@/components/themed-text';
import { Colors, Glass } from '@/constants/theme';

interface HeaderBarProps {
  isActive: boolean;
  dailyStrain: number;
  target: number;
  dateLabel: string;
  onPrevDay: () => void;
  onNextDay: () => void;
  hasPrevDay: boolean;
  hasNextDay: boolean;
}

export function HeaderBar({
  isActive,
  dailyStrain,
  target,
  dateLabel,
  onPrevDay,
  onNextDay,
  hasPrevDay,
  hasNextDay,
}: HeaderBarProps) {
  const progress = target > 0 ? Math.min(dailyStrain / target, 1) : 0;
  const pulseOpacity = useSharedValue(0.25);
  const pulseScale = useSharedValue(0.6);

  useEffect(() => {
    if (isActive) {
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 700, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.35, { duration: 700, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true,
      );
      pulseScale.value = withRepeat(
        withSequence(
          withSpring(1.4, { damping: 12 }),
          withSpring(0.8, { damping: 12 }),
        ),
        -1,
        true,
      );
    } else {
      pulseOpacity.value = withTiming(0.25);
      pulseScale.value = withTiming(0.6);
    }
  }, [isActive, pulseOpacity, pulseScale]);

  const dotStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
    transform: [{ scale: pulseScale.value }],
  }));

  return (
    <View style={styles.glassContainer}>
      <View style={styles.container}>
        <View style={styles.leftCol}>
          <View style={styles.dateSelectorRow}>
            {hasPrevDay ? (
              <Pressable onPress={onPrevDay} style={styles.navButton}>
                <ThemedText style={styles.navArrow}>‹</ThemedText>
              </Pressable>
            ) : (
              <View style={[styles.navButton, { opacity: 0 }]}>
                <ThemedText style={styles.navArrow}>‹</ThemedText>
              </View>
            )}
            <ThemedText type="caption" themeColor="textSecondary" style={styles.dateLabel}>
              {dateLabel}
            </ThemedText>
            {hasNextDay ? (
              <Pressable onPress={onNextDay} style={styles.navButton}>
                <ThemedText style={styles.navArrow}>›</ThemedText>
              </Pressable>
            ) : (
              <View style={[styles.navButton, { opacity: 0 }]}>
                <ThemedText style={styles.navArrow}>›</ThemedText>
              </View>
            )}
          </View>
          <View style={styles.brandContainer}>
            <ThemedText style={styles.brandStrive}>STRIVE</ThemedText>
            <ThemedText style={styles.brandRing}>RING</ThemedText>
            <View style={styles.logoIndicator} />
          </View>
        </View>

        <View style={styles.rightCol}>
          <View style={styles.strainRow}>
            <ThemedText type="digit" style={{ color: Colors.accent, fontSize: 30, lineHeight: 36 }}>
              {Math.round(dailyStrain)}
            </ThemedText>
            <ThemedText type="caption" themeColor="textSecondary" style={{ marginTop: 5 }}>
              / {target}
            </ThemedText>
          </View>
          <View style={styles.barTrack}>
            <View style={[styles.barFill, { width: `${Math.round(progress * 100)}%` }]} />
          </View>
          <View style={styles.statusRow}>
            <Animated.View
              style={[
                styles.dot,
                { backgroundColor: isActive ? Colors.accent : Colors.textSecondary },
                dotStyle,
              ]}
            />
            <ThemedText type="caption" themeColor="textSecondary" style={{ fontSize: 10, letterSpacing: 1.5 }}>
              {isActive ? 'RECORDING' : 'READY'}
            </ThemedText>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  glassContainer: {
    backgroundColor: Glass.medium,
    borderBottomWidth: 1,
    borderBottomColor: Glass.border,
    paddingBottom: 10,
  },
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  leftCol: {
    gap: 2,
  },
  dateSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: -8, // Compensate for left arrow padding so label centers properly
  },
  navButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navArrow: {
    color: Colors.accent,
    fontSize: 22,
    lineHeight: 22,
    fontWeight: 'bold',
  },
  dateLabel: {
    fontSize: 12,
    letterSpacing: 1.5,
    fontWeight: '600',
    minWidth: 100,
    textAlign: 'center',
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  brandStrive: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.accent,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  brandRing: {
    fontSize: 20,
    fontWeight: '300',
    color: Colors.text,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  logoIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accent,
    marginLeft: 6,
  },
  rightCol: {
    alignItems: 'flex-end',
    gap: 6,
  },
  strainRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
  },
  barTrack: {
    width: 80,
    height: 3,
    borderRadius: 2,
    backgroundColor: Glass.border,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: Colors.accent,
    borderRadius: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
});
