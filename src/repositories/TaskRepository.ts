import * as Crypto from 'expo-crypto';
import { getDatabase } from '../database/database';

export interface TaskItem {
  id: string;
  title: string;
  description: string | null;
  category: string;
  priority: 'low' | 'medium' | 'high';
  due_date: string | null;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  subtask_count?: number;
  completed_subtasks?: number;
}

export interface SubtaskItem {
  id: string;
  task_id: string;
  title: string;
  is_completed: boolean;
  position: number;
  created_at: string;
}

export class TaskRepository {
  static async getAllTasks(): Promise<TaskItem[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<any>(`
      SELECT 
        t.*,
        COUNT(s.id) as subtask_count,
        SUM(CASE WHEN s.is_completed = 1 THEN 1 ELSE 0 END) as completed_subtasks
      FROM tasks t
      LEFT JOIN subtasks s ON s.task_id = t.id
      WHERE t.deleted_at IS NULL
      GROUP BY t.id
      ORDER BY t.is_completed ASC, t.created_at DESC
    `);

    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      category: r.category,
      priority: r.priority,
      due_date: r.due_date,
      is_completed: Boolean(r.is_completed),
      completed_at: r.completed_at,
      created_at: r.created_at,
      updated_at: r.updated_at,
      subtask_count: Number(r.subtask_count || 0),
      completed_subtasks: Number(r.completed_subtasks || 0),
    }));
  }

  static async createTask(data: {
    title: string;
    description?: string;
    category?: string;
    priority?: 'low' | 'medium' | 'high';
    due_date?: string;
  }): Promise<TaskItem> {
    const db = await getDatabase();
    const id = Crypto.randomUUID();
    const now = new Date().toISOString();

    await db.runAsync(
      `INSERT INTO tasks (id, title, description, category, priority, due_date, is_completed, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)`,
      [
        id,
        data.title,
        data.description || null,
        data.category || 'General',
        data.priority || 'medium',
        data.due_date || null,
        now,
        now,
      ]
    );

    return {
      id,
      title: data.title,
      description: data.description || null,
      category: data.category || 'General',
      priority: data.priority || 'medium',
      due_date: data.due_date || null,
      is_completed: false,
      completed_at: null,
      created_at: now,
      updated_at: now,
      subtask_count: 0,
      completed_subtasks: 0,
    };
  }

  static async toggleTask(id: string): Promise<boolean> {
    const db = await getDatabase();
    const task = await db.getFirstAsync<any>(`SELECT is_completed FROM tasks WHERE id = ?`, [id]);
    if (!task) return false;

    const newCompleted = task.is_completed === 1 ? 0 : 1;
    const completedAt = newCompleted === 1 ? new Date().toISOString() : null;
    const now = new Date().toISOString();

    await db.runAsync(
      `UPDATE tasks SET is_completed = ?, completed_at = ?, updated_at = ? WHERE id = ?`,
      [newCompleted, completedAt, now, id]
    );

    return Boolean(newCompleted);
  }

  static async deleteTask(id: string): Promise<void> {
    const db = await getDatabase();
    const now = new Date().toISOString();
    // Soft deletion for sync compatibility
    await db.runAsync(`UPDATE tasks SET deleted_at = ?, updated_at = ? WHERE id = ?`, [now, now, id]);
  }

  static async addSubtask(taskId: string, title: string): Promise<SubtaskItem> {
    const db = await getDatabase();
    const id = Crypto.randomUUID();
    const now = new Date().toISOString();

    await db.runAsync(
      `INSERT INTO subtasks (id, task_id, title, is_completed, created_at)
       VALUES (?, ?, ?, 0, ?)`,
      [id, taskId, title, now]
    );

    return {
      id,
      task_id: taskId,
      title,
      is_completed: false,
      position: 0,
      created_at: now,
    };
  }

  static async toggleSubtask(subtaskId: string): Promise<boolean> {
    const db = await getDatabase();
    const subtask = await db.getFirstAsync<any>(`SELECT is_completed FROM subtasks WHERE id = ?`, [subtaskId]);
    if (!subtask) return false;

    const newCompleted = subtask.is_completed === 1 ? 0 : 1;
    await db.runAsync(`UPDATE subtasks SET is_completed = ? WHERE id = ?`, [newCompleted, subtaskId]);
    return Boolean(newCompleted);
  }
}
