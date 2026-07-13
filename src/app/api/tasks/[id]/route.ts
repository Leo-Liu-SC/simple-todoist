import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

// Build a nested subtask include `depth` levels deep.
function subtaskInclude(depth: number): object {
  const base = {
    orderBy: { order: "asc" as const },
    include: {
      labels: { include: { label: true } },
      _count: { select: { subtasks: true } },
    } as Record<string, unknown>,
  };
  if (depth > 1) {
    base.include.subtasks = subtaskInclude(depth - 1);
  }
  return base;
}

// Recursively flatten label join rows into plain Label[] on each task node.
function normalizeLabels<T extends { labels: { label: unknown }[]; subtasks?: unknown[] }>(node: T): unknown {
  const out: Record<string, unknown> = {
    ...node,
    labels: node.labels.map((tl) => tl.label),
  };
  if (Array.isArray(node.subtasks)) {
    out.subtasks = node.subtasks.map((st) => normalizeLabels(st as typeof node));
  }
  return out;
}

const SUBTASK_DEPTH = 3;

export async function GET(req: NextRequest, { params }: Params) {
  if (!(await requireAuth(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const task = await prisma.task.findUnique({
    where: { id: Number(id) },
    include: {
      project: { select: { id: true, name: true, color: true } },
      labels: { include: { label: true } },
      subtasks: subtaskInclude(SUBTASK_DEPTH),
    },
  });
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(normalizeLabels(task as never));
}

export async function PUT(req: NextRequest, { params }: Params) {
  if (!(await requireAuth(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();

  const updates: Record<string, unknown> = {};
  if (body.title !== undefined) updates.title = body.title;
  if (body.description !== undefined) updates.description = body.description;
  if (body.nextAction !== undefined) updates.nextAction = body.nextAction || null;
  if (body.dueDate !== undefined) updates.dueDate = body.dueDate ? new Date(body.dueDate) : null;
  if (body.priority !== undefined) updates.priority = body.priority;
  if (body.status !== undefined) updates.status = body.status;
  if (body.projectId !== undefined) updates.projectId = body.projectId;
  if (body.order !== undefined) updates.order = body.order;

  if (body.labelIds !== undefined) {
    await prisma.taskLabel.deleteMany({ where: { taskId: Number(id) } });
    if (body.labelIds.length > 0) {
      await prisma.taskLabel.createMany({
        data: body.labelIds.map((lid: number) => ({ taskId: Number(id), labelId: lid })),
      });
    }
  }

  const task = await prisma.task.update({
    where: { id: Number(id) },
    data: updates,
    include: {
      project: { select: { id: true, name: true, color: true } },
      labels: { include: { label: true } },
      subtasks: subtaskInclude(SUBTASK_DEPTH),
    },
  });
  return NextResponse.json(normalizeLabels(task as never));
}

export async function DELETE(req: NextRequest, { params }: Params) {
  if (!(await requireAuth(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await prisma.task.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
