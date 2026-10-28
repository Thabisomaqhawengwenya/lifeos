# Tech Stack

## Core

| Layer | Technology |
|---|---|
| Framework | Expo SDK ~58 / React Native 0.88 |
| Language | TypeScript ~6.0 |
| Navigation | Expo Router ~58 (file-based, routes in `app/`) |
| Database | `expo-sqlite` ~58 — WAL mode, foreign keys enabled |
| Animations | `react-native-reanimated` 4.x + `react-native-worklets` |
| Icons | `@expo/vector-icons` (Ionicons, Feather) |
| Haptics | `expo-haptics` via `src/design-system/haptics.ts` |
| Notifications | `expo-notifications` (exact alarms on Android) |
| Secure Storage | `expo-secure-store` |
| Crypto | `expo-crypto` (UUID generation, SHA-256) |
| OTA Updates | `expo-updates` (checked on load) |
| Testing | Vitest |

## Native Configuration

- No `ios/` or `android/` directories — **Continuous Native Generation (CNG)**. Configure native behavior in `app.json` and Expo config plugins only. Never create or edit native directories by hand.
- Build with EAS: `bunx eas-cli build -p android --profile preview`
- After adding any library with native code, a new development build is required.

## Common Commands

```bash
# Start dev server
npx expo start

# Start on specific platform
npx expo start --android
npx expo start --ios

# Type check
npx tsc --noEmit
# or
npm run typecheck

# Lint
npx expo lint
# or
npm run lint

# Run tests (single pass, no watch)
npm test

# Install a package (always use this — resolves SDK-compatible versions)
npx expo install <package>

# Fix incompatible package versions
npx expo install --fix

# Diagnose issues
npx expo-doctor

# EAS build (Android preview APK)
bunx eas-cli build -p android --profile preview

# EAS OTA update
bunx eas-cli update
```

## Key Conventions

- Use `npx expo install` (not `npm install` / `bun add`) for all new dependencies.
- Always run `npm run lint` and `npm run typecheck` before declaring a task done.
- IDs are generated with `Crypto.randomUUID()` from `expo-crypto`.
- All timestamps are ISO 8601 strings (`new Date().toISOString()`).
- Financial amounts are stored as **integer minor units** (cents): `$10.50 → 1050`.
- SQLite booleans are stored as `INTEGER` (0/1) and mapped to `boolean` in TypeScript via `Boolean(row.field)`.
- Deletions use **soft delete** (`deleted_at` timestamp) for sync compatibility; queries always filter `WHERE deleted_at IS NULL`.
