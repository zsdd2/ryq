# 任意签 Project Development

## Current Modification Goal

Prepare 任意签 1.4.3 with quick countdown presets, card-level quota editing, and quick countdown refresh actions.

## Current Status

| Item | Status | Notes |
| --- | --- | --- |
| Workspace | Done | `F:\xinxiangmu\ZMBJ` now contains the cloned Stickban repository. |
| Upstream base | Done | Source: `https://github.com/ivanyort/stickban.git`; license is MIT. |
| CodeGraph | Done | Initialized for this checkout: 96 files, 1,115 nodes, 2,592 edges. |
| Stack check | Done | Confirmed Electron, React, TypeScript, SQLite via `better-sqlite3`, Zustand, Tailwind, dnd-kit, and electron-builder in `package.json`. |
| Architecture map | Done | Main process: `src/main/index.ts`; database: `src/main/database.ts`; sync: `src/main/sync.ts`; preload API: `src/preload/index.ts`; renderer store: `src/renderer/src/store.ts`; main UI: `src/renderer/src/App.tsx`. |
| Dependency install | Done | Installed with project-local Node v20.20.2 because global Node v24.13.0 forces unsupported native rebuilds for `better-sqlite3@9.6.0`. |
| Test baseline | Done | `npm test` passed: 1 test file, 9 tests. Vitest reported a delayed shutdown warning after success. |
| Typecheck baseline | Done | `npm run typecheck` passed. |
| Build baseline | Done | `npm run build` passed and generated Electron/Vite output under `out/`. |
| Local run | Restarted | `npm run dev` was restarted in a separate visible PowerShell window after the grouped rich-note changes. Electron processes are running; visual UI confirmation is pending. |
| Floating shell | Implemented | Main BrowserWindow now uses a compact frameless transparent always-on-top FloatNote window; renderer starts as a small launcher and expands to a compact note panel. |
| Floating state memory | Implemented | Floating launcher/panel mode and window position are saved in SQLite `app_state` and restored on next launch. |
| Local-only runtime | Implemented | Main process no longer constructs `SyncManager` or `UpdateManager`; legacy sync/update IPC calls now return disabled local-only statuses. |
| Simple note UX | Implemented | Floating panel now has left-side groups, right-side notes, pinned notes, wrapped note previews, and a full rich-text note dialog. |
| Updater cleanup | Done | Removed unused `UpdateManager` source and `electron-updater` dependency from the local-only runtime. |
| Brand and visual direction | Implemented | User-facing name changed to 任意签, provided logo copied into `logos/renyiqian-logo.png`, Windows package icon generated at `logos/renyiqian-logo.ico`, launcher white background fixed, and panel restyled toward the blue/purple soft floating design reference. |
| Launcher polish | Implemented | Panel slogan changed to the new positioning line, collapsed launcher redesigned with a larger protruding logo, and the logo area is now draggable while the lower card opens the panel. |
| Input stability | Implemented | Rich-text editor no longer rewrites `dangerouslySetInnerHTML` on every input; it reads current DOM content through a ref and saves on command. |
| Note templates | Implemented | Added a template panel with reusable field labels, repeated fill-in rows, and one-click generation of rich note cards from a filled row. |
| Launcher gesture drag | Implemented | Collapsed launcher now uses a renderer long-press gesture plus main-process move IPC: short click anywhere opens, long press and drag anywhere on the visible launcher moves it. |
| Template table | Implemented | Template panel is now a table with editable header fields, editable data cells, add-row and add-column controls, and row-to-note generation. |
| Global search | Implemented | Main process exposes a local SQLite search API across all groups; renderer search results show matching notes and jump to the note's group before opening. |
| Single-note table template | Implemented | Template panel stores one reusable list of table row labels and generates one editable table note from it. |
| Version 1.0.0 packaging | Done | Package metadata is 1.0.0, tests/build passed, NSIS installer was generated at `dist/任意签-1.0.0-win-x64.exe`, and `dist/win-unpacked/任意签.exe` launched successfully. |
| Logo-only launcher | Implemented | Collapsed launcher is now a 96x96 transparent window containing only the provided logo; the previous card, side buttons, and 任意签 text were removed. |
| Startup toggle | Implemented | Renderer title bar now exposes a compact 开机启动 button backed by the existing Windows login-item IPC path. |
| Remote update | Implemented locally | `electron-updater` is restored, packaged builds check GitHub Releases at startup, every 4 hours, and through a visible 检查更新 button. |
| GitHub push | Done | `main` was pushed to `https://github.com/zsdd2/ryq`; `v1.0.0` tag was pushed as the first 任意签 release baseline. |
| Stable local storage | Implemented | Windows packaged builds now pin `userData` to `%APPDATA%/renyiqian` and migrate legacy `%APPDATA%/任意签` / `%APPDATA%/Stickban` databases only when the canonical database is still pristine. |
| Collapse visibility | Implemented | Panel-to-launcher collapse now restores/shows/raises the BrowserWindow and recenters the 88x88 launcher around the previous panel center. |
| Card preview clamp | Implemented | Note cards now clamp rich previews to two visible lines; full content remains available in the detail dialog. |
| Group management | Implemented | Sidebar groups now expose rename and delete actions using the existing board update/delete IPC. |
| Countdown cards | Implemented | Each note card shows compact countdown rows on the right, with four-character names and one-unit remaining/overdue time. |
| Template choices | Implemented | Template panel now supports multiple reusable templates and includes an account membership management template alongside the custom table template. |
| Account template quantity | Implemented | Account membership template can generate multiple account sections in one note and accepts additional custom rows. |
| Timer quota and editing | Implemented | Note timers now store a remaining-quota field and can be edited from the existing timer list. |
| Smaller floating launcher | Implemented | Collapsed launcher bounds and rendered logo were reduced from 88x88 to 59x59, including the shaped click region. |
| Card drag ordering | Implemented | Note cards can be dragged to change display order inside the active group while pinned notes remain separated above regular notes. |
| Group selection delete | Implemented | Sidebar now has a 便签分组 header, per-group selection checkboxes, top-right selected-group delete, confirm-before-delete, and click-title rename. |
| Template panel layering | Implemented | Template generation panel now stays above existing note cards with a sticky action footer so generation controls remain clickable. |
| Timer save behavior | Implemented | Editing a timer and clicking the note detail 保存 button now persists the pending timer edits. |
| Patch release metadata | Done | Package metadata is 1.4.1, NSIS run-after-finish is enabled, and the Windows installer plus updater metadata were verified. |
| Group title switching | Implemented | Single-clicking a group title switches the active group; double-clicking keeps direct rename available. |
| Account membership table | Implemented | Account membership templates now generate a horizontal editable table with one account per row and fields as columns. |
| Percentage quota input | Implemented | New and edited timer quotas use a numeric input with a fixed `%` suffix while legacy non-percent quota text remains readable. |
| Quick countdown presets | Implemented | Timer editor now exposes 30天, 7天, and 5小时 presets that set due time relative to now and store quick preset metadata. |
| Card quota editing | Implemented | Timer quota can be edited directly on the note card and saves on blur or Enter. |
| Quick countdown refresh | Implemented | Quick timer rows on note cards expose a refresh action that resets the due time from the current time. |

