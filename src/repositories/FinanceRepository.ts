import * as Crypto from 'expo-crypto';
import { getDatabase } from '../database/database';

export interface TransactionItem {
  id: string;
  type: 'expense' | 'income';
  amount_cents: number;
  category: string;
  description: string | null;
  transaction_date: string;
  created_at: string;
}

export interface FinanceSummary {
  total_income_cents: number;
  total_expense_cents: number;
  net_balance_cents: number;
}

export class FinanceRepository {
  static async getAllTransactions(limit: number = 50): Promise<TransactionItem[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<any>(
      `SELECT * FROM financial_transactions ORDER BY transaction_date DESC, created_at DESC LIMIT ?`,
      [limit]
    );

    return rows.map((r) => ({
      id: r.id,
      type: r.type as 'expense' | 'income',
      amount_cents: Number(r.amount_cents),
      category: r.category,
      description: r.description,
      transaction_date: r.transaction_date,
      created_at: r.created_at,
    }));
  }

  static async createTransaction(data: {
    type: 'expense' | 'income';
    amount_cents: number;
    category: string;
    description?: string;
    transaction_date?: string;
  }): Promise<TransactionItem> {
    const db = await getDatabase();
    const id = Crypto.randomUUID();
    const now = new Date().toISOString();
    const date = data.transaction_date || now.split('T')[0];

    await db.runAsync(
      `INSERT INTO financial_transactions (id, type, amount_cents, category, description, transaction_date, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, data.type, data.amount_cents, data.category, data.description || null, date, now]
    );

    return {
      id,
      type: data.type,
      amount_cents: data.amount_cents,
      category: data.category,
      description: data.description || null,
      transaction_date: date,
      created_at: now,
    };
  }

  static async getMonthlySummary(yearMonth: string): Promise<FinanceSummary> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<any>(
      `SELECT type, SUM(amount_cents) as total FROM financial_transactions 
       WHERE transaction_date LIKE ? GROUP BY type`,
      [`${yearMonth}%`]
    );

    let income = 0;
    let expense = 0;

    for (const row of rows) {
      if (row.type === 'income') income = Number(row.total || 0);
      if (row.type === 'expense') expense = Number(row.total || 0);
    }

    return {
      total_income_cents: income,
      total_expense_cents: expense,
      net_balance_cents: income - expense,
    };
  }
}
