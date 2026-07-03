import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAuth, badRequest, serializeTask, VALID_STATUSES } from "@/lib/apiV1";

type Params = { params: Promise<{ id: string }> };

// GET /api/v1/tasks/[id] — fetch one task (with subtasks).
export async function GET(req: NextRequest, { params }: Params) {
  const denied = checkAuth(req);
  if (denied) return denied;
  const { id } = await params;

  const task = await prisma.task.findUnique({
    where: { id: Number(id) },
    include: {
      project: { select: { id: true, name: true, color: true } },
      labels: { include: { label: true } },
      subtasks: { orderBy: { order: "asc" }, include: { labels: { include: { label: true } } } },
    },
  });
  if (!task) return NextResponse.json({ error: "Task not found." }, { status: 404 });

  return NextResponse.json({
    task: {
      ...serializeTask(task),
      subtasks: task.subtasks.map(serializeTask),
    },
  });
}

// PATCH /api/v1/tasks/[id] — update fields (commonly status).
// Body: any of { title, description, dueDate, priority, status, projectId, labelIds }
export async function PATCH(req: NextRequest, { params }: Params) {
  const denied = checkAuth(req);
  if (denied) return denied;
  const { id } = await params;
  const taskId = Number(id);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return badRequest("Invalid JSON body.");
  }

  const existing = await prisma.task.findUnique({ where: { id: taskId } });
  if (!existing) return NextResponse.json({ error: "Task not found." }, { status: 404 });

  const data: Record<string, unknown> = {};
  if (body.title !== undefined) data.title = String(body.title);
  if (body.description !== undefined) data.description = body.description;
  if (body.dueDate !== undefined) data.dueDate = body.dueDate ? new Date(body.dueDate as string) : null;
  if (body.projectId !== undefined) data.projectId = body.projectId;

  if (body.priority !== undefined) {
    if (![1, 2, 3, 4].includes(Number(body.priority))) {
      return badRequest("'priority' must be 1 (urgent) – 4 (none).");
    }
    data.priority = Number(body.priority);
  }
  if (body.status !== undefined) {
    if (!VALID_STATUSES.includes(body.status as never)) {
      return badRequest(`Invalid status. Valid: ${VALID_STATUSES.join(", ")}`);
    }
    data.status = body.status;
  }

  if (body.labelIds !== undefined && Array.isArray(body.labelIds)) {
    await prisma.taskLabel.deleteMany({ where: { taskId } });
    if (body.labelIds.length > 0) {
      await prisma.taskLabel.createMany({
        data: (body.labelIds as number[]).map((lid) => ({ taskId, labelId: lid })),
      });
    }
  }

  const task = await prisma.task.update({
    where: { id: taskId },
    data,
    include: {
      project: { select: { id: true, name: true, color: true } },
      labels: { include: { label: true } },
    },
  });

  return NextResponse.json({ task: serializeTask(task) });
}

// DELETE /api/v1/tasks/[id]
export async function DELETE(req: NextRequest, { params }: Params) {
  const denied = checkAuth(req);
  if (denied) return denied;
  const { id } = await params;
  const existing = await prisma.task.findUnique({ where: { id: Number(id) } });
  if (!existing) return NextResponse.json({ error: "Task not found." }, { status: 404 });
  await prisma.task.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
