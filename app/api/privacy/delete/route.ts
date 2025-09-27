import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { contact } = await req.json();
  await prisma.message.deleteMany({ where: { lead: { contact } } });
  await prisma.lead.deleteMany({ where: { contact } });
  return NextResponse.json({ ok: true });
}
