import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';
import { getDatabase } from '../database/database';

const PIN_KEY = 'lifeos_security_pin_hash';
const FAILED_ATTEMPTS_KEY = 'lifeos_pin_failed_attempts';
const LOCKOUT_TIMESTAMP_KEY = 'lifeos_pin_lockout_until';

export interface BackupData {
  version: string;
  timestamp: string;
  checksum: string;
  tables: {
    tasks: any[];
    subtasks: any[];
    habits: any[];
    habit_logs: any[];
    goals: any[];
    notes: any[];
    financial_transactions: any[];
  };
}

export class SecurityService {
  static async setPin(pin: string): Promise<boolean> {
    if (Platform.OS === 'web') return true;
    try {
      const hash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, pin);
      await SecureStore.setItemAsync(PIN_KEY, hash);
      await SecureStore.deleteItemAsync(FAILED_ATTEMPTS_KEY);
      await SecureStore.deleteItemAsync(LOCKOUT_TIMESTAMP_KEY);
      return true;
    } catch {
      return false;
    }
  }

  static async verifyPin(enteredPin: string): Promise<{ success: boolean; isLocked: boolean; remainingLockoutSeconds?: number }> {
    if (Platform.OS === 'web') return { success: true, isLocked: false };

    try {
      const storedHash = await SecureStore.getItemAsync(PIN_KEY);
      if (!storedHash) {
        // No PIN configured, unlocked by default
        return { success: true, isLocked: false };
      }

      // Check lockout status
      const lockoutUntil = await SecureStore.getItemAsync(LOCKOUT_TIMESTAMP_KEY);
      if (lockoutUntil) {
        const lockoutTime = Number(lockoutUntil);
        const now = Date.now();
        if (now < lockoutTime) {
          const remaining = Math.ceil((lockoutTime - now) / 1000);
          return { success: false, isLocked: true, remainingLockoutSeconds: remaining };
        } else {
          // Lockout expired
          await SecureStore.deleteItemAsync(LOCKOUT_TIMESTAMP_KEY);
          await SecureStore.deleteItemAsync(FAILED_ATTEMPTS_KEY);
        }
      }

      const inputHash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, enteredPin);
      if (inputHash === storedHash) {
        await SecureStore.deleteItemAsync(FAILED_ATTEMPTS_KEY);
        return { success: true, isLocked: false };
      } else {
        // Increment failed attempts
        const failedStr = (await SecureStore.getItemAsync(FAILED_ATTEMPTS_KEY)) || '0';
        const newFailed = Number(failedStr) + 1;
        await SecureStore.setItemAsync(FAILED_ATTEMPTS_KEY, String(newFailed));

        if (newFailed >= 5) {
          // 5-minute brute-force lockout
          const lockUntil = Date.now() + 5 * 60 * 1000;
          await SecureStore.setItemAsync(LOCKOUT_TIMESTAMP_KEY, String(lockUntil));
          return { success: false, isLocked: true, remainingLockoutSeconds: 300 };
        }

        return { success: false, isLocked: false };
      }
    } catch {
      return { success: true, isLocked: false };
    }
  }

  static async isPinConfigured(): Promise<boolean> {
    if (Platform.OS === 'web') return false;
    try {
      const hash = await SecureStore.getItemAsync(PIN_KEY);
      return Boolean(hash);
    } catch {
      return false;
    }
  }

  // Backup & Restore Engine
  static async exportBackup(): Promise<string> {
    const db = await getDatabase();
    const tasks = await db.getAllAsync(`SELECT * FROM tasks WHERE deleted_at IS NULL`);
    const subtasks = await db.getAllAsync(`SELECT * FROM subtasks`);
    const habits = await db.getAllAsync(`SELECT * FROM habits WHERE is_archived = 0`);
    const habit_logs = await db.getAllAsync(`SELECT * FROM habit_logs`);
    const goals = await db.getAllAsync(`SELECT * FROM goals`);
    const notes = await db.getAllAsync(`SELECT * FROM notes`);
    const financial_transactions = await db.getAllAsync(`SELECT * FROM financial_transactions`);

    const rawPayload = JSON.stringify({
      tasks,
      subtasks,
      habits,
      habit_logs,
      goals,
      notes,
      financial_transactions,
    });

    const checksum = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawPayload);

    const backupObject: BackupData = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      checksum,
      tables: JSON.parse(rawPayload),
    };

    return JSON.stringify(backupObject, null, 2);
  }

  static async restoreBackup(backupJsonString: string): Promise<boolean> {
    try {
      const backup: BackupData = JSON.parse(backupJsonString);
      if (!backup.tables || !backup.checksum) {
        throw new Error('Invalid backup schema');
      }

      // Verify SHA-256 integrity
      const rawPayload = JSON.stringify(backup.tables);
      const computedChecksum = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        rawPayload
      );

      if (computedChecksum !== backup.checksum) {
        throw new Error('Backup corrupted: Checksum mismatch');
      }

      const db = await getDatabase();

      // Atomic restore
      await db.withTransactionAsync(async () => {
        // Clear active tables
        await db.execAsync(`
          DELETE FROM subtasks;
          DELETE FROM tasks;
          DELETE FROM habit_logs;
          DELETE FROM habits;
          DELETE FROM goals;
          DELETE FROM notes;
          DELETE FROM financial_transactions;
        `);

        // Re-populate tasks
        for (const t of backup.tables.tasks) {
          await db.runAsync(
            `INSERT INTO tasks (id, title, description, category, priority, due_date, is_completed, completed_at, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [t.id, t.title, t.description, t.category, t.priority, t.due_date, t.is_completed, t.completed_at, t.created_at, t.updated_at]
          );
        }

        // Re-populate subtasks
        for (const s of backup.tables.subtasks) {
          await db.runAsync(
            `INSERT INTO subtasks (id, task_id, title, is_completed, position, created_at)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [s.id, s.task_id, s.title, s.is_completed, s.position || 0, s.created_at]
          );
        }

        // Re-populate habits
        for (const h of backup.tables.habits) {
          await db.runAsync(
            `INSERT INTO habits (id, name, description, target_days_per_week, color, icon, streak_current, streak_best, created_at, is_archived)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [h.id, h.name, h.description, h.target_days_per_week, h.color, h.icon, h.streak_current, h.streak_best, h.created_at, h.is_archived]
          );
        }

        // Re-populate notes
        for (const n of backup.tables.notes) {
          await db.runAsync(
            `INSERT INTO notes (id, title, content, tags, is_pinned, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [n.id, n.title, n.content, n.tags, n.is_pinned, n.created_at, n.updated_at]
          );
        }

        // Re-populate finance
        for (const f of backup.tables.financial_transactions) {
          await db.runAsync(
            `INSERT INTO financial_transactions (id, type, amount_cents, category, description, transaction_date, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [f.id, f.type, f.amount_cents, f.category, f.description, f.transaction_date, f.created_at]
          );
        }
      });

      return true;
    } catch (err) {
      console.warn('Backup restore failed:', err);
      return false;
    }
  }
}
