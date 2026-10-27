import { getDatabase } from '../database/database';

export interface SearchResultItem {
  id: string;
  type: 'task' | 'note' | 'habit' | 'expense' | 'goal';
  title: string;
  subtitle: string;
  date?: string;
}

export class SearchRepository {
  static async globalSearch(query: string): Promise<SearchResultItem[]> {
    const q = query.trim();
    if (!q) return [];
    const db = await getDatabase();
    const wild = `%${q}%`;
    const results: SearchResultItem[] = [];

    // 1. Search Tasks
    const tasks = await db.getAllAsync<any>(
      `SELECT id, title, category, priority, due_date FROM tasks 
       WHERE deleted_at IS NULL AND (title LIKE ? OR description LIKE ? OR category LIKE ?)
       LIMIT 10`,
      [wild, wild, wild]
    );
    for (const t of tasks) {
      results.push({
        id: t.id,
        type: 'task',
        title: t.title,
        subtitle: `Task • ${t.category} • ${t.priority.toUpperCase()}`,
        date: t.due_date || undefined,
      });
    }

    // 2. Search Notes
    const notes = await db.getAllAsync<any>(
      `SELECT id, title, content FROM notes 
       WHERE title LIKE ? OR content LIKE ? OR tags LIKE ?
       LIMIT 10`,
      [wild, wild, wild]
    );
    for (const n of notes) {
      results.push({
        id: n.id,
        type: 'note',
        title: n.title,
        subtitle: `Note • ${n.content.slice(0, 50)}...`,
      });
    }

    // 3. Search Habits
    const habits = await db.getAllAsync<any>(
      `SELECT id, name, description, streak_current FROM habits 
       WHERE is_archived = 0 AND (name LIKE ? OR description LIKE ?)
       LIMIT 10`,
      [wild, wild]
    );
    for (const h of habits) {
      results.push({
        id: h.id,
        type: 'habit',
        title: h.name,
        subtitle: `Habit • Streak: ${h.streak_current}d • ${h.description || ''}`,
      });
    }

    // 4. Search Financial Transactions
    const txs = await db.getAllAsync<any>(
      `SELECT id, type, amount_cents, category, description, transaction_date FROM financial_transactions 
       WHERE description LIKE ? OR category LIKE ?
       LIMIT 10`,
      [wild, wild]
    );
    for (const tx of txs) {
      const sign = tx.type === 'expense' ? '-' : '+';
      results.push({
        id: tx.id,
        type: 'expense',
        title: `${tx.description || tx.category} (${sign}${(tx.amount_cents / 100).toFixed(2)})`,
        subtitle: `Finance • ${tx.category}`,
        date: tx.transaction_date,
      });
    }

    // 5. Search Goals
    const goals = await db.getAllAsync<any>(
      `SELECT id, title, description, progress_percent FROM goals 
       WHERE title LIKE ? OR description LIKE ?
       LIMIT 10`,
      [wild, wild]
    );
    for (const g of goals) {
      results.push({
        id: g.id,
        type: 'goal',
        title: g.title,
        subtitle: `Goal • ${g.progress_percent}% completed`,
      });
    }

    return results;
  }
}
