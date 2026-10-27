import { TaskRepository } from '../repositories/TaskRepository';
import { FinanceRepository } from '../repositories/FinanceRepository';
import { HabitRepository } from '../repositories/HabitRepository';
import { NoteRepository } from '../repositories/NoteAndGoalRepository';
import { NotificationService } from './NotificationService';

export interface ProposedAIAction {
  id: string;
  type: 'create_task' | 'create_reminder' | 'log_expense' | 'create_habit' | 'create_note';
  title: string;
  details: string;
  payload: any;
  status: 'pending' | 'applied' | 'dismissed';
}

export interface AssistantMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  action?: ProposedAIAction;
}

export class AIAssistantService {
  /**
   * Deterministic Natural-Language Interpreter
   * Operates completely offline on device, parsing natural phrasing into validated actions.
   */
  static parseUserInput(input: string): { responseText: string; action?: ProposedAIAction } {
    const trimmed = input.trim();
    const lower = trimmed.toLowerCase();

    // 1. Expense Detection (e.g. "Spent $45 on groceries" or "Log expense 20 for lunch")
    const expenseMatch = lower.match(/(?:spent|expense|paid|bought)\s*(?:of|for)?\s*\$?(\d+(?:\.\d{1,2})?)\s*(?:on|for)?\s*(.*)/i)
      || lower.match(/\$?(\d+(?:\.\d{1,2})?)\s*(?:on|for)\s*(.*)/i);
    if (expenseMatch && (lower.includes('expense') || lower.includes('spent') || lower.includes('$') || lower.includes('paid'))) {
      const amountVal = parseFloat(expenseMatch[1]);
      const amountCents = Math.round(amountVal * 100);
      const desc = expenseMatch[2]?.trim() || 'General Expense';
      const category = this.guessCategory(desc);

      return {
        responseText: `I noticed an expense of $${amountVal.toFixed(2)} for "${desc}". Would you like me to record this in your local ledger?`,
        action: {
          id: `act_${Date.now()}`,
          type: 'log_expense',
          title: `Log Expense: $${amountVal.toFixed(2)}`,
          details: `Category: ${category} • Description: ${desc}`,
          payload: { amount_cents: amountCents, category, description: desc },
          status: 'pending',
        },
      };
    }

    // 2. Habit Creation Detection (e.g. "New habit: Read 30 mins" or "Track habit morning run")
    if (lower.startsWith('habit') || lower.includes('new habit') || lower.includes('track habit')) {
      const habitName = trimmed.replace(/^(?:new\s+)?habit:?\s*|^(?:track\s+)?habit:?\s*/i, '').trim();
      return {
        responseText: `I've prepared a new habit tracker for "${habitName}". Confirm to begin tracking consistency.`,
        action: {
          id: `act_${Date.now()}`,
          type: 'create_habit',
          title: `Track Habit: ${habitName}`,
          details: `Target: 7 days/week • Color: Forest Emerald`,
          payload: { name: habitName, targetDays: 7 },
          status: 'pending',
        },
      };
    }

    // 3. Quick Note Detection
    if (lower.startsWith('note') || lower.startsWith('memo') || lower.includes('write note')) {
      const noteContent = trimmed.replace(/^(?:new\s+)?(?:note|memo):?\s*|^(?:write\s+)?note:?\s*/i, '').trim();
      return {
        responseText: `I captured your note: "${noteContent}". Ready to save to your local notebook.`,
        action: {
          id: `act_${Date.now()}`,
          type: 'create_note',
          title: `Save Note: ${noteContent.slice(0, 30)}...`,
          details: noteContent,
          payload: { title: noteContent.slice(0, 30), content: noteContent },
          status: 'pending',
        },
      };
    }

    // 4. Task & Reminder Detection (Default fallback for actionable statements)
    let priority: 'low' | 'medium' | 'high' = 'medium';
    if (lower.includes('urgent') || lower.includes('high priority') || lower.includes('asap')) {
      priority = 'high';
    } else if (lower.includes('low priority')) {
      priority = 'low';
    }

    let dueDate = 'Today';
    if (lower.includes('tomorrow')) dueDate = 'Tomorrow';
    else if (lower.includes('next week')) dueDate = 'Next Week';

    const cleanTask = trimmed
      .replace(/^(?:remind me to|create task to|add task to|task:?|todo:?)\s*/i, '')
      .replace(/\b(?:urgent|high priority|asap|tomorrow|today|next week)\b/gi, '')
      .trim();

    const title = cleanTask || trimmed;

    return {
      responseText: `I have prepared a new task: "${title}". I've categorized it with ${priority.toUpperCase()} priority.`,
      action: {
        id: `act_${Date.now()}`,
        type: 'create_task',
        title: `Create Task: ${title}`,
        details: `Due: ${dueDate} • Priority: ${priority.toUpperCase()}`,
        payload: { title, priority, due_date: dueDate },
        status: 'pending',
      },
    };
  }

  static async applyAction(action: ProposedAIAction): Promise<boolean> {
    try {
      if (action.type === 'create_task') {
        await TaskRepository.createTask({
          title: action.payload.title,
          priority: action.payload.priority,
          due_date: action.payload.due_date,
        });
        return true;
      }

      if (action.type === 'log_expense') {
        await FinanceRepository.createTransaction({
          type: 'expense',
          amount_cents: action.payload.amount_cents,
          category: action.payload.category,
          description: action.payload.description,
        });
        return true;
      }

      if (action.type === 'create_habit') {
        await HabitRepository.createHabit({
          name: action.payload.name,
          targetDays: action.payload.targetDays,
        });
        return true;
      }

      if (action.type === 'create_note') {
        await NoteRepository.createNote({
          title: action.payload.title,
          content: action.payload.content,
        });
        return true;
      }

      return false;
    } catch (err) {
      console.warn('Failed to apply AI action:', err);
      return false;
    }
  }

  private static guessCategory(desc: string): string {
    const l = desc.toLowerCase();
    if (l.includes('food') || l.includes('lunch') || l.includes('dinner') || l.includes('coffee') || l.includes('groceries')) {
      return 'Food & Dining';
    }
    if (l.includes('fuel') || l.includes('uber') || l.includes('transport') || l.includes('flight')) {
      return 'Transportation';
    }
    if (l.includes('software') || l.includes('server') || l.includes('subscription') || l.includes('hosting')) {
      return 'Technology';
    }
    return 'General';
  }
}
