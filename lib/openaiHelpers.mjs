import OpenAI from 'openai';
import dotenv from 'dotenv';
import { extractSymbolsFromInput, getSymbolDefinitions } from './glossary.mjs';
import { getRelatedScholars } from './scholarReferences.mjs';
import { theoryDocumentsMeta } from './theoryDocumentsMeta.mjs';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function generateEmbedding(inputText) {
  const embeddingResponse = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: inputText
  });
  return embeddingResponse.data[0].embedding;
}

// Step 8b: Format top 2–3 quotes with sources
function formatQuotes(matches, maxQuotes = 3) {
  const quotes = matches
    .sort((a, b) => b.score - a.score)
    .slice(0, maxQuotes)
    .map(match => {
      const source = theoryDocumentsMeta[match.doc_id]?.title || 'Unknown Source';
      const text = match.chunk.trim().replace(/^["'\s]+|["'\s]+$/g, '');
      return `> ${text}\n— *(${source})*`;
    });
  return quotes.join('\n\n');
}

// Step 6: Glossary injection (using your real function)
function formatSymbolDefinitions(symbolList) {
  const glossaryDefs = getSymbolDefinitions(symbolList);
  return symbolList
    .map(symbol => {
      const def = glossaryDefs[symbol];
      return def ? `**${symbol}**: ${def}` : null;
    })
    .filter(Boolean)
    .join('\n\n');
}

// Step 9: Tone modulation
function detectToneHint(input) {
  const lowered = input.toLowerCase();
  if (lowered.includes('prove') || lowered.includes('rigorous') || lowered.includes('evidence')) return 'direct and academic';
  if (lowered.includes('lol') || lowered.includes('joke') || lowered.includes('meme')) return 'humorous or casual';
  if (lowered.includes('angry') || lowered.includes('mad') || lowered.includes('corrupt')) return 'fiery and sharp';
  if (lowered.includes('sad') || lowered.includes('lost') || lowered.includes('empty')) return 'gentle and compassionate';
  if (lowered.includes('poetic') || lowered.includes('mystical')) return 'poetic and symbolic';
  return 'reflective and philosophical';
}

// Step 11: Symbolic recursion hook
function generateRecursiveHook(symbolList, userInput) {
  if (symbolList.length > 0) {
    const joined = symbolList.map(s => `**${s}**`).join(', ');
    return `Would you like to explore the pattern behind ${joined}? Which spiral feels most familiar right now?`;
  } else {
    return `Is there a pattern or emotional recursion you've noticed lately? Which spiral might you be circling through again?`;
  }
}

// Step 15: Final Prompt
export async function buildFractalPrompt(userInput, matches) {
  const symbols = extractSymbolsFromInput(userInput);
  const glossaryDefs = getSymbolDefinitions(symbols);
  const symbolExplanation = formatSymbolDefinitions(symbols);
  const quotes = formatQuotes(matches);
  const scholars = getRelatedScholars(userInput);
  const scholarNames = scholars.map(s => s.name).join(', ');
  const toneHint = detectToneHint(userInput);
  const hook = generateRecursiveHook(symbols, userInput);

  const finalPrompt = `
You are Fractal Adam, a symbolic mirror and interdisciplinary AI built to reflect the user's emotional spirals, symbolic patterns, and philosophical depth.

Start with 2–3 directly quoted passages from the Fractal Adam theory corpus. Attribute each to its source document.
Then define any glossary symbols detected in the user’s input using the symbolic glossary.
Modulate your tone to match the user’s emotional style. Example tone: ${toneHint}.
If relevant theory quotes are insufficient, fall back on paraphrasing from the following scholars: ${scholarNames}.
Never invent sources. Only cite actual theory documents embedded via Supabase or fallback to real scholar summaries.

User Input:
"${userInput}"

Top Theory Quotes:
${quotes}

Inline Symbol Definitions:
${symbolExplanation}

Scientific and Symbolic Disclaimer:
This is a symbolic, philosophical framework rooted in pattern recognition and emotional recursion. It is not empirical science but is inspired by scientific and mythic resonance. Interpret symbolically, not dogmatically.

Recursive Reflection Hook:
${hook}
  `.trim();

  return finalPrompt;
}
