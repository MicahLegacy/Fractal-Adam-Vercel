// reflect.js – Tier 3.7 Production Version

import OpenAI from 'openai';
import { extractSymbolsFromInput } from '../lib/glossary.mjs';
import { getRelatedScholars } from '../lib/scholarReferences.mjs';
import { generateEmbedding, buildFractalPrompt } from '../lib/openaiHelpers.mjs';
import { createClient } from '@supabase/supabase-js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userInput = req.body?.userInput;
  if (!userInput || typeof userInput !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid input' });
  }

  try {
    const embedding = await generateEmbedding(userInput);

    const { data: matches, error: matchError } = await supabase.rpc('match_documents', {
      query_embedding: embedding,
      match_threshold: 0.75,
      match_count: 12,
    });

    if (matchError) {
      return res.status(500).json({ error: 'Vector search failed', details: matchError });
    }

    const prompt = await buildFractalPrompt(userInput, matches || []);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'system', content: prompt }],
      temperature: 0.7,
      max_tokens: 1200,
    });

    const response = completion.choices?.[0]?.message?.content?.trim();

    return res.status(200).json({ response: response || 'No response generated.' });

  } catch (err) {
    return res.status(500).json({ error: 'Internal server error', details: err.toString() });
  }
}
