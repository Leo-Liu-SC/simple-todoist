import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  if (!(await requireAuth(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const labels = await prisma.label.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(labels);
}

export async function POST(req: NextRequest) {
  if (!(await requireAuth(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const label = await prisma.label.create({
    data: { name: body.name, color: body.color ?? "#6366f1" },
  });
  return NextResponse.json(label, { status: 201 });
}
