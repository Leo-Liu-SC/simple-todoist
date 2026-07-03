import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

// POST body: { items: [{ id: number, order: number }, ...] }
export async function POST(req: NextRequest) {
  if (!(await requireAuth(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const items: { id: number; order: number }[] = body.items ?? [];
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "items required" }, { status: 400 });
  }
  await prisma.$transaction(
    items.map((it) =>
      prisma.task.update({ where: { id: it.id }, data: { order: it.order } })
    )
  );
  return NextResponse.json({ ok: true });
}
