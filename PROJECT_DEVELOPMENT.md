# 任意签 Project Development

## Current Modification Goal

Prepare 任意签 1.4.4 with wider timer card layout, separated update/download notices, progress display, and persistent reminder bubbles.

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
| Timer card layout | Implemented | Note card timer columns, row height, and vertical padding were increased so timer rows no longer overflow the card. |
| Update notice separation | Implemented | Download/update messages are split from general errors and reminder messages; download progress is shown separately. |
| Reminder bubble | Implemented | Timer reminders now appear as a persistent bubble that closes only when clicked. |

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

## Latest Verification - Timer Layout And Notice Separation

- Increased the note-card timer column and row height so name, quota, remaining time, and refresh controls have enough horizontal space.
- Increased card vertical padding and minimum height so multiple timer rows expand inside the card instead of overflowing.
- Split update/download messages from generic error and reminder state.
- Added a separate update notice area with a progress bar using `downloadProgressPercent`.
- Added a separate `下载更新` / `安装更新` action beside `检查更新`; checking no longer immediately downloads.
- Changed timer due reminders into a persistent bubble that closes only when the user clicks it.
- Package metadata is set to `1.4.4`.
- Verification passed:
  - `npm run typecheck`
  - `npm test` passed: 9 test files, 42 tests.
  - `npm run dist:win`
  - `codegraph sync` reported the index is up to date.
- Release artifacts:
  - `dist/renyiqian-setup-1.4.4.exe`
  - `dist/renyiqian-setup-1.4.4.exe.blockmap`
  - `dist/latest.yml` points to `renyiqian-setup-1.4.4.exe`.

## Current Modification Goal - Timer Alerts And Compact Quick Add

- Rebalance the note-card timer area so it no longer consumes about one third of each card.
- Keep expired timer cards visible at the top with an alert color until the user confirms the reminder.
- Restore recurring and quick timers to their next cycle after confirmation; complete one-shot timers without leaving stale expired rows on the card.
- Collapse quick record to a plus button and reveal the input only when requested.
- Publish the changes as version `1.4.5`.

## Current Status

- Added explicit `scheduled`, `fired`, and `done` timer states.
- Added tested timer transition helpers for due detection and reminder acknowledgement.
- Fired timer cards sort above pinned and normal cards and use a distinct alert style.
- Reminder confirmation restores repeating/quick timers and returns the card to its saved position.
- Reduced the timer column and row spacing while preserving name, quota, remaining time, and refresh actions.
- Quick record now opens from a plus button, focuses the input, and collapses after creation or Escape.
- Verification passed:
  - `npm run typecheck`
  - `npm test` passed: 9 test files, 44 tests.
  - `npm run dist:win`
  - `codegraph sync` reported the index is up to date.
- Release artifacts:
  - `dist/renyiqian-setup-1.4.5.exe`
  - `dist/renyiqian-setup-1.4.5.exe.blockmap`
  - `dist/latest.yml` points to `renyiqian-setup-1.4.5.exe`.

## Future Modification Plan

- Verify the GitHub `v1.4.5` updater artifacts after the release workflow completes.

## Current Modification Goal - Compact Timer Quarter And Version Label

- Reduce the note-card timer area from roughly one third to roughly one quarter of the available card width.
- Move global search above quick note entry.
- Display the runtime application version beside `任意签`.
- Record six low-effort, high-value local feature recommendations without expanding this release scope.
- Publish the changes as version `1.4.6`.

## Current Status

- Timer layout target is reduced to `132-145px` with tighter name, quota, remaining-time, and refresh columns.
- Global search is positioned before quick note entry in the renderer flow.
- The title bar reads the real packaged version from `WindowState.appVersion`.
- Added source-level layout regression coverage for ordering, version display, and timer width.
- Added the six recommended local utility features to `ROADMAP.md`.
- Verification passed:
  - `npm run typecheck`
  - `npm test` passed: 10 test files, 47 tests.
  - `npm run dist:win`
  - `codegraph sync` reported the index is up to date.