## Scope Boundary

This project is a single-machine personal desktop note app.

- In scope: local SQLite data, a small floating launcher, compact floating note panel, always-on-top behavior, quick note creation, note cards, categories as a light filter, rich text, checklists, option notes, percent progress, countdown reminders, tray behavior, local export/import, Windows packaging.
- Out of scope for the first product line: accounts, cloud sync, multi-device sync, provider APIs, OAuth, AI features, voice features, collaborative editing, and mobile companion apps.
- Current rule: removing or changing sync/update/startup behavior must be done after mapping its coupling through CodeGraph and tests.

## Product Shape

任意签 should feel like a desktop accessory, not a full application.

| State | Intended Behavior | Window Shape |
| --- | --- | --- |
| Collapsed | A small draggable floating dot/capsule stays on top of the desktop. | Very small frameless transparent window. |
| Open | Clicking the launcher expands or opens a compact note panel near the launcher. | Small always-on-top frameless panel, roughly widget-sized rather than app-sized. |
| Editing | The panel lets the user add, edit, check, and reorder visible notes without navigating away. | Same compact panel; use inline editing or a lightweight drawer inside the panel. |
| Settings | Less frequent controls such as opacity, startup, export/import, and backup are available but not prominent. | Secondary popover or separate small settings panel. |

Primary rule: the user should never feel they launched a large Kanban app. The default launch should show the floating entry, and the note panel should appear only when requested.

## Version Plan

