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
import { Feather } from '@expo/vector-icons';
import { useAppTheme } from '@/src/design-system/ThemeContext';
import { M3Header } from '@/src/components/ui/M3Header';
import { M3Card } from '@/src/components/ui/M3Card';
import { M3Chip } from '@/src/components/ui/M3Chip';
import { M3Button } from '@/src/components/ui/M3Button';
import { M3FAB } from '@/src/components/ui/M3FAB';
import { M3EmptyState } from '@/src/components/ui/M3EmptyState';
import { haptic } from '@/src/design-system/haptics';
import { HabitRepository, HabitItem } from '@/src/repositories/HabitRepository';
import {
  FinanceRepository,
  TransactionItem,
  FinanceSummary,
} from '@/src/repositories/FinanceRepository';
import {
  NoteRepository,
  GoalRepository,
  NoteItem,
  GoalItem,
} from '@/src/repositories/NoteAndGoalRepository';
import { SecurityService } from '@/src/services/SecurityService';
import { LicenseService, LicenseInfo } from '@/src/services/LicenseService';
import {
  CurrencyService,
  CurrencyConfig,
  CURRENCIES,
} from '@/src/services/CurrencyService';
import { NoteEditorModal } from '@/src/components/notes/NoteEditorModal';
import { updateService, UpdateStatus } from '@/src/services/UpdateService';
import { getLocalDateString } from '@/src/utils/date';

type LifeSection = 'habits' | 'goals' | 'finance' | 'notes' | 'vault';

