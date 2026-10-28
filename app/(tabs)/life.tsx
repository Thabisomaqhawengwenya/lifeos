import { NoteEditorModal } from '@/src/components/notes/NoteEditorModal';
import { BrutalButton } from '@/src/components/ui/BrutalButton';
import { BrutalFAB } from '@/src/components/ui/BrutalFAB';
import { BrutalHeader } from '@/src/components/ui/BrutalHeader';
import { haptic } from '@/src/design-system/haptics';
import { useAppTheme } from '@/src/design-system/ThemeContext';
import { FinanceRepository, FinanceSummary, TransactionItem } from '@/src/repositories/FinanceRepository';
import { HabitItem, HabitRepository } from '@/src/repositories/HabitRepository';
import { GoalItem, GoalRepository, NoteItem, NoteRepository } from '@/src/repositories/NoteAndGoalRepository';
import { CURRENCIES, CurrencyConfig, CurrencyService, SupportedCurrency } from '@/src/services/CurrencyService';
import { LicenseInfo, LicenseService } from '@/src/services/LicenseService';
import { SecurityService } from '@/src/services/SecurityService';
import { updateService, UpdateStatus } from '@/src/services/UpdateService';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

type LifeSection = 'habits' | 'goals' | 'finance' | 'notes' | 'vault';

