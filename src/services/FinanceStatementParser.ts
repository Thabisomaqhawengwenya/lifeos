export type StatementProvider = 'ecocash' | 'innbucks' | 'csv' | 'manual';

export interface ParsedStatementResult {
  isValid: boolean;
  provider: StatementProvider;
  direction: 'expense' | 'income';
  amountCents: number;
  currency: 'USD' | 'ZiG' | 'ZAR';
  counterparty: string;
  reference: string;
  date: string; // YYYY-MM-DD
  category: string;
  description: string;
  rawText: string;
  error?: string;
}

export class FinanceStatementParser {
  /**
   * Normalizes dates into standard YYYY-MM-DD.
   */
  static normalizeDate(raw?: string): string {
    const today = new Date().toISOString().split('T')[0];
    if (!raw) return today;
    const clean = raw.trim().replace(/at\s+\d+:\d+(?::\d+)?/i, '').trim();

    // DD/MM/YYYY or DD-MM-YYYY
    const dmy = clean.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (dmy) {
      return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`;
    }

    // YYYY-MM-DD
    const ymd = clean.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
    if (ymd) {
      return `${ymd[1]}-${ymd[2].padStart(2, '0')}-${ymd[3].padStart(2, '0')}`;
    }

    return today;
  }

  /**
   * Parses an EcoCash SMS notification.
   */
  static parseEcoCashSms(text: string): ParsedStatementResult {
    const clean = text.trim();
    if (!clean) {
      return {
        isValid: false,
        provider: 'ecocash',
        direction: 'expense',
        amountCents: 0,
        currency: 'USD',
        counterparty: '',
        reference: '',
        date: this.normalizeDate(),
        category: 'General',
        description: '',
        rawText: text,
        error: 'Empty EcoCash message',
      };
    }

    const isInflow = /(?:received|cash in|cashed in|credited|deposit)/i.test(clean) && !/(?:paid|transferred|payment of|sent)/i.test(clean.slice(0, 40));
    const direction: 'expense' | 'income' = isInflow ? 'income' : 'expense';

    // Extract currency
    let currency: 'USD' | 'ZiG' | 'ZAR' = 'USD';
    if (/ZiG|ZWG/i.test(clean)) currency = 'ZiG';
    else if (/ZAR|\bR\s*\d+/i.test(clean)) currency = 'ZAR';

    // Extract amount: $15.00, USD 15.00, ZiG 50.00
    const amountMatch = clean.match(/(?:\$|USD\s*|ZiG\s*|ZAR\s*|amount\s*of\s*)\$?(\d+(?:\.\d{1,2})?)/i)
      || clean.match(/(\d+(?:\.\d{1,2})?)\s*(?:USD|ZiG|ZAR)/i);

    const amount = amountMatch ? parseFloat(amountMatch[1]) : 0;
    const amountCents = Math.round(amount * 100);

    // Extract reference / Approval code
    const refMatch = clean.match(/(?:Approval\s*Code|Ref|Txn\s*ID|Txn\s*Id|Reference|Approval):\s*([A-Za-z0-9\.]+)/i);
    const reference = refMatch ? refMatch[1].trim() : '';

    // Extract counterparty or merchant
    let counterparty = 'EcoCash Transaction';
    const toMatch = clean.match(/(?:to|from)\s+([A-Za-z0-9\s]+?)(?=\s+(?:completed|successful|Ref|Approval|with|\d{10}|balance|$))/i);
    if (toMatch && toMatch[1].trim()) {
      counterparty = toMatch[1].trim();
    } else {
      const paidMatch = clean.match(/paid\s+(?:to\s+)?([A-Za-z0-9\s]+?)(?=\s+(?:completed|successful|Ref|Approval|\.|$))/i);
      if (paidMatch && paidMatch[1].trim()) {
        counterparty = paidMatch[1].trim();
      }
    }

    const category = direction === 'income' ? 'Sales / Transfer' : this.guessCategory(counterparty);
    const description = `EcoCash ${direction === 'income' ? 'from' : 'to'} ${counterparty}${reference ? ` (Ref: ${reference})` : ''}`;

    return {
      isValid: amountCents > 0,
      provider: 'ecocash',
      direction,
      amountCents,
      currency,
      counterparty,
      reference,
      date: this.normalizeDate(),
      category,
      description,
      rawText: text,
      error: amountCents > 0 ? undefined : 'Could not detect amount from EcoCash SMS',
    };
  }

  /**
   * Parses an InnBucks SMS notification.
   */
  static parseInnBucksSms(text: string): ParsedStatementResult {
    const clean = text.trim();
    if (!clean) {
      return {
        isValid: false,
        provider: 'innbucks',
        direction: 'expense',
        amountCents: 0,
        currency: 'USD',
        counterparty: '',
        reference: '',
        date: this.normalizeDate(),
        category: 'General',
        description: '',
        rawText: text,
        error: 'Empty InnBucks message',
      };
    }

    const isInflow = /(?:received|deposit|deposited|credited)/i.test(clean) && !/(?:sent|paid|withdrawal)/i.test(clean.slice(0, 30));
    const direction: 'expense' | 'income' = isInflow ? 'income' : 'expense';

    // Extract currency (InnBucks is predominantly USD)
    let currency: 'USD' | 'ZiG' | 'ZAR' = 'USD';
    if (/ZiG|ZWG/i.test(clean)) currency = 'ZiG';
    else if (/ZAR/i.test(clean)) currency = 'ZAR';

    // Extract amount
    const amountMatch = clean.match(/(?:USD|\$|ZiG|ZAR)?\s*(\d+(?:\.\d{1,2})?)/i);
    const amount = amountMatch ? parseFloat(amountMatch[1]) : 0;
    const amountCents = Math.round(amount * 100);

    // Extract Reference / Trans ID
    const refMatch = clean.match(/(?:Trans\s*ID|Ref|Receipt|Claim\s*Code):\s*([A-Za-z0-9]+)/i);
    const reference = refMatch ? refMatch[1].trim() : '';

    // Extract counterparty or store location
    let counterparty = 'InnBucks Outflow';
    const atMatch = clean.match(/(?:at|to|from)\s+([A-Za-z0-9\s]+?)(?=(?:\s+(?:Trans\s*ID|Ref|Receipt|Fee|Balance)|[\.\,\;]|$))/i);
    if (atMatch && atMatch[1].trim()) {
      counterparty = atMatch[1].trim();
    }

    const category = direction === 'income' ? 'Remittance / Inflow' : this.guessCategory(`${counterparty} ${clean}`);
    const description = `InnBucks ${direction === 'income' ? 'from' : 'at/to'} ${counterparty}${reference ? ` (Ref: ${reference})` : ''}`;

    return {
      isValid: amountCents > 0,
      provider: 'innbucks',
      direction,
      amountCents,
      currency,
      counterparty,
      reference,
      date: this.normalizeDate(),
      category,
      description,
      rawText: text,
      error: amountCents > 0 ? undefined : 'Could not detect amount from InnBucks SMS',
    };
  }

  /**
   * Universal SMS Dispatcher.
   */
  static parseSms(text: string): ParsedStatementResult {
    const lower = text.toLowerCase();
    if (lower.includes('ecocash') || lower.includes('approval code:') || lower.includes('econet')) {
      return this.parseEcoCashSms(text);
    }
    if (lower.includes('innbucks') || lower.includes('chicken inn') || lower.includes('pizza inn') || lower.includes('bakers inn')) {
      return this.parseInnBucksSms(text);
    }
    // Default fallback try EcoCash first, then InnBucks
    const eco = this.parseEcoCashSms(text);
    if (eco.isValid) return eco;
    return this.parseInnBucksSms(text);
  }

  /**
   * Parses CSV string into structured transaction rows.
   */
  static parseCsv(csvText: string): {
    success: boolean;
    rows: {
      date: string;
      type: 'expense' | 'income';
      amount_cents: number;
      category: string;
      description: string;
      provider: StatementProvider;
    }[];
    errors: string[];
  } {
    const lines = csvText.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
    if (lines.length === 0) {
      return { success: false, rows: [], errors: ['CSV content is empty'] };
    }

    const headerLine = lines[0].toLowerCase();
    const isHeader = headerLine.includes('date') || headerLine.includes('amount') || headerLine.includes('type');
    const dataLines = isHeader ? lines.slice(1) : lines;

    const rows: {
      date: string;
      type: 'expense' | 'income';
      amount_cents: number;
      category: string;
      description: string;
      provider: StatementProvider;
    }[] = [];
    const errors: string[] = [];

    dataLines.forEach((line, idx) => {
      // Split by comma ignoring commas inside quotes
      const parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map((p) => p.replace(/^"|"$/g, '').trim());
      if (parts.length < 3) {
        errors.push(`Row ${idx + 1}: Too few columns (${parts.length})`);
        return;
      }

      // Format expected: Date, Type, Amount, Category, Description, Provider
      const rawDate = parts[0];
      const rawType = (parts[1] || 'expense').toLowerCase();
      const rawAmount = parts[2];
      const category = parts[3] || 'General';
      const description = parts[4] || 'Imported Transaction';
      const rawProvider = (parts[5] || 'csv').toLowerCase();

      const type: 'expense' | 'income' = rawType.includes('in') ? 'income' : 'expense';
      const parsedAmount = parseFloat(rawAmount.replace(/[^0-9\.]/g, ''));
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        errors.push(`Row ${idx + 1}: Invalid amount "${rawAmount}"`);
        return;
      }

      const amount_cents = Math.round(parsedAmount * 100);
      const date = this.normalizeDate(rawDate);

      let provider: StatementProvider = 'csv';
      if (rawProvider.includes('eco')) provider = 'ecocash';
      else if (rawProvider.includes('inn')) provider = 'innbucks';

      rows.push({
        date,
        type,
        amount_cents,
        category,
        description,
        provider,
      });
    });

    return {
      success: rows.length > 0,
      rows,
      errors,
    };
  }

  /**
   * Generates standard CSV representation of transactions.
   */
  static exportToCsv(
    transactions: {
      transaction_date: string;
      type: string;
      amount_cents: number;
      category: string;
      description: string | null;
      provider?: string;
    }[]
  ): string {
    const headers = ['Date', 'Type', 'Amount', 'Category', 'Description', 'Provider'];
    const rows = transactions.map((t) => {
      const amount = (t.amount_cents / 100).toFixed(2);
      const desc = `"${(t.description || '').replace(/"/g, '""')}"`;
      const cat = `"${(t.category || 'General').replace(/"/g, '""')}"`;
      const prov = t.provider || 'manual';
      return [t.transaction_date, t.type, amount, cat, desc, prov].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  }

  private static guessCategory(merchantOrDesc: string): string {
    const l = merchantOrDesc.toLowerCase();
    if (/groceries|supermarket|ok\s*mart|tm\s*pick|spar|food\s*lovers/i.test(l)) return 'Groceries';
    if (/chicken\s*inn|pizza\s*inn|bakers\s*inn|steers|nandos|restaurant|food|lunch|dinner|cafe/i.test(l)) return 'Dining & Food';
    if (/fuel|petrol|diesel|total|puma|zuan|garage|kombi|transport/i.test(l)) return 'Transport';
    if (/zesa|zetdc|electricity|power|water|city\s*council/i.test(l)) return 'Utilities';
    if (/airtime|data|econet|netone|telecel|wifi|internet/i.test(l)) return 'Airtime & Internet';
    if (/pharmacy|medical|doctor|chemist|clinic|hospital/i.test(l)) return 'Health';
    if (/hardware|construction|cement|paint|tools/i.test(l)) return 'Supplies';
    return 'General';
  }
}
