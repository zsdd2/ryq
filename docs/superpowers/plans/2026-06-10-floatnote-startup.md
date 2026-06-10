# 任意签 Startup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Start 任意签 from Stickban and prepare the verified local-only floating-note refactor path.

**Architecture:** Keep Stickban's Electron main process, preload bridge, React renderer, Zustand store, SQLite database layer, Tailwind styling, dnd-kit dependency, and electron-builder packaging. First convert the launch experience from a large Kanban window into a small floating launcher plus compact floating note panel, then isolate the current Kanban/sync architecture and convert data into local notes.

**Tech Stack:** Electron, React 18, TypeScript, Zustand, better-sqlite3, Tailwind CSS, dnd-kit, electron-builder, Vitest, CodeGraph.

---

### Task 1: Baseline Pull And Map

**Files:**
- Modify: `PROJECT_DEVELOPMENT.md`
- Create: `docs/superpowers/plans/2026-06-10-floatnote-startup.md`

- [x] **Step 1: Clone Stickban into the workspace**

Run:

```powershell
git clone https://github.com/ivanyort/stickban.git .
```

Expected: the workspace contains `package.json`, `src/main`, `src/preload`, `src/renderer`, `src/shared`, and Stickban documentation.

- [x] **Step 2: Initialize CodeGraph**

Run:

```powershell
codegraph init -i F:\xinxiangmu\ZMBJ
```

Expected: CodeGraph indexes the checkout without parse errors.

- [x] **Step 3: Record the project state**

Update `PROJECT_DEVELOPMENT.md` with the current goal, status table, scope boundary, version plan, first-phase targets, and next steps.

### Task 2: Dependency And Baseline Validation

**Files:**
- Read: `package.json`
- Read: `package-lock.json`
- Modify: `PROJECT_DEVELOPMENT.md`

- [x] **Step 1: Install dependencies**

Run:

```powershell
npm install
```

Expected: `node_modules` is created and `electron-builder install-app-deps` completes.

Actual: completed with project-local Node v20.20.2 and project-local `LOCALAPPDATA`.

- [x] **Step 2: Run existing tests**

Run:

```powershell
npm test
```

Expected: the existing sync-risk regression suite passes.

Actual: passed, 1 test file and 9 tests.

- [x] **Step 3: Run typecheck**

Run:

```powershell
npm run typecheck
```

Expected: TypeScript completes without errors.

Actual: passed.

- [x] **Step 4: Start the app**

Run:

```powershell
npm run dev
```

Expected: the Electron app opens the current Stickban UI.

Actual: launched in a separate visible PowerShell window with the project-local Node environment; Electron processes are running. Manual visual confirmation is still needed.

- [x] **Step 5: Update the progress document**

Update `PROJECT_DEVELOPMENT.md` with the dependency, test, typecheck, and dev-run results.

Actual: dependency, test, typecheck, and build results recorded; dev-run remains pending.

### Task 3: V0.1 Refactor Checklist

**Files:**
- Read: `src/main/index.ts`
- Read: `src/main/database.ts`
- Read: `src/main/sync.ts`
- Read: `src/preload/index.ts`
- Read: `src/renderer/src/store.ts`
- Read: `src/renderer/src/App.tsx`
- Modify: `PROJECT_DEVELOPMENT.md`

- [x] **Step 1: Trace workspace write flow**

Use CodeGraph to trace renderer/store calls into preload IPC and main-process database handlers.

Actual: traced `src/renderer/src/store.ts` -> `src/preload/index.ts` -> `src/main/index.ts` IPC handlers -> `src/main/database.ts`.

- [x] **Step 2: Identify cloud sync removal points**

List every renderer action, preload API, IPC handler, database hook, and background service that depends on `SyncManager` or sync metadata.

Actual: removal points recorded in `PROJECT_DEVELOPMENT.md`.

- [x] **Step 3: Identify local-only persistence model changes**

Map Stickban's board/column/card fields to FloatNote category/note/settings fields before editing schema code.

Actual: first-phase mapping recorded in `PROJECT_DEVELOPMENT.md`.

- [x] **Step 4: Record the V0.1 checklist**

Update `PROJECT_DEVELOPMENT.md` with the exact files and order for V0.1 edits.

Actual: V0.1 checklist and guardrails added.

### Task 4: Floating-First Goal Correction

**Files:**
- Modify: `PROJECT_DEVELOPMENT.md`
- Modify: `docs/superpowers/plans/2026-06-10-floatnote-startup.md`
- Later implementation targets: `src/main/index.ts`, `src/renderer/src/App.tsx`, `src/renderer/src/styles.css`

