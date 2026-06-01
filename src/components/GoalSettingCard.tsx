import { StyleSheet, View, TextInput } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Colors, Glass, Fonts } from '@/constants/theme';

interface GoalSettingCardProps {
  target: number;
  score: number;
  onSetTarget: (target: number) => void;
  disabled?: boolean;
}

export function GoalSettingCard({ target, score, onSetTarget, disabled = false }: GoalSettingCardProps) {
  const percent = target > 0 ? score / target : 0;

  let label: string;
  let color: string;
  let bgGlow: string;
  if (percent >= 1) {
    label = 'Optimal';
    color = Colors.accent;
    bgGlow = `${Colors.accent}18`;
  } else if (percent >= 0.7) {
    label = 'On Track';
    color = Colors.accent;
    bgGlow = `${Colors.accent}18`;
  } else if (percent >= 0.5) {
    label = 'Building';
    color = Colors.strainAmber;
    bgGlow = `${Colors.strainAmber}18`;
  } else {
    label = 'Low Strain';
    color = Colors.strainRed;
    bgGlow = `${Colors.strainRed}18`;
  }

  return (
    <View style={[styles.card, { backgroundColor: Glass.light, borderColor: Glass.border }]}>
      <View style={styles.row}>
        <View>
          <ThemedText type="caption" themeColor="textSecondary">
            STRAIN TARGET
          </ThemedText>
          <View style={styles.targetRow}>
            <TextInput
              style={[styles.input, disabled && { opacity: 0.5 }]}
              value={String(target)}
              onChangeText={(t) => {
                const n = parseInt(t, 10);
                if (!isNaN(n) && n > 0) onSetTarget(n);
              }}
              keyboardType="numeric"
              placeholderTextColor={Colors.textSecondary}
              editable={!disabled}
            />
            <ThemedText type="caption" themeColor="textSecondary" style={{ marginBottom: 0 }}>
              points
            </ThemedText>
          </View>
        </View>
        <View style={[styles.statusPill, { backgroundColor: bgGlow, borderColor: color }]}>
          <ThemedText type="caption" style={{ color, fontWeight: '700', letterSpacing: 1 }}>
            {label}
          </ThemedText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginHorizontal: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  targetRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginTop: 4,
  },
  input: {
    color: Colors.text,
    fontSize: 32,
    fontWeight: '700',
    fontFamily: Fonts.mono,
    fontVariant: ['tabular-nums'],
    minWidth: 50,
    padding: 0,
  },
  statusPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
  },
});
