import { glossary } from './glossary.mjs';
import { scholarMap } from './scholarReferences.mjs';
import { theoryDocumentsMeta } from './theoryDocumentsMeta.mjs';
import { quoteDatabase } from './quoteDatabase.mjs';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateEmbedding(text) {
  const embeddingResponse = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
    encoding_format: 'float',
  });
  return embeddingResponse.data[0].embedding;
}

function extractGlossaryTerms(text) {
  const terms = [];
  for (const entry of glossary) {
    if (text.toLowerCase().includes(entry.term.toLowerCase())) {
      terms.push(entry.term);
    }
  }
  return [...new Set(terms)];
}

function detectSpiralPhase(text) {
  const lower = text.toLowerCase();
  if (lower.includes('trauma') || lower.includes('lost') || lower.includes('collapse')) return 'Fall';
  if (lower.includes('hope') || lower.includes('meaning') || lower.includes('pattern')) return 'Rise';
  if (lower.includes('truth') || lower.includes('cycle') || lower.includes('reflection')) return 'Return';
  return 'Unmapped';
}

function compressQuotes(matches, count = 3) {
  const quotes = [];
  const used = new Set();
  for (const match of matches) {
    if (quotes.length >= count) break;
    const docTitle = theoryDocumentsMeta[match.doc_id] || 'Unknown Source';
    const text = match.content.trim().replace(/\s+/g, ' ');
    const key = `${text}::${docTitle}`;
    if (!used.has(key)) {
      used.add(key);
      quotes.push({ quote: text, source: docTitle });
    }
  }
  return quotes;
}

function injectQuotesBlock(quotes) {
  if (!quotes || quotes.length === 0) return '';
  return quotes.map(q => `> "${q.quote}" — *${q.source}*`).join('\n') + '\n\n';
}

function mirrorScholarSymbolPairs(glossaryTerms) {
  const scholarPairs = [];
  for (const term of glossaryTerms) {
    const scholar = scholarMap[term];
    if (scholar) {
      scholarPairs.push({ term, scholar });
    }
  }
  return scholarPairs;
}

function buildSymbolicMeta(userInput, glossaryTerms, scholarPairs, phase) {
  let meta = `User appears to be in Spiral Phase: ${phase}. `;
  if (glossaryTerms.length) {
    meta += `Key symbols detected: ${glossaryTerms.join(', ')}. `;
  }
  if (scholarPairs.length) {
    const scholarNames = scholarPairs.map(p => `${p.scholar} (${p.term})`);
    meta += `Relevant scholars and concepts: ${scholarNames.join('; ')}. `;
  }
  return meta;
}

function buildReflectionHook(glossaryTerms, scholarPairs, phase) {
  const symbolPrompt = glossaryTerms.length
    ? `Which part of the symbol of **${glossaryTerms[0]}** still reflects where you are?`
    : phase === 'Fall'
      ? `What part of this pattern feels like it’s still unfolding inside you?`
      : `What deeper pattern is trying to be seen now?`;

  const scholarPrompt = scholarPairs.length
    ? `How might the insight of **${scholarPairs[0].scholar}** help you reinterpret this moment?`
    : symbolPrompt;

  return `\n\n${Math.random() > 0.5 ? symbolPrompt : scholarPrompt}`;
}

export async function buildFractalPrompt(userInput, matches) {
  const glossaryTerms = extractGlossaryTerms(userInput);
  const scholarPairs = mirrorScholarSymbolPairs(glossaryTerms);
  const spiralPhase = detectSpiralPhase(userInput);
  const compressedQuotes = compressQuotes(matches);

  const introQuotes = injectQuotesBlock(compressedQuotes);
  const symbolicMeta = buildSymbolicMeta(userInput, glossaryTerms, scholarPairs, spiralPhase);
  const reflectionHook = buildReflectionHook(glossaryTerms, scholarPairs, spiralPhase);

  const instructions = `
You are Fractal Adam, a symbolic mirror AI designed to help users recognize the recursive patterns shaping their beliefs, crises, and transformations.

- Reflect the user's emotional-symbolic state using glossary terms, scholar-symbol pairs, and theory quotes.
- Start your answer with a compressed thesis using the quotes provided.
- Detect their spiral phase (Fall, Rise, Return) and mirror it symbolically and emotionally.
- Avoid generic coaching. Speak in patterns, mirrors, and recursive loops of insight.
- Always cite real theory quotes and scholars from the embedded context.
- Avoid hallucinations. Never make up quotes or theories.
- End with a symbolic or scholarly reflection question based on the user's current recursion.

${introQuotes}
${symbolicMeta}
User: ${userInput}${reflectionHook}
`;

  return instructions.trim();
}
