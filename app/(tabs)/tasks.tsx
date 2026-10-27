import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/src/design-system/ThemeContext';
import { M3Header } from '@/src/components/ui/M3Header';
import { M3Card } from '@/src/components/ui/M3Card';
import { M3Chip } from '@/src/components/ui/M3Chip';
import { M3FAB } from '@/src/components/ui/M3FAB';
import { haptic } from '@/src/design-system/haptics';

type FilterType = 'all' | 'today' | 'upcoming' | 'completed';

interface MockTask {
  id: string;
  title: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
  dueDate: string;
  completed: boolean;
  subtaskCount: number;
  completedSubtasks: number;
}

export default function TasksScreen() {
  const { colors, spacing, radii, typography } = useAppTheme();
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [tasks, setTasks] = useState<MockTask[]>([
    {
      id: '1',
      title: 'Review LifeOS Architecture Blueprint',
      category: 'Architecture',
      priority: 'high',
      dueDate: 'Today',
      completed: false,
      subtaskCount: 3,
      completedSubtasks: 1,
    },
    {
      id: '2',
      title: 'Execute SQLite Phase 2 Migrations',
      category: 'Database',
      priority: 'high',
      dueDate: 'Today 3:00 PM',
      completed: false,
      subtaskCount: 4,
      completedSubtasks: 0,
    },
    {
      id: '3',
      title: 'Configure Material 3 Light/Dark Tokens',
      category: 'UI/UX',
      priority: 'medium',
      dueDate: 'Completed',
      completed: true,
      subtaskCount: 2,
      completedSubtasks: 2,
    },
    {
      id: '4',
      title: 'Review Supabase Row Level Security Rules',
      category: 'Security',
      priority: 'medium',
      dueDate: 'Tomorrow',
      completed: false,
      subtaskCount: 2,
      completedSubtasks: 0,
    },
  ]);

  const toggleTask = (id: string) => {
    haptic.success();
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const filteredTasks = tasks.filter((t) => {
    if (activeFilter === 'today') return t.dueDate.includes('Today');
    if (activeFilter === 'upcoming') return !t.completed && !t.dueDate.includes('Today');
    if (activeFilter === 'completed') return t.completed;
    return true;
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <M3Header
        title="Tasks & Projects"
        subtitle={`${tasks.filter((t) => !t.completed).length} pending deliverables`}
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
            badge={tasks.filter((t) => t.dueDate.includes('Today')).length}
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
            badge={tasks.filter((t) => t.completed).length}
          />
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: spacing.lg }]}
        showsVerticalScrollIndicator={false}
      >
        {filteredTasks.map((task) => {
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
                task.completed && { opacity: 0.65, backgroundColor: colors.surfaceVariant },
              ]}
            >
              <View style={styles.taskCardRow}>
                <Pressable
                  onPress={() => toggleTask(task.id)}
                  style={[
                    styles.checkbox,
                    {
                      borderColor: task.completed ? colors.primary : colors.outline,
                      backgroundColor: task.completed ? colors.primary : 'transparent',
                      borderRadius: radii.xs,
                    },
                  ]}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: task.completed }}
                >
                  {task.completed && (
                    <Ionicons name="checkmark" size={16} color={colors.onPrimary} />
                  )}
                </Pressable>

                <View style={styles.taskBody}>
                  <Text
                    style={[
                      typography.titleMedium,
                      {
                        color: task.completed ? colors.onSurfaceVariant : colors.onSurface,
                        textDecorationLine: task.completed ? 'line-through' : 'none',
                      },
                    ]}
                  >
                    {task.title}
                  </Text>

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

                    <Text
                      style={[
                        typography.labelSmall,
                        { color: colors.onSurfaceVariant, marginLeft: 8 },
                      ]}
                    >
                      • {task.dueDate}
                    </Text>

                    {task.subtaskCount > 0 && (
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
                          {task.completedSubtasks}/{task.subtaskCount}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            </M3Card>
          );
        })}

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
  },
});