- Release artifacts:
  - `dist/renyiqian-setup-1.4.6.exe`
  - `dist/renyiqian-setup-1.4.6.exe.blockmap`
  - `dist/latest.yml` points to `renyiqian-setup-1.4.6.exe`.

## Future Modification Plan

- Push version `1.4.6` and verify GitHub updater artifacts.

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
- Historical audit state before version `1.5.0`:
  - `npm audit --omit=dev` reported 2 moderate production vulnerabilities through `electron-updater -> js-yaml`.
  - Full `npm audit` reported 58 total vulnerabilities: 8 low, 30 moderate, 19 high, and 1 critical.
  - Version `1.5.0` resolved these audit findings with a dedicated Electron/Vite/Vitest/builder/native dependency upgrade batch.

## Current Modification Goal - Full CodeGraph And Code Audit

- Audit the current Renyiqian codebase end to end through CodeGraph, targeted `rg` searches, static review, tests, build, and dependency audit.
- Identify business-flow bugs and architecture/documentation mismatches before changing implementation.
- Reorder the future development plan around bug repair and verification rather than more feature expansion.

## Current Status

- CodeGraph architecture query was run for `F:\xinxiangmu\ZMBJ`; the index surfaced only a shallow subset of entry points, so the audit was expanded with `rg --files`, targeted `rg` searches, and direct reads of the main, preload, renderer, shared types, tests, docs, release, and sync/update files.
- `kf01.md` was missing from the project root even though the agent rules require it before coding. The file was restored from `C:\Users\Administrator\.codex\templates\kf01.md`.
- Verification passed:
  - `npm run typecheck`
  - `npm test` passed: 10 test files, 47 tests.
  - `npm run build`
- Verification caveat:
  - `npm test` still prints `close timed out after 10000ms` after the passing run, so the test process has a resource cleanup issue that should be investigated.

## Audit Findings

| Priority | Area | Finding | Evidence | Next Action |
| --- | --- | --- | --- | --- |
| P1 | Reminder business flow | Due reminders are checked only inside the currently active group, so timers in inactive groups can be missed until the user switches groups. | `src/renderer/src/App.tsx` builds `activeNotes` from `workspace.activeBoard.columns` before firing reminders. | Add an all-groups reminder query or main-process reminder scheduler; cover inactive-group due timers with tests. |
| P1 | Rich text safety | Stored note HTML is rendered directly into the card preview and editor without sanitization. | `src/renderer/src/note-content.ts` returns parsed `html`; `src/renderer/src/App.tsx` renders it with `dangerouslySetInnerHTML`. | Introduce a strict note-HTML sanitizer and tests for scripts, event handlers, unsafe URLs, tables, and allowed formatting. |
| P1 | Product/docs consistency | Runtime sync endpoints are local-only disabled compatibility handlers, while README/SPEC/IMPLEMENTATION/site still describe Stickban synced-folder cloud sync as current product reality. | `src/main/index.ts` maps sync IPC to `createLocalOnlySyncStatus`; docs and site still describe active cloud sync. | Update public docs/site/spec/decision records to match Renyiqian local-only runtime, or explicitly reopen sync as a separate approved scope. |
| P2 | Dead architecture paths | `src/renderer/src/store.ts` still holds the old Zustand board/sync/update store but is not imported by the active renderer. `src/main/sync.ts` is still tested but no longer constructed in the runtime. | `rg` finds `useBoardStore` only inside `store.ts`; main process imports local-only sync services instead of `SyncManager`. | Replace legacy safety tests with current local-note tests, then remove or clearly isolate dormant paths. |
| P2 | Test/runtime verification | Layout regression coverage currently reads source strings, not a live Electron UI. | `src/renderer/src/app-layout.spec.ts` asserts source/CSS substrings. | Add a repeatable live UI smoke check for launcher, panel, note editing, reminders, and update controls. |
| P2 | Dependency security | Production audit has moderate updater-chain issues; full dev/build audit has 58 advisories, including a Vitest/Vite critical dev-chain issue. | Fresh `npm audit --omit=dev` and `npm audit` runs. | Schedule a dedicated dependency upgrade and package verification batch. |
| P3 | Naming/API cleanup | Public API and globals still use `StickbanApi` and `window.stickban` while product UI/package name is Renyiqian. | `src/shared/types.ts` and `src/preload/index.ts`. | Rename only after higher-priority behavior fixes, with compatibility consideration for preload consumers. |

