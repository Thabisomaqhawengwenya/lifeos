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
import { Feather } from '@expo/vector-icons';
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
  const { colors, spacing, typography, radii, shadowSmall, isDark } = useAppTheme();
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
      // Non-destructive atomic SQL update preserving ID and timestamp
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
              borderWidth: colors.borderWidth,
              borderRadius: radii.lg,
            },
          ]}
        >
          {/* Header */}
          <View
            style={[
              styles.headerRow,
              {
                borderBottomColor: colors.border,
                borderBottomWidth: colors.borderWidth,
              },
            ]}
          >
            <View>
              <Text
                style={[
                  styles.headerTitle,
                  { color: colors.text, fontSize: typography.sizes.base },
                ]}
              >
                {note ? 'EDIT NOTE' : 'WRITE NOTE'}
              </Text>
              <Text
                style={[
                  styles.headerSub,
                  { color: colors.textMuted, fontSize: typography.sizes.xs },
                ]}
              >
                Offline personal note
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              style={[
                styles.closeButton,
                {
                  backgroundColor: colors.surface,
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
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Feather name="x" size={20} color={colors.text} />
            </Pressable>
          </View>

          <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
            {/* Title */}
            <Text
              style={[
                styles.fieldLabel,
                { color: colors.text, fontSize: typography.sizes.xs },
              ]}
            >
              NOTE TITLE
            </Text>
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
                  borderWidth: colors.borderWidth,
                  borderRadius: radii.sm,
                  color: colors.text,
                  fontSize: typography.sizes.sm,
                },
              ]}
            />

            {/* Content */}
            <Text
              style={[
                styles.fieldLabel,
                { color: colors.text, fontSize: typography.sizes.xs },
              ]}
            >
              BODY CONTENT
            </Text>
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
                  borderWidth: colors.borderWidth,
                  borderRadius: radii.sm,
                  color: colors.text,
                  fontSize: typography.sizes.sm,
                },
              ]}
            />

            {/* Tags */}
            <Text
              style={[
                styles.fieldLabel,
                { color: colors.text, fontSize: typography.sizes.xs },
              ]}
            >
              TAG (OPTIONAL)
            </Text>
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
                  borderWidth: colors.borderWidth,
                  borderRadius: radii.sm,
                  color: colors.text,
                  fontSize: typography.sizes.sm,
                },
              ]}
            />

            {/* Actions */}
            <View style={styles.actionsContainer}>
              <M3Button
                title={isSaving ? 'SAVING...' : 'SAVE NOTE'}
                onPress={handleSave}
                variant="primary"
                size="md"
                loading={isSaving}
              />
              {note && (
                <M3Button
                  title="DELETE NOTE"
                  onPress={handleDelete}
                  variant="destructive"
                  size="sm"
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
    maxHeight: '85%',
    paddingTop: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  headerTitle: {
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerSub: {
    fontWeight: '600',
    marginTop: 2,
  },
  closeButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollBody: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  fieldLabel: {
    fontWeight: '700',
    marginTop: 14,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  input: {
    height: 46,
    paddingHorizontal: 14,
    fontWeight: '600',
  },
  textArea: {
    minHeight: 120,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontWeight: '500',
    textAlignVertical: 'top',
  },
  actionsContainer: {
    marginTop: 24,
  },
});
