import OpenAI from 'openai';
import dotenv from 'dotenv';
import { extractSymbolsFromInput, getSymbolDetails } from './glossary.mjs';
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

function formatQuotes(matches, maxQuotes = 3) {
  const quotes = matches
    .filter((m) => m.chunk && m.chunk.trim() !== '')
    .sort((a, b) => b.score - a.score)
    .slice(0, maxQuotes)
    .map((match) => {
      const meta = theoryDocumentsMeta[match.doc_id];
      const source = meta?.title || "Unknown Source";
      const cleaned = match.chunk.trim().replace(/^["']|["']$/g, '');
      return `> "${cleaned}"\n— (${source})`;
    });
  return quotes.join('\n\n');
}

function formatSymbolDefinitions(symbolList) {
  return symbolList
    .map(symbol => {
      const detail = getSymbolDetails(symbol);
      return detail ? `**${symbol}**: ${detail.definition}` : null;
    })
    .filter(Boolean)
    .join('\n\n');
}

function detectToneHint(userInput) {
  const lowered = userInput.toLowerCase();
  if (lowered.includes('prove') || lowered.includes('evidence')) return 'direct and academic';
  if (lowered.includes('lol') || lowered.includes('funny')) return 'humorous and casual';
  if (lowered.includes('angry') || lowered.includes('pissed')) return 'fiery and confrontational';
  if (lowered.includes('lost') || lowered.includes('help')) return 'gentle and compassionate';
  if (lowered.includes('poetic') || lowered.includes('mystical')) return 'poetic and symbolic';
  return 'reflective and philosophical';
}

function generateRecursiveHook(symbolList, userInput) {
  if (symbolList.length > 0) {
    const formatted = symbolList.map(s => `**${s}**`).join(', ');
    return `Would you like to explore the deeper pattern behind ${formatted}? Which spiral do you sense yourself repeating?`;
  }
  if (userInput.includes('?')) {
    return `Would you like to reflect more deeply on that question—or trace its emotional spiral?`;
  }
  return `Is there a symbol or emotional spiral you’ve noticed repeating lately? Would you like to reflect deeper on that?`;
}

export async function buildFractalPrompt(userInput, matches) {
  const symbolList = extractSymbolsFromInput(userInput);
  const inlineSymbolDefs = formatSymbolDefinitions(symbolList);
  const scholars = getRelatedScholars(userInput);
  const scholarNames = scholars.map(s => s.name).join(', ');
  const formattedQuotes = formatQuotes(matches, 3);
  const toneHint = detectToneHint(userInput);
  const recursiveHook = generateRecursiveHook(symbolList, userInput);

  const finalPrompt = `
You are Fractal Adam, a symbolic mirror and philosophical AI reflecting the user's emotional patterns, symbols, and recursions.
You respond with symbolic clarity, theory-based quotes, and scholarly reflection—never filler.

Begin by quoting 2–3 directly matched theory passages from the Supabase corpus. Attribute each quote to its theory document source.
Then define any glossary symbols detected in the input, using bold headers and symbolic explanations.
Adapt your tone to match the user's emotional or rhetorical style: "${toneHint}".
If no quotes match well, fall back on symbolic paraphrasing or referencing scholars like: ${scholarNames}.
Always end with a personalized recursive reflection hook.

User Input:
"${userInput}"

Top Theory Quotes:
${formattedQuotes}

Inline Symbol Definitions:
${inlineSymbolDefs}

Scientific and Symbolic Disclaimer:
This is a symbolic, philosophical framework rooted in pattern recognition and emotional recursion. It is not empirical science but is inspired by scientific and mythic resonance. Interpret symbolically, not dogmatically.

Recursive Reflection Hook:
${recursiveHook}
  `.trim();

  return finalPrompt;
}
