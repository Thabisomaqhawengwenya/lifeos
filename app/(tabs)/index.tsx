import React, { useState, useCallback } from 'react';
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
import { M3Button } from '@/src/components/ui/M3Button';
import { M3FAB } from '@/src/components/ui/M3FAB';
import { haptic } from '@/src/design-system/haptics';
import { TaskRepository, TaskItem } from '@/src/repositories/TaskRepository';
import { HabitRepository, HabitItem } from '@/src/repositories/HabitRepository';
import { TaskDetailModal } from '@/src/components/tasks/TaskDetailModal';
import { NoteEditorModal } from '@/src/components/notes/NoteEditorModal';
import { GlobalSearchModal, createSearchSelectHandler } from '@/src/components/search/GlobalSearchModal';
import { NoteRepository, NoteItem } from '@/src/repositories/NoteAndGoalRepository';
import { SearchResultItem } from '@/src/repositories/SearchRepository';
import {
  getGreeting,
  formatHeaderDate,
  getLocalDateString,
} from '@/src/utils/date';

export default function TodayScreen() {
  const { colors, spacing, typography, radii, shadowSmall, isDark, mode, setThemeMode } =
    useAppTheme();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [habits, setHabits] = useState<HabitItem[]>([]);
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [selectedNote, setSelectedNote] = useState<NoteItem | null>(null);
  const [searchVisible, setSearchVisible] = useState(false);

  const handleSearchSelect = useCallback(async (item: SearchResultItem) => {
    setSearchVisible(false);
    if (item.type === 'task') {
      const t = await TaskRepository.getTaskById(item.id);
      if (t) setSelectedTask(t);
    } else if (item.type === 'note') {
      const n = await NoteRepository.getNoteById(item.id);
      if (n) setSelectedNote(n);
    } else if (item.type === 'habit') {
      router.navigate({
        pathname: '/(tabs)/life',
        params: { section: 'habits', itemId: item.id },
      });
    } else if (item.type === 'expense') {
      router.navigate({
        pathname: '/(tabs)/life',
        params: { section: 'finance', itemId: item.id },
      });
    } else if (item.type === 'goal') {
      router.navigate({
        pathname: '/(tabs)/life',
        params: { section: 'goals', itemId: item.id },
      });
    }
  }, []);

  const greeting = getGreeting();
  const todayFormatted = formatHeaderDate();

  const loadData = useCallback(async () => {
    try {
      const taskList = await TaskRepository.getAllTasks();
      setTasks(taskList);

      let habitList = await HabitRepository.getAllHabits();
      if (habitList.length === 0) {
        await HabitRepository.createHabit({
          name: 'Morning Deep Work',
          description: 'Focus block without notifications',
          targetDays: 5,
        });
        await HabitRepository.createHabit({
          name: 'Hydration 2.5L',
          description: 'Daily water intake',
          targetDays: 7,
        });
        habitList = await HabitRepository.getAllHabits();
      }
      setHabits(habitList);
    } catch (err) {
      console.warn('Failed loading home data:', err);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const toggleTask = async (id: string) => {
    haptic.success();
    await TaskRepository.toggleTask(id);
    await loadData();
  };

  const toggleHabit = async (habitId: string) => {
    haptic.selection();
    const today = getLocalDateString();
    await HabitRepository.toggleHabitCheckIn(habitId, today);
    await loadData();
  };

  const toggleTheme = () => {
    haptic.selection();
    if (mode === 'light') setThemeMode('dark');
    else if (mode === 'dark') setThemeMode('system');
    else setThemeMode('light');
  };

  const pendingTasks = tasks.filter((t) => !t.is_completed);
  const nextTask = pendingTasks[0] ?? null;
  const topTasks = tasks.slice(0, 3);
  const completedCount = tasks.filter((t) => t.is_completed).length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <M3Header
        title={`${greeting}, Mr Q`}
        subtitle={todayFormatted}
        rightAction={
          <View style={styles.headerActions}>
            <Pressable
              onPress={() => {
                haptic.light();
                setSearchVisible(true);
              }}
              style={[
                styles.iconButton,
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
              accessibilityLabel="Search"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Feather name="search" size={18} color={colors.text} />
            </Pressable>
            <Pressable
              onPress={toggleTheme}
              style={[
                styles.iconButton,
                {
                  backgroundColor: colors.yellow,
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
              accessibilityLabel="Toggle theme"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Feather
                name={isDark ? 'moon' : 'sun'}
                size={18}
                color="#000000"
              />
            </Pressable>
          </View>
        }
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: spacing.grid2 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Card: Next Action / Momentum */}
        {nextTask ? (
          <M3Card stripe="yellow" style={styles.heroCard}>
            <View style={styles.heroBadgeRow}>
              <View style={[styles.heroPill, { backgroundColor: colors.yellow }]}>
                <Text style={styles.heroPillText}>NEXT ACTION</Text>
              </View>
              <View style={[styles.priorityTag, { backgroundColor: colors.surfaceAlt }]}>
                <Text style={[styles.priorityTagText, { color: colors.text }]}>
                  {nextTask.category.toUpperCase()}
                </Text>
              </View>
            </View>

            <Text
              style={[
                styles.heroTaskTitle,
                { color: colors.text, fontSize: typography.sizes.lg },
              ]}
              numberOfLines={2}
            >
              {nextTask.title}
            </Text>

            <View style={styles.heroActionRow}>
              <M3Button
                title="Complete Task"
                variant="primary"
                size="sm"
                onPress={() => toggleTask(nextTask.id)}
                icon={<Feather name="check" size={16} color="#000000" />}
              />
              <M3Button
                title="Details"
                variant="secondary"
                size="sm"
                onPress={() => setSelectedTask(nextTask)}
              />
            </View>
          </M3Card>
        ) : (
          <M3Card stripe="mint" style={styles.heroCard}>
            <View style={styles.heroBadgeRow}>
              <View style={[styles.heroPill, { backgroundColor: colors.mint }]}>
                <Text style={styles.heroPillText}>ALL CLEAR</Text>
              </View>
            </View>
            <Text
              style={[
                styles.heroTaskTitle,
                { color: colors.text, fontSize: typography.sizes.lg },
              ]}
            >
              {tasks.length > 0 && completedCount === tasks.length
                ? 'All tasks completed for today!'
                : 'Nothing due. Plan tomorrow?'}
            </Text>
            <View style={{ marginTop: 12 }}>
              <M3Button
                title="Add a Task"
                variant="primary"
                size="sm"
                onPress={() => router.push('/modal')}
                icon={<Feather name="plus" size={16} color="#000000" />}
              />
            </View>
          </M3Card>
        )}

        {/* Tappable Habit Check-In Row */}
        <View style={styles.sectionHeader}>
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.text, fontSize: typography.sizes.sm },
            ]}
          >
            DAILY HABITS
          </Text>
          <Pressable
            onPress={() => router.push('/(tabs)/life')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text
              style={[
                styles.viewAllText,
                { color: colors.text, fontSize: typography.sizes.xs },
              ]}
            >
              MANAGE →
            </Text>
          </Pressable>
        </View>

        <View style={styles.habitsGrid}>
          {habits.map((h) => {
            const isChecked = Boolean(h.is_logged_today);
            return (
              <Pressable
                key={h.id}
                onPress={() => toggleHabit(h.id)}
                style={[
                  styles.habitItem,
                  {
                    backgroundColor: isChecked ? colors.mint : colors.surface,
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
                accessibilityLabel={`Check in ${h.name}`}
              >
                <View
                  style={[
                    styles.habitCheckCircle,
                    {
                      backgroundColor: isChecked ? '#000000' : colors.surfaceAlt,
                      borderColor: colors.border,
                      borderWidth: colors.borderWidth,
                    },
                  ]}
                >
                  <Feather
                    name={isChecked ? 'check' : 'circle'}
                    size={16}
                    color={isChecked ? '#FFFFFF' : colors.textMuted}
                  />
                </View>

                <View style={styles.habitMeta}>
                  <Text
                    style={[
                      styles.habitName,
                      { color: '#000000', fontSize: typography.sizes.sm },
                    ]}
                    numberOfLines={1}
                  >
                    {h.name}
                  </Text>
                  <Text
                    style={[
                      styles.habitStreak,
                      { color: isChecked ? '#000000' : colors.pink, fontSize: typography.sizes.xs },
                    ]}
                  >
                    {h.streak_current}d streak
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* AI Insight Card: Purple Role */}
        <M3Card stripe="purple" style={styles.aiCard}>
          <View style={styles.aiRow}>
            <View
              style={[
                styles.aiIconSlot,
                {
                  backgroundColor: colors.purple,
                  borderColor: colors.border,
                  borderWidth: colors.borderWidth,
                  borderRadius: radii.sm,
                },
              ]}
            >
              <Feather name="zap" size={18} color="#000000" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text
                style={[
                  styles.aiTag,
                  { color: colors.text, fontSize: typography.sizes.xs },
                ]}
              >
                OFFLINE AI INSIGHT
              </Text>
              <Text
                style={[
                  styles.aiMessage,
                  { color: colors.text, fontSize: typography.sizes.xs },
                ]}
              >
                {pendingTasks.length > 0
                  ? `You have ${pendingTasks.length} pending task${pendingTasks.length > 1 ? 's' : ''}. Complete the top priority first to maintain momentum.`
                  : completedCount > 0
                  ? 'All tasks completed today! Take time to recharge.'
                  : 'Start by capturing your top priority tasks for today.'}
              </Text>
            </View>
          </View>
        </M3Card>

        {/* Top 3 Tasks */}
        <View style={styles.sectionHeader}>
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.text, fontSize: typography.sizes.sm },
            ]}
          >
            TODAY'S TASKS
          </Text>
          <Pressable
            onPress={() => router.push('/(tabs)/tasks')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text
              style={[
                styles.viewAllText,
                { color: colors.text, fontSize: typography.sizes.xs },
              ]}
            >
              VIEW ALL →
            </Text>
          </Pressable>
        </View>

        {topTasks.length === 0 ? (
          <M3Card style={styles.emptyCard}>
            <Text
              style={[
                styles.emptyText,
                { color: colors.textMuted, fontSize: typography.sizes.sm },
              ]}
            >
              No tasks scheduled. Add your first task below.
            </Text>
          </M3Card>
        ) : (
          topTasks.map((task) => (
            <M3Card
              key={task.id}
              stripe="yellow"
              style={[styles.taskItemCard, task.is_completed && { opacity: 0.6 }]}
              onPress={() => setSelectedTask(task)}
            >
              <View style={styles.taskCardInner}>
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

                <View style={styles.taskInfo}>
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
                    numberOfLines={1}
                  >
                    {task.title}
                  </Text>
                  <View style={styles.taskPillRow}>
                    <View
                      style={[
                        styles.taskCatPill,
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
                          styles.taskCatText,
                          { color: colors.text, fontSize: typography.sizes.xs },
                        ]}
                      >
                        {task.category.toUpperCase()}
                      </Text>
                    </View>
                    {task.priority === 'high' && (
                      <View
                        style={[
                          styles.priorityPill,
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
                            styles.priorityPillText,
                            { color: '#FFFFFF', fontSize: typography.sizes.xs },
                          ]}
                        >
                          HIGH
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

      {/* Single Unified Floating Action Button */}
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
        onUpdated={loadData}
      />

      {/* Note Editor Modal */}
      <NoteEditorModal
        visible={Boolean(selectedNote)}
        note={selectedNote}
        onClose={() => setSelectedNote(null)}
        onSaved={() => {
          setSelectedNote(null);
          loadData();
        }}
      />

      {/* Global Search Modal */}
      <GlobalSearchModal
        visible={searchVisible}
        onClose={() => setSearchVisible(false)}
        onSelectItem={handleSearchSelect}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 24,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCard: {
    marginBottom: 20,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  heroPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 4,
  },
  heroPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#000000',
  },
  priorityTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 4,
  },
  priorityTagText: {
    fontSize: 12,
    fontWeight: '700',
  },
  heroTaskTitle: {
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  heroActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 12,
  },
  sectionTitle: {
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  viewAllText: {
    fontWeight: '700',
  },
  habitsGrid: {
    gap: 8,
    marginBottom: 16,
  },
  habitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    minHeight: 52,
  },
  habitCheckCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  habitMeta: {
    marginLeft: 12,
    flex: 1,
  },
  habitName: {
    fontWeight: '700',
  },
  habitStreak: {
    fontWeight: '700',
    marginTop: 2,
  },
  aiCard: {
    marginBottom: 16,
  },
  aiRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiIconSlot: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiTag: {
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  aiMessage: {
    fontWeight: '600',
    marginTop: 2,
    lineHeight: 18,
  },
  emptyCard: {
    padding: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontWeight: '500',
  },
  taskItemCard: {
    marginBottom: 10,
  },
  taskCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskInfo: {
    marginLeft: 12,
    flex: 1,
  },
  taskTitle: {
    fontWeight: '700',
  },
  taskPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  taskCatPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  taskCatText: {
    fontWeight: '700',
  },
  priorityPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  priorityPillText: {
    fontWeight: '700',
  },
});
