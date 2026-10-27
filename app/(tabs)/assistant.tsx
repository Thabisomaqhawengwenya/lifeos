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
  const { colors, spacing, isDark } = useAppTheme();
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      id: 'msg-init',
      sender: 'assistant',
      text: 'Hello Mr Q! I am your LifeOS offline workspace assistant. Command me to schedule tasks, track habit routines, log expenses, or organize your day.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [activeAction, setActiveAction] = useState<ProposedAIAction | null>(null);

  const promptSuggestions = [
    'Remind me to call accountant tomorrow at 9 AM',
    'Spent $45 on groceries',
    'Urgent task: review database index',
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

  const shadowColor = isDark ? '#FFFFFF' : '#000000';

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <M3Header
        badge="NEO-BRUTALIST • AI COMPANION"
        title="AI Assistant"
        subtitle="Safe, offline heuristic natural-language partner"
      />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: spacing.base }]}
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
                  { backgroundColor: colors.accentYellow, borderColor: colors.border },
                ]}
              >
                <Ionicons name="sparkles" size={14} color="#000000" />
              </View>
            )}
            <View
              style={[
                styles.bubble,
                {
                  backgroundColor: msg.sender === 'user' ? colors.accentYellow : colors.surface,
                  borderColor: colors.border,
                  shadowColor,
                },
              ]}
            >
              <Text style={styles.bubbleText}>
                {msg.text}
              </Text>
              <Text style={styles.timestampText}>{msg.timestamp}</Text>
            </View>
          </View>
        ))}

        {/* Action Safety Preview Card */}
        {activeAction && (
          <M3Card
            variant="lilac"
            style={[
              styles.actionCard,
              {
                borderColor: activeAction.status === 'applied' ? colors.accentJade : colors.border,
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
                        ? colors.accentJade
                        : colors.accentYellow,
                  },
                ]}
              >
                <Ionicons
                  name={activeAction.status === 'applied' ? 'checkmark-circle' : 'shield-checkmark'}
                  size={14}
                  color="#000000"
                />
                <Text style={styles.actionBadgeText}>
                  {activeAction.status === 'applied' ? 'SAVED TO SQLITE' : 'PROPOSED ACTION'}
                </Text>
              </View>
            </View>

            <Text style={styles.actionTitle}>
              {activeAction.title}
            </Text>
            <Text style={styles.actionDetails}>
              {activeAction.details}
            </Text>

            {activeAction.status === 'pending' ? (
              <View style={styles.actionButtonsRow}>
                <M3Button
                  title="CONFIRM & APPLY"
                  onPress={handleConfirmAction}
                  variant="filled"
                  size="small"
                  style={{ flex: 1 }}
                />
                <M3Button
                  title="CANCEL"
                  onPress={handleCancelAction}
                  variant="tonal"
                  size="small"
                  style={{ flex: 1 }}
                />
              </View>
            ) : (
              <View style={styles.appliedBanner}>
                <Ionicons name="checkmark-done" size={16} color="#000000" />
                <Text style={styles.appliedBannerText}>ACTION COMMITTED TO LOCAL DATABASE</Text>
              </View>
            )}
          </M3Card>
        )}

        {/* Quick Suggestion Chips */}
        <View style={styles.suggestionsContainer}>
          <Text style={styles.suggestionTitle}>
            EXAMPLE COMMANDS:
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestionScroll}>
            {promptSuggestions.map((prompt, idx) => (
              <M3Chip
                key={idx}
                label={prompt}
                onPress={() => {
                  haptic.selection();
                  setInputText(prompt);
                }}
                colorScheme="yellow"
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
              color: colors.onBackground,
            },
          ]}
          onSubmitEditing={handleSend}
        />
        <Pressable
          onPress={handleSend}
          style={[
            styles.sendButton,
            {
              backgroundColor: colors.accentYellow,
              borderColor: colors.border,
              shadowColor,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Send command"
        >
          <Ionicons name="arrow-up" size={20} color="#000000" />
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
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  assistantRow: {
    justifyContent: 'flex-start',
  },
  avatarBox: {
    width: 28,
    height: 28,
    borderWidth: 2,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginTop: 2,
  },
  bubble: {
    maxWidth: '82%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 2,
    borderRadius: 8,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  bubbleText: {
    fontFamily: 'SpaceMono',
    fontSize: 13,
    fontWeight: '700',
    color: '#000000',
    lineHeight: 18,
  },
  timestampText: {
    fontFamily: 'SpaceMono',
    fontSize: 9,
    color: '#555555',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  actionCard: {
    marginVertical: 12,
  },
  actionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#000000',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    gap: 4,
  },
  actionBadgeText: {
    fontFamily: 'SpaceMono',
    fontSize: 10,
    fontWeight: '700',
    color: '#000000',
  },
  actionTitle: {
    fontFamily: 'SpaceMono',
    fontSize: 15,
    fontWeight: '900',
    color: '#000000',
    marginTop: 8,
  },
  actionDetails: {
    fontSize: 12,
    fontWeight: '600',
    color: '#222222',
    marginTop: 4,
    lineHeight: 16,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  appliedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#70E4BA',
    borderWidth: 1.5,
    borderColor: '#000000',
    borderRadius: 4,
    padding: 8,
    marginTop: 12,
    gap: 6,
  },
  appliedBannerText: {
    fontFamily: 'SpaceMono',
    fontSize: 10,
    fontWeight: '700',
    color: '#000000',
  },
  suggestionsContainer: {
    marginTop: 16,
  },
  suggestionTitle: {
    fontFamily: 'SpaceMono',
    fontSize: 10,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
  },
  suggestionScroll: {
    gap: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 2.5,
  },
  textInput: {
    flex: 1,
    height: 48,
    borderWidth: 2,
    borderRadius: 8,
    paddingHorizontal: 14,
    fontFamily: 'SpaceMono',
    fontSize: 13,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderWidth: 2,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
});
