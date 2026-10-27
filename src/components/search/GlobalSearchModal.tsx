import React, { useState } from 'react';
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
import { M3Card } from '@/src/components/ui/M3Card';
import { haptic } from '@/src/design-system/haptics';
import { SearchRepository, SearchResultItem } from '@/src/repositories/SearchRepository';

interface GlobalSearchModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectItem?: (item: SearchResultItem) => void;
}

export function GlobalSearchModal({
  visible,
  onClose,
  onSelectItem,
}: GlobalSearchModalProps) {
  const { colors, spacing, radii, typography } = useAppTheme();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (text: string) => {
    setQuery(text);
    if (!text.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }
    setHasSearched(true);
    const data = await SearchRepository.globalSearch(text);
    setResults(data);
  };

  const getIconForType = (type: SearchResultItem['type']) => {
    switch (type) {
      case 'task':
        return 'checkbox-outline';
      case 'note':
        return 'document-text-outline';
      case 'habit':
        return 'flame-outline';
      case 'expense':
        return 'cash-outline';
      case 'goal':
        return 'trophy-outline';
      default:
        return 'search-outline';
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          {/* Search Header */}
          <View style={[styles.searchBarRow, { borderBottomColor: colors.outlineVariant }]}>
            <View style={[styles.inputWrapper, { backgroundColor: colors.surfaceVariant, borderRadius: radii.full }]}>
              <Ionicons name="search" size={20} color={colors.outline} style={{ marginLeft: 12 }} />
              <TextInput
                value={query}
                onChangeText={handleSearch}
                placeholder="Search tasks, notes, habits, finances..."
                placeholderTextColor={colors.outline}
                autoFocus
                style={[styles.searchInput, { color: colors.onSurface }]}
              />
              {query ? (
                <Pressable onPress={() => handleSearch('')} style={styles.clearBtn}>
                  <Ionicons name="close-circle" size={18} color={colors.outline} />
                </Pressable>
              ) : null}
            </View>
            <Pressable
              onPress={onClose}
              style={[styles.cancelBtn, { backgroundColor: colors.surfaceVariant, borderRadius: radii.full }]}
            >
              <Ionicons name="close" size={20} color={colors.onSurface} />
            </Pressable>
          </View>

          {/* Results List */}
          <ScrollView contentContainerStyle={styles.resultsScroll}>
            {hasSearched && results.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="search-outline" size={42} color={colors.outline} />
                <Text style={[typography.titleMedium, { color: colors.onSurface, marginTop: 12 }]}>
                  No results found for "{query}"
                </Text>
                <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant, marginTop: 4 }]}>
                  Try checking spelling or using a broader keyword.
                </Text>
              </View>
            ) : (
              results.map((item) => (
                <M3Card
                  key={`${item.type}-${item.id}`}
                  variant="elevated"
                  style={styles.resultCard}
                  onPress={() => {
                    haptic.selection();
                    onSelectItem?.(item);
                    onClose();
                  }}
                >
                  <View style={styles.resultRow}>
                    <View
                      style={[
                        styles.iconCircle,
                        { backgroundColor: colors.primaryContainer, borderRadius: radii.full },
                      ]}
                    >
                      <Ionicons
                        name={getIconForType(item.type) as any}
                        size={18}
                        color={colors.onPrimaryContainer}
                      />
                    </View>
                    <View style={styles.resultText}>
                      <Text style={[typography.titleSmall, { color: colors.onSurface }]}>
                        {item.title}
                      </Text>
                      <Text style={[typography.labelSmall, { color: colors.onSurfaceVariant, marginTop: 2 }]}>
                        {item.subtitle} {item.date ? `• ${item.date}` : ''}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.outline} />
                  </View>
                </M3Card>
              ))
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 44 : 20,
  },
  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 46,
    paddingHorizontal: 10,
    fontSize: 15,
  },
  clearBtn: {
    padding: 8,
  },
  cancelBtn: {
    padding: 8,
  },
  resultsScroll: {
    padding: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  resultCard: {
    marginBottom: 10,
    padding: 12,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  resultText: {
    flex: 1,
  },
});
