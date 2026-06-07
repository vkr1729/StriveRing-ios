import { StyleSheet, Pressable, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { ThemedText } from '@/components/themed-text';
import { Colors, Glass } from '@/constants/theme';
import type { Habit } from '@/types';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface HabitGridProps {
  habits: Habit[];
  selectedHabitId: string | null;
  onSelect: (habitId: string) => void;
  onAdd: () => void;
  onEdit: (habit: Habit) => void;
  disabled?: boolean;
}

function hexToRgba(hex: string, alpha: number): string {
  try {
    const cleanHex = hex.replace('#', '');
    if (cleanHex.length === 3) {
      const r = parseInt(cleanHex.substring(0, 1) + cleanHex.substring(0, 1), 16);
      const g = parseInt(cleanHex.substring(1, 2) + cleanHex.substring(1, 2), 16);
      const b = parseInt(cleanHex.substring(2, 3) + cleanHex.substring(2, 3), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  } catch (e) {
    return 'rgba(255, 255, 255, 0.08)';
  }
}

function HabitCard({
  habit,
  selected,
  disabled,
  onSelect,
  onEdit,
}: {
  habit: Habit;
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
  onEdit: () => void;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: disabled && !selected ? 0.4 : 1,
  }));

  return (
    <AnimatedPressable
      disabled={disabled}
      onPress={() => {
        scale.value = withSpring(0.96, { damping: 15 }, () => { scale.value = withSpring(1, { damping: 10 }); });
        onSelect();
      }}
      style={[
        styles.card,
        selected && { borderColor: habit.accentColor, backgroundColor: hexToRgba(habit.accentColor, 0.08) },
        animatedStyle,
      ]}
    >
      <View style={styles.cardHeader}>
        <View style={styles.nameRow}>
          <View style={[styles.dot, { backgroundColor: habit.accentColor }]} />
          <ThemedText type="label" style={selected ? { color: habit.accentColor } : undefined}>
            {habit.name}
          </ThemedText>
        </View>
        <View style={styles.headerRight}>
          <ThemedText type="caption" themeColor="textSecondary" style={{ marginRight: 4 }}>
            {habit.pointsPerHour} pts/hr
            {habit.minimumHours !== undefined ? ` (Min ${habit.minimumHours}h)` : ''}
          </ThemedText>
          {!disabled && (
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              style={styles.editIconBtn}
            >
              <ThemedText style={styles.editIcon}>✎</ThemedText>
            </Pressable>
          )}
        </View>
      </View>
    </AnimatedPressable>
  );
}

export function HabitGrid({
  habits,
  selectedHabitId,
  onSelect,
  onAdd,
  onEdit,
  disabled = false,
}: HabitGridProps) {
  return (
    <View style={styles.gridContent}>
      {habits.map((habit) => (
        <HabitCard
          key={habit.id}
          habit={habit}
          selected={habit.id === selectedHabitId}
          disabled={disabled}
          onSelect={() => onSelect(habit.id)}
          onEdit={() => onEdit(habit)}
        />
      ))}
      <Pressable
        disabled={disabled}
        onPress={onAdd}
        style={[styles.addCard, disabled && { opacity: 0.4 }]}
      >
        <ThemedText style={{ color: Colors.textSecondary, fontSize: 20, fontWeight: '300' }}>
          +
        </ThemedText>
        <ThemedText type="caption" themeColor="textSecondary">
          Add Activity
        </ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  gridContent: {
    paddingHorizontal: 16,
    gap: 10,
    paddingVertical: 4,
  },
  card: {
    backgroundColor: Glass.light,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Glass.border,
    padding: 16,
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  progressTrack: {
    height: 3,
    borderRadius: 2,
    backgroundColor: Glass.border,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  addCard: {
    backgroundColor: Glass.light,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Glass.border,
    borderStyle: 'dashed',
    padding: 16,
    alignItems: 'center',
    gap: 4,
  },
  editIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: Glass.light,
    borderWidth: 1,
    borderColor: Glass.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editIcon: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 13,
  },
});
