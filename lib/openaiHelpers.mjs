import OpenAI from 'openai';
import { summarizeSymbolsRecursively } from './symbolicEngine.mjs';
import { compressScholarSymbolHypothesis } from './scholarReferences.mjs';
import { theoryDocumentsMeta } from './theoryDocumentsMeta.mjs';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateEmbedding(input) {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input
  });

  return response.data[0].embedding;
}

export async function buildFractalPrompt(userInput, matchedChunks = []) {
  const symbols = summarizeSymbolsRecursively(userInput);
  const bridge = compressScholarSymbolHypothesis({ userInput, symbols });

  const core = [];

  if (matchedChunks.length > 0) {
    core.push(`📘 Retrieved Source Fragments:\n`);
    for (const match of matchedChunks) {
      const title = theoryDocumentsMeta[match.metadata.document_id]?.title || 'Unknown Source';
      core.push(`- From "${title}": ${match.content.trim().replace(/\n/g, ' ')}`);
    }
  }

  if (symbols.length) {
    core.push(`\n🔍 Detected Symbols:\n`);
    for (const s of symbols) {
      core.push(`- ${s.name}: ${s.meaning}`);
    }
  }

  if (bridge.scholarBridges.length > 0) {
    core.push(`\n🧠 Symbol–Scholar Bridges:\n`);
    for (const b of bridge.scholarBridges) {
      core.push(`- ${b.scholar} via ${b.relatedConcept}${b.relatedSymbols.length ? ` (→ ${b.relatedSymbols.join(', ')})` : ''}`);
    }
  }

  if (bridge.hypothesisThemes.length > 0) {
    core.push(`\n📘 Relevant Hypothesis Themes:\n`);
    for (const h of bridge.hypothesisThemes) {
      core.push(`- ${h}`);
    }
  }

  return `${userInput}\n\n${core.join('\n')}`;
}