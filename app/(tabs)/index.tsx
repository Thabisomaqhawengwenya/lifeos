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
  const { colors, spacing, isDark, mode, setThemeMode } = useAppTheme();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [habits, setHabits] = useState<HabitItem[]>([]);
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [searchVisible, setSearchVisible] = useState(false);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
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
  const shadowColor = isDark ? '#FFFFFF' : '#000000';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <M3Header
        badge="NEO-BRUTALISM • V1.1.0"
        title={`${greeting}, Mr Q`}
        subtitle={`${todayFormatted} • Local SQLite Active`}
        rightAction={
          <View style={styles.headerActions}>
            <Pressable
              onPress={() => setSearchVisible(true)}
              style={[
                styles.iconButton,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  shadowColor,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Global search"
            >
              <Ionicons name="search" size={18} color={colors.onBackground} />
            </Pressable>
            <Pressable
              onPress={toggleTheme}
              style={[
                styles.iconButton,
                {
                  backgroundColor: colors.accentYellow,
                  borderColor: colors.border,
                  shadowColor,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Toggle light or dark theme"
            >
              <Ionicons
                name={isDark ? 'moon' : 'sunny'}
                size={18}
                color="#000000"
              />
            </Pressable>
          </View>
        }
      />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: spacing.base }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Daily Focus Hero Card (Neo-Brutalist Layout) */}
        <M3Card variant="elevated" style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View>
              <View style={styles.eyebrowTag}>
                <Text style={styles.eyebrowText}>DAILY MOMENTUM</Text>
              </View>
              <Text style={[styles.heroHeadline, { color: colors.onSurface }]}>
                Execution Mode
              </Text>
            </View>
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>SYNCED</Text>
            </View>
          </View>

          {/* Quick Metrics Bar (3 Distinct Brutalist Blocks) */}
          <View style={styles.metricsGrid}>
            <View style={[styles.metricTile, { backgroundColor: colors.accentYellow }]}>
              <Text style={styles.metricVal}>
                {completedCount}/{tasks.length}
              </Text>
              <Text style={styles.metricLbl}>TASKS</Text>
            </View>

            <View style={[styles.metricTile, { backgroundColor: colors.accentCoral }]}>
              <Text style={[styles.metricVal, { color: '#FFFFFF' }]}>
                {bestStreak}d
              </Text>
              <Text style={[styles.metricLbl, { color: '#FFFFFF' }]}>STREAK</Text>
            </View>

            <View style={[styles.metricTile, { backgroundColor: colors.accentJade }]}>
              <Text style={styles.metricVal}>
                {habits.filter((h) => h.is_logged_today).length}/{habits.length}
              </Text>
              <Text style={styles.metricLbl}>HABITS</Text>
            </View>
          </View>
        </M3Card>

        {/* AI Insight Card (Tuckii Lilac with Brutalist Border & Shadow) */}
        <M3Card variant="lilac" style={styles.aiInsightCard}>
          <View style={styles.aiInsightRow}>
            <View style={styles.aiIconBox}>
              <Ionicons name="sparkles" size={18} color="#000000" />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.aiTag}>OFFLINE AI INSIGHT</Text>
              <Text style={styles.aiMessage}>
                {tasks.filter((t) => !t.is_completed).length > 0
                  ? `You have ${tasks.filter((t) => !t.is_completed).length} open deliverables. Stay locked in on high-priority items today.`
                  : 'All deliverables are completed! Zero backlog maintained.'}
              </Text>
            </View>
          </View>
        </M3Card>

        {/* Today's Priorities Section Header */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.sectionDot} />
            <Text style={[styles.sectionTitle, { color: colors.onBackground }]}>
              TODAY'S PRIORITIES
            </Text>
          </View>
          <Pressable
            onPress={() => router.push('/(tabs)/tasks')}
            style={styles.viewAllBtn}
            accessibilityRole="button"
          >
            <Text style={styles.viewAllText}>VIEW ALL →</Text>
          </Pressable>
        </View>

        {tasks.slice(0, 3).map((task) => (
          <M3Card
            key={task.id}
            variant="elevated"
            style={[styles.taskCard, task.is_completed && { opacity: 0.65 }]}
            onPress={() => setSelectedTask(task)}
          >
            <View style={styles.taskCardContent}>
              <Pressable
                onPress={() => toggleTask(task.id)}
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
              <View style={styles.taskTextContainer}>
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
                <View style={styles.taskMetaRow}>
                  <View style={styles.tagBadge}>
                    <Text style={styles.tagBadgeText}>
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
                        {
                          color: task.priority === 'high' ? '#FFFFFF' : '#000000',
                        },
                      ]}
                    >
                      {task.priority.toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </M3Card>
        ))}

        {/* Daily Habits Check-in Section Header */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <View style={[styles.sectionDot, { backgroundColor: colors.accentJade }]} />
            <Text style={[styles.sectionTitle, { color: colors.onBackground }]}>
              HABIT STREAKS
            </Text>
          </View>
          <Pressable
            onPress={() => router.push('/(tabs)/life')}
            style={styles.viewAllBtn}
            accessibilityRole="button"
          >
            <Text style={styles.viewAllText}>MANAGE →</Text>
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
              colorScheme="mint"
              icon={
                <Ionicons
                  name={h.is_logged_today ? 'flame' : 'flame-outline'}
                  size={14}
                  color="#000000"
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
  heroCard: {
    marginBottom: 16,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  eyebrowTag: {
    backgroundColor: '#FFE500',
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  eyebrowText: {
    fontFamily: 'SpaceMono',
    fontSize: 9,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: 0.5,
  },
  heroHeadline: {
    fontFamily: 'SpaceMono',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00C853',
  },
  liveText: {
    fontFamily: 'SpaceMono',
    fontSize: 9,
    fontWeight: '700',
    color: '#000000',
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  metricTile: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  metricVal: {
    fontFamily: 'SpaceMono',
    fontSize: 18,
    fontWeight: '900',
    color: '#000000',
  },
  metricLbl: {
    fontFamily: 'SpaceMono',
    fontSize: 9,
    fontWeight: '700',
    color: '#000000',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  aiInsightCard: {
    marginBottom: 20,
  },
  aiInsightRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#FFE500',
    borderWidth: 2,
    borderColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  aiTag: {
    fontFamily: 'SpaceMono',
    fontSize: 10,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: 0.5,
  },
  aiMessage: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000000',
    marginTop: 2,
    lineHeight: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 6,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionDot: {
    width: 10,
    height: 10,
    borderRadius: 2,
    backgroundColor: '#FFE500',
    borderWidth: 1.5,
    borderColor: '#000000',
  },
  sectionTitle: {
    fontFamily: 'SpaceMono',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  viewAllBtn: {
    borderWidth: 1.5,
    borderColor: '#000000',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: '#FFFFFF',
  },
  viewAllText: {
    fontFamily: 'SpaceMono',
    fontSize: 10,
    fontWeight: '700',
    color: '#000000',
  },
  taskCard: {
    marginBottom: 10,
  },
  taskCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 26,
    height: 26,
    borderWidth: 2.5,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 1.5, height: 1.5 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  taskTextContainer: {
    flex: 1,
  },
  taskTitle: {
    fontFamily: 'SpaceMono',
    fontSize: 14,
    fontWeight: '700',
  },
  taskMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
  },
  tagBadge: {
    borderWidth: 1.5,
    borderColor: '#000000',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 1,
    backgroundColor: '#FFFFFF',
  },
  tagBadgeText: {
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
    paddingVertical: 1,
  },
  priorityText: {
    fontFamily: 'SpaceMono',
    fontSize: 9,
    fontWeight: '700',
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
