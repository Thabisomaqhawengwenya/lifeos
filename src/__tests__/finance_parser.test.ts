import { describe, it, expect } from 'vitest';
import { FinanceStatementParser } from '../services/FinanceStatementParser';

describe('FinanceStatementParser', () => {
  describe('EcoCash SMS Parsing', () => {
    it('correctly parses an EcoCash transfer outflow', () => {
      const sms = 'Approval Code: PP261030.1545.H12345. Payment of $15.00 to Tinashe Moyo completed. New USD Balance: $45.20.';
      const res = FinanceStatementParser.parseEcoCashSms(sms);

      expect(res.isValid).toBe(true);
      expect(res.provider).toBe('ecocash');
      expect(res.direction).toBe('expense');
      expect(res.amountCents).toBe(1500);
      expect(res.currency).toBe('USD');
      expect(res.reference).toBe('PP261030.1545.H12345.');
      expect(res.counterparty).toContain('Tinashe Moyo');
    });

    it('correctly parses an EcoCash incoming transfer', () => {
      const sms = 'You have received $50.00 from Farai Gumbo. Ref: MP261030.0912. Balance: $115.00.';
      const res = FinanceStatementParser.parseEcoCashSms(sms);

      expect(res.isValid).toBe(true);
      expect(res.provider).toBe('ecocash');
      expect(res.direction).toBe('income');
      expect(res.amountCents).toBe(5000);
      expect(res.category).toBe('Sales / Transfer');
      expect(res.reference).toBe('MP261030.0912.');
    });

    it('correctly parses ZiG transactions', () => {
      const sms = 'Transfer of ZiG 250.00 to Harare Water successful. Ref: EC778899.';
      const res = FinanceStatementParser.parseEcoCashSms(sms);

      expect(res.isValid).toBe(true);
      expect(res.currency).toBe('ZiG');
      expect(res.amountCents).toBe(25000);
    });
  });

  describe('InnBucks SMS Parsing', () => {
    it('correctly parses an InnBucks payment at Chicken Inn', () => {
      const sms = 'Paid USD 6.50 at Chicken Inn Bulawayo. Receipt: CK8877. Balance USD 22.00.';
      const res = FinanceStatementParser.parseInnBucksSms(sms);

      expect(res.isValid).toBe(true);
      expect(res.provider).toBe('innbucks');
      expect(res.direction).toBe('expense');
      expect(res.amountCents).toBe(650);
      expect(res.category).toBe('Dining & Food');
      expect(res.reference).toBe('CK8877');
    });

    it('correctly parses an InnBucks remittance deposit', () => {
      const sms = 'Deposit USD 50.00 successful at Pizza Inn. Ref: DP9988.';
      const res = FinanceStatementParser.parseInnBucksSms(sms);

      expect(res.isValid).toBe(true);
      expect(res.direction).toBe('income');
      expect(res.amountCents).toBe(5000);
      expect(res.reference).toBe('DP9988');
    });
  });

  describe('CSV Parsing & Export', () => {
    it('parses valid CSV statement lines', () => {
      const csv = `Date,Type,Amount,Category,Description,Provider
2026-10-30,expense,12.50,Groceries,OK Mart,EcoCash
2026-10-30,income,80.00,Sales,Contract payment,InnBucks`;

      const parsed = FinanceStatementParser.parseCsv(csv);
      expect(parsed.success).toBe(true);
      expect(parsed.rows).toHaveLength(2);
      expect(parsed.rows[0].amount_cents).toBe(1250);
      expect(parsed.rows[0].provider).toBe('ecocash');
      expect(parsed.rows[1].amount_cents).toBe(8000);
      expect(parsed.rows[1].provider).toBe('innbucks');
    });

    it('exports database rows to standard CSV', () => {
      const rows = [
        {
          transaction_date: '2026-10-30',
          type: 'expense',
          amount_cents: 1500,
          category: 'Transport',
          description: 'Fuel at Puma',
          provider: 'ecocash',
        },
      ];

      const csv = FinanceStatementParser.exportToCsv(rows);
      expect(csv).toContain('Date,Type,Amount,Category,Description,Provider');
      expect(csv).toContain('2026-10-30,expense,15.00,"Transport","Fuel at Puma",ecocash');
    });
  });
});
