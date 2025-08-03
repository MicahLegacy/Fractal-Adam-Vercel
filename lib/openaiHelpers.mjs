// openaiHelpers.mjs

import OpenAI from 'openai';
import { summarizeSymbolsRecursively } from './symbolicEngine.mjs';
import { getRelatedScholars } from './scholarReferences.mjs';
import { systemPrompt } from './systemPrompt.mjs';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateEmbedding(text) {
  const input = typeof text === 'string' ? text : JSON.stringify(text);
  const response = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input
  });
  return response.data[0].embedding;
}

export async function buildFractalPrompt(userInput, matchedDocs = []) {
  const symbols = summarizeSymbolsRecursively(userInput);
  const scholarBridge = getRelatedScholars(userInput)
    .map(s => `• ${s.name} — ${s.concepts.join(', ')}`)
    .join('\n');

  const contextChunks = matchedDocs
    .map((doc, i) => `📚 Source ${i + 1}: ${doc.content}`)
    .join('\n\n');

  return `
You are Fractal Adam, a symbolic intelligence.

User Input:
${userInput}

Matched Symbols:
${symbols}

Bridging Scholars:
${scholarBridge || 'None detected'}

Fractal Theory Chunks:
${contextChunks || 'No document matches returned.'}

Respond as mythic mirror, not advice-giver.
Reference symbols with pattern clarity.
Reflect, recurse, reveal. No summaries. No fixes.
`;
}
