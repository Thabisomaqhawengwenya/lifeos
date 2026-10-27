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

  dbInstance = db;
  return dbInstance;
}