## Future Modification Plan

1. Fix inactive-group reminder delivery.
   - Add tests proving a due timer outside the active group is detected.
   - Decide whether detection belongs in main-process SQLite queries or a renderer all-workspace snapshot.
   - Verify with `npm run typecheck`, targeted tests, and full `npm test`.
2. Add note HTML sanitization at the parsing/render boundary.
   - Preserve current rich text and template table output.
   - Strip script tags, event attributes, unsafe URLs, and unknown attributes.
   - Add regression tests before production changes.
3. Clean product reality documentation.
   - Update README, README.pt-BR, SPEC, IMPLEMENTATION, DECISIONS, and `site/` so they describe Renyiqian local floating notes and current updater behavior accurately.
   - Remove claims that synced-folder cloud sync is the active runtime unless sync is intentionally restored in a separate approved task.
4. Retire unused legacy renderer store and dormant runtime sync only after replacement tests exist.
   - Keep data migration safety and local SQLite behavior protected.
   - Avoid deleting `src/main/sync.ts` until docs and tests no longer depend on old sync claims.
5. Fix the Vitest shutdown warning.
   - Use hanging-process diagnostics or test isolation to find the open handle.
   - Keep this separate from product behavior changes.
6. Add live Electron UI smoke verification for release-facing work.
   - Verify launcher open/collapse, note create/edit/delete, reminder confirmation, search, and update buttons in a real app process.
7. Run a dedicated dependency upgrade batch.
   - Upgrade Electron/build/test tooling conservatively.
   - Rebuild native dependencies with the project-local Node 20 runtime.
   - Verify tests, build, Windows packaging, `latest.yml`, and updater config.

## Latest Verification - Inactive Group Reminder Scope

- Root cause confirmed: the renderer reminder loop only scanned `workspace.activeBoard.columns`, so due timers in inactive groups could be missed until group switching.
- Added `getAllNotes()` in `src/main/database.ts` and exposed it through `workspace:getAllNotes`, preload, and shared API types.
- Updated renderer reminder scan and reminder acknowledgement to load all live local notes before checking or acknowledging timers.
- Verification passed:
  - `npm test -- src/main/search-notes.spec.ts` passed: 1 test file, 3 tests.
  - `npm run typecheck`
- Verification caveat:
  - The existing Vitest shutdown warning still appears after the passing targeted test.

## Current Modification Goal - HTML Sanitization

- Add a strict sanitizer for stored note HTML before it is rendered through `dangerouslySetInnerHTML`.
- Preserve supported rich text and template table markup while stripping executable or unsafe pasted/migrated HTML.

## Current Status

- Implemented and verified.
- Stored note HTML is sanitized at the `createNoteView` boundary before it reaches card preview or editor rendering.
- The sanitizer preserves supported formatting, template tables, account-template row classes, and inline timer markers.
- The sanitizer strips script/style-like blocks, event-handler attributes, unsafe `javascript:` links, unsupported tags, unknown classes, and inline styles.
- Verification passed:
  - `npm test -- src/renderer/src/note-content.spec.ts` passed: 1 test file, 14 tests.
  - `npm run typecheck`
  - `npm test` passed: 10 test files, 50 tests.
  - `npm run build`
- Verification caveat:
  - The existing Vitest shutdown warning still appears after passing test runs.

## Future Modification Plan

1. Reconcile product reality across README, README.pt-BR, SPEC, IMPLEMENTATION, DECISIONS, and `site/`.
2. Replace current-runtime claims about Stickban synced-folder cloud sync with Renyiqian local floating-note behavior.
3. Keep dormant sync code documented as legacy/dormant unless a future task explicitly restores it.
4. Re-run documentation grep checks and build verification after edits.

