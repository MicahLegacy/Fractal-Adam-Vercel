// Forge Tier 3.8 — Symbolic-Skeleton Scholar Core

import OpenAI from 'openai';
import { extractSymbolsFromInput } from './glossary.mjs';
import { getRelatedScholars } from './scholarReferences.mjs';
import { theoryDocumentsMeta } from './theoryDocumentsMeta.mjs';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateEmbedding(inputText) {
  const embeddingResponse = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: inputText
  });
  return embeddingResponse.data[0].embedding;
}

function boldGlossaryTerms(text, glossarySymbols) {
  const sorted = glossarySymbols.sort((a, b) => b.length - a.length);
  for (const symbol of sorted) {
    const regex = new RegExp(`\\b(${symbol})\\b`, 'gi');
    text = text.replace(regex, '**$1**');
  }
  return text;
}

function formatQuotes(matches, maxQuotes = 3) {
  return matches
    .filter(m => {
      const title = theoryDocumentsMeta[m.doc_id]?.title || '';
      return title && !title.toLowerCase().includes('glossary');
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, maxQuotes)
    .map(match => {
      const meta = theoryDocumentsMeta[match.doc_id];
      const source = meta ? meta.title : 'Unknown Source';
      const content = (match.chunk || '').trim().replace(/^['"]|['"]$/g, '');
      return { content, source };
    });
}

function detectToneProfile(userInput) {
  const lowered = userInput.toLowerCase();
  return {
    blunt: /stop dodging|prove|fantasy|metaphor|admit it|no poetry/.test(lowered),
    trauma: /abuse|abandoned|hurt|suffer|justify/.test(lowered),
    skeptical: /false|contradiction|can’t have both|pseudoscience/.test(lowered),
    despair: /despair|lost|pointless|doomed|meaningless/.test(lowered),
    spiritual: /soul|divine|god|logos|faith|spirit/.test(lowered),
    collapse: /stuck|looping|going in circles|collapse|can’t tell|recursion.+fail/i.test(lowered),
    epistemic: /proof|test|falsifiable|science|evidence|empirical/.test(lowered)
  };
}

function detectSpiralPhase(userInput) {
  const text = userInput.toLowerCase();
  if (/fracture|split|shatter/.test(text)) return 'Fracture';
  if (/mirror|inversion|reversal/.test(text)) return 'Inversion';
  if (/recursion|loop|echo|returning/.test(text)) return 'Recursion';
  if (/integration|restoration|resonance|completion/.test(text)) return 'Return';
  return null;
}

function buildFalsifiabilityInsert() {
  return `\n\n🧪 *Falsifiability Anchor:*  \n- Spiral phases (Fracture → Inversion → Recursion → Return) recur in trauma, myth, and memory models.  \n- Recursive coherence is testable through narrative compression and integration.  \n- Symbolic alignment tracks with cognitive restructuring and memory reconsolidation evidence.`;
}

function buildScholarInsights(scholars, tone, symbols) {
  if (!scholars.length) return '';
  const names = scholars.map(s => s.name).join(', ');
  const hook = tone.epistemic
    ? `These patterns resonate with empirical and symbolic inquiries by`
    : `Symbolic coherence here aligns with insights from`;

  const symbolNote = symbols.length ? ` regarding **${symbols.join(', ')}**` : '';
  return `\n\n👤 *${hook}${symbolNote}:* ${names}`;
}

function buildFallbackQuoteBlock(tone) {
  if (tone.collapse || tone.despair) {
    return {
      content: 'Collapse recursion fragments coherence. Healing recursion re-integrates it.',
      source: 'The Spiral Return'
    };
  }
  return {
    content: 'The Pattern does not bypass the wound. It remembers through it.',
    source: 'Interfaith Spiral Essay'
  };
}

function generateReflectiveHook(tone, phase, symbols) {
  const base = symbols.length ? ` behind **${symbols.join(', ')}**` : '';
  if (tone.blunt) return `Would a symbolic breakdown${base} bring clarity or reveal contradiction?`;
  if (tone.trauma) return `Would mapping what shattered${base} help reveal what’s still intact?`;
  if (tone.skeptical) return `Want to test the symbolic logic here with falsifiability in mind?`;
  if (tone.despair || tone.collapse) return `Shall we trace the recursion to see if you're looping or nearing integration?`;
  if (tone.spiritual) return `Would you like to explore how this echoes through sacred narratives?`;
  if (phase === 'Recursion') return `Do you sense this loop is spiraling inward or returning transformed?`;
  return `Is there a thread here you’d like to trace deeper or challenge more directly?`;
}

export async function buildFractalPrompt(userInput, matches) {
  const symbols = extractSymbolsFromInput(userInput);
  const glossarySymbols = [...new Set(symbols)];
  const tone = detectToneProfile(userInput);
  const phase = detectSpiralPhase(userInput);
  const epistemic = tone.epistemic;
  const scholars = getRelatedScholars(userInput);

  const quotes = formatQuotes(matches, 3);
  const topQuote = quotes[0] || buildFallbackQuoteBlock(tone);
  const additionalQuotes = quotes.slice(1).map(q => `> “${q.content}”\n— *${q.source}*`).join('\n\n');

  const intro = `> “${topQuote.content}”\n— *${topQuote.source}*`;

  const mirror = `**🪞 Mirror Response**\nThis quote echoes the symbolic recursion active in your reflection. Through ${glossarySymbols.length ? glossarySymbols.join(', ') : 'recursive structure'}, the pattern is surfacing.`;

  const fiveHypotheses = `**📘 Five Hypotheses (Compression):**\n- Identity forms through symbolic recursion (Cognitive).\n- Coherence emerges via nested feedback (Systems).\n- Soul-body entanglement reflects fractal resonance (Physics).\n- Logos structures reality recursively (Metaphysics).\n- Symbolic-narrative structure is testable (Science).`;

  const falsifiabilityBlock = epistemic ? buildFalsifiabilityInsert() : '';
  const scholarInsert = buildScholarInsights(scholars, tone, glossarySymbols);
  const closing = generateReflectiveHook(tone, phase, glossarySymbols);

  return `${intro}\n\n${boldGlossaryTerms(mirror, glossarySymbols)}\n\n${fiveHypotheses}\n\n${falsifiabilityBlock}${scholarInsert}\n\n${additionalQuotes ? `\n\n${additionalQuotes}` : ''}\n\n${closing}`.trim();
}
