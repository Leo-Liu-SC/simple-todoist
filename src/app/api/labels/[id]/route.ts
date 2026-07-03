import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  if (!(await requireAuth(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const label = await prisma.label.update({
    where: { id: Number(id) },
    data: { name: body.name, color: body.color },
  });
  return NextResponse.json(label);
}

export async function DELETE(req: NextRequest, { params }: Params) {
  if (!(await requireAuth(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await prisma.label.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
