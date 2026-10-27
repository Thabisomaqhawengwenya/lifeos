import React, { useState, useCallback, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  TextInput,
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
import { updateService, UpdateStatus } from '@/src/services/UpdateService';

type LifeSection = 'habits' | 'goals' | 'finance' | 'notes' | 'vault';

export default function LifeScreen() {
  const { colors, spacing, isDark } = useAppTheme();
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
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>(updateService.getStatus());

  useEffect(() => {
    const unsub = updateService.subscribe((s) => setUpdateStatus(s));
    return () => unsub();
  }, []);

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

  const handleCheckUpdate = async () => {
    haptic.medium();
    const found = await updateService.checkForUpdates(true);
    if (!found) {
      Alert.alert('Update Check Complete', 'LifeOS is running the latest available build.');
    }
  };

  const handleApplyUpdate = async () => {
    haptic.heavy();
    await updateService.applyUpdate();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <M3Header
        badge="LIFE OS • SYSTEM HUB"
        title="Life Management"
        subtitle="Habits, Goals, Finance, Notes & Security"
      />

      {/* Module Selector Chips (Brutalist Sticker Chips) */}
      <View style={[styles.sectionChips, { borderBottomColor: colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
          <M3Chip
            label="HABITS"
            selected={activeSection === 'habits'}
            onPress={() => setActiveSection('habits')}
            colorScheme="mint"
            icon={<Ionicons name="flame" size={14} color="#000000" />}
          />
          <M3Chip
            label="GOALS"
            selected={activeSection === 'goals'}
            onPress={() => setActiveSection('goals')}
            colorScheme="yellow"
            icon={<Ionicons name="trophy" size={14} color="#000000" />}
          />
          <M3Chip
            label="FINANCE"
            selected={activeSection === 'finance'}
            onPress={() => setActiveSection('finance')}
            colorScheme="coral"
            icon={<Ionicons name="wallet" size={14} color="#000000" />}
          />
          <M3Chip
            label="NOTES"
            selected={activeSection === 'notes'}
            onPress={() => setActiveSection('notes')}
            colorScheme="sky"
            icon={<Ionicons name="document-text" size={14} color="#000000" />}
          />
          <M3Chip
            label="VAULT & OTA"
            selected={activeSection === 'vault'}
            onPress={() => setActiveSection('vault')}
            colorScheme="lilac"
            icon={<Ionicons name="shield-checkmark" size={14} color="#000000" />}
          />
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: spacing.base }]}
        showsVerticalScrollIndicator={false}
      >
        {/* HABITS SECTION */}
        {activeSection === 'habits' && (
          <>
            <View style={styles.sectionHeaderRow}>
              <View style={[styles.sectionDot, { backgroundColor: colors.accentJade }]} />
              <Text style={[styles.sectionTitle, { color: colors.onBackground }]}>
                ACTIVE HABIT STREAKS ({habits.length})
              </Text>
            </View>

            {habits.length === 0 ? (
              <M3EmptyState
                icon="flame-outline"
                title="NO HABITS TRACKED YET"
                description="Build daily momentum by tracking your first routine."
                actionTitle="CREATE HABIT"
                onAction={() => router.push('/modal')}
              />
            ) : (
              habits.map((h) => (
                <M3Card key={h.id} variant="elevated" style={styles.cardItem}>
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.cardTitleArea}>
                      <Text style={[styles.cardTitle, { color: colors.onSurface }]}>
                        {h.name}
                      </Text>
                      <Text style={[styles.cardSubtitle, { color: isDark ? '#A0A0A0' : '#555555' }]}>
                        Target: {h.target_days_per_week} days/week • {h.description || 'Focus block'}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => toggleHabit(h.id)}
                      style={[
                        styles.streakBadge,
                        {
                          backgroundColor: h.is_logged_today ? colors.accentJade : colors.surface,
                          borderColor: '#000000',
                        },
                      ]}
                    >
                      <Ionicons
                        name="flame"
                        size={14}
                        color={h.is_logged_today ? '#000000' : colors.accentCoral}
                      />
                      <Text style={styles.streakText}>
                        {h.streak_current}d {h.is_logged_today ? '✓' : ''}
                      </Text>
                    </Pressable>
                  </View>
                </M3Card>
              ))
            )}
          </>
        )}

        {/* GOALS SECTION */}
        {activeSection === 'goals' && (
          <>
            <View style={styles.sectionHeaderRow}>
              <View style={[styles.sectionDot, { backgroundColor: colors.accentYellow }]} />
              <Text style={[styles.sectionTitle, { color: colors.onBackground }]}>
                KEY MILESTONES & TARGETS ({goals.length})
              </Text>
            </View>

            {goals.length === 0 ? (
              <M3EmptyState
                icon="trophy-outline"
                title="NO ACTIVE GOALS"
                description="Define long-term targets and track your incremental progress."
                actionTitle="CREATE GOAL"
                onAction={() => router.push('/modal')}
              />
            ) : (
              goals.map((g) => (
                <M3Card key={g.id} variant="elevated" style={styles.cardItem}>
                  <View style={styles.goalHeaderRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.cardTitle, { color: colors.onSurface }]}>
                        {g.title}
                      </Text>
                      <Text style={[styles.cardSubtitle, { color: isDark ? '#A0A0A0' : '#555555' }]}>
                        Target: {g.target_date || 'Ongoing'}
                      </Text>
                    </View>
                    <View style={[styles.percentBadge, { backgroundColor: colors.accentYellow }]}>
                      <Text style={styles.percentText}>{g.progress_percent}%</Text>
                    </View>
                  </View>

                  {/* Brutalist Progress Bar */}
                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${Math.min(100, Math.max(0, g.progress_percent))}%`,
                          backgroundColor: colors.accentYellow,
                        },
                      ]}
                    />
                  </View>

                  <View style={styles.stepperRow}>
                    <Pressable
                      onPress={() => handleUpdateGoalProgress(g.id, g.progress_percent, -10)}
                      style={styles.stepBtn}
                    >
                      <Text style={styles.stepBtnText}>- 10%</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handleUpdateGoalProgress(g.id, g.progress_percent, +10)}
                      style={[styles.stepBtn, { backgroundColor: colors.accentYellow }]}
                    >
                      <Text style={styles.stepBtnText}>+ 10%</Text>
                    </Pressable>
                  </View>
                </M3Card>
              ))
            )}
          </>
        )}

        {/* FINANCE SECTION */}
        {activeSection === 'finance' && (
          <>
            <View style={styles.sectionHeaderRow}>
              <View style={[styles.sectionDot, { backgroundColor: colors.accentCoral }]} />
              <Text style={[styles.sectionTitle, { color: colors.onBackground }]}>
                FINANCIAL LEDGER & CASHBOX
              </Text>
            </View>

            {/* Currency Switcher */}
            <View style={styles.currencyRow}>
              {(['USD', 'ZiG', 'ZAR', 'EUR', 'GBP'] as SupportedCurrency[]).map((c) => (
                <Pressable
                  key={c}
                  onPress={() => handleSwitchCurrency(c)}
                  style={[
                    styles.currChip,
                    currency.code === c && {
                      backgroundColor: colors.accentYellow,
                      shadowColor: '#000000',
                      shadowOffset: { width: 2, height: 2 },
                      shadowOpacity: 1,
                      shadowRadius: 0,
                      elevation: 2,
                    },
                  ]}
                >
                  <Text style={styles.currChipText}>{c}</Text>
                </Pressable>
              ))}
            </View>

            {/* Cashbox Summary */}
            <M3Card variant="elevated" style={styles.cardItem}>
              <View style={styles.cashboxGrid}>
                <View style={[styles.cashboxCol, { backgroundColor: colors.accentJade }]}>
                  <Text style={styles.cashboxLbl}>INCOME</Text>
                  <Text style={styles.cashboxVal}>
                    {CurrencyService.formatCents(financeSummary.total_income_cents, currency)}
                  </Text>
                </View>
                <View style={[styles.cashboxCol, { backgroundColor: colors.accentCoral }]}>
                  <Text style={[styles.cashboxLbl, { color: '#FFFFFF' }]}>EXPENSES</Text>
                  <Text style={[styles.cashboxVal, { color: '#FFFFFF' }]}>
                    {CurrencyService.formatCents(financeSummary.total_expense_cents, currency)}
                  </Text>
                </View>
                <View style={[styles.cashboxCol, { backgroundColor: colors.accentYellow }]}>
                  <Text style={styles.cashboxLbl}>NET BALANCE</Text>
                  <Text style={styles.cashboxVal}>
                    {CurrencyService.formatCents(financeSummary.net_balance_cents, currency)}
                  </Text>
                </View>
              </View>
            </M3Card>

            <View style={styles.subSectionTitleRow}>
              <Text style={[styles.subSectionTitle, { color: colors.onBackground }]}>
                RECENT TRANSACTIONS ({recentTransactions.length})
              </Text>
            </View>

            {recentTransactions.length === 0 ? (
              <M3EmptyState
                icon="wallet-outline"
                title="NO TRANSACTIONS LOGGED"
                description="Keep track of your income and expenses in your local SQLite ledger."
                actionTitle="LOG EXPENSE"
                onAction={() => router.push('/modal')}
              />
            ) : (
              recentTransactions.map((tx) => (
                <M3Card key={tx.id} variant="elevated" style={styles.txCard}>
                  <View style={styles.txRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.cardTitle, { color: colors.onSurface }]}>
                        {tx.description || tx.category}
                      </Text>
                      <Text style={[styles.cardSubtitle, { color: isDark ? '#A0A0A0' : '#555555' }]}>
                        {tx.category.toUpperCase()} • {tx.transaction_date}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.txAmount,
                        { color: tx.type === 'income' ? colors.accentMint : colors.accentRed },
                      ]}
                    >
                      {tx.type === 'income' ? '+' : '-'}
                      {CurrencyService.formatCents(tx.amount_cents, currency)}
                    </Text>
                  </View>
                </M3Card>
              ))
            )}
          </>
        )}

        {/* NOTES SECTION */}
        {activeSection === 'notes' && (
          <>
            <View style={styles.sectionHeaderRow}>
              <View style={[styles.sectionDot, { backgroundColor: colors.accentSky }]} />
              <Text style={[styles.sectionTitle, { color: colors.onBackground }]}>
                PERSONAL NOTES & MEMOS ({notes.length})
              </Text>
            </View>

            {notes.length === 0 ? (
              <M3EmptyState
                icon="document-text-outline"
                title="NO NOTES STORED"
                description="Jot down thoughts, reference snippets, and key ideas."
                actionTitle="WRITE NOTE"
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
                  <Text style={[styles.cardTitle, { color: colors.onSurface }]}>
                    {n.title}
                  </Text>
                  <Text
                    style={[styles.cardSubtitle, { color: isDark ? '#A0A0A0' : '#555555', marginTop: 4 }]}
                    numberOfLines={3}
                  >
                    {n.content}
                  </Text>
                  {n.tags ? (
                    <View style={styles.noteTagBadge}>
                      <Text style={styles.noteTagText}>#{n.tags.toUpperCase()}</Text>
                    </View>
                  ) : null}
                </M3Card>
              ))
            )}
          </>
        )}

        {/* VAULT & OVER-THE-AIR UPDATES SECTION */}
        {activeSection === 'vault' && (
          <>
            {/* OTA Wi-Fi Updates Card */}
            <View style={styles.sectionHeaderRow}>
              <View style={[styles.sectionDot, { backgroundColor: colors.accentYellow }]} />
              <Text style={[styles.sectionTitle, { color: colors.onBackground }]}>
                OVER-THE-AIR (OTA) WI-FI UPDATES
              </Text>
            </View>

            <M3Card variant="elevated" style={styles.cardItem}>
              <View style={styles.otaHeaderRow}>
                <View>
                  <Text style={[styles.cardTitle, { color: colors.onSurface }]}>
                    App Version 1.1.0 (Neo-Brutalism)
                  </Text>
                  <Text style={[styles.cardSubtitle, { color: isDark ? '#A0A0A0' : '#555555', marginTop: 2 }]}>
                    EAS Channel: preview • Wi-Fi Update Daemon Active
                  </Text>
                </View>
                <View
                  style={[
                    styles.wifiStatusBadge,
                    { backgroundColor: updateStatus.isWifi ? colors.accentJade : colors.accentYellow },
                  ]}
                >
                  <Ionicons name={updateStatus.isWifi ? 'wifi' : 'cellular'} size={12} color="#000000" />
                  <Text style={styles.wifiStatusText}>
                    {updateStatus.isWifi ? 'WI-FI' : 'CELLULAR'}
                  </Text>
                </View>
              </View>

              {updateStatus.isDownloaded ? (
                <View style={styles.updateAvailableBox}>
                  <Text style={styles.updateAvailableText}>
                    ⚡ New OTA update has been downloaded. Restart to activate now!
                  </Text>
                  <M3Button
                    title="RESTART & APPLY NOW"
                    onPress={handleApplyUpdate}
                    variant="filled"
                    size="small"
                  />
                </View>
              ) : (
                <M3Button
                  title={updateStatus.isChecking ? 'CHECKING...' : 'CHECK FOR UPDATES OVER WI-FI'}
                  onPress={handleCheckUpdate}
                  variant="tonal"
                  size="small"
                  loading={updateStatus.isChecking}
                />
              )}
            </M3Card>

            {/* Cryptographic Backup Vault */}
            <View style={styles.sectionHeaderRow}>
              <View style={[styles.sectionDot, { backgroundColor: colors.accentLilac }]} />
              <Text style={[styles.sectionTitle, { color: colors.onBackground }]}>
                CRYPTOGRAPHIC DATA VAULT
              </Text>
            </View>

            <M3Card variant="elevated" style={styles.cardItem}>
              <Text style={[styles.cardTitle, { color: colors.onSurface }]}>
                SHA-256 Vault Snapshot
              </Text>
              <Text style={[styles.cardSubtitle, { color: isDark ? '#A0A0A0' : '#555555', marginTop: 4 }]}>
                Export full JSON backup with cryptographic integrity verification. Zero telemetry, local storage only.
              </Text>
              <View style={{ marginTop: 12 }}>
                <M3Button
                  title="EXPORT ENCRYPTED BACKUP"
                  onPress={handleExportBackup}
                  variant="filled"
                  size="small"
                />
              </View>
            </M3Card>

            {/* Offline License Manager */}
            <View style={styles.sectionHeaderRow}>
              <View style={[styles.sectionDot, { backgroundColor: colors.accentYellow }]} />
              <Text style={[styles.sectionTitle, { color: colors.onBackground }]}>
                OFFLINE LICENSE MANAGER
              </Text>
            </View>

            <M3Card variant="elevated" style={styles.cardItem}>
              <View style={styles.licRow}>
                <View>
                  <Text style={[styles.cardTitle, { color: colors.onSurface }]}>
                    Active Tier: {licenseInfo.tier.toUpperCase()}
                  </Text>
                  <Text style={[styles.cardSubtitle, { color: isDark ? '#A0A0A0' : '#555555', marginTop: 2 }]}>
                    Holder: {licenseInfo.holderName || 'Local Device Owner'}
                  </Text>
                </View>
                <View style={[styles.licBadge, { backgroundColor: colors.accentYellow }]}>
                  <Text style={styles.licBadgeText}>
                    {licenseInfo.isActivated ? 'ACTIVATED' : 'FREE'}
                  </Text>
                </View>
              </View>

              <TextInput
                value={keyInput}
                onChangeText={setKeyInput}
                placeholder="Paste LIFEOS-PRO-XXXX-XXXX key"
                placeholderTextColor="#888888"
                style={[
                  styles.licInput,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    color: colors.onSurface,
                  },
                ]}
              />

              <M3Button
                title="ACTIVATE OFFLINE KEY"
                onPress={handleActivateKey}
                variant="tonal"
                size="small"
              />
            </M3Card>
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB for creation */}
      <M3FAB
        onPress={() => {
          haptic.medium();
          if (activeSection === 'notes') {
            setSelectedNote(null);
            setNoteModalVisible(true);
          } else {
            router.push('/modal');
          }
        }}
        icon="add"
        style={styles.fab}
      />

      {/* Note Editor Modal */}
      <NoteEditorModal
        visible={noteModalVisible}
        note={selectedNote}
        onClose={() => {
          setNoteModalVisible(false);
          setSelectedNote(null);
        }}
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
    paddingVertical: 10,
    borderBottomWidth: 2.5,
  },
  chipsScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
    marginTop: 6,
  },
  sectionDot: {
    width: 10,
    height: 10,
    borderRadius: 2,
    borderWidth: 1.5,
    borderColor: '#000000',
  },
  sectionTitle: {
    fontFamily: 'SpaceMono',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  cardItem: {
    marginBottom: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitleArea: {
    flex: 1,
    paddingRight: 10,
  },
  cardTitle: {
    fontFamily: 'SpaceMono',
    fontSize: 14,
    fontWeight: '700',
  },
  cardSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 1.5, height: 1.5 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  streakText: {
    fontFamily: 'SpaceMono',
    fontSize: 11,
    fontWeight: '700',
    color: '#000000',
    marginLeft: 4,
  },
  goalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  percentBadge: {
    borderWidth: 1.5,
    borderColor: '#000000',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  percentText: {
    fontFamily: 'SpaceMono',
    fontSize: 11,
    fontWeight: '900',
    color: '#000000',
  },
  progressTrack: {
    height: 12,
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    marginVertical: 10,
  },
  progressFill: {
    height: '100%',
  },
  stepperRow: {
    flexDirection: 'row',
    gap: 8,
  },
  stepBtn: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 6,
    paddingVertical: 6,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  stepBtnText: {
    fontFamily: 'SpaceMono',
    fontSize: 11,
    fontWeight: '700',
    color: '#000000',
  },
  currencyRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  currChip: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 6,
    paddingVertical: 6,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  currChipText: {
    fontFamily: 'SpaceMono',
    fontSize: 11,
    fontWeight: '700',
    color: '#000000',
  },
  cashboxGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  cashboxCol: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  cashboxLbl: {
    fontFamily: 'SpaceMono',
    fontSize: 8,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: 0.5,
  },
  cashboxVal: {
    fontFamily: 'SpaceMono',
    fontSize: 13,
    fontWeight: '900',
    color: '#000000',
    marginTop: 2,
  },
  subSectionTitleRow: {
    marginVertical: 10,
  },
  subSectionTitle: {
    fontFamily: 'SpaceMono',
    fontSize: 12,
    fontWeight: '900',
  },
  txCard: {
    marginBottom: 8,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  txAmount: {
    fontFamily: 'SpaceMono',
    fontSize: 14,
    fontWeight: '900',
  },
  noteTagBadge: {
    borderWidth: 1.5,
    borderColor: '#000000',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    backgroundColor: '#FFE500',
    marginTop: 8,
  },
  noteTagText: {
    fontFamily: 'SpaceMono',
    fontSize: 9,
    fontWeight: '700',
    color: '#000000',
  },
  otaHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  wifiStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#000000',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 4,
  },
  wifiStatusText: {
    fontFamily: 'SpaceMono',
    fontSize: 9,
    fontWeight: '700',
    color: '#000000',
  },
  updateAvailableBox: {
    borderWidth: 2,
    borderColor: '#000000',
    backgroundColor: '#FFE500',
    borderRadius: 6,
    padding: 10,
    gap: 8,
  },
  updateAvailableText: {
    fontFamily: 'SpaceMono',
    fontSize: 11,
    fontWeight: '700',
    color: '#000000',
    lineHeight: 16,
  },
  licRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  licBadge: {
    borderWidth: 1.5,
    borderColor: '#000000',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  licBadgeText: {
    fontFamily: 'SpaceMono',
    fontSize: 9,
    fontWeight: '700',
    color: '#000000',
  },
  licInput: {
    borderWidth: 2,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontFamily: 'SpaceMono',
    fontSize: 12,
    marginBottom: 10,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
  },
});
