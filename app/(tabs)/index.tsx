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
import { haptic } from '@/src/design-system/haptics';
import { TaskRepository, TaskItem } from '@/src/repositories/TaskRepository';
import { HabitRepository, HabitItem } from '@/src/repositories/HabitRepository';
import { TaskDetailModal } from '@/src/components/tasks/TaskDetailModal';
import { GlobalSearchModal } from '@/src/components/search/GlobalSearchModal';

export default function HomeScreen() {
  const { colors, spacing, radii, typography, isDark, mode, setThemeMode } = useAppTheme();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [habits, setHabits] = useState<HabitItem[]>([]);
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [searchVisible, setSearchVisible] = useState(false);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

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
    const today = new Date().toISOString().split('T')[0];
    await HabitRepository.toggleHabitCheckIn(habitId, today);
    await loadData();
  };

  const toggleTheme = () => {
    haptic.selection();
    if (mode === 'light') setThemeMode('dark');
    else if (mode === 'dark') setThemeMode('system');
    else setThemeMode('light');
  };

  const completedCount = tasks.filter((t) => t.is_completed).length;
  const bestStreak = habits.reduce((max, h) => Math.max(max, h.streak_current), 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <M3Header
        badge="LifeOS • Local SQLite"
        title={`${greeting}, Mr Q`}
        subtitle={todayFormatted}
        rightAction={
          <View style={styles.headerActions}>
            <Pressable
              onPress={() => setSearchVisible(true)}
              style={[
                styles.iconButton,
                { backgroundColor: colors.surfaceVariant, borderRadius: radii.full, marginRight: 8 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Global search"
            >
              <Ionicons name="search" size={18} color={colors.onSurface} />
            </Pressable>
            <Pressable
              onPress={toggleTheme}
              style={[
                styles.iconButton,
                {
                  backgroundColor: colors.surfaceVariant,
                  borderRadius: radii.full,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Toggle light or dark theme"
            >
              <Ionicons
                name={isDark ? 'moon' : 'sunny'}
                size={18}
                color={colors.primary}
              />
            </Pressable>
          </View>
        }
      />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: spacing.lg }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Daily Focus Hero Card */}
        <M3Card variant="elevated" style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View>
              <Text style={[typography.labelMedium, { color: colors.primary }]}>
                TODAY'S MOMENTUM
              </Text>
              <Text style={[typography.headlineMedium, { color: colors.onSurface, marginTop: 2 }]}>
                Clear Mind, Focused Work
              </Text>
            </View>
            <View
              style={[
                styles.focusBadge,
                {
                  backgroundColor: colors.primaryContainer,
                  borderRadius: radii.full,
                },
              ]}
            >
              <Ionicons name="sparkles" size={14} color={colors.onPrimaryContainer} />
              <Text
                style={[
                  typography.labelSmall,
                  { color: colors.onPrimaryContainer, marginLeft: 4, fontWeight: '700' },
                ]}
              >
                LIVE
              </Text>
            </View>
          </View>

          {/* Quick Metrics Bar */}
          <View style={[styles.metricsRow, { borderColor: colors.outlineVariant }]}>
            <View style={styles.metricItem}>
              <Text style={[typography.headlineLarge, { color: colors.primary }]}>
                {completedCount} / {tasks.length}
              </Text>
              <Text style={[typography.labelSmall, { color: colors.onSurfaceVariant }]}>
                Tasks Done
              </Text>
            </View>
            <View style={[styles.metricDivider, { backgroundColor: colors.outlineVariant }]} />
            <View style={styles.metricItem}>
              <Text style={[typography.headlineLarge, { color: colors.accentGold }]}>
                {bestStreak}d
              </Text>
              <Text style={[typography.labelSmall, { color: colors.onSurfaceVariant }]}>
                Active Streak
              </Text>
            </View>
            <View style={[styles.metricDivider, { backgroundColor: colors.outlineVariant }]} />
            <View style={styles.metricItem}>
              <Text style={[typography.headlineLarge, { color: colors.tertiary }]}>
                {habits.filter((h) => h.is_logged_today).length} / {habits.length}
              </Text>
              <Text style={[typography.labelSmall, { color: colors.onSurfaceVariant }]}>
                Habits Checked
              </Text>
            </View>
          </View>
        </M3Card>

        {/* AI Insight Pill */}
        <M3Card
          variant="filled"
          style={[styles.aiInsightCard, { backgroundColor: colors.tertiaryContainer }]}
        >
          <View style={styles.aiInsightRow}>
            <Ionicons name="bulb-outline" size={20} color={colors.onTertiaryContainer} />
            <Text
              style={[
                typography.bodySmall,
                { color: colors.onTertiaryContainer, flex: 1, marginLeft: spacing.sm },
              ]}
            >
              <Text style={{ fontWeight: '700' }}>AI Assistant: </Text>
              {tasks.filter((t) => !t.is_completed).length > 0
                ? `You have ${tasks.filter((t) => !t.is_completed).length} open deliverables. Stay locked in on high-priority items.`
                : 'All deliverables are completed! Great work maintaining zero backlog.'}
            </Text>
          </View>
        </M3Card>

        {/* Today's Priorities Section */}
        <View style={styles.sectionHeader}>
          <Text style={[typography.titleLarge, { color: colors.onBackground }]}>
            Today's Priorities
          </Text>
          <Pressable
            onPress={() => router.push('/(tabs)/tasks')}
            accessibilityRole="button"
          >
            <Text style={[typography.labelMedium, { color: colors.primary }]}>View all</Text>
          </Pressable>
        </View>

        {tasks.slice(0, 3).map((task) => (
          <M3Card
            key={task.id}
            variant="elevated"
            style={[styles.taskCard, task.is_completed && { opacity: 0.6 }]}
            onPress={() => setSelectedTask(task)}
          >
            <View style={styles.taskCardContent}>
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
                accessibilityRole="checkbox"
                accessibilityState={{ checked: task.is_completed }}
              >
                {task.is_completed && (
                  <Ionicons name="checkmark" size={16} color={colors.onPrimary} />
                )}
              </Pressable>
              <View style={styles.taskTextContainer}>
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
                <View style={styles.taskMetaRow}>
                  <View
                    style={[
                      styles.tagBadge,
                      { backgroundColor: colors.primaryContainer, borderRadius: radii.full },
                    ]}
                  >
                    <Text style={[typography.labelSmall, { color: colors.onPrimaryContainer }]}>
                      {task.category}
                    </Text>
                  </View>
                  <Text style={[typography.labelSmall, { color: colors.error, marginLeft: 8 }]}>
                    {task.priority.toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>
          </M3Card>
        ))}

        {/* Habits Snapshot Section */}
        <View style={styles.sectionHeader}>
          <Text style={[typography.titleLarge, { color: colors.onBackground }]}>
            Daily Habit Check-in
          </Text>
          <Pressable
            onPress={() => router.push('/(tabs)/life')}
            accessibilityRole="button"
          >
            <Text style={[typography.labelMedium, { color: colors.primary }]}>Manage</Text>
          </Pressable>
        </View>

        <View style={styles.chipsRow}>
          {habits.map((h) => (
            <M3Chip
              key={h.id}
              label={h.name}
              selected={Boolean(h.is_logged_today)}
              onPress={() => toggleHabit(h.id)}
              badge={`${h.streak_current}d`}
              icon={
                <Ionicons
                  name={h.is_logged_today ? 'flame' : 'flame-outline'}
                  size={14}
                  color={h.is_logged_today ? colors.onPrimary : colors.primary}
                />
              }
            />
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Action Button for Quick Capture */}
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
        onUpdated={loadData}
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingTop: 8,
  },
  heroCard: {
    marginBottom: 14,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  focusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    marginTop: 18,
    paddingTop: 14,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricDivider: {
    width: 1,
    height: 32,
  },
  aiInsightCard: {
    marginBottom: 20,
    padding: 12,
  },
  aiInsightRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 12,
  },
  taskCard: {
    marginBottom: 10,
    padding: 14,
  },
  taskCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  taskTextContainer: {
    flex: 1,
  },
  taskMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  tagBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
  },
});
