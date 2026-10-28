import { TaskDetailModal } from '@/src/components/tasks/TaskDetailModal';
import { BrutalFAB } from '@/src/components/ui/BrutalFAB';
import { BrutalHeader } from '@/src/components/ui/BrutalHeader';
import { haptic } from '@/src/design-system/haptics';
import { useAppTheme } from '@/src/design-system/ThemeContext';
import { TaskItem, TaskRepository } from '@/src/repositories/TaskRepository';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

type ViewMode = 'day' | 'week';

// ── date helpers ──────────────────────────────────────────────────────────────

function getWeekDays(anchor: Date): Date[] {
  const days: Date[] = [];
  const dow = anchor.getDay(); // 0=Sun
  const monday = new Date(anchor);
  monday.setDate(anchor.getDate() - ((dow + 6) % 7)); // roll to Monday
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push(d);
  }
  return days;
}

function isoDate(d: Date) {
  return d.toISOString().split('T')[0]; // 'YYYY-MM-DD'
}

function sameDay(a: Date, b: Date) {
  return isoDate(a) === isoDate(b);
}

const DAY_LABELS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

// Match task.due_date (freeform text like "Today", "Tomorrow", "2026-10-28")
// against a calendar date.
function taskMatchesDate(task: TaskItem, date: Date): boolean {
  const due = (task.due_date || '').toLowerCase().trim();
  if (!due) return false;

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  if (due === 'today') return sameDay(date, today);
  if (due === 'tomorrow') return sameDay(date, tomorrow);
  if (due === 'next week') {
    const nextWeekStart = new Date(today);
    nextWeekStart.setDate(today.getDate() + (7 - ((today.getDay() + 6) % 7)));
    const nextWeekEnd = new Date(nextWeekStart);
    nextWeekEnd.setDate(nextWeekStart.getDate() + 6);
    return date >= nextWeekStart && date <= nextWeekEnd;
  }
  // Try ISO date match
  return due === isoDate(date);
}

// ── component ─────────────────────────────────────────────────────────────────

