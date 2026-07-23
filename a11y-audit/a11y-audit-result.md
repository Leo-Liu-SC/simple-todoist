# Accessibility Audit — Simple-todoist

**Standard:** WCAG 2.2 AA · Framework: EN 301 549 · EAA Annex 1
**Date:** 2026-07-23
**Scanned:** Full source — 9 files (complete, all lines in scope)
**Tools:** axe not run · contrast not validated

---

## Summary

| Severity | Count |
|---|---|
| Blocker | 4 |
| High | 5 |
| Medium | 5 |
| Low | 0 |
| **Total** | **14** |

**ARIA usage:** ARIA attributes are used across multiple files. `PropertyPopover` and `AppShell` dialog patterns are well implemented. Remaining issues are concentrated in icon-only buttons and unlabelled inputs.

---

## Blockers

### Finding 1: Modal close button has no accessible name

**Impact:** Blocker
**Rule:** WCAG SC 4.1.2 — Name, Role, Value
**What was detected:** The close button in `Modal.tsx` contains only an `<X>` icon with no `aria-label`, `title`, or visually hidden text. Screen reader users will hear "button" with no indication of its purpose.
**Element / location:** `src/components/ui/Modal.tsx` line 18 — `<button onClick={onClose}><X size={18} /></button>`
**Diff scope:** full

**Fix:**
```diff
- <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
+ <button onClick={onClose} aria-label="Close" className="text-gray-400 hover:text-gray-600">
    <X size={18} aria-hidden="true" />
  </button>
```

---

### Finding 2: Modal container missing `role="dialog"`, `aria-modal`, `aria-labelledby`

**Impact:** Blocker
**Rule:** WCAG SC 4.1.2 — Name, Role, Value
**What was detected:** The modal container `<div>` has no `role="dialog"`, no `aria-modal="true"`, and no `aria-labelledby`. Screen readers will not announce it as a dialog and may read background content. Note: `AppShell.tsx` correctly implements this — this finding is specific to the reusable `Modal.tsx` used by ProjectForm, LabelForm, etc.
**Element / location:** `src/components/ui/Modal.tsx` line 16 — `<div className="relative bg-white rounded-xl...">`
**Diff scope:** full

**Fix:**
```diff
- <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
+ <div
+   role="dialog"
+   aria-modal="true"
+   aria-labelledby="modal-title"
+   className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6"
+ >
    <div className="flex items-center justify-between mb-4">
-     <h2 className="text-base font-semibold text-gray-900">{title}</h2>
+     <h2 id="modal-title" className="text-base font-semibold text-gray-900">{title}</h2>
```

Also add focus trap + focus restoration — model from `AppShell.tsx`'s `dialogRef`/`onDialogKeyDown` implementation.

---

### Finding 3: QuickAdd close button has no accessible name

**Impact:** Blocker
**Rule:** WCAG SC 4.1.2 — Name, Role, Value
**What was detected:** The dismiss button renders only `<X size={14} />` with no `aria-label` or title.
**Element / location:** `src/components/tasks/QuickAdd.tsx` — `<button type="button" onClick={onClose}><X size={14} /></button>`
**Diff scope:** full

**Fix:**
```diff
- <button type="button" onClick={onClose} className="...">
+ <button type="button" onClick={onClose} aria-label="Cancel" className="...">
    <X size={14} aria-hidden="true" />
  </button>
```

---

### Finding 4: Sort button uses `title` only — not reliably announced by screen readers

**Impact:** Blocker
**Rule:** WCAG SC 4.1.2 — Name, Role, Value
**What was detected:** The `<ArrowUpDown>` icon button uses `title="Sort & display options"`. `title` is not reliably announced by screen readers in all modes; `aria-label` is required.
**Element / location:** `src/components/tasks/TaskList.tsx` — `<button ... title="Sort & display options"><ArrowUpDown size={16} /></button>`
**Diff scope:** full

