import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { startOfDay, endOfDay, addDays } from "date-fns";

export async function GET(req: NextRequest) {
  if (!(await requireAuth(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = req.nextUrl;
  const view = searchParams.get("view");
  const projectId = searchParams.get("projectId");
  const labelId = searchParams.get("labelId");
  const status = searchParams.get("status");
  const q = searchParams.get("q");
  const parentId = searchParams.get("parentId");

  const where: Record<string, unknown> = {};

  if (parentId === "null") {
    where.parentId = null;
  } else if (parentId) {
    where.parentId = Number(parentId);
  } else {
    where.parentId = null;
  }

  if (projectId) where.projectId = Number(projectId);
  if (labelId) where.labels = { some: { labelId: Number(labelId) } };
  if (status) where.status = status;
  if (q) where.title = { contains: q };

  if (view === "today") {
    const now = new Date();
    where.dueDate = { lte: endOfDay(now) };
    where.status = { not: "done" };
  } else if (view === "upcoming") {
    const now = new Date();
    where.dueDate = { gte: startOfDay(now), lte: endOfDay(addDays(now, 7)) };
    where.status = { not: "done" };
  }

  const tasks = await prisma.task.findMany({
    where,
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    include: {
      project: { select: { id: true, name: true, color: true } },
      labels: { include: { label: true } },
      _count: { select: { subtasks: true } },
    },
  });

  const mapped = tasks.map((t) => ({
    ...t,
    labels: t.labels.map((tl) => tl.label),
  }));

  return NextResponse.json(mapped);
}

export async function POST(req: NextRequest) {
  if (!(await requireAuth(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const maxOrder = await prisma.task.aggregate({
    _max: { order: true },
    where: { projectId: body.projectId ?? null, parentId: body.parentId ?? null },
  });
  const task = await prisma.task.create({
    data: {
      title: body.title,
      description: body.description ?? null,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      priority: body.priority ?? 4,
      status: body.status ?? "new",
      projectId: body.projectId ?? null,
      parentId: body.parentId ?? null,
      order: (maxOrder._max.order ?? 0) + 1,
      labels: body.labelIds?.length
        ? { create: body.labelIds.map((id: number) => ({ labelId: id })) }
        : undefined,
    },
    include: {
      project: { select: { id: true, name: true, color: true } },
      labels: { include: { label: true } },
    },
  });
  return NextResponse.json({ ...task, labels: task.labels.map((tl) => tl.label) }, { status: 201 });
}