## Current Modification Goal - Product Reality Documentation Cleanup

- Make public and internal documentation match the active Renyiqian runtime.
- Remove or reclassify current-runtime claims that synced-folder cloud sync is active.

## Current Status

- Implemented and verified.
- Rewrote `README.md`, `README.pt-BR.md`, and `SPEC.md` around the active Renyiqian local floating-note runtime.
- Updated `site/index.html` so public copy, repository links, roadmap snapshot, and current capability claims no longer describe Stickban/Kanban/cloud-sync as the current product.
- Added `DECISIONS.md` D-015 to record the Renyiqian local-only runtime boundary and marked D-013 as superseded for the active runtime.
- Updated `AGENTS.md` so future agents treat synced-folder sync as dormant unless a new decision explicitly restores it.
- Verification passed:
  - `npm run site:build`
  - Documentation grep check no longer finds active README/SPEC/site claims that current runtime is Stickban Kanban or synced-folder cloud sync.

## Future Modification Plan

1. Retire or isolate unused legacy renderer store and dormant runtime sync paths.
2. Add replacement local-note tests before removing legacy code paths.
3. Keep migration and data durability safeguards intact.
4. Run typecheck, full tests, build, and CodeGraph sync after code cleanup.

## Current Modification Goal - Legacy Store And Dormant Sync Cleanup

- Remove or isolate unused `src/renderer/src/store.ts` and dormant runtime sync code only after replacement coverage is in place.
- Keep this separate from the already completed reminder and HTML sanitizer fixes.

## Current Status

- Implemented and verified.
- Removed the unused legacy renderer Zustand store at `src/renderer/src/store.ts`.
- Removed the stale sync-risk regression that imported the deleted renderer store.
- Removed the unused `zustand` package from `package.json` and `package-lock.json`.
- Superseded by version `1.5.0`: `src/main/sync.ts` and `src/main/sync-risk.spec.ts` have now been removed.
- Verification passed:
  - `rg` found no remaining `useBoardStore`, `zustand`, or renderer-store imports in source or package manifests.
  - `npm run typecheck`
  - Historical targeted check before full sync removal: `npm test -- src/main/sync-risk.spec.ts` passed: 1 test file, 8 tests.
  - `npm test` passed: 10 test files, 49 tests.
  - `npm run build`
- Verification caveat:
  - The existing Vitest shutdown warning still appears after passing test runs.

## Future Modification Plan

1. Fix the Vitest shutdown warning.
   - Isolate whether the open handle comes from SQLite cleanup, Electron test process lifecycle, or a specific test file.
   - Prefer a test harness cleanup fix over suppressing the warning.
2. Add a repeatable live Electron UI smoke verification.
3. Schedule the dependency security upgrade batch after the test harness is clean.

## Current Modification Goal - Vitest Shutdown Warning Investigation

- Determine whether the `close timed out after 10000ms` warning comes from a specific test file, SQLite cleanup, or the Electron/Vitest runner.
- Avoid suppressing the warning unless the underlying runner behavior is understood.

## Current Status

- Investigated and blocked for this repair batch.
- Minimal tests such as `src/main/local-only-services.spec.ts` reproduce the same 10-second shutdown warning, so the issue is not caused by a specific SQLite test or recently changed business logic.
- `--reporter=hanging-process` reports Tinypool plus file handles after successful tests.
- `--pool=threads`, `--pool=forks`, `--pool=vmThreads`, `--pool=typescript`, `--no-file-parallelism`, `--no-isolate`, and single-thread/single-fork options do not remove the warning.
- Running Vitest directly with the project Node 20 runtime removes the warning for tests that do not load SQLite, but SQLite tests fail because `better-sqlite3` is currently compiled for Electron ABI instead of Node ABI.
- Conclusion: the current test command must keep using Electron for native-module compatibility, and the shutdown warning should be fixed together with the planned Electron/Vitest/native dependency upgrade batch rather than hidden in the runner.

