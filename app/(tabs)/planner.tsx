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
  const { colors, spacing, isDark } = useAppTheme();
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);

  const daysOfWeek = [
    { day: 'MON', date: '26', isToday: false },
    { day: 'TUE', date: '27', isToday: true },
    { day: 'WED', date: '28', isToday: false },
    { day: 'THU', date: '29', isToday: false },
    { day: 'FRI', date: '30', isToday: false },
    { day: 'SAT', date: '31', isToday: false },
    { day: 'SUN', date: '01', isToday: false },
  ];

  const loadPlannerTasks = useCallback(async () => {
    try {
      const all = await TaskRepository.getAllTasks();
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

  const shadowColor = isDark ? '#FFFFFF' : '#000000';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <M3Header
        badge="TIMELINE • CALENDAR"
        title="Schedule & Plan"
        subtitle="Dynamic SQLite Timeline Engine"
        rightAction={
          <View style={styles.viewModeChips}>
            <M3Chip
              label="DAY"
              selected={viewMode === 'day'}
              onPress={() => setViewMode('day')}
            />
            <M3Chip
              label="WEEK"
              selected={viewMode === 'week'}
              onPress={() => setViewMode('week')}
            />
          </View>
        }
      />

      {/* Week Day Selector Strip (Brutalist Blocks) */}
      <View style={[styles.weekStrip, { borderBottomColor: colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.weekStripScroll}>
          {daysOfWeek.map((item, idx) => (
            <Pressable
              key={idx}
              onPress={() => haptic.selection()}
              style={[
                styles.dayButton,
                {
                  backgroundColor: item.isToday ? colors.accentYellow : colors.surface,
                  borderColor: colors.border,
                  shadowColor,
                },
              ]}
            >
              <Text style={styles.dayLabel}>{item.day}</Text>
              <Text style={styles.dateNumber}>{item.date}</Text>
              {item.isToday && <View style={styles.activeDot} />}
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: spacing.base }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.timelineHeader}>
          <View style={styles.sectionDot} />
          <Text style={[styles.timelineTitle, { color: colors.onBackground }]}>
            SCHEDULED DELIVERABLES ({tasks.length})
          </Text>
        </View>

        {tasks.length === 0 ? (
          <M3EmptyState
            icon="calendar-outline"
            title="NO ITEMS SCHEDULED"
            description="Your planner timeline is completely clear. Schedule tasks or create an item."
            actionTitle="ADD SCHEDULE ITEM"
            onAction={() => router.push('/modal')}
          />
        ) : (
          tasks.map((task, index) => {
            const timeSlot = index === 0 ? '09:00 AM' : index === 1 ? '01:30 PM' : index === 2 ? '04:00 PM' : 'ANYTIME';

            return (
              <View key={task.id} style={styles.timelineItem}>
                <View style={styles.timeColumn}>
                  <Text style={styles.timeSlot}>{timeSlot}</Text>
                  <View
                    style={[
                      styles.priorityTag,
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
                </View>

                {/* Brutalist Timeline Node & Line */}
                <View style={styles.lineTrack}>
                  <View style={[styles.timelineNode, { borderColor: colors.border }]} />
                  <View style={[styles.verticalLine, { backgroundColor: colors.border }]} />
                </View>

                <M3Card
                  variant="elevated"
                  style={[styles.timelineCard, task.is_completed && { opacity: 0.65 }]}
                  onPress={() => setSelectedTask(task)}
                >
                  <View style={styles.cardInnerRow}>
                    <Pressable
                      onPress={() => toggleTask(task.id)}
                      style={[
                        styles.checkbox,
                        {
                          borderColor: '#000000',
                          backgroundColor: task.is_completed ? colors.accentYellow : colors.surface,
                        },
                      ]}
                    >
                      {task.is_completed && (
                        <Ionicons name="checkmark" size={16} color="#000000" />
                      )}
                    </Pressable>
                    <View style={{ flex: 1 }}>
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
                      <View style={styles.categoryBadge}>
                        <Text style={styles.categoryText}>
                          {task.category.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                  </View>
                </M3Card>
              </View>
            );
          })
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
    paddingVertical: 12,
    borderBottomWidth: 2.5,
  },
  weekStripScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  dayButton: {
    width: 52,
    height: 68,
    borderWidth: 2,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  dayLabel: {
    fontFamily: 'SpaceMono',
    fontSize: 10,
    fontWeight: '700',
    color: '#000000',
  },
  dateNumber: {
    fontFamily: 'SpaceMono',
    fontSize: 18,
    fontWeight: '900',
    color: '#000000',
    marginTop: 2,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#000000',
    marginTop: 4,
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 24,
  },
  timelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  sectionDot: {
    width: 10,
    height: 10,
    borderRadius: 2,
    backgroundColor: '#FFE500',
    borderWidth: 1.5,
    borderColor: '#000000',
  },
  timelineTitle: {
    fontFamily: 'SpaceMono',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  timeColumn: {
    width: 76,
    paddingTop: 10,
  },
  timeSlot: {
    fontFamily: 'SpaceMono',
    fontSize: 11,
    fontWeight: '700',
    color: '#000000',
  },
  priorityTag: {
    borderWidth: 1.5,
    borderColor: '#000000',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  priorityText: {
    fontFamily: 'SpaceMono',
    fontSize: 8,
    fontWeight: '700',
  },
  lineTrack: {
    width: 20,
    alignItems: 'center',
  },
  timelineNode: {
    width: 12,
    height: 12,
    borderRadius: 3,
    backgroundColor: '#FFE500',
    borderWidth: 2,
    marginTop: 14,
    zIndex: 2,
  },
  verticalLine: {
    width: 2.5,
    flex: 1,
    marginTop: -2,
  },
  timelineCard: {
    flex: 1,
    marginLeft: 8,
  },
  cardInnerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 2,
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
  categoryBadge: {
    borderWidth: 1.5,
    borderColor: '#000000',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 1,
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    marginTop: 6,
  },
  categoryText: {
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
