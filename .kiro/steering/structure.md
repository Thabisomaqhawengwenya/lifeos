# Project Structure

## Root Layout

```
LifeOS/
├── app/                        # Expo Router screens (file = route)
│   ├── (tabs)/                 # Tab navigator group
│   │   ├── _layout.tsx         # Tab bar config (5 tabs)
│   │   ├── index.tsx           # Home Dashboard
│   │   ├── planner.tsx         # Schedule & Planner
│   │   ├── tasks.tsx           # Tasks & Projects
│   │   ├── life.tsx            # Life Hub (habits, goals, finance, notes, vault)
│   │   └── assistant.tsx       # Offline AI Assistant
│   ├── _layout.tsx             # Root layout (fonts, ThemeProvider, UpdateBanner)
│   ├── modal.tsx               # Shared modal route
│   ├── +not-found.tsx          # 404 screen
│   └── +html.tsx               # Web HTML shell
├── src/
│   ├── components/
│   │   ├── ui/                 # Reusable design-system primitives
│   │   ├── tasks/              # Feature-scoped components (TaskDetailModal)
│   │   ├── notes/              # Feature-scoped components (NoteEditorModal)
│   │   └── search/             # GlobalSearchModal
│   ├── database/
│   │   ├── database.ts         # Singleton SQLite connection (WAL + FK setup)
│   │   └── schema.ts           # INITIAL_SCHEMA DDL string (all tables + indices)
│   ├── design-system/
│   │   ├── tokens.ts           # LightColors, DarkColors, Typography, Spacing, Radii, HardShadows
│   │   ├── ThemeContext.tsx     # ThemeProvider + useAppTheme() hook
│   │   └── haptics.ts          # haptic.light() / haptic.selection() helpers
│   ├── repositories/           # Data access layer — static class methods, raw SQL
│   │   ├── TaskRepository.ts
│   │   ├── HabitRepository.ts
│   │   ├── NoteAndGoalRepository.ts
│   │   ├── FinanceRepository.ts
│   │   └── SearchRepository.ts
│   ├── services/               # Business logic / integrations
│   │   ├── AIAssistantService.ts
│   │   ├── NotificationService.ts
│   │   ├── SecurityService.ts
│   │   ├── UpdateService.ts
│   │   ├── CurrencyService.ts
│   │   └── LicenseService.ts
│   └── test/
│       └── setup.ts            # Vitest global setup
├── assets/
│   ├── fonts/                  # SpaceMono-Regular.ttf
│   └── images/                 # Icons, splash, adaptive icon assets
├── constants/
│   └── Colors.ts               # Legacy color constants (prefer design-system/tokens.ts)
├── components/                 # Legacy top-level components (Themed, ExternalLink, etc.)
├── app.json                    # Expo config (CNG — no ios/ or android/ dirs)
├── eas.json                    # EAS build profiles
└── package.json
```

## Architectural Layers

```
Screen (app/(tabs)/*.tsx)
    ↓ calls
Repository (src/repositories/*.ts)   ← static classes, raw SQL via expo-sqlite
    ↓ uses
Database singleton (src/database/database.ts)
    ↓
SQLite file (lifeos.db, WAL mode)
```

Services layer (`src/services/`) handles side effects (notifications, OTA, AI parsing, security) and is called directly from screens or other services — not from repositories.

## Key Patterns

- **Route files only in `app/`** — all other code (components, hooks, utils) lives in `src/`.
- **`useAppTheme()`** is the single source of truth for colors, spacing, radii, typography, and shadows. Never hardcode color values in components.
- **Repository pattern**: Each domain has a static-method repository class. Screens call repository methods directly (no ORM, no Zustand/Redux).
- **Neo-Brutalist UI primitives** live in `src/components/ui/`: `BrutalCard`, `BrutalButton`, `BrutalChip`, `BrutalFAB`, `BrutalHeader`, `BrutalEmpty`. Use these instead of raw `View`/`TouchableOpacity` for consistent styling.
- **Hard shadows**: All interactive cards use `shadowRadius: 0`, `shadowOpacity: 1`, offset `{ width: 4, height: 4 }` — no blur, no soft shadows.
- **Press micro-animation**: Interactive components translate `{ x: 2, y: 2 }` on press-in and spring back on press-out via `react-native-reanimated`.
- **Path alias**: `@/` maps to the workspace root. Use `@/src/...` for imports from `src/`.
- **`expo-symbols`** is available but Ionicons (from `@expo/vector-icons`) is the primary icon set used throughout the app.