| Version | Goal | Status |
| --- | --- | --- |
| V0.1 | Run and verify Stickban base, rename project direction, document scope, identify sync removal points. | In progress |
| V0.2 | Replace the large main window with a small floating launcher and compact floating note panel. | In progress |
| V0.3 | Convert Kanban board data into local notes and light categories shown inside the floating panel. | In progress |
| V0.4 | Add practical inline editing and auto-save for plain text and checklist notes. | In progress |
| V0.5 | Add rich text and richer note types: options, percent, countdown. | In progress |
| V0.6 | Add tray, window memory, opacity, startup option, and reminder scheduler. | Planned |
| V0.7 | Polish search, colors, dark mode, export/import, SQLite backup, installer, and recovery UX. | Planned |

## First-Phase Refactor Targets

| Area | Current Stickban Concept | 任意签 Target |
| --- | --- | --- |
| Data model | Boards, columns, cards, sync metadata | Categories, notes, note content JSON, app settings, reminder state |
| Main process IPC | Board/column/card handlers plus sync/update/window handlers | Category/note/settings/reminder/window handlers; sync handlers removed or disabled |
| Renderer state | `useBoardStore` | Note workspace store with categories, active category, notes, editor state, settings |
| UI | Board tabs, Kanban columns, card menu | Left category sidebar, note grid/list, note editor, floating launcher, settings panel |
| Persistence | SQLite with operation-log sync coupling | SQLite-only local persistence with migrations and backup/export helpers |
| Background services | Sync manager and update manager | Reminder scheduler, tray service, optional updater later |

Updated UI target:

| Area | Current Stickban Concept | 任意签 Target |
| --- | --- | --- |
| Default window | 1360x860 main application window | Small always-on-top floating launcher. |
| Opened view | Full Kanban board | Compact floating note panel with visible notes. |
| Navigation | Board tabs and columns | Minimal category/filter strip, not a full sidebar-first app. |
| Editing | Card editor inside large board UI | Inline note editing inside the compact panel. |
| Layout density | Kanban workspace | Desktop widget density; fast glance and fast capture. |

## V0.1 Refactor Checklist

| Order | Target | Files | Action |
| --- | --- | --- | --- |
| 1 | Product identity | `package.json`, `electron-builder.yml`, `src/main/index.ts`, UI copy/assets | Rename from Stickban to FloatNote after the baseline app has been opened once. |
| 2 | Floating-first shell | `src/main/index.ts`, `src/main/floating-window.ts`, `src/renderer/src/App.tsx`, `src/renderer/src/styles.css`, `src/preload/index.ts`, `src/shared/types.ts`, `src/main/database.ts` | Implemented: small launcher window, resizable compact panel, renderer panel toggle, window position/mode memory, and collapse instead of minimize. |
| 3 | Background internet/sync services | `src/main/index.ts`, `src/main/local-only-services.ts`, `src/main/local-only-services.spec.ts` | Implemented local-only runtime: `SyncManager` and `UpdateManager` are no longer created by the app, while old IPC calls return disabled statuses. |
| 4 | Preload API boundary | `src/preload/index.ts`, `src/shared/types.ts` | Remove sync/update methods from the renderer-facing API or replace them with local-only settings/reminder APIs. |
| 5 | Renderer store | `src/renderer/src/store.ts` | Remove sync/update state and actions from initialization, then introduce a note-workspace store. |
| 6 | Main UI | `src/renderer/src/App.tsx`, `src/renderer/src/note-content.ts`, `src/renderer/src/note-content.spec.ts` | Implemented: groups on the left, notes on the right, pinned ordering, wrapped previews, click-to-open full note dialog, and basic rich text controls. |
| 7 | SQLite coupling | `src/main/database.ts` | First isolate local CRUD from sync operation emission; then migrate board/column/card into category/note/settings. |
| 8 | Tests | `src/main/sync-risk.spec.ts`, new local persistence/window tests | Keep upstream sync tests only as temporary safety references; add tests for local persistence and floating-window state before deleting sync code. |
| 9 | CodeGraph refresh | `.codegraph/` local index | Run `codegraph sync` after each implementation step and re-query changed flows before the next step. |

## V0.1 Implementation Guardrails

