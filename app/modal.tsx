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
  const { colors, spacing, radii, typography } = useAppTheme();
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
        // Schedule reminder 1 hour from now
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

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Header Bar */}
      <View style={[styles.header, { borderBottomColor: colors.divider }]}>
        <View style={styles.headerLeft}>
          <Text style={[typography.titleLarge, { color: colors.onBackground }]}>
            Quick Capture
          </Text>
          <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant }]}>
            Direct persistence to local SQLite
          </Text>
        </View>
        <Pressable
          onPress={() => router.back()}
          style={[styles.closeButton, { backgroundColor: colors.surfaceVariant, borderRadius: radii.full }]}
          accessibilityRole="button"
          accessibilityLabel="Close"
        >
          <Ionicons name="close" size={20} color={colors.onSurface} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { padding: spacing.lg }]}>
        {/* Type Selector */}
        <View style={styles.typesRow}>
          <M3Chip
            label="Task"
            selected={captureType === 'task'}
            onPress={() => setCaptureType('task')}
            icon={<Ionicons name="checkbox-outline" size={14} color={captureType === 'task' ? colors.onPrimary : colors.primary} />}
          />
          <M3Chip
            label="Note"
            selected={captureType === 'note'}
            onPress={() => setCaptureType('note')}
            icon={<Ionicons name="document-text-outline" size={14} color={captureType === 'note' ? colors.onPrimary : colors.primary} />}
          />
          <M3Chip
            label="Reminder"
            selected={captureType === 'reminder'}
            onPress={() => setCaptureType('reminder')}
            icon={<Ionicons name="alarm-outline" size={14} color={captureType === 'reminder' ? colors.onPrimary : colors.primary} />}
          />
          <M3Chip
            label="Expense"
            selected={captureType === 'expense'}
            onPress={() => setCaptureType('expense')}
            icon={<Ionicons name="cash-outline" size={14} color={captureType === 'expense' ? colors.onPrimary : colors.primary} />}
          />
        </View>

        {/* Title Input */}
        <Text style={[typography.labelMedium, { color: colors.onSurfaceVariant, marginTop: 16, marginBottom: 6 }]}>
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
              ? 'e.g. Implement SQLite database schema'
              : captureType === 'note'
              ? 'e.g. LifeOS architecture ideas'
              : captureType === 'reminder'
              ? 'e.g. Check server backups'
              : 'e.g. Coffee & sandwich'
          }
          placeholderTextColor={colors.outline}
          style={[
            styles.input,
            {
              backgroundColor: colors.surface,
              borderColor: colors.outlineVariant,
              color: colors.onSurface,
              borderRadius: radii.md,
            },
          ]}
          autoFocus
        />

        {/* Amount field for Expense */}
        {captureType === 'expense' && (
          <>
            <Text style={[typography.labelMedium, { color: colors.onSurfaceVariant, marginTop: 14, marginBottom: 6 }]}>
              AMOUNT ($)
            </Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              placeholderTextColor={colors.outline}
              keyboardType="decimal-pad"
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.outlineVariant,
                  color: colors.onSurface,
                  borderRadius: radii.md,
                },
              ]}
            />
          </>
        )}

        {/* Priority field for Task */}
        {captureType === 'task' && (
          <>
            <Text style={[typography.labelMedium, { color: colors.onSurfaceVariant, marginTop: 14, marginBottom: 6 }]}>
              PRIORITY LEVEL
            </Text>
            <View style={styles.priorityRow}>
              <M3Chip
                label="Low"
                selected={priority === 'low'}
                onPress={() => setPriority('low')}
              />
              <M3Chip
                label="Medium"
                selected={priority === 'medium'}
                onPress={() => setPriority('medium')}
              />
              <M3Chip
                label="High"
                selected={priority === 'high'}
                onPress={() => setPriority('high')}
              />
            </View>
          </>
        )}

        {/* Notes Input */}
        <Text style={[typography.labelMedium, { color: colors.onSurfaceVariant, marginTop: 14, marginBottom: 6 }]}>
          DESCRIPTION / CONTEXT
        </Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Add any relevant details, links or tags..."
          placeholderTextColor={colors.outline}
          multiline
          numberOfLines={4}
          style={[
            styles.textArea,
            {
              backgroundColor: colors.surface,
              borderColor: colors.outlineVariant,
              color: colors.onSurface,
              borderRadius: radii.md,
            },
          ]}
        />

        {/* Save Button */}
        <View style={styles.submitContainer}>
          <M3Button
            title={isSubmitting ? 'Saving to Database...' : 'Save to LifeOS'}
            onPress={handleSave}
            variant="filled"
            size="large"
            disabled={!title.trim() || isSubmitting}
            loading={isSubmitting}
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
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 20 : 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flex: 1,
  },
  closeButton: {
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingBottom: 40,
  },
  typesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  input: {
    height: 48,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  textArea: {
    minHeight: 90,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    textAlignVertical: 'top',
  },
  priorityRow: {
    flexDirection: 'row',
    gap: 8,
  },
  submitContainer: {
    marginTop: 28,
  },
});