## Future Modification Plan

1. Add a repeatable live Electron UI smoke verification.
2. Run a dedicated dependency upgrade batch for Electron, Vitest, Vite, builder tooling, and `better-sqlite3`.
3. After the upgrade, re-test whether Vitest can run through Node directly or whether the Electron runner closes cleanly.

## Latest Verification - Audit Repair Batch 1

- Completed the first ordered repair batch from the full audit:
  - inactive-group reminder delivery;
  - stored note HTML sanitization;
  - product reality documentation cleanup;
  - legacy renderer store removal;
  - Vitest shutdown warning root-cause isolation.
- Verification passed:
  - `npm run typecheck`
  - `npm test` passed: 10 test files, 49 tests.
  - `npm run site:build`
  - `npm run build`
  - `codegraph sync` reported the index is up to date.
- Verification caveat:
  - The Vitest shutdown warning is confirmed to be an Electron/Vitest/native-module runner compatibility issue and remains scheduled for the dependency upgrade batch.

## Current Modification Goal - Version 1.4.7 Metadata Bump

- Update package metadata from `1.4.6` to `1.4.7` after the audit repair batch was committed and pushed.
- Keep the version-only change separate from the functional repair commit.

## Current Status

- Verified.
- `npm run release:version` calculated the next patch release as `1.4.7` / `v1.4.7` from the latest `v1.4.6` tag and the new `fix:` audit repair commit.
- `package.json` and `package-lock.json` now report version `1.4.7`.
- Verification passed:
  - `npm run release:version`
  - `npm run build`
  - `codegraph sync` reported the index is up to date.

## Current Modification Goal - Version 1.5.0 Audit Closure

- Reconfirm why the desktop updater can report `1.4.9` while package metadata still showed `1.4.7`.
- Finish the remaining unresolved audit items:
  - remove the old synced-folder implementation dead path;
  - remove the Vitest `close timed out after 10000ms` shutdown warning;
  - clear production and full dependency audit findings.
- Advance package metadata to `1.5.0` and push the release-ready code.

## Current Status

- Verified.
- `git fetch --tags` confirmed `v1.4.8` and `v1.4.9` already exist remotely.
- `v1.4.9` points at commit `3a9c7c1`, but that commit's package metadata still reported `1.4.7`; this explains the desktop/updater version mismatch.
- Removed `src/main/sync.ts` and `src/main/sync-risk.spec.ts`; current sync IPC remains local-only compatibility behavior.
- Updated README, README.pt-BR, SPEC, IMPLEMENTATION, DECISIONS, and AGENTS so they no longer claim the legacy synced-folder implementation still remains.
- Reworked the Vitest runner so Electron tests exit immediately after Vitest reports results instead of waiting for the internal Vite close timeout.
- Upgraded the build/test dependency chain:
  - Electron `42.4.0`
  - electron-builder `26.15.3`
  - electron-vite `5.0.0`
  - Vite `7.3.5`
  - Vitest `4.1.9`
  - @vitejs/plugin-react `5.2.0`
  - better-sqlite3 `12.11.1`
- Added a project-local Electron/Vitest launcher so tests use project-local cache paths for Electron downloads.
- `package.json` and `package-lock.json` now report version `1.5.0`.
- Verification passed so far:
  - `npm audit --omit=dev` reports 0 vulnerabilities.
  - `npm audit` reports 0 vulnerabilities.
  - `npm run typecheck`
  - `npm test` passed: 9 test files, 41 tests, with no `close timed out` warning.
  - `npm run build`
  - `npm run site:build`
  - `npm run dist:win`
- Verification caveat:
  - Final CodeGraph sync was attempted, but the `codegraph` CLI is not available in the current PowerShell PATH and no callable CodeGraph sync tool is exposed in this Codex session.
- Release artifacts:
  - `dist/renyiqian-setup-1.5.0.exe`
  - `dist/renyiqian-setup-1.5.0.exe.blockmap`