- Do not delete `src/main/sync.ts` first. The safer first step is to stop constructing and exposing it, then remove dead code after tests are replaced.
- Do not rewrite the full SQLite schema in one pass. First prove local board/column/card behavior still works, then introduce category/note tables with a migration path.
- Treat `electron-updater` as out of scope for the local-only MVP unless later explicitly needed for self-update packaging.
- Keep Windows launch-on-startup and always-on-top behavior, because they directly support the floating desktop tool experience.
- Keep the current dnd-kit dependency; the renderer already uses drag behavior that can be adapted to category/note sorting.
- Do not preserve the large Kanban window as the main product shell. It can remain temporarily only as a migration scaffold while the floating shell is built.
- Optimize for one-click capture and glanceable notes before adding complex rich text.

## Future Modification Plan

1. Visually confirm the current Electron UI launched by `npm run dev`.
2. Restart the dev Electron process and visually confirm the new launcher/panel behavior.
3. Rename remaining product metadata after the floating shell is visually verified.
4. Visually verify the restarted dev app: first launch should be a small floating capsule, click should open the compact panel, and restart should remember the last mode/position.
5. Visually verify the renamed and restyled app: 任意签 branding, provided logo, transparent collapsed launcher without a white background frame, groups on the left, notes on the right, pinned notes first, wrapped previews, full rich-text dialog, panel resizing, and collapse-to-floating behavior.
6. Remove unused renderer store sync/update code or replace the store with a FloatNote-specific note store after the old sync-risk store test is retired.
7. Add local-only persistence tests before replacing the current sync-risk test suite.
8. Convert the compatibility data model into explicit `categories` and `notes` tables when the UI behavior is accepted.
9. Remove sync code and old renderer store after the note/category data model fully replaces board/card compatibility.
10. Refresh CodeGraph after each code modification and keep this document current.

## Latest Verification

- Added `src/main/floating-window.spec.ts` before production code and verified it failed because `src/main/floating-window.ts` did not exist.
- Implemented `src/main/floating-window.ts` and connected it to `src/main/index.ts`.
- Replaced the large Kanban renderer with a compact floating note shell in `src/renderer/src/App.tsx`.
- Updated `src/renderer/src/styles.css` so the app can render as a transparent floating launcher/panel instead of a fixed large page.
- Verification passed:
  - `npx vitest run src/main/floating-window.spec.ts`
  - `npm run typecheck`
  - `npm test` passed: 2 test files, 10 tests
  - `npm run build`
- Restarted the dev Electron process so the new main-process floating window configuration is active for visual inspection.

## Latest Verification - Local-Only Runtime

- Added `src/main/local-only-services.spec.ts` before production code.
- Verified the test failed because `src/main/local-only-services.ts` did not exist.
- Implemented `src/main/local-only-services.ts` to return disabled sync/update states.
- Updated `src/main/index.ts` so the app no longer imports or constructs `SyncManager` and `UpdateManager`.
- Kept old sync/update IPC handlers as safe no-op compatibility endpoints while renderer/store cleanup continues.
- Verification passed:
  - `npm test -- src/main/local-only-services.spec.ts`
  - `npm run typecheck`
  - `npm test` passed: 4 test files, 14 tests
  - `npm run build`

## Latest Verification - Floating State Memory

- Added `src/main/floating-window-state.spec.ts` before production code.
- Verified the test failed through the correct Electron test runner because `getFloatingWindowState` and `setFloatingWindowState` were missing.
- Implemented floating mode/position persistence in `src/main/database.ts`.
- Connected `src/main/index.ts` to restore mode/position at startup, save position on move, and save mode when toggling panel state.
- Updated `src/renderer/src/App.tsx` to initialize its open/closed UI from `window.stickban.getWindowState()`.
- Verification passed:
  - `npm test -- src/main/floating-window-state.spec.ts`
  - `npm test -- src/main/floating-window.spec.ts src/main/floating-window-state.spec.ts`
  - `npm run typecheck`
  - `npm test` passed: 3 test files, 12 tests
  - `npm run build`

## Latest Verification - Simple Note UX

- Added `src/renderer/src/note-content.spec.ts` before production code.
- Verified the test failed because `src/renderer/src/note-content.ts` did not exist.
- Implemented `src/renderer/src/note-content.ts` so existing cards can be read as notes and new notes can store rich HTML plus pinned state in `card.description`.
- Replaced the floating panel UI with:
  - left-side groups using existing boards
  - right-side notes using existing cards
  - pinned notes shown before regular notes
  - wrapped note previews
  - click-to-open full note dialog
  - basic rich text controls for bold, italic, underline, bullet list, and numbered list
  - collapse behavior instead of minimize/disappear behavior
