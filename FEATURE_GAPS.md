# LifeOS Feature Gaps Analysis

**Date:** 2026-10-28  
**Status:** Production feature roadmap

---

## Overview

This document analyzes feature gaps between LifeOS and production competitors (Notion, Todoist, Habitica, YNAB, Bear, Structured, TickTick, Any.do). All recommendations are based on actual missing functionality that exists in market leaders.

---

## Critical Missing Features

### 1. Recurring Tasks / Habit Scheduling
**Status:** ❌ Not implemented  
**Competitors:** Todoist, TickTick, Any.do, Structured

**Current State:**
- Tasks are one-off only
- No `recurrence` field in schema
- `reminders` table exists but has no recurrence logic

**What's Needed:**
- Add `recurrence TEXT` column to `tasks` table (values: `null`, `daily`, `weekly`, `monthly`, `custom`)
- Add `recurrence_pattern TEXT` for custom rules (e.g., `"every 2 weeks on Friday"`)
- Background service that auto-generates next instance when task is completed
- UI toggle in task creation modal: "Repeat" section with frequency picker

**Impact:** High — core productivity feature  
**Effort:** Medium — schema change + background logic

---

### 2. Task Time Blocking / Real Planner Time Slots
**Status:** ⚠️ Partially implemented (faked)  
**Competitors:** Structured, Fantastical, Reclaim.ai

**Current State:**
- Planner shows hardcoded time slots (`09:00 AM`, `01:30 PM` based on array index)
- Tasks have `due_date` but no `start_time` or `duration`
- Cannot schedule "write report from 2pm-4pm"

**What's Needed:**
- Add `start_time TEXT` (ISO time format `HH:MM`) to `tasks` table
- Add `duration_minutes INTEGER` to `tasks` table
- Replace fake timeline with real time-grid view (hourly slots 6am-11pm)
- Drag-to-schedule interaction (optional, can start with time picker in modal)

**Impact:** High — makes Planner functional vs decorative  
**Effort:** Medium — schema + significant UI rework

---

### 3. Budget Categories / Spending Limits
**Status:** ❌ Not implemented  
**Competitors:** YNAB, Wallet, Money Manager, PocketGuard

**Current State:**
- Finance logs transactions and shows totals
- No concept of "I want to spend max $200/month on Food"
- No progress bars showing category utilization

**What's Needed:**
```sql
CREATE TABLE budgets (
  id TEXT PRIMARY KEY NOT NULL,
  category TEXT NOT NULL,
  limit_cents INTEGER NOT NULL,
  period TEXT NOT NULL DEFAULT 'monthly', -- 'weekly', 'monthly', 'yearly'
  start_date TEXT NOT NULL,
  created_at TEXT NOT NULL
);
```
- UI in Life screen: Budget card per category with progress bar
- Alert when approaching/exceeding limit (80% warning, 100% error)

**Impact:** High — differentiates Finance section from basic expense tracker  
**Effort:** Medium — new table + UI components

---

### 4. Note Linking / Backlinks
**Status:** ❌ Not implemented  
**Competitors:** Notion, Obsidian, Logseq, Roam Research

**Current State:**
- Notes are isolated — cannot reference another note
- No link between notes and goals/tasks
- `tags` field is plain text string, not relational

**What's Needed:**
```sql
CREATE TABLE note_links (
  id TEXT PRIMARY KEY NOT NULL,
  source_note_id TEXT NOT NULL,
  target_id TEXT NOT NULL,
  target_type TEXT NOT NULL, -- 'note', 'task', 'goal'
  created_at TEXT NOT NULL,
  FOREIGN KEY (source_note_id) REFERENCES notes (id) ON DELETE CASCADE
);
```
- Parse `[[Note Title]]` syntax in note content
- Backlinks section in note detail: "Referenced in 3 notes, 1 goal"
- Graph view (optional, nice-to-have)

**Impact:** Medium — power users love this, casual users ignore it  
**Effort:** High — parser + link resolution + UI

---

