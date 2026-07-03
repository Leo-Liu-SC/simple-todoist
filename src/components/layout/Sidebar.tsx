"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CalendarDays, Star, List, Plus, MoreHorizontal,
  Pencil, Trash2, LogOut, Tag, ChevronRight, ChevronDown, CheckCircle2,
} from "lucide-react";
import { useProjects, deleteProject } from "@/hooks/useProjects";
import { useLabels, deleteLabel } from "@/hooks/useLabels";
import ProjectForm from "@/components/projects/ProjectForm";
import LabelForm from "@/components/projects/LabelForm";
import { Project, Label } from "@/lib/types";

function NavItem({ href, icon: Icon, label, count, color, indentIcon }: {
  href: string; icon: React.ElementType; label: string; count?: number; color?: string; indentIcon?: boolean;
}) {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link
      href={href}
      className={`group/nav relative flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm transition-all ${
        active
          ? "bg-white text-slate-900 font-semibold shadow-[0_1px_2px_0_rgb(15_23_42/0.06)] ring-1 ring-slate-200/70"
          : "text-slate-600 hover:bg-slate-200/50 hover:text-slate-900"
      } ${indentIcon ? "pl-5" : ""}`}
    >
      {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-0.5 rounded-full bg-indigo-500" />}
      <Icon size={16} style={{ color: color ?? (active ? "#4f46e5" : undefined) }} />
      <span className="flex-1 truncate">{label}</span>
      {count !== undefined && count > 0 && (
        <span className={`text-xs tabular-nums ${active ? "text-slate-400" : "text-slate-400"}`}>{count}</span>
      )}
    </Link>
  );
}

export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const { projects } = useProjects();
  const { labels } = useLabels();
  const [projectForm, setProjectForm] = useState<"new" | Project | null>(null);
  const [labelForm, setLabelForm] = useState<"new" | Label | null>(null);
  const [menuOpen, setMenuOpen] = useState<{ type: "project" | "label"; id: number } | null>(null);
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set());
  const router = useRouter();

  const childrenOf = (parentId: number | null) =>
    projects.filter((p) => (p.parentId ?? null) === parentId);

  const toggleCollapse = (id: number) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  async function handleLogout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
  }

  async function handleDeleteProject(id: number) {
    if (confirm("Delete this project and all its tasks?")) {
      await deleteProject(id);
      setMenuOpen(null);
    }
  }

  async function handleDeleteLabel(id: number) {
    if (confirm("Delete this label?")) {
      await deleteLabel(id);
      setMenuOpen(null);
    }
  }

  const isMenuOpen = (type: "project" | "label", id: number) =>
    menuOpen?.type === type && menuOpen.id === id;

  const toggleMenu = (type: "project" | "label", id: number) =>
    setMenuOpen(isMenuOpen(type, id) ? null : { type, id });

  function renderProject(p: Project, depth: number): React.ReactNode {
    const kids = childrenOf(p.id);
    const hasKids = kids.length > 0;
    const isCollapsed = collapsed.has(p.id);
    return (
      <div key={p.id}>
        <div className="relative group flex items-center">
          {hasKids ? (
            <button
              onClick={() => toggleCollapse(p.id)}
              className="absolute z-10 text-gray-300 hover:text-gray-500"
              style={{ left: depth * 14 + 2 }}
            >
              {isCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
            </button>
          ) : null}
          <div className="flex-1" style={{ paddingLeft: depth * 14 }}>
            <NavItem
              href={`/project/${p.id}`}
              icon={() => <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: p.color }} />}
              label={p.name}
              count={p._count?.tasks}
              indentIcon={hasKids}
            />
          </div>
          <div className="absolute right-1 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center z-20">
            <button
              onClick={() => toggleMenu("project", p.id)}
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60"
            >
              <MoreHorizontal size={14} />
            </button>
          </div>
          {isMenuOpen("project", p.id) && (
            <div className="absolute right-0 top-7 z-30 bg-white border border-slate-200 rounded-xl shadow-[var(--shadow-pop)] py-1 min-w-32">
              <button
                onClick={() => { setProjectForm(p); setMenuOpen(null); }}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
              >
                <Pencil size={13} /> Edit
              </button>
              <button
                onClick={() => handleDeleteProject(p.id)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 w-full text-left"
              >
                <Trash2 size={13} /> Delete
              </button>
            </div>
          )}
        </div>
        {hasKids && !isCollapsed && kids.map((c) => renderProject(c, depth + 1))}
      </div>
    );
  }

  return (
    <aside className="flex flex-col h-full w-full bg-slate-50 border-r border-slate-200">
      <div className="px-4 py-3.5 border-b border-slate-200/80">
        <div className="flex items-center gap-2.5">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm">
            <CheckCircle2 size={16} strokeWidth={2.5} />
          </span>
          <span className="font-semibold text-slate-900 text-[17px] tracking-tight">Tasks</span>
        </div>
      </div>

      {menuOpen && (
        <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />
      )}

      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
        <NavItem href="/" icon={CalendarDays} label="Today" />
        <NavItem href="/upcoming" icon={Star} label="Upcoming" />
        <NavItem href="/all" icon={List} label="All tasks" />

        <div className="pt-3 pb-1 px-3">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold text-slate-400 uppercase tracking-wider">Projects</span>
            <button
              onClick={() => setProjectForm("new")}
              className="text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 p-1 rounded-md transition-colors"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>

        {childrenOf(null).map((p) => renderProject(p, 0))}

        <div className="pt-3 pb-1 px-3">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold text-slate-400 uppercase tracking-wider">Labels</span>
            <button
              onClick={() => setLabelForm("new")}
              className="text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 p-1 rounded-md transition-colors"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>

        {labels.map((l: Label) => (
          <div key={l.id} className="relative group">
            <NavItem
              href={`/label/${l.id}`}
              icon={Tag}
              label={l.name}
              color={l.color}
            />
            <div className="absolute right-1 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center z-20">
              <button
                onClick={() => toggleMenu("label", l.id)}
                className="p-1 rounded text-gray-400 hover:text-gray-600"
              >
                <MoreHorizontal size={14} />
              </button>
            </div>
            {isMenuOpen("label", l.id) && (
              <div className="absolute right-0 top-7 z-30 bg-white border border-slate-200 rounded-xl shadow-[var(--shadow-pop)] py-1 min-w-32">
                <button
                  onClick={() => { setLabelForm(l); setMenuOpen(null); }}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
                >
                  <Pencil size={13} /> Edit
                </button>
                <button
                  onClick={() => handleDeleteLabel(l.id)}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                >
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            )}
          </div>
        ))}
      </nav>

      <div className="p-2 border-t border-slate-200/80">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-slate-500 hover:text-slate-900 hover:bg-slate-200/50 w-full transition-colors"
        >
          <LogOut size={15} /> Sign out
        </button>
      </div>

      {projectForm && (
        <ProjectForm
          project={projectForm === "new" ? undefined : projectForm}
          onClose={() => setProjectForm(null)}
        />
      )}
      {labelForm && (
        <LabelForm
          label={labelForm === "new" ? undefined : labelForm}
          onClose={() => setLabelForm(null)}
        />
      )}
    </aside>
  );
}
