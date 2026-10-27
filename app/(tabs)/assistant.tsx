import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/src/design-system/ThemeContext';
import { M3Header } from '@/src/components/ui/M3Header';
import { M3Card } from '@/src/components/ui/M3Card';
import { M3Button } from '@/src/components/ui/M3Button';
import { M3Chip } from '@/src/components/ui/M3Chip';
import { haptic } from '@/src/design-system/haptics';
import { AIAssistantService, ProposedAIAction, AssistantMessage } from '@/src/services/AIAssistantService';

export default function AssistantScreen() {
  const { colors, spacing, radii, typography } = useAppTheme();
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      id: 'msg-init',
      sender: 'assistant',
      text: 'Hello Mr Q! I am your LifeOS workspace assistant. Ask me to schedule tasks, track habits, log expenses, or organize your day.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [activeAction, setActiveAction] = useState<ProposedAIAction | null>(null);

  const promptSuggestions = [
    'Remind me to call accountant tomorrow at 9 AM',
    'Spent $45 on groceries',
    'Urgent task: review database index',
    'Track habit: Morning Run',
    'Note: LifeOS architecture decisions',
  ];

  const handleSend = () => {
    if (!inputText.trim()) return;
    haptic.medium();

    const userText = inputText.trim();
    setInputText('');

    const newMsg: AssistantMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const result = AIAssistantService.parseUserInput(userText);

    const assistantMsg: AssistantMessage = {
      id: `ast_${Date.now()}`,
      sender: 'assistant',
      text: result.responseText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      action: result.action,
    };

    setMessages((prev) => [...prev, newMsg, assistantMsg]);
    if (result.action) {
      setActiveAction(result.action);
    }
  };

  const handleConfirmAction = async () => {
    if (!activeAction) return;
    haptic.success();
    await AIAssistantService.applyAction(activeAction);
    setActiveAction({ ...activeAction, status: 'applied' });
  };

  const handleCancelAction = () => {
    haptic.light();
    setActiveAction(null);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <M3Header
        badge="Autonomous Life Intelligence"
        title="AI Assistant"
        subtitle="Safe, grounded natural-language workspace partner"
      />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: spacing.lg }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Chat Stream */}
        {messages.map((msg) => (
          <View
            key={msg.id}
            style={[
              styles.messageRow,
              msg.sender === 'user' ? styles.userRow : styles.assistantRow,
            ]}
          >
            {msg.sender === 'assistant' && (
              <View
                style={[
                  styles.avatarCircle,
                  { backgroundColor: colors.primaryContainer, borderRadius: radii.full },
                ]}
              >
                <Ionicons name="sparkles" size={14} color={colors.onPrimaryContainer} />
              </View>
            )}
            <View
              style={[
                styles.bubble,
                {
                  backgroundColor: msg.sender === 'user' ? colors.primary : colors.surfaceVariant,
                  borderRadius: radii.xl,
                },
              ]}
            >
              <Text
                style={[
                  typography.bodyMedium,
                  { color: msg.sender === 'user' ? colors.onPrimary : colors.onSurface },
                ]}
              >
                {msg.text}
              </Text>
            </View>
          </View>
        ))}

        {/* Action Safety Preview Card */}
        {activeAction && (
          <M3Card
            variant="elevated"
            style={[
              styles.actionCard,
              {
                borderColor: activeAction.status === 'applied' ? colors.success : colors.outlineVariant,
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
                      activeAction.status === 'applied'
                        ? colors.successContainer
                        : colors.primaryContainer,
                    borderRadius: radii.full,
                  },
                ]}
              >
                <Ionicons
                  name={activeAction.status === 'applied' ? 'checkmark-circle' : 'shield-checkmark'}
                  size={14}
                  color={
                    activeAction.status === 'applied'
                      ? colors.onSuccessContainer
                      : colors.onPrimaryContainer
                  }
                />
                <Text
                  style={[
                    typography.labelSmall,
                    {
                      color:
                        activeAction.status === 'applied'
                          ? colors.onSuccessContainer
                          : colors.onPrimaryContainer,
                      marginLeft: 4,
                      fontWeight: '700',
                    },
                  ]}
                >
                  {activeAction.status === 'applied' ? 'SAVED TO SQLITE' : 'PROPOSED ACTION'}
                </Text>
              </View>
            </View>

            <Text style={[typography.titleMedium, { color: colors.onSurface, marginTop: 8 }]}>
              {activeAction.title}
            </Text>
            <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant, marginTop: 4 }]}>
              {activeAction.details}
            </Text>

            {activeAction.status === 'pending' ? (
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
                ✓ Persisted to device database
              </Text>
            )}
          </M3Card>
        )}

        {/* Quick Suggestion Chips */}
        <Text style={[typography.labelMedium, { color: colors.onSurfaceVariant, marginTop: 16, marginBottom: 8 }]}>
          SUGGESTIONS
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
          placeholder="Type a task, expense, note or question..."
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
          onSubmitEditing={handleSend}
        />
        <Pressable
          onPress={handleSend}
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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 8,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-end',
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  assistantRow: {
    justifyContent: 'flex-start',
  },
  avatarCircle: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginBottom: 4,
  },
  bubble: {
    maxWidth: '82%',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  actionCard: {
    padding: 16,
    marginVertical: 12,
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
