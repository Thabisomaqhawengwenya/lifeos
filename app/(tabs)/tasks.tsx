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
import { Feather } from '@expo/vector-icons';
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
  const { colors, spacing, typography, radii, shadowSmall, isDark } = useAppTheme();
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

  const todayCount = tasks.filter((t) => (t.due_date || '').includes('Today')).length;
  const upcomingCount = tasks.filter(
    (t) => !t.is_completed && !(t.due_date || '').includes('Today')
  ).length;
  const completedCount = tasks.filter((t) => t.is_completed).length;

  const filteredTasks = tasks.filter((t) => {
    if (activeFilter === 'today') return (t.due_date || '').includes('Today');
    if (activeFilter === 'upcoming')
      return !t.is_completed && !(t.due_date || '').includes('Today');
    if (activeFilter === 'completed') return t.is_completed;
    return true;
  });

  const pendingCount = tasks.filter((t) => !t.is_completed).length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <M3Header
        title="Tasks"
        subtitle={`${pendingCount} open task${pendingCount === 1 ? '' : 's'}`}
        rightAction={
          <Pressable
            onPress={() => {
              haptic.light();
              setSearchVisible(true);
            }}
            style={[
              styles.searchHeaderBtn,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderRadius: radii.sm,
                borderWidth: colors.borderWidth,
                shadowColor: shadowSmall.shadowColor,
                shadowOffset: shadowSmall.shadowOffset,
                shadowOpacity: shadowSmall.shadowOpacity,
                shadowRadius: shadowSmall.shadowRadius,
                elevation: shadowSmall.elevation,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Search all tasks"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Feather name="search" size={18} color={colors.text} />
          </Pressable>
        }
      />

      {/* Filter Chips Bar (Counts on ALL tabs) */}
      <View
        style={[
          styles.filterStrip,
          {
            backgroundColor: colors.surfaceAlt,
            borderBottomColor: colors.border,
            borderBottomWidth: colors.borderWidth,
          },
        ]}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          <M3Chip
            label="ALL"
            selected={activeFilter === 'all'}
            onPress={() => setActiveFilter('all')}
            badge={tasks.length}
          />
          <M3Chip
            label="TODAY"
            selected={activeFilter === 'today'}
            onPress={() => setActiveFilter('today')}
            badge={todayCount}
          />
          <M3Chip
            label="UPCOMING"
            selected={activeFilter === 'upcoming'}
            onPress={() => setActiveFilter('upcoming')}
            badge={upcomingCount}
          />
          <M3Chip
            label="DONE"
            selected={activeFilter === 'completed'}
            onPress={() => setActiveFilter('completed')}
            badge={completedCount}
          />
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: spacing.grid2 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.yellow}
          />
        }
      >
        {filteredTasks.length === 0 ? (
          <M3EmptyState
            icon="check-square"
            title="NO TASKS FOUND"
            description="No items match your filter criteria. Capture a new task to keep your momentum high."
            actionTitle="ADD A TASK"
            onAction={() => router.push('/modal')}
          />
        ) : (
          filteredTasks.map((task) => (
            <M3Card
              key={task.id}
              stripe="yellow"
              style={[
                styles.taskCard,
                task.is_completed && { opacity: 0.6 },
              ]}
              onPress={() => setSelectedTask(task)}
            >
              <View style={styles.taskCardRow}>
                <Pressable
                  onPress={() => handleToggle(task.id)}
                  style={[
                    styles.checkbox,
                    {
                      borderColor: colors.border,
                      borderWidth: colors.borderWidth,
                      borderRadius: radii.sm,
                      backgroundColor: task.is_completed
                        ? colors.yellow
                        : colors.surface,
                    },
                  ]}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: task.is_completed }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  {task.is_completed && (
                    <Feather name="check" size={16} color="#000000" />
                  )}
                </Pressable>

                <View style={styles.taskBody}>
                  <Text
                    style={[
                      styles.taskTitle,
                      {
                        color: colors.text,
                        fontSize: typography.sizes.base,
                        textDecorationLine: task.is_completed
                          ? 'line-through'
                          : 'none',
                      },
                    ]}
                  >
                    {task.title}
                  </Text>

                  {task.description ? (
                    <Text
                      style={[
                        styles.taskDesc,
                        {
                          color: colors.textMuted,
                          fontSize: typography.sizes.xs,
                        },
                      ]}
                      numberOfLines={2}
                    >
                      {task.description}
                    </Text>
                  ) : null}

                  <View style={styles.taskTagsRow}>
                    <View
                      style={[
                        styles.categoryBadge,
                        {
                          backgroundColor: colors.surfaceAlt,
                          borderColor: colors.border,
                          borderWidth: colors.borderWidth,
                          borderRadius: radii.sm,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.categoryBadgeText,
                          {
                            color: colors.text,
                            fontSize: typography.sizes.xs,
                          },
                        ]}
                      >
                        {task.category.toUpperCase()}
                      </Text>
                    </View>

                    {task.priority === 'high' && (
                      <View
                        style={[
                          styles.priorityBadge,
                          {
                            backgroundColor: colors.pink,
                            borderColor: colors.border,
                            borderWidth: colors.borderWidth,
                            borderRadius: radii.sm,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.priorityText,
                            {
                              color: '#FFFFFF',
                              fontSize: typography.sizes.xs,
                            },
                          ]}
                        >
                          HIGH
                        </Text>
                      </View>
                    )}

                    {task.due_date && (
                      <View
                        style={[
                          styles.dueBadge,
                          {
                            backgroundColor: colors.surfaceAlt,
                            borderColor: colors.border,
                            borderWidth: colors.borderWidth,
                            borderRadius: radii.sm,
                          },
                        ]}
                      >
                        <Feather name="clock" size={12} color={colors.text} />
                        <Text
                          style={[
                            styles.dueText,
                            {
                              color: colors.text,
                              fontSize: typography.sizes.xs,
                            },
                          ]}
                        >
                          {task.due_date}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            </M3Card>
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Action Button */}
      <M3FAB
        onPress={() => {
          haptic.medium();
          router.push('/modal');
        }}
        icon="add"
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
    width: 44,
    height: 44,
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
    paddingTop: 16,
    paddingBottom: 24,
  },
  taskCard: {
    marginBottom: 12,
  },
  taskCardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  taskBody: {
    flex: 1,
  },
  taskTitle: {
    fontWeight: '700',
  },
  taskDesc: {
    fontWeight: '500',
    marginTop: 4,
    lineHeight: 16,
  },
  taskTagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  categoryBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  categoryBadgeText: {
    fontWeight: '700',
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  priorityText: {
    fontWeight: '700',
  },
  dueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 4,
  },
  dueText: {
    fontWeight: '700',
  },
});
