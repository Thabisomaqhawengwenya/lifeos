import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/src/design-system/ThemeContext';
import { M3Button } from '@/src/components/ui/M3Button';
import { M3Chip } from '@/src/components/ui/M3Chip';
import { haptic } from '@/src/design-system/haptics';
import { TaskRepository } from '@/src/repositories/TaskRepository';
import { NoteRepository } from '@/src/repositories/NoteAndGoalRepository';
import { FinanceRepository } from '@/src/repositories/FinanceRepository';
import { NotificationService } from '@/src/services/NotificationService';

type CaptureType = 'task' | 'note' | 'reminder' | 'expense';

export default function QuickCaptureModal() {
  const { colors, spacing, isDark } = useAppTheme();
  const [captureType, setCaptureType] = useState<CaptureType>('task');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) return;
    setIsSubmitting(true);
    try {
      if (captureType === 'task') {
        await TaskRepository.createTask({
          title: title.trim(),
          description: notes.trim() || undefined,
          priority,
          due_date: 'Today',
        });
      } else if (captureType === 'note') {
        await NoteRepository.createNote({
          title: title.trim(),
          content: notes.trim() || title.trim(),
        });
      } else if (captureType === 'expense') {
        const parsedAmount = parseFloat(amount || '0');
        const amountCents = Math.round(parsedAmount * 100);
        await FinanceRepository.createTransaction({
          type: 'expense',
          amount_cents: amountCents,
          category: 'General',
          description: title.trim(),
        });
      } else if (captureType === 'reminder') {
        const trigger = new Date(Date.now() + 60 * 60 * 1000);
        await NotificationService.scheduleReminder({
          title: title.trim(),
          body: notes.trim() || 'Scheduled reminder from LifeOS',
          triggerDate: trigger,
        });
        await TaskRepository.createTask({
          title: `Reminder: ${title.trim()}`,
          description: notes.trim() || undefined,
          priority: 'high',
          due_date: 'In 1 hour',
        });
      }

      haptic.success();
      router.back();
    } catch (err: any) {
      Alert.alert('Save Failed', err.message || 'Could not save record to SQLite');
    } finally {
      setIsSubmitting(false);
    }
  };

  const shadowColor = isDark ? '#FFFFFF' : '#000000';

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Header Bar */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.headerTitle, { color: colors.onBackground }]}>
            QUICK CAPTURE
          </Text>
          <Text style={[styles.headerSub, { color: isDark ? '#A0A0A0' : '#555555' }]}>
            Direct persistence to local SQLite
          </Text>
        </View>
        <Pressable
          onPress={() => router.back()}
          style={[
            styles.closeButton,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              shadowColor,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Close"
        >
          <Ionicons name="close" size={20} color={colors.onBackground} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { padding: spacing.base }]}>
        {/* Type Selector Chips */}
        <View style={styles.typesRow}>
          <M3Chip
            label="TASK"
            selected={captureType === 'task'}
            onPress={() => setCaptureType('task')}
            colorScheme="yellow"
            icon={<Ionicons name="checkbox-outline" size={14} color="#000000" />}
          />
          <M3Chip
            label="NOTE"
            selected={captureType === 'note'}
            onPress={() => setCaptureType('note')}
            colorScheme="sky"
            icon={<Ionicons name="document-text-outline" size={14} color="#000000" />}
          />
          <M3Chip
            label="REMINDER"
            selected={captureType === 'reminder'}
            onPress={() => setCaptureType('reminder')}
            colorScheme="coral"
            icon={<Ionicons name="alarm-outline" size={14} color="#000000" />}
          />
          <M3Chip
            label="EXPENSE"
            selected={captureType === 'expense'}
            onPress={() => setCaptureType('expense')}
            colorScheme="mint"
            icon={<Ionicons name="cash-outline" size={14} color="#000000" />}
          />
        </View>

        {/* Title Input */}
        <Text style={[styles.inputLabel, { color: colors.onBackground }]}>
          {captureType === 'task'
            ? 'TASK TITLE'
            : captureType === 'note'
            ? 'NOTE HEADING'
            : captureType === 'reminder'
            ? 'REMINDER TITLE'
            : 'EXPENSE ITEM'}
        </Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder={
            captureType === 'task'
              ? 'e.g. Neo-Brutalism UI Polish'
              : captureType === 'note'
              ? 'e.g. LifeOS System Architecture'
              : captureType === 'reminder'
              ? 'e.g. Check server backups'
              : 'e.g. Coffee & sandwich'
          }
          placeholderTextColor="#888888"
          style={[
            styles.input,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              color: colors.onSurface,
            },
          ]}
          autoFocus
        />

        {/* Amount field for Expense */}
        {captureType === 'expense' && (
          <>
            <Text style={[styles.inputLabel, { color: colors.onBackground }]}>
              AMOUNT ($)
            </Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              placeholderTextColor="#888888"
              keyboardType="decimal-pad"
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  color: colors.onSurface,
                },
              ]}
            />
          </>
        )}

        {/* Priority field for Task */}
        {captureType === 'task' && (
          <>
            <Text style={[styles.inputLabel, { color: colors.onBackground }]}>
              PRIORITY LEVEL
            </Text>
            <View style={styles.priorityRow}>
              {(['low', 'medium', 'high'] as const).map((p) => (
                <Pressable
                  key={p}
                  onPress={() => setPriority(p)}
                  style={[
                    styles.priorityBtn,
                    {
                      backgroundColor:
                        priority === p
                          ? p === 'high'
                            ? colors.accentRed
                            : p === 'medium'
                            ? colors.accentYellow
                            : colors.accentSky
                          : colors.surface,
                      borderColor: colors.border,
                    },
                    priority === p && {
                      shadowColor,
                      shadowOffset: { width: 2, height: 2 },
                      shadowOpacity: 1,
                      shadowRadius: 0,
                      elevation: 2,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.priorityBtnText,
                      {
                        color: priority === p && p === 'high' ? '#FFFFFF' : '#000000',
                      },
                    ]}
                  >
                    {p.toUpperCase()}
                  </Text>
                </Pressable>
              ))}
            </View>
          </>
        )}

        {/* Description / Notes field */}
        <Text style={[styles.inputLabel, { color: colors.onBackground }]}>
          ADDITIONAL NOTES / CONTEXT
        </Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Optional notes or checklist details..."
          placeholderTextColor="#888888"
          multiline
          numberOfLines={3}
          style={[
            styles.textArea,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              color: colors.onSurface,
            },
          ]}
        />

        <View style={{ marginTop: 24 }}>
          <M3Button
            title={isSubmitting ? 'SAVING...' : 'SAVE TO SQLITE'}
            onPress={handleSave}
            variant="filled"
            size="large"
            loading={isSubmitting}
            icon={<Ionicons name="checkmark-circle" size={20} color="#000000" />}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 2.5,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: 'SpaceMono',
    fontSize: 18,
    fontWeight: '900',
  },
  headerSub: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderWidth: 2,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  content: {
    paddingBottom: 40,
  },
  typesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  inputLabel: {
    fontFamily: 'SpaceMono',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  input: {
    height: 48,
    borderWidth: 2,
    borderRadius: 8,
    paddingHorizontal: 14,
    fontFamily: 'SpaceMono',
    fontSize: 13,
  },
  priorityRow: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityBtn: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  priorityBtnText: {
    fontFamily: 'SpaceMono',
    fontSize: 11,
    fontWeight: '700',
  },
  textArea: {
    minHeight: 80,
    borderWidth: 2,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingTop: 12,
    fontFamily: 'SpaceMono',
    fontSize: 13,
    textAlignVertical: 'top',
  },
});
