# Todo++ Pro

A robust single-user todo application built with React and Vite.

## Features Added

- Add, edit, delete, toggle tasks with inline editing
- Search and filter (All/Active/Completed)
- Pin/unpin tasks (pinned appear at top)
- Undo/Redo (Ctrl+Z / Ctrl+Shift+Z) with 10-step history
- Import/Export JSON with validation and deduplication
- Strict validation: min 3 chars, no duplicates, trimmed input
- Keyboard shortcuts (/, Esc, ↑↓, Space)
- Performance monitoring with latency log
- Seed 1000 tasks for testing

## Install

```bash
cd app2
npm install
```

## Run

```bash
npm run dev
```

Open http://localhost:5173

## AI Usage

This project was created using GitHub Copilot and Claude Sonnet 4.5.

### Initial Request
"Create a robust, single-user 'Todo++ Pro' application using React and Vite with comprehensive features including state management, CRUD operations, strict validation, search/filter logic, pinning/sorting, undo/redo, import/export JSON, keyboard shortcuts, accessibility, and performance tooling."

### Key Requirements Implemented
1. State management with `useReducer` and custom `useUndoableReducer` hook for undo/redo (10-step history)
2. Basic CRUD with inline editing, toggle completion, and filter tabs (All/Active/Completed)
3. Strict validation: min 3 chars, no duplicates (case-insensitive), trimmed input with error messages
4. Search + filter intersection logic with auto-clear on tab switch
5. Pin/unpin with sorting (pinned at top, secondary sort by createdAt)
6. Undo/Redo with Ctrl+Z / Ctrl+Shift+Z keyboard shortcuts
7. Import/Export JSON with schema validation, deduplication, and time-travel fixes
8. Keyboard navigation: /, Esc, ↑↓, Space with ARIA labels
9. Performance tooling: Seed 1000 button and latency log display
10. Documentation with README

### Issues Fixed
- **Keyboard shortcuts not working**: Fixed Ctrl+Z/Cmd+Z preventing browser undo by adding `stopPropagation()` and capture phase event listener. Added support for both Ctrl (Windows/Linux) and Cmd (Mac).
- **Search `/` key conflict**: Improved input detection to check for both INPUT and TEXTAREA tags.
- **Seed performance**: Optimized from random generation to deterministic patterns using pre-allocated arrays and mathematical patterns instead of Math.random() calls.

### Development Process
- Created modular component structure (App, TaskList, TaskItem, SearchBar, FilterTabs, LatencyLog)
- Implemented custom hook for undoable state management
- Used plain CSS for minimal, clean styling
- No external UI libraries - production-ready vanilla React
