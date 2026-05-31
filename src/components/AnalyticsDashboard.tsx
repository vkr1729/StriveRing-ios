import { StyleSheet, View, Modal, Pressable, ScrollView } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Colors, Glass } from '@/constants/theme';
import { computeAnalytics } from '@/utils/analytics';
import type { AppState } from '@/types';

interface AnalyticsDashboardProps {
  visible: boolean;
  onClose: () => void;
  state: AppState;
}

export function AnalyticsDashboard({ visible, onClose, state }: AnalyticsDashboardProps) {
  const data = computeAnalytics(state);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: Colors.surface, borderColor: Glass.border }]}>
          <View style={styles.header}>
            <ThemedText type="title" style={styles.heading}>
              Analytics Dashboard
            </ThemedText>
            <ThemedText type="caption" themeColor="textSecondary" style={{ textAlign: 'center' }}>
              Weekly vs Monthly performance overview
            </ThemedText>
          </View>

          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            {/* Overall Card */}
            <View style={styles.sectionHeader}>
              <ThemedText type="caption" themeColor="textSecondary">
                OVERALL PERFORMANCE
              </ThemedText>
            </View>
            
            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <ThemedText style={styles.statLabel}>Weekly Avg</ThemedText>
                <ThemedText type="digit" style={{ color: Colors.accent, fontSize: 24 }}>
                  {data.weeklyOverall.average}
                </ThemedText>
                <ThemedText style={styles.statSublabel}>SD: ±{data.weeklyOverall.stdDev}</ThemedText>
              </View>

              <View style={styles.statBox}>
                <ThemedText style={styles.statLabel}>Monthly Avg</ThemedText>
                <ThemedText type="digit" style={{ color: Colors.accent, fontSize: 24 }}>
                  {data.monthlyOverall.average}
                </ThemedText>
                <ThemedText style={styles.statSublabel}>SD: ±{data.monthlyOverall.stdDev}</ThemedText>
              </View>
            </View>

            {/* Individual Breakdown */}
            <View style={styles.sectionHeader}>
              <ThemedText type="caption" themeColor="textSecondary">
                INDIVIDUAL ACTIVITIES
              </ThemedText>
            </View>

            <View style={styles.habitList}>
              {data.habits.map((habit) => (
                <View key={habit.id} style={styles.habitRow}>
                  <View style={styles.habitTitleRow}>
                    <View style={[styles.dot, { backgroundColor: habit.color }]} />
                    <ThemedText style={{ fontWeight: '700', fontSize: 14 }}>
                      {habit.name}
                    </ThemedText>
                  </View>

                  <View style={styles.habitStatsGrid}>
                    <View style={styles.habitStatColumn}>
                      <ThemedText style={styles.subtextHeader}>WEEKLY</ThemedText>
                      <ThemedText style={styles.statText}>Avg: {habit.weekly.average} pts</ThemedText>
                      <ThemedText style={styles.subtext}>SD: ±{habit.weekly.stdDev}</ThemedText>
                    </View>

                    <View style={styles.habitStatColumn}>
                      <ThemedText style={styles.subtextHeader}>MONTHLY</ThemedText>
                      <ThemedText style={styles.statText}>Avg: {habit.monthly.average} pts</ThemedText>
                      <ThemedText style={styles.subtext}>SD: ±{habit.monthly.stdDev}</ThemedText>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>

          <Pressable onPress={onClose} style={styles.closeBtn}>
            <ThemedText style={{ color: Colors.background, fontWeight: '800', fontSize: 15 }}>
              CLOSE
            </ThemedText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    width: '90%',
    maxWidth: 440,
    maxHeight: '80%',
    gap: 16,
  },
  header: {
    alignItems: 'center',
    gap: 4,
  },
  heading: {
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  scroll: {
    flexGrow: 0,
  },
  sectionHeader: {
    marginVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Glass.border,
    paddingBottom: 6,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: Glass.medium,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Glass.border,
    padding: 14,
    alignItems: 'center',
    gap: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  statSublabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  habitList: {
    gap: 12,
  },
  habitRow: {
    backgroundColor: Glass.light,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Glass.border,
    padding: 12,
    gap: 8,
  },
  habitTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  habitStatsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  habitStatColumn: {
    flex: 1,
    backgroundColor: Glass.light,
    borderRadius: 8,
    padding: 8,
    gap: 2,
  },
  subtextHeader: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.textSecondary,
    letterSpacing: 1.5,
  },
  statText: {
    fontSize: 12,
    color: Colors.text,
    fontWeight: '700',
  },
  subtext: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
  closeBtn: {
    backgroundColor: Colors.accent,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
});
