import { describe, it, expect } from 'vitest';
import { AIAssistantService } from '../services/AIAssistantService';
import { SecurityService } from '../services/SecurityService';
import { LicenseService } from '../services/LicenseService';

describe('LifeOS Core AI Engine & Heuristics', () => {
  it('correctly parses natural language expense requests into minor units (cents)', () => {
    const input = 'Spent $45.50 on groceries';
    const result = AIAssistantService.parseUserInput(input);

    expect(result.action).toBeDefined();
    expect(result.action?.type).toBe('log_expense');
    expect(result.action?.payload.amount_cents).toBe(4550);
    expect(result.action?.payload.category).toBe('Food & Dining');
    expect(result.action?.payload.description).toContain('groceries');
  });

  it('correctly parses urgent tasks with priority classification', () => {
    const input = 'Urgent task to review database indexing tomorrow';
    const result = AIAssistantService.parseUserInput(input);

    expect(result.action).toBeDefined();
    expect(result.action?.type).toBe('create_task');
    expect(result.action?.payload.priority).toBe('high');
    expect(result.action?.payload.due_date).toBe('Tomorrow');
    expect(result.action?.payload.title).toContain('review database indexing');
  });

  it('correctly parses habit creation requests', () => {
    const input = 'Track habit: 10k Steps Daily';
    const result = AIAssistantService.parseUserInput(input);

    expect(result.action).toBeDefined();
    expect(result.action?.type).toBe('create_habit');
    expect(result.action?.payload.name).toBe('10k Steps Daily');
    expect(result.action?.payload.targetDays).toBe(7);
  });

  it('correctly parses quick note requests', () => {
    const input = 'Note: Remember to test Android release build on physical phone';
    const result = AIAssistantService.parseUserInput(input);

    expect(result.action).toBeDefined();
    expect(result.action?.type).toBe('create_note');
    expect(result.action?.payload.content).toContain('Remember to test Android release build');
  });

  it('applies proposed actions through repository abstractions', async () => {
    const action = {
      id: 'test-act',
      type: 'create_task' as const,
      title: 'Sample Task',
      details: 'Due today',
      payload: { title: 'Sample Task', priority: 'medium', due_date: 'Today' },
      status: 'pending' as const,
    };

    const success = await AIAssistantService.applyAction(action);
    expect(success).toBe(true);
  });
});

describe('LifeOS Financial Minor Unit Safety', () => {
  it('performs decimal-safe integer addition without floating-point creep', () => {
    const cents1 = 10; // $0.10
    const cents2 = 20; // $0.20
    const totalCents = cents1 + cents2;

    expect(totalCents).toBe(30);
    expect((totalCents / 100).toFixed(2)).toBe('0.30');
  });

  it('correctly handles multi-digit currency math and subtraction', () => {
    const incomeCents = 250000; // $2,500.00
    const expenseCents = 84950; // $849.50
    const netCents = incomeCents - expenseCents;

    expect(netCents).toBe(165050);
    expect((netCents / 100).toFixed(2)).toBe('1650.50');
  });
});

describe('LifeOS Security & Vault Integrity', () => {
  it('verifies PIN configuration and lockout protection API contract', async () => {
    const isConfigured = await SecurityService.isPinConfigured();
    expect(typeof isConfigured).toBe('boolean');

    const result = await SecurityService.verifyPin('1234');
    expect(result).toHaveProperty('success');
    expect(result).toHaveProperty('isLocked');
  });

  it('exports structured backup payload matching schema specification', async () => {
    const backupJson = await SecurityService.exportBackup();
    const parsed = JSON.parse(backupJson);

    expect(parsed).toHaveProperty('version');
    expect(parsed).toHaveProperty('timestamp');
    expect(parsed).toHaveProperty('checksum');
    expect(parsed).toHaveProperty('tables');
    expect(parsed.tables).toHaveProperty('tasks');
    expect(parsed.tables).toHaveProperty('habits');
    expect(parsed.tables).toHaveProperty('financial_transactions');
  });
});

describe('LifeOS Cryptographic Offline Licensing', () => {
  it('validates authentic offline HMAC-SHA256 license keys', async () => {
    const validKey = 'LIFEOS-PRO-MRQ-BE3BCDBB';
    const res = await LicenseService.verifyLicenseKey(validKey);

    expect(res.isValid).toBe(true);
    expect(res.tier).toBe('pro');
    expect(res.holderName).toBe('MRQ');
    expect(res.expiresYear).toBe(2030);
  });

  it('rejects tampered or malformed license keys', async () => {
    const tampered = 'LIFEOS-PRO-MRQ-DEADBEEF';
    const res = await LicenseService.verifyLicenseKey(tampered);

    expect(res.isValid).toBe(false);
    expect(res.error).toBeDefined();
  });

  it('activates valid license and retrieves license info', async () => {
    const key = 'LIFEOS-PRO-MRQ-BE3BCDBB';
    const activation = await LicenseService.activateLicense(key);

    expect(activation.success).toBe(true);
    expect(activation.tier).toBe('pro');
  });
});
