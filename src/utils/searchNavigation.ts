import { router } from 'expo-router';
import { SearchResultItem } from '../repositories/SearchRepository';

export interface SearchSelectOptions {
  onSelectTask?: (taskId: string) => void | Promise<void>;
  onSelectNote?: (noteId: string) => void | Promise<void>;
}

export function createSearchSelectHandler(options: SearchSelectOptions = {}) {
  return (item: SearchResultItem) => {
    switch (item.type) {
      case 'task':
        if (options.onSelectTask) {
          options.onSelectTask(item.id);
        } else {
          router.navigate({
            pathname: '/(tabs)/tasks',
            params: { taskId: item.id },
          });
        }
        break;
      case 'note':
        if (options.onSelectNote) {
          options.onSelectNote(item.id);
        } else {
          router.navigate({
            pathname: '/(tabs)/life',
            params: { section: 'notes', noteId: item.id },
          });
        }
        break;
      case 'habit':
        router.navigate({
          pathname: '/(tabs)/life',
          params: { section: 'habits', itemId: item.id },
        });
        break;
      case 'expense':
        router.navigate({
          pathname: '/(tabs)/life',
          params: { section: 'finance', itemId: item.id },
        });
        break;
      case 'goal':
        router.navigate({
          pathname: '/(tabs)/life',
          params: { section: 'goals', itemId: item.id },
        });
        break;
    }
  };
}
