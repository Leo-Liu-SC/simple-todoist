# Next Action Field Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `nextAction` text field to tasks, displayed as a second muted line under the task title in the list, and editable in the task detail modal.

**Architecture:** Three-layer change — database schema + type, task list display, task detail form. Each layer is independent and can be committed separately.

**Tech Stack:** Prisma (SQLite), TypeScript, React, Tailwind CSS

## Global Constraints

- SQLite database — use `npx prisma migrate dev` for schema changes, never edit migration files manually
- Tailwind CSS only — no inline styles except where already used (e.g. `paddingLeft` for depth indent)
- Auto-save on blur pattern — match existing `save()` usage in TaskDetail.tsx
- No new dependencies

---

### Task 1: Add `nextAction` to schema and TypeScript type

**Files:**
- Modify: `prisma/schema.prisma` (Task model)
- Modify: `src/lib/types.ts` (Task interface)

**Interfaces:**
- Produces: `Task.nextAction?: string | null` available everywhere Task is used

- [ ] **Step 1: Add field to Prisma schema**

In `prisma/schema.prisma`, add `nextAction` after `description` in the Task model:

```prisma
model Task {
  id          Int         @id @default(autoincrement())
  title       String
  description String?
  nextAction  String?
  dueDate     DateTime?
  priority    Int         @default(4)
  status      String      @default("todo")
  order       Int         @default(0)
  projectId   Int?
  parentId    Int?
  project     Project?    @relation(fields: [projectId], references: [id], onDelete: SetNull)
  parent      Task?       @relation("Subtasks", fields: [parentId], references: [id], onDelete: Cascade)
  subtasks    Task[]      @relation("Subtasks")
  labels      TaskLabel[]
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
}
```

- [ ] **Step 2: Run migration**

```bash
npx prisma migrate dev --name add_next_action
```

Expected output: `✔ Generated Prisma Client` and a new migration file under `prisma/migrations/`.

- [ ] **Step 3: Add field to TypeScript Task interface**

In `src/lib/types.ts`, add `nextAction` after `description` in the Task interface:

```typescript
export interface Task {
  id: number;
  title: string;
  description?: string | null;
  nextAction?: string | null;
  dueDate?: string | null;
  priority: Priority;
  status: Status;
  order: number;
  projectId?: number | null;
  parentId?: number | null;
  project?: Pick<Project, "id" | "name" | "color"> | null;
  labels: Label[];
  subtasks?: Task[];
  _count?: { subtasks: number };
  createdAt: string;
  updatedAt: string;
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations src/lib/types.ts
git commit -m "feat: add nextAction field to Task schema and type"
```

---

### Task 2: Display next action in task list

**Files:**
- Modify: `src/components/tasks/TaskItem.tsx` (lines ~286-293, the title column span)

**Interfaces:**
- Consumes: `Task.nextAction?: string | null` from Task 1

- [ ] **Step 1: Add next action line below the title button**

In `src/components/tasks/TaskItem.tsx`, locate the title column `<span>` (around line 275). After the closing `</button>` tag of the title button (around line 292), add the next action line:

The current block looks like:
```tsx
<button
  onClick={(e) => { e.stopPropagation(); onSelect(task); }}
  className={`text-sm min-w-0 text-left rounded px-1 -mx-1 leading-snug line-clamp-2 hover:bg-slate-100/70 focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus:outline-none ${isDone ? "line-through text-slate-500" : "text-slate-800"} ${hasSubtasks ? "font-semibold" : ""}`}
  title={task.title}
>
  {task.title}
</button>
```

Change the wrapping `<span>` to `flex-col` and add the next action line:

