# IMPLEMENTATION

## Purpose

This document tracks the real implementation state of the repository and the high-level milestones already delivered. It should reflect what exists, not what is merely planned.

## Current Repository State

- The repository is still in bootstrap stage.
- A runnable Electron application scaffold now exists.
- The repository currently contains product and process documentation, license metadata, and logo assets.
- Public project documentation exists in [`README.md`](./README.md) and [`README.pt-BR.md`](./README.pt-BR.md).
- Product specification exists in [`SPEC.md`](./SPEC.md).
- Architecture and workflow guidance exists in [`DECISIONS.md`](./DECISIONS.md) and [`AGENTS.md`](./AGENTS.md).
- A root-level convenience script now exists for fast-forwarding the local `main` branch from the remote repository when the working tree is clean.
- The current implementation milestone is local-first and now includes synced-folder cloud sync without Google APIs, OAuth, or managed external infrastructure.

## Implemented Milestones

- Initial repository documentation baseline created
- Agent workflow guidance documented
- Git and line ending conventions documented
- AI-assisted development policy documented
- Public README split into English and Brazilian Portuguese versions
- Initial Electron/React/TypeScript scaffold delivered
- Local SQLite persistence layer delivered
- Local drag-and-drop workspace delivered
- Renderer UI aligned to the `references/frontend_v001` visual direction, including card action menu support
- Renderer now uses local Geist font assets and native column-based drag-and-drop to better match `references/frontend_v001`
- Electron window now uses custom top-bar controls for close, minimize, and maximize/restore
- Desktop window chrome now uses platform-specific native behavior: Windows uses `titleBarStyle: hidden` with `titleBarOverlay` for native window controls without the traditional title bar, while Linux keeps a frameless window with custom controls in the renderer
- Packaged Windows builds now expose a persisted launch-on-login preference in the renderer, disabled by default, applied through Electron login item settings, and report when Windows has the startup entry configured but disabled at the OS level
- Desktop startup now prioritizes local window creation before sync and update background services initialize, improving perceived launch responsiveness during Windows login
- The main Electron process now enforces a single-instance lock and focuses the existing window instead of allowing duplicate app instances during startup or manual relaunch
- Packaged Windows startup now also prunes duplicate Stickban login-item registry entries before reapplying the current launch-on-login preference, preventing stale Startup Apps duplicates from accumulating across updates
- Board title edits in the header now persist through SQLite instead of living only in renderer state
- Multiple boards now exist as first-class persisted entities, with active board selection restored across app restarts
- Columns are now board-specific and customizable, including create, rename, and delete flows in the renderer
- Columns now support inline rename on click, drag-and-drop reordering inside the active board, and moving an entire column to another board through board-tab drop targets
- Card dragging now uses pointer-driven interaction instead of native HTML drag, with a custom ghost preview and more tolerant reordering inside and across columns in the active board
- The renderer footer now shows the runtime app version reported by Electron so packaged builds can display the same version number used by automated releases
- Synced-folder cloud sync now exists through immutable operation files, periodic checkpoints, local outbox handling, and a settings/status panel in the renderer
- First-time synced-folder bootstrap now exports an initial checkpoint into an empty remote folder and blocks silent linking when a populated remote folder conflicts with unsynchronized local data
- Sync bootstrap now refuses to export local seed state into a populated remote folder before a valid remote import succeeds, and invalid checkpoints/orphan remote operations are rejected instead of contaminating the workspace
- Out-of-order remote operations with missing dependencies are now retried in later sync passes instead of being marked as permanently consumed
- Adopting a remote workspace now creates a local recovery backup first, and app shutdown now flushes the local sync outbox into the configured synced folder before quitting
- An automated regression suite now covers sync bootstrap, deferred remote operations, destructive remote adoption safeguards, shutdown outbox flush behavior, and immediate workspace refresh after sync-folder selection
- GitHub release/version automation configured for `main`
- Windows release packaging simplified to NSIS installer only
- Packaged Windows builds now use in-app update checks backed by GitHub Releases and `electron-updater`, including background download and restart-to-install flow
- The renderer now surfaces automatic update checks more explicitly through footer status text and a visible banner when an update is available, ready to install, or has failed
- Windows installer and in-app updater now keep automatic app relaunch disabled by default after install/update
- Public GitHub Releases currently publish Windows artifacts only
- Public landing page scaffold delivered under `site/`
- GitHub Pages deployment workflow configured with repository-level fork protection
- Windows packaging now points to the curated icon kit under `logos/ico_kit`, using a generated `256x256+` `.ico` asset derived from the kit's square icon as the installer/app icon source
- The 任意签 fork currently builds a compact floating-note experience with a logo-only collapsed launcher, grouped local notes, rich note editing, global search, table-template notes, a Windows startup toggle, and packaged GitHub Releases update checks through `electron-updater`
- The Windows packaged app now pins its canonical local data directory to `%APPDATA%/renyiqian` and migrates legacy `%APPDATA%/任意签` or `%APPDATA%/Stickban` databases only when the canonical database has no user notes
- Collapsing the note panel back to launcher mode now explicitly restores, shows, raises, and centers the 88x88 logo launcher instead of letting the window stay hidden or shrink from an unsafe position

## Current Implementation Focus

- The current codebase implements the first local-first cloud-sync milestone
- The current milestone includes multiple boards, custom columns, and synced-folder replication inside the local-first workspace
- The next major step is deeper manual validation across multiple devices and a richer recovery UX on top of the hardened sync core
- The repository now includes a dedicated `npm test` workflow for sync-risk regression coverage
- Automatic updates are currently intended only for packaged Windows builds; development builds and non-Windows packages stay outside this flow
- The current 任意签 Windows artifact is generated as `dist/renyiqian-setup-1.2.2.exe`; `latest.yml` points to the same filename for updater compatibility
- The current scaffold should be usable without subscriptions, paid services, provider APIs, or managed cloud dependencies

## Not Implemented Yet

- Release workflow validation on GitHub Actions
- DNS validation for `stickban.com`

## Notes

- This file records actual repository state and completed milestones.
- Future goals and planning belong in [`ROADMAP.md`](./ROADMAP.md).
- Architectural decisions belong in [`DECISIONS.md`](./DECISIONS.md).
- Remote sync is now part of the runnable milestone through a synced-folder operation log and periodic checkpoints.
