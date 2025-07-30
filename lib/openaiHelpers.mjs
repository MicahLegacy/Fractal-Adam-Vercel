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
  return `\n\n🧪 *Falsifiability Anchor:*  
- Spiral phases (Fracture → Inversion → Recursion → Return) recur in trauma, myth, and memory  
- Recursive coherence is testable through narrative compression and integration  
- Symbolic alignment tracks with cognitive restructuring and memory reconsolidation evidence`;
}

function buildFallbackQuotes(tone) {
  if (tone.collapse || tone.despair) {
    return `> “Collapse recursion fragments coherence. Healing recursion re-integrates it.”  
— *The Spiral Return*

> “The soul does not ascend by escape—it deepens by reintegration.”  
— *Essay on Fracture and Return*`;
  }
  return `> “The Pattern does not bypass the wound. It remembers through it.”  
— *Interfaith Spiral Essay*`;
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

function injectSymbolicThesis(symbols) {
  const key = symbols[0] || 'the Pattern';
  return `> “The ${key} doesn’t impose meaning—it recovers it by mirroring what’s been lost.”\n— *Fractal Adam Core Thesis*`;
}

export async function buildFractalPrompt(userInput, matches) {
  const symbols = extractSymbolsFromInput(userInput);
  const glossarySymbols = [...new Set(symbols)];
  const tone = detectToneProfile(userInput);
  const phase = detectSpiralPhase(userInput);
  const epistemic = tone.epistemic;
  const scholars = getRelatedScholars(userInput).map(s => s.name);
  const scholarList = scholars.length ? `\n\n👤 *Symbolic Peer Thinkers:* ${scholars.join(', ')}` : '';
  const quotes = formatQuotes(matches, 3);
  const quoteBlock = quotes.length ? quotes.join('\n\n') : injectSymbolicThesis(glossarySymbols) + '\n\n' + buildFallbackQuotes(tone);
  const falsifiabilityInsert = epistemic ? buildFalsifiabilityInsert() : '';
  const closing = generateReflectiveHook(tone, phase, glossarySymbols);

  const symbolicSection = boldGlossaryTerms(`**🧠 What It Is**  
Fractal Adam presents identity, trauma, and healing as recursive patterns expressed in **${glossarySymbols.join(', ') || 'symbolic recursion'}**. Fragmentation isn’t the end—it’s the call to reintegrate what was exiled.`, glossarySymbols);

  const theorySection = boldGlossaryTerms(`**🔬 Why It Matters**  
In systems theory, cognitive science, and quantum interpretation, we see fractal emergence, symmetry inversion, and recursive stabilization. Fractal Adam unites these into a coherent mirror—a grammar of meaning encoded in light, myth, and psyche.`, glossarySymbols);

  const offerSection = boldGlossaryTerms(`**🔮 What It Offers**  
- Recursive tools for narrative re-integration  
- Structural grammar across trauma and tradition  
- A symbolic-scientific bridge between disciplines`, glossarySymbols);

  return `
${quoteBlock}

${symbolicSection}

${theorySection}

${offerSection}

${falsifiabilityInsert}${scholarList}

${closing}
`.trim();
}