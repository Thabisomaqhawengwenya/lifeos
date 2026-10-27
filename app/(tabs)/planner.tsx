import React, { useState, useCallback } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Pressable,
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

type ViewMode = 'day' | 'week';

export default function PlannerScreen() {
  const { colors, spacing, radii, typography } = useAppTheme();
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);

  const daysOfWeek = [
    { day: 'Mon', date: '26', isToday: false },
    { day: 'Tue', date: '27', isToday: true },
    { day: 'Wed', date: '28', isToday: false },
    { day: 'Thu', date: '29', isToday: false },
    { day: 'Fri', date: '30', isToday: false },
    { day: 'Sat', date: '31', isToday: false },
    { day: 'Sun', date: '01', isToday: false },
  ];

  const loadPlannerTasks = useCallback(async () => {
    try {
      const all = await TaskRepository.getAllTasks();
      // Filter for items due today or all pending
      setTasks(all);
    } catch (err) {
      console.warn('Failed loading planner tasks:', err);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadPlannerTasks();
    }, [loadPlannerTasks])
  );

  const toggleTask = async (id: string) => {
    haptic.success();
    await TaskRepository.toggleTask(id);
    await loadPlannerTasks();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <M3Header
        title="Schedule & Planner"
        subtitle="Dynamic SQLite Timeline"
        rightAction={
          <View style={styles.viewModeChips}>
            <M3Chip
              label="Day"
              selected={viewMode === 'day'}
              onPress={() => setViewMode('day')}
            />
            <M3Chip
              label="Week"
              selected={viewMode === 'week'}
              onPress={() => setViewMode('week')}
            />
          </View>
        }
      />

      {/* Week Day Selector Strip */}
      <View style={[styles.weekStrip, { borderBottomColor: colors.outlineVariant }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.weekStripScroll}>
          {daysOfWeek.map((item, idx) => (
            <Pressable
              key={idx}
              onPress={() => haptic.selection()}
              style={[
                styles.dayButton,
                {
                  backgroundColor: item.isToday ? colors.primary : colors.surfaceVariant,
                  borderRadius: radii.lg,
                },
              ]}
            >
              <Text
                style={[
                  typography.labelSmall,
                  { color: item.isToday ? colors.onPrimary : colors.onSurfaceVariant },
                ]}
              >
                {item.day}
              </Text>
              <Text
                style={[
                  typography.titleMedium,
                  {
                    color: item.isToday ? colors.onPrimary : colors.onSurface,
                    fontWeight: '700',
                    marginTop: 2,
                  },
                ]}
              >
                {item.date}
              </Text>
              {item.isToday && (
                <View
                  style={[
                    styles.activeDot,
                    { backgroundColor: colors.accentGold, borderRadius: radii.full },
                  ]}
                />
              )}
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: spacing.lg }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[typography.titleLarge, { color: colors.onBackground, marginVertical: spacing.md }]}>
          Today's Scheduled Timeline ({tasks.length})
        </Text>

        {tasks.length === 0 ? (
          <M3EmptyState
            icon="calendar-outline"
            title="No Items Scheduled"
            description="Your planner timeline is clear. Schedule high-priority work or capture a new task."
            actionTitle="Add Schedule Item"
            onAction={() => router.push('/modal')}
          />
        ) : (
          tasks.map((task, index) => {
            const timeSlot = index === 0 ? '09:00 AM' : index === 1 ? '01:30 PM' : index === 2 ? '04:00 PM' : 'Anytime';
            const nodeColor =
              task.priority === 'high'
                ? colors.error
                : task.priority === 'medium'
                ? colors.primary
                : colors.tertiary;

            return (
              <View key={task.id} style={styles.timelineItem}>
                <View style={styles.timeColumn}>
                  <Text style={[typography.labelMedium, { color: colors.primary }]}>{timeSlot}</Text>
                  <Text style={[typography.labelSmall, { color: colors.onSurfaceVariant }]}>
                    {task.priority.toUpperCase()}
                  </Text>
                </View>

                <View style={[styles.timelineNode, { borderColor: nodeColor }]} />

                <M3Card
                  variant="elevated"
                  style={[styles.timelineCard, task.is_completed && { opacity: 0.6 }]}
                  onPress={() => setSelectedTask(task)}
                >
                  <View style={styles.cardInnerRow}>
                    <Pressable
                      onPress={() => toggleTask(task.id)}
                      style={[
                        styles.checkbox,
                        {
                          borderColor: task.is_completed ? colors.primary : colors.outline,
                          backgroundColor: task.is_completed ? colors.primary : 'transparent',
                          borderRadius: radii.xs,
                        },
                      ]}
                    >
                      {task.is_completed && (
                        <Ionicons name="checkmark" size={14} color={colors.onPrimary} />
                      )}
                    </Pressable>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          typography.titleMedium,
                          {
                            color: colors.onSurface,
                            textDecorationLine: task.is_completed ? 'line-through' : 'none',
                          },
                        ]}
                      >
                        {task.title}
                      </Text>
                      {task.description ? (
                        <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant, marginTop: 2 }]}>
                          {task.description}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                </M3Card>
              </View>
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
        icon="calendar-outline"
        style={styles.fab}
      />

      {/* Task Detail Modal */}
      <TaskDetailModal
        visible={Boolean(selectedTask)}
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
        onUpdated={loadPlannerTasks}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  viewModeChips: {
    flexDirection: 'row',
    gap: 6,
  },
  weekStrip: {
    borderBottomWidth: 1,
    paddingVertical: 10,
  },
  weekStripScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  dayButton: {
    width: 52,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeDot: {
    width: 4,
    height: 4,
    marginTop: 4,
  },
  scrollContent: {
    paddingTop: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  timeColumn: {
    width: 72,
    paddingTop: 4,
  },
  timelineNode: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 3,
    backgroundColor: '#fff',
    marginRight: 10,
    marginTop: 8,
  },
  timelineCard: {
    flex: 1,
    padding: 14,
  },
  cardInnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
  },
});
