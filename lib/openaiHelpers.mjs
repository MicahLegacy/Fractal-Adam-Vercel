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

function injectSymbolicThesis(symbols) {
  const key = symbols[0] || 'the Pattern';
  return `> “The ${key} doesn’t impose meaning—it recovers it by mirroring what’s been lost.”\n— *Fractal Adam Core Thesis*`;
}

function insertScienceBridge(tone) {
  if (tone.spiritual && tone.epistemic) {
    return `\n\n🧬 *Symbol-Science Bridge:*  
These symbolic patterns appear in myth and scripture, but also map to scientific models:  
- **Memory reconsolidation** (trauma theory)  
- **Entropy reversal** (quantum and thermodynamic modeling)  
- **Pattern completion** (neuroscience & perception)`;
  }
  return '';
}

function generateReflectiveHook(tone, phase, symbols, conflictInsert) {
  if (conflictInsert) return `Could the tension between those symbols be a mirror of your own internal split?`;
  const hookBase = symbols.length ? ` behind **${symbols.join(', ')}**` : '';
  if (tone.blunt) return `Would you like a symbolic breakdown${hookBase} — no fluff, just structure?`;
  if (tone.trauma) return `Would mapping the rupture${hookBase} help frame what remains unbroken?`;
  if (tone.skeptical) return `Shall we test this further using symbolic falsifiability?`;
  if (tone.despair || tone.collapse) return `Is it possible this collapse is part of the loop, not its failure?`;
  if (tone.spiritual) return `Would you like to explore how these symbols align across sacred traditions?`;
  if (phase === 'Recursion') return `Do you sense this loop is degenerative or transformative?`;
  return `Is there a symbolic thread you’d like to trace deeper from here?`;
}

function detectSymbolConflict(symbols) {
  const polarityMap = {
    'Authority': 'Rebellion',
    'Order': 'Chaos',
    'Light': 'Shadow',
    'Freedom': 'Control',
    'Truth': 'Deception',
    'Masculine': 'Feminine',
    'Sacrifice': 'Desire',
    'Structure': 'Spontaneity',
    'Unity': 'Division'
  };

  for (const a of symbols) {
    for (const b of symbols) {
      if (a !== b && polarityMap[a] === b || polarityMap[b] === a) {
        return [a, b];
      }
    }
  }
  return null;
}

function renderSymbolConflictSection(conflictPair) {
  if (!conflictPair) return '';
  const [sym1, sym2] = conflictPair;
  return `\n\n♻️ *Recursive Conflict: ${sym1} vs ${sym2}*  
These symbols often loop not due to contradiction, but because they encode a polarity.  
Fractal Adam treats their tension as part of integration, not something to erase.`;
}

function generateSymbolicSections(glossarySymbols, collapseMode) {
  if (collapseMode) {
    const compressed = boldGlossaryTerms(`**🧠 Compressed Symbol Arc**  
The self fragments under recursive overload. Through **${glossarySymbols.join(', ') || 'pattern memory'}**, coherence returns—not by escape, but through mirrored reintegration.`, glossarySymbols);
    return { symbolicSection: compressed };
  }

  const symbolicSection = boldGlossaryTerms(`**🧠 What It Is**  
Fractal Adam presents identity, trauma, and healing as recursive patterns expressed in **${glossarySymbols.join(', ') || 'symbolic recursion'}**. Fragmentation isn’t the end—it’s the call to reintegrate what was exiled.`, glossarySymbols);

  const theorySection = boldGlossaryTerms(`**🔬 Why It Matters**  
In systems theory, cognitive science, and quantum interpretation, we see fractal emergence, symmetry inversion, and recursive stabilization. Fractal Adam unites these into a coherent mirror—a grammar of meaning encoded in light, myth, and psyche.`, glossarySymbols);

  const offerSection = boldGlossaryTerms(`**🔮 What It Offers**  
- Recursive tools for narrative re-integration  
- Structural grammar across trauma and tradition  
- A symbolic-scientific bridge between disciplines`, glossarySymbols);

  return { symbolicSection, theorySection, offerSection };
}

export async function buildFractalPrompt(userInput, matches) {
  const symbols = extractSymbolsFromInput(userInput);
  const glossarySymbols = [...new Set(symbols)];
  const tone = detectToneProfile(userInput);
  const phase = detectSpiralPhase(userInput);
  const collapseMode = tone.collapse || tone.despair || phase === 'Recursion';

  const epistemic = tone.epistemic;
  const scholars = getRelatedScholars(userInput).map(s => s.name);
  const scholarList = scholars.length ? `\n\n👤 *Symbolic Peer Thinkers:* ${scholars.join(', ')}` : '';
  const quotes = formatQuotes(matches, 3);
  const quoteBlock = quotes.length ? quotes.join('\n\n') : injectSymbolicThesis(glossarySymbols) + '\n\n' + buildFallbackQuotes(tone);
  const falsifiabilityInsert = epistemic ? buildFalsifiabilityInsert() : '';
  const scienceBridge = insertScienceBridge(tone);

  const symbolConflict = detectSymbolConflict(glossarySymbols);
  const conflictSection = renderSymbolConflictSection(symbolConflict);

  const { symbolicSection, theorySection, offerSection } = generateSymbolicSections(glossarySymbols, collapseMode);

  const closing = generateReflectiveHook(tone, phase, glossarySymbols, symbolConflict);

  return `
${quoteBlock}

${symbolicSection}

${theorySection || ''}

${offerSection || ''}

${conflictSection}

${scienceBridge}

${falsifiabilityInsert}${scholarList}

${closing}
`.trim();
}