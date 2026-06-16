# 任意签 / Renyiqian

A compact floating desktop note app for local, always-visible personal notes.

For Brazilian Portuguese, see [`README.pt-BR.md`](./README.pt-BR.md).

## Overview

Renyiqian is a local-first Electron desktop app. It runs as a small floating launcher that opens into a compact note panel for quick capture, grouped notes, rich text, templates, search, timers, reminders, and Windows update checks.

This fork started from the Stickban codebase, but the active runtime is no longer a Kanban board or cloud-sync product. Legacy board/card naming still exists internally as a compatibility layer while the app behaves as grouped local notes.

## Current Status

The current runnable app includes:

- Logo-only floating launcher and compact always-on-top note panel
- Grouped local notes backed by SQLite
- Rich note editing and card previews
- Table templates and account-membership templates
- Global search across all local groups
- Per-note timers, quick countdown presets, reminder acknowledgement, snooze, reminder history, and timer quota editing
- Drag ordering within pinned and unpinned note sections
- Optional Windows launch-on-login preference, disabled by default
- Stable packaged Windows data path at `%APPDATA%/renyiqian/data/renyiqian.db`
- Packaged Windows update checks through GitHub Releases and `electron-updater`

The active main process exposes sync IPC calls only as local-only compatibility responses. The older synced-folder implementation and sync-risk regression tests have been removed; restoring sync requires a new product decision and fresh implementation plan.

## Product Direction

- Local-only single-machine note workflow by default
- Fast floating desktop access
- SQLite as the local source of truth
- No accounts, provider APIs, OAuth, paid services, or managed cloud infrastructure in the current product line
- Optional sync or multi-device support only after an explicit scope decision

## Technology Stack

- Electron
- React + TypeScript
- SQLite via `better-sqlite3`
- Tailwind CSS
- dnd-kit for renderer-managed drag interactions
- electron-builder and electron-updater for Windows packaging/update flow

## Local Development

Prerequisites:

- Node.js 20 is recommended for this checkout because the project-local toolchain is known to work with `better-sqlite3`
- npm

Recommended Windows setup:

```powershell
$root = (Resolve-Path .).Path
$env:PATH = (Join-Path $root '.tools\node-v20.20.2-win-x64') + ';' + $env:PATH
$env:LOCALAPPDATA = (Join-Path $root '.localappdata')
```

Commands:

```bash
npm install
npm test
npm run dev
npm run build
npm run dist:win
npm run site:build
```

If you are running as `root` in WSL/Linux, use:

```bash
npm run dev:root
npm run start:root
```

Repository update convenience script:

```bash
./update-local-main.sh
```

The script fetches the remote and performs a fast-forward-only update, but it refuses to run if the working tree is dirty.

## Local Data Path

The current Renyiqian desktop build persists its local SQLite database at:

```text
<userData>/data/renyiqian.db
```

Typical locations:

- Windows packaged app: `%APPDATA%/renyiqian/data/renyiqian.db`
- Legacy Windows builds may have used `%APPDATA%/任意签/data/renyiqian.db` or `%APPDATA%/Stickban/data/stickban.db`; startup migration copies those databases into the canonical `renyiqian` directory when the new directory has no user notes.
- Linux packaged app: `~/.config/renyiqian/data/renyiqian.db`
- Linux development runs may still use an Electron development user-data directory.

The Windows packaged path is intentionally stable across reinstall and update flows so local notes are not lost when product display names change.

## Repository Structure

The current app implementation lives mainly in:

- `src/main/`: Electron main process, SQLite persistence, window behavior, update service, and local-only sync compatibility handlers
- `src/preload/`: renderer-safe IPC bridge
- `src/renderer/`: React floating note UI
- `src/shared/`: shared IPC/data types
- `site/`: public landing page

## Roadmap Snapshot

For the detailed roadmap, see [`ROADMAP.md`](./ROADMAP.md).

- Current: local floating notes, grouped SQLite persistence, rich editing, templates, search, timers, reminders, Windows startup preference, and packaged Windows update checks
- Next: audit-driven repair work, including live UI smoke checks, dependency upgrades, and local data durability improvements
- Future: tray integration, themes, export/import, local backup recovery UX, and only explicitly approved sync or companion-app scope

## Repository Documents

- [`README.pt-BR.md`](./README.pt-BR.md): Brazilian Portuguese version of this README
- [`SPEC.md`](./SPEC.md): current product specification
- [`ROADMAP.md`](./ROADMAP.md): planned milestones and future priorities
- [`IMPLEMENTATION.md`](./IMPLEMENTATION.md): current repository state and delivered milestones
- [`AGENTS.md`](./AGENTS.md): operating guidance for programming agents
- [`DECISIONS.md`](./DECISIONS.md): architecture decision log
- [`PROJECT_DEVELOPMENT.md`](./PROJECT_DEVELOPMENT.md): current task state, verification notes, and next steps

## Landing Page

- The project includes a public landing page built from [`site/`](./site)
- The landing page is intended for GitHub Pages publication
- The public site is separate from the desktop release pipeline

## Releases

- Every push to `main` is intended to generate an automatic GitHub Release
- The release version is calculated from commit conventions since the latest SemVer tag
- `feat` bumps minor, `fix` and operational commit types bump patch, and `BREAKING CHANGE` or `type!` bumps major
- Public release artifacts are currently produced for Windows only
- Windows releases are distributed as an NSIS installer
- Packaged Windows builds expose an opt-in launch-on-login setting inside the app
- Packaged Windows builds check public GitHub Releases for updates in-app and can restart to install a downloaded update
- The installer and in-app updater keep automatic relaunch disabled by default after install/update
- Linux packaging remains available for local builds, but Linux artifacts are not currently published in GitHub Releases

## AI-Assisted Development

This repository is maintained with AI-assisted tooling, including tools such as Codex, Claude, Antigravity, and similar systems. The preferred maintenance model is to keep using AI-capable development tools as the primary workflow, while still allowing direct manual edits when they are the better fit for a task.

## Transparency Note

This repository may contain code, documentation, and project structure created or refined with AI assistance and human review. AI assistance does not remove the need for technical validation. The project does not provide any warranty beyond the terms already stated in [`LICENSE`](./LICENSE), and independent review remains advisable for commercial, regulated, or higher-risk use cases.

## License

This repository includes an MIT license in [`LICENSE`](./LICENSE).
