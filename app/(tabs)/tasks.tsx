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
  const { colors, spacing, isDark } = useAppTheme();
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

  const filteredTasks = tasks.filter((t) => {
    if (activeFilter === 'today') return (t.due_date || '').includes('Today');
    if (activeFilter === 'upcoming') return !t.is_completed && !(t.due_date || '').includes('Today');
    if (activeFilter === 'completed') return t.is_completed;
    return true;
  });

  const pendingCount = tasks.filter((t) => !t.is_completed).length;
  const shadowColor = isDark ? '#FFFFFF' : '#000000';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <M3Header
        badge="DELIVERABLES • CRITICAL"
        title="Tasks Matrix"
        subtitle={`${pendingCount} open deliverables in local SQLite`}
        rightAction={
          <Pressable
            onPress={() => setSearchVisible(true)}
            style={[
              styles.searchHeaderBtn,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                shadowColor,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Search all items"
          >
            <Ionicons name="search" size={18} color={colors.onBackground} />
          </Pressable>
        }
      />

      {/* Filter Chips Bar */}
      <View style={[styles.filterStrip, { borderBottomColor: colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
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
            colorScheme="coral"
            badge={tasks.filter((t) => (t.due_date || '').includes('Today')).length}
          />
          <M3Chip
            label="UPCOMING"
            selected={activeFilter === 'upcoming'}
            onPress={() => setActiveFilter('upcoming')}
            colorScheme="sky"
          />
          <M3Chip
            label="DONE"
            selected={activeFilter === 'completed'}
            onPress={() => setActiveFilter('completed')}
            colorScheme="mint"
            badge={tasks.filter((t) => t.is_completed).length}
          />
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: spacing.base }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.accentYellow} />
        }
      >
        {filteredTasks.length === 0 ? (
          <M3EmptyState
            icon="checkbox-outline"
            title="NO DELIVERABLES FOUND"
            description="No items match your filter criteria. Capture a new task to keep your momentum high."
            actionTitle="ADD NEW DELIVERABLE"
            onAction={() => router.push('/modal')}
          />
        ) : (
          filteredTasks.map((task) => (
            <M3Card
              key={task.id}
              variant="elevated"
              style={[
                styles.taskCard,
                task.is_completed && { opacity: 0.65 },
              ]}
              onPress={() => setSelectedTask(task)}
            >
              <View style={styles.taskCardRow}>
                <Pressable
                  onPress={() => handleToggle(task.id)}
                  style={[
                    styles.checkbox,
                    {
                      borderColor: '#000000',
                      backgroundColor: task.is_completed ? colors.accentYellow : colors.surface,
                    },
                  ]}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: task.is_completed }}
                >
                  {task.is_completed && (
                    <Ionicons name="checkmark" size={18} color="#000000" />
                  )}
                </Pressable>

                <View style={styles.taskBody}>
                  <Text
                    style={[
                      styles.taskTitle,
                      {
                        color: colors.onSurface,
                        textDecorationLine: task.is_completed ? 'line-through' : 'none',
                      },
                    ]}
                  >
                    {task.title}
                  </Text>

                  {task.description ? (
                    <Text
                      style={[
                        styles.taskDesc,
                        { color: isDark ? '#A0A0A0' : '#555555' },
                      ]}
                      numberOfLines={2}
                    >
                      {task.description}
                    </Text>
                  ) : null}

                  <View style={styles.taskTagsRow}>
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryBadgeText}>
                        {task.category.toUpperCase()}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.priorityBadge,
                        {
                          backgroundColor:
                            task.priority === 'high'
                              ? colors.accentRed
                              : task.priority === 'medium'
                              ? colors.accentYellow
                              : colors.accentSky,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.priorityText,
                          { color: task.priority === 'high' ? '#FFFFFF' : '#000000' },
                        ]}
                      >
                        {task.priority.toUpperCase()}
                      </Text>
                    </View>

                    {task.due_date && (
                      <View style={styles.dueBadge}>
                        <Ionicons name="time-outline" size={12} color="#000000" />
                        <Text style={styles.dueText}>{task.due_date}</Text>
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
    width: 38,
    height: 38,
    borderWidth: 2,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  filterStrip: {
    paddingVertical: 10,
    borderBottomWidth: 2.5,
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
    borderWidth: 2.5,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 1.5, height: 1.5 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  taskBody: {
    flex: 1,
  },
  taskTitle: {
    fontFamily: 'SpaceMono',
    fontSize: 14,
    fontWeight: '700',
  },
  taskDesc: {
    fontSize: 12,
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
    borderWidth: 1.5,
    borderColor: '#000000',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: '#FFFFFF',
  },
  categoryBadgeText: {
    fontFamily: 'SpaceMono',
    fontSize: 9,
    fontWeight: '700',
    color: '#000000',
  },
  priorityBadge: {
    borderWidth: 1.5,
    borderColor: '#000000',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  priorityText: {
    fontFamily: 'SpaceMono',
    fontSize: 9,
    fontWeight: '700',
  },
  dueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#000000',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: '#FFFFFF',
    gap: 4,
  },
  dueText: {
    fontFamily: 'SpaceMono',
    fontSize: 9,
    fontWeight: '700',
    color: '#000000',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
  },
});