### 5. Habit Completion History / Calendar Heatmap
**Status:** ⚠️ Data exists, not visualized  
**Competitors:** Habitica, Streaks, Habit – Daily Tracker, GitHub (for inspiration)

**Current State:**
- `habit_logs` table stores every completion with `log_date`
- UI only shows `streak_current` and `streak_best` numbers
- No way to see *which specific days* a habit was completed

**What's Needed:**
- Calendar heatmap component (7 columns × 5+ rows showing last N weeks)
- Color intensity based on completion frequency
- Tap a date cell to see all habits completed that day
- Lives in habit detail modal or dedicated "History" tab

**Impact:** High — visual, satisfying, drives retention  
**Effort:** Low — UI component only, data is ready

---

### 6. Goal → Task Linking
**Status:** ❌ Not implemented  
**Competitors:** Notion, TickTick (Smart Lists), Linear, Asana

**Current State:**
- Goals and tasks are completely disconnected entities
- Cannot say "Task X contributes to Goal Y"
- Goal progress is manual `progress_percent`, not derived

**What's Needed:**
- Add `goal_id TEXT` foreign key to `tasks` table (nullable)
- Goal detail view lists linked tasks
- Auto-calculate goal progress: `completed_tasks / total_linked_tasks`
- Task creation modal: optional "Link to Goal" picker

**Impact:** High — connects the app's core entities  
**Effort:** Low — one column + UI enhancements

---

### 7. Home Screen Widget / Quick Capture
**Status:** ❌ Not implemented  
**Competitors:** Todoist, Any.do, Notion, TickTick

**Current State:**
- Task creation requires opening app → tapping FAB → modal
- No home screen presence

**What's Needed:**
- iOS: Use `expo-widgets` (WidgetKit, iOS 16+)
- Android: Use `@bam.tech/react-native-android-widget`
- Widget types:
  - Small: Today's task count + quick add button
  - Medium: Next 3 tasks list
  - Large: Full agenda view
- Tapping widget opens app to relevant screen

**Impact:** High — fastest capture, boosts daily engagement  
**Effort:** High — platform-specific native code

---

### 8. CSV Export for Finance
**Status:** ❌ Not implemented  
**Competitors:** Every finance app (YNAB, Mint, PocketGuard, Wallet)

**Current State:**
- Can export full DB backup (SHA-256 encrypted, binary)
- Cannot export just transactions as CSV for Excel/Sheets

**What's Needed:**
- "Export Transactions" button in Life screen
- Generate CSV: `date, type, category, amount, description`
- Use `expo-sharing` to open native share sheet
- Optional date range filter (this month, last 3 months, all time)

**Impact:** Medium — essential for serious finance tracking  
**Effort:** Low — CSV generation + sharing APIs

---

### 9. Focus Timer / Pomodoro Sessions
**Status:** ❌ Not implemented  
**Competitors:** TickTick, Structured, Forest, Focus Keeper

**Current State:**
- No time-tracking concept
- Cannot log "I worked on this task for 25 minutes"

**What's Needed:**
```sql
CREATE TABLE focus_sessions (
  id TEXT PRIMARY KEY NOT NULL,
  task_id TEXT,
  duration_minutes INTEGER NOT NULL,
  completed_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE SET NULL
);
```
- Timer UI in task detail modal (25min default, customizable)
- "Start Focus" button → countdown timer with pause/stop
- On completion: log session, show "Session complete! 🎯" toast
- Home dashboard: total focus time this week

**Impact:** Medium — differentiates from pure planners  
**Effort:** Medium — new table + timer UI + notifications

---

### 10. Search Result Navigation
**Status:** ⚠️ Partially implemented (broken)  
**Competitors:** Every app

**Current State:**
- `GlobalSearchModal` returns results but `onSelectItem` is optional
- Tapping a result just closes the modal
- No navigation to the actual item

**What's Needed:**
- Implement `onSelectItem` callback in all screens that use search
- Route to appropriate screen based on result type:
  - Task → open TaskDetailModal
  - Note → open NoteEditorModal
  - Goal → navigate to Life screen, scroll to goals section
  - Habit → navigate to Home screen, scroll to habits
  - Transaction → navigate to Life screen, scroll to finance

