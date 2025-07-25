// reflect.js (Vercel serverless function)

import { generateEmbedding, buildFractalPrompt } from '../../openaiHelpers.mjs';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { userInput } = req.body;

    if (!userInput || userInput.trim().length === 0) {
      return res.status(400).json({ error: 'No user input provided.' });
    }

    // Step 1: Generate embedding
    const embedding = await generateEmbedding(userInput);

    // Step 2: Query Supabase for top matching chunks
    const { data: matches, error } = await supabase.rpc('match_theory_chunks', {
      query_embedding: embedding,
      match_threshold: 0.75,
      match_count: 12
    });

    if (error) {
      console.error('[Supabase Match Error]', error);
      return res.status(500).json({ error: 'Failed to retrieve theory matches.' });
    }

    // Step 3: Build full prompt from user input and matches
    const finalPrompt = await buildFractalPrompt(userInput, matches);

    // Step 4: Get OpenAI chat completion
    const chatResponse = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: finalPrompt }],
      temperature: 0.7,
      max_tokens: 1400
    });

    const completion = chatResponse.choices?.[0]?.message?.content;
    if (!completion) {
      return res.status(500).json({ error: 'No completion received from OpenAI.' });
    }

    return res.status(200).json({ result: completion });
  } catch (err) {
    console.error('[Reflect Error]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