## Future Modification Plan

1. Commit and push version `1.5.0`.
2. Add live Electron UI smoke coverage for launcher, floating note creation, editing, grouping, search, timer display, reminder scan, and update-status controls.
3. Add local backup/export/import:
   - scheduled SQLite backups;
   - manual export/import from settings;
   - restore validation before replacing local data.
4. Add reminder UX improvements:
   - recurring reminder presets;
   - per-group reminder filters.
5. Add local productivity polish:
   - tray quick actions;
   - startup setting;
   - opacity and always-on-top controls;
   - themes and note color presets.
6. Add data-model cleanup after compatibility coverage exists:
   - replace legacy board/card naming with explicit note/category naming;
   - keep migrations and backup recovery safe.
7. Keep sync, accounts, OAuth, provider APIs, and multi-device behavior out of scope unless a new product decision explicitly restores them.

## Current Modification Goal - Reminder UX Consolidation

- Move due reminder interaction away from the old bottom bubble.
- Keep fired reminders visible on the relevant note card near the card's top-right area.
- Add a top-right exclamation reminder entry that collects current reminders and reminder history.
- Support reminder snooze actions and clearable local reminder history.

## Current Status

- Implemented and verified locally.
- Added a tested `snoozeFiredTimers` helper so fired timers can be rescheduled to a later due time.
- Added top-right reminder history state persisted in `localStorage` under `renyiqian.reminderHistory`, capped to the latest 50 entries.
- Added current reminder actions behind the top-right exclamation entry:
  - `10分钟后`
  - `1小时后`
  - `明天`
  - `确认`
- Added card-level `note-reminder-chip` on fired reminder cards; clicking it confirms that note's fired timers and records the action into history.
- Removed the old bottom `reminder-bubble` presentation.
- Advanced package metadata to `1.6.0` so the next pushed feature release keeps source metadata aligned with the automated desktop release version.
- Verification passed:
  - `npm install --package-lock-only --ignore-scripts` reports 0 vulnerabilities.
  - `npm test -- src/renderer/src/note-content.spec.ts src/renderer/src/app-layout.spec.ts`
  - `npm run typecheck`
  - `npm test`
  - `npm run build`
  - `npm run site:build`
  - `git diff --check`
  - `C:\Users\Administrator\AppData\Local\codegraph\current\bin\codegraph.cmd sync` completed; final run reported `Already up to date`.

## Future Modification Plan

1. Add live Electron UI smoke coverage for reminder history open/clear, card reminder confirmation, and snooze actions.
2. Continue with local backup/export/import as the next high-impact feature.
3. Keep sync, accounts, OAuth, provider APIs, and multi-device behavior out of scope unless a new product decision explicitly restores them.

## Current Modification Goal - Electron Reminder Smoke And Floating Chip

- Verify reminder history and snooze behavior in a real Electron runtime.
- Fix the fired-reminder card chip so the `提醒` label floats over the card instead of consuming note text layout space.
- Advance patch metadata to `1.6.1` for the next release push.

## Current Status

- Implemented and verified.
- Added `npm run smoke:electron`, which builds the app, launches real Electron with isolated app/user data paths, connects through the DevTools protocol, opens the launcher, seeds a due reminder note, verifies the alert card and top-right reminder panel, verifies snooze history persistence, and verifies clear-history behavior.
- Added main-process path override coverage for `RENYIQIAN_APP_DATA_PATH` and `RENYIQIAN_USER_DATA_PATH` so smoke tests do not touch the user's real app data.
- Updated the fired reminder chip CSS so `.note-reminder-chip` remains absolutely positioned and `.note-card.timer-alert` no longer adds extra top padding.
- Added a layout regression assertion that the old bottom `.reminder-bubble` stays removed and the timer alert card does not reintroduce reminder-chip layout padding.
- Advanced `package.json` and `package-lock.json` to `1.6.1`.
- Verification passed:
  - `npm install --package-lock-only --ignore-scripts` reports 0 vulnerabilities.
  - `npm test -- src/main/app-paths.spec.ts src/renderer/src/app-layout.spec.ts`
  - `npm test` passed: 10 test files, 45 tests.
  - `npm run smoke:electron`
  - `npm run site:build`
  - `npm audit --omit=dev` reports 0 vulnerabilities.
  - `git diff --check`
  - `C:\Users\Administrator\AppData\Local\codegraph\current\bin\codegraph.cmd sync` completed and synced changed files.

