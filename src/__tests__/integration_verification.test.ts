import { describe, it, expect } from 'vitest';
import { AIAssistantService } from '../services/AIAssistantService';
import { getLocalDateString, getWeekDays, isTodayDate, formatHeaderDate } from '../utils/date';

describe('LifeOS Full Integration & Edge-Case Verification', () => {
  it('parses natural language assistant commands deterministically', () => {
    const expenseRes = AIAssistantService.parseUserInput('spent $45 on groceries');
    expect(expenseRes.action).toBeDefined();
    expect(expenseRes.action?.type).toBe('log_expense');
    expect(expenseRes.action?.payload.amount_cents).toBe(4500);
    expect(expenseRes.action?.payload.category).toBe('Food & Dining');

    const taskRes = AIAssistantService.parseUserInput('urgent task: review database index');
    expect(taskRes.action).toBeDefined();
    expect(taskRes.action?.type).toBe('create_task');
    expect(taskRes.action?.payload.priority).toBe('high');

    const habitRes = AIAssistantService.parseUserInput('track habit: Morning Deep Work');
    expect(habitRes.action).toBeDefined();
    expect(habitRes.action?.type).toBe('create_habit');
    expect(habitRes.action?.payload.name).toBe('Morning Deep Work');
  });

  it('handles edge cases: very long titles and empty inputs', () => {
    const longInput = 'A'.repeat(500);
    const longRes = AIAssistantService.parseUserInput(longInput);
    expect(longRes.action).toBeDefined();
    expect(longRes.action?.payload.title).toBe(longInput);

    const emptyRes = AIAssistantService.parseUserInput('');
    expect(emptyRes.action).toBeUndefined();
    expect(emptyRes.responseText).toContain('How can I assist');
  });

  it('verifies timezone-safe date generation across all 7 days of the week', () => {
    const today = new Date();
    const todayStr = getLocalDateString(today);
    const week = getWeekDays(today);
    expect(week.length).toBe(7);

    const todayItem = week.find((d) => d.fullDate === todayStr);
    expect(todayItem).toBeDefined();
    expect(todayItem?.isToday).toBe(true);

    const otherItems = week.filter((d) => d.fullDate !== todayStr);
    otherItems.forEach((item) => {
      expect(item.isToday).toBe(false);
    });
  });
});
