import { GlobalSearchModal } from '@/src/components/search/GlobalSearchModal';
import { TaskDetailModal } from '@/src/components/tasks/TaskDetailModal';
import { BrutalCard } from '@/src/components/ui/BrutalCard';
import { BrutalFAB } from '@/src/components/ui/BrutalFAB';
import { haptic } from '@/src/design-system/haptics';
import { useAppTheme } from '@/src/design-system/ThemeContext';
import { HabitItem, HabitRepository } from '@/src/repositories/HabitRepository';
import { TaskItem, TaskRepository } from '@/src/repositories/TaskRepository';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const { colors, spacing, isDark, mode, setThemeMode } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [habits, setHabits] = useState<HabitItem[]>([]);
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [searchVisible, setSearchVisible] = useState(false);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Evening';
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
  const pendingTasks = tasks.filter((t) => !t.is_completed);
  const bestStreak = habits.reduce((max, h) => Math.max(max, h.streak_current), 0);
  const shadowColor = isDark ? '#FFFFFF' : '#000000';
  const habitsLoggedToday = habits.filter((h) => h.is_logged_today).length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top bar — not using M3Header here, doing it inline for a different feel */}
      <View
        style={[
          styles.topBar,
          {
            paddingTop: Math.max(insets.top, 12) + 4,
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View style={styles.topBarLeft}>
          <Text style={[styles.greetingLabel, { color: isDark ? '#888' : '#666' }]}>
            {todayFormatted}
          </Text>
          <Text style={[styles.greetingName, { color: colors.onBackground }]}>
            {greeting}, Mr Q
          </Text>
        </View>
        <View style={styles.topBarRight}>
          <Pressable
            onPress={() => setSearchVisible(true)}
            style={[styles.iconBtn, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor }]}
            accessibilityRole="button"
            accessibilityLabel="Global search"
          >
            <Ionicons name="search" size={18} color={colors.onBackground} />
          </Pressable>
          <Pressable
            onPress={toggleTheme}
            style={[styles.iconBtn, { backgroundColor: colors.accentYellow, borderColor: colors.border, shadowColor }]}
            accessibilityRole="button"
            accessibilityLabel="Toggle theme"
          >
            <Ionicons name={isDark ? 'moon' : 'sunny'} size={18} color="#000000" />
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: spacing.base }]}
        showsVerticalScrollIndicator={false}
      >
        {/* 3-col metrics strip — standalone, not inside a card */}
        <View style={styles.metricsStrip}>
          <View style={[styles.metricBlock, { backgroundColor: colors.accentYellow, borderColor: colors.border, shadowColor }]}>
            <Text style={styles.metricNum}>{completedCount}/{tasks.length}</Text>
            <Text style={styles.metricLbl}>TASKS</Text>
          </View>
          <View style={[styles.metricBlock, { backgroundColor: colors.accentCoral, borderColor: colors.border, shadowColor }]}>
            <Text style={[styles.metricNum, { color: '#fff' }]}>{bestStreak}d</Text>
            <Text style={[styles.metricLbl, { color: '#fff' }]}>STREAK</Text>
          </View>
          <View style={[styles.metricBlock, { backgroundColor: colors.accentJade, borderColor: colors.border, shadowColor }]}>
            <Text style={styles.metricNum}>{habitsLoggedToday}/{habits.length}</Text>
            <Text style={styles.metricLbl}>HABITS</Text>
          </View>
        </View>

        {/* AI insight — inline banner, no card wrapper */}
        {pendingTasks.length > 0 && (
          <View style={[styles.insightBanner, { borderColor: colors.border, backgroundColor: colors.accentLilac }]}>
            <Ionicons name="sparkles" size={14} color="#000" />
            <Text style={styles.insightText}>
              {pendingTasks.length} open {pendingTasks.length === 1 ? 'task' : 'tasks'} — focus on high-priority items first.
            </Text>
          </View>
        )}

        {/* Priorities section */}
        <View style={styles.sectionRow}>
          <View style={styles.sectionLabelRow}>
            <View style={[styles.sectionPip, { backgroundColor: colors.accentYellow, borderColor: colors.border }]} />
            <Text style={[styles.sectionLabel, { color: colors.onBackground }]}>TODAY&apos;S PRIORITIES</Text>
          </View>
          <Pressable onPress={() => router.push('/(tabs)/tasks')} accessibilityRole="button">
            <Text style={[styles.viewAll, { color: isDark ? '#aaa' : '#555' }]}>{'all →'}</Text>
          </Pressable>
        </View>

        {tasks.length === 0 ? (
          <View style={[styles.emptyStrip, { borderColor: colors.border, backgroundColor: colors.surface }]}>
            <Text style={[styles.emptyStripText, { color: isDark ? '#888' : '#999' }]}>
              No tasks yet — tap + to capture your first one
            </Text>
          </View>
        ) : (
          tasks.slice(0, 3).map((task) => (
            <BrutalCard
              key={task.id}
              variant="elevated"
              style={[styles.taskCard, task.is_completed && { opacity: 0.55 }]}
              onPress={() => setSelectedTask(task)}
            >
              <View style={styles.taskRow}>
                <Pressable
                  onPress={() => toggleTask(task.id)}
                  style={[
                    styles.checkbox,
                    { borderColor: colors.border, backgroundColor: task.is_completed ? colors.accentYellow : colors.surface },
                  ]}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: task.is_completed }}
                >
                  {task.is_completed && <Ionicons name="checkmark" size={16} color="#000" />}
                </Pressable>
                <View style={styles.taskBody}>
                  <Text
                    style={[
                      styles.taskTitle,
                      { color: colors.onSurface, textDecorationLine: task.is_completed ? 'line-through' : 'none' },
                    ]}
                    numberOfLines={1}
                  >
                    {task.title}
                  </Text>
                  <View style={styles.taskMeta}>
                    <View style={[styles.badge, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                      <Text style={styles.badgeText}>{task.category.toUpperCase()}</Text>
                    </View>
                    <View
                      style={[
                        styles.badge,
                        {
                          borderColor: colors.border,
                          backgroundColor:
                            task.priority === 'high' ? colors.accentRed
                            : task.priority === 'medium' ? colors.accentYellow
                            : colors.accentSky,
                        },
                      ]}
                    >
                      <Text style={[styles.badgeText, { color: task.priority === 'high' ? '#fff' : '#000' }]}>
                        {task.priority.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={14} color={isDark ? '#666' : '#ccc'} />
              </View>
            </BrutalCard>
          ))
        )}

        {/* Habits section — grid cards instead of chips */}
        <View style={[styles.sectionRow, { marginTop: 28 }]}>
          <View style={styles.sectionLabelRow}>
            <View style={[styles.sectionPip, { backgroundColor: colors.accentJade, borderColor: colors.border }]} />
            <Text style={[styles.sectionLabel, { color: colors.onBackground }]}>HABIT STREAKS</Text>
          </View>
          <Pressable onPress={() => router.push('/(tabs)/life')} accessibilityRole="button">
            <Text style={[styles.viewAll, { color: isDark ? '#aaa' : '#555' }]}>{'manage →'}</Text>
          </Pressable>
        </View>

        <View style={styles.habitGrid}>
          {habits.map((h) => (
            <Pressable
              key={h.id}
              onPress={() => toggleHabit(h.id)}
              style={[
                styles.habitCard,
                {
                  backgroundColor: h.is_logged_today ? colors.accentJade : colors.surface,
                  borderColor: colors.border,
                  shadowColor,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`${h.name}, ${h.is_logged_today ? 'completed today' : 'tap to complete'}`}
            >
              <View style={styles.habitCardTop}>
                <Ionicons
                  name={h.is_logged_today ? 'flame' : 'flame-outline'}
                  size={20}
                  color={h.is_logged_today ? '#000' : isDark ? '#666' : '#bbb'}
                />
                <View style={[styles.streakPill, { backgroundColor: colors.accentYellow, borderColor: colors.border }]}>
                  <Text style={styles.streakPillText}>{h.streak_current}d</Text>
                </View>
              </View>
              <Text style={[styles.habitName, { color: h.is_logged_today ? '#000' : colors.onSurface }]} numberOfLines={2}>
                {h.name}
              </Text>
              <Text style={[styles.habitFreq, { color: h.is_logged_today ? '#333' : isDark ? '#666' : '#aaa' }]}>
                {h.target_days_per_week}×/week
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={{ height: 90 }} />
      </ScrollView>

      <BrutalFAB
        onPress={() => { haptic.medium(); router.push('/modal'); }}
        icon="add"
        style={styles.fab}
      />

      <TaskDetailModal
        visible={Boolean(selectedTask)}
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
        onUpdated={loadData}
      />

      <GlobalSearchModal
        visible={searchVisible}
        onClose={() => setSearchVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Top bar (inline, not M3Header)
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 2.5,
  },
  topBarLeft: { flex: 1 },
  topBarRight: { flexDirection: 'row', gap: 8 },
  greetingLabel: { fontSize: 12, fontWeight: '500', letterSpacing: 0.2 },
  greetingName: { fontFamily: 'SpaceMono', fontSize: 22, fontWeight: '900', marginTop: 2, letterSpacing: -0.5 },
  iconBtn: {
    width: 38, height: 38, borderWidth: 2, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
    shadowOffset: { width: 2, height: 2 }, shadowOpacity: 1, shadowRadius: 0, elevation: 2,
  },

  scrollContent: { paddingTop: 20, paddingBottom: 24 },

  // Metrics strip — standalone blocks, no card wrapper
  metricsStrip: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  metricBlock: {
    flex: 1, borderWidth: 2.5, borderRadius: 8,
    paddingVertical: 14, alignItems: 'center',
    shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 3,
  },
  metricNum: { fontFamily: 'SpaceMono', fontSize: 20, fontWeight: '900', color: '#000' },
  metricLbl: { fontFamily: 'SpaceMono', fontSize: 9, fontWeight: '700', color: '#000', marginTop: 3, letterSpacing: 0.8 },

  // Insight banner — inline, no card
  insightBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 2, borderRadius: 6, paddingHorizontal: 12, paddingVertical: 8,
    marginBottom: 24,
  },
  insightText: { flex: 1, fontSize: 13, fontWeight: '500', color: '#000', lineHeight: 18 },

  // Section headers
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  sectionPip: { width: 10, height: 10, borderRadius: 2, borderWidth: 1.5 },
  sectionLabel: { fontFamily: 'SpaceMono', fontSize: 12, fontWeight: '900', letterSpacing: 0.5 },
  viewAll: { fontSize: 13, fontWeight: '600' },

  // Empty strip
  emptyStrip: {
    borderWidth: 2, borderRadius: 8, borderStyle: 'dashed',
    paddingVertical: 20, alignItems: 'center', marginBottom: 8,
  },
  emptyStripText: { fontSize: 13 },

  // Task cards
  taskCard: { marginBottom: 8 },
  taskRow: { flexDirection: 'row', alignItems: 'center' },
  checkbox: {
    width: 24, height: 24, borderWidth: 2.5, borderRadius: 5,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
    shadowColor: '#000', shadowOffset: { width: 1.5, height: 1.5 }, shadowOpacity: 1, shadowRadius: 0, elevation: 2,
  },
  taskBody: { flex: 1 },
  taskTitle: { fontSize: 15, fontWeight: '600', marginBottom: 5 },
  taskMeta: { flexDirection: 'row', gap: 6 },
  badge: { borderWidth: 1.5, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 1 },
  badgeText: { fontFamily: 'SpaceMono', fontSize: 9, fontWeight: '700', color: '#000' },

  // Habit grid — 2 columns
  habitGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  habitCard: {
    width: '47%',
    borderWidth: 2.5, borderRadius: 10,
    padding: 14,
    shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 3,
  },
  habitCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  streakPill: {
    borderWidth: 1.5, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 1,
  },
  streakPillText: { fontFamily: 'SpaceMono', fontSize: 10, fontWeight: '700', color: '#000' },
  habitName: { fontSize: 14, fontWeight: '600', lineHeight: 19 },
  habitFreq: { fontSize: 11, marginTop: 4 },

  fab: { position: 'absolute', bottom: 24, right: 20 },
});
