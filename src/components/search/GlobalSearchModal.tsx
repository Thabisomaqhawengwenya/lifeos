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
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAppTheme } from '@/src/design-system/ThemeContext';
import { M3Card, CardStripeColor } from '@/src/components/ui/M3Card';
import { haptic } from '@/src/design-system/haptics';
import { SearchRepository, SearchResultItem } from '@/src/repositories/SearchRepository';
import { createSearchSelectHandler, SearchSelectOptions } from '@/src/utils/searchNavigation';
export { createSearchSelectHandler, SearchSelectOptions };

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
  const { colors, spacing, typography, radii, shadowSmall, isDark } = useAppTheme();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleItemPress = (item: SearchResultItem) => {
    haptic.selection();
    onClose();
    if (onSelectItem) {
      onSelectItem(item);
    } else {
      createSearchSelectHandler({})(item);
    }
  };

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
        return 'check-square';
      case 'note':
        return 'file-text';
      case 'habit':
        return 'activity';
      case 'expense':
        return 'dollar-sign';
      case 'goal':
        return 'award';
      default:
        return 'search';
    }
  };

  const getStripeForType = (type: SearchResultItem['type']): CardStripeColor => {
    switch (type) {
      case 'task':
        return 'yellow';
      case 'note':
        return 'yellow';
      case 'habit':
        return 'mint';
      case 'expense':
        return 'blue';
      case 'goal':
        return 'yellow';
      default:
        return 'yellow';
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          {/* Search Header */}
          <View
            style={[
              styles.searchBarRow,
              {
                backgroundColor: colors.surface,
                borderBottomColor: colors.border,
                borderBottomWidth: colors.borderWidth,
              },
            ]}
          >
            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: colors.background,
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
            >
              <Feather
                name="search"
                size={18}
                color={colors.text}
                style={{ marginLeft: 10 }}
              />
              <TextInput
                value={query}
                onChangeText={handleSearch}
                placeholder="Search tasks, notes, habits, finances..."
                placeholderTextColor="#888888"
                style={[
                  styles.searchInput,
                  { color: colors.text, fontSize: typography.sizes.sm },
                ]}
                autoFocus
                returnKeyType="search"
              />
              {query ? (
                <Pressable onPress={() => handleSearch('')} style={styles.clearBtn}>
                  <Feather name="x" size={18} color={colors.text} />
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
              <Text
                style={[
                  styles.cancelText,
                  { color: colors.text, fontSize: typography.sizes.xs },
                ]}
              >
                CLOSE
              </Text>
            </Pressable>
          </View>

          {/* Results List */}
          <ScrollView
            contentContainerStyle={styles.resultsScroll}
            showsVerticalScrollIndicator={false}
          >
            {hasSearched && results.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Feather name="search" size={36} color={colors.border} />
                <Text
                  style={[
                    styles.emptyTitle,
                    { color: colors.text, fontSize: typography.sizes.base },
                  ]}
                >
                  NO MATCHES FOUND
                </Text>
                <Text
                  style={[
                    styles.emptySub,
                    { color: colors.textMuted, fontSize: typography.sizes.xs },
                  ]}
                >
                  No items matched "{query}" across your SQLite database.
                </Text>
              </View>
            ) : null}

            {results.map((item) => (
              <M3Card
                key={`${item.type}_${item.id}`}
                stripe={getStripeForType(item.type)}
                style={styles.resultCard}
                onPress={() => handleItemPress(item)}
              >
                <View style={styles.resultRow}>
                  <View
                    style={[
                      styles.iconCircle,
                      {
                        backgroundColor: colors.surfaceAlt,
                        borderColor: colors.border,
                        borderWidth: colors.borderWidth,
                        borderRadius: radii.sm,
                      },
                    ]}
                  >
                    <Feather
                      name={getIconForType(item.type) as any}
                      size={16}
                      color="#000000"
                    />
                  </View>
                  <View style={styles.resultText}>
                    <Text
                      style={[
                        styles.itemTitle,
                        { color: colors.text, fontSize: typography.sizes.base },
                      ]}
                    >
                      {item.title}
                    </Text>
                    {item.subtitle ? (
                      <Text
                        style={[
                          styles.itemSub,
                          {
                            color: colors.textMuted,
                            fontSize: typography.sizes.xs,
                          },
                        ]}
                        numberOfLines={1}
                      >
                        {item.subtitle}
                      </Text>
                    ) : null}
                  </View>
                  <View
                    style={[
                      styles.typeBadge,
                      {
                        backgroundColor: colors.surfaceAlt,
                        borderColor: colors.border,
                        borderWidth: colors.borderWidth,
                        borderRadius: radii.sm,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.typeBadgeText,
                        { color: colors.text, fontSize: typography.sizes.xs },
                      ]}
                    >
                      {item.type.toUpperCase()}
                    </Text>
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
    paddingTop: 8,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 48,
    paddingHorizontal: 10,
    fontWeight: '600',
  },
  clearBtn: {
    padding: 8,
  },
  cancelBtn: {
    height: 48,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontWeight: '800',
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
    fontWeight: '800',
    marginTop: 12,
  },
  emptySub: {
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
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  resultText: {
    flex: 1,
  },
  itemTitle: {
    fontWeight: '700',
  },
  itemSub: {
    fontWeight: '500',
    marginTop: 2,
  },
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
  },
  typeBadgeText: {
    fontWeight: '800',
  },
});
