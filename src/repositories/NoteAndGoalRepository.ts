import * as Crypto from 'expo-crypto';
import { getDatabase } from '../database/database';

export interface NoteItem {
  id: string;
  title: string;
  content: string;
  tags: string | null;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface GoalItem {
  id: string;
  title: string;
  description: string | null;
  target_date: string | null;
  progress_percent: number;
  status: string;
  created_at: string;
}

export class NoteRepository {
  static async getAllNotes(): Promise<NoteItem[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<any>(
      `SELECT * FROM notes ORDER BY is_pinned DESC, updated_at DESC`
    );

    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      content: r.content,
      tags: r.tags,
      is_pinned: Boolean(r.is_pinned),
      created_at: r.created_at,
      updated_at: r.updated_at,
    }));
  }

  static async getNoteById(id: string): Promise<NoteItem | null> {
    const db = await getDatabase();
    const r = await db.getFirstAsync<any>(
      `SELECT * FROM notes WHERE id = ?`,
      [id]
    );
    if (!r) return null;
    return {
      id: r.id,
      title: r.title,
      content: r.content,
      tags: r.tags,
      is_pinned: Boolean(r.is_pinned),
      created_at: r.created_at,
      updated_at: r.updated_at,
    };
  }

  static async createNote(data: {
    title: string;
    content: string;
    tags?: string;
  }): Promise<NoteItem> {
    const db = await getDatabase();
    const id = Crypto.randomUUID();
    const now = new Date().toISOString();

    await db.runAsync(
      `INSERT INTO notes (id, title, content, tags, is_pinned, created_at, updated_at)
       VALUES (?, ?, ?, ?, 0, ?, ?)`,
      [id, data.title, data.content, data.tags || null, now, now]
    );

    return {
      id,
      title: data.title,
      content: data.content,
      tags: data.tags || null,
      is_pinned: false,
      created_at: now,
      updated_at: now,
    };
  }

  static async updateNote(
    id: string,
    data: { title: string; content: string; tags?: string }
  ): Promise<void> {
    const db = await getDatabase();
    const now = new Date().toISOString();
    await db.runAsync(
      `UPDATE notes SET title = ?, content = ?, tags = ?, updated_at = ? WHERE id = ?`,
      [data.title, data.content, data.tags || null, now, id]
    );
  }

  static async togglePin(id: string): Promise<boolean> {
    const db = await getDatabase();
    const note = await db.getFirstAsync<any>(`SELECT is_pinned FROM notes WHERE id = ?`, [id]);
    if (!note) return false;

    const newPinned = note.is_pinned === 1 ? 0 : 1;
    const now = new Date().toISOString();
    await db.runAsync(`UPDATE notes SET is_pinned = ?, updated_at = ? WHERE id = ?`, [newPinned, now, id]);
    return Boolean(newPinned);
  }

  static async deleteNote(id: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(`DELETE FROM notes WHERE id = ?`, [id]);
  }
}

export class GoalRepository {
  static async getAllGoals(): Promise<GoalItem[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<any>(
      `SELECT * FROM goals ORDER BY created_at DESC`
    );

    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      target_date: r.target_date,
      progress_percent: Number(r.progress_percent || 0),
      status: r.status,
      created_at: r.created_at,
    }));
  }

  static async createGoal(data: {
    title: string;
    description?: string;
    target_date?: string;
  }): Promise<GoalItem> {
    const db = await getDatabase();
    const id = Crypto.randomUUID();
    const now = new Date().toISOString();

    await db.runAsync(
      `INSERT INTO goals (id, title, description, target_date, progress_percent, status, created_at)
       VALUES (?, ?, ?, ?, 0, 'in_progress', ?)`,
      [id, data.title, data.description || null, data.target_date || null, now]
    );

    return {
      id,
      title: data.title,
      description: data.description || null,
      target_date: data.target_date || null,
      progress_percent: 0,
      status: 'in_progress',
      created_at: now,
    };
  }

  static async updateGoalProgress(id: string, delta: number): Promise<void> {
    const db = await getDatabase();
    const goal = await db.getFirstAsync<any>(`SELECT progress_percent FROM goals WHERE id = ?`, [id]);
    if (!goal) return;
    const current = Number(goal.progress_percent || 0);
    const updated = Math.max(0, Math.min(100, current + delta));
    await this.updateProgress(id, updated);
  }

  static async updateProgress(id: string, progress: number): Promise<void> {
    const db = await getDatabase();
    const clamped = Math.max(0, Math.min(100, progress));
    const status = clamped === 100 ? 'completed' : 'in_progress';
    await db.runAsync(`UPDATE goals SET progress_percent = ?, status = ? WHERE id = ?`, [clamped, status, id]);
  }
}
