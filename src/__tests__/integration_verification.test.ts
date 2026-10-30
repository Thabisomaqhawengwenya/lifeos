import { describe, it, expect, vi } from 'vitest';
import { AIAssistantService } from '../services/AIAssistantService';
import { getLocalDateString, getWeekDays, isTodayDate, formatHeaderDate } from '../utils/date';
import { createSearchSelectHandler } from '../utils/searchNavigation';
import { router } from 'expo-router';

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

  it('navigates to appropriate destination when global search result is selected', () => {
    const mockOnSelectTask = vi.fn();
    const mockOnSelectNote = vi.fn();

    const handler = createSearchSelectHandler({
      onSelectTask: mockOnSelectTask,
      onSelectNote: mockOnSelectNote,
    });

    // 1. Task -> calls onSelectTask
    handler({ id: 'task-1', type: 'task', title: 'Task 1', subtitle: 'Sub' });
    expect(mockOnSelectTask).toHaveBeenCalledWith('task-1');

    // 2. Note -> calls onSelectNote
    handler({ id: 'note-1', type: 'note', title: 'Note 1', subtitle: 'Sub' });
    expect(mockOnSelectNote).toHaveBeenCalledWith('note-1');

    // 3. Habit -> navigates to life tab habits section
    handler({ id: 'habit-1', type: 'habit', title: 'Habit 1', subtitle: 'Sub' });
    expect(router.navigate).toHaveBeenCalledWith({
      pathname: '/(tabs)/life',
      params: { section: 'habits', itemId: 'habit-1' },
    });

    // 4. Expense -> navigates to life tab finance section
    handler({ id: 'exp-1', type: 'expense', title: 'Expense 1', subtitle: 'Sub' });
    expect(router.navigate).toHaveBeenCalledWith({
      pathname: '/(tabs)/life',
      params: { section: 'finance', itemId: 'exp-1' },
    });

    // 5. Goal -> navigates to life tab goals section
    handler({ id: 'goal-1', type: 'goal', title: 'Goal 1', subtitle: 'Sub' });
    expect(router.navigate).toHaveBeenCalledWith({
      pathname: '/(tabs)/life',
      params: { section: 'goals', itemId: 'goal-1' },
    });
  });

  it('navigates with default fallback routing when custom handlers are not provided', () => {
    const defaultHandler = createSearchSelectHandler({});

    // Task fallback routes to /tasks
    defaultHandler({ id: 'task-fallback', type: 'task', title: 'Task', subtitle: 'Sub' });
    expect(router.navigate).toHaveBeenCalledWith({
      pathname: '/(tabs)/tasks',
      params: { taskId: 'task-fallback' },
    });

    // Note fallback routes to /life with section notes
    defaultHandler({ id: 'note-fallback', type: 'note', title: 'Note', subtitle: 'Sub' });
    expect(router.navigate).toHaveBeenCalledWith({
      pathname: '/(tabs)/life',
      params: { section: 'notes', noteId: 'note-fallback' },
    });
  });
});
