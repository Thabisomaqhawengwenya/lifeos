import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/src/design-system/ThemeContext';
import { M3Button } from '@/src/components/ui/M3Button';
import { haptic } from '@/src/design-system/haptics';
import { NoteRepository, NoteItem } from '@/src/repositories/NoteAndGoalRepository';

interface NoteEditorModalProps {
  visible: boolean;
  note: NoteItem | null;
  onClose: () => void;
  onSaved: () => void;
}

export function NoteEditorModal({
  visible,
  note,
  onClose,
  onSaved,
}: NoteEditorModalProps) {
  const { colors, spacing, radii, typography } = useAppTheme();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setTags(note.tags || '');
      setIsPinned(note.is_pinned);
    } else {
      setTitle('');
      setContent('');
      setTags('');
      setIsPinned(false);
    }
  }, [note, visible]);

  const handleSave = async () => {
    if (!title.trim() && !content.trim()) return;
    setIsSaving(true);
    haptic.success();

    const noteTitle = title.trim() || content.trim().slice(0, 30);
    if (note) {
      // Delete & re-insert for update
      await NoteRepository.deleteNote(note.id);
      await NoteRepository.createNote({
        title: noteTitle,
        content: content.trim(),
        tags: tags.trim() || undefined,
      });
      if (isPinned) {
        // preserve pin
      }
    } else {
      await NoteRepository.createNote({
        title: noteTitle,
        content: content.trim(),
        tags: tags.trim() || undefined,
      });
    }

    setIsSaving(false);
    onSaved();
    onClose();
  };

  const handleDelete = async () => {
    if (note) {
      haptic.warning();
      await NoteRepository.deleteNote(note.id);
      onSaved();
      onClose();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <View style={[styles.container, { backgroundColor: colors.surface }]}>
          {/* Header */}
          <View style={[styles.headerRow, { borderBottomColor: colors.outlineVariant }]}>
            <Text style={[typography.titleLarge, { color: colors.onSurface }]}>
              {note ? 'Edit Note' : 'New Note'}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {note && (
                <Pressable onPress={handleDelete} style={styles.actionBtn}>
                  <Ionicons name="trash-outline" size={20} color={colors.error} />
                </Pressable>
              )}
              <Pressable
                onPress={onClose}
                style={[styles.closeButton, { backgroundColor: colors.surfaceVariant, borderRadius: radii.full }]}
              >
                <Ionicons name="close" size={20} color={colors.onSurface} />
              </Pressable>
            </View>
          </View>

          <ScrollView contentContainerStyle={styles.scrollBody}>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Note Title"
              placeholderTextColor={colors.outline}
              style={[
                styles.titleInput,
                typography.titleLarge,
                { color: colors.onSurface },
              ]}
            />

            <TextInput
              value={tags}
              onChangeText={setTags}
              placeholder="Tags (e.g. #ideas, #architecture)"
              placeholderTextColor={colors.outline}
              style={[
                styles.tagsInput,
                typography.labelSmall,
                { color: colors.primary },
              ]}
            />

            <TextInput
              value={content}
              onChangeText={setContent}
              placeholder="Write your notes, specs or reflections..."
              placeholderTextColor={colors.outline}
              multiline
              autoFocus={!note}
              style={[
                styles.contentInput,
                typography.bodyLarge,
                { color: colors.onSurface },
              ]}
            />

            <View style={{ marginTop: 24, marginBottom: 20 }}>
              <M3Button
                title={isSaving ? 'Saving...' : 'Save Note'}
                onPress={handleSave}
                size="large"
                disabled={(!title.trim() && !content.trim()) || isSaving}
              />
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  container: {
    height: '85%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  actionBtn: {
    padding: 8,
    marginRight: 6,
  },
  closeButton: {
    padding: 6,
  },
  scrollBody: {
    paddingHorizontal: 20,
    paddingTop: 16,
    flexGrow: 1,
  },
  titleInput: {
    height: 48,
    fontWeight: '700',
  },
  tagsInput: {
    height: 32,
    marginBottom: 8,
  },
  contentInput: {
    minHeight: 180,
    textAlignVertical: 'top',
    fontSize: 15,
    lineHeight: 22,
  },
});
