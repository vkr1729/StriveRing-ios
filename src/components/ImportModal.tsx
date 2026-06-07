import { useState, useRef } from 'react';
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
import type { AppState } from '@/types';

interface ImportModalProps {
  visible: boolean;
  onClose: () => void;
  onImport: (state: AppState) => void;
}

export function ImportModal({ visible, onClose, onImport }: ImportModalProps) {
  const [jsonText, setJsonText] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<any>(null);

  const handleImportText = (text: string) => {
    setJsonText(text);
    setErrorMsg(null);
  };

  const validateAndImport = (parsed: any) => {
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Import data must be a valid JSON object.');
    }
    if (!Array.isArray(parsed.habits)) {
      throw new Error('Import data is missing a valid "habits" list.');
    }
    if (!parsed.dailyRecord || typeof parsed.dailyRecord !== 'object') {
      throw new Error('Import data is missing a valid "dailyRecord" object.');
    }
    if (!parsed.history || typeof parsed.history !== 'object') {
      throw new Error('Import data is missing a valid "history" object.');
    }
    if (!parsed.habits.every(
      (h: any) => typeof h.id === 'string' && typeof h.name === 'string' && typeof h.pointsPerHour === 'number'
    )) {
      throw new Error('Habits list contains invalid entries.');
    }
    if (typeof parsed.dailyRecord.totalScore !== 'number' || typeof parsed.dailyRecord.date !== 'string' || typeof parsed.dailyRecord.target !== 'number') {
      throw new Error('dailyRecord has invalid fields.');
    }
    if (!Array.isArray(parsed.dailyRecord.completedSessions)) {
      throw new Error('dailyRecord is missing a valid "completedSessions" array.');
    }

    // Schema checks passed
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const stateToImport: AppState = {
      habits: parsed.habits,
      selectedHabitId: parsed.selectedHabitId !== undefined ? parsed.selectedHabitId : null,
      activeSession: parsed.activeSession !== undefined ? parsed.activeSession : null,
      dailyRecord: parsed.dailyRecord,
      history: parsed.history,
      isLoaded: true,
    };

    onImport(stateToImport);
    setJsonText('');
    setErrorMsg(null);
    onClose();

    if (Platform.OS === 'web') {
      alert('Data successfully imported!');
    } else {
      Alert.alert('Success', 'Data successfully imported!');
    }
  };

  const handleSubmit = () => {
    try {
      const trimmed = jsonText.trim();
      if (trimmed.length === 0) {
        setErrorMsg('Please paste some JSON data first.');
        return;
      }
      const parsed = JSON.parse(trimmed);
      validateAndImport(parsed);
    } catch (e: any) {
      setErrorMsg(e.message || 'Invalid JSON format.');
    }
  };

  const handleWebFileChange = (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        validateAndImport(parsed);
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
  };

  const triggerFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
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
            Import Data
          </ThemedText>

          <ThemedText type="caption" themeColor="textSecondary" style={{ textAlign: 'center', marginBottom: 4 }}>
            Paste backup JSON string below to restore your StriveRing progress.
          </ThemedText>

          <TextInput
            style={styles.textArea}
            value={jsonText}
            onChangeText={handleImportText}
            placeholder='{"habits": [...], "dailyRecord": {...}}'
            placeholderTextColor={Colors.textSecondary}
            multiline={true}
            numberOfLines={6}
            textAlignVertical="top"
          />

          {errorMsg && (
            <ThemedText style={styles.errorText}>
              Error: {errorMsg}
            </ThemedText>
          )}

          {Platform.OS === 'web' && (
            <View style={{ alignItems: 'center', marginTop: 4 }}>
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept=".json"
                onChange={handleWebFileChange}
              />
              <Pressable onPress={triggerFileSelect} style={styles.fileBtn}>
                <ThemedText style={{ color: Colors.accent, fontSize: 13, fontWeight: '700' }}>
                  OR UPLOAD .JSON BACKUP FILE
                </ThemedText>
              </Pressable>
            </View>
          )}

          <View style={styles.buttonRow}>
            <Pressable onPress={onClose}>
              <ThemedText themeColor="textSecondary" type="default">
                Cancel
              </ThemedText>
            </Pressable>
            <Pressable onPress={handleSubmit} style={styles.importBtn}>
              <ThemedText style={{ color: Colors.background, fontWeight: '700', fontSize: 15 }}>
                Import
              </ThemedText>
            </Pressable>
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
    marginBottom: 2,
    letterSpacing: 2,
  },
  textArea: {
    backgroundColor: Colors.surfaceAlt,
    color: Colors.text,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Glass.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    height: 120,
  },
  errorText: {
    color: Colors.strainRed,
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
  fileBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Glass.border,
    backgroundColor: 'transparent',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 16,
    marginTop: 8,
  },
  importBtn: {
    backgroundColor: Colors.accent,
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 14,
  },
});
