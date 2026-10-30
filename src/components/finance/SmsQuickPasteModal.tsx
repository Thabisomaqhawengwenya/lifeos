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
import { BrandLogo, BrandType } from './BrandLogo';
import {
  FinanceStatementParser,
  ParsedStatementResult,
} from '@/src/services/FinanceStatementParser';
import { FinanceRepository } from '@/src/repositories/FinanceRepository';
import { CurrencyService, CURRENCIES } from '@/src/services/CurrencyService';
import { haptic } from '@/src/design-system/haptics';

interface SmsQuickPasteModalProps {
  visible: boolean;
  provider: 'ecocash' | 'innbucks';
  onClose: () => void;
  onSuccess: () => void;
}

export const SmsQuickPasteModal: React.FC<SmsQuickPasteModalProps> = ({
  visible,
  provider,
  onClose,
  onSuccess,
}) => {
  const { colors, spacing, typography, radii, shadowSmall } = useAppTheme();
  const [smsText, setSmsText] = useState('');
  const [parsed, setParsed] = useState<ParsedStatementResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      setSmsText('');
      setParsed(null);
    }
  }, [visible, provider]);

  useEffect(() => {
    if (!smsText.trim()) {
      setParsed(null);
      return;
    }
    const result =
      provider === 'ecocash'
        ? FinanceStatementParser.parseEcoCashSms(smsText)
        : FinanceStatementParser.parseInnBucksSms(smsText);
    setParsed(result);
  }, [smsText, provider]);

  const handleUseSample = () => {
    haptic.selection();
    if (provider === 'ecocash') {
      setSmsText(
        'Approval Code: PP261030.1545.H12345. Payment of $18.50 to OK Mart Harare completed. New USD Balance: $42.10.'
      );
    } else {
      setSmsText(
        'Paid USD 6.50 at Chicken Inn Drive Thru. Receipt: CK9988. Balance USD 24.50.'
      );
    }
  };

  const handleSave = async () => {
    if (!parsed || !parsed.isValid) {
      Alert.alert('Incomplete SMS', 'Please paste a valid transaction notification.');
      return;
    }

    setIsSubmitting(true);
    try {
      await FinanceRepository.createTransaction({
        type: parsed.direction,
        amount_cents: parsed.amountCents,
        category: parsed.category,
        description: parsed.description,
        provider,
        transaction_date: parsed.date,
      });

      haptic.success();
      onSuccess();
      onClose();
    } catch (err: any) {
      haptic.warning();
      Alert.alert('Save Failed', err.message || 'Could not record transaction to SQLite');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEco = provider === 'ecocash';
  const brandName = isEco ? 'EcoCash' : 'InnBucks';

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
              <BrandLogo brand={provider} size={32} />
              <View style={{ marginLeft: spacing.grid1 }}>
                <Text
                  style={[
                    styles.title,
                    { color: colors.text, fontSize: typography.sizes.base },
                  ]}
                >
                  {brandName.toUpperCase()} SMS PARSER
                </Text>
                <Text
                  style={[
                    styles.subtitle,
                    { color: colors.textMuted, fontSize: typography.sizes.xs },
                  ]}
                >
                  Instant local extraction & SQLite ledgering
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

          <ScrollView
            contentContainerStyle={[styles.body, { padding: spacing.grid2 }]}
            showsVerticalScrollIndicator={false}
          >
            {/* Input Label & Sample Action */}
            <View style={styles.inputHeaderRow}>
              <Text
                style={[
                  styles.fieldLabel,
                  { color: colors.text, fontSize: typography.sizes.xs },
                ]}
              >
                PASTE {brandName.toUpperCase()} SMS TEXT
              </Text>
              <Pressable onPress={handleUseSample}>
                <Text
                  style={[
                    styles.sampleLink,
                    { color: colors.blue, fontSize: typography.sizes.xs },
                  ]}
                >
                  Insert Sample SMS
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
                  fontSize: typography.sizes.sm,
                  fontFamily: typography.fonts.numeric,
                },
              ]}
              placeholder={`Paste your ${brandName} SMS here...`}
              placeholderTextColor={colors.textMuted}
              value={smsText}
              onChangeText={setSmsText}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            {/* Live Parsing Output Preview */}
            {parsed && (
              <M3Card
                stripe={parsed.isValid ? (parsed.direction === 'income' ? 'mint' : 'pink') : 'yellow'}
                style={styles.previewCard}
              >
                {parsed.isValid ? (
                  <View style={styles.previewContent}>
                    <View style={styles.previewTopRow}>
                      <View
                        style={[
                          styles.dirBadge,
                          {
                            backgroundColor:
                              parsed.direction === 'income' ? colors.mint : colors.pink,
                            borderColor: colors.border,
                            borderWidth: colors.borderWidth,
                            borderRadius: radii.sm,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.dirText,
                            {
                              color: parsed.direction === 'income' ? '#000000' : '#FFFFFF',
                              fontSize: typography.sizes.xs,
                            },
                          ]}
                        >
                          {parsed.direction === 'income' ? 'INFLOW (INCOME)' : 'OUTFLOW (EXPENSE)'}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.parsedAmount,
                          {
                            color: colors.text,
                            fontSize: typography.sizes.lg,
                            fontFamily: typography.fonts.numeric,
                          },
                        ]}
                      >
                        {CurrencyService.formatCents(
                          parsed.amountCents,
                          CURRENCIES[parsed.currency] || CURRENCIES.USD
                        )}
                      </Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={[styles.detailLbl, { color: colors.textMuted, fontSize: typography.sizes.xs }]}>
                        Counterparty / Merchant:
                      </Text>
                      <Text style={[styles.detailVal, { color: colors.text, fontSize: typography.sizes.xs }]}>
                        {parsed.counterparty}
                      </Text>
                    </View>

                    {parsed.reference ? (
                      <View style={styles.detailRow}>
                        <Text style={[styles.detailLbl, { color: colors.textMuted, fontSize: typography.sizes.xs }]}>
                          Reference / Code:
                        </Text>
                        <Text style={[styles.detailVal, { color: colors.text, fontSize: typography.sizes.xs }]}>
                          {parsed.reference}
                        </Text>
                      </View>
                    ) : null}

                    <View style={styles.detailRow}>
                      <Text style={[styles.detailLbl, { color: colors.textMuted, fontSize: typography.sizes.xs }]}>
                        Category:
                      </Text>
                      <Text style={[styles.detailVal, { color: colors.text, fontSize: typography.sizes.xs }]}>
                        {parsed.category}
                      </Text>
                    </View>
                  </View>
                ) : (
                  <Text style={[styles.errorText, { color: colors.pink, fontSize: typography.sizes.xs }]}>
                    ⚠️ {parsed.error || 'Awaiting recognizable SMS details...'}
                  </Text>
                )}
              </M3Card>
            )}

            <View style={styles.buttonContainer}>
              <M3Button
                title={isSubmitting ? 'RECORDING...' : `CONFIRM & LOG TO SQLITE`}
                variant="primary"
                onPress={handleSave}
                disabled={!parsed || !parsed.isValid || isSubmitting}
                icon={<Feather name="check" size={16} color="#000000" />}
              />
            </View>
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
    minHeight: 90,
    padding: 12,
    marginBottom: 14,
  },
  previewCard: {
    marginBottom: 16,
  },
  previewContent: {
    gap: 8,
  },
  previewTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.08)',
    paddingBottom: 8,
  },
  dirBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  dirText: {
    fontWeight: '800',
  },
  parsedAmount: {
    fontWeight: '900',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLbl: {
    fontWeight: '600',
  },
  detailVal: {
    fontWeight: '700',
  },
  errorText: {
    fontWeight: '700',
  },
  buttonContainer: {
    marginTop: 4,
  },
});
