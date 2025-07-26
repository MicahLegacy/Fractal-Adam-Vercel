// /api/reflect.js
import { createClient } from '@supabase/supabase-js';
import { generateEmbedding, buildFractalPrompt } from '../../openaiHelpers.mjs';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
    }

    const { userInput } = await req.json();

    if (!userInput || typeof userInput !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid input' }), { status: 400 });
    }

    const embedding = await generateEmbedding(userInput);

    const { data: matches, error } = await supabase.rpc('match_documents', {
      query_embedding: embedding,
      match_threshold: 0.75,
      match_count: 12
    });

    if (error) {
      return new Response(JSON.stringify({ error: 'Match retrieval failed', details: error.message }), { status: 500 });
    }

    const prompt = await buildFractalPrompt(userInput, matches || []);

    return new Response(JSON.stringify({ prompt }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: 'Server error', details: err.message }), { status: 500 });
  }
}
