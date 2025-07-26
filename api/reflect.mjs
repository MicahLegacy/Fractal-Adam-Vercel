import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { generateEmbedding, buildFractalPrompt } from '../lib/openaiHelpers.mjs';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Number of match chunks to pull for context
const TOP_K_MATCHES = 12;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userInput } = req.body;

    if (!userInput || typeof userInput !== 'string') {
      return res.status(400).json({ error: 'Invalid user input' });
    }

    // Step 1: Embed the user input
    const embedding = await generateEmbedding(userInput);

    // Step 2: Query Supabase for matching theory chunks
    const { data: matches, error: matchError } = await supabase.rpc('match_theory_chunks', {
      query_embedding: embedding,
      match_threshold: 0.75,
      match_count: TOP_K_MATCHES
    });

    if (matchError) {
      console.error('[Supabase Error]', matchError);
      return res.status(500).json({ error: 'Failed to match documents from Supabase' });
    }

    // Step 3: Build the symbolic + academic dual-core prompt
    const prompt = await buildFractalPrompt(userInput, matches);

    // Step 4: Call OpenAI with the built prompt
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: userInput }
      ],
      temperature: 0.7,
      max_tokens: 1200
    });

    const aiResponse = completion.choices[0].message.content;

    // Return the response to frontend
    return res.status(200).json({ result: aiResponse });
  } catch (error) {
    console.error('[Reflect Error]', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
