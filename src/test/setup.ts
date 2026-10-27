import { vi } from 'vitest';

vi.mock('expo-crypto', () => ({
  randomUUID: () => 'mock-uuid-1234',
  digestStringAsync: async () => 'mock-sha256-hash',
  CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
}));

vi.mock('expo-sqlite', () => ({
  openDatabaseAsync: async () => ({
    execAsync: async () => {},
    runAsync: async () => {},
    getAllAsync: async () => [],
    getFirstAsync: async () => null,
    withTransactionAsync: async (cb: any) => cb(),
  }),
}));

vi.mock('expo-notifications', () => ({
  setNotificationHandler: () => {},
  requestPermissionsAsync: async () => ({ status: 'granted' }),
  getPermissionsAsync: async () => ({ status: 'granted' }),
  setNotificationChannelAsync: async () => {},
  scheduleNotificationAsync: async () => 'mock-notification-id',
  cancelScheduledNotificationAsync: async () => {},
  AndroidImportance: { HIGH: 4 },
  SchedulableTriggerInputTypes: { DATE: 'date' },
}));

vi.mock('expo-secure-store', () => ({
  setItemAsync: async () => {},
  getItemAsync: async () => null,
  deleteItemAsync: async () => {},
}));
