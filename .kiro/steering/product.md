# LifeOS — Product Overview

LifeOS is an AI-powered personal operating system for Android (with iOS/web support), built with Expo and React Native. It is a **local-first, offline-capable** all-in-one life management app.

## Core Modules

- **Home Dashboard** — Time-of-day greeting, momentum metrics (tasks, habits, events), AI insight banners, today's high-priority items.
- **Planner** — Interactive week strip, day/week timeline views, conflict-aware scheduling.
- **Tasks & Projects** — SQLite CRUD with category tagging, priority badges (`high`/`medium`/`low`), subtasks, filter chips, soft deletion.
- **Life Hub** — Habits tracker (streaks, daily check-ins), Goals & Milestones (progress %), Personal Finance (integer minor-unit ledger), Notes (pinned support), Cryptographic Security Vault (SHA-256 JSON export).
- **Offline AI Assistant** — Deterministic natural-language parser (100% offline). Parses prompts into proposed actions (tasks, expenses, habits, notes) that require explicit user confirmation before state mutation.

## Key Principles

- **Local-first**: All data lives in an embedded SQLite database (WAL mode). Cloud sync (Supabase) is optional.
- **Offline by default**: No network dependency for any core feature.
- **Action preview pattern**: AI-proposed mutations are shown as cards and require explicit confirmation before writing to the database.
- **Android primary target**: Package ID `com.maqhawe.lifeos`; permissions include `SCHEDULE_EXACT_ALARM`, `POST_NOTIFICATIONS`, `RECEIVE_BOOT_COMPLETED`.