export default function LifeScreen() {
  const { colors, spacing, typography, radii, shadowSmall, isDark } = useAppTheme();
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
    const today = getLocalDateString();
    await HabitRepository.toggleHabitCheckIn(habitId, today);
    await loadData();
  };

  const handleStepGoal = async (goalId: string, delta: number) => {
    haptic.selection();
    await GoalRepository.updateGoalProgress(goalId, delta);
    await loadData();
  };

  const handleChangeCurrency = async (curr: CurrencyConfig) => {
    haptic.selection();
    setCurrency(curr);
    await CurrencyService.setPreferredCurrency(curr.code);
  };

  const handleActivateKey = async () => {
    if (!keyInput.trim()) {
      Alert.alert('License Error', 'Please enter a valid offline license key.');
      return;
    }
    const res = await LicenseService.activateLicense(keyInput.trim());
    if (res.success && res.tier) {
      haptic.success();
      Alert.alert('License Activated', `Welcome to LifeOS ${res.tier.toUpperCase()} tier!`);
      setKeyInput('');
      await loadData();
    } else {
      haptic.warning();
      Alert.alert('Activation Failed', res.error || 'Invalid key.');
    }
  };

  const handleExportBackup = async () => {
    try {
      haptic.selection();
      const backupJson = await SecurityService.exportBackup();
      const backup = JSON.parse(backupJson);
      haptic.success();
      Alert.alert(
        'Vault Snapshot Generated',
        `Integrity Checksum: ${backup.checksum.slice(0, 16)}...\n\nYour data has been secured offline.`
      );
    } catch (err: any) {
      haptic.warning();
      Alert.alert('Export Failed', err.message || 'Unknown vault error.');
    }
  };

  const handleCheckUpdate = async () => {
    haptic.medium();
    const hasUpdate = await updateService.checkForUpdates(true);
    if (!hasUpdate && !updateService.getStatus().error) {
      Alert.alert('LifeOS Updates', 'Your app is up to date! Running latest bundle.');
    } else if (updateService.getStatus().error) {
      Alert.alert('Update Check', updateService.getStatus().error || 'Failed to check updates.');
    }
  };

  const handleApplyUpdate = async () => {
    haptic.heavy();
    await updateService.applyUpdate();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <M3Header
        title="Life Hub"
        subtitle="Habits, goals, finances, notes & security"
      />

      {/* Module Selector Chips with Visible Scrollable Affordance */}
      <View
        style={[
          styles.sectionChips,
          {
            backgroundColor: colors.surfaceAlt,
            borderBottomColor: colors.border,
            borderBottomWidth: colors.borderWidth,
          },
        ]}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsScroll}
        >
          <M3Chip
            label="HABITS"
            selected={activeSection === 'habits'}
            onPress={() => setActiveSection('habits')}
            icon={<Feather name="activity" size={14} color="#000000" />}
          />
          <M3Chip
            label="GOALS"
            selected={activeSection === 'goals'}
            onPress={() => setActiveSection('goals')}
            icon={<Feather name="award" size={14} color="#000000" />}
          />
          <M3Chip
            label="FINANCE"
            selected={activeSection === 'finance'}
            onPress={() => setActiveSection('finance')}
            icon={<Feather name="dollar-sign" size={14} color="#000000" />}
          />
          <M3Chip
            label="NOTES"
            selected={activeSection === 'notes'}
            onPress={() => setActiveSection('notes')}
            icon={<Feather name="file-text" size={14} color="#000000" />}
          />
          <M3Chip
            label="SECURITY"
            selected={activeSection === 'vault'}
            onPress={() => setActiveSection('vault')}
            icon={<Feather name="shield" size={14} color="#000000" />}
          />
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: spacing.grid2 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* HABITS SECTION */}
        {activeSection === 'habits' && (
          <>
            <View style={styles.sectionHeaderRow}>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: colors.text, fontSize: typography.sizes.sm },
                ]}
              >
                ACTIVE HABIT STREAKS ({habits.length})
              </Text>
            </View>

            {habits.length === 0 ? (
              <M3EmptyState
                icon="activity"
                title="NO HABITS TRACKED YET"
                description="Build daily momentum by tracking your first routine."
                actionTitle="CREATE HABIT"
                onAction={() => router.push('/modal')}
              />
            ) : (
              habits.map((h) => (
                <M3Card key={h.id} stripe="mint" style={styles.cardItem}>
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.cardTitleArea}>
                      <Text
                        style={[
                          styles.cardTitle,
                          { color: colors.text, fontSize: typography.sizes.base },
                        ]}
                      >
                        {h.name}
                      </Text>
                      <Text
                        style={[
                          styles.cardSubtitle,
                          {
                            color: colors.textMuted,
                            fontSize: typography.sizes.xs,
                          },
                        ]}
                      >
                        Target: {h.target_days_per_week} days/week •{' '}
                        {h.description || 'Focus block'}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => toggleHabit(h.id)}
                      style={[
                        styles.streakBadge,
                        {
                          backgroundColor: h.is_logged_today
                            ? colors.mint
                            : colors.surface,
                          borderColor: colors.border,
                          borderWidth: colors.borderWidth,
                          borderRadius: radii.sm,
                          shadowColor: shadowSmall.shadowColor,
                          shadowOffset: shadowSmall.shadowOffset,
                          shadowOpacity: shadowSmall.shadowOpacity,
                          shadowRadius: shadowSmall.shadowRadius,
                          elevation: shadowSmall.elevation,
                        },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={`Check in ${h.name}`}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Feather
                        name="check"
                        size={14}
                        color={h.is_logged_today ? '#000000' : colors.textMuted}
                      />
                      <Text
                        style={[
                          styles.streakText,
                          { color: '#000000', fontSize: typography.sizes.xs },
                        ]}
                      >
                        {h.streak_current}d
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
              <Text
                style={[
                  styles.sectionTitle,
                  { color: colors.text, fontSize: typography.sizes.sm },
                ]}
              >
                ACTIVE GOALS ({goals.length})
              </Text>
            </View>

            {goals.length === 0 ? (
              <M3EmptyState
                icon="award"
                title="NO GOALS CREATED"
                description="Set milestone targets and track your long-term progress."
                actionTitle="ADD A GOAL"
                onAction={() => router.push('/modal')}
              />
            ) : (
              goals.map((g) => {
                const percent = Math.min(
                  100,
                  Math.max(0, Math.round(g.progress_percent))
                );
                return (
                  <M3Card key={g.id} stripe="yellow" style={styles.cardItem}>
                    <View style={styles.goalHeaderRow}>
                      <View style={{ flex: 1, paddingRight: 8 }}>
                        <Text
                          style={[
                            styles.cardTitle,
                            { color: colors.text, fontSize: typography.sizes.base },
                          ]}
                        >
                          {g.title}
                        </Text>
                        <Text
                          style={[
                            styles.cardSubtitle,
                            {
                              color: colors.textMuted,
                              fontSize: typography.sizes.xs,
                            },
                          ]}
                        >
                          Progress: {percent}% • {g.description || 'Target milestone'}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.percentBadge,
                          {
                            backgroundColor: colors.yellow,
                            borderColor: colors.border,
                            borderWidth: colors.borderWidth,
                            borderRadius: radii.sm,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.percentText,
                            { color: '#000000', fontSize: typography.sizes.xs },
                          ]}
                        >
                          {percent}%
                        </Text>
                      </View>
                    </View>

                    {/* Progress Bar */}
                    <View
                      style={[
                        styles.progressTrack,
                        {
                          borderColor: colors.border,
                          borderWidth: colors.borderWidth,
                          borderRadius: radii.sm,
                          backgroundColor: colors.surfaceAlt,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${percent}%`,
                            backgroundColor: colors.yellow,
                          },
                        ]}
                      />
                    </View>

                    <View style={styles.stepperRow}>
                      <Pressable
                        onPress={() => handleStepGoal(g.id, -1)}
                        style={[
                          styles.stepBtn,
                          {
                            backgroundColor: colors.surface,
                            borderColor: colors.border,
                            borderWidth: colors.borderWidth,
                            borderRadius: radii.sm,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.stepBtnText,
                            { color: colors.text, fontSize: typography.sizes.xs },
                          ]}
                        >
                          -1
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={() => handleStepGoal(g.id, 1)}
                        style={[
                          styles.stepBtn,
                          {
                            backgroundColor: colors.surface,
                            borderColor: colors.border,
                            borderWidth: colors.borderWidth,
                            borderRadius: radii.sm,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.stepBtnText,
                            { color: colors.text, fontSize: typography.sizes.xs },
                          ]}
                        >
                          +1
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={() => handleStepGoal(g.id, 5)}
                        style={[
                          styles.stepBtn,
                          {
                            backgroundColor: colors.yellow,
                            borderColor: colors.border,
                            borderWidth: colors.borderWidth,
                            borderRadius: radii.sm,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.stepBtnText,
                            { color: '#000000', fontSize: typography.sizes.xs },
                          ]}
                        >
                          +5
                        </Text>
                      </Pressable>
                    </View>
                  </M3Card>
                );
              })
            )}
          </>
        )}

        {/* FINANCE SECTION (Strict Blue Color Role) */}
        {activeSection === 'finance' && (
          <>
            <View style={styles.sectionHeaderRow}>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: colors.text, fontSize: typography.sizes.sm },
                ]}
              >
                CURRENCY SELECTOR
              </Text>
            </View>

            <View style={styles.currencyRow}>
              {(['USD', 'ZiG', 'ZAR'] as const).map((c) => (
                <Pressable
                  key={c}
                  onPress={() => handleChangeCurrency(CURRENCIES[c])}
                  style={[
                    styles.currChip,
                    {
                      backgroundColor:
                        currency.code === c ? colors.blue : colors.surface,
                      borderColor: colors.border,
                      borderWidth: colors.borderWidth,
                      borderRadius: radii.sm,
                      shadowColor: shadowSmall.shadowColor,
                      shadowOffset: shadowSmall.shadowOffset,
                      shadowOpacity: shadowSmall.shadowOpacity,
                      shadowRadius: shadowSmall.shadowRadius,
                      elevation: shadowSmall.elevation,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.currChipText,
                      { color: '#000000', fontSize: typography.sizes.xs },
                    ]}
                  >
                    {c}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Cashbox Summary */}
            <M3Card stripe="blue" style={styles.cardItem}>
              <View style={styles.cashboxGrid}>
                <View
                  style={[
                    styles.cashboxCol,
                    {
                      backgroundColor: colors.mint,
                      borderColor: colors.border,
                      borderWidth: colors.borderWidth,
                      borderRadius: radii.sm,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.cashboxLbl,
                      { color: '#000000', fontSize: typography.sizes.xs },
                    ]}
                  >
                    INCOME
                  </Text>
                  <Text
                    style={[
                      styles.cashboxVal,
                      {
                        color: '#000000',
                        fontSize: typography.sizes.sm,
                        fontFamily: typography.fonts.numeric,
                      },
                    ]}
                  >
                    {CurrencyService.formatCents(
                      financeSummary.total_income_cents,
                      currency
                    )}
                  </Text>
                </View>
                <View
                  style={[
                    styles.cashboxCol,
                    {
                      backgroundColor: colors.pink,
                      borderColor: colors.border,
                      borderWidth: colors.borderWidth,
                      borderRadius: radii.sm,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.cashboxLbl,
                      { color: '#FFFFFF', fontSize: typography.sizes.xs },
                    ]}
                  >
                    EXPENSES
                  </Text>
                  <Text
                    style={[
                      styles.cashboxVal,
                      {
                        color: '#FFFFFF',
                        fontSize: typography.sizes.sm,
                        fontFamily: typography.fonts.numeric,
                      },
                    ]}
                  >
                    {CurrencyService.formatCents(
                      financeSummary.total_expense_cents,
                      currency
                    )}
                  </Text>
                </View>
                <View
                  style={[
                    styles.cashboxCol,
                    {
                      backgroundColor: colors.yellow,
                      borderColor: colors.border,
                      borderWidth: colors.borderWidth,
                      borderRadius: radii.sm,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.cashboxLbl,
                      { color: '#000000', fontSize: typography.sizes.xs },
                    ]}
                  >
                    BALANCE
                  </Text>
                  <Text
                    style={[
                      styles.cashboxVal,
                      {
                        color: '#000000',
                        fontSize: typography.sizes.sm,
                        fontFamily: typography.fonts.numeric,
                      },
                    ]}
                  >
                    {CurrencyService.formatCents(
                      financeSummary.net_balance_cents,
                      currency
                    )}
                  </Text>
                </View>
              </View>
            </M3Card>

            <View style={styles.subSectionTitleRow}>
              <Text
                style={[
                  styles.subSectionTitle,
                  { color: colors.text, fontSize: typography.sizes.sm },
                ]}
              >
                RECENT TRANSACTIONS ({recentTransactions.length})
              </Text>
            </View>

            {recentTransactions.length === 0 ? (
              <M3EmptyState
                icon="dollar-sign"
                title="NO TRANSACTIONS LOGGED"
                description="Keep track of your income and expenses in your local SQLite ledger."
                actionTitle="LOG EXPENSE"
                onAction={() => router.push('/modal')}
              />
            ) : (
              recentTransactions.map((tx) => (
                <M3Card key={tx.id} stripe="blue" style={styles.txCard}>
                  <View style={styles.txRow}>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.cardTitle,
                          { color: colors.text, fontSize: typography.sizes.base },
                        ]}
                      >
                        {tx.description || tx.category}
                      </Text>
                      <Text
                        style={[
                          styles.cardSubtitle,
                          {
                            color: colors.textMuted,
                            fontSize: typography.sizes.xs,
                          },
                        ]}
                      >
                        {tx.category.toUpperCase()} • {tx.transaction_date}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.txAmount,
                        {
                          color:
                            tx.type === 'income' ? colors.mint : colors.pink,
                          fontSize: typography.sizes.base,
                          fontFamily: typography.fonts.numeric,
                        },
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
              <Text
                style={[
                  styles.sectionTitle,
                  { color: colors.text, fontSize: typography.sizes.sm },
                ]}
              >
                PERSONAL NOTES ({notes.length})
              </Text>
            </View>

            {notes.length === 0 ? (
              <M3EmptyState
                icon="file-text"
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
                  stripe="yellow"
                  style={styles.cardItem}
                  onPress={() => {
                    setSelectedNote(n);
                    setNoteModalVisible(true);
                  }}
                >
                  <Text
                    style={[
                      styles.cardTitle,
                      { color: colors.text, fontSize: typography.sizes.base },
                    ]}
                  >
                    {n.title}
                  </Text>
                  <Text
                    style={[
                      styles.cardSubtitle,
                      {
                        color: colors.textMuted,
                        fontSize: typography.sizes.xs,
                        marginTop: 4,
                      },
                    ]}
                    numberOfLines={3}
                  >
                    {n.content}
                  </Text>
                  {n.tags ? (
                    <View
                      style={[
                        styles.noteTagBadge,
                        {
                          backgroundColor: colors.surfaceAlt,
                          borderColor: colors.border,
                          borderWidth: colors.borderWidth,
                          borderRadius: radii.sm,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.noteTagText,
                          { color: colors.text, fontSize: typography.sizes.xs },
                        ]}
                      >
                        #{n.tags.toUpperCase()}
                      </Text>
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
              <Text
                style={[
                  styles.sectionTitle,
                  { color: colors.text, fontSize: typography.sizes.sm },
                ]}
              >
                OVER-THE-AIR (OTA) WI-FI UPDATES
              </Text>
            </View>

            <M3Card stripe="purple" style={styles.cardItem}>
              <View style={styles.otaHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.cardTitle,
                      { color: colors.text, fontSize: typography.sizes.base },
                    ]}
                  >
                    LifeOS Mobile
                  </Text>
                  <Text
                    style={[
                      styles.cardSubtitle,
                      {
                        color: colors.textMuted,
                        fontSize: typography.sizes.xs,
                        marginTop: 2,
                      },
                    ]}
                  >
                    Wi-Fi OTA update listener active
                  </Text>
                </View>
                <View
                  style={[
                    styles.wifiStatusBadge,
                    {
                      backgroundColor: updateStatus.isWifi
                        ? colors.mint
                        : colors.yellow,
                      borderColor: colors.border,
                      borderWidth: colors.borderWidth,
                      borderRadius: radii.sm,
                    },
                  ]}
                >
                  <Feather
                    name={updateStatus.isWifi ? 'wifi' : 'radio'}
                    size={14}
                    color="#000000"
                  />
                  <Text
                    style={[
                      styles.wifiStatusText,
                      { color: '#000000', fontSize: typography.sizes.xs },
                    ]}
                  >
                    {updateStatus.isWifi ? 'WI-FI' : 'CELLULAR'}
                  </Text>
                </View>
              </View>

              {updateStatus.isDownloaded ? (
                <View
                  style={[
                    styles.updateAvailableBox,
                    {
                      backgroundColor: colors.yellow,
                      borderColor: colors.border,
                      borderWidth: colors.borderWidth,
                      borderRadius: radii.sm,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.updateAvailableText,
                      { color: '#000000', fontSize: typography.sizes.xs },
                    ]}
                  >
                    ⚡ New OTA update has been downloaded. Restart to activate!
                  </Text>
                  <M3Button
                    title="RESTART & APPLY NOW"
                    onPress={handleApplyUpdate}
                    variant="primary"
                    size="sm"
                  />
                </View>
              ) : (
                <M3Button
                  title={
                    updateStatus.isChecking
                      ? 'CHECKING...'
                      : 'CHECK FOR UPDATES'
                  }
                  onPress={handleCheckUpdate}
                  variant="secondary"
                  size="sm"
                  loading={updateStatus.isChecking}
                />
              )}
            </M3Card>

            {/* Cryptographic Backup Vault */}
            <View style={styles.sectionHeaderRow}>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: colors.text, fontSize: typography.sizes.sm },
                ]}
              >
                CRYPTOGRAPHIC DATA VAULT
              </Text>
            </View>

            <M3Card stripe="purple" style={styles.cardItem}>
              <Text
                style={[
                  styles.cardTitle,
                  { color: colors.text, fontSize: typography.sizes.base },
                ]}
              >
                SHA-256 Vault Snapshot
              </Text>
              <Text
                style={[
                  styles.cardSubtitle,
                  {
                    color: colors.textMuted,
                    fontSize: typography.sizes.xs,
                    marginTop: 4,
                  },
                ]}
              >
                Export full JSON backup with cryptographic integrity verification. Zero telemetry, 100% offline.
              </Text>
              <View style={{ marginTop: 12 }}>
                <M3Button
                  title="EXPORT ENCRYPTED BACKUP"
                  onPress={handleExportBackup}
                  variant="primary"
                  size="sm"
                />
              </View>
            </M3Card>

            {/* Offline License Manager */}
            <View style={styles.sectionHeaderRow}>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: colors.text, fontSize: typography.sizes.sm },
                ]}
              >
                OFFLINE LICENSE MANAGER
              </Text>
            </View>

            <M3Card stripe="purple" style={styles.cardItem}>
              <View style={styles.licRow}>
                <View>
                  <Text
                    style={[
                      styles.cardTitle,
                      { color: colors.text, fontSize: typography.sizes.base },
                    ]}
                  >
                    Active Tier: {licenseInfo.tier.toUpperCase()}
                  </Text>
                  <Text
                    style={[
                      styles.cardSubtitle,
                      {
                        color: colors.textMuted,
                        fontSize: typography.sizes.xs,
                        marginTop: 2,
                      },
                    ]}
                  >
                    Holder: {licenseInfo.holderName || 'Local Device Owner'}
                  </Text>
                </View>
                <View
                  style={[
                    styles.licBadge,
                    {
                      backgroundColor: colors.yellow,
                      borderColor: colors.border,
                      borderWidth: colors.borderWidth,
                      borderRadius: radii.sm,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.licBadgeText,
                      { color: '#000000', fontSize: typography.sizes.xs },
                    ]}
                  >
                    {licenseInfo.isActivated ? 'ACTIVATED' : 'COMMUNITY'}
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
                    borderWidth: colors.borderWidth,
                    borderRadius: radii.sm,
                    color: colors.text,
                    fontSize: typography.sizes.xs,
                  },
                ]}
              />

              <M3Button
                title="ACTIVATE OFFLINE KEY"
                onPress={handleActivateKey}
                variant="secondary"
                size="sm"
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
    marginBottom: 12,
    marginTop: 6,
  },
  sectionTitle: {
    fontWeight: '800',
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
    fontWeight: '700',
  },
  cardSubtitle: {
    fontWeight: '500',
    marginTop: 2,
    lineHeight: 16,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 4,
  },
  streakText: {
    fontWeight: '700',
  },
  goalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  percentBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  percentText: {
    fontWeight: '800',
  },
  progressTrack: {
    height: 12,
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
    paddingVertical: 8,
    alignItems: 'center',
  },
  stepBtnText: {
    fontWeight: '700',
  },
  currencyRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  currChip: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
  },
  currChipText: {
    fontWeight: '700',
  },
  cashboxGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  cashboxCol: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  cashboxLbl: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  cashboxVal: {
    fontWeight: '800',
    marginTop: 2,
  },
  subSectionTitleRow: {
    marginVertical: 10,
  },
  subSectionTitle: {
    fontWeight: '800',
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
    fontWeight: '800',
  },
  noteTagBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  noteTagText: {
    fontWeight: '700',
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
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  wifiStatusText: {
    fontWeight: '700',
  },
  updateAvailableBox: {
    padding: 10,
    gap: 8,
  },
  updateAvailableText: {
    fontWeight: '700',
    lineHeight: 16,
  },
  licRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  licBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  licBadgeText: {
    fontWeight: '700',
  },
  licInput: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
});
