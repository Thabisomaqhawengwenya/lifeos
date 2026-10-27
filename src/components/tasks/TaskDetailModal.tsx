import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/src/design-system/ThemeContext';
import { M3Button } from '@/src/components/ui/M3Button';
import { M3Chip } from '@/src/components/ui/M3Chip';
import { haptic } from '@/src/design-system/haptics';
import { TaskRepository, TaskItem, SubtaskItem } from '@/src/repositories/TaskRepository';

interface TaskDetailModalProps {
  visible: boolean;
  task: TaskItem | null;
  onClose: () => void;
  onUpdated: () => void;
}

export function TaskDetailModal({
  visible,
  task,
  onClose,
  onUpdated,
}: TaskDetailModalProps) {
  const { colors, spacing, radii, typography } = useAppTheme();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [dueDate, setDueDate] = useState('');
  const [subtasks, setSubtasks] = useState<SubtaskItem[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setPriority(task.priority);
      setDueDate(task.due_date || '');
      loadSubtasks(task.id);
    }
  }, [task]);

  const loadSubtasks = async (taskId: string) => {
    try {
      const items = await TaskRepository.getSubtasksForTask(taskId);
      setSubtasks(items);
    } catch (err) {
      console.warn('Failed loading subtasks:', err);
    }
  };

  const handleAddSubtask = async () => {
    if (!task || !newSubtaskTitle.trim()) return;
    haptic.light();
    await TaskRepository.addSubtask(task.id, newSubtaskTitle.trim());
    setNewSubtaskTitle('');
    await loadSubtasks(task.id);
    onUpdated();
  };

  const handleToggleSubtask = async (subtaskId: string) => {
    haptic.selection();
    await TaskRepository.toggleSubtask(subtaskId);
    if (task) await loadSubtasks(task.id);
    onUpdated();
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    haptic.warning();
    await TaskRepository.deleteSubtask(subtaskId);
    if (task) await loadSubtasks(task.id);
    onUpdated();
  };

  const handleSave = async () => {
    if (!task || !title.trim()) return;
    setIsSaving(true);
    haptic.success();
    await TaskRepository.updateTask(task.id, {
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      due_date: dueDate.trim() || undefined,
    });
    setIsSaving(false);
    onUpdated();
    onClose();
  };

  if (!task) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
          {/* Header */}
          <View style={[styles.headerRow, { borderBottomColor: colors.outlineVariant }]}>
            <Text style={[typography.titleLarge, { color: colors.onSurface }]}>
              Edit Deliverable
            </Text>
            <Pressable
              onPress={onClose}
              style={[styles.closeButton, { backgroundColor: colors.surfaceVariant, borderRadius: radii.full }]}
              accessibilityRole="button"
            >
              <Ionicons name="close" size={20} color={colors.onSurface} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.scrollBody}>
            {/* Title */}
            <Text style={[typography.labelMedium, { color: colors.onSurfaceVariant, marginBottom: 6 }]}>
              TASK TITLE
            </Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              style={[
                styles.input,
                {
                  backgroundColor: colors.surfaceVariant,
                  color: colors.onSurface,
                  borderRadius: radii.md,
                },
              ]}
            />

            {/* Priority Selection */}
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

            {/* Due Date */}
            <Text style={[typography.labelMedium, { color: colors.onSurfaceVariant, marginTop: 14, marginBottom: 6 }]}>
              DUE DATE / HORIZON
            </Text>
            <TextInput
              value={dueDate}
              onChangeText={setDueDate}
              placeholder="e.g. Today, Tomorrow, Friday 3 PM"
              placeholderTextColor={colors.outline}
              style={[
                styles.input,
                {
                  backgroundColor: colors.surfaceVariant,
                  color: colors.onSurface,
                  borderRadius: radii.md,
                },
              ]}
            />

            {/* Description */}
            <Text style={[typography.labelMedium, { color: colors.onSurfaceVariant, marginTop: 14, marginBottom: 6 }]}>
              NOTES & SPECIFICATIONS
            </Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Add extra context or instructions..."
              placeholderTextColor={colors.outline}
              multiline
              numberOfLines={3}
              style={[
                styles.textArea,
                {
                  backgroundColor: colors.surfaceVariant,
                  color: colors.onSurface,
                  borderRadius: radii.md,
                },
              ]}
            />

            {/* Subtasks Section */}
            <View style={styles.subtasksHeaderRow}>
              <Text style={[typography.titleMedium, { color: colors.onSurface }]}>
                Subtasks ({subtasks.filter((s) => s.is_completed).length}/{subtasks.length})
              </Text>
            </View>

            {subtasks.map((sub) => (
              <View key={sub.id} style={styles.subtaskItemRow}>
                <Pressable
                  onPress={() => handleToggleSubtask(sub.id)}
                  style={[
                    styles.subtaskCheckbox,
                    {
                      borderColor: sub.is_completed ? colors.primary : colors.outline,
                      backgroundColor: sub.is_completed ? colors.primary : 'transparent',
                      borderRadius: radii.xs,
                    },
                  ]}
                >
                  {sub.is_completed && (
                    <Ionicons name="checkmark" size={14} color={colors.onPrimary} />
                  )}
                </Pressable>
                <Text
                  style={[
                    typography.bodyMedium,
                    {
                      color: sub.is_completed ? colors.onSurfaceVariant : colors.onSurface,
                      textDecorationLine: sub.is_completed ? 'line-through' : 'none',
                      flex: 1,
                    },
                  ]}
                >
                  {sub.title}
                </Text>
                <Pressable
                  onPress={() => handleDeleteSubtask(sub.id)}
                  style={styles.deleteSubtaskBtn}
                >
                  <Ionicons name="close-circle-outline" size={18} color={colors.outline} />
                </Pressable>
              </View>
            ))}

            {/* Add Subtask Row */}
            <View style={styles.addSubtaskRow}>
              <TextInput
                value={newSubtaskTitle}
                onChangeText={setNewSubtaskTitle}
                placeholder="Add subtask step..."
                placeholderTextColor={colors.outline}
                style={[
                  styles.subtaskInput,
                  {
                    backgroundColor: colors.surfaceVariant,
                    color: colors.onSurface,
                    borderRadius: radii.full,
                  },
                ]}
                onSubmitEditing={handleAddSubtask}
              />
              <Pressable
                onPress={handleAddSubtask}
                style={[styles.addSubtaskBtn, { backgroundColor: colors.primary, borderRadius: radii.full }]}
              >
                <Ionicons name="add" size={18} color={colors.onPrimary} />
              </Pressable>
            </View>

            {/* Action Button */}
            <View style={{ marginTop: 24, marginBottom: 20 }}>
              <M3Button
                title={isSaving ? 'Saving...' : 'Save Changes'}
                onPress={handleSave}
                size="large"
                disabled={!title.trim() || isSaving}
              />
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    maxHeight: '90%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 6,
  },
  scrollBody: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  input: {
    height: 46,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  textArea: {
    minHeight: 70,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    textAlignVertical: 'top',
  },
  priorityRow: {
    flexDirection: 'row',
    gap: 8,
  },
  subtasksHeaderRow: {
    marginTop: 20,
    marginBottom: 8,
  },
  subtaskItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  subtaskCheckbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  deleteSubtaskBtn: {
    padding: 4,
    marginLeft: 8,
  },
  addSubtaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  subtaskInput: {
    flex: 1,
    height: 40,
    paddingHorizontal: 14,
    fontSize: 14,
    marginRight: 8,
  },
  addSubtaskBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
