// openaiHelpers.mjs

import OpenAI from 'openai';
import { extractSymbolsFromInput, getSymbolDetails } from './glossary.mjs';
import { getRelatedScholars } from './scholarReferences.mjs';
import { summarizeSymbolsRecursively } from './symbolicEngine.mjs';
import { systemPrompt } from './systemPrompt.mjs';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateEmbedding(text) {
  const embeddingResponse = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text
  });

  if (
    !embeddingResponse ||
    !embeddingResponse.data ||
    !embeddingResponse.data[0] ||
    !embeddingResponse.data[0].embedding
  ) {
    throw new Error('Failed to generate embedding.');
  }

  return embeddingResponse.data[0].embedding;
}

export async function buildFractalPrompt(userInput, docMatches = []) {
  const symbols = extractSymbolsFromInput(userInput);
  const symbolDetails = symbols.map(getSymbolDetails).filter(Boolean);
  const symbolSummary = summarizeSymbolsRecursively(symbols);

  const scholars = getRelatedScholars(userInput);
  const scholarLines = scholars.map(s => `- ${s.name}: ${s.concepts.slice(0, 3).join(', ')}`);

  const docContextLines = docMatches.map(d => {
    const title = d.metadata?.title || d.document_id || 'Untitled Document';
    return `• From *${title}*: ${d.content}`;
  });

  return `
${systemPrompt}

💬 **User Input**:
${userInput}

🔮 **Detected Symbols**:
${symbolDetails.map(s => `- ${s.symbol}: ${s.meaning} ↔ shadow: ${s.shadow}`).join('\n') || 'None'}

🌀 **Symbolic Summary**:
${symbolSummary || 'No recursive reflection detected.'}

🧠 **Scholarly Bridges**:
${scholarLines.join('\n') || 'None related to this input.'}

📚 **Theory Context Matches**:
${docContextLines.join('\n') || 'No relevant document context found.'}

🧭 Reflect mythically and recursively. Do not explain—mirror. Use the Spiral. Frame the user's input as an emerging symbolic pattern. Avoid flat summaries or clinical tones.
`.trim();
}