- Updated floating window options so panel mode can be resized up to 720x760 while launcher mode stays compact.
- Removed unused updater runtime code and `electron-updater`.
- Verification passed:
  - `npm test -- src/renderer/src/note-content.spec.ts src/main/floating-window.spec.ts`
  - `npm test` passed: 5 test files, 18 tests
  - `npm run build`
- Restarted the dev Electron process so the grouped rich-note UI is active for visual inspection.

## Latest Verification - Branding And Visual Polish

- Changed user-facing product name from FloatNote/Stickban to 任意签 in package metadata, Electron builder metadata, renderer title, window title, and visible UI copy.
- Copied the provided logo image to `logos/renyiqian-logo.png`, generated `logos/renyiqian-logo.ico`, and used the new asset in the launcher, title bar, and Windows package metadata.
- Removed the HTML/root background that caused the collapsed transparent floating window to show a white square behind the launcher.
- Restyled the floating panel toward the provided blue/purple soft floating design: rounded translucent shell, blue/purple action accents, softer group navigation, and elevated note cards.
- Updated the default local database filename to `renyiqian.db` and the seed group title to `默认分组`.

## Latest Verification - Launcher Polish

- Changed the panel slogan to "随手打开、随手记录、随时看见的桌面便签中心".
- Increased the collapsed launcher window bounds so the enlarged logo can sit above the card without clipping.
- Redesigned the collapsed launcher as a small soft card with the logo breaking above the top edge and the 任意签 label under the logo.
- Kept the upper logo/widget area draggable and the lower card clickable for opening the panel, fixing the prior no-drag visible capsule.

## Latest Verification - Input Stability And Templates

- Changed the collapsed launcher so the transparent shell and widget wrapper do not receive pointer events; only the visible logo drag target and side buttons receive pointer events.
- Moved launcher controls to the left and right sides and lowered the 任意签 label so it is not covered by the logo.
- Fixed the rich-text caret jump root cause by removing per-keystroke React state updates from the contentEditable editor.
- Added template helpers and tests for normalized fields, repeated blank rows, and HTML generation from filled template rows.
- Added the renderer template panel: field labels are saved locally, "新增一行" repeats the same fill-in shape, and "生成" creates a note from that row.
- Verification passed:
  - `npm test` passed: 6 test files, 21 tests.
  - `npm run build` passed.

## Latest Verification - Launcher Gesture And Template Table

- Replaced native `-webkit-app-region: drag` launcher behavior with a long-press renderer gesture. Root cause: Electron native drag regions cannot reliably support the requested "single click opens, long press drags" interaction because the native drag region consumes normal click behavior.
- Added `window.moveFloatingWindowBy` IPC through shared types, preload, and main process. The main process moves the BrowserWindow by pointer deltas and persists the updated floating position.
- Converted the template panel into a table: header row edits fields, body rows edit values, "新增一行" appends another data row, and "新增一列" appends another field/value column.
- Added tests for moved window position computation and template add/remove column alignment.
- Verification passed:
  - `npm test` passed: 6 test files, 24 tests.
  - `npm run build` passed.

## Latest Verification - Global Search And Single Template

- Added global search across all local groups and notes through `searchNotes`.
- Changed templates from batch/table rows into one reusable note body containing fill blanks such as `____`.
- Bumped package version to `1.0.0` for local Windows test packaging.

## Latest Verification - Table Template Note

- Changed template behavior to generate one editable table note rather than text placeholders.
- Template configuration is one row label per line; generated note has a two-column table: `项目` and `内容`.
- The generated table is saved as rich HTML and can be filled later in the existing note editor.
- `npm test` passed: 7 test files, 26 tests.
- `npm run build` passed.
- `npm run dist:win` passed again after this change; updated installer is `dist/任意签-1.0.0-win-x64.exe`.

## Latest Verification - 1.0.0 Windows Package

- `npm test` passed: 7 test files, 25 tests.
- `npm run build` passed.
- `npm run dist:win` passed and generated:
  - `dist/任意签-1.0.0-win-x64.exe`
  - `dist/任意签-1.0.0-win-x64.exe.blockmap`
  - `dist/win-unpacked/任意签.exe`
