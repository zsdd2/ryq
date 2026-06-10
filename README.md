# Stickban

A sticky Kanban board that lives on your desktop.

For Brazilian Portuguese, see [`README.pt-BR.md`](./README.pt-BR.md).

## Overview

Stickban is a desktop Kanban application focused on speed, low friction, and constant visibility. The product direction is offline-first, with local persistence as the primary data source and optional cloud synchronization across devices.

## Current Status

This repository is in bootstrap stage. The product specification exists in [`SPEC.md`](./SPEC.md), and the first runnable application scaffold is now in place.

The documentation in this repository is intended to establish direction while implementation is still maturing.
The current runnable milestone is still local-first, but now also includes cloud sync through a user-selected synced folder. The app currently covers multiple boards, board-specific columns, column reordering and cross-board moves, SQLite persistence, drag and drop, always-on-top behavior, an optional Windows launch-on-login preference that stays disabled by default and now distinguishes app-level registration from Windows-level startup disablement, startup flow that prioritizes showing the local window before sync and update background work catches up, single-instance protection that prevents duplicate desktop windows during startup or relaunch, duplicate startup-entry cleanup for stale Windows login items, immutable sync operation files, periodic sync checkpoints, guarded first-time sync bootstrap behavior, checkpoint validation, retry of out-of-order remote operations with missing dependencies, local recovery backups before destructive remote adoption, and rejection of orphan remote operations that would corrupt workspace state.

## Product Direction

- Desktop-first Kanban workflow
- Sticky widget behavior, with optional always-on-top mode
- Fast and lightweight user experience
- Offline-first architecture
- Local SQLite persistence
- Optional cloud sync through a user-managed synced folder

## Planned Technology Stack

- Electron
- React + TypeScript
- SQLite via `better-sqlite3`
- Zustand for state management
- Tailwind CSS
- Custom drag interactions in the renderer

## Initial Implementation Cut

- Keep the local desktop stack: Electron, React + TypeScript, `better-sqlite3`, Zustand, Tailwind CSS, and renderer-managed drag interactions
- Keep SQLite as the operational source of truth while sync propagates immutable operation files plus periodic checkpoints through a synced folder
- Avoid provider APIs, OAuth, and managed cloud infrastructure
- Focus the current milestone on a local-first workspace with multiple boards, board-specific columns, inline column rename, column drag and drop, SQLite persistence, always-on-top behavior, optional Windows launch-on-login with clearer Windows startup-state diagnostics, startup that favors local window visibility before background sync/update work, and synced-folder cloud sync

## Local Development

Prerequisites:

- Node.js 18+ recommended
- npm

Commands:

```bash
npm install
npm test
npm run dev
npm run site:build
```

If you are running as `root` in WSL/Linux, use:

```bash
npm run dev:root
```

Production build:

```bash
npm run build
npm run dist
```

To launch the built app as `root`:

```bash
npm run start:root
```

Repository update convenience script:

```bash
./update-local-main.sh
```

Optional arguments:

```bash
./update-local-main.sh origin main
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

## Core Principles

- Local data is the source of truth
- UI interactions should stay responsive
- Sync must not block the interface
- Local data must not be lost because of sync failures
- AI-assisted development is the default workflow, with manual edits allowed when appropriate
- Architectural changes should remain aligned with [`SPEC.md`](./SPEC.md) and [`DECISIONS.md`](./DECISIONS.md)

## Planned Project Structure

The structure below is planned, not implemented yet.

```text
/app
  /main
  /renderer
  /db
  /services
    /sync
    /syncFolder
  /models
  /store
  /components
  /hooks
  /utils
```

## Roadmap Snapshot

For the detailed roadmap, see [`ROADMAP.md`](./ROADMAP.md).

- Current: local workspace, multiple boards, customizable columns, column drag and drop, SQLite persistence, always-on-top, optional Windows launch-on-login with Windows-side disablement detection, synced-folder cloud sync
- Next: multi-language interface, system tray, themes, sync hardening
- Future: custom fields, notifications, richer conflict inspection and recovery, mobile companion

## Repository Documents

- [`README.pt-BR.md`](./README.pt-BR.md): Brazilian Portuguese version of this README
- [`SPEC.md`](./SPEC.md): product specification
- [`ROADMAP.md`](./ROADMAP.md): planned milestones and future priorities
- [`IMPLEMENTATION.md`](./IMPLEMENTATION.md): current repository state and delivered milestones
- [`AGENTS.md`](./AGENTS.md): operating guidance for programming agents
- [`DECISIONS.md`](./DECISIONS.md): architecture decision log

## Landing Page

- The project includes a public landing page built from [`site/`](./site)
- The landing page is intended for GitHub Pages publication
- The canonical public domain is `stickban.com`
- Forks can build the site, but automatic Pages deployment is restricted to the official repository

## Releases

- Every push to `main` is intended to generate an automatic GitHub Release
- The release version is calculated from commit conventions since the latest SemVer tag
- `feat` bumps minor, `fix` and operational commit types bump patch, and `BREAKING CHANGE` or `type!` bumps major
- Public release artifacts are currently produced for Windows only
- Windows releases are distributed as an NSIS installer
- Packaged Windows builds expose an opt-in launch-on-login setting inside the app, it remains disabled by default, and the UI now calls out when Windows has disabled the startup entry separately from the app preference
- Packaged Windows builds now check public GitHub Releases for updates in-app and can restart to install a downloaded update
- The installer and in-app updater keep automatic relaunch disabled by default after install/update
- Linux packaging remains available for local builds, but Linux artifacts are not currently published in GitHub Releases
- The public landing page is deployed separately from the desktop release pipeline

## AI-Assisted Development

Stickban was conceived from the start as a project developed with AI-assisted tooling, including tools such as Codex, Claude, Antigravity, and similar systems. The preferred maintenance model for this repository is to keep using AI-capable development tools as the primary workflow, while still allowing direct manual edits when they are the better fit for a task.

## Transparency Note

This repository may contain code, documentation, and project structure created or refined with AI assistance and human review. AI assistance does not remove the need for technical validation. The project does not provide any warranty beyond the terms already stated in [`LICENSE`](./LICENSE), and independent review remains advisable for commercial, regulated, or higher-risk use cases.

## Getting Started Today

The repository now contains a runnable local-first Electron/React/TypeScript scaffold for the first milestone.
The current repository state is tracked in [`IMPLEMENTATION.md`](./IMPLEMENTATION.md).
The current sync model works without paid services, provider APIs, OAuth, or managed cloud infrastructure. It depends on a folder already synchronized by the user's installed cloud drive client.
The repository now also includes an automated regression suite focused on sync bootstrap, deferred remote operations, recovery backups, shutdown flush behavior, and immediate workspace refresh after sync-folder selection.
The app footer displays the runtime application version exposed by Electron, which is intended to match the version injected into packaged releases by the GitHub Actions release workflow.
Packaged Windows builds now also check GitHub Releases for updates on startup and periodically during the session, and the renderer surfaces those checks more explicitly through footer status and update banners.
The sync/status panel now also exposes an opt-in Windows launch-on-login toggle, which persists locally, defaults to disabled, and now reflects when Windows Startup Apps has disabled the registered entry. Desktop startup now prioritizes getting the local window on screen before sync and update services continue in the background, Stickban keeps a single running instance by focusing the existing window when a second launch is attempted, and packaged Windows runs prune stale duplicate startup entries before reapplying the current login preference.

## License

This repository includes an MIT license in [`LICENSE`](./LICENSE).
