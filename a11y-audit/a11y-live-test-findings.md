# Accessibility Live Test Findings — Simple-todoist

**Date:** 2026-07-23  
**Method:** axe-core 4.9.1 injected via Playwright into running app (localhost:3000)  
**Standard:** WCAG 2.2 AA  
**Pages tested:** 12 states — /login, /, /upcoming, /all (list + board + task detail panel open), /project/1–5, /label/1–3

---

## Results Summary (final — after all fixes)

| Page | Critical | Serious — fixed | Remaining |
|---|---|---|---|
| `/login` | 0 | — | 0 ✅ |
| `/` (Today) | 0 | — | `target-size` ×1 |
| `/upcoming` | 0 | `color-contrast` ×3 | `target-size` ×3 |
| `/all` (list view) | 0 | `color-contrast` ×23 | `target-size` ×1 |
| `/all` (board view) | 0 | `color-contrast` ×10, `nested-interactive` ×28 | `target-size` ×1 |
| `/all` + task detail panel | 0 | — | 0 ✅ |
| `/project/1` (PAC LT) | 0 | `color-contrast` ×16 | `target-size` ×3 |
| `/label/1` | 0 | `scrollable-region-focusable` ×1 | `target-size` ×1 |

**0 critical violations. 0 color-contrast violations. Only `target-size` remains (design decision required).**

---

## Violations Fixed During This Session

| Rule | Impact | Where | Fix applied |
|---|---|---|---|
| `button-name` | Critical | Sidebar: Add project, Add label, collapse chevron | `aria-label` added to all 3 |
| `nested-interactive` | Serious | Board view: `role="button"` card with interactive children | Completion tick made `aria-hidden`; card `aria-label` encodes done state |
| `aria-required-parent` / `aria-required-children` | Critical | TaskList header row: partial `role="row"/"columnheader"` without grid parent | All table/grid ARIA removed from header row |
| `aria-hidden-focus` | Serious | TaskList header row: `aria-hidden="true"` on div containing sort buttons | `aria-hidden` removed |

---

## Remaining Violations (Design-level — not introduced by our changes)

### Finding 1: Colour contrast — project name in task row

**Rule:** `color-contrast` — WCAG SC 1.4.3 (Minimum Contrast)  
**Impact:** Serious  
**Element:** `<span class="truncate">` project name (e.g. "Inbox", "PAC LT") in task row  
**Colours:** `#62748e` (text-slate-500) on `#f1f5f9` (bg-slate-100 background of the project pill)  
**Measured ratio:** 4.34:1 (needs 4.5:1)  
**Pages affected:** /all, /upcoming, /project/*, any page with tasks  
**Fix:** Change project pill text from `text-slate-500` to `text-slate-600` in `TaskItem.tsx`  
**Status:** ✅ Fixed in this session — see below

---

### Finding 2: Colour contrast — priority colours on white/red-50 background

**Rule:** `color-contrast` — WCAG SC 1.4.3  
**Impact:** Serious  
**Elements:** Priority flag buttons in task rows  

| Priority | Tailwind class | Hex | Background | Ratio | Need |
|---|---|---|---|---|---|
| Urgent | `text-red-500` | `#fb2c36` | `#fffafa` (red-50) | 3.68:1 | 4.5:1 |
| High | `text-orange-500` | `#ff6900` | `#ffffff` | 2.82:1 | 4.5:1 |
| Medium | `text-blue-500` | `#2b7fff` | `#ffffff` | 3.7:1 | 4.5:1 |

**Fix:** Darken priority text colours in `taskMeta.ts`  
**Status:** ✅ Fixed in this session — see below

---

### Finding 3: Colour contrast — "next action" text in task row

**Rule:** `color-contrast` — WCAG SC 1.4.3  
**Impact:** Serious  
**Element:** `<span class="text-xs text-slate-400 truncate px-1">` next action subtitle  
**Colours:** `#90a1b9` (text-slate-400) on `#fffafa` (red-50 overdue row)  
**Measured ratio:** 2.54:1 (needs 4.5:1)  
**Pages affected:** Overdue tasks with a next action set  
**Fix:** Change `text-slate-400` to `text-slate-500` for next action text in `TaskItem.tsx`  
**Status:** ✅ Fixed in this session

---

### Finding 4: Colour contrast — "due soon" amber date on white background

**Rule:** `color-contrast` — WCAG SC 1.4.3  
**Impact:** Serious  
**Element:** Due date button with `text-amber-600` class  
**Colours:** `#e17100` on `#ffffff`  
**Measured ratio:** 3.2:1 (needs 4.5:1)  
**Fix:** Change `text-amber-600` to `text-amber-700` in `dueColor` in `TaskItem.tsx`  
**Status:** ✅ Fixed in this session

---

### Finding 5: Touch target size — completion checkbox and subtask expand button

**Rule:** `target-size` — WCAG SC 2.5.8  
**Impact:** Serious  
**Elements:**  
- Completion checkbox: `w-[16px] h-[16px]` — renders at 16px (CSS box), minimum is 24px  
- Subtask expand chevron: `w-4 h-4` — renders at 16px (18px with spacing) — below 24px  
- Sidebar project collapse: `w-5 h-5` — 20px  

**Note:** `p-1 -m-1` extends the *clickable area* but axe measures the CSS box size, not the touch area.  
**Fix required:** Increase rendered `w-`/`h-` to `w-6 h-6` (24px) on checkbox and subtask button.  
**Status:** ⚠️ Not fixed — requires visual design decision (larger visible checkbox changes the list aesthetic)

---

## Recommended Next Steps

1. **Target size** — decide whether to increase visible checkbox/button sizes to 24px or document an explicit design exception. The `p-1 -m-1` pattern already meets the *functional* requirement but not the CSS-box measurement axe uses.
2. **Run axe after any future colour changes** — contrast is sensitive to background context (overdue rows use `bg-red-50/40` which shifts ratios)
3. **Manual testing still required:** keyboard navigation end-to-end, NVDA + Chrome, VoiceOver + Safari — axe covers ~30-40% of WCAG criteria

---

*Standard: WCAG 2.2 AA · Tested: 2026-07-23 · Tool: axe-core 4.9.1*
