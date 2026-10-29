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
import { Feather } from '@expo/vector-icons';
import { useAppTheme } from '@/src/design-system/ThemeContext';
import { M3Header } from '@/src/components/ui/M3Header';
import { M3Card } from '@/src/components/ui/M3Card';
import { M3Button } from '@/src/components/ui/M3Button';
import { M3Chip } from '@/src/components/ui/M3Chip';
import { haptic } from '@/src/design-system/haptics';
import {
  AIAssistantService,
  ProposedAIAction,
  AssistantMessage,
} from '@/src/services/AIAssistantService';

export default function AssistantScreen() {
  const { colors, spacing, typography, radii, shadowSmall, isDark } = useAppTheme();
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      id: 'msg-init',
      sender: 'assistant',
      text: 'Hello Mr Q! I am your LifeOS offline workspace assistant. Command me to schedule tasks, track habit routines, log expenses, or organize your day.',
      timestamp: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    },
  ]);
  const [activeAction, setActiveAction] = useState<ProposedAIAction | null>(null);

  const promptSuggestions = [
    'Remind me to call accountant tomorrow at 9 AM',
    'Spent $45 on groceries',
    'High priority task: review database index',
    'Track habit: Morning Deep Work',
    'Note: LifeOS Neo-Brutalism architecture',
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
      timestamp: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    const result = AIAssistantService.parseUserInput(userText);

    const assistantMsg: AssistantMessage = {
      id: `ast_${Date.now()}`,
      sender: 'assistant',
      text: result.responseText,
      timestamp: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
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
        title="AI Assistant"
        subtitle="Offline natural-language life organizer"
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: spacing.grid2 },
        ]}
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
                  styles.avatarBox,
                  {
                    backgroundColor: colors.purple,
                    borderColor: colors.border,
                    borderWidth: colors.borderWidth,
                    borderRadius: radii.sm,
                  },
                ]}
              >
                <Feather name="cpu" size={16} color="#000000" />
              </View>
            )}
            <View
              style={[
                styles.bubble,
                {
                  backgroundColor:
                    msg.sender === 'user' ? colors.yellow : colors.surface,
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
              <Text
                style={[
                  styles.bubbleText,
                  {
                    color: '#000000',
                    fontSize: typography.sizes.sm,
                  },
                ]}
              >
                {msg.text}
              </Text>
              <Text
                style={[
                  styles.timestampText,
                  {
                    color: '#555555',
                    fontSize: typography.sizes.xs,
                    fontFamily: typography.fonts.numeric,
                  },
                ]}
              >
                {msg.timestamp}
              </Text>
            </View>
          </View>
        ))}

        {/* Action Safety Preview Card */}
        {activeAction && (
          <M3Card
            stripe="purple"
            style={[
              styles.actionCard,
              {
                borderColor:
                  activeAction.status === 'applied'
                    ? colors.mint
                    : colors.border,
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
                        ? colors.mint
                        : colors.purple,
                    borderColor: colors.border,
                    borderWidth: colors.borderWidth,
                    borderRadius: radii.sm,
                  },
                ]}
              >
                <Feather
                  name={
                    activeAction.status === 'applied'
                      ? 'check-circle'
                      : 'shield'
                  }
                  size={14}
                  color="#000000"
                />
                <Text
                  style={[
                    styles.actionBadgeText,
                    { color: '#000000', fontSize: typography.sizes.xs },
                  ]}
                >
                  {activeAction.status === 'applied'
                    ? 'SAVED TO SQLITE'
                    : 'PROPOSED ACTION'}
                </Text>
              </View>
            </View>

            <Text
              style={[
                styles.actionTitle,
                { color: colors.text, fontSize: typography.sizes.base },
              ]}
            >
              {activeAction.title}
            </Text>
            <Text
              style={[
                styles.actionDetails,
                { color: colors.textMuted, fontSize: typography.sizes.xs },
              ]}
            >
              {activeAction.details}
            </Text>

            {activeAction.status === 'pending' ? (
              <View style={styles.actionButtonsRow}>
                <M3Button
                  title="CONFIRM & APPLY"
                  onPress={handleConfirmAction}
                  variant="primary"
                  size="sm"
                  style={{ flex: 1 }}
                />
                <M3Button
                  title="CANCEL"
                  onPress={handleCancelAction}
                  variant="secondary"
                  size="sm"
                  style={{ flex: 1 }}
                />
              </View>
            ) : (
              <View
                style={[
                  styles.appliedBanner,
                  {
                    backgroundColor: colors.mint,
                    borderColor: colors.border,
                    borderWidth: colors.borderWidth,
                    borderRadius: radii.sm,
                  },
                ]}
              >
                <Feather name="check" size={16} color="#000000" />
                <Text
                  style={[
                    styles.appliedBannerText,
                    { color: '#000000', fontSize: typography.sizes.xs },
                  ]}
                >
                  ACTION COMMITTED TO LOCAL DATABASE
                </Text>
              </View>
            )}
          </M3Card>
        )}

        {/* Quick Suggestion Chips */}
        <View style={styles.suggestionsContainer}>
          <Text
            style={[
              styles.suggestionTitle,
              { color: colors.text, fontSize: typography.sizes.xs },
            ]}
          >
            EXAMPLE COMMANDS:
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.suggestionScroll}
          >
            {promptSuggestions.map((prompt, idx) => (
              <M3Chip
                key={idx}
                label={prompt}
                onPress={() => {
                  haptic.selection();
                  setInputText(prompt);
                }}
              />
            ))}
          </ScrollView>
        </View>

        <View style={{ height: 90 }} />
      </ScrollView>

      {/* Input Box Bar */}
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            borderTopWidth: colors.borderWidth,
          },
        ]}
      >
        <TextInput
          value={inputText}
          onChangeText={setInputText}
          placeholder="Command LifeOS..."
          placeholderTextColor="#888888"
          style={[
            styles.textInput,
            {
              backgroundColor: colors.background,
              borderColor: colors.border,
              borderWidth: colors.borderWidth,
              borderRadius: radii.sm,
              color: colors.text,
              fontSize: typography.sizes.sm,
            },
          ]}
          onSubmitEditing={handleSend}
        />
        <Pressable
          onPress={handleSend}
          style={[
            styles.sendButton,
            {
              backgroundColor: colors.yellow,
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
          accessibilityLabel="Send command"
        >
          <Feather name="arrow-up" size={20} color="#000000" />
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
    paddingTop: 16,
    paddingBottom: 24,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 14,
    alignItems: 'flex-start',
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  assistantRow: {
    justifyContent: 'flex-start',
  },
  avatarBox: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginTop: 2,
  },
  bubble: {
    maxWidth: '82%',
    padding: 12,
  },
  bubbleText: {
    fontWeight: '600',
    lineHeight: 20,
  },
  timestampText: {
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  actionCard: {
    marginVertical: 12,
  },
  actionHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  actionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 4,
  },
  actionBadgeText: {
    fontWeight: '800',
  },
  actionTitle: {
    fontWeight: '700',
  },
  actionDetails: {
    fontWeight: '500',
    marginTop: 4,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  appliedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    gap: 6,
    marginTop: 12,
  },
  appliedBannerText: {
    fontWeight: '800',
  },
  suggestionsContainer: {
    marginTop: 16,
  },
  suggestionTitle: {
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  suggestionScroll: {
    gap: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  textInput: {
    flex: 1,
    height: 48,
    paddingHorizontal: 12,
    fontWeight: '600',
  },
  sendButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
