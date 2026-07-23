# Accessibility Issues Found — Simple-todoist

**Date:** 2026-07-23  
**Total found:** 27 — all fixed  
**Standard:** WCAG 2.2 AA · SKY rules · EAA Annex 1  
**Method:** Static analysis (accessibility:detect skill) + live axe-core 4.9.1 scan (12 pages)

---

## Blockers (4) — Static analysis

| # | Issue | File |
|---|---|---|
| 1 | Modal close button has no accessible name | `src/components/ui/Modal.tsx` |
| 2 | Modal container missing `role="dialog"`, `aria-modal`, `aria-labelledby` | `src/components/ui/Modal.tsx` |
| 3 | QuickAdd close button has no accessible name | `src/components/tasks/QuickAdd.tsx` |
| 4 | Sort button uses `title` only — not reliably announced by screen readers | `src/components/tasks/TaskList.tsx` |

---

## High (5) — Static analysis

| # | Issue | File |
|---|---|---|
| 5 | Invisible subtask toggle remains in tab order when no subtasks exist | `src/components/tasks/TaskItem.tsx` |
| 6 | QuickAdd "when" input has no label | `src/components/tasks/QuickAdd.tsx` |
| 7 | QuickAdd priority select has no label | `src/components/tasks/QuickAdd.tsx` |
| 8 | Search input has no label — placeholder only | `src/components/tasks/TaskList.tsx` |
| 9 | Password label not programmatically associated with input | `src/app/login/page.tsx` |

---

## Medium (6) — Static analysis

| # | Issue | File |
|---|---|---|
| 10 | Completion checkbox button below 24×24px minimum (WCAG 2.5.8) | `src/components/tasks/TaskItem.tsx` |
| 11 | Mark-complete toggle missing `aria-pressed` (SKY-006) | `src/components/tasks/TaskDetail.tsx` |
| 12 | Show-completed toggle missing `aria-pressed` (SKY-006) | `src/components/tasks/TaskList.tsx` |
| 13 | Column header row has no grid/table semantics (WCAG 1.3.1) | `src/components/tasks/TaskList.tsx` |
| 14 | Due date urgency communicated by colour alone (WCAG 1.4.1) | `src/components/tasks/TaskItem.tsx` |
| 15 | Toast container has no `aria-live` region (SKY-022) | `src/lib/ToastContext.tsx` |

---

## High (2) — Second-pass detect (post-fix review)

| # | Issue | File |
|---|---|---|
| 16 | `aria-hidden` on focusable button (subtask toggle) — SKY-024 | `src/components/tasks/TaskItem.tsx` |
| 17 | Modal missing focus trap and focus restoration on close (WCAG 2.4.3) | `src/components/ui/Modal.tsx` |

---

## Medium (3) — Second-pass detect (post-fix review)

| # | Issue | File |
|---|---|---|
| 18 | Show-completed toggle uses both `aria-pressed` AND dynamic `aria-label` — double-announcement SKY-006 | `src/components/tasks/TaskList.tsx` |
| 19 | Submit button uses `disabled` without `aria-disabled` — SKY-023 | `src/components/tasks/QuickAdd.tsx` |
| 20 | sr-only priority label outside input wrapper — reflow risk at high zoom (WCAG 1.4.10) | `src/components/tasks/QuickAdd.tsx` |

---

## Live axe-core scan findings (7)

Scanned via axe-core 4.9.1 injected into Playwright across 12 page states.

| # | Rule | Nodes | Pages affected | File(s) |
|---|---|---|---|---|
| 21 | `button-name` — unnamed icon buttons | 3 | All | `src/components/layout/Sidebar.tsx` |
| 22 | `nested-interactive` — interactive element inside `role="button"` card | 28 | `/all` board, `/project/*` board | `src/components/tasks/TaskCard.tsx` |
| 23 | `color-contrast` — priority colours (`text-red/orange/blue-500`) on white | 23+ | All with tasks | `src/lib/taskMeta.ts`, `src/components/tasks/TaskItem.tsx` |
| 24 | `color-contrast` — project pill `text-slate-500` on `bg-slate-100` (4.34:1) | Multiple | All with tasks | `src/components/tasks/TaskItem.tsx`, `src/components/tasks/BoardView.tsx`, `src/components/layout/Sidebar.tsx` |
| 25 | `color-contrast` — amber due date, overdue red, next action `text-slate-400` | Multiple | All with tasks | `src/components/tasks/TaskItem.tsx`, `src/components/tasks/TaskCard.tsx` |
| 26 | `scrollable-region-focusable` — board scroll container not keyboard reachable (WCAG 2.1.1) | 1 | `/all` board, `/project/*` board | `src/components/tasks/BoardView.tsx` |
| 27 | `target-size` — interactive elements below 24×24px CSS box (WCAG 2.5.8) | 25+ | All | `src/components/tasks/TaskItem.tsx`, `src/components/tasks/TaskCard.tsx`, `src/components/tasks/TaskList.tsx`, `src/components/layout/Sidebar.tsx` |

---

## Status

**All 27 issues fixed and pushed to `main`.**  
Final axe scan: **0 violations** across all 12 tested page states.

### Remaining manual testing required
axe-core covers ~30–40% of WCAG criteria. These flows still need human + AT verification:

- Keyboard tab order end-to-end through task list, QuickAdd, and Modal
- Modal focus trap and focus return to trigger on close
- Dynamic content announcements (toast, task complete/delete)
- NVDA + Chrome · VoiceOver + Safari
- 200% text zoom reflow
- Heather Hepburn / Disabled Testing Panel for critical flows

---

*Standard: WCAG 2.2 AA · SKY rules · EAA Annex 1 · Audited: 2026-07-23*
