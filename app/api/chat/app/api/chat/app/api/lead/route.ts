import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const LeadSchema = z.object({
  leadId: z.string(),
  name: z.string().optional(),
  contact: z.string().optional(),
  sector: z.string().optional(),
  goal: z.string().optional(),
  budget: z.string().optional(),
  timing: z.string().optional(),
  url: z.string().optional()
});

export async function POST(req: NextRequest) {
  const data = LeadSchema.parse(await req.json());
  const lead = await prisma.lead.update({ where: { id: data.leadId }, data });
  return NextResponse.json({ ok: true, lead });
}
