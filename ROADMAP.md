# ROADMAP

## Purpose

This document tracks planned product direction and upcoming milestones for Stickban. It is the place for future work and current priorities, not for implementation history.

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

## Phase 2

Status: `in progress`

Goals and milestones:

- Synced-folder cloud sync hardening
- Multi-language interface support
- System tray integration
- Theme support

## Future

Status: `planned`

Goals and milestones:

- Custom fields
- Notifications
- Richer sync conflict inspection and recovery UX
- Mobile companion app

## Near-Term Renyiqian Utility Improvements

Status: `planned`

Recommended by implementation speed and daily usefulness:

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
- Synced-folder cloud sync is now part of the runnable milestone.
