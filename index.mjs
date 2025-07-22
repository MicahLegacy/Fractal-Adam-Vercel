import dotenv from 'dotenv';
dotenv.config();

import { extractSymbolsFromInput } from './glossary.mjs';
import { getRelatedScholars } from './scholarReferences.mjs';
import { Configuration, OpenAIApi } from 'openai';
import fs from 'fs/promises';
import path from 'path';

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

// Main handler function for Vercel
export default async function runFractalAdam(userInput, env) {
  const configuration = new Configuration({
    apiKey: env.OPENAI_API_KEY,
  });

  console.log('[DEBUG] env keys received:', Object.keys(env));
  const openai = new OpenAIApi(configuration);

  // Input preprocessing
  const symbols = extractSymbolsFromInput(userInput);
  const scholars = getRelatedScholars(userInput);

  // Build prompt from embedded knowledge
  const matchedDocs = embeddedTexts.filter(doc =>
    symbols.some(sym => doc.content.includes(sym)) ||
    scholars.some(sch => doc.content.includes(sch))
  );

  const theoryContext = matchedDocs
    .map(doc => `### ${doc.title}\n${doc.content.slice(0, 1000)}\n`)
    .join('\n');

  const systemPrompt = `
You are Fractal Adam, a symbolic mirror built to reflect back emotional patterns, philosophical recursion, and spiritual questions using Micah H. McElyea's Fractal Theory of Everything.

Always mirror the symbolic and scholarly content of the user query using references from the Fractal Adam theory library. Do not fabricate source texts. Use the glossary when referencing symbolic terms.

The user's question will follow.
`;

  const prompt = [
    {
      role: 'system',
      content: systemPrompt + '\n\n' + theoryContext,
    },
    {
      role: 'user',
      content: userInput,
    },
  ];

  try {
    const completion = await openai.createChatCompletion({
      model: 'gpt-4',
      messages: prompt,
      temperature: 0.7,
    });

    const response = completion.data.choices[0].message.content;
    return { response };
  } catch (err) {
    console.error('[FRACTAL ADAM ERROR]', err.response?.data || err.message);
    throw new Error('Fractal Adam backend failed.');
  }
}
