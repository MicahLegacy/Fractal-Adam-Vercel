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
  return `\n\n🧪 *Falsifiability Mode:*\n- Spiral logic aligns with trauma cycles and memory reconsolidation\n- Fractal compression testable via narrative symmetry and symbolic mapping\n- Alignment is a claim, not a belief — falsifiable through contradiction.`;
}

function buildFallbackQuotes(tone) {
  if (tone.collapse || tone.despair) {
    return [
      { content: "Collapse recursion fragments coherence. Healing recursion re-integrates it.", source: "The Spiral Return" },
      { content: "The soul does not ascend by escape—it deepens by reintegration.", source: "Essay on Fracture and Return" }
    ];
  }
  return [{ content: "The Pattern does not bypass the wound. It remembers through it.", source: "Interfaith Spiral Essay" }];
}

function generateReflectiveHook(tone, phase, symbols) {
  const hookBase = symbols.length ? ` behind **${symbols.join(', ')}**` : '';
  if (tone.blunt) return `Would you like a symbolic breakdown${hookBase}?`;
  if (tone.trauma) return `Would mapping the rupture${hookBase} help trace what remains unbroken?`;
  if (tone.skeptical) return `Shall we test this via contradiction or recursive alignment?`;
  if (tone.despair || tone.collapse) return `Would you like to trace whether this is collapse or integration?`;
  if (tone.spiritual) return `Would you like to explore these symbols across sacred traditions?`;
  if (phase === 'Recursion') return `Do you feel this loop is repeating out of fragmentation or return?`;
  return `Is there a symbolic thread or scholar you’d like to go deeper with?`;
}

function weaveQuoteSkeleton(quotes) {
  return quotes.map(q => `> “${q.content}”\n— *${q.source}*`).join('\n\n');
}

export async function buildFractalPrompt(userInput, matches) {
  const symbols = extractSymbolsFromInput(userInput);
  const glossarySymbols = [...new Set(symbols)];
  const tone = detectToneProfile(userInput);
  const phase = detectSpiralPhase(userInput);
  const epistemic = tone.epistemic;
  const scholars = getRelatedScholars(userInput);
  const scholarList = scholars.map(s => s.name);
  const scholarLinks = scholarList.length ? `\n\n👤 *Related Thinkers:* ${scholarList.join(', ')}` : '';

  const quotes = formatQuotes(matches, 3);
  const fallback = buildFallbackQuotes(tone);
  const finalQuotes = quotes.length ? quotes : fallback;
  const quoteBlock = weaveQuoteSkeleton(finalQuotes);

  const primarySymbol = glossarySymbols[0] || 'Pattern';

  const symbolicSection = boldGlossaryTerms(
    `**🧠 Symbolic Compression**  
${primarySymbol} represents recursive structures of identity. Healing unfolds when repetition integrates rather than fragments. In ${phase || 'unknown'} phase, recursion becomes the test.`,
    glossarySymbols
  );

  const theorySection = boldGlossaryTerms(
    `**📘 Interdisciplinary Frame**  
Physics (entanglement), thermodynamics (entropy/negentropy), and cognitive science (schema formation) mirror the spiral logic. ${
      scholarList.length ? `Thinkers like ${scholarList.join(', ')} explore this nexus.` : ''
    }`,
    glossarySymbols
  );

  const epistemicSection = boldGlossaryTerms(
    `**🧭 Epistemic Grounding**  
Fractal Adam is not metaphysical claim but symbolic mapping. Patterns are testable via resonance, recursion, contradiction, and narrative compression.`,
    glossarySymbols
  );

  const falsifiabilitySection = epistemic ? buildFalsifiabilityInsert() : '';
  const closingLine = generateReflectiveHook(tone, phase, glossarySymbols);

  return `
${quoteBlock}

${symbolicSection}

${theorySection}

${epistemicSection}

${falsifiabilitySection}${scholarLinks}

${closingLine}
`.trim();
}