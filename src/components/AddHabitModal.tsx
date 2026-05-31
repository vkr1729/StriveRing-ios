import { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Modal,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { ThemedText } from '@/components/themed-text';
import { Colors, Glass } from '@/constants/theme';
import type { Habit } from '@/types';

const PRESET_COLORS = ['#00e5a0', '#00b4d8', '#a78bfa', '#ffb800', '#ff3b30', '#f472b6'];

interface AddHabitModalProps {
  visible: boolean;
  onClose: () => void;
  onCreate: (habit: Habit) => void;
  onUpdate?: (habit: Habit) => void;
  onDelete?: (habitId: string) => void;
  habitToEdit?: Habit | null;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function AddHabitModal({
  visible,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
  habitToEdit = null,
}: AddHabitModalProps) {
  const [name, setName] = useState('');
  const [pointsText, setPointsText] = useState('5');
  const [minimumHoursText, setMinimumHoursText] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);

  useEffect(() => {
    if (visible) {
      if (habitToEdit) {
        setName(habitToEdit.name);
        setPointsText(habitToEdit.pointsPerHour.toString());
        setMinimumHoursText(
          habitToEdit.minimumHours !== undefined ? habitToEdit.minimumHours.toString() : ''
        );
        setColor(habitToEdit.accentColor);
      } else {
        setName('');
        setPointsText('5');
        setMinimumHoursText('');
        setColor(PRESET_COLORS[0]);
      }
    }
  }, [habitToEdit, visible]);

  const handleSave = () => {
    const trimmed = name.trim();
    const points = parseInt(pointsText, 10);
    if (trimmed.length === 0 || isNaN(points) || points <= 0) return;

    const parsedMin = minimumHoursText.trim() !== '' ? parseFloat(minimumHoursText) : undefined;
    const minimumHours =
      parsedMin !== undefined && !isNaN(parsedMin) && parsedMin > 0 ? parsedMin : undefined;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (habitToEdit) {
      if (onUpdate) {
        onUpdate({
          ...habitToEdit,
          name: trimmed,
          pointsPerHour: points,
          accentColor: color,
          minimumHours,
        });
      }
    } else {
      onCreate({
        id: generateId(),
        name: trimmed,
        pointsPerHour: points,
        accentColor: color,
        createdAt: Date.now(),
        minimumHours,
      });
    }

    setName('');
    setPointsText('5');
    setMinimumHoursText('');
    setColor(PRESET_COLORS[0]);
    onClose();
  };

  const handleDelete = () => {
    if (!habitToEdit || !onDelete) return;

    const performDelete = () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onDelete(habitToEdit.id);
      onClose();
    };

    if (Platform.OS === 'web') {
      if (confirm(`Are you sure you want to delete "${habitToEdit.name}"?`)) {
        performDelete();
      }
    } else {
      Alert.alert(
        'Delete Activity',
        `Are you sure you want to delete "${habitToEdit.name}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: performDelete },
        ]
      );
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={[styles.card, { backgroundColor: Colors.surface, borderColor: Glass.border }]}>
          <ThemedText type="title" style={styles.heading}>
            {habitToEdit ? 'Edit Activity' : 'New Activity'}
          </ThemedText>

          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Activity name"
            placeholderTextColor={Colors.textSecondary}
          />

          <TextInput
            style={styles.input}
            value={pointsText}
            onChangeText={setPointsText}
            keyboardType="numeric"
            placeholder="Points per hour"
            placeholderTextColor={Colors.textSecondary}
          />

          <TextInput
            style={styles.input}
            value={minimumHoursText}
            onChangeText={setMinimumHoursText}
            keyboardType="numeric"
            placeholder="Minimum hours (optional, e.g. 6)"
            placeholderTextColor={Colors.textSecondary}
          />

          <View style={styles.colorRow}>
            {PRESET_COLORS.map((c) => (
              <Pressable
                key={c}
                onPress={() => setColor(c)}
                style={[
                  styles.colorDot,
                  { backgroundColor: c },
                  color === c && { borderWidth: 3, borderColor: Colors.text, transform: [{ scale: 1.15 }] },
                ]}
              />
            ))}
          </View>

          <View style={styles.buttonRow}>
            {habitToEdit && onDelete ? (
              <Pressable onPress={handleDelete} style={styles.deleteBtn}>
                <ThemedText style={{ color: Colors.strainRed, fontWeight: '700', fontSize: 15 }}>
                  Delete
                </ThemedText>
              </Pressable>
            ) : (
              <View /> // empty view for layout justification
            )}
            <View style={styles.rightButtons}>
              <Pressable onPress={onClose}>
                <ThemedText themeColor="textSecondary" type="default">
                  Cancel
                </ThemedText>
              </Pressable>
              <Pressable onPress={handleSave} style={styles.createBtn}>
                <ThemedText style={{ color: Colors.background, fontWeight: '700', fontSize: 15 }}>
                  {habitToEdit ? 'Save' : 'Create'}
                </ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 24,
    width: '85%',
    maxWidth: 380,
    gap: 12,
  },
  heading: {
    fontSize: 20,
    lineHeight: 26,
    textAlign: 'center',
    marginBottom: 4,
    letterSpacing: 2,
  },
  input: {
    backgroundColor: Colors.surfaceAlt,
    color: Colors.text,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Glass.border,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
  },
  colorRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 14,
    paddingVertical: 4,
  },
  colorDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  rightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  deleteBtn: {
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  createBtn: {
    backgroundColor: Colors.accent,
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 14,
  },
});