## Future Modification Plan

1. Commit and push version `1.6.1`.
2. Continue with tray-first desktop behavior and larger titlebar button hit targets as the next high-impact feature.
3. Keep sync, accounts, OAuth, provider APIs, and multi-device behavior out of scope unless a new product decision explicitly restores them.

## Current Modification Goal - Tray First Desktop Behavior

- Hide the floating 任意签 window from the OS taskbar and keep access through the system tray.
- Make the titlebar icon buttons easier to click without making the icons visually larger.
- Keep close behavior non-destructive: the titlebar close button should hide to tray, while the tray menu keeps an explicit quit action.
- Advance feature metadata to `1.7.0` for the next release push.

## Current Status

- Implemented and verified locally.
- Added source-level regression tests for taskbar skipping, tray menu creation, close-to-tray behavior, and larger titlebar icon-button hit targets.
- Updated `createFloatingWindowOptions` so launcher and panel windows use `skipTaskbar: true`.
- Added a persistent Electron Tray with `显示/隐藏`, `检查更新`, and `退出` actions.
- Changed close handling so titlebar close hides the window unless the app is explicitly quitting.
- Enlarged `.icon-button` click targets to at least `34px` square while keeping the existing icon artwork sizes.
- Included `logos/renyiqian-logo.ico` in packaged files so the tray icon is available in packaged builds.
- Advanced `package.json` and `package-lock.json` to `1.7.0`.
- Verification passed:
  - `npm test -- src/main/floating-window.spec.ts src/main/tray.spec.ts src/renderer/src/app-layout.spec.ts`
  - `npm install --package-lock-only --ignore-scripts` reports 0 vulnerabilities.
  - `npm test` passed: 11 test files, 48 tests.
  - `npm run smoke:electron`
  - `npm run site:build`
  - `npm audit --omit=dev` reports 0 vulnerabilities.
  - `git diff --check`
  - `C:\Users\Administrator\AppData\Local\codegraph\current\bin\codegraph.cmd sync` completed; final run reported `Already up to date`.

## Future Modification Plan

1. Commit and push version `1.7.0`.
2. Implement countdown-aware automatic sorting as the next feature, with manual sorting preserved as an option.
3. Keep sync, accounts, OAuth, provider APIs, and multi-device behavior out of scope unless a new product decision explicitly restores them.

## Current Modification Goal - Timer Workspace Sorting

- Split the active group note list into an upper `工作区` and lower `等待区`.
- Let a note's timers define one core timer and one sorting timer.
- Move notes whose core timer quota is `0` into the waiting area until that core timer reaches its reset time.
- When a zero-quota core timer reaches its reset time, automatically restore its numeric quota from the stored reset value and roll the timer to the next repeat/quick-preset due time.
- Sort the workspace by the selected sorting timer from near-to-far or far-to-near.
- Store timer quotas as digits only.
- Advance feature metadata to `1.8.0` for the next release push.

## Current Status

