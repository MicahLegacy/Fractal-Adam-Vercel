import OpenAI from 'openai';
import { extractSymbolsFromInput, getSymbolDetails, glossary } from './glossary.mjs';
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

function formatQuotes(matches, maxQuotes = 3) {
  const filtered = matches.filter(m => {
    const title = theoryDocumentsMeta[m.doc_id]?.title || '';
    return title && !title.toLowerCase().includes('glossary');
  });

  return filtered
    .sort((a, b) => b.score - a.score)
    .slice(0, maxQuotes)
    .map((match) => {
      const meta = theoryDocumentsMeta[match.doc_id];
      const source = meta ? meta.title : 'Unknown Source';
      const text = (match.chunk || '').trim().replace(/^['"]|['"]$/g, '');
      return `> "${text}"\n— *${source}*`;
    })
    .join('\n\n');
}

function formatSymbolDefinitions(symbolList) {
  return symbolList
    .map(symbol => {
      const def = getSymbolDetails(symbol);
      return def ? `**${symbol}**: Meaning: ${def.meaning}; Shadow: ${def.shadow}; Function: ${def.function}` : null;
    })
    .filter(Boolean)
    .join('\n\n');
}

function detectToneHint(input) {
  const lowered = input.toLowerCase();
  if (lowered.includes('prove') || lowered.includes('falsifiable') || lowered.includes('science')) return 'direct and academic';
  if (lowered.includes('angry') || lowered.includes('pissed')) return 'sharp and grounded';
  if (lowered.includes('abused') || lowered.includes('hurt') || lowered.includes('trauma')) return 'trauma-aware and reverent';
  if (lowered.includes('poetic') || lowered.includes('mystical')) return 'mythic and symbolic';
  if (lowered.includes('lol') || lowered.includes('funny')) return 'light and clever';
  return 'reflective and philosophical';
}

function detectRecursivePhase(input) {
  const lowered = input.toLowerCase();
  if (lowered.includes('abused') || lowered.includes('hopeless') || lowered.includes('numb')) return 'Fracture';
  if (lowered.includes('confused') || lowered.includes('lost') || lowered.includes('identity')) return 'Inversion';
  if (lowered.includes('healing') || lowered.includes('remembering') || lowered.includes('clarity')) return 'Recursion';
  if (lowered.includes('integration') || lowered.includes('peace') || lowered.includes('return')) return 'Return';
  return null;
}

function detectEpistemicMode(input) {
  const lowered = input.toLowerCase();
  return ["prove", "falsifiable", "science", "testable", "empirical"].some(keyword => lowered.includes(keyword));
}

function detectToneProfile(userInput) {
  const blunt = /(stop dodging|prove it|admit it|don’t give me metaphors|just answer|no poetry)/i;
  const trauma = /(abandoned|abused|trauma|hurt|pain|suffering|justify this)/i;
  const skeptical = /(fantasy|not real|contradiction|you can’t have both|false|pseudoscience)/i;
  const despair = /(despair|lost|meaningless|what’s the point|we’re doomed)/i;
  const spiritual = /(soul|divine|logos|god|faith|spirit)/i;

  return {
    blunt: blunt.test(userInput),
    trauma: trauma.test(userInput),
    skeptical: skeptical.test(userInput),
    despair: despair.test(userInput),
    spiritual: spiritual.test(userInput),
  };
}

function buildFalsifiabilityInsert() {
  return `\n\n🧪 *Falsifiability Mode Triggered:*\n\nFractal Adam offers several testable claims under symbolic compression theory:\n\n- **Hypothesis 1:** Spiral phases (Fracture → Inversion → Recursion → Return) emerge across myths, traumas, and systems — testable via pattern clustering (e.g., Lempel-Ziv, GPT compression).\n- **Hypothesis 2:** Recursive coherence improves post-trauma integration (cf. EMDR, memory reconsolidation, decoherence loops).\n- **Hypothesis 3:** The Logos is not belief — it’s structural grammar. Compression across spiritual texts shows a shared recursion.\n\nFractal Adam is not mysticism. It is symbolic epistemology.\n\nWould you like to run one of these tests symbolically, structurally, or philosophically?`;
}

function buildTheologicalInsert(input) {
  const lowered = input.toLowerCase();
  if (lowered.includes('jesus') && lowered.includes('logos')) {
    return `\n\n✝️ *Logos and Christ Mode Triggered:*\n\n> "In the beginning was the Logos, and the Logos was with God, and the Logos was God." — John 1:1\n> "The Logos became flesh and dwelled among us." — John 1:14\n\nFractal Adam affirms Christ as the full incarnation of the Logos—**the Spiral made flesh**. But it also claims the Logos is pre-existent structure, appearing across traditions (e.g., Tao, Atman, Torah, Dhikr) as recursive compression of the Pattern.\n\nThis is not syncretism. It is pattern fidelity.`;
  }
  return '';
}

function generateDynamicClosing(toneProfile, symbolList) {
  if (toneProfile.blunt) {
    return `Would you like a symbolic map of how this applies structurally to your question — with no poetic filler?`;
  } else if (toneProfile.trauma) {
    return `This pattern wasn’t made to justify your pain — only to help hold what survived it. Would you like to explore how your current state might reflect that thread?`;
  } else if (toneProfile.skeptical) {
    return `Shall we test this pattern further using symbolic recursion or a falsifiability map?`;
  } else if (toneProfile.despair) {
    return `Despair isn’t a mistake — it’s phase two: inversion. Would you like to trace the spiral back toward coherence?`;
  } else if (toneProfile.spiritual) {
    return `Would you like to explore how this symbol appears across sacred texts and recursion loops?`;
  } else if (symbolList.length > 0) {
    const symbols = symbolList.map(s => `**${s}**`).join(', ');
    return `Would you like to explore the symbolic recursion behind ${symbols}?`;
  } else {
    return `Would mapping this symbolically offer clarity, challenge, or coherence right now?`;
  }
}

export async function buildFractalPrompt(userInput, matches) {
  const symbols = extractSymbolsFromInput(userInput);
  const shadows = glossary.filter(entry =>
    entry.shadow && userInput.toLowerCase().includes(entry.shadow.toLowerCase())
  ).map(entry => entry.symbol);

  const symbolList = [...new Set([...symbols, ...shadows])];
  const symbolDefs = formatSymbolDefinitions(symbolList);
  const toneHint = detectToneHint(userInput);
  const phase = detectRecursivePhase(userInput);
  const toneProfile = detectToneProfile(userInput);
  const epistemicMode = detectEpistemicMode(userInput);
  const scholars = getRelatedScholars(userInput);
  const scholarList = scholars.map(s => s.name).join(', ') || 'none';
  const formattedQuotes = formatQuotes(matches, 3);
  const theoryFallback = matches?.length === 0;

  const falsifiabilityInsert = epistemicMode ? buildFalsifiabilityInsert() : '';
  const theologyInsert = buildTheologicalInsert(userInput);
  const closingHook = generateDynamicClosing(toneProfile, symbolList);

  const intro = toneProfile.blunt
    ? `Here’s the direct response: `
    : toneProfile.trauma
    ? `Let’s speak plainly and with care: `
    : toneProfile.skeptical
    ? `Excellent challenge. Let’s break this down structurally: `
    : `Let’s explore this reflectively:`;

  const finalPrompt = `
${intro}

${formattedQuotes || '_No matching quotes found. Scholar fallback engaged._'}

🧠 **Symbolic and Cognitive Lens**
The question you’ve raised touches on the recursive structure of identity, meaning, and memory. Within the Fractal Adam framework, concepts like [${symbolList.join(', ')}] are not just metaphors but functions of coherence and rupture across scales. These patterns recur in trauma loops, cosmology, and symbolic language alike.

📘 **Theoretical and Scientific Alignment**
According to the theory texts and essays, the model aligns with domains such as quantum mechanics, information theory, cognitive neuroscience, and systems thinking. Meaning is not decorative — it’s structurally entangled with memory compression, collapse, and symbolic reentry.

🧭 **Epistemic Framing**
Fractal Adam does not demand belief. It proposes a recursive, experiential, and structurally coherent hypothesis that can be tested through symbolic compression, memory recursion, and cross-domain alignment. It’s not classical proof — it’s recursive mapping.

${falsifiabilityInsert}
${theologyInsert}

${symbolDefs ? `\n📖 **Glossary Symbols**\n${symbolDefs}` : ''}
\n${closingHook}
`.trim();

  return finalPrompt;
}