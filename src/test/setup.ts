import { vi } from 'vitest';
import crypto from 'node:crypto';

vi.mock('expo-crypto', () => ({
  randomUUID: () => 'mock-uuid-1234',
  digestStringAsync: async (_algo: any, str: string) => {
    return crypto.createHash('sha256').update(str).digest('hex');
  },
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

vi.mock('expo-secure-store', () => {
  const store = new Map<string, string>();
  return {
    setItemAsync: async (k: string, v: string) => {
      store.set(k, v);
    },
    getItemAsync: async (k: string) => store.get(k) || null,
    deleteItemAsync: async (k: string) => {
      store.delete(k);
    },
  };
});