**Fix:**
```diff
- <button ... title="Sort & display options">
+ <button ... aria-label="Sort and display options">
    <ArrowUpDown size={16} aria-hidden="true" />
  </button>
```

---

## High

### Finding 5: Invisible subtask toggle remains in tab order when no subtasks exist

**Impact:** High
**Rule:** WCAG SC 4.1.2 — Name, Role, Value
**What was detected:** The chevron expand button uses `invisible` CSS class when `!hasSubtasks` — visually hidden but still in the DOM and tab order.
**Element / location:** `src/components/tasks/TaskItem.tsx` line 166
**Diff scope:** full

**Fix:**
```diff
  <button
    onClick={(e) => { e.stopPropagation(); if (hasSubtasks) setSubtaskExpanded(!subtaskExpanded); }}
-   className={`w-4 h-4 ... ${!hasSubtasks ? "invisible" : ""}`}
+   className={`w-4 h-4 ... ${!hasSubtasks ? "invisible" : ""}`}
+   tabIndex={!hasSubtasks ? -1 : undefined}
+   aria-hidden={!hasSubtasks}
    title={subtaskExpanded ? "Collapse subtasks" : "Expand subtasks"}
  >
```

---

### Finding 6: QuickAdd "when" input has no label

**Impact:** High
**Rule:** WCAG SC 3.3.2 — Labels or Instructions
**What was detected:** Natural-language date input uses `placeholder` only — no `<label>`, `aria-label`, or `aria-labelledby`. Placeholder disappears on input and is not reliably announced.
**Element / location:** `src/components/tasks/QuickAdd.tsx` — `<input value={whenText} placeholder="when… e.g. tomorrow" />`
**Diff scope:** full

**Fix:**
```diff
+ <label htmlFor="quickadd-when" className="sr-only">When (due date)</label>
  <input
+   id="quickadd-when"
    value={whenText}
    placeholder="when… e.g. tomorrow"
    ...
  />
```

---

### Finding 7: QuickAdd priority `<select>` has no label

**Impact:** High
**Rule:** WCAG SC 3.3.2 — Labels or Instructions
**What was detected:** Priority select has no `<label>`, `aria-label`, or `aria-labelledby`.
**Element / location:** `src/components/tasks/QuickAdd.tsx` — `<select value={priority} onChange={...}>`
**Diff scope:** full

**Fix:**
```diff
+ <label htmlFor="quickadd-priority" className="sr-only">Priority</label>
  <select
+   id="quickadd-priority"
    value={priority}
    ...
  >
```

---

### Finding 8: TaskList search input has no label — placeholder only

**Impact:** High
**Rule:** WCAG SC 3.3.2 — Labels or Instructions
**What was detected:** Search input uses `placeholder="Search…"` only. The `<Search>` icon is `pointer-events-none` and not in the accessibility tree.
**Element / location:** `src/components/tasks/TaskList.tsx` — `<input value={search} placeholder="Search…" />`
**Diff scope:** full

**Fix:**
```diff
  <input
+   aria-label="Search tasks"
    value={search}
    placeholder="Search…"
    ...
  />
```

---

### Finding 9: Login page — password label not programmatically associated with input

**Impact:** High
**Rule:** WCAG SC 1.3.1 — Info and Relationships / WCAG SC 3.3.2
**What was detected:** `<label>Password</label>` has no `for`/`htmlFor`. The `<input type="password">` has no `id`. Visually adjacent but not programmatically linked.
**Element / location:** `src/app/login/page.tsx`
**Diff scope:** full

**Fix:**
```diff
- <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
+ <label htmlFor="login-password" className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
  <input
+   id="login-password"
    type="password"
    ...
  />
```

---

## Medium

### Finding 10: Completion checkbox button is 16×16px — below 24×24px minimum

