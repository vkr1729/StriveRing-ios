import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { StyleSheet, ScrollView, View, Platform, Alert, Pressable, NativeModules } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { HeaderBar } from '@/components/HeaderBar';
import { ProgressRing } from '@/components/ProgressRing';
import { ControlDock } from '@/components/ControlDock';
import { HabitGrid } from '@/components/HabitGrid';
import { AddHabitModal } from '@/components/AddHabitModal';
import { ImportModal } from '@/components/ImportModal';
import { AnalyticsDashboard } from '@/components/AnalyticsDashboard';
import { GoalSettingCard } from '@/components/GoalSettingCard';
import { useHabitState } from '@/hooks/useHabitState';
import { useTimer } from '@/hooks/useTimer';
import { calculateActiveScore, calculateElapsedMs, formatElapsedTime } from '@/utils/scoring';
import { Colors, Glass } from '@/constants/theme';
import { todayDateString, saveState } from '@/utils/storage';
import type { Habit } from '@/types';

function getDateStringForOffset(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function HomeScreen() {
  const { state, dispatch, persistDispatch } = useHabitState();
  const [modalVisible, setModalVisible] = useState(false);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [analyticsVisible, setAnalyticsVisible] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [dateOffset, setDateOffset] = useState(0);

  const handleExport = useCallback(() => {
    // Strip isLoaded to keep serialized backup clean
    const backupState = {
      ...state,
      isLoaded: undefined,
    };
    const jsonStr = JSON.stringify(backupState, null, 2);

    Clipboard.setStringAsync(jsonStr);

    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      try {
        const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(jsonStr);
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute('href', dataStr);
        downloadAnchor.setAttribute('download', 'strivering_backup.json');
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        alert('State exported successfully! Backup JSON copied to clipboard and strivering_backup.json downloaded.');
      } catch (err) {
        alert('Backup JSON copied to clipboard!');
      }
    } else {
      Alert.alert('Export Success', 'Backup JSON copied to clipboard.');
    }
  }, [state]);

  const handleImport = useCallback((importedState: any) => {
    persistDispatch({ type: 'IMPORT_STATE', state: importedState });
  }, [persistDispatch]);

  const handleUpdateHabit = useCallback((habit: Habit) => {
    persistDispatch({ type: 'UPDATE_HABIT', habit });
  }, [persistDispatch]);

  const handleDeleteHabit = useCallback((habitId: string) => {
    persistDispatch({ type: 'DELETE_HABIT', habitId });
  }, [persistDispatch]);

  const hasActiveSession = state.activeSession !== null;
  const isPaused = state.activeSession?.isPaused ?? false;
  const isActive = hasActiveSession && !isPaused;

  useTimer(dispatch, isActive);

  // Swipe gesture handling
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const lastSentScoreRef = useRef(-1);

  const oldestOffset = useMemo(() => {
    const dates = Object.keys(state.history || {});
    if (dates.length === 0) return 0;
    dates.sort();
    const oldestDateStr = dates[0];
    const parts = oldestDateStr.split('-');
    const oldestDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    const today = new Date();
    oldestDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const diffTime = today.getTime() - oldestDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return -diffDays;
  }, [state.history]);

  const selectedDate = useMemo(() => getDateStringForOffset(dateOffset), [dateOffset]);
  const isViewingHistory = dateOffset < 0;

  const currentRecord = useMemo(() => {
    if (!isViewingHistory) {
      return state.dailyRecord;
    }
    return state.history?.[selectedDate] || {
      date: selectedDate,
      totalScore: 0,
      completedSessions: [],
      target: state.dailyRecord.target,
    };
  }, [isViewingHistory, selectedDate, state.dailyRecord, state.history]);

  const dateLabel = useMemo(() => {
    if (dateOffset === 0) return 'TODAY';
    if (dateOffset === -1) return 'YESTERDAY';
    
    const parts = selectedDate.split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const parsedDate = new Date(year, month, day);

    // Pure JS date formatting to bypass Hermes toLocaleDateString unimplemented crash on iOS
    const weekdays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    
    const wday = weekdays[parsedDate.getDay()];
    const mname = months[parsedDate.getMonth()];
    const dnum = parsedDate.getDate();
    
    return `${wday}, ${mname} ${dnum}`;
  }, [dateOffset, selectedDate]);

  const handleTouchStart = (e: any) => {
    touchStartX.current = e.nativeEvent.pageX;
    touchStartY.current = e.nativeEvent.pageY;
  };

  const handleTouchEnd = (e: any) => {
    const dx = e.nativeEvent.pageX - touchStartX.current;
    const dy = e.nativeEvent.pageY - touchStartY.current;

    // Swipe horizontally with minimum distance threshold
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 60) {
      if (dx > 0) {
        if (dateOffset > oldestOffset) {
          setDateOffset((prev) => prev - 1);
        }
      } else {
        if (dateOffset < 0) {
          setDateOffset((prev) => prev + 1);
        }
      }
    }
  };

  const liveScore = useMemo(() => {
    if (isViewingHistory || !state.activeSession) return 0;
    const habit = state.habits.find((h) => h.id === state.activeSession!.habitId);
    if (!habit) return 0;
    return calculateActiveScore(state.activeSession, habit);
  }, [isViewingHistory, state.activeSession, state.habits]);

  const elapsedMs = useMemo(() => {
    if (isViewingHistory || !state.activeSession) return 0;
    return calculateElapsedMs(state.activeSession);
  }, [isViewingHistory, state.activeSession]);

  const totalDisplayScore = isViewingHistory ? currentRecord.totalScore : state.dailyRecord.totalScore + liveScore;

  const selectedHabit = state.selectedHabitId
    ? state.habits.find((h) => h.id === state.selectedHabitId) ?? null
    : null;

  const accentColor = selectedHabit?.accentColor ?? Colors.accent;

  const handlePlay = useCallback(() => {
    if (!state.selectedHabitId) return;
    const now = Date.now();
    persistDispatch({ type: 'START_SESSION', habitId: state.selectedHabitId, startTime: now });
    
    if (Platform.OS === 'ios') {
      const { StriveRingActivityBridge } = NativeModules;
      if (StriveRingActivityBridge?.startActivity) {
        const habit = state.habits.find((h) => h.id === state.selectedHabitId);
        StriveRingActivityBridge.startActivity(
          state.selectedHabitId,
          habit?.name ?? 'Activity',
          state.dailyRecord.totalScore,
          state.dailyRecord.target,
          0
        );
      }
    }
  }, [state.selectedHabitId, state.habits, state.dailyRecord.totalScore, state.dailyRecord.target, persistDispatch]);

  const handlePause = useCallback(() => {
    if (!state.activeSession) return;
    const elapsed = calculateElapsedMs(state.activeSession);
    persistDispatch({ type: 'PAUSE_SESSION', pausedAt: Date.now(), accumulatedMs: elapsed });
    
    if (Platform.OS === 'ios') {
      const { StriveRingActivityBridge } = NativeModules;
      if (StriveRingActivityBridge?.updateActivity) {
        StriveRingActivityBridge.updateActivity(
          Math.round(liveScore),
          state.dailyRecord.totalScore,
          elapsed
        );
      }
    }
  }, [state.activeSession, liveScore, state.dailyRecord.totalScore, persistDispatch]);

  const handleResume = useCallback(() => {
    persistDispatch({ type: 'RESUME_SESSION', startTime: Date.now() });
    
    if (Platform.OS === 'ios') {
      const { StriveRingActivityBridge } = NativeModules;
      if (StriveRingActivityBridge?.updateActivity) {
        StriveRingActivityBridge.updateActivity(
          Math.round(liveScore),
          state.dailyRecord.totalScore,
          elapsedMs
        );
      }
    }
  }, [liveScore, state.dailyRecord.totalScore, elapsedMs, persistDispatch]);

  const handleStop = useCallback(() => {
    if (!state.activeSession) return;
    const habit = state.habits.find((h) => h.id === state.activeSession!.habitId);
    const score = habit ? calculateActiveScore(state.activeSession, habit) : 0;
    persistDispatch({
      type: 'STOP_SESSION',
      endTime: Date.now(),
      score,
      habitName: habit?.name ?? 'Unknown',
    });
    
    if (Platform.OS === 'ios') {
      const { StriveRingActivityBridge } = NativeModules;
      if (StriveRingActivityBridge?.endActivity) {
        StriveRingActivityBridge.endActivity(
          Math.round(score),
          state.dailyRecord.totalScore + score,
          0
        );
      }
    }
  }, [state.activeSession, state.habits, state.dailyRecord.totalScore, persistDispatch]);

  const handleSimHour = useCallback(() => {
    if (!state.activeSession) return;
    const habit = state.habits.find((h) => h.id === state.activeSession!.habitId);
    if (!habit) return;
    const newAccumulated = state.activeSession.accumulatedMs + 3_600_000;
    const tempSession = { ...state.activeSession, accumulatedMs: newAccumulated };
    const newScore = calculateActiveScore(tempSession, habit);
    persistDispatch({ type: 'SIMULATE_HOUR', accumulatedMs: newAccumulated, score: newScore });
    
    if (Platform.OS === 'ios') {
      const { StriveRingActivityBridge } = NativeModules;
      if (StriveRingActivityBridge?.updateActivity) {
        StriveRingActivityBridge.updateActivity(
          Math.round(newScore),
          state.dailyRecord.totalScore,
          newAccumulated
        );
      }
    }
  }, [state.activeSession, state.habits, state.dailyRecord.totalScore, persistDispatch]);

  // Keep iOS Live Activity updated — throttled to score changes only
  useEffect(() => {
    if (Platform.OS !== 'ios' || !state.activeSession || state.activeSession.isPaused) return;

    const roundedScore = Math.round(liveScore);
    if (roundedScore !== lastSentScoreRef.current) {
      lastSentScoreRef.current = roundedScore;
      const { StriveRingActivityBridge } = NativeModules;
      if (StriveRingActivityBridge?.updateActivity) {
        StriveRingActivityBridge.updateActivity(
          roundedScore,
          state.dailyRecord.totalScore,
          elapsedMs,
        );
      }
    }
  }, [liveScore, state.dailyRecord.totalScore, elapsedMs, state.activeSession?.isPaused]);

  const handleSelectHabit = useCallback((id: string) => {
    dispatch({ type: 'SELECT_HABIT', habitId: id });
  }, [dispatch]);

  const handleAddHabit = useCallback((habit: Habit) => {
    persistDispatch({ type: 'ADD_HABIT', habit });
  }, [persistDispatch]);

  const handleSetTarget = useCallback((target: number) => {
    persistDispatch({ type: 'SET_TARGET', target });
  }, [persistDispatch]);

  if (!state.isLoaded) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <ThemedText themeColor="textSecondary">Loading...</ThemedText>
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  const handlePrevDay = useCallback(() => setDateOffset(prev => Math.max(oldestOffset, prev - 1)), [oldestOffset]);
  const handleNextDay = useCallback(() => setDateOffset(prev => Math.min(0, prev + 1)), []);

  return (
    <ThemedView
      style={styles.container}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <HeaderBar
            isActive={!isViewingHistory && isActive}
            dailyStrain={totalDisplayScore}
            target={currentRecord.target}
            dateLabel={dateLabel}
            onPrevDay={handlePrevDay}
            onNextDay={handleNextDay}
            hasPrevDay={dateOffset > oldestOffset}
            hasNextDay={dateOffset < 0}
          />

          <View style={styles.ringSection}>
            <ProgressRing
              score={totalDisplayScore}
              target={currentRecord.target}
              habitName={isViewingHistory ? null : (selectedHabit?.name ?? null)}
              accentColor={isViewingHistory ? Colors.textSecondary : accentColor}
            />
            {!isViewingHistory && hasActiveSession && (
              <ThemedText type="digit" style={{ color: Colors.textSecondary, fontSize: 22, marginTop: 8 }}>
                {formatElapsedTime(elapsedMs)}
              </ThemedText>
            )}
          </View>

          {isViewingHistory ? (
            <View style={styles.historyList}>
              <ThemedText type="caption" themeColor="textSecondary" style={{ marginBottom: 6 }}>
                COMPLETED ACTIVITIES
              </ThemedText>
              {currentRecord.completedSessions.length === 0 ? (
                <View style={styles.emptyHistory}>
                  <ThemedText themeColor="textSecondary" style={{ fontStyle: 'italic', fontSize: 14 }}>
                    No activities recorded this day.
                  </ThemedText>
                </View>
              ) : (
                currentRecord.completedSessions.map((session, index) => {
                  const matchingHabit = state.habits.find((h) => h.id === session.habitId);
                  const color = matchingHabit?.accentColor || Colors.accent;
                  const roundedScore = Math.round(session.score);
                  const scoreStr = roundedScore >= 0 ? `+${roundedScore}` : `${roundedScore}`;
                  return (
                    <View key={index} style={styles.historyItem}>
                      <View style={styles.historyItemLeft}>
                        <View style={[styles.dot, { backgroundColor: color }]} />
                        <ThemedText style={{ fontWeight: '500' }}>{session.habitName}</ThemedText>
                      </View>
                      <ThemedText type="digit" style={{ color: Colors.accent, fontSize: 16, fontWeight: '600' }}>
                        {scoreStr} pts
                      </ThemedText>
                    </View>
                  );
                })
              )}
            </View>
          ) : (
            <ControlDock
              isActive={isActive}
              isPaused={isPaused}
              hasActiveSession={hasActiveSession}
              onPlay={handlePlay}
              onPause={handlePause}
              onResume={handleResume}
              onStop={handleStop}
              onSimHour={handleSimHour}
            />
          )}

          <View style={styles.section}>
            <ThemedText type="caption" themeColor="textSecondary" style={{ paddingHorizontal: 20, marginBottom: 8 }}>
              {isViewingHistory ? 'ACTIVITIES (READ ONLY)' : 'ACTIVITIES'}
            </ThemedText>
            <HabitGrid
              habits={state.habits}
              selectedHabitId={isViewingHistory ? null : state.selectedHabitId}
              totalScore={totalDisplayScore}
              onSelect={handleSelectHabit}
              onAdd={() => {
                setEditingHabit(null);
                setModalVisible(true);
              }}
              onEdit={(habit) => {
                setEditingHabit(habit);
                setModalVisible(true);
              }}
              disabled={hasActiveSession || isViewingHistory}
            />
          </View>

          <GoalSettingCard
            target={currentRecord.target}
            score={totalDisplayScore}
            onSetTarget={handleSetTarget}
            disabled={isViewingHistory}
          />

          <View style={styles.dataManagementCard}>
            <ThemedText type="caption" themeColor="textSecondary" style={{ marginBottom: 4 }}>
              UTILITIES & DATA
            </ThemedText>
            <View style={styles.dataRow}>
              <Pressable onPress={() => setAnalyticsVisible(true)} style={styles.dataBtn}>
                <ThemedText style={styles.dataBtnText}>ANALYTICS</ThemedText>
              </Pressable>
              <Pressable onPress={handleExport} style={styles.dataBtn}>
                <ThemedText style={styles.dataBtnText}>EXPORT</ThemedText>
              </Pressable>
              <Pressable onPress={() => setImportModalVisible(true)} style={styles.dataBtn}>
                <ThemedText style={styles.dataBtnText}>IMPORT</ThemedText>
              </Pressable>
            </View>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>

      <AddHabitModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setEditingHabit(null);
        }}
        onCreate={handleAddHabit}
        onUpdate={handleUpdateHabit}
        onDelete={handleDeleteHabit}
        habitToEdit={editingHabit}
      />

      <ImportModal
        visible={importModalVisible}
        onClose={() => setImportModalVisible(false)}
        onImport={handleImport}
      />

      <AnalyticsDashboard
        visible={analyticsVisible}
        onClose={() => setAnalyticsVisible(false)}
        state={state}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    gap: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringSection: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  section: {
    gap: 8,
  },
  historyList: {
    backgroundColor: Glass.medium,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Glass.border,
    marginHorizontal: 16,
    padding: 16,
    gap: 10,
  },
  emptyHistory: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Glass.light,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  historyItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dataManagementCard: {
    backgroundColor: Glass.medium,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Glass.border,
    marginHorizontal: 16,
    padding: 16,
    gap: 10,
  },
  dataRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dataBtn: {
    flex: 1,
    backgroundColor: Glass.light,
    borderWidth: 1,
    borderColor: Glass.border,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dataBtnText: {
    color: Colors.accent,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
});
