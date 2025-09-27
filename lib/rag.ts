import { prisma } from "./db";
import { openai } from "./openai";

export async function embed(text: string): Promise<Float32Array> {
  const r = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text
  });
  return new Float32Array(r.data[0].embedding);
}

export async function addDoc(title: string, text: string, url?: string) {
  const emb = await embed(text);
  await prisma.doc.create({ data: { title, text, url, embedding: Buffer.from(emb.buffer) } });
}

function cosine(a: Float32Array, b: Float32Array) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i]*b[i]; na += a[i]*a[i]; nb += b[i]*b[i]; }
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export async function searchRelevant(query: string, k = 4) {
  const q = await embed(query);
  const docs = await prisma.doc.findMany({ take: 200 });
  const scored = docs.map(d => ({
    doc: d,
    score: cosine(q, new Float32Array(Buffer.from(d.embedding).buffer))
  })).sort((a,b)=>b.score-a.score).slice(0,k);
  return scored.map(s => s.doc);
}
