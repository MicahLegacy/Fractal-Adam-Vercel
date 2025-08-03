import OpenAI from 'openai';
import { extractSymbolsFromInput } from './glossary.mjs';
import { getRelatedScholars } from './scholarReferences.mjs';
import { weaveFractalResponse } from './fractalWeaver.mjs';
import { systemPrompt as fractalSystemPrompt } from './systemPrompt.mjs';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateEmbedding(input) {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input
  });

  return response.data[0].embedding;
}

export async function buildFractalPrompt(userInput, documentMatches) {
  const inputSymbols = extractSymbolsFromInput(userInput);
  const relatedScholars = await getRelatedScholars(userInput);

  const documentContext = documentMatches
    .map(doc => `📄 ${doc.metadata?.title || 'Untitled'}:\n${doc.content}`)
    .join('\n\n');

  const recursiveResponse = await weaveFractalResponse(userInput, documentMatches);

  const promptSections = [
    documentContext && `📘 Contextual Sources:\n${documentContext}`,
    recursiveResponse && `🧠 Fractal Reflection:\n${recursiveResponse}`
  ].filter(Boolean);

  return promptSections.join('\n\n---\n\n');
}
