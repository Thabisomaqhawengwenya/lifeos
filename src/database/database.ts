import * as SQLite from 'expo-sqlite';
import { INITIAL_SCHEMA } from './schema';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) {
    return dbInstance;
  }

  const db = await SQLite.openDatabaseAsync('lifeos.db');

  // Configure high-performance WAL journaling & foreign key integrity
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
  `);

  // Execute base relational schema
  await db.execAsync(INITIAL_SCHEMA);

  // Additive non-destructive migration for financial provider channel
  try {
    await db.execAsync(`ALTER TABLE financial_transactions ADD COLUMN provider TEXT DEFAULT 'manual';`);
  } catch {
    // Column already exists or already up-to-date
  }

  dbInstance = db;
  return dbInstance;
}
