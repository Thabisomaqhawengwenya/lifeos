import React, { useState, useCallback } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Pressable,
  RefreshControl,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/src/design-system/ThemeContext';
import { M3Header } from '@/src/components/ui/M3Header';
import { M3Card } from '@/src/components/ui/M3Card';
import { M3Chip } from '@/src/components/ui/M3Chip';
import { M3FAB } from '@/src/components/ui/M3FAB';
import { M3EmptyState } from '@/src/components/ui/M3EmptyState';
import { haptic } from '@/src/design-system/haptics';
import { TaskRepository, TaskItem } from '@/src/repositories/TaskRepository';
import { TaskDetailModal } from '@/src/components/tasks/TaskDetailModal';
import { GlobalSearchModal } from '@/src/components/search/GlobalSearchModal';

type FilterType = 'all' | 'today' | 'upcoming' | 'completed';

export default function TasksScreen() {
  const { colors, spacing, radii, typography } = useAppTheme();
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [searchVisible, setSearchVisible] = useState(false);

  const loadTasks = useCallback(async () => {
    try {
      const data = await TaskRepository.getAllTasks();
      setTasks(data);
    } catch (err) {
      console.warn('Error loading tasks:', err);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTasks();
    }, [loadTasks])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadTasks();
    setRefreshing(false);
  };

  const handleToggle = async (id: string) => {
    haptic.success();
    await TaskRepository.toggleTask(id);
    await loadTasks();
  };

  const handleDelete = async (id: string) => {
    haptic.warning();
    await TaskRepository.deleteTask(id);
    await loadTasks();
  };

  const filteredTasks = tasks.filter((t) => {
    if (activeFilter === 'today') return (t.due_date || '').includes('Today');
    if (activeFilter === 'upcoming') return !t.is_completed && !(t.due_date || '').includes('Today');
    if (activeFilter === 'completed') return t.is_completed;
    return true;
  });

  const pendingCount = tasks.filter((t) => !t.is_completed).length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <M3Header
        title="Tasks & Deliverables"
        subtitle={`${pendingCount} active items in local SQLite`}
        rightAction={
          <Pressable
            onPress={() => setSearchVisible(true)}
            style={[styles.searchHeaderBtn, { backgroundColor: colors.surfaceVariant, borderRadius: radii.full }]}
            accessibilityRole="button"
            accessibilityLabel="Search all items"
          >
            <Ionicons name="search" size={20} color={colors.onSurface} />
          </Pressable>
        }
      />

      {/* Filter Chips Bar */}
      <View style={styles.filterStrip}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <M3Chip
            label="All Tasks"
            selected={activeFilter === 'all'}
            onPress={() => setActiveFilter('all')}
            badge={tasks.length}
          />
          <M3Chip
            label="Due Today"
            selected={activeFilter === 'today'}
            onPress={() => setActiveFilter('today')}
            badge={tasks.filter((t) => (t.due_date || '').includes('Today')).length}
          />
          <M3Chip
            label="Upcoming"
            selected={activeFilter === 'upcoming'}
            onPress={() => setActiveFilter('upcoming')}
          />
          <M3Chip
            label="Completed"
            selected={activeFilter === 'completed'}
            onPress={() => setActiveFilter('completed')}
            badge={tasks.filter((t) => t.is_completed).length}
          />
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: spacing.lg }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
      >
        {filteredTasks.length === 0 ? (
          <M3EmptyState
            icon="checkbox-outline"
            title="All Caught Up"
            description="No deliverables match your current filter. Enjoy your momentum or capture a new task."
            actionTitle="Add New Task"
            onAction={() => router.push('/modal')}
          />
        ) : (
          filteredTasks.map((task) => {
            const priorityColor =
              task.priority === 'high'
                ? colors.error
                : task.priority === 'medium'
                ? colors.warning
                : colors.primary;

            return (
              <M3Card
                key={task.id}
                variant="elevated"
                style={[
                  styles.taskCard,
                  task.is_completed && { opacity: 0.65, backgroundColor: colors.surfaceVariant },
                ]}
                onPress={() => setSelectedTask(task)}
              >
                <View style={styles.taskCardRow}>
                  <Pressable
                    onPress={() => handleToggle(task.id)}
                    style={[
                      styles.checkbox,
                      {
                        borderColor: task.is_completed ? colors.primary : colors.outline,
                        backgroundColor: task.is_completed ? colors.primary : 'transparent',
                        borderRadius: radii.xs,
                      },
                    ]}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: task.is_completed }}
                  >
                    {task.is_completed && (
                      <Ionicons name="checkmark" size={16} color={colors.onPrimary} />
                    )}
                  </Pressable>

                  <View style={styles.taskBody}>
                    <Text
                      style={[
                        typography.titleMedium,
                        {
                          color: task.is_completed ? colors.onSurfaceVariant : colors.onSurface,
                          textDecorationLine: task.is_completed ? 'line-through' : 'none',
                        },
                      ]}
                    >
                      {task.title}
                    </Text>

                    {task.description ? (
                      <Text
                        style={[
                          typography.bodySmall,
                          { color: colors.onSurfaceVariant, marginTop: 2 },
                        ]}
                      >
                        {task.description}
                      </Text>
                    ) : null}

                    <View style={styles.taskTagsRow}>
                      <View
                        style={[
                          styles.categoryBadge,
                          {
                            backgroundColor: colors.surfaceVariant,
                            borderRadius: radii.full,
                          },
                        ]}
                      >
                        <Text style={[typography.labelSmall, { color: colors.onSurfaceVariant }]}>
                          {task.category}
                        </Text>
                      </View>

                      <Text style={[typography.labelSmall, { color: priorityColor, marginLeft: 8 }]}>
                        {task.priority.toUpperCase()}
                      </Text>

                      {task.due_date && (
                        <Text
                          style={[
                            typography.labelSmall,
                            { color: colors.onSurfaceVariant, marginLeft: 8 },
                          ]}
                        >
                          • {task.due_date}
                        </Text>
                      )}

                      {task.subtask_count ? (
                        <View style={styles.subtaskBadge}>
                          <Ionicons
                            name="git-branch-outline"
                            size={12}
                            color={colors.onSurfaceVariant}
                          />
                          <Text
                            style={[
                              typography.labelSmall,
                              { color: colors.onSurfaceVariant, marginLeft: 4 },
                            ]}
                          >
                            {task.completed_subtasks}/{task.subtask_count}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  </View>

                  <Pressable
                    onPress={() => handleDelete(task.id)}
                    style={styles.deleteButton}
                    accessibilityRole="button"
                    accessibilityLabel="Delete task"
                  >
                    <Ionicons name="trash-outline" size={18} color={colors.outline} />
                  </Pressable>
                </View>
              </M3Card>
            );
          })
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <M3FAB
        onPress={() => {
          haptic.medium();
          router.push('/modal');
        }}
        icon="add"
        style={styles.fab}
      />

      {/* Task Detail Modal */}
      <TaskDetailModal
        visible={Boolean(selectedTask)}
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
        onUpdated={loadTasks}
      />

      {/* Global Search Modal */}
      <GlobalSearchModal
        visible={searchVisible}
        onClose={() => setSearchVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchHeaderBtn: {
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterStrip: {
    paddingVertical: 10,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  scrollContent: {
    paddingTop: 6,
  },
  taskCard: {
    marginBottom: 12,
    padding: 14,
  },
  taskCardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  taskBody: {
    flex: 1,
  },
  taskTagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    flexWrap: 'wrap',
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  subtaskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  deleteButton: {
    padding: 4,
    marginLeft: 6,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
  },
});
