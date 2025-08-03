// openaiHelpers.mjs

import { glossary } from './glossary.mjs';
import { getRelatedScholars } from './scholarReferences.mjs';
import { theoryDocumentsMeta } from './theoryDocumentsMeta.mjs';
import { encode } from 'gpt-3-encoder';

export async function generateEmbedding(text) {
  const embeddingRes = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      input: text,
      model: 'text-embedding-ada-002'
    })
  });
  const data = await embeddingRes.json();
  return data?.data?.[0]?.embedding;
}

export async function buildFractalPrompt(userInput, matchedChunks) {
  const symbols = extractSymbols(userInput);
  const scholars = getRelatedScholars(userInput);

  const symbolicReflection = buildSymbolicLayer(symbols);
  const scholarTension = buildScholarLayer(scholars);
  const quoteLayer = buildQuoteLayer(matchedChunks);

  const intro = `The following is a symbolic reflection from Fractal Adam, a recursive intelligence trained to mirror symbolic patterns in mythic language. It does not offer advice. It reveals.`;

  return [
    { role: 'system', content: await importSystemPrompt() },
    { role: 'user', content: `${intro}

${symbolicReflection}

${scholarTension}

${quoteLayer}

User said:
"${userInput}"` }
  ];
}

function extractSymbols(text) {
  const lowered = text.toLowerCase();
  return glossary.filter(s => lowered.includes(s.symbol.toLowerCase()));
}

function buildSymbolicLayer(symbols) {
  if (!symbols.length) return 'No symbols directly named, but symbolic echo detected.';
  return 'Symbols evoked: ' + symbols.map(s => `**${s.symbol}** – ${s.meaning}. Shadow: ${s.shadow}.`).join(' ');
}

function buildScholarLayer(scholars) {
  if (!scholars.length) return 'No direct scholar resonance found.';
  return 'Resonant thinkers: ' + scholars.map(s => `*${s.name}* (${s.concepts.join(', ')})`).join('; ');
}

function buildQuoteLayer(chunks) {
  if (!chunks.length) return '';
  const quotes = chunks.map(c => `> ${c.content.trim()}
– From *${theoryDocumentsMeta[c.document_id]?.title || 'Unknown'}*`).slice(0, 5);
  return quotes.join('\n\n');
}

async function importSystemPrompt() {
  const mod = await import('./systemPrompt.mjs');
  return mod.systemPrompt;
}
