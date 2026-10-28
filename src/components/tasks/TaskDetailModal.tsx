/* eslint-disable react-hooks/set-state-in-effect, react-hooks/immutability */
import { BrutalButton } from '@/src/components/ui/BrutalButton';
import { haptic } from '@/src/design-system/haptics';
import { useAppTheme } from '@/src/design-system/ThemeContext';
import { SubtaskItem, TaskItem, TaskRepository } from '@/src/repositories/TaskRepository';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

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
  const { colors, isDark } = useAppTheme();
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

  const shadowColor = isDark ? '#FFFFFF' : '#000000';

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
            },
          ]}
        >
          {/* Header */}
          <View style={[styles.headerRow, { borderBottomColor: colors.border }]}>
            <View>
              <Text style={[styles.headerTitle, { color: colors.onSurface }]}>
                DELIVERABLE DETAILS
              </Text>
              <Text style={[styles.headerSub, { color: isDark ? '#A0A0A0' : '#555555' }]}>
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
                  shadowColor,
                },
              ]}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={20} color={colors.onSurface} />
            </Pressable>
          </View>

          <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
            {/* Title */}
            <Text style={[styles.fieldLabel, { color: colors.onSurface }]}>TITLE</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              style={[
                styles.input,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.onSurface,
                },
              ]}
            />

            {/* Description */}
            <Text style={[styles.fieldLabel, { color: colors.onSurface }]}>DESCRIPTION</Text>
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
                  color: colors.onSurface,
                },
              ]}
            />

            {/* Priority Picker */}
            <Text style={[styles.fieldLabel, { color: colors.onSurface }]}>PRIORITY</Text>
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
                      { color: priority === p && p === 'high' ? '#FFFFFF' : '#000000' },
                    ]}
                  >
                    {p.toUpperCase()}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Due Date */}
            <Text style={[styles.fieldLabel, { color: colors.onSurface }]}>DUE DATE</Text>
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
                  color: colors.onSurface,
                },
              ]}
            />

            {/* Subtasks Checklist */}
            <View style={styles.subtasksHeaderRow}>
              <Text style={[styles.fieldLabel, { color: colors.onSurface, marginTop: 0 }]}>
                SUBTASKS CHECKLIST ({subtasks.filter((s) => s.is_completed).length}/{subtasks.length})
              </Text>
            </View>

            {subtasks.map((st) => (
              <View key={st.id} style={styles.subtaskItemRow}>
                <Pressable
                  onPress={() => handleToggleSubtask(st.id)}
                  style={[
                    styles.subtaskCheckbox,
                    {
                      borderColor: '#000000',
                      backgroundColor: st.is_completed ? colors.accentYellow : colors.surface,
                    },
                  ]}
                >
                  {st.is_completed && <Ionicons name="checkmark" size={14} color="#000000" />}
                </Pressable>
                <Text
                  style={[
                    styles.subtaskTitle,
                    {
                      color: colors.onSurface,
                      textDecorationLine: st.is_completed ? 'line-through' : 'none',
                    },
                  ]}
                >
                  {st.title}
                </Text>
                <Pressable
                  onPress={() => handleDeleteSubtask(st.id)}
                  style={styles.deleteSubtaskBtn}
                >
                  <Ionicons name="trash-outline" size={16} color={colors.accentRed} />
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
                    color: colors.onSurface,
                  },
                ]}
                onSubmitEditing={handleAddSubtask}
              />
              <Pressable
                onPress={handleAddSubtask}
                style={[
                  styles.addSubtaskBtn,
                  {
                    backgroundColor: colors.accentYellow,
                    borderColor: colors.border,
                    shadowColor,
                  },
                ]}
              >
                <Ionicons name="add" size={20} color="#000000" />
              </Pressable>
            </View>

            {/* Actions */}
            <View style={styles.actionsContainer}>
              <BrutalButton
                title={isSaving ? 'SAVING...' : 'SAVE CHANGES'}
                onPress={handleSave}
                variant="filled"
                size="medium"
                loading={isSaving}
              />
              <BrutalButton
                title="DELETE DELIVERABLE"
                onPress={handleDeleteTask}
                variant="destructive"
                size="small"
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
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 2.5,
    borderBottomWidth: 0,
    maxHeight: '88%',
    paddingTop: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 2.5,
  },
  headerTitle: {
    fontFamily: 'SpaceMono',
    fontSize: 16,
    fontWeight: '900',
  },
  headerSub: {
    fontFamily: 'SpaceMono',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  closeButton: {
    width: 34,
    height: 34,
    borderWidth: 2,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  scrollBody: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  fieldLabel: {
    fontFamily: 'SpaceMono',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 14,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  input: {
    height: 46,
    borderWidth: 2,
    borderRadius: 8,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  textArea: {
    minHeight: 70,
    borderWidth: 2,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  priorityRow: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityBtn: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  priorityBtnText: {
    fontFamily: 'SpaceMono',
    fontSize: 11,
    fontWeight: '700',
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
    borderWidth: 2,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  subtaskTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
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
    height: 42,
    borderWidth: 2,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    marginRight: 8,
  },
  addSubtaskBtn: {
    width: 42,
    height: 42,
    borderWidth: 2,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  actionsContainer: {
    marginTop: 24,
  },
});
