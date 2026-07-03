import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  if (!(await requireAuth(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const projectId = Number(id);
  const body = await req.json();

  const data: Record<string, unknown> = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.color !== undefined) data.color = body.color;
  if (body.order !== undefined) data.order = body.order;

  if (body.parentId !== undefined) {
    const newParent = body.parentId === null ? null : Number(body.parentId);
    if (newParent === projectId) {
      return NextResponse.json({ error: "A project cannot be its own parent" }, { status: 400 });
    }
    if (newParent !== null) {
      // Walk up from the proposed parent; if we reach this project, it's a cycle.
      const all = await prisma.project.findMany({ select: { id: true, parentId: true } });
      const byId = new Map(all.map((p) => [p.id, p.parentId]));
      let cursor: number | null = newParent;
      const seen = new Set<number>();
      while (cursor !== null && cursor !== undefined) {
        if (cursor === projectId) {
          return NextResponse.json({ error: "Cannot move a project under its own descendant" }, { status: 400 });
        }
        if (seen.has(cursor)) break;
        seen.add(cursor);
        cursor = byId.get(cursor) ?? null;
      }
    }
    data.parentId = newParent;
  }

  const project = await prisma.project.update({
    where: { id: projectId },
    data,
  });
  return NextResponse.json(project);
}

export async function DELETE(req: NextRequest, { params }: Params) {
  if (!(await requireAuth(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await prisma.project.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
