import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { openai } from "@/lib/openai";
import { SYSTEM_PROMPT } from "@/lib/prompts";
import { searchRelevant } from "@/lib/rag";


const BodySchema = z.object({
message: z.string().min(1),
leadId: z.string().optional(),
consent: z.boolean().optional()
});


function cors() {
const origins = (process.env.LYLOBOT_ALLOWED_ORIGINS || "*").split(",").map(s=>s.trim());
return {
"Access-Control-Allow-Origin": origins.includes("*") ? "*" : origins[0] || "*",
"Access-Control-Allow-Headers": "content-type",
"Access-Control-Allow-Methods": "POST, OPTIONS"
};
}


export async function OPTIONS() { return NextResponse.json({}, { headers: cors() }); }


export async function POST(req: NextRequest) {
try {
const json = await req.json();
const { message, leadId, consent } = BodySchema.parse(json);


let lead = leadId ? await prisma.lead.findUnique({ where: { id: leadId } }) : null;
if (!lead) lead = await prisma.lead.create({ data: { consent: !!consent } });
if (typeof consent === "boolean" && consent !== lead.consent) {
await prisma.lead.update({ where: { id: lead.id }, data: { consent } });
}


await prisma.message.create({ data: { leadId: lead.id, role: "user", content: message } });


const contextDocs = await searchRelevant(message, 4);
const context = contextDocs.map(d => `# ${d.title}\n${d.text}`).join("\n\n");


const completion = await openai.chat.completions.create({
model: "gpt-4o-mini",
temperature: 0.3,
messages: [
{ role: "system", content: SYSTEM_PROMPT },
{ role: "system", content: `Contexto (docs internos):\n${context}` },
{ role: "user", content: message }
]
});


const reply = completion.choices[0]?.message?.content?.trim() || "Gracias, ¿te apetece agendar una llamada?";


await prisma.message.create({ data: { leadId: lead.id, role: "assistant", content: reply } });


return NextResponse.json({ reply, leadId: lead.id }, { headers: cors() });
} catch (e: any) {
return NextResponse.json({ error: e.message }, { status: 400, headers: cors() });
}
}
