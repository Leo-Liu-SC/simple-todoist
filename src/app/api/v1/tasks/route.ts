import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAuth, badRequest, serializeTask, VALID_STATUSES } from "@/lib/apiV1";

// GET /api/v1/tasks — list/query tasks.
// Query params: status, projectId, q (title search), includeDone (default true),
//               parentId ("null" for root only), limit (default 100, max 500).
export async function GET(req: NextRequest) {
  const denied = checkAuth(req);
  if (denied) return denied;

  const sp = req.nextUrl.searchParams;
  const where: Record<string, unknown> = {};

  const status = sp.get("status");
  if (status) {
    if (!VALID_STATUSES.includes(status as never)) {
      return badRequest(`Invalid status. Valid: ${VALID_STATUSES.join(", ")}`);
    }
    where.status = status;
  }

  const projectId = sp.get("projectId");
  if (projectId) where.projectId = Number(projectId);

  const q = sp.get("q");
  if (q) where.title = { contains: q };

  const parentId = sp.get("parentId");
  if (parentId === "null") where.parentId = null;
  else if (parentId) where.parentId = Number(parentId);

  if (sp.get("includeDone") === "false") where.status = { not: "done" };

  const limit = Math.min(Number(sp.get("limit")) || 100, 500);

  const tasks = await prisma.task.findMany({
    where,
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    take: limit,
    include: {
      project: { select: { id: true, name: true, color: true } },
      labels: { include: { label: true } },
      _count: { select: { subtasks: true } },
    },
  });

  return NextResponse.json({ tasks: tasks.map(serializeTask) });
}

// POST /api/v1/tasks — create a task.
// Body: { title (required), description?, dueDate?, priority? (1-4),
//         status?, projectId?, parentId?, labelIds?: number[] }
export async function POST(req: NextRequest) {
  const denied = checkAuth(req);
  if (denied) return denied;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return badRequest("Invalid JSON body.");
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) return badRequest("'title' is required.");

  if (body.status && !VALID_STATUSES.includes(body.status as never)) {
    return badRequest(`Invalid status. Valid: ${VALID_STATUSES.join(", ")}`);
  }
  if (body.priority !== undefined && ![1, 2, 3, 4].includes(Number(body.priority))) {
    return badRequest("'priority' must be 1 (urgent) – 4 (none).");
  }

  const maxOrder = await prisma.task.aggregate({
    _max: { order: true },
    where: { projectId: (body.projectId as number) ?? null, parentId: (body.parentId as number) ?? null },
  });

  const labelIds = Array.isArray(body.labelIds) ? (body.labelIds as number[]) : [];

  const task = await prisma.task.create({
    data: {
      title,
      description: (body.description as string) ?? null,
      dueDate: body.dueDate ? new Date(body.dueDate as string) : null,
      priority: (body.priority as number) ?? 4,
      status: (body.status as string) ?? "new",
      projectId: (body.projectId as number) ?? null,
      parentId: (body.parentId as number) ?? null,
      order: (maxOrder._max.order ?? 0) + 1,
      labels: labelIds.length ? { create: labelIds.map((id) => ({ labelId: id })) } : undefined,
    },
    include: {
      project: { select: { id: true, name: true, color: true } },
      labels: { include: { label: true } },
    },
  });

  return NextResponse.json({ task: serializeTask(task) }, { status: 201 });
}
