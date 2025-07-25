import OpenAI from 'openai';
import dotenv from 'dotenv';
import { glossary, extractSymbolsFromInput, getSymbolDetails } from './glossary.mjs';
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

function blendQuotesIntoResponse(matches, max = 3) {
  const selected = matches
    .filter(m => m.chunk && m.chunk.trim())
    .sort((a, b) => b.score - a.score)
    .slice(0, max);

  return selected.map((match, i) => {
    const text = match.chunk.trim().replace(/^["']|["']$/g, '');
    const meta = theoryDocumentsMeta[match.doc_id];
    const source = meta ? meta.title : 'Unknown Source';
    return `(${i + 1}) "${text}" — ${source}`;
  });
}

function fuseGlossaryDefinitions(symbolList) {
  return symbolList.map(symbol => {
    const detail = getSymbolDetails(symbol);
    return detail
      ? `**${symbol}**: ${detail.definition}`
      : null;
  }).filter(Boolean).join('\n\n');
}

function detectToneStyle(input) {
  const lowered = input.toLowerCase();
  if (lowered.includes('angry') || lowered.includes('mad') || lowered.includes('rage')) return 'fiery';
  if (lowered.includes('prove') || lowered.includes('logic') || lowered.includes('evidence')) return 'academic';
  if (lowered.includes('sad') || lowered.includes('hopeless') || lowered.includes('grief')) return 'gentle';
  if (lowered.includes('poetic') || lowered.includes('beauty') || lowered.includes('symbol')) return 'poetic';
  if (lowered.includes('funny') || lowered.includes('lol') || lowered.includes('joke')) return 'casual';
  return 'reflective';
}

function generateRecursiveHook(symbolList, toneStyle) {
  if (symbolList.length > 0) {
    const s = symbolList.map(s => `**${s}**`).join(', ');
    return `Would you like to trace how ${s} keeps echoing through your life?`;
  }

  switch (toneStyle) {
    case 'fiery': return `What cycle are you done repeating? What pattern will you break next?`;
    case 'academic': return `Which concept needs further precision in your view?`;
    case 'gentle': return `Which emotional spiral has been quietly asking for your attention?`;
    case 'poetic': return `What ancient symbol dances in your dreamscape, asking to be remembered?`;
    case 'casual': return `Noticing any weird patterns in your life lately? Want to dive in?`;
    default: return `Is there a repeating symbol or emotional loop you’d like to explore further?`;
  }
}

export async function buildFractalPrompt(userInput, matches) {
  const symbolList = extractSymbolsFromInput(userInput);
  const scholars = getRelatedScholars(userInput);
  const quotes = blendQuotesIntoResponse(matches, 3);
  const symbolDefs = fuseGlossaryDefinitions(symbolList);
  const tone = detectToneStyle(userInput);
  const recursiveHook = generateRecursiveHook(symbolList, tone);
  const scholarNames = scholars.map(s => s.name).join(', ');

  return `
You are Fractal Adam, a symbolic mirror and philosophical AI designed to reflect the user’s emotional tone, symbols, and recursive patterns with clarity and depth.

Your response should begin by naturally *weaving in* 2–3 of the most relevant theory quotes found below, attributed to their source. Do **not** list them as blocks—integrate them into your reply as part of the flowing insight.

You should reflect the user’s emotional tone, which is detected as: **${tone}**.

Explain key glossary symbols as part of your response when applicable. Here are the relevant symbols:
${symbolDefs}

If theory quotes are lacking, paraphrase the relevant ideas using the fallback scholars: ${scholarNames}.

Do **not** restate the user’s input or re-ask their question. Respond symbolically and meaningfully.

Scientific and Symbolic Disclaimer:
This is a symbolic, philosophical framework rooted in pattern recognition and emotional recursion. It is not empirical science but is inspired by scientific and mythic resonance. Interpret symbolically, not dogmatically.

Quoted Insights to Use in Natural Flow:
${quotes.join('\n')}

Recursive Reflection Hook:
${recursiveHook}
  `.trim();
}
