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

type LifeSection = 'habits' | 'goals' | 'finance' | 'notes';

export default function LifeScreen() {
  const { colors, spacing, radii, typography } = useAppTheme();
  const [activeSection, setActiveSection] = useState<LifeSection>('habits');

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <M3Header
        title="Life Management"
        subtitle="Habits, Goals, Finance & Notes"
      />

      {/* Module Selector Chips */}
      <View style={styles.sectionChips}>
        <M3Chip
          label="Habits"
          selected={activeSection === 'habits'}
          onPress={() => setActiveSection('habits')}
          icon={<Ionicons name="flame" size={14} color={activeSection === 'habits' ? colors.onPrimary : colors.primary} />}
        />
        <M3Chip
          label="Goals"
          selected={activeSection === 'goals'}
          onPress={() => setActiveSection('goals')}
          icon={<Ionicons name="trophy" size={14} color={activeSection === 'goals' ? colors.onPrimary : colors.primary} />}
        />
        <M3Chip
          label="Finance"
          selected={activeSection === 'finance'}
          onPress={() => setActiveSection('finance')}
          icon={<Ionicons name="wallet" size={14} color={activeSection === 'finance' ? colors.onPrimary : colors.primary} />}
        />
        <M3Chip
          label="Notes"
          selected={activeSection === 'notes'}
          onPress={() => setActiveSection('notes')}
          icon={<Ionicons name="document-text" size={14} color={activeSection === 'notes' ? colors.onPrimary : colors.primary} />}
        />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: spacing.lg }]}
        showsVerticalScrollIndicator={false}
      >
        {activeSection === 'habits' && (
          <>
            <Text style={[typography.titleLarge, { color: colors.onBackground, marginBottom: 12 }]}>
              Active Habit Streaks
            </Text>

            <M3Card variant="elevated" style={styles.cardItem}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardTitleArea}>
                  <Text style={[typography.titleMedium, { color: colors.onSurface }]}>
                    Morning Deep Work (90m)
                  </Text>
                  <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant, marginTop: 2 }]}>
                    Target: 5 days/week • Focus session
                  </Text>
                </View>
                <View
                  style={[
                    styles.streakBadge,
                    { backgroundColor: colors.accentGoldContainer, borderRadius: radii.full },
                  ]}
                >
                  <Ionicons name="flame" size={14} color={colors.accentGold} />
                  <Text
                    style={[
                      typography.labelSmall,
                      { color: colors.accentGold, fontWeight: '700', marginLeft: 4 },
                    ]}
                  >
                    5 DAYS
                  </Text>
                </View>
              </View>
            </M3Card>

            <M3Card variant="elevated" style={styles.cardItem}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardTitleArea}>
                  <Text style={[typography.titleMedium, { color: colors.onSurface }]}>
                    Hydration 2.5 Litres
                  </Text>
                  <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant, marginTop: 2 }]}>
                    Daily target • 1.8L logged today
                  </Text>
                </View>
                <View
                  style={[
                    styles.streakBadge,
                    { backgroundColor: colors.primaryContainer, borderRadius: radii.full },
                  ]}
                >
                  <Ionicons name="water" size={14} color={colors.primary} />
                  <Text
                    style={[
                      typography.labelSmall,
                      { color: colors.primary, fontWeight: '700', marginLeft: 4 },
                    ]}
                  >
                    12 DAYS
                  </Text>
                </View>
              </View>
            </M3Card>
          </>
        )}

        {activeSection === 'goals' && (
          <>
            <Text style={[typography.titleLarge, { color: colors.onBackground, marginBottom: 12 }]}>
              Key Milestones & Goals
            </Text>

            <M3Card variant="elevated" style={styles.cardItem}>
              <Text style={[typography.titleMedium, { color: colors.onSurface }]}>
                Ship LifeOS Production Release
              </Text>
              <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant, marginTop: 4 }]}>
                Q4 Deliverable • 65% completed
              </Text>
              <View style={[styles.progressBarBg, { backgroundColor: colors.surfaceVariant, borderRadius: radii.full }]}>
                <View style={[styles.progressBarFill, { width: '65%', backgroundColor: colors.primary, borderRadius: radii.full }]} />
              </View>
            </M3Card>
          </>
        )}

        {activeSection === 'finance' && (
          <>
            <Text style={[typography.titleLarge, { color: colors.onBackground, marginBottom: 12 }]}>
              October Financial Snapshot
            </Text>

            <M3Card variant="elevated" style={styles.cardItem}>
              <View style={styles.financeMetricsRow}>
                <View>
                  <Text style={[typography.labelSmall, { color: colors.onSurfaceVariant }]}>
                    BUDGET REMAINING
                  </Text>
                  <Text style={[typography.headlineMedium, { color: colors.success, marginTop: 2 }]}>
                    $1,420.00
                  </Text>
                </View>
                <View>
                  <Text style={[typography.labelSmall, { color: colors.onSurfaceVariant }]}>
                    SPENT THIS MONTH
                  </Text>
                  <Text style={[typography.headlineMedium, { color: colors.onSurface, marginTop: 2 }]}>
                    $880.00
                  </Text>
                </View>
              </View>
            </M3Card>
          </>
        )}

        {activeSection === 'notes' && (
          <>
            <Text style={[typography.titleLarge, { color: colors.onBackground, marginBottom: 12 }]}>
              Pinned Notes & Ideas
            </Text>

            <M3Card variant="elevated" style={styles.cardItem}>
              <Text style={[typography.titleMedium, { color: colors.onSurface }]}>
                Offline SQLite Synchronization Ledger
              </Text>
              <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant, marginTop: 4 }]}>
                Key design rule: Local database acts as immediate single source of truth; queued operations push to Supabase with conflict timestamp resolution.
              </Text>
            </M3Card>
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

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
  sectionChips: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  scrollContent: {
    paddingTop: 8,
  },
  cardItem: {
    marginBottom: 12,
    padding: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitleArea: {
    flex: 1,
    paddingRight: 10,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  progressBarBg: {
    height: 8,
    width: '100%',
    marginTop: 12,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
  },
  financeMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
  },
});
