import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAuth } from "@/lib/apiV1";

// GET /api/v1/labels — list labels so external apps can resolve labelIds.
export async function GET(req: NextRequest) {
  const denied = checkAuth(req);
  if (denied) return denied;
  const labels = await prisma.label.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, color: true },
  });
  return NextResponse.json({ labels });
}
