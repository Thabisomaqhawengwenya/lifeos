import { haptic } from '@/src/design-system/haptics';
import { useAppTheme } from '@/src/design-system/ThemeContext';
import { AIAssistantService, AssistantMessage, ProposedAIAction } from '@/src/services/AIAssistantService';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useRef, useState } from 'react';
import {
    FlatList,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Prompt suggestions — short enough to read at a glance
const PROMPTS = [
  'Spent $45 on groceries',
  'Urgent task: DB indexing',
  'Track habit: Deep Work',
  'Note: architecture idea',
  'Remind me: call accountant',
];

export default function AssistantScreen() {
  const { colors, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      id: 'init',
      sender: 'assistant',
      text: 'Ready. Tell me what to log, schedule, or track.',
      timestamp: now(),
    },
  ]);
  const [pendingAction, setPendingAction] = useState<ProposedAIAction | null>(null);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
  const listRef = useRef<FlatList>(null);

  const shadowColor = isDark ? '#FFFFFF' : '#000000';

  function now() {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  const send = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    haptic.medium();
    setInput('');

    const userMsg: AssistantMessage = {
      id: `u_${Date.now()}`,
      sender: 'user',
      text: trimmed,
      timestamp: now(),
    };

    const result = AIAssistantService.parseUserInput(trimmed);
    const assistantMsg: AssistantMessage = {
      id: `a_${Date.now()}`,
      sender: 'assistant',
      text: result.responseText,
      timestamp: now(),
      action: result.action,
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    if (result.action) setPendingAction(result.action);

    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
  }, []);

  const confirmAction = async () => {
    if (!pendingAction) return;
    haptic.success();
    await AIAssistantService.applyAction(pendingAction);
    setAppliedIds((prev) => new Set(prev).add(pendingAction.id));
    setPendingAction(null);
  };

  const dismissAction = () => {
    haptic.light();
    setPendingAction(null);
  };

  // ── render helpers ─────────────────────────────────────────────────────────

  const renderEntry = ({ item: msg }: { item: AssistantMessage }) => {
    const isUser = msg.sender === 'user';

    return (
      <View
        style={[
          styles.entry,
          {
            borderLeftColor: isUser ? colors.accentYellow : isDark ? '#333' : '#e8e8e8',
            backgroundColor: isUser
              ? isDark ? '#1f1a00' : '#fffde6'
              : colors.background,
          },
        ]}
      >
        <View style={styles.entryHeader}>
          <Text style={[styles.entrySender, { color: isUser ? colors.accentYellow : isDark ? '#555' : '#ccc' }]}>
            {isUser ? '> YOU' : '~ BOT'}
          </Text>
          <Text style={[styles.entryTime, { color: isDark ? '#444' : '#ccc' }]}>{msg.timestamp}</Text>
        </View>
        <Text style={[styles.entryText, { color: colors.onBackground }]}>{msg.text}</Text>

        {/* Inline applied indicator */}
        {msg.action && appliedIds.has(msg.action.id) && (
          <View style={[styles.appliedTag, { backgroundColor: colors.accentMint, borderColor: colors.border }]}>
            <Ionicons name="checkmark" size={11} color="#000" />
            <Text style={styles.appliedTagText}>SAVED</Text>
          </View>
        )}
      </View>
    );
  };

  // ── main render ────────────────────────────────────────────────────────────

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Header — minimal, inline */}
      <View
        style={[
          styles.header,
          {
            paddingTop: Math.max(insets.top, 12) + 4,
            borderBottomColor: colors.border,
            backgroundColor: colors.background,
          },
        ]}
      >
        <View style={styles.headerLeft}>
          <View style={[styles.headerDot, { backgroundColor: colors.accentYellow, borderColor: colors.border }]} />
          <Text style={[styles.headerTitle, { color: colors.onBackground }]}>AI BOT</Text>
          <Text style={[styles.headerSub, { color: isDark ? '#555' : '#bbb' }]}>offline · no api · on-device</Text>
        </View>
        <View style={[styles.headerBadge, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
          <Text style={[styles.headerBadgeText, { color: isDark ? '#888' : '#999' }]}>HEURISTIC</Text>
        </View>
      </View>

      {/* Message log */}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        renderItem={renderEntry}
        contentContainerStyle={styles.log}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
      />

      {/* Pending action confirmation strip */}
      {pendingAction && (
        <View
          style={[
            styles.actionStrip,
            { backgroundColor: colors.accentLilac, borderTopColor: colors.border, borderBottomColor: colors.border },
          ]}
        >
          <View style={styles.actionStripLeft}>
            <Text style={styles.actionStripType}>{pendingAction.type.replace('_', ' ').toUpperCase()}</Text>
            <Text style={styles.actionStripTitle} numberOfLines={1}>{pendingAction.title.replace(/^[^:]+:\s*/, '')}</Text>
            <Text style={styles.actionStripDetail} numberOfLines={1}>{pendingAction.details}</Text>
          </View>
          <View style={styles.actionStripBtns}>
            <Pressable
              onPress={confirmAction}
              style={[styles.actionBtn, styles.actionBtnConfirm, { borderColor: colors.border, shadowColor }]}
            >
              <Ionicons name="checkmark" size={16} color="#000" />
            </Pressable>
            <Pressable
              onPress={dismissAction}
              style={[styles.actionBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <Ionicons name="close" size={16} color={isDark ? '#888' : '#999'} />
            </Pressable>
          </View>
        </View>
      )}

      {/* Prompt suggestions — single scrollable row, only shown when input empty */}
      {!input && (
        <View style={[styles.promptsRow, { borderTopColor: isDark ? '#222' : '#f0f0f0' }]}>
          <FlatList
            data={PROMPTS}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(p) => p}
            contentContainerStyle={styles.promptsContent}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => { haptic.selection(); setInput(item); }}
                style={[styles.promptChip, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <Text style={[styles.promptChipText, { color: isDark ? '#888' : '#999' }]}>{item}</Text>
              </Pressable>
            )}
          />
        </View>
      )}

      {/* Input bar — command prompt style */}
      <View
        style={[
          styles.inputBar,
          {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            paddingBottom: Math.max(insets.bottom, 12),
          },
        ]}
      >
        <Text style={[styles.prompt, { color: colors.accentYellow }]}>{'>'}</Text>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="type a command..."
          placeholderTextColor={isDark ? '#444' : '#ccc'}
          style={[styles.input, { color: colors.onSurface }]}
          onSubmitEditing={() => send(input)}
          returnKeyType="send"
          blurOnSubmit={false}
        />
        <Pressable
          onPress={() => send(input)}
          disabled={!input.trim()}
          style={[
            styles.sendBtn,
            {
              backgroundColor: input.trim() ? colors.accentYellow : isDark ? '#222' : '#f5f5f5',
              borderColor: colors.border,
              shadowColor: input.trim() ? shadowColor : 'transparent',
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Send"
        >
          <Ionicons name="return-down-back" size={18} color={input.trim() ? '#000' : isDark ? '#444' : '#ccc'} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 2.5,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerDot: { width: 10, height: 10, borderRadius: 3, borderWidth: 2 },
  headerTitle: { fontFamily: 'SpaceMono', fontSize: 16, fontWeight: '900' },
  headerSub: { fontSize: 12 },
  headerBadge: { borderWidth: 1.5, borderRadius: 4, paddingHorizontal: 7, paddingVertical: 2 },
  headerBadgeText: { fontFamily: 'SpaceMono', fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },

  // Log
  log: { paddingBottom: 8 },

  // Entry (terminal log style)
  entry: {
    borderLeftWidth: 3,
    paddingLeft: 14, paddingRight: 16, paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  entryHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  entrySender: { fontFamily: 'SpaceMono', fontSize: 9, fontWeight: '700', letterSpacing: 0.8 },
  entryTime: { fontFamily: 'SpaceMono', fontSize: 9 },
  entryText: { fontSize: 14, lineHeight: 20 },
  appliedTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    alignSelf: 'flex-start', borderWidth: 1.5, borderRadius: 4,
    paddingHorizontal: 6, paddingVertical: 2, marginTop: 8,
  },
  appliedTagText: { fontFamily: 'SpaceMono', fontSize: 9, fontWeight: '700', color: '#000' },

  // Action confirmation strip
  actionStrip: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 10,
    borderTopWidth: 2.5, borderBottomWidth: 2.5, gap: 12,
  },
  actionStripLeft: { flex: 1, minWidth: 0 },
  actionStripType: { fontFamily: 'SpaceMono', fontSize: 9, fontWeight: '700', color: '#000', letterSpacing: 0.5 },
  actionStripTitle: { fontSize: 14, fontWeight: '600', color: '#000', marginTop: 2 },
  actionStripDetail: { fontSize: 12, color: '#333', marginTop: 1 },
  actionStripBtns: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    width: 36, height: 36, borderWidth: 2, borderRadius: 6,
    alignItems: 'center', justifyContent: 'center',
  },
  actionBtnConfirm: {
    backgroundColor: '#FFE500',
    shadowOffset: { width: 2, height: 2 }, shadowOpacity: 1, shadowRadius: 0, elevation: 2,
  },

  // Prompt suggestions
  promptsRow: { borderTopWidth: 1 },
  promptsContent: { paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  promptChip: {
    borderWidth: 1.5, borderRadius: 6,
    paddingHorizontal: 10, paddingVertical: 6,
  },
  promptChipText: { fontSize: 12 },

  // Input bar
  inputBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 12,
    borderTopWidth: 2.5, gap: 10,
  },
  prompt: { fontFamily: 'SpaceMono', fontSize: 18, fontWeight: '900' },
  input: { flex: 1, fontSize: 15, paddingVertical: 4 },
  sendBtn: {
    width: 40, height: 40, borderWidth: 2, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
    shadowOffset: { width: 2, height: 2 }, shadowOpacity: 1, shadowRadius: 0, elevation: 2,
  },
});