```tsx
{/* Col: title — indented by nesting depth so subtasks read as nested.
    Parent tasks show a subtask-count badge so they stand out in the list. */}
<span className="flex items-start gap-2 min-w-0" style={{ paddingLeft: depth * 28 }}>
  {hasSubtasks && (
    <button
      onClick={(e) => { e.stopPropagation(); setSubtaskExpanded(!subtaskExpanded); }}
      className="flex items-center gap-0.5 text-[11px] font-medium text-slate-500 bg-slate-100 hover:bg-slate-200/80 rounded-full pl-1.5 pr-2 py-0.5 mt-0.5 flex-shrink-0 transition-colors tabular-nums"
      title={subtaskExpanded ? "Collapse subtasks" : "Expand subtasks"}
    >
      <ListTree size={11} aria-hidden="true" />
      {task._count?.subtasks ?? 0}
    </button>
  )}
  <span className="flex flex-col min-w-0">
    <button
      onClick={(e) => { e.stopPropagation(); onSelect(task); }}
      className={`text-sm min-w-0 text-left rounded px-1 -mx-1 leading-snug line-clamp-2 hover:bg-slate-100/70 focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus:outline-none ${isDone ? "line-through text-slate-500" : "text-slate-800"} ${hasSubtasks ? "font-semibold" : ""}`}
      title={task.title}
    >
      {task.title}
    </button>
    {task.nextAction && (
      <span className="text-xs text-slate-400 truncate px-1">
        {task.nextAction}
      </span>
    )}
  </span>
</span>
```

- [ ] **Step 2: Verify in browser**

Open http://localhost:3000. Open a task detail, add text to the "Next action" field (will be done in Task 3 — for now use the API or SQLite to set a value), return to list and confirm the second line appears.

Alternatively, temporarily hardcode `task.nextAction` to a test string to verify layout, then revert.

- [ ] **Step 3: Commit**

```bash
git add src/components/tasks/TaskItem.tsx
git commit -m "feat: show next action as second line in task list"
```

---

### Task 3: Add next action field to task detail modal

**Files:**
- Modify: `src/components/tasks/TaskDetail.tsx`

**Interfaces:**
- Consumes: `Task.nextAction?: string | null` from Task 1
- Consumes: `save(patch)` function already in TaskDetail.tsx (line 58)

- [ ] **Step 1: Add state and blur handler**

In `src/components/tasks/TaskDetail.tsx`, find the existing state declarations (around lines 30-50). Add `nextAction` state and its blur handler alongside the existing `title` pattern:

After the `title` state line, add:
```typescript
const [nextAction, setNextAction] = useState(task?.nextAction ?? "");
```

After `handleTitleBlur`, add:
```typescript
async function handleNextActionBlur() {
  if (task && nextAction !== (task.nextAction ?? "")) await save({ nextAction: nextAction || null });
}
```

Also update the `useEffect` that resets form state when `task?.id` changes. Locate it (around line 45-56) and add `nextAction` reset:
```typescript
useEffect(() => {
  if (task) {
    setTitle(task.title);
    setDescription(task.description ?? "");
    setNextAction(task.nextAction ?? "");
  }
}, [task?.id]); // eslint-disable-line react-hooks/exhaustive-deps
```

- [ ] **Step 2: Add the input field between title and description**

In the left column of the modal body (around line 176), insert the Next action input between the title `<input>` and the Description `<div>`:

```tsx
<input
  aria-label="Next action"
  value={nextAction}
  onChange={(e) => setNextAction(e.target.value)}
  onBlur={handleNextActionBlur}
  className="w-full text-sm text-slate-700 focus:outline-none border-b border-transparent focus:border-indigo-400 pb-1 transition-colors placeholder:text-slate-400"
  placeholder="What's the next action?"
/>
```

- [ ] **Step 3: Verify end-to-end in browser**

1. Open http://localhost:3000
2. Click a task to open detail modal
3. Type text in the "What's the next action?" field and click outside — confirm "Saved" flash appears
4. Close modal — confirm next action appears as second line under title in task list
5. Reopen task, clear the field, click outside — confirm second line disappears in list
6. Open a task that has never had a next action — confirm no blank second line

- [ ] **Step 4: Commit**

```bash
git add src/components/tasks/TaskDetail.tsx
git commit -m "feat: next action input in task detail modal"
```
