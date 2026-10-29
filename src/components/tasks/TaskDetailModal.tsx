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
import { Feather } from '@expo/vector-icons';
import { useAppTheme } from '@/src/design-system/ThemeContext';
import { M3Button } from '@/src/components/ui/M3Button';
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
  const { colors, spacing, typography, radii, shadowSmall, isDark } = useAppTheme();
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

  if (!task) return null;

  const handleSave = async () => {
    if (!title.trim()) return;
    setIsSaving(true);
    haptic.medium();
    await TaskRepository.updateTask(task.id, {
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      due_date: dueDate.trim() || undefined,
    });
    setIsSaving(false);
    haptic.success();
    onUpdated();
    onClose();
  };

  const handleAddSubtask = async () => {
    if (!newSubtaskTitle.trim()) return;
    haptic.light();
    await TaskRepository.addSubtask(task.id, newSubtaskTitle.trim());
    setNewSubtaskTitle('');
    await loadSubtasks(task.id);
    onUpdated();
  };

  const handleToggleSubtask = async (subtaskId: string) => {
    haptic.selection();
    await TaskRepository.toggleSubtask(subtaskId);
    await loadSubtasks(task.id);
    onUpdated();
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    haptic.warning();
    await TaskRepository.deleteSubtask(subtaskId);
    await loadSubtasks(task.id);
    onUpdated();
  };

  const handleDeleteTask = async () => {
    haptic.heavy();
    await TaskRepository.deleteTask(task.id);
    onUpdated();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View
          style={[
            styles.sheetContainer,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderWidth: colors.borderWidth,
              borderRadius: radii.lg,
            },
          ]}
        >
          {/* Header */}
          <View
            style={[
              styles.headerRow,
              {
                borderBottomColor: colors.border,
                borderBottomWidth: colors.borderWidth,
              },
            ]}
          >
            <View>
              <Text
                style={[
                  styles.headerTitle,
                  { color: colors.text, fontSize: typography.sizes.base },
                ]}
              >
                TASK DETAILS
              </Text>
              <Text
                style={[
                  styles.headerSub,
                  { color: colors.textMuted, fontSize: typography.sizes.xs },
                ]}
              >
                Category: {task.category.toUpperCase()}
              </Text>
            </View>
            <Pressable
              onPress={onClose}
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
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Feather name="x" size={20} color={colors.text} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.scrollBody}
            showsVerticalScrollIndicator={false}
          >
            {/* Title */}
            <Text
              style={[
                styles.fieldLabel,
                { color: colors.text, fontSize: typography.sizes.xs },
              ]}
            >
              TITLE
            </Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              style={[
                styles.input,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  borderWidth: colors.borderWidth,
                  borderRadius: radii.sm,
                  color: colors.text,
                  fontSize: typography.sizes.sm,
                },
              ]}
            />

            {/* Description */}
            <Text
              style={[
                styles.fieldLabel,
                { color: colors.text, fontSize: typography.sizes.xs },
              ]}
            >
              DESCRIPTION
            </Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Add task context or notes..."
              placeholderTextColor="#888888"
              multiline
              numberOfLines={3}
              style={[
                styles.textArea,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  borderWidth: colors.borderWidth,
                  borderRadius: radii.sm,
                  color: colors.text,
                  fontSize: typography.sizes.sm,
                },
              ]}
            />

            {/* Priority Picker */}
            <Text
              style={[
                styles.fieldLabel,
                { color: colors.text, fontSize: typography.sizes.xs },
              ]}
            >
              PRIORITY
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

            {/* Due Date */}
            <Text
              style={[
                styles.fieldLabel,
                { color: colors.text, fontSize: typography.sizes.xs },
              ]}
            >
              DUE DATE
            </Text>
            <TextInput
              value={dueDate}
              onChangeText={setDueDate}
              placeholder="e.g. Today, Tomorrow, Fri 5 PM"
              placeholderTextColor="#888888"
              style={[
                styles.input,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  borderWidth: colors.borderWidth,
                  borderRadius: radii.sm,
                  color: colors.text,
                  fontSize: typography.sizes.sm,
                },
              ]}
            />

            {/* Subtasks Checklist */}
            <View style={styles.subtasksHeaderRow}>
              <Text
                style={[
                  styles.fieldLabel,
                  {
                    color: colors.text,
                    fontSize: typography.sizes.xs,
                    marginTop: 0,
                  },
                ]}
              >
                SUBTASKS (
                {subtasks.filter((s) => s.is_completed).length}/{subtasks.length}
                )
              </Text>
            </View>

            {subtasks.map((st) => (
              <View key={st.id} style={styles.subtaskItemRow}>
                <Pressable
                  onPress={() => handleToggleSubtask(st.id)}
                  style={[
                    styles.subtaskCheckbox,
                    {
                      borderColor: colors.border,
                      borderWidth: colors.borderWidth,
                      borderRadius: radii.sm,
                      backgroundColor: st.is_completed
                        ? colors.yellow
                        : colors.surface,
                    },
                  ]}
                >
                  {st.is_completed && (
                    <Feather name="check" size={14} color="#000000" />
                  )}
                </Pressable>
                <Text
                  style={[
                    styles.subtaskTitle,
                    {
                      color: colors.text,
                      fontSize: typography.sizes.xs,
                      textDecorationLine: st.is_completed
                        ? 'line-through'
                        : 'none',
                    },
                  ]}
                >
                  {st.title}
                </Text>
                <Pressable
                  onPress={() => handleDeleteSubtask(st.id)}
                  style={styles.deleteSubtaskBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Feather name="trash-2" size={16} color={colors.pink} />
                </Pressable>
              </View>
            ))}

            <View style={styles.addSubtaskRow}>
              <TextInput
                value={newSubtaskTitle}
                onChangeText={setNewSubtaskTitle}
                placeholder="Add subtask step..."
                placeholderTextColor="#888888"
                style={[
                  styles.subtaskInput,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    borderWidth: colors.borderWidth,
                    borderRadius: radii.sm,
                    color: colors.text,
                    fontSize: typography.sizes.xs,
                  },
                ]}
                onSubmitEditing={handleAddSubtask}
              />
              <Pressable
                onPress={handleAddSubtask}
                style={[
                  styles.addSubtaskBtn,
                  {
                    backgroundColor: colors.yellow,
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
              >
                <Feather name="plus" size={18} color="#000000" />
              </Pressable>
            </View>

            {/* Actions */}
            <View style={styles.actionsContainer}>
              <M3Button
                title={isSaving ? 'SAVING...' : 'SAVE CHANGES'}
                onPress={handleSave}
                variant="primary"
                size="md"
                loading={isSaving}
              />
              <M3Button
                title="DELETE TASK"
                onPress={handleDeleteTask}
                variant="destructive"
                size="sm"
                style={{ marginTop: 8 }}
              />
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  backdrop: {
    flex: 1,
  },
  sheetContainer: {
    maxHeight: '88%',
    paddingTop: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  headerTitle: {
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerSub: {
    fontWeight: '600',
    marginTop: 2,
  },
  closeButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollBody: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  fieldLabel: {
    fontWeight: '700',
    marginTop: 14,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  input: {
    height: 46,
    paddingHorizontal: 14,
    fontWeight: '600',
  },
  textArea: {
    minHeight: 70,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontWeight: '500',
    textAlignVertical: 'top',
  },
  priorityRow: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
  },
  priorityBtnText: {
    fontWeight: '800',
  },
  subtasksHeaderRow: {
    marginTop: 18,
    marginBottom: 8,
  },
  subtaskItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  subtaskCheckbox: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  subtaskTitle: {
    flex: 1,
    fontWeight: '600',
  },
  deleteSubtaskBtn: {
    padding: 6,
    marginLeft: 8,
  },
  addSubtaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  subtaskInput: {
    flex: 1,
    height: 42,
    paddingHorizontal: 12,
    marginRight: 8,
    fontWeight: '500',
  },
  addSubtaskBtn: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionsContainer: {
    marginTop: 24,
  },
});