- [x] **Step 1: Change the product goal**

Record that 任意签 is not a large desktop application window. The default product shell is a small always-on-top floating launcher.

- [x] **Step 2: Change the opened state**

Record that clicking the floating launcher should open a compact floating note panel, not a full Kanban workspace.

- [x] **Step 3: Reorder implementation priorities**

Move the floating shell ahead of category/sidebar/workspace work. The next implementation phase should build the collapsed launcher and expanded note panel first.

- [x] **Step 4: Preserve technical reuse**

Keep Stickban as the technical base for Electron, React, TypeScript, SQLite, Zustand, Tailwind, window controls, startup behavior, and packaging, while treating the existing large Kanban UI only as a temporary migration scaffold.

### Task 5: First Floating Shell Implementation

**Files:**
- Create: `src/main/floating-window.ts`
- Create: `src/main/floating-window.spec.ts`
- Modify: `src/main/index.ts`
- Modify: `src/preload/index.ts`
- Modify: `src/shared/types.ts`
- Replace: `src/renderer/src/App.tsx`
- Modify: `src/renderer/src/styles.css`
- Modify: `PROJECT_DEVELOPMENT.md`

- [x] **Step 1: Write the failing floating-window test**

Run:

```powershell
npx vitest run src/main/floating-window.spec.ts
```

Expected: fail because `src/main/floating-window.ts` does not exist.

Actual: failed for the expected missing module.

- [x] **Step 2: Implement floating BrowserWindow options**

Create `src/main/floating-window.ts` with compact launcher and panel bounds, transparent frameless window options, always-on-top behavior, and disabled maximize/resize behavior.

- [x] **Step 3: Connect main process window sizing**

Update `src/main/index.ts` to use the floating window options and expose `window:setFloatingPanelOpen` so the renderer can resize between launcher and panel modes.

- [x] **Step 4: Replace the large Kanban renderer shell**

Replace `src/renderer/src/App.tsx` with a small launcher and compact note panel. The first pass uses existing Stickban cards as temporary note data so the UI can be verified before database migration.

- [x] **Step 5: Update floating styles**

Update `src/renderer/src/styles.css` to remove large-page minimum width and support transparent floating-window rendering.

- [x] **Step 6: Verify**

Run:

```powershell
npx vitest run src/main/floating-window.spec.ts
npm run typecheck
npm test
npm run build
```

Expected: all commands pass.

Actual: all commands passed; `npm test` reports 2 test files and 10 tests.

### Task 6: Floating State Memory

**Files:**
- Create: `src/main/floating-window-state.spec.ts`
- Modify: `src/main/database.ts`
- Modify: `src/main/index.ts`
- Modify: `src/renderer/src/App.tsx`
- Modify: `PROJECT_DEVELOPMENT.md`

- [x] **Step 1: Write the failing state persistence test**

Run:

```powershell
npm test -- src/main/floating-window-state.spec.ts
```

Expected: fail because `getFloatingWindowState` and `setFloatingWindowState` do not exist.

Actual: failed for the expected missing functions.

- [x] **Step 2: Persist floating state in SQLite**

Add `getFloatingWindowState` and `setFloatingWindowState` to `src/main/database.ts`, storing JSON in `app_state` with safe defaults:

```ts
{
  mode: 'launcher',
  x: null,
  y: null
}
```

- [x] **Step 3: Restore state in the main process**

Read floating state before creating `BrowserWindow`, apply the saved mode and position, and keep the restored mode in memory for `getWindowState`.

- [x] **Step 4: Save state from window events**

Save position on `move`, and save mode plus position from `window:setFloatingPanelOpen`.

- [x] **Step 5: Initialize renderer open state**

Use `window.stickban.getWindowState()` during renderer startup so the visible UI matches the restored Electron window mode.

- [x] **Step 6: Verify**

Run:

```powershell
npm test -- src/main/floating-window-state.spec.ts
npm test -- src/main/floating-window.spec.ts src/main/floating-window-state.spec.ts
npm run typecheck
npm test
npm run build
```

Expected: all commands pass.

Actual: all commands passed; `npm test` reports 3 test files and 12 tests.

### Task 7: Local-Only Runtime

**Files:**
- Create: `src/main/local-only-services.ts`
- Create: `src/main/local-only-services.spec.ts`
- Modify: `src/main/index.ts`
- Modify: `PROJECT_DEVELOPMENT.md`

- [x] **Step 1: Write the failing local-only status test**

Run:

