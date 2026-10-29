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
import { Feather } from '@expo/vector-icons';
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
  const { colors, spacing, typography, radii, shadowSmall, isDark } = useAppTheme();
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

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Header Bar */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
            borderBottomWidth: colors.borderWidth,
          },
        ]}
      >
        <View style={styles.headerLeft}>
          <Text
            style={[
              styles.headerTitle,
              { color: colors.text, fontSize: typography.sizes.lg },
            ]}
          >
            QUICK CAPTURE
          </Text>
          <Text
            style={[
              styles.headerSub,
              { color: colors.textMuted, fontSize: typography.sizes.xs },
            ]}
          >
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
              borderWidth: colors.borderWidth,
              borderRadius: radii.sm,
              shadowColor: shadowSmall.shadowColor,
              shadowOffset: shadowSmall.shadowOffset,
              shadowOpacity: shadowSmall.shadowOpacity,
              shadowRadius: shadowSmall.shadowRadius,
              elevation: shadowSmall.elevation,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Close"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Feather name="x" size={20} color={colors.text} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { padding: spacing.grid2 },
        ]}
      >
        {/* Type Selector Chips */}
        <View style={styles.typesRow}>
          <M3Chip
            label="TASK"
            selected={captureType === 'task'}
            onPress={() => setCaptureType('task')}
            icon={<Feather name="check-square" size={14} color="#000000" />}
          />
          <M3Chip
            label="NOTE"
            selected={captureType === 'note'}
            onPress={() => setCaptureType('note')}
            icon={<Feather name="file-text" size={14} color="#000000" />}
          />
          <M3Chip
            label="REMINDER"
            selected={captureType === 'reminder'}
            onPress={() => setCaptureType('reminder')}
            icon={<Feather name="bell" size={14} color="#000000" />}
          />
          <M3Chip
            label="EXPENSE"
            selected={captureType === 'expense'}
            onPress={() => setCaptureType('expense')}
            icon={<Feather name="dollar-sign" size={14} color="#000000" />}
          />
        </View>

        {/* Title Input */}
        <Text
          style={[
            styles.inputLabel,
            { color: colors.text, fontSize: typography.sizes.xs },
          ]}
        >
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
              ? 'e.g. LifeOS UI verification'
              : captureType === 'note'
              ? 'e.g. System architecture notes'
              : captureType === 'reminder'
              ? 'e.g. Check server backups'
              : 'e.g. Coffee & lunch'
          }
          placeholderTextColor="#888888"
          style={[
            styles.input,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderWidth: colors.borderWidth,
              borderRadius: radii.sm,
              color: colors.text,
              fontSize: typography.sizes.sm,
            },
          ]}
          autoFocus
        />

        {/* Amount field for Expense */}
        {captureType === 'expense' && (
          <>
            <Text
              style={[
                styles.inputLabel,
                { color: colors.text, fontSize: typography.sizes.xs },
              ]}
            >
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
                  borderWidth: colors.borderWidth,
                  borderRadius: radii.sm,
                  color: colors.text,
                  fontSize: typography.sizes.sm,
                },
              ]}
            />
          </>
        )}

        {/* Priority field for Task */}
        {captureType === 'task' && (
          <>
            <Text
              style={[
                styles.inputLabel,
                { color: colors.text, fontSize: typography.sizes.xs },
              ]}
            >
              PRIORITY LEVEL
            </Text>
            <View style={styles.priorityRow}>
              {(['low', 'medium', 'high'] as const).map((p) => {
                const isSelected = priority === p;
                let activeBg = colors.surfaceAlt;
                if (isSelected) {
                  activeBg =
                    p === 'high'
                      ? colors.pink
                      : p === 'medium'
                      ? colors.yellow
                      : colors.blue;
                }
                return (
                  <Pressable
                    key={p}
                    onPress={() => setPriority(p)}
                    style={[
                      styles.priorityBtn,
                      {
                        backgroundColor: activeBg,
                        borderColor: colors.border,
                        borderWidth: colors.borderWidth,
                        borderRadius: radii.sm,
                        shadowColor: isSelected
                          ? shadowSmall.shadowColor
                          : 'transparent',
                        shadowOffset: shadowSmall.shadowOffset,
                        shadowOpacity: shadowSmall.shadowOpacity,
                        shadowRadius: shadowSmall.shadowRadius,
                        elevation: isSelected ? shadowSmall.elevation : 0,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.priorityBtnText,
                        {
                          color:
                            isSelected && p === 'high'
                              ? '#FFFFFF'
                              : '#000000',
                          fontSize: typography.sizes.xs,
                        },
                      ]}
                    >
                      {p.toUpperCase()}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        )}

        {/* Description / Notes field */}
        <Text
          style={[
            styles.inputLabel,
            { color: colors.text, fontSize: typography.sizes.xs },
          ]}
        >
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
              borderWidth: colors.borderWidth,
              borderRadius: radii.sm,
              color: colors.text,
              fontSize: typography.sizes.sm,
            },
          ]}
        />

        <View style={{ marginTop: 24 }}>
          <M3Button
            title={isSubmitting ? 'SAVING...' : 'SAVE TO SQLITE'}
            onPress={handleSave}
            variant="primary"
            size="lg"
            loading={isSubmitting}
            icon={<Feather name="check" size={18} color="#000000" />}
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
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerSub: {
    fontWeight: '500',
    marginTop: 2,
  },
  closeButton: {
    width: 44,
    height: 44,
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
    marginBottom: 16,
  },
  inputLabel: {
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  input: {
    height: 48,
    paddingHorizontal: 14,
    fontWeight: '600',
  },
  priorityRow: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  priorityBtnText: {
    fontWeight: '800',
  },
  textArea: {
    minHeight: 80,
    paddingHorizontal: 14,
    paddingTop: 12,
    fontWeight: '500',
    textAlignVertical: 'top',
  },
});
