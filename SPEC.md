# 任意签 / Renyiqian

Renyiqian is a compact local-first desktop note app. It is designed to stay visible as a small floating launcher and expand into a focused note panel when the user needs to capture, review, edit, search, or acknowledge reminders.

## Product Summary

- Local floating desktop notes
- SQLite as the local source of truth
- Small always-on-top launcher and compact panel
- Grouped notes with rich text content
- Table/account templates for repeated local records
- Global local search
- Per-note timers, reminder acknowledgement, snooze, reminder history, quick countdown presets, and quota editing
- Packaged Windows update checks through GitHub Releases

## Current Repository Reality

The current runnable app includes:

- Logo-only floating launcher
- Compact note panel
- Local groups backed by the existing board compatibility model
- Local notes backed by the existing card compatibility model
- Rich text editor and sanitized rendered note HTML
- Global search across all live local notes
- Timer reminders that scan all groups, not only the active group
- Optional launch-on-login preference for packaged Windows builds
- Stable Windows data path under `%APPDATA%/renyiqian`
- In-app update checks for packaged Windows builds

The following are not active runtime capabilities:

- Accounts
- Cloud sync
- Multi-device sync
- Provider APIs
- OAuth
- Managed backend infrastructure
- Mobile companion app

Legacy synced-folder sync code has been removed from the repository. The active main process still exposes sync IPC as local-only compatibility responses so older renderer/API callers do not crash. Treat sync as absent from the active product until a future decision explicitly restores it.

## Usage

- Launch Renyiqian
- Click the floating logo launcher to open the note panel
- Create notes in the active group
- Search across all groups
- Open a note to edit rich content
- Generate table/account template notes
- Add timers to notes
- Confirm or snooze reminders from the top-right reminder entry when timers fire
- Collapse the panel back to the floating launcher
- Optionally enable launch on Windows login in packaged Windows builds
- Install packaged Windows updates after they are downloaded

## Architecture Overview

Renyiqian follows a local-first model:

- Local SQLite is the operational source of truth
- Local reads and writes must work without internet
- Sync is not part of the current active runtime
- Update checks are separate from local data storage and should not block note usage
- Rich note HTML must be sanitized before renderer insertion
- Local reminders must consider all live notes, including inactive groups

## Data Model

Current compatibility entities:

- Boards represent note groups
- Columns remain as compatibility containers
- Cards represent notes

Current note content:

- `CardRecord.description` stores JSON for rich note HTML, pinned state, and timers
- Legacy plain-text descriptions are still readable
- Rendered note HTML is sanitized at the note-view boundary

Implementation defaults:

- New entities should use UUIDs
- SQLite remains authoritative
- Local data must survive reinstall/update/product-name changes
- Remote-first assumptions should not be introduced without a recorded decision

## Non-functional Requirements

- Fast startup
- Responsive renderer interactions
- No UI blocking during update checks
- Local data protection during app update/reinstall
- Predictable reminder behavior across all local groups
- Safe rendering of stored or pasted rich note HTML

## Local Development

### Prerequisites

- Node.js 20 recommended for this checkout
- npm

### Install

```bash
npm install
```

### Run in development

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Windows package

```bash
npm run dist:win
```

## Project Structure

The current implementation lives mainly in:

- `src/main/`
- `src/preload/`
- `src/renderer/`
- `src/shared/`
- `site/`

## Roadmap Direction

Current priority:

- Audit-driven repair work before feature expansion
- Reminder correctness
- Rich HTML sanitization
- Documentation/runtime consistency
- Live UI smoke verification
- Dependency security upgrade
- Live UI smoke verification

Future product work:

- System tray integration
- Theme support
- Export/import
- Local backup and recovery UX
- Optional sync only after explicit scope approval

## License

MIT
