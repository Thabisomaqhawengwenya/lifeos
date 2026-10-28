# LifeOS 🌿

> **One application. One personal workspace. A clearer view of your entire life.**

**LifeOS** is an AI-powered personal operating system for Android built with Expo and React Native. It features local-first SQLite persistence, Material 3 Expressive UI, task and habit tracking, financial records, exact alarm notifications, cryptographic backup vaults, and offline natural-language AI.

---

## 📲 Download & Install Android APK (v1.1.0 Neo-Brutalism & OTA)

| Platform | Download Link | Build Type | Status |
| :--- | :--- | :--- | :--- |
| **Android (APK v1.1.0)** | [⬇️ Download LifeOS v1.1.0 APK](https://github.com/Thabisomaqhawengwenya/lifeos/releases/download/v1.1.0/LifeOS-v1.1.0.apk) | Standalone Preview APK (`com.maqhawe.lifeos`) | ✅ Latest Release |
| **GitHub Release v1.1.0** | [📦 GitHub Release v1.1.0](https://github.com/Thabisomaqhawengwenya/lifeos/releases/tag/v1.1.0) | Official Release Asset with OTA engine | ✅ Live |
| **Expo EAS Cloud** | [🌐 Expo Build Details](https://expo.dev/accounts/maqhawengwenya/projects/LifeOS/builds/2bc5ec3b-779a-4f5a-9523-c6d840ea30c6) | EAS Cloud Artifact (`2bc5ec3b`) | ✅ Complete |

---

## 🏛️ Architecture & System Design

LifeOS operates on a strict **local-first architecture**. All reads and writes hit an embedded SQLite database running in Write-Ahead Logging (WAL) mode, guaranteeing instant responsiveness, offline resilience, and zero data loss on phone reboots.

```
       UI & Screen Layer (Expo Router v58)
                       ↓
       Theme Engine & Tactile Feedback (M3 Expressive)
                       ↓
       Feature ViewModels & Domain Hooks
                       ↓
       Repository Abstraction Layer
                       ↓
       Embedded SQLite Database (WAL Mode)
                       ↓ (Optional Cloud Sync)
       Supabase PostgreSQL & Row Level Security
```

---

## ✨ Core Modules

### 1. 🎯 Home Dashboard
- Dynamic time-of-day greeting & date banner.
- Real-time momentum metrics (Tasks completed vs due, active habit streaks, events).
- Contextual AI insight banners.
- Today's high-priority deliverables list with instant checkbox toggling.

### 2. 🗓️ Schedule & Planner
- Interactive week strip with date selector.
- Day and Week timeline modes with color-coded nodes.
- Conflict-aware schedule management.

### 3. ✅ Tasks & Projects
- Live SQLite CRUD with category tagging and priority badges (`high`, `medium`, `low`).
- Subtasks and checklist tracking.
- Filter chips: *All Tasks*, *Due Today*, *Upcoming*, *Completed*.
- Soft deletion architecture (`deleted_at`) for seamless cloud synchronization.

### 4. 🌟 Life Hub
- **Habits Tracker**: Daily check-ins, automated streak counters, and target frequency.
- **Goals & Milestones**: Progress bar tracking from 0% to 100%.
- **Personal Finance**: Integer minor-unit (cents) manual expense/income ledger with monthly summary calculations.
- **Notes & Knowledge**: Clean writing experience with pinned note support.
- **Cryptographic Security Vault**: Full SQLite JSON export with SHA-256 integrity verification.

### 5. 🤖 Offline AI Assistant
- Deterministic natural-language parser working 100% offline.
- Handles natural prompts: *"Spent $45 on groceries"*, *"Urgent task fix database tomorrow"*, *"Track habit Morning Run"*.
- Safe action preview cards: Proposed actions require explicit confirmation before state mutation.

---

## 📱 Mobile & Android Native Features

- **Package ID**: `com.maqhawe.lifeos`
- **Native Permissions**: `POST_NOTIFICATIONS`, `SCHEDULE_EXACT_ALARM`, `USE_EXACT_ALARM`, `RECEIVE_BOOT_COMPLETED`, `VIBRATE`.
- **Exact Notification Alarms**: High-importance Android notification channels for reminders.
- **Ergonomics**: Full `KeyboardAvoidingView` integration and adaptive safe area insets.
- **Tactile Micro-Press**: Scale animation (`0.96`) and haptic feedback on chips and buttons.

---

## 🚀 Getting Started

### Prerequisites
- Node.js `v20+` or `v24+`
- npm or bun
- Expo Go on Android / iOS or Android Studio

### Installation
```bash
# Clone the repository
git clone https://github.com/Thabisomaqhawengwenya/lifeos.git
cd lifeos

# Install dependencies
npm install

# Start development server
npx expo start -c
```

### Running Tests & Type Checks
```bash
# Run automated Vitest suite (9/9 passing)
npm test

# Run strict TypeScript check
npm run typecheck
```

### Standalone Android APK Build
Build a sideloadable `.apk` directly with EAS:
```bash
npx eas-cli build -p android --profile preview
```

---

## 📄 License
MIT © Maqhawe T Ngwenya (Mr Q). Built with love and high-craft precision.
