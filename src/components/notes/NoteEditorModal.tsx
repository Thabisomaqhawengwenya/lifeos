/* eslint-disable react-hooks/set-state-in-effect */
import { BrutalButton } from '@/src/components/ui/BrutalButton';
import { haptic } from '@/src/design-system/haptics';
import { useAppTheme } from '@/src/design-system/ThemeContext';
import { NoteItem, NoteRepository } from '@/src/repositories/NoteAndGoalRepository';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

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
  const { colors, isDark } = useAppTheme();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setTags(note.tags || '');
    } else {
      setTitle('');
      setContent('');
      setTags('');
    }
  }, [note, visible]);

  const handleSave = async () => {
    if (!title.trim() && !content.trim()) return;
    setIsSaving(true);
    haptic.success();

    const noteTitle = title.trim() || content.trim().slice(0, 30);
    if (note) {
      await NoteRepository.updateNote(note.id, {
        title: noteTitle,
        content: content.trim(),
        tags: tags.trim() || undefined,
      });
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
      haptic.heavy();
      await NoteRepository.deleteNote(note.id);
      onSaved();
      onClose();
    }
  };

  const shadowColor = isDark ? '#FFFFFF' : '#000000';

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View
          style={[
            styles.sheetContainer,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          {/* Header */}
          <View style={[styles.headerRow, { borderBottomColor: colors.border }]}>
            <View>
              <Text style={[styles.headerTitle, { color: colors.onSurface }]}>
                {note ? 'EDIT NOTE' : 'WRITE NOTE'}
              </Text>
              <Text style={[styles.headerSub, { color: isDark ? '#A0A0A0' : '#555555' }]}>
                Local SQLite Note Repository
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              style={[
                styles.closeButton,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  shadowColor,
                },
              ]}
            >
              <Ionicons name="close" size={20} color={colors.onSurface} />
            </Pressable>
          </View>

          <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
            {/* Title */}
            <Text style={[styles.fieldLabel, { color: colors.onSurface }]}>NOTE TITLE</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. LifeOS System Architecture"
              placeholderTextColor="#888888"
              style={[
                styles.input,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.onSurface,
                },
              ]}
            />

            {/* Content */}
            <Text style={[styles.fieldLabel, { color: colors.onSurface }]}>BODY CONTENT</Text>
            <TextInput
              value={content}
              onChangeText={setContent}
              placeholder="Write your note thoughts, ideas, or meeting snippets..."
              placeholderTextColor="#888888"
              multiline
              numberOfLines={6}
              style={[
                styles.textArea,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.onSurface,
                },
              ]}
            />

            {/* Tags */}
            <Text style={[styles.fieldLabel, { color: colors.onSurface }]}>TAG (OPTIONAL)</Text>
            <TextInput
              value={tags}
              onChangeText={setTags}
              placeholder="e.g. work, design, sprint"
              placeholderTextColor="#888888"
              style={[
                styles.input,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.onSurface,
                },
              ]}
            />

            {/* Actions */}
            <View style={styles.actionsContainer}>
              <BrutalButton
                title={isSaving ? 'SAVING...' : 'SAVE NOTE'}
                onPress={handleSave}
                variant="filled"
                size="medium"
                loading={isSaving}
              />
              {note && (
                <BrutalButton
                  title="DELETE NOTE"
                  onPress={handleDelete}
                  variant="destructive"
                  size="small"
                  style={{ marginTop: 8 }}
                />
              )}
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  backdrop: {
    flex: 1,
  },
  sheetContainer: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 2.5,
    borderBottomWidth: 0,
    maxHeight: '85%',
    paddingTop: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 2.5,
  },
  headerTitle: {
    fontFamily: 'SpaceMono',
    fontSize: 16,
    fontWeight: '900',
  },
  headerSub: {
    fontFamily: 'SpaceMono',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  closeButton: {
    width: 34,
    height: 34,
    borderWidth: 2,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  scrollBody: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  fieldLabel: {
    fontFamily: 'SpaceMono',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 14,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  input: {
    height: 46,
    borderWidth: 2,
    borderRadius: 8,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  textArea: {
    minHeight: 120,
    borderWidth: 2,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  actionsContainer: {
    marginTop: 24,
  },
});
