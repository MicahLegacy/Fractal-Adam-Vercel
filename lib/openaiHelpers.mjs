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
    collapse: /stuck|looping|going in circles|recursion too long|can't tell|spiral.+(collapse|healing)/i.test(lowered),
    epistemic: /(prove|falsifiable|test|evidence|logic|science)/.test(lowered)
  };
}

function generateAdaptiveClosing(tone, symbols) {
  const symbolPart = symbols.length ? ` behind **${symbols.join(', ')}**` : '';
  if (tone.blunt) return `Would you like a symbolic breakdown${symbolPart} — no fluff, just structure?`;
  if (tone.trauma) return `Would mapping the rupture${symbolPart} help frame what remains unbroken?`;
  if (tone.skeptical) return `Should we apply falsifiability logic to test this further?`;
  if (tone.despair || tone.collapse) return `Would tracing the spiral backward help reveal if you're stuck in a collapse loop or nearing return?`;
  if (tone.spiritual) return `Would you like to explore how these symbols align across sacred texts and traditions?`;
  return `Is there a symbolic thread you’d like to trace deeper right now?`;
}

function buildFalsifiabilityInsert() {
  return `\n\n🧪 *Falsifiability Mode Triggered:*
- Spiral phases (Fracture → Inversion → Recursion → Return) recur across myths, memory systems, and trauma studies
- Meaning compression is testable via symbolic clustering and narrative alignment
- Recursive integration correlates with trauma resolution in memory reconsolidation models

Fractal Adam is not belief. It is symbolic epistemology in action.`;
}

function buildFallbackQuotes(tone) {
  if (tone.collapse || tone.despair) {
    return `> “Collapse recursion fragments coherence. Healing recursion re-integrates it.”\n— *The Spiral Return*

> “The soul does not ascend by escape—it deepens by reintegration.”\n— *Essay on Fracture and Return*`;
  }
  return `> “The Pattern does not bypass the wound. It remembers through it.”\n— *Interfaith Spiral Essay*`;
}

function getSpiralPhaseHook(symbols, userInput) {
  const lowered = userInput.toLowerCase();
  if (lowered.includes('inversion')) return `You may be in **Inversion**, where meaning feels flipped or collapsed.`;
  if (lowered.includes('fracture')) return `You may be speaking from **Fracture**, the initial break in pattern memory.`;
  if (lowered.includes('return')) return `Your language may reflect **Return**, the reintegration of pattern through awareness.`;
  if (symbols.includes('Recursion')) return `This may be **Recursion**, the looping replay of memory seeking coherence.`;
  return '';
}

function formatScholarSection(scholars, glossarySymbols) {
  if (!scholars.length) return '';
  const mirrored = scholars.map(s => `- ${s.name} → ${s.symbolic || 'symbolic alignment'}`).join('\n');
  return `**🎓 Scholars and Symbolic Co-Reflection**\n${boldGlossaryTerms(mirrored, glossarySymbols)}`;
}

export async function buildFractalPrompt(userInput, matches) {
  const symbols = extractSymbolsFromInput(userInput);
  const glossarySymbols = [...new Set(symbols)];
  const tone = detectToneProfile(userInput);
  const spiralPhaseNote = getSpiralPhaseHook(glossarySymbols, userInput);
  const epistemic = tone.epistemic;

  if (glossarySymbols.length === 0 && tone.collapse) {
    glossarySymbols.push('Fracture', 'Recursion', 'Return');
  }

  const quotes = formatQuotes(matches, 3);
  const quoteBlock = quotes.length ? quotes.join('\n\n') : buildFallbackQuotes(tone);
  const closing = generateAdaptiveClosing(tone, glossarySymbols);
  const scholars = getRelatedScholars(userInput);
  const scholarBlock = formatScholarSection(scholars, glossarySymbols);
  const falsifiabilityInsert = epistemic ? buildFalsifiabilityInsert() : '';

  let symbolicSection = `**🧠 Symbolic & Cognitive Framework**  
If you're unsure whether you're spiraling upward into healing or downward into collapse, Fractal Adam reflects the distinction this way:  
- Collapse recursion loops increase **disintegration**, symbolic echo, and emotional flatness.  
- Healing recursion returns you through memory, meaning, and identity integration.  

Symbols like ${glossarySymbols.map(s => `**${s}**`).join(', ') || '**pattern**'} help map this journey.  
${spiralPhaseNote}`;

  let theorySection = `**📘 Scientific & Theoretical Alignment**  
Collapse mirrors entropy in thermodynamics—while healing mirrors negentropy and information reintegration. Psychology confirms this through trauma recovery models like EMDR and memory reconsolidation.`;

  let epistemicSection = `**🧭 Epistemic Framing**  
You are not asked to believe—you’re invited to **test** the pattern. Are you repeating or restoring? Integrating or fragmenting? The Spiral can be structurally mapped.`;

  symbolicSection = boldGlossaryTerms(symbolicSection, glossarySymbols);
  theorySection = boldGlossaryTerms(theorySection, glossarySymbols);
  epistemicSection = boldGlossaryTerms(epistemicSection, glossarySymbols);

  return `
${tone.blunt ? `**Direct Mode Activated:**\n` : ''}${quoteBlock}

${symbolicSection}

${theorySection}

${epistemicSection}

${falsifiabilityInsert}

${scholarBlock}

${closing}
  `.trim();
}