- Smoke test launched `dist/win-unpacked/任意签.exe`; Windows process list confirmed the packaged app is running.

## Latest Verification - Logo Launcher, Startup, And Remote Update

- Removed the collapsed launcher card, side icons, hint text, and visible 任意签 label; launcher mode now shows only the provided logo in a 96x96 transparent window.
- Added renderer controls for 开机启动 and 检查更新 in the compact panel title bar.
- Restored `electron-updater` and `src/main/update.ts`.
- Wired update IPC back to a real update manager instead of local-only disabled statuses.
- Added startup/manual/4-hour update checks for packaged builds.
- Changed Windows artifact output to `renyiqian-setup-1.0.0.exe` so `latest.yml` points to the generated installer exactly.
- Verification passed:
  - `npm run typecheck`
  - `npm test` passed: 7 test files, 26 tests.
  - `npm run build`
  - `npm run dist:win`
- New package output:
  - `dist/renyiqian-setup-1.0.0.exe`
  - `dist/renyiqian-setup-1.0.0.exe.blockmap`
  - `dist/latest.yml`
- GitHub target repository was confirmed as `https://github.com/zsdd2/ryq`.
- Next release push should go to the `zsdd2/ryq` `main` branch. The existing GitHub Actions release workflow will create a GitHub Release and upload the Windows installer, blockmap, and `latest.yml`.

## Latest Verification - GitHub Remote Update Target

- Changed `electron-builder.yml` publish target from the temporary `ivanyort/renyiqian` value to `zsdd2/ryq`.
- Updated the GitHub Release workflow title and notes from Stickban to 任意签.
- Push target: `https://github.com/zsdd2/ryq`.
- Pushed `main` to GitHub after merging the remote initial README commit without overwriting the local project README.
- Pushed tag `v1.0.0` at the current release baseline so future automated releases can increment from 1.0.0.

## Latest Verification - Local 1.0.1 Package

- Bumped local package metadata from `1.0.0` to `1.0.1`.
- `npm test` passed: 7 test files, 26 tests.
- `npm run dist:win` passed and generated:
  - `dist/renyiqian-setup-1.0.1.exe`
  - `dist/renyiqian-setup-1.0.1.exe.blockmap`
  - `dist/latest.yml`
- Verified `dist/latest.yml` points to `renyiqian-setup-1.0.1.exe`.
- Verified packaged updater config points to `zsdd2/ryq`.

## Latest Verification - Update Install Flow Fix

- Investigated the reported updater issue where the app found online version `1.1.2` but clicking `安装更新` did not complete installation.
- Root cause: the renderer reused the same click handler for `检查更新` and `安装更新`; when the status was already `downloaded`, clicking the button started another update check instead of calling `quitAndInstallUpdate`.
- Secondary cause of seeing `1.1.2`: GitHub Actions produced `v1.1.0`, `v1.1.1`, and `v1.1.2` before the version baseline stabilized, so `1.1.2` is the real online latest release, not a wrong repository.
- Fixed the renderer update action so `downloaded` status directly triggers install.
- Hardened the main update manager so a downloaded update is not overwritten by another check/download request.
- Bumped the local package metadata to `1.1.3`, which is higher than the current online latest `1.1.2`.
- `npm test` passed: 7 test files, 26 tests.
- `npm run dist:win` passed and generated:
  - `dist/renyiqian-setup-1.1.3.exe`
  - `dist/renyiqian-setup-1.1.3.exe.blockmap`
  - `dist/latest.yml`
- Verified `dist/latest.yml` points to `renyiqian-setup-1.1.3.exe`.

## Latest Verification - Launcher Click Region, Timers, And Template Columns

- Reduced launcher mode window bounds from `96x96` to `88x88`.
- Added native Electron window shape clipping in launcher mode so only the logo-sized area receives desktop clicks; panel mode resets to the full panel shape.
- Added per-note timers stored inside the note JSON description.
- A note can now have multiple timers, each with its own name, target time, and fired/scheduled status.
- Renderer scans scheduled timers while the app is open and shows a reminder dialog when a timer reaches its target time.
- Template builder now supports both row labels and column labels; `新增项目` adds rows and `新增列` adds columns before generating one editable table note.
- Added regression coverage for multi-column template HTML and stored note timers.
- Verification passed:
  - `npm run typecheck`
  - `npm test` passed: 7 test files, 28 tests.
  - `npm run dist:win`