**Impact:** Medium
**Rule:** WCAG SC 2.5.8 — Target Size (Minimum)
**What was detected:** Task completion button sized `w-[16px] h-[16px]`. WCAG 2.5.8 requires at least 24×24px or adequate spacing.
**Element / location:** `src/components/tasks/TaskItem.tsx` line 174
**Diff scope:** full

**Fix:**
```diff
  <button
    onClick={toggleDone}
-   className={`w-[16px] h-[16px] rounded border-2 ...`}
+   className={`w-[16px] h-[16px] rounded border-2 ... p-1 -m-1`}
+   aria-label={isDone ? "Mark as to-do" : "Mark as done"}
  >
```
`p-1 -m-1` extends the hit area to 24×24px without layout shift.

---

### Finding 11: "Mark complete" toggle missing `aria-pressed` — SKY-006

**Impact:** Medium
**Rule:** WCAG SC 4.1.2 — Name, Role, Value · SKY-006
**What was detected:** The complete-toggle button has no `aria-pressed` — screen readers cannot determine current state programmatically.
**Element / location:** `src/components/tasks/TaskDetail.tsx`
**Diff scope:** full

**Fix:**
```diff
  <button
+   aria-pressed={task.status === "done"}
    onClick={toggleComplete}
    ...
  >
```

---

### Finding 12: "Show completed" toggle missing `aria-pressed` — SKY-006

**Impact:** Medium
**Rule:** WCAG SC 4.1.2 — Name, Role, Value · SKY-006
**What was detected:** CSS-only toggle pill with no `aria-pressed` or `role="switch"`.
**Element / location:** `src/components/tasks/TaskList.tsx`
**Diff scope:** full

**Fix:**
```diff
  <button
+   aria-pressed={showCompleted}
+   aria-label={`Show completed tasks: ${showCompleted ? "on" : "off"}`}
    onClick={toggleCompleted}
    ...
  >
```

---

### Finding 13: Column header row has no grid/table semantics

**Impact:** Medium
**Rule:** WCAG SC 1.3.1 — Info and Relationships
**What was detected:** Column header row is a plain `<div>` with CSS grid. No `role="row"` / `role="columnheader"`. Screen readers cannot associate task data with column headers.
**Element / location:** `src/components/tasks/TaskList.tsx` — sticky header div + `TaskItem.tsx` rows
**Diff scope:** full

**Fix (advisory — design decision needed):**
Add `role="columnheader"` to header `<span>` elements and `role="row"` to the header container. Full table semantics or `role="grid"` is the more complete fix.

---

### Finding 14: Due date urgency communicated by colour alone

**Impact:** Medium
**Rule:** WCAG SC 1.4.1 — Use of Colour
**What was detected:** `dueColor` logic uses red/amber/green text only. No non-colour indicator distinguishes overdue from "due soon" from "within a week".
**Element / location:** `src/components/tasks/TaskItem.tsx` — `dueColor` and red left-border `<span>`
**Diff scope:** full

**Fix:**
```diff
  // Add a visually hidden label for overdue items:
  {task.dueDate && duePast && (
+   <span className="sr-only">Overdue: </span>
  )}
```

---

### Finding 15: Toast container has no `aria-live` region — SKY-022

**Impact:** Medium
**Rule:** WCAG SC 4.1.3 — Status Messages · SKY-022
**What was detected:** Toast container has no `role="status"` or `aria-live`. "Task completed" / "Task deleted" toasts are not announced to screen reader users.
**Element / location:** `src/lib/ToastContext.tsx` — `<div className="fixed bottom-5 ...">`
**Diff scope:** full

**Fix:**
```diff
  <div
+   role="status"
+   aria-live="polite"
+   aria-atomic="true"
    className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[100] ..."
  >
```

---

## Machine-readable findings

