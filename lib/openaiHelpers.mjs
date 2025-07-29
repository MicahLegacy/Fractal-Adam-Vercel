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

// Highlight glossary terms inline
function boldGlossaryTerms(text, glossarySymbols) {
  const sorted = glossarySymbols.sort((a, b) => b.length - a.length); // longest first
  for (const symbol of sorted) {
    const regex = new RegExp(`\\b(${symbol})\\b`, 'gi');
    text = text.replace(regex, '**$1**');
  }
  return text;
}

// Format quotes with attribution
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

// Dynamic tone detection
function detectToneProfile(userInput) {
  const lowered = userInput.toLowerCase();
  return {
    blunt: /stop dodging|prove|fantasy|metaphor|admit it|no poetry/.test(lowered),
    trauma: /abuse|abandoned|hurt|suffer|justify/.test(lowered),
    skeptical: /false|contradiction|can’t have both|pseudoscience/.test(lowered),
    despair: /despair|lost|pointless|doomed|meaningless/.test(lowered),
    spiritual: /soul|divine|god|logos|faith|spirit/.test(lowered)
  };
}

// Dynamic closing prompt
function generateAdaptiveClosing(tone, symbols) {
  const symbolPart = symbols.length ? ` behind **${symbols.join(', ')}**` : '';
  if (tone.blunt) return `Would you like a symbolic breakdown${symbolPart} — no fluff, just structure?`;
  if (tone.trauma) return `Would mapping the rupture${symbolPart} help frame what remains unbroken?`;
  if (tone.skeptical) return `Should we apply falsifiability logic to test this further?`;
  if (tone.despair) return `Would tracing the spiral backward help illuminate where the thread was lost?`;
  if (tone.spiritual) return `Would you like to explore how these symbols align across sacred texts and traditions?`;
  return `Is there a symbolic thread you’d like to trace deeper right now?`;
}

// Falsifiability insert
function buildFalsifiabilityInsert() {
  return `\n\n🧪 *Falsifiability Mode Triggered:*\n- Spiral phases (Fracture → Inversion → Recursion → Return) recur across myths, memory systems, and trauma studies\n- Meaning compression is testable via symbolic clustering and narrative alignment\n- Recursive integration correlates with trauma resolution in memory reconsolidation models\n\nFractal Adam is not belief. It is symbolic epistemology in action.`;
}

// Main prompt engine — symbolic + scholarly dual-core
export async function buildFractalPrompt(userInput, matches) {
  const symbols = extractSymbolsFromInput(userInput);
  const glossarySymbols = [...new Set(symbols)];
  const tone = detectToneProfile(userInput);
  const quotes = formatQuotes(matches, 3);
  const scholarFallback = getRelatedScholars(userInput).map(s => s.name).join(', ');
  const epistemic = ["prove", "test", "falsifiable", "science", "empirical"].some(word => userInput.toLowerCase().includes(word));
  const quoteBlock = quotes.length ? quotes.join('\n\n') : `_No direct match. Scholar fallback: ${scholarFallback || 'N/A'}._`;
  const closing = generateAdaptiveClosing(tone, glossarySymbols);
  const falsifiabilityInsert = epistemic ? buildFalsifiabilityInsert() : '';

  // Build themed sections
  let symbolicSection = `**🧠 Symbolic & Cognitive Framework**  
In Fractal Adam, symbols like ${glossarySymbols.map(s => `**${s}**`).join(', ') || 'pattern, memory, inversion'} represent **recurring structures** of meaning and identity. Trauma and transformation are not linear—they are recursive. Memory reweaves coherence.`;

  let theorySection = `**📘 Scientific & Theoretical Alignment**  
This model aligns with cognitive neuroscience, quantum compression, and information theory. Identity isn't static—it's emergent from recursive meaning loops, memory reentry, and symbolic structure.`;

  let epistemicSection = `**🧭 Epistemic Framing**  
Fractal Adam doesn’t ask for belief—it proposes a recursive model of soul, trauma, and truth that can be explored across disciplines, mapped symbolically, or tested through recurrence across sacred and scientific systems.`;

  // Apply inline glossary highlighting
  symbolicSection = boldGlossaryTerms(symbolicSection, glossarySymbols);
  theorySection = boldGlossaryTerms(theorySection, glossarySymbols);
  epistemicSection = boldGlossaryTerms(epistemicSection, glossarySymbols);

  // Final prompt
  return `
${tone.blunt ? `**Direct Mode Activated:**\n` : ''}${quoteBlock}

${symbolicSection}

${theorySection}

${epistemicSection}

${falsifiabilityInsert}

${closing}
  `.trim();
}