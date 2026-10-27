import * as Crypto from 'expo-crypto';
import { getDatabase } from '../database/database';

export interface HabitItem {
  id: string;
  name: string;
  description: string | null;
  target_days_per_week: number;
  color: string;
  icon: string;
  streak_current: number;
  streak_best: number;
  created_at: string;
  is_logged_today?: boolean;
}

export class HabitRepository {
  static async getAllHabits(): Promise<HabitItem[]> {
    const db = await getDatabase();
    const today = new Date().toISOString().split('T')[0];

    const rows = await db.getAllAsync<any>(`
      SELECT 
        h.*,
        CASE WHEN hl.id IS NOT NULL THEN 1 ELSE 0 END as is_logged_today
      FROM habits h
      LEFT JOIN habit_logs hl ON hl.habit_id = h.id AND hl.log_date = ?
      WHERE h.is_archived = 0
      ORDER BY h.created_at ASC
    `, [today]);

    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      target_days_per_week: Number(r.target_days_per_week || 7),
      color: r.color || '#0F4C3A',
      icon: r.icon || 'flame',
      streak_current: Number(r.streak_current || 0),
      streak_best: Number(r.streak_best || 0),
      created_at: r.created_at,
      is_logged_today: Boolean(r.is_logged_today),
    }));
  }

  static async createHabit(data: {
    name: string;
    description?: string;
    targetDays?: number;
    color?: string;
    icon?: string;
  }): Promise<HabitItem> {
    const db = await getDatabase();
    const id = Crypto.randomUUID();
    const now = new Date().toISOString();

    await db.runAsync(
      `INSERT INTO habits (id, name, description, target_days_per_week, color, icon, streak_current, streak_best, created_at, is_archived)
       VALUES (?, ?, ?, ?, ?, ?, 0, 0, ?, 0)`,
      [
        id,
        data.name,
        data.description || null,
        data.targetDays || 7,
        data.color || '#0F4C3A',
        data.icon || 'flame',
        now,
      ]
    );

    return {
      id,
      name: data.name,
      description: data.description || null,
      target_days_per_week: data.targetDays || 7,
      color: data.color || '#0F4C3A',
      icon: data.icon || 'flame',
      streak_current: 0,
      streak_best: 0,
      created_at: now,
      is_logged_today: false,
    };
  }

  static async toggleHabitCheckIn(habitId: string, logDate: string): Promise<boolean> {
    const db = await getDatabase();
    const existing = await db.getFirstAsync<any>(
      `SELECT id FROM habit_logs WHERE habit_id = ? AND log_date = ?`,
      [habitId, logDate]
    );

    if (existing) {
      // Remove check-in
      await db.runAsync(`DELETE FROM habit_logs WHERE habit_id = ? AND log_date = ?`, [habitId, logDate]);
      await db.runAsync(
        `UPDATE habits SET streak_current = MAX(0, streak_current - 1) WHERE id = ?`,
        [habitId]
      );
      return false;
    } else {
      // Add check-in
      const id = Crypto.randomUUID();
      const now = new Date().toISOString();
      await db.runAsync(
        `INSERT INTO habit_logs (id, habit_id, log_date, created_at) VALUES (?, ?, ?, ?)`,
        [id, habitId, logDate, now]
      );
      await db.runAsync(
        `UPDATE habits SET 
           streak_current = streak_current + 1,
           streak_best = MAX(streak_best, streak_current + 1)
         WHERE id = ?`,
        [habitId]
      );
      return true;
    }
  }
}
