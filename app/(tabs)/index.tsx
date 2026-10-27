import React from 'react';
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
import { M3Button } from '@/src/components/ui/M3Button';
import { M3Chip } from '@/src/components/ui/M3Chip';
import { M3FAB } from '@/src/components/ui/M3FAB';
import { haptic } from '@/src/design-system/haptics';

export default function HomeScreen() {
  const { colors, spacing, radii, typography, isDark, mode, setThemeMode } = useAppTheme();

  // Dynamic greeting based on time of day
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  const toggleTheme = () => {
    haptic.selection();
    if (mode === 'light') setThemeMode('dark');
    else if (mode === 'dark') setThemeMode('system');
    else setThemeMode('light');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <M3Header
        badge="LifeOS v1.0"
        title={`${greeting}, Mr Q`}
        subtitle={todayFormatted}
        rightAction={
          <Pressable
            onPress={toggleTheme}
            style={[
              styles.themeToggle,
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
                OPTIMIZED
              </Text>
            </View>
          </View>

          {/* Quick Metrics Bar */}
          <View style={[styles.metricsRow, { borderColor: colors.divider }]}>
            <View style={styles.metricItem}>
              <Text style={[typography.headlineLarge, { color: colors.primary }]}>3 / 5</Text>
              <Text style={[typography.labelSmall, { color: colors.onSurfaceVariant }]}>
                Tasks Due
              </Text>
            </View>
            <View style={[styles.metricDivider, { backgroundColor: colors.divider }]} />
            <View style={styles.metricItem}>
              <Text style={[typography.headlineLarge, { color: colors.accentGold }]}>4</Text>
              <Text style={[typography.labelSmall, { color: colors.onSurfaceVariant }]}>
                Habit Streak
              </Text>
            </View>
            <View style={[styles.metricDivider, { backgroundColor: colors.divider }]} />
            <View style={styles.metricItem}>
              <Text style={[typography.headlineLarge, { color: colors.tertiary }]}>2</Text>
              <Text style={[typography.labelSmall, { color: colors.onSurfaceVariant }]}>
                Events
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
              Your schedule is open between 2:00 PM and 4:30 PM. Ideal window to finish high-priority deliverables.
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

        {/* Priority Task Cards */}
        <M3Card variant="outlined" style={styles.taskCard}>
          <View style={styles.taskCardContent}>
            <Pressable
              onPress={() => haptic.success()}
              style={[
                styles.checkbox,
                { borderColor: colors.outline, borderRadius: radii.xs },
              ]}
              accessibilityRole="checkbox"
              accessibilityLabel="Mark complete"
            >
              <Ionicons name="checkmark" size={16} color="transparent" />
            </Pressable>
            <View style={styles.taskTextContainer}>
              <Text style={[typography.titleMedium, { color: colors.onSurface }]}>
                Review LifeOS Architecture Blueprint
              </Text>
              <View style={styles.taskMetaRow}>
                <View
                  style={[
                    styles.tagBadge,
                    { backgroundColor: colors.primaryContainer, borderRadius: radii.full },
                  ]}
                >
                  <Text style={[typography.labelSmall, { color: colors.onPrimaryContainer }]}>
                    Architecture
                  </Text>
                </View>
                <Text style={[typography.labelSmall, { color: colors.error, marginLeft: 8 }]}>
                  High Priority
                </Text>
              </View>
            </View>
          </View>
        </M3Card>

        <M3Card variant="outlined" style={styles.taskCard}>
          <View style={styles.taskCardContent}>
            <Pressable
              onPress={() => haptic.success()}
              style={[
                styles.checkbox,
                { borderColor: colors.outline, borderRadius: radii.xs },
              ]}
              accessibilityRole="checkbox"
              accessibilityLabel="Mark complete"
            >
              <Ionicons name="checkmark" size={16} color="transparent" />
            </Pressable>
            <View style={styles.taskTextContainer}>
              <Text style={[typography.titleMedium, { color: colors.onSurface }]}>
                Execute SQLite Phase 2 Migrations
              </Text>
              <View style={styles.taskMetaRow}>
                <View
                  style={[
                    styles.tagBadge,
                    { backgroundColor: colors.secondaryContainer, borderRadius: radii.full },
                  ]}
                >
                  <Text style={[typography.labelSmall, { color: colors.onSecondaryContainer }]}>
                    Database
                  </Text>
                </View>
                <Text
                  style={[
                    typography.labelSmall,
                    { color: colors.onSurfaceVariant, marginLeft: 8 },
                  ]}
                >
                  Today 3:00 PM
                </Text>
              </View>
            </View>
          </View>
        </M3Card>

        {/* Habits Snapshot Section */}
        <View style={styles.sectionHeader}>
          <Text style={[typography.titleLarge, { color: colors.onBackground }]}>
            Habit Consistency
          </Text>
          <Pressable
            onPress={() => router.push('/(tabs)/life')}
            accessibilityRole="button"
          >
            <Text style={[typography.labelMedium, { color: colors.primary }]}>Manage</Text>
          </Pressable>
        </View>

        <View style={styles.chipsRow}>
          <M3Chip
            label="Morning Deep Work"
            selected={true}
            onPress={() => {}}
            badge="5d"
            icon={<Ionicons name="flame" size={14} color={colors.onPrimary} />}
          />
          <M3Chip
            label="Hydration 2.5L"
            selected={false}
            onPress={() => {}}
            badge="12d"
            icon={<Ionicons name="water-outline" size={14} color={colors.primary} />}
          />
          <M3Chip
            label="Evening Review"
            selected={false}
            onPress={() => {}}
            badge="3d"
            icon={<Ionicons name="book-outline" size={14} color={colors.primary} />}
          />
        </View>

        {/* Space for bottom navigation and floating button */}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  themeToggle: {
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
