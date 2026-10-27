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

type ViewMode = 'day' | 'week' | 'month';

export default function PlannerScreen() {
  const { colors, spacing, radii, typography } = useAppTheme();
  const [viewMode, setViewMode] = useState<ViewMode>('day');

  const daysOfWeek = [
    { day: 'Mon', date: '26', isToday: false },
    { day: 'Tue', date: '27', isToday: true },
    { day: 'Wed', date: '28', isToday: false },
    { day: 'Thu', date: '29', isToday: false },
    { day: 'Fri', date: '30', isToday: false },
    { day: 'Sat', date: '31', isToday: false },
    { day: 'Sun', date: '01', isToday: false },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <M3Header
        title="Schedule & Planner"
        subtitle="October 2026"
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
      <View style={[styles.weekStrip, { borderBottomColor: colors.divider }]}>
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
          Today's Timeline
        </Text>

        {/* Timeline item 1 */}
        <View style={styles.timelineItem}>
          <View style={styles.timeColumn}>
            <Text style={[typography.labelMedium, { color: colors.primary }]}>09:00 AM</Text>
            <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant }]}>10:00 AM</Text>
          </View>
          <View style={[styles.timelineNode, { borderColor: colors.primary }]} />
          <M3Card variant="elevated" style={styles.timelineCard}>
            <Text style={[typography.titleMedium, { color: colors.onSurface }]}>
              LifeOS Sprint Kickoff & Spec Review
            </Text>
            <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant, marginTop: 4 }]}>
              Deep dive into local SQLite schema, migrations, and Material 3 design tokens.
            </Text>
          </M3Card>
        </View>

        {/* Timeline item 2 */}
        <View style={styles.timelineItem}>
          <View style={styles.timeColumn}>
            <Text style={[typography.labelMedium, { color: colors.tertiary }]}>02:00 PM</Text>
            <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant }]}>03:30 PM</Text>
          </View>
          <View style={[styles.timelineNode, { borderColor: colors.tertiary }]} />
          <M3Card
            variant="filled"
            style={[styles.timelineCard, { backgroundColor: colors.surfaceVariant }]}
          >
            <Text style={[typography.titleMedium, { color: colors.onSurface }]}>
              Deep Engineering Block
            </Text>
            <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant, marginTop: 4 }]}>
              Execute Phase 2 task management repositories and offline state caching.
            </Text>
          </M3Card>
        </View>

        {/* Timeline item 3 */}
        <View style={styles.timelineItem}>
          <View style={styles.timeColumn}>
            <Text style={[typography.labelMedium, { color: colors.accentGold }]}>05:00 PM</Text>
            <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant }]}>05:30 PM</Text>
          </View>
          <View style={[styles.timelineNode, { borderColor: colors.accentGold }]} />
          <M3Card variant="outlined" style={styles.timelineCard}>
            <Text style={[typography.titleMedium, { color: colors.onSurface }]}>
              Daily Retrospective & Sync Check
            </Text>
            <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant, marginTop: 4 }]}>
              Verify commits, type safety, and tomorrow's priority agenda.
            </Text>
          </M3Card>
        </View>

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
    marginBottom: 16,
  },
  timeColumn: {
    width: 68,
    paddingTop: 4,
  },
  timelineNode: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 3,
    backgroundColor: '#fff',
    marginRight: 12,
    marginTop: 8,
  },
  timelineCard: {
    flex: 1,
    padding: 14,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
  },
});