export default function PlannerScreen() {
  const { colors, spacing, isDark } = useAppTheme();
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);

  const weekDays = useMemo(() => getWeekDays(selectedDate), [selectedDate]);
  const today = useMemo(() => new Date(), []);
  const shadowColor = isDark ? '#FFFFFF' : '#000000';

  const loadTasks = useCallback(async () => {
    try {
      const all = await TaskRepository.getAllTasks();
      setTasks(all);
    } catch (err) {
      console.warn('Planner load error:', err);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadTasks(); }, [loadTasks]));

  const toggleTask = async (id: string) => {
    haptic.success();
    await TaskRepository.toggleTask(id);
    await loadTasks();
  };

  // Day view: tasks matching selectedDate
  const dayTasks = useMemo(
    () => tasks.filter((t) => taskMatchesDate(t, selectedDate)),
    [tasks, selectedDate]
  );

  // Week view: tasks bucketed by day
  const weekBuckets = useMemo(() =>
    weekDays.map((d) => ({
      date: d,
      tasks: tasks.filter((t) => taskMatchesDate(t, d)),
    })),
    [tasks, weekDays]
  );

  const unscheduled = useMemo(
    () => tasks.filter((t) => !t.due_date || t.due_date.trim() === ''),
    [tasks]
  );

  // ── sub-renders ────────────────────────────────────────────────────────────

  const renderTaskRow = (task: TaskItem, compact = false) => (
    <Pressable
      key={task.id}
      onPress={() => setSelectedTask(task)}
      style={[
        styles.taskRow,
        compact && styles.taskRowCompact,
        { borderColor: colors.border, backgroundColor: colors.surface, shadowColor },
        task.is_completed && { opacity: 0.5 },
      ]}
    >
      <Pressable
        onPress={() => toggleTask(task.id)}
        style={[
          styles.checkbox,
          { borderColor: colors.border, backgroundColor: task.is_completed ? colors.accentYellow : 'transparent' },
        ]}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: task.is_completed }}
      >
        {task.is_completed && <Ionicons name="checkmark" size={14} color="#000" />}
      </Pressable>

      <View style={styles.taskInfo}>
        <Text
          style={[
            styles.taskTitle,
            { color: colors.onSurface, textDecorationLine: task.is_completed ? 'line-through' : 'none' },
          ]}
          numberOfLines={1}
        >
          {task.title}
        </Text>
        {!compact && task.description ? (
          <Text style={[styles.taskDesc, { color: isDark ? '#888' : '#666' }]} numberOfLines={1}>
            {task.description}
          </Text>
        ) : null}
      </View>

      <View
        style={[
          styles.priorityDot,
          {
            backgroundColor:
              task.priority === 'high' ? colors.accentRed
              : task.priority === 'medium' ? colors.accentYellow
              : colors.accentSky,
          },
        ]}
      />
    </Pressable>
  );

  const renderDayView = () => (
    <>
      {dayTasks.length === 0 ? (
        <View style={[styles.emptyDay, { borderColor: colors.border }]}>
          <Text style={[styles.emptyDayTitle, { color: colors.onBackground }]}>Nothing scheduled</Text>
          <Text style={[styles.emptyDayNote, { color: isDark ? '#666' : '#aaa' }]}>
            Free day — or tap + to add something
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.dayCountRow}>
            <Text style={[styles.dayCount, { color: isDark ? '#888' : '#666' }]}>
              {dayTasks.length} {dayTasks.length === 1 ? 'item' : 'items'} scheduled
            </Text>
          </View>
          {dayTasks.map((t) => renderTaskRow(t))}
        </>
      )}

      {/* Unscheduled overflow */}
      {unscheduled.length > 0 && (
        <>
          <View style={[styles.divider, { borderColor: colors.border, marginTop: 24 }]} />
          <Text style={[styles.unscheduledLabel, { color: isDark ? '#666' : '#aaa' }]}>
            UNSCHEDULED ({unscheduled.length})
          </Text>
          {unscheduled.map((t) => renderTaskRow(t, true))}
        </>
      )}
    </>
  );

  const renderWeekView = () => (
    <>
      {weekBuckets.map(({ date, tasks: dayTs }) => {
        const isToday = sameDay(date, today);
        const label = DAY_LABELS[(date.getDay() + 6) % 7];
        const dateNum = date.getDate();
        const month = date.toLocaleString('en-US', { month: 'short' });

        return (
          <View key={isoDate(date)} style={styles.weekDayBlock}>
            {/* Day label row */}
            <View style={styles.weekDayHeader}>
              <View style={[styles.weekDayLabel, isToday && { backgroundColor: colors.accentYellow, borderColor: colors.border }]}>
                <Text style={[styles.weekDayName, { color: isToday ? '#000' : isDark ? '#888' : '#999' }]}>
                  {label}
                </Text>
                <Text style={[styles.weekDayNum, { color: isToday ? '#000' : colors.onBackground }]}>
                  {dateNum}
                </Text>
                <Text style={[styles.weekDayMonth, { color: isToday ? '#333' : isDark ? '#666' : '#bbb' }]}>
                  {month}
                </Text>
              </View>
              <View style={[styles.weekDayLine, { backgroundColor: colors.border }]} />
            </View>

            {dayTs.length === 0 ? (
              <Text style={[styles.weekEmpty, { color: isDark ? '#555' : '#ccc' }]}>—</Text>
            ) : (
              dayTs.map((t) => renderTaskRow(t, true))
            )}
          </View>
        );
      })}
    </>
  );

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <BrutalHeader
        badge="PLANNER"
        title="Schedule"
        subtitle={selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        rightAction={
          <View style={styles.toggleRow}>
            <Pressable
              onPress={() => setViewMode('day')}
              style={[
                styles.toggleBtn,
                {
                  backgroundColor: viewMode === 'day' ? colors.accentYellow : colors.surface,
                  borderColor: colors.border,
                  shadowColor,
                },
              ]}
            >
              <Text style={styles.toggleBtnText}>DAY</Text>
            </Pressable>
            <Pressable
              onPress={() => setViewMode('week')}
              style={[
                styles.toggleBtn,
                {
                  backgroundColor: viewMode === 'week' ? colors.accentYellow : colors.surface,
                  borderColor: colors.border,
                  shadowColor,
                },
              ]}
            >
              <Text style={styles.toggleBtnText}>WEEK</Text>
            </Pressable>
          </View>
        }
      />

      {/* Day strip — only meaningful in day view */}
      {viewMode === 'day' && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={[styles.dayStrip, { borderBottomColor: colors.border }]}
          contentContainerStyle={styles.dayStripContent}
        >
          {weekDays.map((d, i) => {
            const isSelected = sameDay(d, selectedDate);
            const isToday = sameDay(d, today);
            return (
              <Pressable
                key={i}
                onPress={() => { haptic.selection(); setSelectedDate(d); }}
                style={[
                  styles.dayBtn,
                  {
                    backgroundColor: isSelected ? colors.accentYellow : colors.surface,
                    borderColor: colors.border,
                    shadowColor,
                  },
                ]}
              >
                <Text style={[styles.dayBtnLabel, { color: isSelected ? '#000' : isDark ? '#888' : '#999' }]}>
                  {DAY_LABELS[i]}
                </Text>
                <Text style={[styles.dayBtnNum, { color: isSelected || isToday ? '#000' : colors.onBackground }]}>
                  {d.getDate()}
                </Text>
                {isToday && !isSelected && (
                  <View style={[styles.todayDot, { backgroundColor: colors.accentYellow }]} />
                )}
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      <ScrollView
        contentContainerStyle={[styles.body, { paddingHorizontal: spacing.base }]}
        showsVerticalScrollIndicator={false}
      >
        {viewMode === 'day' ? renderDayView() : renderWeekView()}
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
        onUpdated={loadTasks}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  toggleRow: { flexDirection: 'row', gap: 6 },
  toggleBtn: {
    borderWidth: 2, borderRadius: 6,
    paddingHorizontal: 12, paddingVertical: 6,
    shadowOffset: { width: 2, height: 2 }, shadowOpacity: 1, shadowRadius: 0, elevation: 2,
  },
  toggleBtnText: { fontFamily: 'SpaceMono', fontSize: 10, fontWeight: '700', color: '#000' },

  // Day strip
  dayStrip: { borderBottomWidth: 2.5, maxHeight: 78 },
  dayStripContent: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  dayBtn: {
    width: 52, borderWidth: 2, borderRadius: 8,
    paddingVertical: 8, alignItems: 'center',
    shadowOffset: { width: 2, height: 2 }, shadowOpacity: 1, shadowRadius: 0, elevation: 2,
  },
  dayBtnLabel: { fontFamily: 'SpaceMono', fontSize: 9, fontWeight: '700' },
  dayBtnNum: { fontFamily: 'SpaceMono', fontSize: 18, fontWeight: '900', marginTop: 1 },
  todayDot: { width: 5, height: 5, borderRadius: 3, marginTop: 3 },

  // Body
  body: { paddingTop: 18, paddingBottom: 16 },

  // Day count
  dayCountRow: { marginBottom: 12 },
  dayCount: { fontFamily: 'SpaceMono', fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },

  // Task rows
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  taskRowCompact: { padding: 9, borderRadius: 6 },
  checkbox: {
    width: 22, height: 22, borderWidth: 2, borderRadius: 4,
    alignItems: 'center', justifyContent: 'center', marginRight: 10,
  },
  taskInfo: { flex: 1 },
  taskTitle: { fontSize: 14, fontWeight: '600' },
  taskDesc: { fontSize: 12, marginTop: 2 },
  priorityDot: { width: 8, height: 8, borderRadius: 4, marginLeft: 8 },

  // Empty day
  emptyDay: {
    borderWidth: 2, borderStyle: 'dashed', borderRadius: 10,
    paddingVertical: 40, alignItems: 'center',
  },
  emptyDayTitle: { fontFamily: 'SpaceMono', fontSize: 15, fontWeight: '700' },
  emptyDayNote: { fontSize: 13, marginTop: 6 },

  // Divider + unscheduled
  divider: { borderTopWidth: 2, marginBottom: 12 },
  unscheduledLabel: { fontFamily: 'SpaceMono', fontSize: 10, fontWeight: '700', letterSpacing: 0.5, marginBottom: 10 },

  // Week view
  weekDayBlock: { marginBottom: 22 },
  weekDayHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  weekDayLabel: {
    borderWidth: 2, borderRadius: 6,
    paddingHorizontal: 10, paddingVertical: 4,
    alignItems: 'center', marginRight: 12, minWidth: 52,
  },
  weekDayName: { fontFamily: 'SpaceMono', fontSize: 9, fontWeight: '700' },
  weekDayNum: { fontFamily: 'SpaceMono', fontSize: 16, fontWeight: '900' },
  weekDayMonth: { fontFamily: 'SpaceMono', fontSize: 9, fontWeight: '700' },
  weekDayLine: { flex: 1, height: 2.5 },
  weekEmpty: { fontSize: 13, paddingLeft: 4, marginBottom: 4 },

  fab: { position: 'absolute', bottom: 24, right: 20 },
});
