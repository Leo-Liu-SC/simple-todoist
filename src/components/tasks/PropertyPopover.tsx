"use client";
import { useEffect, useRef, useCallback, useState } from "react";

// Accessible popover-menu for the task detail Properties sidebar.
// - Trigger exposes aria-haspopup / aria-expanded and opens the menu.
// - Menu items are role="menuitem" with roving arrow-key focus, Home/End.
// - Escape closes the menu (only) and returns focus to the trigger; the
//   keydown stops propagating so the parent modal doesn't also close.
// - Clicking outside closes the menu.
export default function PropertyPopover({
  open,
  onOpenChange,
  label,
  trigger,
  menuLabel,
  children,
  menuWidthClass = "w-48",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  label: string;
  trigger: React.ReactNode;
  menuLabel: string;
  children: React.ReactNode;
  menuWidthClass?: string;
}) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [dropUp, setDropUp] = useState(false);

  const close = useCallback((restoreFocus: boolean) => {
    onOpenChange(false);
    if (restoreFocus) triggerRef.current?.focus();
  }, [onOpenChange]);

  // On open: flip the menu upward if it would overflow the viewport bottom,
  // then move focus to the first item.
  useEffect(() => {
    if (open) {
      const menu = menuRef.current;
      const trigger = triggerRef.current;
      if (menu && trigger) {
        const triggerBottom = trigger.getBoundingClientRect().bottom;
        const menuHeight = menu.offsetHeight;
        // The clipping boundary is the modal (overflow-hidden), not the
        // viewport — flip up if the menu would spill past the modal's bottom.
        const clip = trigger.closest('[role="dialog"]') ?? document.documentElement;
        const clipBottom = clip.getBoundingClientRect().bottom;
        setDropUp(triggerBottom + menuHeight + 12 > clipBottom);
      }
      const first = menu?.querySelector<HTMLElement>('[role="menuitem"], [role="menuitemcheckbox"]');
      first?.focus();
    } else {
      setDropUp(false);
    }
  }, [open]);

  function items(): HTMLElement[] {
    return Array.from(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"], [role="menuitemcheckbox"]') ?? []);
  }

  function onMenuKeyDown(e: React.KeyboardEvent) {
    const list = items();
    if (list.length === 0) return;
    const idx = list.indexOf(document.activeElement as HTMLElement);
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      close(true);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      list[Math.min(idx + 1, list.length - 1)].focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      list[Math.max(idx - 1, 0)].focus();
    } else if (e.key === "Home") {
      e.preventDefault();
      list[0].focus();
    } else if (e.key === "End") {
      e.preventDefault();
      list[list.length - 1].focus();
    } else if (e.key === "Tab") {
      // Keep focus within the menu; Tab closes it back to the trigger.
      e.preventDefault();
      close(true);
    }
  }

  function onTriggerKeyDown(e: React.KeyboardEvent) {
    if ((e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") && !open) {
      e.preventDefault();
      onOpenChange(true);
    }
  }

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        onClick={() => onOpenChange(!open)}
        onKeyDown={onTriggerKeyDown}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`${label}: change`}
        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-white hover:shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus:outline-none text-sm transition-all group"
      >
        {trigger}
      </button>
      <p className="px-3 text-[11px] text-slate-500 mt-0.5 mb-1.5">{label}</p>
      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => close(false)} aria-hidden="true" />
          <div
            ref={menuRef}
            role="menu"
            aria-label={menuLabel}
            onKeyDown={onMenuKeyDown}
            className={`absolute right-0 z-30 bg-white border border-slate-200 rounded-xl shadow-[var(--shadow-pop)] py-1.5 ${dropUp ? "bottom-12" : "top-12"} ${menuWidthClass}`}
          >
            <p className="px-3 pb-1 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{menuLabel}</p>
            {children}
          </div>
        </>
      )}
    </div>
  );
}
