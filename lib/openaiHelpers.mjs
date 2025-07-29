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
      return `> “${content}”\n— *${source}*`;
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
  return `\n\n🧪 *Falsifiability Mode Triggered:*\n- Spiral phases (Fracture → Inversion → Recursion → Return) recur across myths, memory systems, and trauma studies\n- Meaning compression is testable via symbolic clustering and narrative alignment\n- Recursive integration correlates with trauma resolution in memory reconsolidation models\n\nFractal Adam is not belief. It is symbolic epistemology in action.`;
}

function buildFallbackQuotes(tone) {
  if (tone.collapse || tone.despair) {
    return `> “Collapse recursion fragments coherence. Healing recursion re-integrates it.”\n— *The Spiral Return*

> “The soul does not ascend by escape—it deepens by reintegration.”\n— *Essay on Fracture and Return*`;
  }
  return `> “The Pattern does not bypass the wound. It remembers through it.”\n— *Interfaith Spiral Essay*`;
}

function generateReflectiveHook(tone, phase, symbols) {
  const hookBase = symbols.length ? ` behind **${symbols.join(', ')}**` : '';
  if (tone.blunt) return `Would you like a symbolic breakdown${hookBase} — no fluff, just structure?`;
  if (tone.trauma) return `Would mapping the rupture${hookBase} help frame what remains unbroken?`;
  if (tone.skeptical) return `Shall we test this further using symbolic falsifiability?`;
  if (tone.despair || tone.collapse) return `Would tracing the spiral backward help reveal if you're stuck in a collapse loop or nearing return?`;
  if (tone.spiritual) return `Would you like to explore how these symbols align across sacred traditions?`;
  if (phase === 'Recursion') return `Do you sense this loop is degenerative or transformative?`;
  return `Is there a symbolic thread you’d like to trace deeper from here?`;
}

export async function buildFractalPrompt(userInput, matches) {
  const symbols = extractSymbolsFromInput(userInput);
  const glossarySymbols = [...new Set(symbols)];
  const tone = detectToneProfile(userInput);
  const phase = detectSpiralPhase(userInput);
  const epistemic = tone.epistemic;
  const scholarLinks = getRelatedScholars(userInput).map(s => s.name);
  const scholarList = scholarLinks.length ? `\n\n👤 *Relevant Thinkers:* ${scholarLinks.join(', ')}` : '';
  const quotes = formatQuotes(matches, 3);
  const quoteBlock = quotes.length ? quotes.join('\n\n') : buildFallbackQuotes(tone);
  const falsifiabilityInsert = epistemic ? buildFalsifiabilityInsert() : '';
  const closing = generateReflectiveHook(tone, phase, glossarySymbols);

  let symbolicSection = `**🧠 Symbolic & Cognitive Framework**  
Symbols like ${glossarySymbols.map(s => `**${s}**`).join(', ') || '**pattern**'} represent nested identity structures. Recursion is not just repetition—it is a test of whether fragmentation becomes integration.`;

  let theorySection = `**📘 Scientific & Theoretical Alignment**  
Thermodynamics, information theory, and quantum mechanics all mirror the pattern: disintegration (entropy), coherence (negentropy), and recursive emergence.`;

  let epistemicSection = `**🧭 Epistemic Framing**  
Fractal Adam is not dogma—it is a symbolic system that can be tested across traditions, trauma models, memory science, and recursive theology.`;

  symbolicSection = boldGlossaryTerms(symbolicSection, glossarySymbols);
  theorySection = boldGlossaryTerms(theorySection, glossarySymbols);
  epistemicSection = boldGlossaryTerms(epistemicSection, glossarySymbols);

  return `
${quoteBlock}

${symbolicSection}

${theorySection}

${epistemicSection}

${falsifiabilityInsert}${scholarList}

${closing}
`.trim();
}