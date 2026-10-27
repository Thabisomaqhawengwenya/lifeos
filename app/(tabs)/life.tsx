import React, { useState, useCallback } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  TextInput,
  Platform,
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
import { LicenseService, LicenseInfo } from '@/src/services/LicenseService';
import { CurrencyService, CurrencyConfig, SupportedCurrency, CURRENCIES } from '@/src/services/CurrencyService';
import { NoteEditorModal } from '@/src/components/notes/NoteEditorModal';

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
  const [currency, setCurrency] = useState<CurrencyConfig>(CURRENCIES.USD);
  const [licenseInfo, setLicenseInfo] = useState<LicenseInfo>({
    isActivated: false,
    tier: 'community',
    licenseKey: null,
    holderName: null,
    expiresYear: null,
  });
  const [keyInput, setKeyInput] = useState('');
  const [selectedNote, setSelectedNote] = useState<NoteItem | null>(null);
  const [noteModalVisible, setNoteModalVisible] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [hList, gList, nList, txList, cur, lic] = await Promise.all([
        HabitRepository.getAllHabits(),
        GoalRepository.getAllGoals(),
        NoteRepository.getAllNotes(),
        FinanceRepository.getAllTransactions(10),
        CurrencyService.getPreferredCurrency(),
        LicenseService.getLicenseInfo(),
      ]);

      setHabits(hList);
      setGoals(gList);
      setNotes(nList);
      setRecentTransactions(txList);
      setCurrency(cur);
      setLicenseInfo(lic);

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

  const handleUpdateGoalProgress = async (goalId: string, currentPercent: number, delta: number) => {
    haptic.selection();
    const newProgress = Math.max(0, Math.min(100, currentPercent + delta));
    await GoalRepository.updateProgress(goalId, newProgress);
    await loadData();
  };

  const handleSwitchCurrency = async (code: SupportedCurrency) => {
    haptic.selection();
    await CurrencyService.setPreferredCurrency(code);
    setCurrency(CURRENCIES[code]);
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

  const handleActivateKey = async () => {
    if (!keyInput.trim()) return;
    haptic.medium();
    const res = await LicenseService.activateLicense(keyInput.trim());
    if (res.success) {
      haptic.success();
      Alert.alert('Activation Successful', `LifeOS ${res.tier?.toUpperCase()} license activated successfully.`);
      setKeyInput('');
      await loadData();
    } else {
      haptic.warning();
      Alert.alert('Activation Failed', res.error || 'Invalid license key.');
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
            <View style={styles.sectionHeaderRow}>
              <Text style={[typography.titleLarge, { color: colors.onBackground }]}>
                Key Milestones & Goals ({goals.length})
              </Text>
            </View>

            {goals.length === 0 ? (
              <M3EmptyState
                icon="trophy-outline"
                title="No Goals Configured"
                description="Define long-term horizons and track incremental progress."
                actionTitle="Create Goal"
                onAction={() => router.push('/modal')}
              />
            ) : (
              goals.map((g) => (
                <M3Card key={g.id} variant="elevated" style={styles.cardItem}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <Text style={[typography.titleMedium, { color: colors.onSurface }]}>
                        {g.title}
                      </Text>
                      <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant, marginTop: 4 }]}>
                        {g.description || 'Deliverable'} • {g.progress_percent}% completed
                      </Text>
                    </View>

                    {/* Steppers */}
                    <View style={styles.steppersRow}>
                      <Pressable
                        onPress={() => handleUpdateGoalProgress(g.id, g.progress_percent, -10)}
                        style={[styles.stepBtn, { backgroundColor: colors.surfaceVariant, borderRadius: radii.full }]}
                      >
                        <Ionicons name="remove" size={16} color={colors.onSurface} />
                      </Pressable>
                      <Pressable
                        onPress={() => handleUpdateGoalProgress(g.id, g.progress_percent, 10)}
                        style={[styles.stepBtn, { backgroundColor: colors.primaryContainer, borderRadius: radii.full, marginLeft: 6 }]}
                      >
                        <Ionicons name="add" size={16} color={colors.onPrimaryContainer} />
                      </Pressable>
                    </View>
                  </View>

                  <View style={[styles.progressBarBg, { backgroundColor: colors.surfaceVariant, borderRadius: radii.full }]}>
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          width: `${g.progress_percent}%`,
                          backgroundColor: g.progress_percent === 100 ? colors.success : colors.primary,
                          borderRadius: radii.full,
                        },
                      ]}
                    />
                  </View>
                </M3Card>
              ))
            )}
          </>
        )}

        {activeSection === 'finance' && (
          <>
            {/* Currency Selector Bar */}
            <View style={styles.currencySelectorRow}>
              <Text style={[typography.labelMedium, { color: colors.onSurfaceVariant, marginRight: 8 }]}>
                CURRENCY:
              </Text>
              {(['USD', 'ZiG', 'ZAR'] as SupportedCurrency[]).map((code) => (
                <M3Chip
                  key={code}
                  label={code}
                  selected={currency.code === code}
                  onPress={() => handleSwitchCurrency(code)}
                />
              ))}
            </View>

            <M3Card variant="elevated" style={styles.cardItem}>
              <View style={styles.financeMetricsRow}>
                <View>
                  <Text style={[typography.labelSmall, { color: colors.onSurfaceVariant }]}>
                    TOTAL EXPENSES
                  </Text>
                  <Text style={[typography.headlineMedium, { color: colors.error, marginTop: 2 }]}>
                    {CurrencyService.formatCents(financeSummary.total_expense_cents, currency)}
                  </Text>
                </View>
                <View>
                  <Text style={[typography.labelSmall, { color: colors.onSurfaceVariant }]}>
                    TOTAL INCOME
                  </Text>
                  <Text style={[typography.headlineMedium, { color: colors.success, marginTop: 2 }]}>
                    {CurrencyService.formatCents(financeSummary.total_income_cents, currency)}
                  </Text>
                </View>
                <View>
                  <Text style={[typography.labelSmall, { color: colors.onSurfaceVariant }]}>
                    NET BALANCE
                  </Text>
                  <Text style={[typography.headlineMedium, { color: colors.primary, marginTop: 2 }]}>
                    {CurrencyService.formatCents(financeSummary.net_balance_cents, currency)}
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
                    {tx.type === 'expense' ? '-' : '+'}{CurrencyService.formatCents(tx.amount_cents, currency)}
                  </Text>
                </M3Card>
              ))
            )}
          </>
        )}

        {activeSection === 'notes' && (
          <>
            <View style={styles.sectionHeaderRow}>
              <Text style={[typography.titleLarge, { color: colors.onBackground }]}>
                Personal Notes & Knowledge ({notes.length})
              </Text>
              <Pressable
                onPress={() => {
                  setSelectedNote(null);
                  setNoteModalVisible(true);
                }}
                style={[styles.addNoteHeaderBtn, { backgroundColor: colors.primaryContainer, borderRadius: radii.full }]}
              >
                <Ionicons name="add" size={16} color={colors.onPrimaryContainer} />
                <Text style={[typography.labelSmall, { color: colors.onPrimaryContainer, fontWeight: '700', marginLeft: 4 }]}>
                  NEW NOTE
                </Text>
              </Pressable>
            </View>

            {notes.length === 0 ? (
              <M3EmptyState
                icon="document-text-outline"
                title="Your Knowledge Base is Empty"
                description="Capture quick ideas, project specs, or meeting memos."
                actionTitle="Create Note"
                onAction={() => {
                  setSelectedNote(null);
                  setNoteModalVisible(true);
                }}
              />
            ) : (
              notes.map((n) => (
                <M3Card
                  key={n.id}
                  variant="elevated"
                  style={styles.cardItem}
                  onPress={() => {
                    setSelectedNote(n);
                    setNoteModalVisible(true);
                  }}
                >
                  <Text style={[typography.titleMedium, { color: colors.onSurface }]}>
                    {n.title}
                  </Text>
                  <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant, marginTop: 4 }]}>
                    {n.content}
                  </Text>
                  {n.tags ? (
                    <Text style={[typography.labelSmall, { color: colors.primary, marginTop: 8 }]}>
                      {n.tags}
                    </Text>
                  ) : null}
                </M3Card>
              ))
            )}
          </>
        )}

        {activeSection === 'backup' && (
          <>
            <Text style={[typography.titleLarge, { color: colors.onBackground, marginBottom: 12 }]}>
              Security Vault & Licensing
            </Text>

            {/* License Activation Card */}
            <M3Card variant="elevated" style={styles.cardItem}>
              <View style={styles.vaultHeader}>
                <Ionicons name="key-outline" size={24} color={colors.primary} />
                <Text style={[typography.titleMedium, { color: colors.onSurface, marginLeft: 10 }]}>
                  Software License & Tier
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant }]}>
                  Current Status:{' '}
                </Text>
                <View
                  style={[
                    styles.streakBadge,
                    {
                      backgroundColor: licenseInfo.isActivated ? colors.primaryContainer : colors.surfaceVariant,
                      borderRadius: radii.full,
                      paddingVertical: 2,
                    },
                  ]}
                >
                  <Text
                    style={[
                      typography.labelSmall,
                      {
                        color: licenseInfo.isActivated ? colors.onPrimaryContainer : colors.onSurfaceVariant,
                        fontWeight: '700',
                      },
                    ]}
                  >
                    {licenseInfo.isActivated ? `LIFETIME ${licenseInfo.tier.toUpperCase()}` : 'COMMUNITY EDITION'}
                  </Text>
                </View>
              </View>

              {!licenseInfo.isActivated ? (
                <View style={{ marginTop: 14 }}>
                  <TextInput
                    value={keyInput}
                    onChangeText={setKeyInput}
                    placeholder="LIFEOS-PRO-XXXX-XXXXXXXX"
                    placeholderTextColor={colors.outline}
                    autoCapitalize="characters"
                    style={[
                      styles.licenseInput,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.outlineVariant,
                        color: colors.onSurface,
                        borderRadius: radii.md,
                      },
                    ]}
                  />
                  <View style={{ marginTop: 10 }}>
                    <M3Button
                      title="Activate Offline License"
                      variant="tonal"
                      size="small"
                      onPress={handleActivateKey}
                      disabled={!keyInput.trim()}
                    />
                  </View>
                </View>
              ) : (
                <Text style={[typography.bodySmall, { color: colors.success, marginTop: 8 }]}>
                  ✓ Licensed to {licenseInfo.holderName} (Active through {licenseInfo.expiresYear})
                </Text>
              )}
            </M3Card>

            {/* Vault Backup Card */}
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

      {/* Note Editor Modal */}
      <NoteEditorModal
        visible={noteModalVisible}
        note={selectedNote}
        onClose={() => setNoteModalVisible(false)}
        onSaved={loadData}
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
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  addNoteHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
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
  steppersRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
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
  currencySelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 6,
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
  licenseInput: {
    height: 44,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
  },
});
