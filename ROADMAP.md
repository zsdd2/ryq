# ROADMAP

## Purpose

This document tracks planned product direction and upcoming milestones for the current Renyiqian fork. It is the place for future work and current priorities, not for implementation history.

## Status Model

- `planned`: intended but not started
- `in progress`: currently being worked on
- `blocked`: waiting on a dependency or decision
- `done`: completed milestone, kept temporarily until reflected elsewhere

## MVP

Status: `done`

Goals and milestones:

- Local workspace experience for the desktop
- Multiple boards with board-specific columns
- Drag and drop movement for cards
- Local SQLite persistence
- Always-on-top support
- Initial Electron + React + TypeScript application scaffold

Implementation constraints for this phase:

- No provider API dependency
- No OAuth
- No external infrastructure or paid services

## Audit-Driven Repair Phase

Status: `in progress`

Goals and milestones:

1. Fix reminder correctness before adding new reminder features.
   - Current risk: reminder scanning is renderer-driven and only checks the active group.
   - Target: all active local notes are eligible for due-reminder checks, even when their group is not selected.
   - Acceptance: regression coverage proves due timers in inactive groups fire or are surfaced without requiring manual group switching.

2. Sanitize stored rich-note HTML before rendering.
   - Current risk: stored note HTML is rendered through `dangerouslySetInnerHTML`.
   - Target: allow only the formatting/table tags required by the editor and templates; strip scripts, event handlers, unsafe URLs, and unknown attributes.
   - Acceptance: tests cover pasted/migrated malicious HTML and verify safe rich text still renders.

3. Reconcile product reality across docs, site, IPC, and source structure.
   - Current risk: public docs and old store/sync code still describe Stickban synced-folder cloud sync while the current app exposes local-only sync compatibility endpoints.
   - Target: document Renyiqian as a local floating desktop note app, mark legacy sync/store code as removed or explicitly dormant, and keep the public site consistent with the shipped product.
   - Acceptance: `README.md`, `README.pt-BR.md`, `SPEC.md`, `IMPLEMENTATION.md`, `DECISIONS.md`, and `site/` no longer conflict with the runtime behavior.

4. Retire or isolate unused legacy renderer and sync paths.
   - Current risk: `src/renderer/src/store.ts` is not imported by the active renderer, and `src/main/sync.ts` is no longer constructed by the main process.
   - Target: remove dead paths only after replacement tests cover current local notes, reminders, update controls, and window behavior.
   - Acceptance: no unused legacy sync/store entry points remain in active bundles, and tests still pass.

5. Stabilize the automated test runner and runtime verification path.
   - Current risk: `npm test` passes but Vitest reports a delayed shutdown warning; most layout tests inspect source strings rather than a live Electron UI.
   - Target: identify the handle that keeps Vitest alive, add a repeatable live UI smoke path, and keep source-level layout tests only as narrow regression guards.
   - Acceptance: test process exits cleanly and the release checklist includes a real app launch or screenshot-based UI smoke check.

6. Plan dependency upgrades as a dedicated safety batch.
   - Current risk: production audit reports `electron-updater -> js-yaml` moderate issues, while the full dev/build audit reports Electron, Vite/Vitest, esbuild, and builder-chain advisories.
   - Target: upgrade Electron/build tooling in one controlled branch with native-module rebuild, package generation, updater metadata, and installer smoke testing.
   - Acceptance: `npm audit --omit=dev`, `npm audit`, `npm run typecheck`, `npm test`, `npm run build`, and Windows packaging are rechecked after the upgrade.

## Product Polish Phase

Status: `planned`

Goals and milestones:

- Multi-language interface support after Chinese-first local note flows are stable
- System tray integration
- Theme support
- Export/import and local backup recovery UX

## Future

Status: `planned`

Goals and milestones:

- Custom fields
- Reminder snooze and notification actions
- Richer local recovery UX
- Optional sync or mobile companion only after an explicit product-scope decision

## Near-Term Renyiqian Utility Improvements

Status: `planned`

Recommended by implementation speed and daily usefulness, after the audit-driven repair phase:

1. Global shortcut to open the floating panel and focus quick note entry.
2. One-click copy for a full note or account field values.
3. Duplicate a note as a starting point for similar records.
4. Undo delete and a small local recycle bin for accidental removals.
5. Reminder snooze actions for 5, 10, and 30 minutes.
6. Paste clipboard rows into table/account templates for batch entry.

These remain local-only features and do not introduce accounts, cloud services, or external infrastructure.

## Notes

- This file tracks future direction and active priorities.
- Detailed architectural choices belong in [`DECISIONS.md`](./DECISIONS.md).
- Current repository reality and completed milestones belong in [`IMPLEMENTATION.md`](./IMPLEMENTATION.md).
- Current near-term planning is local-only unless a future decision explicitly reopens sync or multi-device scope.