```powershell
npm test -- src/main/local-only-services.spec.ts
```

Expected: fail because `src/main/local-only-services.ts` does not exist.

Actual: failed for the expected missing module.

- [x] **Step 2: Implement disabled sync/update statuses**

Create `src/main/local-only-services.ts` with disabled sync and updater status helpers.

- [x] **Step 3: Stop constructing background sync/update managers**

Update `src/main/index.ts` so the app no longer imports or creates `SyncManager` and `UpdateManager`.

- [x] **Step 4: Preserve compatibility IPC as no-op local-only endpoints**

Keep old `sync:*` and `update:*` IPC handlers temporarily, but make them return disabled status objects instead of starting cloud sync or checking GitHub updates.

- [x] **Step 5: Verify**

Run:

```powershell
npm test -- src/main/local-only-services.spec.ts
npm run typecheck
npm test
npm run build
```

Expected: all commands pass.

Actual: all commands passed; `npm test` reports 4 test files and 14 tests.

### Task 8: Simple Grouped Rich Notes

**Files:**
- Create: `src/renderer/src/note-content.ts`
- Create: `src/renderer/src/note-content.spec.ts`
- Modify: `src/renderer/src/App.tsx`
- Modify: `src/renderer/src/styles.css`
- Modify: `src/main/floating-window.ts`
- Modify: `src/main/floating-window.spec.ts`
- Modify: `src/main/index.ts`
- Delete: `src/main/update.ts`
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `PROJECT_DEVELOPMENT.md`

- [x] **Step 1: Write the failing rich note content test**

Run:

```powershell
npm test -- src/renderer/src/note-content.spec.ts
```

Expected: fail because `src/renderer/src/note-content.ts` does not exist.

Actual: failed for the expected missing module.

- [x] **Step 2: Store note HTML and pinned state**

Implement `src/renderer/src/note-content.ts` so `card.description` can store rich note HTML and pinned state while legacy cards still render as notes.

- [x] **Step 3: Add grouped note layout**

Update `src/renderer/src/App.tsx` so existing boards act as groups on the left and existing cards act as notes on the right.

- [x] **Step 4: Add pinned notes**

Store pinned state in the note description JSON and sort pinned notes before regular notes.

- [x] **Step 5: Add wrapped previews and full note dialog**

Render multi-line wrapped note previews in the panel and open a full note dialog when a card is clicked.

- [x] **Step 6: Add basic rich text controls**

Add bold, italic, underline, unordered list, and ordered list controls in the note dialog.

- [x] **Step 7: Fix collapse behavior**

Remove the visible minimize control from the renderer and change the `window:minimize` IPC fallback to collapse the panel into the floating launcher instead of hiding the app.

- [x] **Step 8: Allow panel resizing**

Allow panel mode to resize up to 720x760 while keeping launcher mode compact.

- [x] **Step 9: Remove unused updater runtime**

Uninstall `electron-updater` and delete `src/main/update.ts` after confirming `UpdateManager` has no callers.

- [x] **Step 10: Verify**

Run:

```powershell
npm test -- src/renderer/src/note-content.spec.ts src/main/floating-window.spec.ts
npm test
npm run build
```

Expected: all commands pass.

Actual: all commands passed; `npm test` reports 5 test files and 18 tests.

### Task 9: Rename And Visual Polish

**Files:**
- Copy: `logos/renyiqian-logo.png`
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `electron-builder.yml`
- Modify: `src/main/floating-window.ts`
- Modify: `src/main/floating-window.spec.ts`
- Modify: `src/main/index.ts`
- Modify: `src/main/database.ts`
- Modify: `src/renderer/index.html`
- Modify: `src/renderer/src/App.tsx`
- Modify: `src/renderer/src/styles.css`
- Modify: `PROJECT_DEVELOPMENT.md`

- [x] **Step 1: Copy the supplied logo**

Copy the user-provided logo into `logos/renyiqian-logo.png`.

- [x] **Step 2: Rename visible product identity**

Change visible product identity to `任意签` in package metadata, Electron builder metadata, window title, document title, and renderer UI copy.

- [x] **Step 3: Remove collapsed launcher white background**

Make the root HTML and body backgrounds transparent so transparent Electron launcher mode does not show a white square behind the capsule.

- [x] **Step 4: Apply blue/purple soft floating visual direction**

Restyle the launcher, shell, group sidebar, note cards, dialog, and buttons toward the provided blue/purple soft floating reference.

- [x] **Step 5: Update local defaults**

Change the default local database filename to `renyiqian.db` and the default seed group title to `默认分组`.
