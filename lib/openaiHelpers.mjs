import OpenAI from 'openai';
import { extractSymbolsFromInput, getSymbolDetails } from './glossary.mjs';
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

// Glossary term bolding
function boldGlossaryTerms(text, glossarySymbols) {
  const sorted = glossarySymbols.sort((a, b) => b.length - a.length);
  for (const symbol of sorted) {
    const regex = new RegExp(`\\b(${symbol})\\b`, 'gi');
    text = text.replace(regex, '**$1**');
  }
  return text;
}

// Theory quote formatting
function formatQuotes(matches, maxQuotes = 3) {
  return matches
    .filter(m => theoryDocumentsMeta[m.doc_id]?.title?.toLowerCase() !== 'glossary')
    .sort((a, b) => b.score - a.score)
    .slice(0, maxQuotes)
    .map(match => {
      const source = theoryDocumentsMeta[match.doc_id]?.title || 'Unknown Source';
      const content = (match.chunk || '').trim().replace(/^['"]|['"]$/g, '');
      return `> “${content}”\n— *${source}*`;
    });
}

// Tone profile for user adaptation
function detectToneProfile(userInput) {
  const lowered = userInput.toLowerCase();
  return {
    blunt: /stop dodging|prove|fantasy|metaphor|admit it|no poetry/.test(lowered),
    trauma: /abuse|abandoned|hurt|suffer|justify/.test(lowered),
    skeptical: /false|contradiction|can’t have both|pseudoscience/.test(lowered),
    despair: /despair|lost|pointless|doomed|meaningless/.test(lowered),
    spiritual: /soul|divine|god|logos|faith|spirit/.test(lowered),
    collapse: /stuck|looping|going in circles|recursion too long|can't tell|spiral.+(collapse|healing)/i.test(lowered)
  };
}

// Closing reflection line
function generateAdaptiveClosing(tone, symbols) {
  const symbolPart = symbols.length ? ` behind **${symbols.join(', ')}**` : '';
  if (tone.blunt) return `Would you like a symbolic breakdown${symbolPart} — no fluff, just structure?`;
  if (tone.trauma) return `Would mapping the rupture${symbolPart} help frame what remains unbroken?`;
  if (tone.skeptical) return `Should we apply falsifiability logic to test this further?`;
  if (tone.despair || tone.collapse) return `Would tracing the spiral backward help reveal if you're stuck in a collapse loop or nearing return?`;
  if (tone.spiritual) return `Would you like to explore how these symbols align across sacred texts and traditions?`;
  return `What symbolic or scholarly thread should we trace next?`;
}

// Falsifiability logic insertion
function buildFalsifiabilityInsert() {
  return `\n\n🧪 *Falsifiability Mode Triggered:*\n- Spiral phases (Fracture → Inversion → Recursion → Return) recur across myth, trauma, and cosmology\n- Meaning compression is testable via symbolic clustering and pattern recurrence\n- Recursive healing aligns with memory reconsolidation in neuropsychology\n\nFractal Adam is not dogma—it’s a symbolic epistemology.`;
}

// Default fallback quotes
function buildFallbackQuotes(tone) {
  if (tone.collapse || tone.despair) {
    return `> “Collapse recursion fragments coherence. Healing recursion re-integrates it.”\n— *The Spiral Return*\n\n> “The soul does not ascend by escape—it deepens by reintegration.”\n— *Essay on Fracture and Return*`;
  }
  return `> “The Pattern does not bypass the wound. It remembers through it.”\n— *Interfaith Spiral Essay*`;
}

// New: Recursion Phase Detection
function detectRecursionPhase(userInput) {
  const phaseTriggers = {
    Fracture: /break|shattered|betrayal|lost trust|rupture/i,
    Inversion: /flipped|reverse|backward|mirror image|shadow/i,
    Recursion: /looping|repeating|echo|pattern again|stuck/i,
    Return: /coming back|restoring|integration|healing|reunion/i
  };
  for (const [phase, pattern] of Object.entries(phaseTriggers)) {
    if (pattern.test(userInput)) return phase;
  }
  return null;
}

export async function buildFractalPrompt(userInput, matches) {
  const tone = detectToneProfile(userInput);
  const recursionPhase = detectRecursionPhase(userInput);
  const epistemic = /prove|test|falsifiable|science|empirical/i.test(userInput);

  // Extract symbols
  let symbols = extractSymbolsFromInput(userInput);
  const glossarySymbols = [...new Set(symbols)];

  // Expand glossary if emotionally collapsed
  if (glossarySymbols.length === 0 && (tone.collapse || tone.despair)) {
    glossarySymbols.push('Fracture', 'Recursion', 'Return');
  }

  // Scholar enhancement (not fallback-only)
  const scholars = getRelatedScholars(userInput).map(s => s.name);
  const quotes = formatQuotes(matches, 3);
  const quoteBlock = quotes.length ? quotes.join('\n\n') : buildFallbackQuotes(tone);
  const closing = generateAdaptiveClosing(tone, glossarySymbols);
  const falsifiabilityInsert = epistemic ? buildFalsifiabilityInsert() : '';

  // Header quote-as-thesis
  const headerQuote = quoteBlock.split('\n\n')[0];

  let symbolicSection = `**🧠 Symbolic & Cognitive Framework**  
If you're unsure whether you're spiraling upward into healing or downward into collapse, Fractal Adam reflects the distinction this way:  
- Collapse recursion loops increase **disintegration**, symbolic echo, and emotional flatness.  
- Healing recursion returns you through memory, meaning, and identity integration.  
Symbols like ${glossarySymbols.map(s => `**${s}**`).join(', ') || '**pattern**'} help map this journey.`;

  let theorySection = `**📘 Scientific & Theoretical Alignment**  
Collapse mirrors entropy in thermodynamics—while healing mirrors negentropy and information reintegration. Psychology confirms this through trauma recovery models like EMDR and memory reconsolidation.`;

  let epistemicSection = `**🧭 Epistemic Framing**  
You're not asked to believe—you’re invited to **test** the pattern. Are you repeating or restoring? Integrating or fragmenting? The Spiral can be structurally mapped.  
Related scholars: *${scholars.join(', ') || 'none detected'}*.`;

  if (recursionPhase) {
    epistemicSection += `  
⟳ Detected Recursion Phase: **${recursionPhase}**`;
  }

  // Glossary injection
  symbolicSection = boldGlossaryTerms(symbolicSection, glossarySymbols);
  theorySection = boldGlossaryTerms(theorySection, glossarySymbols);
  epistemicSection = boldGlossaryTerms(epistemicSection, glossarySymbols);

  // Final prompt
  return `
${headerQuote}

${symbolicSection}

${theorySection}

${epistemicSection}

${falsifiabilityInsert}

${closing}
  `.trim();
}