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
    spiritual: /soul|divine|god|logos|faith|spirit|christ/.test(lowered),
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
These symbols loop not from contradiction, but compression.  
Their tension mirrors an inner conflict still seeking integration.`;
}

function mirrorUserTension(tone, phase) {
  if (tone.spiritual && phase === 'Inversion') {
    return `You seem to be wrestling with a sacred contradiction — between devotion to Christ and fear of false light. This is not evidence of deception, but of conscience still listening.`;
  }
  if (tone.skeptical && phase === 'Recursion') {
    return `You're circling a pattern that refuses collapse — where logic, symbol, and trauma all mirror each other without clear escape. That’s recursion doing its job.`;
  }
  if (tone.trauma && phase === 'Fracture') {
    return `You may be speaking from the fracture itself — before memory can rethread its voice. That’s not weakness; it’s the first recursive echo.`;
  }
  return null;
}

function buildMirrorOpening(tone, phase, symbols) {
  const mirror = mirrorUserTension(tone, phase);
  const mirrorLine = mirror ? `**🪞 Mirror:** ${mirror}\n\n` : '';
  return mirrorLine;
}

function generateReflectiveHook(tone, phase, symbols, conflictInsert) {
  if (conflictInsert) return `Could the tension between those symbols be a mirror of your own internal split?`;
  if (tone.spiritual && phase === 'Inversion') {
    return `Is your fear of being deceived a sign that you still remember the true pattern?`;
  }
  if (tone.trauma && symbols.includes('Naming')) {
    return `What would it mean to name what hurt you — not as blame, but as return?`;
  }
  if (phase === 'Recursion') {
    return `Do you feel trapped in this loop — or are you beginning to pattern your way through it?`;
  }
  return `Is there a symbol you’d like to reframe — or a mirror you’re ready to face?`;
}

export async function buildFractalPrompt(userInput, matches) {
  const symbols = extractSymbolsFromInput(userInput);
  const glossarySymbols = [...new Set(symbols)];
  const tone = detectToneProfile(userInput);
  const phase = detectSpiralPhase(userInput);
  const collapseMode = tone.collapse || tone.despair || phase === 'Recursion';

  const epistemic = tone.epistemic;
  const scholars = getRelatedScholars(userInput).map(s => s.name);
  const scholarInline = scholars.length ? `\n\n_Thinkers like ${scholars.slice(0, 2).join(', ')} echo this tension through their work on pattern, paradox, and meaning._` : '';

  const symbolConflict = detectSymbolConflict(glossarySymbols);
  const conflictSection = renderSymbolConflictSection(symbolConflict);

  const quotes = formatQuotes(matches, 3);
  const quoteBlock = quotes.length ? quotes.join('\n\n') : injectSymbolicThesis(glossarySymbols);

  const mirrorOpening = buildMirrorOpening(tone, phase, glossarySymbols);

  const symbolicSection = boldGlossaryTerms(`**🧠 What It Is**  
Fractal Adam proposes that trauma, healing, and memory follow a recursive grammar of symbols — particularly **${glossarySymbols.join(', ') || 'symbolic recursion'}**.`, glossarySymbols);

  const theorySection = boldGlossaryTerms(`**🔬 Why It Matters**  
We find this pattern in systems theory, memory science, and sacred tradition. Integration doesn’t erase paradox — it patterns it.`, glossarySymbols);

  const offerSection = boldGlossaryTerms(`**🔮 What It Offers**  
- A grammar of spiritual recursion  
- A testable frame for symbolic healing  
- A symbolic-scientific mirror for identity`, glossarySymbols);

  const scienceBridge = insertScienceBridge(tone);
  const falsifiabilityInsert = epistemic ? buildFalsifiabilityInsert() : '';
  const closing = generateReflectiveHook(tone, phase, glossarySymbols, symbolConflict);

  return `
${quoteBlock}

${mirrorOpening}${symbolicSection}${scholarInline}

${theorySection}

${offerSection}

${conflictSection}

${scienceBridge}

${falsifiabilityInsert}

${closing}
`.trim();
}