**Impact:** Medium — basic UX fix  
**Effort:** Low — just routing logic

---

## Priority Ranking (Effort vs Impact)

| # | Feature | Effort | Impact | Priority |
|---|---|---|---|---|
| 1 | Habit heatmap calendar | 🟢 Low | 🔴 High | **P0** |
| 2 | Goal → Task linking | 🟢 Low | 🔴 High | **P0** |
| 3 | Budget limits | 🟡 Medium | 🔴 High | **P0** |
| 4 | Search navigation | 🟢 Low | 🟡 Medium | **P1** |
| 5 | Recurring tasks | 🟡 Medium | 🔴 High | **P1** |
| 6 | Task time blocking | 🟡 Medium | 🔴 High | **P1** |
| 7 | CSV export | 🟢 Low | 🟡 Medium | **P2** |
| 8 | Focus timer | 🟡 Medium | 🟡 Medium | **P2** |
| 9 | Note linking | 🔴 High | 🟡 Medium | **P3** |
| 10 | Home widget | 🔴 High | 🔴 High | **P3** |

---

## Recommended Implementation Order

### Phase 1: Quick Wins (Week 1-2)
1. **Habit heatmap calendar** — data already exists, just visualize it
2. **Goal → Task linking** — one FK column + UI enhancements
3. **Search result navigation** — routing glue code

### Phase 2: Core Productivity (Week 3-5)
4. **Budget category limits** — new table + progress bars
5. **Recurring tasks** — schema + auto-generation service
6. **Task time blocking** — schema + Planner time-grid UI

### Phase 3: Polish & Power Features (Week 6-8)
7. **CSV export** — finance power users
8. **Focus timer** — time-tracking differentiator
9. **Note linking** — knowledge management layer

### Phase 4: Platform Integration (Week 9+)
10. **Home screen widget** — native platform work

---

## Technical Debt Considerations

**Database Migrations:**
- All schema changes need migration scripts (Expo doesn't have built-in migrations)
- Consider adding `schema_version` table and migration runner
- Current approach: manual SQL execution in `database.ts`

**Offline-First Sync:**
- New tables need `sync_queue` entries on INSERT/UPDATE/DELETE
- Budget limits, focus sessions, note links all need sync support
- Consider batching sync operations for performance

**Performance:**
- Habit heatmap: querying 90+ days of `habit_logs` per habit could be slow
  - Solution: Add index on `(habit_id, log_date)` compound key
- Time-grid Planner: rendering 17 hours × 60 minutes = 1020 slots
  - Solution: Virtualized list (react-native-virtualized-view) or hour-blocks only

**Testing:**
- Current test coverage is minimal (`src/__tests__/lifeos.test.ts` is a stub)
- Add integration tests for:
  - Recurring task generation logic
  - Budget limit calculations and alerts
  - Focus timer state management
  - Search result routing

---

## Out of Scope (Intentionally Excluded)

These features exist in competitors but are not recommended for LifeOS:

- **Cloud sync / multi-device** — already scoped as SHA-256 export, adding real-time sync is enterprise-level complexity
- **Collaboration / sharing** — personal productivity app, not team workspace
- **AI-powered task suggestions** — `AIAssistantService` already exists for chat, not auto-task-generation
- **Gamification / XP/levels** — Habitica's niche, would dilute LifeOS's serious productivity focus
- **Calendar integrations** — syncing with Google Calendar/Outlook is enterprise SDK work
- **Attachments / file uploads** — storage management complexity, notes already support text

---

## Next Steps

1. **Validate priorities** with user feedback (if applicable)
2. **Create GitHub issues** for each P0/P1 feature with detailed specs
3. **Design mockups** for Habit heatmap, Budget UI, Time-grid Planner
4. **Database migration strategy** — add `schema_version` table and migration runner
5. **Start with Phase 1** quick wins to demonstrate progress

---

**Document Owner:** LifeOS Development Team  
**Last Updated:** 2026-10-28  
**Next Review:** After Phase 1 completion
