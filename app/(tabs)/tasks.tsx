import { GlobalSearchModal } from '@/src/components/search/GlobalSearchModal';
import { TaskDetailModal } from '@/src/components/tasks/TaskDetailModal';
import { BrutalFAB } from '@/src/components/ui/BrutalFAB';
import { BrutalHeader } from '@/src/components/ui/BrutalHeader';
import { haptic } from '@/src/design-system/haptics';
import { useAppTheme } from '@/src/design-system/ThemeContext';
import { TaskItem, TaskRepository } from '@/src/repositories/TaskRepository';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    Pressable,
    RefreshControl,
    SectionList,
    StyleSheet,
    Text,
    View
} from 'react-native';

type FilterType = 'all' | 'today' | 'upcoming' | 'done';

const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'today', label: 'Today' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'done', label: 'Done' },
];

export default function TasksScreen() {
  const { colors, isDark } = useAppTheme();
  const [filter, setFilter] = useState<FilterType>('all');
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [searchVisible, setSearchVisible] = useState(false);

  const loadTasks = useCallback(async () => {
    try {
      setTasks(await TaskRepository.getAllTasks());
    } catch (err) {
      console.warn('Error loading tasks:', err);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadTasks(); }, [loadTasks]));

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

  const filtered = tasks.filter((t) => {
    if (filter === 'today') return (t.due_date || '').toLowerCase().includes('today');
    if (filter === 'upcoming') return !t.is_completed && !(t.due_date || '').toLowerCase().includes('today');
    if (filter === 'done') return t.is_completed;
    return true;
  });

  // Group by priority for 'all' view, flat for others
  const sections =
    filter === 'all'
      ? [
          { title: 'HIGH', data: filtered.filter((t) => t.priority === 'high' && !t.is_completed) },
          { title: 'MEDIUM', data: filtered.filter((t) => t.priority === 'medium' && !t.is_completed) },
          { title: 'LOW', data: filtered.filter((t) => t.priority === 'low' && !t.is_completed) },
          { title: 'DONE', data: filtered.filter((t) => t.is_completed) },
        ].filter((s) => s.data.length > 0)
      : [{ title: '', data: filtered }];

  const pendingCount = tasks.filter((t) => !t.is_completed).length;
  const shadowColor = isDark ? '#FFFFFF' : '#000000';

  const priorityColor = (p: string) => {
    if (p === 'high') return colors.accentRed;
    if (p === 'medium') return colors.accentYellow;
    return colors.accentSky;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <BrutalHeader
        badge="TASKS"
        title="Task List"
        subtitle={`${pendingCount} pending`}
        rightAction={
          <Pressable
            onPress={() => setSearchVisible(true)}
            style={[styles.searchBtn, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor }]}
            accessibilityRole="button"
            accessibilityLabel="Search tasks"
          >
            <Ionicons name="search" size={18} color={colors.onBackground} />
          </Pressable>
        }
      />

      {/* Filter bar — text tabs, not chips */}
      <View style={[styles.filterBar, { borderBottomColor: colors.border, backgroundColor: colors.background }]}>
        {FILTERS.map(({ key, label }) => {
          const count =
            key === 'all' ? tasks.length
            : key === 'today' ? tasks.filter((t) => (t.due_date || '').toLowerCase().includes('today')).length
            : key === 'upcoming' ? tasks.filter((t) => !t.is_completed && !(t.due_date || '').toLowerCase().includes('today')).length
            : tasks.filter((t) => t.is_completed).length;

          return (
            <Pressable
              key={key}
              onPress={() => { haptic.selection(); setFilter(key); }}
              style={[
                styles.filterTab,
                filter === key && [styles.filterTabActive, { borderBottomColor: colors.accentYellow }],
              ]}
            >
              <Text style={[
                styles.filterTabText,
                { color: filter === key ? colors.onBackground : isDark ? '#666' : '#999' },
              ]}>
                {label}
              </Text>
              {count > 0 && (
                <View style={[styles.filterCount, {
                  backgroundColor: filter === key ? colors.accentYellow : isDark ? '#333' : '#eee',
                  borderColor: colors.border,
                }]}>
                  <Text style={[styles.filterCountText, { color: filter === key ? '#000' : isDark ? '#aaa' : '#666' }]}>
                    {count}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.accentYellow} />
        }
        contentContainerStyle={[styles.listContent, { paddingBottom: 90 }]}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={[styles.emptyTitle, { color: colors.onBackground }]}>Nothing here</Text>
            <Text style={[styles.emptyNote, { color: isDark ? '#555' : '#bbb' }]}>
              {filter === 'done' ? 'No completed tasks yet.' : 'Tap + to add a task.'}
            </Text>
          </View>
        }
        renderSectionHeader={({ section }) =>
          section.title ? (
            <View style={[styles.sectionHeader, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
              <View style={[styles.sectionHeaderPip, { backgroundColor: priorityColor(section.title.toLowerCase()) }]} />
              <Text style={[styles.sectionHeaderText, { color: isDark ? '#888' : '#999' }]}>
                {section.title}
              </Text>
              <Text style={[styles.sectionHeaderCount, { color: isDark ? '#555' : '#ccc' }]}>
                {section.data.length}
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item: task, index, section }) => {
          const isLast = index === section.data.length - 1;
          return (
            <Pressable
              onPress={() => setSelectedTask(task)}
              style={[
                styles.taskRow,
                { borderBottomColor: isLast ? 'transparent' : colors.border },
              ]}
            >
              {/* Priority stripe */}
              <View style={[styles.priorityStripe, { backgroundColor: task.is_completed ? 'transparent' : priorityColor(task.priority) }]} />

              {/* Checkbox */}
              <Pressable
                onPress={() => handleToggle(task.id)}
                style={[
                  styles.checkbox,
                  { borderColor: colors.border, backgroundColor: task.is_completed ? colors.accentYellow : 'transparent' },
                ]}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: task.is_completed }}
              >
                {task.is_completed && <Ionicons name="checkmark" size={14} color="#000" />}
              </Pressable>

              {/* Content */}
              <View style={styles.taskContent}>
                <Text
                  style={[
                    styles.taskTitle,
                    {
                      color: task.is_completed ? (isDark ? '#555' : '#bbb') : colors.onSurface,
                      textDecorationLine: task.is_completed ? 'line-through' : 'none',
                    },
                  ]}
                  numberOfLines={1}
                >
                  {task.title}
                </Text>
                <View style={styles.taskMeta}>
                  {task.description ? (
                    <Text style={[styles.taskDesc, { color: isDark ? '#666' : '#aaa' }]} numberOfLines={1}>
                      {task.description}
                    </Text>
                  ) : null}
                  <View style={styles.taskTags}>
                    <Text style={[styles.categoryTag, { color: isDark ? '#777' : '#999' }]}>
                      {task.category}
                    </Text>
                    {task.due_date ? (
                      <>
                        <Text style={[styles.dot, { color: isDark ? '#555' : '#ccc' }]}>·</Text>
                        <Text style={[styles.dueTag, { color: isDark ? '#777' : '#999' }]}>
                          {task.due_date}
                        </Text>
                      </>
                    ) : null}
                  </View>
                </View>
              </View>

              <Ionicons name="chevron-forward" size={14} color={isDark ? '#444' : '#ddd'} style={{ marginRight: 4 }} />
            </Pressable>
          );
        }}
      />

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

      <GlobalSearchModal
        visible={searchVisible}
        onClose={() => setSearchVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  searchBtn: {
    width: 38, height: 38, borderWidth: 2, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
    shadowOffset: { width: 2, height: 2 }, shadowOpacity: 1, shadowRadius: 0, elevation: 2,
  },

  // Filter bar — text tabs not chips
  filterBar: {
    flexDirection: 'row',
    borderBottomWidth: 2.5,
    paddingHorizontal: 16,
  },
  filterTab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 11, gap: 5, borderBottomWidth: 3, borderBottomColor: 'transparent',
  },
  filterTabActive: { borderBottomWidth: 3 },
  filterTabText: { fontFamily: 'SpaceMono', fontSize: 10, fontWeight: '700' },
  filterCount: {
    borderWidth: 1, borderRadius: 4,
    paddingHorizontal: 4, paddingVertical: 0, minWidth: 16, alignItems: 'center',
  },
  filterCountText: { fontFamily: 'SpaceMono', fontSize: 9, fontWeight: '700' },

  listContent: { paddingTop: 0 },

  // Section headers
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 16, paddingVertical: 8,
    borderBottomWidth: 1,
  },
  sectionHeaderPip: { width: 8, height: 8, borderRadius: 2 },
  sectionHeaderText: { fontFamily: 'SpaceMono', fontSize: 10, fontWeight: '700', flex: 1, letterSpacing: 0.5 },
  sectionHeaderCount: { fontFamily: 'SpaceMono', fontSize: 10, fontWeight: '700' },

  // Task rows — flat list style with priority stripe, no card borders
  taskRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 13, paddingRight: 12,
    borderBottomWidth: 1,
  },
  priorityStripe: { width: 3, alignSelf: 'stretch', marginRight: 12, borderRadius: 2 },
  checkbox: {
    width: 22, height: 22, borderWidth: 2, borderRadius: 4,
    alignItems: 'center', justifyContent: 'center', marginRight: 12, flexShrink: 0,
  },
  taskContent: { flex: 1, minWidth: 0 },
  taskTitle: { fontSize: 15, fontWeight: '600', marginBottom: 3 },
  taskMeta: { gap: 2 },
  taskDesc: { fontSize: 12, lineHeight: 16 },
  taskTags: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  categoryTag: { fontSize: 11 },
  dot: { fontSize: 11 },
  dueTag: { fontSize: 11 },

  // Empty state
  emptyWrap: { paddingTop: 60, alignItems: 'center', paddingHorizontal: 32 },
  emptyTitle: { fontFamily: 'SpaceMono', fontSize: 16, fontWeight: '700', marginBottom: 8 },
  emptyNote: { fontSize: 14, textAlign: 'center', lineHeight: 20 },

  fab: { position: 'absolute', bottom: 24, right: 20 },
});
