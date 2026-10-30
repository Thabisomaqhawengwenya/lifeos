import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAppTheme } from '@/src/design-system/ThemeContext';
import { M3Card } from '@/src/components/ui/M3Card';
import { M3Button } from '@/src/components/ui/M3Button';
import { BrandLogo } from './BrandLogo';
import {
  FinanceStatementParser,
} from '@/src/services/FinanceStatementParser';
import {
  FinanceRepository,
  TransactionItem,
} from '@/src/repositories/FinanceRepository';
import { haptic } from '@/src/design-system/haptics';

interface CsvStatementModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CsvStatementModal: React.FC<CsvStatementModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const { colors, spacing, typography, radii, shadowSmall } = useAppTheme();
  const [tab, setTab] = useState<'import' | 'export'>('import');
  const [csvInput, setCsvInput] = useState('');
  const [exportPreview, setExportPreview] = useState('');
  const [allTransactions, setAllTransactions] = useState<TransactionItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      setCsvInput('');
      loadExportData();
    }
  }, [visible]);

  const loadExportData = async () => {
    try {
      const list = await FinanceRepository.getAllTransactions(200);
      setAllTransactions(list);
      const csvStr = FinanceStatementParser.exportToCsv(list);
      setExportPreview(csvStr);
    } catch (err) {
      console.warn('Failed to generate export CSV:', err);
    }
  };

  const handleUseSampleCsv = () => {
    haptic.selection();
    const today = new Date().toISOString().split('T')[0];
    setCsvInput(
      `Date,Type,Amount,Category,Description,Provider\n` +
      `${today},expense,24.50,Groceries,OK Supermarket Eastlea,EcoCash\n` +
      `${today},expense,6.50,Dining & Food,Chicken Inn Lunch,InnBucks\n` +
      `${today},income,120.00,Contract,Client deposit,csv`
    );
  };

  const handleImport = async () => {
    if (!csvInput.trim()) {
      Alert.alert('Empty CSV', 'Please paste CSV content to import.');
      return;
    }

    const parsed = FinanceStatementParser.parseCsv(csvInput);
    if (!parsed.success || parsed.rows.length === 0) {
      Alert.alert('Invalid CSV', parsed.errors.join('\n') || 'No valid rows detected.');
      return;
    }

    setIsSubmitting(true);
    try {
      const count = await FinanceRepository.bulkCreateTransactions(
        parsed.rows.map((r) => ({
          type: r.type,
          amount_cents: r.amount_cents,
          category: r.category,
          description: r.description,
          provider: r.provider,
          transaction_date: r.date,
        }))
      );

      haptic.success();
      Alert.alert('Import Successful', `Successfully imported ${count} transactions into SQLite!`);
      onSuccess();
      onClose();
    } catch (err: any) {
      haptic.warning();
      Alert.alert('Import Failed', err.message || 'Could not insert CSV rows');
    } finally {
      setIsSubmitting(false);
    }
  };

  const parsedPreview = csvInput.trim() ? FinanceStatementParser.parseCsv(csvInput) : null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View
          style={[
            styles.modalContainer,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderWidth: colors.borderWidth,
              borderRadius: radii.md,
              shadowColor: shadowSmall.shadowColor,
              shadowOffset: shadowSmall.shadowOffset,
              shadowOpacity: shadowSmall.shadowOpacity,
              shadowRadius: shadowSmall.shadowRadius,
              elevation: shadowSmall.elevation,
            },
          ]}
        >
          {/* Header */}
          <View
            style={[
              styles.header,
              {
                borderBottomColor: colors.border,
                borderBottomWidth: colors.borderWidth,
              },
            ]}
          >
            <View style={styles.headerTitleRow}>
              <BrandLogo brand="csv" size={32} />
              <View style={{ marginLeft: spacing.grid1 }}>
                <Text
                  style={[
                    styles.title,
                    { color: colors.text, fontSize: typography.sizes.base },
                  ]}
                >
                  CSV STATEMENTS
                </Text>
                <Text
                  style={[
                    styles.subtitle,
                    { color: colors.textMuted, fontSize: typography.sizes.xs },
                  ]}
                >
                  Import bank sheets & export local SQLite records
                </Text>
              </View>
            </View>

            <Pressable
              onPress={onClose}
              style={[
                styles.closeBtn,
                {
                  backgroundColor: colors.surfaceAlt,
                  borderColor: colors.border,
                  borderWidth: colors.borderWidth,
                  borderRadius: radii.sm,
                },
              ]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Feather name="x" size={18} color={colors.text} />
            </Pressable>
          </View>

          {/* Mode Tabs */}
          <View
            style={[
              styles.modeRow,
              {
                borderBottomColor: colors.border,
                borderBottomWidth: colors.borderWidth,
              },
            ]}
          >
            <Pressable
              onPress={() => setTab('import')}
              style={[
                styles.tabBtn,
                tab === 'import' && { backgroundColor: colors.yellow },
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    color: '#000000',
                    fontSize: typography.sizes.xs,
                    fontWeight: tab === 'import' ? '800' : '600',
                  },
                ]}
              >
                IMPORT CSV
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setTab('export')}
              style={[
                styles.tabBtn,
                tab === 'export' && { backgroundColor: colors.yellow },
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    color: '#000000',
                    fontSize: typography.sizes.xs,
                    fontWeight: tab === 'export' ? '800' : '600',
                  },
                ]}
              >
                EXPORT CSV ({allTransactions.length})
              </Text>
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={[styles.body, { padding: spacing.grid2 }]}
            showsVerticalScrollIndicator={false}
          >
            {tab === 'import' ? (
              <>
                <View style={styles.inputHeaderRow}>
                  <Text
                    style={[
                      styles.fieldLabel,
                      { color: colors.text, fontSize: typography.sizes.xs },
                    ]}
                  >
                    PASTE STATEMENT CSV CONTENT
                  </Text>
                  <Pressable onPress={handleUseSampleCsv}>
                    <Text
                      style={[
                        styles.sampleLink,
                        { color: colors.blue, fontSize: typography.sizes.xs },
                      ]}
                    >
                      Insert Sample CSV
                    </Text>
                  </Pressable>
                </View>

                <TextInput
                  style={[
                    styles.textArea,
                    {
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                      borderWidth: colors.borderWidth,
                      borderRadius: radii.sm,
                      color: colors.text,
                      fontSize: typography.sizes.xs,
                      fontFamily: typography.fonts.numeric,
                    },
                  ]}
                  placeholder={`Date,Type,Amount,Category,Description,Provider\n2026-10-30,expense,15.00,Groceries,OK Mart,EcoCash`}
                  placeholderTextColor={colors.textMuted}
                  value={csvInput}
                  onChangeText={setCsvInput}
                  multiline
                  numberOfLines={5}
                  textAlignVertical="top"
                />

                {parsedPreview && (
                  <M3Card
                    stripe={parsedPreview.success ? 'mint' : 'pink'}
                    style={styles.previewCard}
                  >
                    {parsedPreview.success ? (
                      <View style={{ gap: 4 }}>
                        <Text
                          style={[
                            styles.successPreviewTitle,
                            { color: colors.text, fontSize: typography.sizes.sm, fontWeight: '800' },
                          ]}
                        >
                          ✅ {parsedPreview.rows.length} valid rows recognized:
                        </Text>
                        {parsedPreview.rows.slice(0, 3).map((r, i) => (
                          <Text
                            key={i}
                            style={[
                              styles.rowSnippet,
                              { color: colors.textMuted, fontSize: typography.sizes.xs, fontFamily: typography.fonts.numeric },
                            ]}
                          >
                            • {r.date} | {r.type.toUpperCase()} ${(r.amount_cents / 100).toFixed(2)} | {r.description} ({r.provider})
                          </Text>
                        ))}
                        {parsedPreview.rows.length > 3 && (
                          <Text style={{ color: colors.textMuted, fontSize: typography.sizes.xs }}>
                            + {parsedPreview.rows.length - 3} more row(s)...
                          </Text>
                        )}
                      </View>
                    ) : (
                      <Text style={{ color: colors.pink, fontSize: typography.sizes.xs, fontWeight: '700' }}>
                        ⚠️ {parsedPreview.errors.join(', ')}
                      </Text>
                    )}
                  </M3Card>
                )}

                <View style={styles.buttonContainer}>
                  <M3Button
                    title={isSubmitting ? 'IMPORTING...' : `IMPORT ${parsedPreview?.rows?.length || 0} ROWS TO SQLITE`}
                    variant="primary"
                    onPress={handleImport}
                    disabled={!parsedPreview || !parsedPreview.success || isSubmitting}
                    icon={<Feather name="download" size={16} color="#000000" />}
                  />
                </View>
              </>
            ) : (
              <>
                <Text
                  style={[
                    styles.fieldLabel,
                    { color: colors.text, fontSize: typography.sizes.xs, marginBottom: 8 },
                  ]}
                >
                  ALL SQLITE TRANSACTIONS (CSV FORMAT)
                </Text>

                <TextInput
                  style={[
                    styles.textArea,
                    {
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                      borderWidth: colors.borderWidth,
                      borderRadius: radii.sm,
                      color: colors.text,
                      fontSize: typography.sizes.xs,
                      fontFamily: typography.fonts.numeric,
                    },
                  ]}
                  value={exportPreview}
                  editable={false}
                  multiline
                  numberOfLines={7}
                  textAlignVertical="top"
                />

                <View style={styles.buttonContainer}>
                  <M3Button
                    title="EXPORT READY"
                    variant="primary"
                    onPress={() => {
                      haptic.success();
                      Alert.alert(
                        'CSV Export Ready',
                        `Generated ${allTransactions.length} records in standard CSV format.`
                      );
                    }}
                    icon={<Feather name="check" size={16} color="#000000" />}
                  />
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContainer: {
    maxHeight: '85%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  subtitle: {
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  modeRow: {
    flexDirection: 'row',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    letterSpacing: 0.5,
  },
  body: {
    paddingBottom: 20,
  },
  inputHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  fieldLabel: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  sampleLink: {
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  textArea: {
    minHeight: 110,
    padding: 12,
    marginBottom: 14,
  },
  previewCard: {
    marginBottom: 16,
  },
  successPreviewTitle: {
    marginBottom: 4,
  },
  rowSnippet: {
    marginBottom: 2,
  },
  buttonContainer: {
    marginTop: 4,
  },
});