const SECTIONS: { key: LifeSection; label: string; icon: string }[] = [
  { key: 'habits', label: 'Habits', icon: 'flame' },
  { key: 'goals', label: 'Goals', icon: 'trophy' },
  { key: 'finance', label: 'Finance', icon: 'wallet' },
  { key: 'notes', label: 'Notes', icon: 'document-text' },
  { key: 'vault', label: 'Vault', icon: 'shield-checkmark' },
];

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
        FinanceRepository.getAllTransactions(20),
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
      console.warn('Life screen load error:', err);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const toggleHabit = async (habitId: string) => {
    haptic.selection();
    const today = new Date().toISOString().split('T')[0];
    await HabitRepository.toggleHabitCheckIn(habitId, today);
    await loadData();
  };

  const handleUpdateGoalProgress = async (goalId: string, current: number, delta: number) => {
    haptic.selection();
    await GoalRepository.updateProgress(goalId, Math.max(0, Math.min(100, current + delta)));
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
      const json = await SecurityService.exportBackup();
      Alert.alert(
        'Backup ready',
        `SHA-256 checksum verified.\nSize: ${json.length} bytes\n\nData is stored locally — no cloud upload.`
      );
    } catch (err: any) {
      Alert.alert('Backup failed', err.message);
    }
  };

  const handleActivateKey = async () => {
    if (!keyInput.trim()) return;
    haptic.medium();
    const res = await LicenseService.activateLicense(keyInput.trim());
    if (res.success) {
      haptic.success();
      Alert.alert('Activated', `LifeOS ${res.tier?.toUpperCase()} license activated.`);
      setKeyInput('');
      await loadData();
    } else {
      haptic.warning();
      Alert.alert('Failed', res.error || 'Invalid key.');
    }
  };

  const handleCheckUpdate = async () => {
    haptic.medium();
    const found = await updateService.checkForUpdates(true);
    if (!found) Alert.alert('Up to date', 'Running the latest build.');
  };

  const shadowColor = isDark ? '#FFFFFF' : '#000000';
  const netPositive = financeSummary.net_balance_cents >= 0;

  // ── section renders ───────────────────────────────────────────────────────

  const renderHabits = () => (
    <>
      {habits.length === 0 ? (
        <View style={[styles.emptyBox, { borderColor: colors.border }]}>
          <Text style={[styles.emptyTitle, { color: colors.onBackground }]}>No habits tracked</Text>
          <Text style={[styles.emptyNote, { color: isDark ? '#666' : '#aaa' }]}>Tap + to add your first routine</Text>
        </View>
      ) : (
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
            >
              <View style={styles.habitCardTop}>
                <Ionicons
                  name={h.is_logged_today ? 'flame' : 'flame-outline'}
                  size={22}
                  color={h.is_logged_today ? '#000' : isDark ? '#555' : '#ccc'}
                />
                <View style={[styles.streakPill, { backgroundColor: colors.accentYellow, borderColor: colors.border }]}>
                  <Text style={styles.streakPillText}>{h.streak_current}d</Text>
                </View>
              </View>
              <Text style={[styles.habitName, { color: h.is_logged_today ? '#000' : colors.onSurface }]} numberOfLines={2}>
                {h.name}
              </Text>
              <Text style={[styles.habitFreq, { color: h.is_logged_today ? '#333' : isDark ? '#555' : '#aaa' }]}>
                {h.target_days_per_week}×/week · best {h.streak_best}d
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </>
  );

  const renderGoals = () => (
    <>
      {goals.length === 0 ? (
        <View style={[styles.emptyBox, { borderColor: colors.border }]}>
          <Text style={[styles.emptyTitle, { color: colors.onBackground }]}>No goals set</Text>
          <Text style={[styles.emptyNote, { color: isDark ? '#666' : '#aaa' }]}>Tap + to define a long-term target</Text>
        </View>
      ) : (
        goals.map((g) => (
          <View key={g.id} style={[styles.goalRow, { borderBottomColor: colors.border }]}>
            <View style={styles.goalRowTop}>
              <Text style={[styles.goalTitle, { color: colors.onSurface }]} numberOfLines={1}>{g.title}</Text>
              <Text style={[styles.goalPercent, { color: g.progress_percent === 100 ? colors.accentMint : colors.onBackground }]}>
                {g.progress_percent}%
              </Text>
            </View>
            {g.target_date ? (
              <Text style={[styles.goalMeta, { color: isDark ? '#666' : '#aaa' }]}>Due {g.target_date}</Text>
            ) : null}
            {/* Progress bar */}
            <View style={[styles.progressTrack, { borderColor: colors.border }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(100, Math.max(0, g.progress_percent))}%` as any,
                    backgroundColor: g.progress_percent === 100 ? colors.accentMint : colors.accentYellow,
                  },
                ]}
              />
            </View>
            <View style={styles.stepperRow}>
              <Pressable
                onPress={() => handleUpdateGoalProgress(g.id, g.progress_percent, -10)}
                style={[styles.stepBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
              >
                <Text style={[styles.stepBtnText, { color: colors.onSurface }]}>−10%</Text>
              </Pressable>
              <Pressable
                onPress={() => handleUpdateGoalProgress(g.id, g.progress_percent, +10)}
                style={[styles.stepBtn, { borderColor: colors.border, backgroundColor: colors.accentYellow }]}
              >
                <Text style={styles.stepBtnText}>+10%</Text>
              </Pressable>
            </View>
          </View>
        ))
      )}
    </>
  );

  const renderFinance = () => (
    <>
      {/* Currency row — ZiG first as the personality anchor */}
      <View style={styles.currencyRow}>
        {(['ZiG', 'USD', 'ZAR', 'EUR', 'GBP'] as SupportedCurrency[]).map((c) => {
          const active = currency.code === c;
          return (
            <Pressable
              key={c}
              onPress={() => handleSwitchCurrency(c)}
              style={[
                styles.currBtn,
                {
                  backgroundColor: active ? colors.accentYellow : colors.surface,
                  borderColor: colors.border,
                  shadowColor: active ? shadowColor : 'transparent',
                },
              ]}
            >
              <Text style={[styles.currBtnText, { color: active ? '#000' : isDark ? '#666' : '#999' }]}>
                {c}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Summary — 3 blocks, net balance gets emphasis */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryBlock, { backgroundColor: colors.accentJade, borderColor: colors.border }]}>
          <Text style={styles.summaryLbl}>IN</Text>
          <Text style={styles.summaryVal}>
            {CurrencyService.formatCents(financeSummary.total_income_cents, currency)}
          </Text>
        </View>
        <View style={[styles.summaryBlock, { backgroundColor: colors.accentCoral, borderColor: colors.border }]}>
          <Text style={[styles.summaryLbl, { color: '#fff' }]}>OUT</Text>
          <Text style={[styles.summaryVal, { color: '#fff' }]}>
            {CurrencyService.formatCents(financeSummary.total_expense_cents, currency)}
          </Text>
        </View>
        <View style={[
          styles.summaryBlockLarge,
          {
            backgroundColor: netPositive ? colors.accentYellow : colors.accentRed,
            borderColor: colors.border,
          },
        ]}>
          <Text style={[styles.summaryLbl, { color: netPositive ? '#000' : '#fff' }]}>NET</Text>
          <Text style={[styles.summaryVal, styles.summaryValLarge, { color: netPositive ? '#000' : '#fff' }]}>
            {CurrencyService.formatCents(Math.abs(financeSummary.net_balance_cents), currency)}
          </Text>
          <Text style={[styles.summaryNetSign, { color: netPositive ? '#333' : '#ffcccc' }]}>
            {netPositive ? 'surplus' : 'deficit'}
          </Text>
        </View>
      </View>

      {/* Ledger list — not cards, rows with a separator line */}
      <View style={styles.ledgerHeader}>
        <Text style={[styles.ledgerTitle, { color: isDark ? '#777' : '#aaa' }]}>RECENT TRANSACTIONS</Text>
        <Text style={[styles.ledgerTitle, { color: isDark ? '#777' : '#aaa' }]}>AMOUNT</Text>
      </View>

      {recentTransactions.length === 0 ? (
        <View style={[styles.emptyBox, { borderColor: colors.border }]}>
          <Text style={[styles.emptyTitle, { color: colors.onBackground }]}>No transactions logged</Text>
          <Text style={[styles.emptyNote, { color: isDark ? '#666' : '#aaa' }]}>Tap + to log an expense or income</Text>
        </View>
      ) : (
        recentTransactions.map((tx, i) => (
          <View
            key={tx.id}
            style={[
              styles.ledgerRow,
              { borderBottomColor: i === recentTransactions.length - 1 ? 'transparent' : colors.border },
            ]}
          >
            <View style={[styles.ledgerDot, { backgroundColor: tx.type === 'income' ? colors.accentMint : colors.accentRed }]} />
            <View style={styles.ledgerInfo}>
              <Text style={[styles.ledgerDesc, { color: colors.onSurface }]} numberOfLines={1}>
                {tx.description || tx.category}
              </Text>
              <Text style={[styles.ledgerMeta, { color: isDark ? '#666' : '#bbb' }]}>
                {tx.category} · {tx.transaction_date}
              </Text>
            </View>
            <Text style={[styles.ledgerAmount, { color: tx.type === 'income' ? colors.accentMint : colors.accentRed }]}>
              {tx.type === 'income' ? '+' : '-'}{CurrencyService.formatCents(tx.amount_cents, currency)}
            </Text>
          </View>
        ))
      )}
    </>
  );

  const renderNotes = () => (
    <>
      {notes.length === 0 ? (
        <View style={[styles.emptyBox, { borderColor: colors.border }]}>
          <Text style={[styles.emptyTitle, { color: colors.onBackground }]}>No notes yet</Text>
          <Text style={[styles.emptyNote, { color: isDark ? '#666' : '#aaa' }]}>Tap + to write your first note</Text>
        </View>
      ) : (
        notes.map((n, i) => (
          <Pressable
            key={n.id}
            onPress={() => { setSelectedNote(n); setNoteModalVisible(true); }}
            style={[styles.noteRow, { borderBottomColor: i === notes.length - 1 ? 'transparent' : colors.border }]}
          >
            {n.is_pinned && (
              <Ionicons name="pin" size={12} color={colors.accentYellow} style={{ marginRight: 6, marginTop: 2 }} />
            )}
            <View style={styles.noteInfo}>
              <Text style={[styles.noteTitle, { color: colors.onSurface }]} numberOfLines={1}>{n.title}</Text>
              <Text style={[styles.notePreview, { color: isDark ? '#666' : '#aaa' }]} numberOfLines={1}>
                {n.content}
              </Text>
              {n.tags ? (
                <Text style={[styles.noteTag, { color: isDark ? '#555' : '#ccc' }]}>#{n.tags}</Text>
              ) : null}
            </View>
            <Ionicons name="chevron-forward" size={14} color={isDark ? '#444' : '#ddd'} />
          </Pressable>
        ))
      )}
    </>
  );

  const renderVault = () => (
    <>
      {/* OTA */}
      <View style={[styles.vaultBlock, { borderColor: colors.border }]}>
        <View style={styles.vaultBlockHeader}>
          <Text style={[styles.vaultBlockTitle, { color: colors.onSurface }]}>Over-the-Air Updates</Text>
          <View style={[styles.wifiBadge, {
            backgroundColor: updateStatus.isWifi ? colors.accentJade : colors.surfaceVariant,
            borderColor: colors.border,
          }]}>
            <Ionicons name={updateStatus.isWifi ? 'wifi' : 'cellular'} size={11} color={updateStatus.isWifi ? '#000' : isDark ? '#888' : '#aaa'} />
            <Text style={[styles.wifiBadgeText, { color: updateStatus.isWifi ? '#000' : isDark ? '#888' : '#aaa' }]}>
              {updateStatus.isWifi ? 'Wi-Fi' : 'Cellular'}
            </Text>
          </View>
        </View>
        <Text style={[styles.vaultNote, { color: isDark ? '#666' : '#aaa' }]}>
          Updates download automatically on Wi-Fi. EAS channel: preview.
        </Text>
        {updateStatus.isDownloaded ? (
          <BrutalButton title="RESTART & APPLY UPDATE" onPress={async () => { haptic.heavy(); await updateService.applyUpdate(); }} variant="filled" size="small" />
        ) : (
          <BrutalButton
            title={updateStatus.isChecking ? 'CHECKING...' : 'CHECK NOW'}
            onPress={handleCheckUpdate}
            variant="tonal"
            size="small"
            loading={updateStatus.isChecking}
          />
        )}
      </View>

      {/* Backup */}
      <View style={[styles.vaultBlock, { borderColor: colors.border }]}>
        <Text style={[styles.vaultBlockTitle, { color: colors.onSurface }]}>Data Backup</Text>
        <Text style={[styles.vaultNote, { color: isDark ? '#666' : '#aaa' }]}>
          Exports all tables as JSON with a SHA-256 integrity checksum. No network required.
        </Text>
        <BrutalButton title="EXPORT BACKUP" onPress={handleExportBackup} variant="tonal" size="small" />
      </View>

      {/* License */}
      <View style={[styles.vaultBlock, { borderColor: colors.border }]}>
        <View style={styles.vaultBlockHeader}>
          <Text style={[styles.vaultBlockTitle, { color: colors.onSurface }]}>License</Text>
          <View style={[styles.tierBadge, {
            backgroundColor: licenseInfo.isActivated ? colors.accentYellow : colors.surfaceVariant,
            borderColor: colors.border,
          }]}>
            <Text style={[styles.tierBadgeText, { color: licenseInfo.isActivated ? '#000' : isDark ? '#888' : '#aaa' }]}>
              {licenseInfo.tier.toUpperCase()}
            </Text>
          </View>
        </View>
        {licenseInfo.holderName ? (
          <Text style={[styles.vaultNote, { color: isDark ? '#666' : '#aaa' }]}>
            Holder: {licenseInfo.holderName} · Expires {licenseInfo.expiresYear}
          </Text>
        ) : (
          <Text style={[styles.vaultNote, { color: isDark ? '#666' : '#aaa' }]}>No license key activated.</Text>
        )}
        <TextInput
          value={keyInput}
          onChangeText={setKeyInput}
          placeholder="LIFEOS-PRO-NAME-XXXX"
          placeholderTextColor={isDark ? '#555' : '#ccc'}
          style={[styles.keyInput, { backgroundColor: colors.surfaceVariant, borderColor: colors.border, color: colors.onSurface }]}
          autoCapitalize="characters"
        />
        <BrutalButton title="ACTIVATE KEY" onPress={handleActivateKey} variant="tonal" size="small" />
      </View>
    </>
  );

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <BrutalHeader
        badge="LIFE"
        title="Life"
        subtitle="Habits · Goals · Finance · Notes · Vault"
      />

      {/* Section tab bar — text tabs, not chips */}
      <View style={[styles.tabBar, { borderBottomColor: colors.border, backgroundColor: colors.background }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabBarContent}>
          {SECTIONS.map(({ key, label, icon }) => (
            <Pressable
              key={key}
              onPress={() => { haptic.selection(); setActiveSection(key); }}
              style={[
                styles.tab,
                activeSection === key && [styles.tabActive, { borderBottomColor: colors.accentYellow }],
              ]}
            >
              <Ionicons
                name={icon as any}
                size={14}
                color={activeSection === key ? colors.onBackground : isDark ? '#555' : '#bbb'}
              />
              <Text style={[
                styles.tabText,
                { color: activeSection === key ? colors.onBackground : isDark ? '#555' : '#bbb' },
              ]}>
                {label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={[styles.body, { paddingHorizontal: spacing.base }]}
        showsVerticalScrollIndicator={false}
      >
        {activeSection === 'habits' && renderHabits()}
        {activeSection === 'goals' && renderGoals()}
        {activeSection === 'finance' && renderFinance()}
        {activeSection === 'notes' && renderNotes()}
        {activeSection === 'vault' && renderVault()}
        <View style={{ height: 90 }} />
      </ScrollView>

      <BrutalFAB
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

      <NoteEditorModal
        visible={noteModalVisible}
        note={selectedNote}
        onClose={() => { setNoteModalVisible(false); setSelectedNote(null); }}
        onSaved={loadData}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Tab bar
  tabBar: { borderBottomWidth: 2.5 },
  tabBarContent: { paddingHorizontal: 16, gap: 0 },
  tab: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 11,
    borderBottomWidth: 3, borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomWidth: 3 },
  tabText: { fontFamily: 'SpaceMono', fontSize: 11, fontWeight: '700' },

  body: { paddingTop: 20 },

  // Habits grid (mirrors Home)
  habitGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  habitCard: {
    width: '47%', borderWidth: 2.5, borderRadius: 10, padding: 14,
    shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 3,
  },
  habitCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  streakPill: { borderWidth: 1.5, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 1 },
  streakPillText: { fontFamily: 'SpaceMono', fontSize: 10, fontWeight: '700', color: '#000' },
  habitName: { fontSize: 14, fontWeight: '600', lineHeight: 19 },
  habitFreq: { fontSize: 11, marginTop: 4 },

  // Goals list
  goalRow: { paddingVertical: 16, borderBottomWidth: 1 },
  goalRowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  goalTitle: { fontSize: 15, fontWeight: '600', flex: 1, marginRight: 12 },
  goalPercent: { fontFamily: 'SpaceMono', fontSize: 14, fontWeight: '900' },
  goalMeta: { fontSize: 12, marginBottom: 8 },
  progressTrack: {
    height: 10, borderWidth: 2, borderRadius: 6,
    backgroundColor: 'transparent', overflow: 'hidden', marginBottom: 10,
  },
  progressFill: { height: '100%' },
  stepperRow: { flexDirection: 'row', gap: 8 },
  stepBtn: { flex: 1, borderWidth: 2, borderRadius: 6, paddingVertical: 6, alignItems: 'center' },
  stepBtnText: { fontFamily: 'SpaceMono', fontSize: 11, fontWeight: '700', color: '#000' },

  // Finance
  currencyRow: { flexDirection: 'row', gap: 6, marginBottom: 16 },
  currBtn: {
    flex: 1, borderWidth: 2, borderRadius: 6, paddingVertical: 7, alignItems: 'center',
    shadowOffset: { width: 2, height: 2 }, shadowOpacity: 1, shadowRadius: 0,
  },
  currBtnText: { fontFamily: 'SpaceMono', fontSize: 11, fontWeight: '700' },
  summaryRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  summaryBlock: {
    flex: 1, borderWidth: 2.5, borderRadius: 8, paddingVertical: 12, alignItems: 'center',
    shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 3,
  },
  summaryBlockLarge: {
    flex: 1.4, borderWidth: 2.5, borderRadius: 8, paddingVertical: 12, alignItems: 'center',
    shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 3,
  },
  summaryLbl: { fontFamily: 'SpaceMono', fontSize: 9, fontWeight: '700', letterSpacing: 0.8, color: '#000' },
  summaryVal: { fontFamily: 'SpaceMono', fontSize: 13, fontWeight: '900', color: '#000', marginTop: 3 },
  summaryValLarge: { fontSize: 16 },
  summaryNetSign: { fontFamily: 'SpaceMono', fontSize: 9, fontWeight: '700', marginTop: 2 },
  ledgerHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  ledgerTitle: { fontFamily: 'SpaceMono', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  ledgerRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
  ledgerDot: { width: 8, height: 8, borderRadius: 4, marginRight: 10, flexShrink: 0 },
  ledgerInfo: { flex: 1, minWidth: 0 },
  ledgerDesc: { fontSize: 14, fontWeight: '600' },
  ledgerMeta: { fontSize: 11, marginTop: 2 },
  ledgerAmount: { fontFamily: 'SpaceMono', fontSize: 13, fontWeight: '900', marginLeft: 8 },

  // Notes list
  noteRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1 },
  noteInfo: { flex: 1, minWidth: 0 },
  noteTitle: { fontSize: 15, fontWeight: '600' },
  notePreview: { fontSize: 12, marginTop: 2 },
  noteTag: { fontSize: 11, marginTop: 3 },

  // Vault
  vaultBlock: { borderWidth: 2, borderRadius: 10, padding: 16, marginBottom: 14 },
  vaultBlockHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  vaultBlockTitle: { fontSize: 15, fontWeight: '700' },
  vaultNote: { fontSize: 13, lineHeight: 18, marginBottom: 12 },
  wifiBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1.5, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2,
  },
  wifiBadgeText: { fontFamily: 'SpaceMono', fontSize: 9, fontWeight: '700' },
  tierBadge: { borderWidth: 1.5, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 2 },
  tierBadgeText: { fontFamily: 'SpaceMono', fontSize: 9, fontWeight: '700' },
  keyInput: {
    borderWidth: 2, borderRadius: 6, paddingHorizontal: 12, paddingVertical: 9,
    fontSize: 13, marginBottom: 10, letterSpacing: 1,
  },

  // Shared empty state
  emptyBox: {
    borderWidth: 2, borderStyle: 'dashed', borderRadius: 10,
    paddingVertical: 36, alignItems: 'center',
  },
  emptyTitle: { fontFamily: 'SpaceMono', fontSize: 14, fontWeight: '700' },
  emptyNote: { fontSize: 13, marginTop: 6 },

  fab: { position: 'absolute', bottom: 24, right: 20 },
});
