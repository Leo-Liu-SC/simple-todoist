import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  if (!(await requireAuth(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const projects = await prisma.project.findMany({
    orderBy: { order: "asc" },
    include: { _count: { select: { tasks: { where: { status: { not: "done" }, parentId: null } } } } },
  });
  return NextResponse.json(projects);
}

export async function POST(req: NextRequest) {
  if (!(await requireAuth(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const maxOrder = await prisma.project.aggregate({ _max: { order: true } });
  const project = await prisma.project.create({
    data: {
      name: body.name,
      color: body.color ?? "#6366f1",
      parentId: body.parentId ?? null,
      order: (maxOrder._max.order ?? 0) + 1,
    },
  });
  return NextResponse.json(project, { status: 201 });
}