- Updated package output:
  - `dist/renyiqian-setup-1.1.3.exe`
  - `dist/renyiqian-setup-1.1.3.exe.blockmap`
  - `dist/latest.yml`

## Latest Verification - Empty Release Fix

- Investigated updater error: packaged app requested `https://github.com/zsdd2/ryq/releases/download/v1.2.0/latest.yml` and received 404.
- Confirmed remote tag `v1.2.0` exists and points to the same commit as `v1.1.3`.
- Root cause: the GitHub Actions release workflow created the GitHub Release before the Windows build/upload completed. If the build or upload failed, an empty release could still become GitHub's latest release, causing `electron-updater` to request a missing `latest.yml`.
- Changed `.github/workflows/release.yml` so the release is created only after the Windows artifacts exist.
- Bumped package metadata to `1.2.1` so the next online release supersedes the broken `v1.2.0` latest release.
- `npm run dist:win` passed and generated:
  - `dist/renyiqian-setup-1.2.1.exe`
  - `dist/renyiqian-setup-1.2.1.exe.blockmap`
  - `dist/latest.yml`
- Verified `dist/latest.yml` points to `renyiqian-setup-1.2.1.exe`.

## Latest Verification - Storage Migration And Launcher Restore

- Investigated the reported reinstall/update data loss and found multiple Windows user-data directories on the machine: `%APPDATA%/renyiqian`, `%APPDATA%/任意签`, and `%APPDATA%/Stickban`.
- Root cause: previous product-name/app-name changes could point Electron `userData` at a different directory, making existing notes appear missing after reinstall.
- Added `src/main/user-data.ts` to pin the packaged Windows path to `%APPDATA%/renyiqian` and migrate legacy databases from `%APPDATA%/任意签/data/renyiqian.db` or `%APPDATA%/Stickban/data/stickban.db` only when the canonical database has no user notes.
- Added regression tests that verify legacy data is copied into the canonical directory and that existing canonical notes are not overwritten.
- Changed panel collapse to compute a centered 88x88 launcher position, then explicitly restore, show, raise, and persist the launcher window state.
- Bumped package metadata to `1.2.2` for the next remote update.
- Verification passed:
  - `npm run typecheck`
  - `npm test` passed: 8 test files, 31 tests.

## Latest Verification - Card Timers, Groups, And Templates

- Fixed long note previews by clamping card preview content to two lines so text no longer overflows card boundaries.
- Added group rename and delete controls to the left sidebar.
- Added compact countdown rows to note cards. Timer labels use the first four visible characters, and remaining time shows one unit only: days, hours, or minutes, with `超` for overdue timers.
- Added direct card-level pin toggling without opening the note detail dialog.
- Changed note detail save so saving closes the detail dialog.
- Replaced interruptive timer alerts and full-width status banners with a small hoverable alert icon.
- Added recurring timer support for single, daily, weekly, and monthly timers; adding a timer also inserts a small timer marker into the rich text body.
- Changed the template panel into a reusable template selector. It now includes the existing custom table template and a new account membership management template, and closes automatically after generating a template note.
- Bumped package metadata to `1.2.3` for the next remote update.
- Verification passed:
  - `npm run typecheck`
  - `npm test` passed: 8 test files, 35 tests.

## Latest Verification - Account Templates, Timer Quotas, And Drag Ordering

- Updated account membership templates so one template note can contain multiple account sections based on the requested quantity.
- Changed account template fields to focus on account name, account password, account expiry time, timer, and optional custom rows.
- Extended note timers with an optional quota field and added edit-in-place behavior for existing timers.
- Updated card timer display to show compact timer name, quota, and one-unit due/remaining time on the right side of the card.
- Reduced the floating launcher visible and clickable area to `59x59`.
- Added drag-and-drop note card ordering within the active group. Pinned cards remain in the top section and are not mixed with regular cards.
- Bumped package metadata to `1.4.0` to align with the remote release workflow's next feature version.
- Verification passed:
  - `npm run typecheck`
  - `npm test` passed: 8 test files, 36 tests.

## Latest Verification - Group Delete, Template Layering, Timer Save, And Upward Drag