```json
[
  { "file": "src/components/ui/Modal.tsx", "line": 18, "ruleId": null, "wcag": "4.1.2", "severity": "Blocker", "title": "Modal close button has no accessible name", "diffScope": "full" },
  { "file": "src/components/ui/Modal.tsx", "line": 16, "ruleId": null, "wcag": "4.1.2", "severity": "Blocker", "title": "Modal container missing role=dialog, aria-modal, aria-labelledby", "diffScope": "full" },
  { "file": "src/components/tasks/QuickAdd.tsx", "line": null, "ruleId": null, "wcag": "4.1.2", "severity": "Blocker", "title": "QuickAdd close button has no accessible name", "diffScope": "full" },
  { "file": "src/components/tasks/TaskList.tsx", "line": null, "ruleId": null, "wcag": "4.1.2", "severity": "Blocker", "title": "Sort button uses title only — not reliably announced by screen readers", "diffScope": "full" },
  { "file": "src/components/tasks/TaskItem.tsx", "line": 166, "ruleId": null, "wcag": "4.1.2", "severity": "High", "title": "Invisible subtask toggle remains in tab order when no subtasks exist", "diffScope": "full" },
  { "file": "src/components/tasks/QuickAdd.tsx", "line": null, "ruleId": null, "wcag": "3.3.2", "severity": "High", "title": "QuickAdd 'when' input has no label", "diffScope": "full" },
  { "file": "src/components/tasks/QuickAdd.tsx", "line": null, "ruleId": null, "wcag": "3.3.2", "severity": "High", "title": "QuickAdd priority select has no label", "diffScope": "full" },
  { "file": "src/components/tasks/TaskList.tsx", "line": null, "ruleId": null, "wcag": "3.3.2", "severity": "High", "title": "Search input has no label — placeholder only", "diffScope": "full" },
  { "file": "src/app/login/page.tsx", "line": null, "ruleId": null, "wcag": "1.3.1", "severity": "High", "title": "Password label not programmatically associated with input", "diffScope": "full" },
  { "file": "src/components/tasks/TaskItem.tsx", "line": 174, "ruleId": null, "wcag": "2.5.8", "severity": "Medium", "title": "Completion checkbox button is 16x16px — below 24x24px minimum", "diffScope": "full" },
  { "file": "src/components/tasks/TaskDetail.tsx", "line": null, "ruleId": "SKY-006", "wcag": "4.1.2", "severity": "Medium", "title": "Mark complete toggle button missing aria-pressed", "diffScope": "full" },
  { "file": "src/components/tasks/TaskList.tsx", "line": null, "ruleId": "SKY-006", "wcag": "4.1.2", "severity": "Medium", "title": "Show completed toggle missing aria-pressed or role=switch", "diffScope": "full" },
  { "file": "src/components/tasks/TaskList.tsx", "line": null, "ruleId": null, "wcag": "1.3.1", "severity": "Medium", "title": "Column header row has no grid/table semantics", "diffScope": "full" },
  { "file": "src/components/tasks/TaskItem.tsx", "line": null, "ruleId": null, "wcag": "1.4.1", "severity": "Medium", "title": "Due date urgency communicated by colour alone", "diffScope": "full" },
  { "file": "src/lib/ToastContext.tsx", "line": null, "ruleId": "SKY-022", "wcag": "4.1.3", "severity": "Medium", "title": "Toast container has no aria-live region", "diffScope": "full" }
]
```

---

## Next steps

1. **Blockers** — fix before any merge; post in #accessibility on Slack
2. **High** — fix in same sprint; unblocks keyboard and screen reader users from core flows (login, task creation, search)
3. **Medium** — schedule in next sprint
4. **Run axe:** `npx axe-cli http://localhost:3000` to catch additional automated findings
5. **Manual testing:** keyboard-tab full task list + detail panel; NVDA + Chrome; VoiceOver + Safari; 200% text zoom
6. **Lived-experience testing:** contact Heather Hepburn for the Disabled Testing Panel for critical flows

---

*Standard: WCAG 2.2 AA · Framework: EN 301 549 · EAA Annex 1 · Skill owner: Heather Hepburn*