- Implemented and verified locally.
- Added pure rule coverage for numeric quota normalization, workspace/waiting split, near/far sorting, and automatic zero-quota core timer refresh.
- Added UI source regression coverage for the workspace/waiting sections, sorting control, core/sort role buttons, and automatic refresh helper.
- Added `isCore`, `isSort`, and `quotaResetValue` timer metadata inside the existing note JSON payload, preserving the SQLite schema.
- Added `工作区` / `等待区` section headers and a workspace sort direction selector.
- Added timer detail actions for `设为核心` and `设为排序`.
- Updated quota editing so new values are numeric-only; positive values also become the future reset value, while `0` preserves the previous reset value.
- Advanced `package.json` and `package-lock.json` to `1.8.0`.
- Verification passed so far:
  - `npm test -- src/renderer/src/note-content.spec.ts`
  - `npm test -- src/renderer/src/note-content.spec.ts src/renderer/src/app-layout.spec.ts`
  - `npm run typecheck`
  - `npm install --package-lock-only --ignore-scripts` reports 0 vulnerabilities.
  - `npm test` passed: 11 test files, 51 tests.
  - `npm run smoke:electron`
  - `npm run site:build`
  - `npm audit --omit=dev` reports 0 vulnerabilities.
  - `git diff --check`
  - `C:\Users\Administrator\AppData\Local\codegraph\current\bin\codegraph.cmd sync` completed; final run reported `Already up to date`.

## Future Modification Plan

1. Commit and push version `1.8.0`.
2. Add live UI smoke coverage for selecting core/sort timers and waiting-area movement if the current smoke harness remains stable.
3. Keep sync, accounts, OAuth, provider APIs, and multi-device behavior out of scope unless a new product decision explicitly restores them.

## Current Modification Goal - Timer Sorting UI Polish

- Shorten timer role controls from `设为核心` / `设为排序` to compact `核心` / `排序` buttons with a leading check mark when active.
- Remove old inline timer markers from rich note content and stop inserting new markers when adding timers.
- Keep at least two timer rows visible on note cards and prioritize core and sorting timers before ordinary timers.
- Ensure the note edit dialog layers above sticky `工作区` / `等待区` headers.
- Advance patch metadata to `1.8.1` for the next release push.

## Current Status

- Implemented and verified locally.
- Updated the note sanitizer to remove historical `.note-inline-timer` spans while preserving supported table/rich formatting.
- Removed inline timer marker insertion from `addTimer`, so rich text no longer gains unclickable timer labels.
- Changed role buttons to compact `核心` / `排序` labels, with `✓ 核心` / `✓ 排序` when selected.
- Sorted card timer rows by core first, sorting timer second, then remaining timers by due time.
- Added a two-row minimum timer stack height and raised the note dialog above sticky section headings.
- Advanced `package.json` and `package-lock.json` to `1.8.1`.
- Verification passed so far:
  - `npm test -- src/renderer/src/note-content.spec.ts src/renderer/src/app-layout.spec.ts`
  - `npm test`
  - `npm run smoke:electron`
  - `npm run site:build`
  - `npm install --package-lock-only --ignore-scripts` reports 0 vulnerabilities.
  - `npm audit --omit=dev` reports 0 vulnerabilities.
  - `git diff --check`
  - `codegraph sync` reports already up to date.

## Future Modification Plan

1. Commit and push version `1.8.1`.
2. Add live UI smoke coverage for selecting core/sort timers and waiting-area movement if the current smoke harness remains stable.
3. Keep sync, accounts, OAuth, provider APIs, and multi-device behavior out of scope unless a new product decision explicitly restores them.

## Current Modification Goal - Timer Role Button Wrapping Fix

- Keep compact `核心` / `排序` timer role labels on one horizontal line in the note editor.
- Advance patch metadata to `1.8.2` for the next desktop release push.

## Current Status

- Implemented and verified locally.
- Added a focused layout test that checks `.timer-role-button` directly prevents wrapping.
- Added `white-space: nowrap` and a small minimum width to the timer role button style.
- Advanced `package.json` and `package-lock.json` to `1.8.2`.
- Verification passed:
  - `npm test -- src/renderer/src/app-layout.spec.ts`
  - `npm test`
  - `npm install --package-lock-only --ignore-scripts` reports 0 vulnerabilities.
  - `git diff --check`
  - `codegraph sync` reports already up to date.

## Future Modification Plan

1. Commit and push version `1.8.2`.
2. Confirm the release workflow and `v1.8.2` tag after push.
3. Keep future timer editor polish focused on compact controls unless the editor layout is redesigned.