- Changed the left sidebar group controls to a dedicated `便签分组` header with selection checkboxes and a single top-right delete action.
- Group deletion now requires a confirmation dialog, supports selected groups, and prevents deleting the last remaining group.
- Group rename now starts by clicking the group title directly instead of using a separate edit icon.
- Raised the template generation panel above note cards and made its action footer sticky so existing notes cannot cover the generate button.
- Changed note card timer rows to three aligned fields: timer name, remaining quota, and compact remaining/overdue time.
- Changed note detail saving so pending timer edits are included when the bottom `保存` button is clicked.
- Added `src/renderer/src/note-order.ts` and tests for upward and downward note drag target indexes.
- Enabled installer launch-after-finish and bumped package metadata to `1.4.1`.
- Verification passed:
  - `codegraph sync` reported the index is up to date.
  - `npm run typecheck`
  - `npm test` passed: 9 test files, 39 tests.
  - `npm run dist:win`
- Release artifacts:
  - `dist/renyiqian-setup-1.4.1.exe`
  - `dist/renyiqian-setup-1.4.1.exe.blockmap`
  - `dist/latest.yml` points to `renyiqian-setup-1.4.1.exe`.
- Packaged updater configuration still targets `zsdd2/ryq`.

## Latest Verification - Group Switching, Account Table, And Percentage Quota

- Fixed group-title click handling so a single click switches the active group instead of opening rename.
- Kept title-based rename available on double-click without reintroducing a separate edit icon.
- Rebuilt the account membership template as a horizontal table with `序号`, account fields, timer, and custom fields as columns.
- Each requested account quantity now creates one editable table row.
- Added percentage quota helpers so new and edited timer quotas are stored as `数字%` while the form displays a fixed `%` suffix.
- Preserved legacy quota text such as counts instead of rewriting old local data.
- Added regression tests for horizontal account tables and percentage quota formatting.
- Package metadata is set to `1.4.2`.
- Verification passed:
  - `npm run typecheck`
  - `npm test` passed: 9 test files, 40 tests.
  - `npm run dist:win`
  - `codegraph sync` reported the index is up to date.
- Release artifacts:
  - `dist/renyiqian-setup-1.4.2.exe`
  - `dist/renyiqian-setup-1.4.2.exe.blockmap`
  - `dist/latest.yml` points to `renyiqian-setup-1.4.2.exe`.
- Native Electron interaction was not browser-DOM tested; behavior is covered by helper tests, typecheck, and packaged build verification.

## Latest Verification - Quick Countdown And Card Quota Editing

- Added quick countdown presets in the timer editor:
  - `30天` sets the due time to current time plus 30 days and stores monthly repeat metadata.
  - `7天` sets the due time to current time plus 7 days and stores weekly repeat metadata.
  - `5小时` sets the due time to current time plus 5 hours and remains a one-shot timer.
- Stored quick countdown metadata on timers so card refresh can distinguish quick timers from ordinary one-shot timers.
- Added a refresh button at the end of quick timer rows on note cards; it recalculates the due time from the current time.
- Added direct card-level quota editing: click the quota, edit the numeric value, then press Enter or blur to save.
- Added regression tests for quick timer presets and refresh calculation.
- Package metadata is set to `1.4.3`.
- Verification passed:
  - `npm run typecheck`
  - `npm test` passed: 9 test files, 42 tests.
  - `npm run dist:win`
  - `codegraph sync` reported the index is up to date.
- Release artifacts:
  - `dist/renyiqian-setup-1.4.3.exe`
  - `dist/renyiqian-setup-1.4.3.exe.blockmap`
  - `dist/latest.yml` points to `renyiqian-setup-1.4.3.exe`.

## Environment Notes

- Use the project-local Node runtime for this checkout:

```powershell
$root = (Resolve-Path .).Path
$env:PATH = (Join-Path $root '.tools\node-v20.20.2-win-x64') + ';' + $env:PATH
$env:LOCALAPPDATA = (Join-Path $root '.localappdata')
```

- The global Node runtime is v24.13.0 and is not suitable for this baseline because `better-sqlite3@9.6.0` falls back to native compilation.
- The machine does not currently expose a usable MSVC C++ toolset for `node-gyp` fallback builds.
- `npm install` completed only after `LOCALAPPDATA` was redirected to the project directory so Electron could cache its binary locally.
- `npm audit` reports 18 dependency vulnerabilities in the upstream baseline: 1 low, 5 moderate, 11 high, and 1 critical. Do not run forced audit fixes until after the Stickban base behavior is captured, because dependency upgrades may change Electron/native-module behavior.
