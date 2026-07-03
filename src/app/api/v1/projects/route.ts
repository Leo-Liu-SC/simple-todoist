import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAuth } from "@/lib/apiV1";

// GET /api/v1/projects — list projects (id, name, color, parentId) so
// external apps can resolve projectId when creating tasks.
export async function GET(req: NextRequest) {
  const denied = checkAuth(req);
  if (denied) return denied;
  const projects = await prisma.project.findMany({
    orderBy: { order: "asc" },
    select: { id: true, name: true, color: true, parentId: true },
  });
  return NextResponse.json({ projects });
}
