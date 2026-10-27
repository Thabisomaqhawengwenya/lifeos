import React, { useState, useCallback } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/src/design-system/ThemeContext';
import { M3Header } from '@/src/components/ui/M3Header';
import { M3Card } from '@/src/components/ui/M3Card';
import { M3Chip } from '@/src/components/ui/M3Chip';
import { M3Button } from '@/src/components/ui/M3Button';
import { M3FAB } from '@/src/components/ui/M3FAB';
import { M3EmptyState } from '@/src/components/ui/M3EmptyState';
import { haptic } from '@/src/design-system/haptics';
import { HabitRepository, HabitItem } from '@/src/repositories/HabitRepository';
import { FinanceRepository, TransactionItem, FinanceSummary } from '@/src/repositories/FinanceRepository';
import { NoteRepository, GoalRepository, NoteItem, GoalItem } from '@/src/repositories/NoteAndGoalRepository';
import { SecurityService } from '@/src/services/SecurityService';

type LifeSection = 'habits' | 'goals' | 'finance' | 'notes' | 'backup';

export default function LifeScreen() {
  const { colors, spacing, radii, typography } = useAppTheme();
  const [activeSection, setActiveSection] = useState<LifeSection>('habits');
  const [habits, setHabits] = useState<HabitItem[]>([]);
  const [goals, setGoals] = useState<GoalItem[]>([]);
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [financeSummary, setFinanceSummary] = useState<FinanceSummary>({
    total_income_cents: 0,
    total_expense_cents: 0,
    net_balance_cents: 0,
  });
  const [recentTransactions, setRecentTransactions] = useState<TransactionItem[]>([]);

  const loadData = useCallback(async () => {
    try {
      const [hList, gList, nList, txList] = await Promise.all([
        HabitRepository.getAllHabits(),
        GoalRepository.getAllGoals(),
        NoteRepository.getAllNotes(),
        FinanceRepository.getAllTransactions(10),
      ]);

      setHabits(hList);
      setGoals(gList);
      setNotes(nList);
      setRecentTransactions(txList);

      const currentMonth = new Date().toISOString().slice(0, 7);
      const summary = await FinanceRepository.getMonthlySummary(currentMonth);
      setFinanceSummary(summary);
    } catch (err) {
      console.warn('Error loading Life data:', err);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const toggleHabit = async (habitId: string) => {
    haptic.selection();
    const today = new Date().toISOString().split('T')[0];
    await HabitRepository.toggleHabitCheckIn(habitId, today);
    await loadData();
  };

  const handleExportBackup = async () => {
    haptic.medium();
    try {
      const backupJson = await SecurityService.exportBackup();
      Alert.alert(
        'Encrypted Backup Generated',
        `SQLite database verified with SHA-256 checksum.\n\nPayload size: ${backupJson.length} bytes.\n\nData is safely isolated and ready for migration.`
      );
    } catch (err: any) {
      Alert.alert('Backup Error', err.message);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <M3Header
        title="Life Management"
        subtitle="Habits, Goals, Finance, Notes & Security"
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
        <M3Chip
          label="Vault"
          selected={activeSection === 'backup'}
          onPress={() => setActiveSection('backup')}
          icon={<Ionicons name="shield-checkmark" size={14} color={activeSection === 'backup' ? colors.onPrimary : colors.primary} />}
        />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: spacing.lg }]}
        showsVerticalScrollIndicator={false}
      >
        {activeSection === 'habits' && (
          <>
            <Text style={[typography.titleLarge, { color: colors.onBackground, marginBottom: 12 }]}>
              Active Habit Streaks ({habits.length})
            </Text>
            {habits.length === 0 ? (
              <M3EmptyState
                icon="flame-outline"
                title="No Habits Tracked Yet"
                description="Form daily momentum by creating your first personal habit."
                actionTitle="Create Habit"
                onAction={() => router.push('/modal')}
              />
            ) : (
              habits.map((h) => (
                <M3Card key={h.id} variant="elevated" style={styles.cardItem}>
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.cardTitleArea}>
                      <Text style={[typography.titleMedium, { color: colors.onSurface }]}>
                        {h.name}
                      </Text>
                      <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant, marginTop: 2 }]}>
                        Target: {h.target_days_per_week} days/week • {h.description || 'Consistency block'}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => toggleHabit(h.id)}
                      style={[
                        styles.streakBadge,
                        {
                          backgroundColor: h.is_logged_today ? colors.primary : colors.surfaceVariant,
                          borderRadius: radii.full,
                        },
                      ]}
                    >
                      <Ionicons
                        name="flame"
                        size={14}
                        color={h.is_logged_today ? colors.onPrimary : colors.accentGold}
                      />
                      <Text
                        style={[
                          typography.labelSmall,
                          {
                            color: h.is_logged_today ? colors.onPrimary : colors.onSurface,
                            fontWeight: '700',
                            marginLeft: 4,
                          },
                        ]}
                      >
                        {h.streak_current}d {h.is_logged_today ? '✓' : ''}
                      </Text>
                    </Pressable>
                  </View>
                </M3Card>
              ))
            )}
          </>
        )}

        {activeSection === 'goals' && (
          <>
            <Text style={[typography.titleLarge, { color: colors.onBackground, marginBottom: 12 }]}>
              Key Milestones & Goals ({goals.length})
            </Text>
            {goals.length === 0 ? (
              <M3EmptyState
                icon="trophy-outline"
                title="No Goals Configured"
                description="Define long-term horizons and link them to actionable steps."
                actionTitle="Create Goal"
                onAction={() => router.push('/modal')}
              />
            ) : (
              goals.map((g) => (
                <M3Card key={g.id} variant="elevated" style={styles.cardItem}>
                  <Text style={[typography.titleMedium, { color: colors.onSurface }]}>
                    {g.title}
                  </Text>
                  <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant, marginTop: 4 }]}>
                    {g.description || 'Milestone target'} • {g.progress_percent}% completed
                  </Text>
                  <View style={[styles.progressBarBg, { backgroundColor: colors.surfaceVariant, borderRadius: radii.full }]}>
                    <View style={[styles.progressBarFill, { width: `${g.progress_percent}%`, backgroundColor: colors.primary, borderRadius: radii.full }]} />
                  </View>
                </M3Card>
              ))
            )}
          </>
        )}

        {activeSection === 'finance' && (
          <>
            <Text style={[typography.titleLarge, { color: colors.onBackground, marginBottom: 12 }]}>
              Financial Ledger & Balance
            </Text>

            <M3Card variant="elevated" style={styles.cardItem}>
              <View style={styles.financeMetricsRow}>
                <View>
                  <Text style={[typography.labelSmall, { color: colors.onSurfaceVariant }]}>
                    TOTAL EXPENSES
                  </Text>
                  <Text style={[typography.headlineMedium, { color: colors.error, marginTop: 2 }]}>
                    ${(financeSummary.total_expense_cents / 100).toFixed(2)}
                  </Text>
                </View>
                <View>
                  <Text style={[typography.labelSmall, { color: colors.onSurfaceVariant }]}>
                    TOTAL INCOME
                  </Text>
                  <Text style={[typography.headlineMedium, { color: colors.success, marginTop: 2 }]}>
                    ${(financeSummary.total_income_cents / 100).toFixed(2)}
                  </Text>
                </View>
                <View>
                  <Text style={[typography.labelSmall, { color: colors.onSurfaceVariant }]}>
                    NET BALANCE
                  </Text>
                  <Text style={[typography.headlineMedium, { color: colors.primary, marginTop: 2 }]}>
                    ${(financeSummary.net_balance_cents / 100).toFixed(2)}
                  </Text>
                </View>
              </View>
            </M3Card>

            <Text style={[typography.titleMedium, { color: colors.onBackground, marginVertical: 10 }]}>
              Recent Transactions ({recentTransactions.length})
            </Text>
            {recentTransactions.length === 0 ? (
              <M3Card variant="outlined" style={styles.cardItem}>
                <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant, textAlign: 'center' }]}>
                  No transactions recorded yet. Tap + to record an expense or income.
                </Text>
              </M3Card>
            ) : (
              recentTransactions.map((tx) => (
                <M3Card key={tx.id} variant="outlined" style={styles.txRow}>
                  <View>
                    <Text style={[typography.titleSmall, { color: colors.onSurface }]}>
                      {tx.description || tx.category}
                    </Text>
                    <Text style={[typography.labelSmall, { color: colors.onSurfaceVariant }]}>
                      {tx.category} • {tx.transaction_date}
                    </Text>
                  </View>
                  <Text
                    style={[
                      typography.titleMedium,
                      { color: tx.type === 'expense' ? colors.error : colors.success, fontWeight: '700' },
                    ]}
                  >
                    {tx.type === 'expense' ? '-' : '+'}${(tx.amount_cents / 100).toFixed(2)}
                  </Text>
                </M3Card>
              ))
            )}
          </>
        )}

        {activeSection === 'notes' && (
          <>
            <Text style={[typography.titleLarge, { color: colors.onBackground, marginBottom: 12 }]}>
              Personal Notes & Knowledge ({notes.length})
            </Text>
            {notes.length === 0 ? (
              <M3EmptyState
                icon="document-text-outline"
                title="Your Knowledge Base is Empty"
                description="Capture quick ideas, project specs, or meeting memos."
                actionTitle="Create Note"
                onAction={() => router.push('/modal')}
              />
            ) : (
              notes.map((n) => (
                <M3Card key={n.id} variant="elevated" style={styles.cardItem}>
                  <Text style={[typography.titleMedium, { color: colors.onSurface }]}>
                    {n.title}
                  </Text>
                  <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant, marginTop: 4 }]}>
                    {n.content}
                  </Text>
                </M3Card>
              ))
            )}
          </>
        )}

        {activeSection === 'backup' && (
          <>
            <Text style={[typography.titleLarge, { color: colors.onBackground, marginBottom: 12 }]}>
              Security Vault & Backups
            </Text>

            <M3Card variant="elevated" style={styles.cardItem}>
              <View style={styles.vaultHeader}>
                <Ionicons name="shield-checkmark" size={24} color={colors.primary} />
                <Text style={[typography.titleMedium, { color: colors.onSurface, marginLeft: 10 }]}>
                  Cryptographic Offline Vault
                </Text>
              </View>
              <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant, marginTop: 8 }]}>
                LifeOS stores all records in local SQLite with WAL journaling. Generate a verified JSON snapshot with SHA-256 integrity checks at any time.
              </Text>
              <View style={{ marginTop: 16 }}>
                <M3Button
                  title="Export Encrypted Backup JSON"
                  variant="filled"
                  size="medium"
                  onPress={handleExportBackup}
                />
              </View>
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
    paddingVertical: 5,
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
  txRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
  },
  vaultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
  },
});
