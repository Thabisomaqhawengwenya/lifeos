import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/src/design-system/ThemeContext';
import { M3Header } from '@/src/components/ui/M3Header';
import { M3Card } from '@/src/components/ui/M3Card';
import { M3Button } from '@/src/components/ui/M3Button';
import { M3Chip } from '@/src/components/ui/M3Chip';
import { haptic } from '@/src/design-system/haptics';

interface ProposedAction {
  id: string;
  type: 'create_task' | 'reschedule' | 'log_expense';
  title: string;
  details: string;
  status: 'pending' | 'confirmed' | 'cancelled';
}

export default function AssistantScreen() {
  const { colors, spacing, radii, typography } = useAppTheme();
  const [inputText, setInputText] = useState('');
  const [proposedAction, setProposedAction] = useState<ProposedAction | null>({
    id: 'act-1',
    type: 'create_task',
    title: 'Schedule Focus Block for SQLite Migrations',
    details: 'Due today at 3:00 PM • Priority: High • Category: Database',
    status: 'pending',
  });

  const promptSuggestions = [
    'Help me plan my day',
    'Summarize pending tasks',
    'Where did I spend most this month?',
    'Break down LifeOS phase 2',
  ];

  const handleConfirmAction = () => {
    haptic.success();
    if (proposedAction) {
      setProposedAction({ ...proposedAction, status: 'confirmed' });
    }
  };

  const handleCancelAction = () => {
    haptic.light();
    setProposedAction(null);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <M3Header
        badge="Autonomous Life Intelligence"
        title="AI Assistant"
        subtitle="Safe, grounded natural-language workspace partner"
      />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: spacing.lg }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Assistant Greeting Card */}
        <M3Card variant="filled" style={[styles.messageBubble, { backgroundColor: colors.surfaceVariant }]}>
          <View style={styles.assistantRow}>
            <View
              style={[
                styles.avatarCircle,
                { backgroundColor: colors.primaryContainer, borderRadius: radii.full },
              ]}
            >
              <Ionicons name="sparkles" size={16} color={colors.onPrimaryContainer} />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[typography.titleSmall, { color: colors.onSurface, fontWeight: '700' }]}>
                LifeOS Intelligence
              </Text>
              <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant, marginTop: 4 }]}>
                Hello Mr Q! I am monitoring your daily goals and deliverables. You have 2 high-priority tasks due today and an open focus window between 2:00 PM and 4:30 PM.
              </Text>
            </View>
          </View>
        </M3Card>

        {/* Action Safety Preview Card */}
        {proposedAction && (
          <M3Card
            variant="elevated"
            style={[
              styles.actionCard,
              {
                borderColor: proposedAction.status === 'confirmed' ? colors.success : colors.outlineVariant,
                borderWidth: 1,
              },
            ]}
          >
            <View style={styles.actionHeader}>
              <View
                style={[
                  styles.actionBadge,
                  {
                    backgroundColor:
                      proposedAction.status === 'confirmed'
                        ? colors.successContainer
                        : colors.primaryContainer,
                    borderRadius: radii.full,
                  },
                ]}
              >
                <Ionicons
                  name={proposedAction.status === 'confirmed' ? 'checkmark-circle' : 'shield-checkmark'}
                  size={14}
                  color={
                    proposedAction.status === 'confirmed'
                      ? colors.onSuccessContainer
                      : colors.onPrimaryContainer
                  }
                />
                <Text
                  style={[
                    typography.labelSmall,
                    {
                      color:
                        proposedAction.status === 'confirmed'
                          ? colors.onSuccessContainer
                          : colors.onPrimaryContainer,
                      marginLeft: 4,
                      fontWeight: '700',
                    },
                  ]}
                >
                  {proposedAction.status === 'confirmed' ? 'ACTION APPLIED' : 'PROPOSED ACTION'}
                </Text>
              </View>
            </View>

            <Text style={[typography.titleMedium, { color: colors.onSurface, marginTop: 8 }]}>
              {proposedAction.title}
            </Text>
            <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant, marginTop: 4 }]}>
              {proposedAction.details}
            </Text>

            {proposedAction.status === 'pending' ? (
              <View style={styles.actionButtonsRow}>
                <M3Button
                  title="Confirm & Apply"
                  variant="filled"
                  size="small"
                  onPress={handleConfirmAction}
                  style={{ flex: 1, marginRight: 8 }}
                />
                <M3Button
                  title="Dismiss"
                  variant="outlined"
                  size="small"
                  onPress={handleCancelAction}
                  style={{ flex: 1 }}
                />
              </View>
            ) : (
              <Text
                style={[
                  typography.labelSmall,
                  { color: colors.success, marginTop: 10, fontWeight: '600' },
                ]}
              >
                ✓ Record saved to local database
              </Text>
            )}
          </M3Card>
        )}

        {/* Suggestion Chips */}
        <Text style={[typography.labelMedium, { color: colors.onSurfaceVariant, marginTop: 16, marginBottom: 8 }]}>
          SUGGESTED QUERIES
        </Text>
        <View style={styles.chipsWrap}>
          {promptSuggestions.map((prompt, index) => (
            <M3Chip
              key={index}
              label={prompt}
              selected={false}
              onPress={() => {
                setInputText(prompt);
                haptic.selection();
              }}
            />
          ))}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Input Bar */}
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: colors.surface,
            borderTopColor: colors.divider,
            borderTopWidth: 1,
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.sm,
          },
        ]}
      >
        <TextInput
          value={inputText}
          onChangeText={setInputText}
          placeholder="Ask LifeOS to organize your life..."
          placeholderTextColor={colors.outline}
          style={[
            styles.textInput,
            {
              backgroundColor: colors.surfaceVariant,
              color: colors.onSurface,
              borderRadius: radii.full,
              paddingHorizontal: spacing.lg,
            },
          ]}
        />
        <Pressable
          onPress={() => {
            if (inputText.trim()) {
              haptic.medium();
              setInputText('');
            }
          }}
          style={[
            styles.sendButton,
            {
              backgroundColor: colors.primary,
              borderRadius: radii.full,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Send request to AI"
        >
          <Ionicons name="arrow-up" size={20} color={colors.onPrimary} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 8,
  },
  messageBubble: {
    padding: 16,
    marginBottom: 14,
  },
  assistantRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatarCircle: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionCard: {
    padding: 16,
    marginBottom: 14,
  },
  actionHeader: {
    flexDirection: 'row',
  },
  actionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    marginTop: 14,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    height: 44,
    fontSize: 14,
    marginRight: 10,
  },
  sendButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
