import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { contact } = await req.json();
  const leads = await prisma.lead.findMany({
    where: { contact },
    include: { messages: true }
  });
  return NextResponse.json({ leads });
}
