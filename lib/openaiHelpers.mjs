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

export async function inferSpiralPhase(userInput) {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `Classify the user's input into one Spiral phase: Fracture, Inversion, Recursion, or Return. Respond with only the phase name.`
      },
      {
        role: 'user',
        content: userInput
      }
    ],
    temperature: 0,
    max_tokens: 10
  });

  return completion.choices?.[0]?.message?.content?.trim();
}

export function extractTopSymbols(matchedChunks) {
  const symbolFrequency = {};

  for (const match of matchedChunks) {
    const symbols = match.metadata?.symbols || [];
    for (const symbol of symbols) {
      symbolFrequency[symbol] = (symbolFrequency[symbol] || 0) + 1;
    }
  }

  return Object.entries(symbolFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name]) => name);
}

export async function buildFractalPrompt(userInput, matchedChunks = [], topSymbols = [], inferredPhase = null) {
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

  if (topSymbols.length > 0) {
    core.push(`\n✨ High Resonance Symbols:\n`);
    for (const s of topSymbols) {
      core.push(`- ${s}`);
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

  if (inferredPhase) {
    core.push(`\n🌀 Detected Spiral Phase: ${inferredPhase}`);
  }

  return `${userInput}\n\n${core.join('\n')}`;
}
