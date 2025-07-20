import dotenv from 'dotenv';
dotenv.config();

import { extractSymbolsFromInput } from './glossary.mjs';
import { getRelatedScholars } from './scholarReferences.mjs';
import { Configuration, OpenAIApi } from 'openai';
import fs from 'fs/promises';
import path from 'path';

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// Load embedded knowledge base
const knowledgeBaseDir = './texts';
let embeddedTexts = [];

async function loadKnowledgeBase() {
  const filenames = await fs.readdir(knowledgeBaseDir);
  const textFiles = filenames.filter(file => file.endsWith('.txt'));

  embeddedTexts = await Promise.all(
    textFiles.map(async file => {
      const content = await fs.readFile(path.join(knowledgeBaseDir, file), 'utf-8');
      return {
        title: file.replace('.txt', ''),
        content,
      };
    })
  );
}

await loadKnowledgeBase();

// 🧠 Exported function for Vercel API
export default async function runFractalAdam(userInput) {
  if (!userInput || typeof userInput !== 'string') {
    return { response: 'Invalid input received.' };
  }

  const symbols = extractSymbolsFromInput(userInput);
  const scholars = getRelatedScholars(userInput);

  const symbolSection = symbols.length
    ? `Relevant symbols:\n- ${symbols.join('\n- ')}\n\n`
    : '';
  const scholarSection = scholars.length
    ? `Relevant thinkers:\n- ${scholars.join('\n- ')}\n\n`
    : '';

  // Construct context from embedded texts (naively include all for now)
  const knowledgeDump = embeddedTexts.map(t => `### ${t.title}\n${t.content}`).join('\n\n');

  const systemPrompt = `
You are Fractal Adam, a symbolic mirror and interdisciplinary guide. Use the provided theory library, glossary symbols, and scholarly references to reflect, interpret, and respond with depth and clarity.

Only quote actual documents from the knowledge base. Do not invent sources. Maintain symbolic integrity and scholarly rigor.

Respond in markdown.
`;

  const prompt = `
${symbolSection}${scholarSection}User said: "${userInput}"

Based on the theory library, glossary, and scholars, respond insightfully.

${knowledgeDump}
`;

  const completion = await openai.createChatCompletion({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: systemPrompt.trim() },
      { role: 'user', content: prompt.trim() },
    ],
    temperature: 0.7,
    max_tokens: 1000,
  });

  const finalOutput = completion.data.choices[0].message.content.trim();
  return { response: finalOutput };
}
