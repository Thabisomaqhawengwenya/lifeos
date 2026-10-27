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
  const { colors, isDark } = useAppTheme();
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

  const getTypeColor = (type: SearchResultItem['type']) => {
    switch (type) {
      case 'task':
        return colors.accentYellow;
      case 'note':
        return colors.accentSky;
      case 'habit':
        return colors.accentJade;
      case 'expense':
        return colors.accentCoral;
      case 'goal':
        return colors.accentLilac;
      default:
        return colors.surface;
    }
  };

  const shadowColor = isDark ? '#FFFFFF' : '#000000';

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          {/* Search Header */}
          <View style={[styles.searchBarRow, { borderBottomColor: colors.border }]}>
            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  shadowColor,
                },
              ]}
            >
              <Ionicons name="search" size={18} color="#000000" style={{ marginLeft: 10 }} />
              <TextInput
                value={query}
                onChangeText={handleSearch}
                placeholder="Search tasks, notes, habits, finances..."
                placeholderTextColor="#888888"
                style={[styles.searchInput, { color: colors.onSurface }]}
                autoFocus
                returnKeyType="search"
              />
              {query ? (
                <Pressable onPress={() => handleSearch('')} style={styles.clearBtn}>
                  <Ionicons name="close-circle" size={18} color="#000000" />
                </Pressable>
              ) : null}
            </View>

            <Pressable
              onPress={onClose}
              style={[
                styles.cancelBtn,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  shadowColor,
                },
              ]}
            >
              <Text style={styles.cancelText}>CLOSE</Text>
            </Pressable>
          </View>

          {/* Results List */}
          <ScrollView contentContainerStyle={styles.resultsScroll} showsVerticalScrollIndicator={false}>
            {hasSearched && results.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="search" size={36} color={colors.border} />
                <Text style={[styles.emptyTitle, { color: colors.onBackground }]}>
                  NO MATCHES FOUND
                </Text>
                <Text style={[styles.emptySub, { color: isDark ? '#A0A0A0' : '#555555' }]}>
                  No items matched "{query}" across your SQLite database.
                </Text>
              </View>
            ) : null}

            {results.map((item) => (
              <M3Card
                key={`${item.type}_${item.id}`}
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
                      {
                        backgroundColor: getTypeColor(item.type),
                        borderColor: '#000000',
                      },
                    ]}
                  >
                    <Ionicons name={getIconForType(item.type)} size={16} color="#000000" />
                  </View>
                  <View style={styles.resultText}>
                    <Text style={[styles.itemTitle, { color: colors.onSurface }]}>
                      {item.title}
                    </Text>
                    {item.subtitle ? (
                      <Text
                        style={[styles.itemSub, { color: isDark ? '#A0A0A0' : '#555555' }]}
                        numberOfLines={1}
                      >
                        {item.subtitle}
                      </Text>
                    ) : null}
                  </View>
                  <View style={styles.typeBadge}>
                    <Text style={styles.typeBadgeText}>{item.type.toUpperCase()}</Text>
                  </View>
                </View>
              </M3Card>
            ))}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
  },
  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 2.5,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderWidth: 2,
    borderRadius: 8,
    marginRight: 10,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    height: 48,
    paddingHorizontal: 10,
    fontFamily: 'SpaceMono',
    fontSize: 12,
  },
  clearBtn: {
    padding: 8,
  },
  cancelBtn: {
    borderWidth: 2,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  cancelText: {
    fontFamily: 'SpaceMono',
    fontSize: 11,
    fontWeight: '700',
    color: '#000000',
  },
  resultsScroll: {
    padding: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyTitle: {
    fontFamily: 'SpaceMono',
    fontSize: 14,
    fontWeight: '900',
    marginTop: 12,
  },
  emptySub: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center',
  },
  resultCard: {
    marginBottom: 10,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  resultText: {
    flex: 1,
  },
  itemTitle: {
    fontFamily: 'SpaceMono',
    fontSize: 13,
    fontWeight: '700',
  },
  itemSub: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  typeBadge: {
    borderWidth: 1.5,
    borderColor: '#000000',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: '#FFFFFF',
    marginLeft: 6,
  },
  typeBadgeText: {
    fontFamily: 'SpaceMono',
    fontSize: 8,
    fontWeight: '700',
    color: '#000000',
  },
});
