# Next Action Field — Design Spec

**Date:** 2026-07-13

## Purpose

Add a "Next action" text field to tasks so users can capture the immediate next physical step alongside the task title. Inspired by GTD methodology. The field displays as a second line under the task title in the task list, giving at-a-glance clarity on what to do next without opening the detail modal.

---

## Data Layer

**`prisma/schema.prisma`**
- Add `nextAction String?` to the `Task` model

**`src/lib/types.ts`**
- Add `nextAction?: string | null` to the `Task` interface

**Migration**
- Run `npx prisma migrate dev --name add_next_action`
- SQLite migration adds a nullable `nextAction` column to the Task table

---

## Task List Display

**File:** `src/components/tasks/TaskItem.tsx`

Below the existing title `<button>`, render a second line when `task.nextAction` is present:

```tsx
{task.nextAction && (
  <span className="text-xs text-slate-400 truncate block pl-1">
    {task.nextAction}
  </span>
)}
```

- Read-only in the list (no click interaction)
- Truncated to 1 line
- Muted style so it doesn't compete with the title

---

## Task Detail Modal

**File:** `src/components/tasks/TaskDetail.tsx`

Add a "Next action" text input in the left column, between Title and Description:

- Label: `Next action`
- Input: single-line `<input type="text">`
- Placeholder: `What's the next action?`
- Auto-saves on blur via existing `save()` pattern
- Matches the styling of the Title field

---

## API

No changes needed. `updateTask(id, patch)` already accepts an arbitrary patch object — passing `{ nextAction }` works as-is.

---

## Verification

1. Run `npx prisma migrate dev --name add_next_action` — confirm no errors
2. Open a task detail, add a next action, blur the field — confirm "Saved" indicator appears
3. Return to task list — confirm next action text appears as a second line under the title
4. Clear the next action field — confirm the second line disappears in the list
5. Check a task with no next action — confirm no extra blank line appears
