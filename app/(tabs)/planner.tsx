import React, { useState, useCallback, useMemo } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Pressable,
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
import { getWeekDays, WeekDayItem, getLocalDateString } from '@/src/utils/date';

type ViewMode = 'day' | 'week';

export default function PlannerScreen() {
  const { colors, spacing, typography, radii, shadowSmall, isDark } = useAppTheme();
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);

  // Dynamic timezone-safe week days generated from real current date
  const weekDays = useMemo(() => getWeekDays(new Date()), []);
  const todayStr = useMemo(() => getLocalDateString(new Date()), []);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <M3Header
        title="Planner"
        subtitle="Daily schedule and milestones"
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

      {/* Week Day Selector Strip */}
      <View
        style={[
          styles.weekStrip,
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
          contentContainerStyle={styles.weekStripScroll}
        >
          {weekDays.map((item) => {
            const isSelected = item.fullDate === selectedDate;
            const isToday = item.isToday;

            return (
              <Pressable
                key={item.fullDate}
                onPress={() => {
                  haptic.selection();
                  setSelectedDate(item.fullDate);
                }}
                style={[
                  styles.dayButton,
                  {
                    backgroundColor: isSelected
                      ? colors.yellow
                      : colors.surface,
                    borderColor: colors.border,
                    borderRadius: radii.md,
                    borderWidth: colors.borderWidth,
                    shadowColor: shadowSmall.shadowColor,
                    shadowOffset: shadowSmall.shadowOffset,
                    shadowOpacity: shadowSmall.shadowOpacity,
                    shadowRadius: shadowSmall.shadowRadius,
                    elevation: shadowSmall.elevation,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={`${item.day} ${item.date}`}
              >
                <Text
                  style={[
                    styles.dayLabel,
                    {
                      color: '#000000',
                      fontSize: typography.sizes.xs,
                    },
                  ]}
                >
                  {item.day}
                </Text>
                <Text
                  style={[
                    styles.dateNumber,
                    {
                      color: '#000000',
                      fontSize: typography.sizes.lg,
                      fontFamily: typography.fonts.numeric,
                    },
                  ]}
                >
                  {item.date}
                </Text>
                {isToday && (
                  <View
                    style={[
                      styles.activeDot,
                      { backgroundColor: '#000000' },
                    ]}
                  />
                )}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: spacing.grid2 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.timelineHeader}>
          <Text
            style={[
              styles.timelineTitle,
              { color: colors.text, fontSize: typography.sizes.sm },
            ]}
          >
            TASKS ({tasks.length})
          </Text>
        </View>

        {tasks.length === 0 ? (
          <M3EmptyState
            icon="calendar"
            title="NO TASKS SCHEDULED"
            description="Your planner timeline is completely clear. Schedule tasks or create an item."
            actionTitle="ADD A TASK"
            onAction={() => router.push('/modal')}
          />
        ) : (
          tasks.map((task, index) => {
            const timeSlot =
              index === 0
                ? '09:00 AM'
                : index === 1
                ? '01:30 PM'
                : index === 2
                ? '04:00 PM'
                : 'ANYTIME';

            return (
              <View key={task.id} style={styles.timelineItem}>
                <View style={styles.timeColumn}>
                  <Text
                    style={[
                      styles.timeSlot,
                      {
                        color: colors.text,
                        fontSize: typography.sizes.xs,
                        fontFamily: typography.fonts.numeric,
                      },
                    ]}
                  >
                    {timeSlot}
                  </Text>
                  {task.priority === 'high' && (
                    <View
                      style={[
                        styles.priorityTag,
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
                </View>

                {/* Timeline Track Node */}
                <View style={styles.lineTrack}>
                  <View
                    style={[
                      styles.timelineNode,
                      {
                        borderColor: colors.border,
                        borderWidth: colors.borderWidth,
                        backgroundColor: task.is_completed
                          ? colors.mint
                          : colors.yellow,
                        borderRadius: radii.sm,
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.verticalLine,
                      { backgroundColor: colors.border },
                    ]}
                  />
                </View>

                <M3Card
                  stripe="yellow"
                  style={[
                    styles.timelineCard,
                    task.is_completed && { opacity: 0.6 },
                  ]}
                  onPress={() => setSelectedTask(task)}
                >
                  <View style={styles.cardInnerRow}>
                    <Pressable
                      onPress={() => toggleTask(task.id)}
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

                    <View style={{ flex: 1 }}>
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
                            styles.categoryText,
                            {
                              color: colors.text,
                              fontSize: typography.sizes.xs,
                            },
                          ]}
                        >
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
  },
  weekStripScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  dayButton: {
    width: 54,
    height: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayLabel: {
    fontWeight: '700',
  },
  dateNumber: {
    fontWeight: '900',
    marginTop: 2,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 4,
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 24,
  },
  timelineHeader: {
    marginBottom: 16,
  },
  timelineTitle: {
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  timeColumn: {
    width: 78,
    paddingTop: 10,
  },
  timeSlot: {
    fontWeight: '700',
  },
  priorityTag: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  priorityText: {
    fontWeight: '700',
  },
  lineTrack: {
    width: 20,
    alignItems: 'center',
  },
  timelineNode: {
    width: 14,
    height: 14,
    marginTop: 12,
    zIndex: 2,
  },
  verticalLine: {
    width: 2,
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
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  taskTitle: {
    fontWeight: '700',
  },
  taskDesc: {
    fontWeight: '500',
    marginTop: 4,
    lineHeight: 16,
  },
  categoryBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  categoryText: {
    fontWeight: '700',
  },
});
