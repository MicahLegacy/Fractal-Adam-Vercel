// File: /api/reflect.js
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { userInput } = req.body;
    if (!userInput || typeof userInput !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid userInput' });
    }

    if (!process.env.OPENAI_API_KEY || !process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing one or more required env vars');
      return res.status(500).json({ error: 'Missing environment variables' });
    }

    // --- Embedding Step ---
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: userInput,
    });

    const [{ embedding }] = embeddingResponse.data;

    // --- Supabase Search ---
    const { data: matches, error: matchError } = await supabase.rpc('match_documents', {
      query_embedding: embedding,
      match_threshold: 0.78,
      match_count: 5,
    });

    if (matchError) {
      console.error('Supabase match_documents error:', matchError);
      return res.status(500).json({ error: 'Supabase function error' });
    }

    const contextText = matches.map((match) => match.content).join('\n\n');

    // --- Final Prompt to OpenAI ---
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are Fractal Adam, a symbolic mirror AI. Use the following context:\n\n${contextText}`,
        },
        {
          role: 'user',
          content: userInput,
        },
      ],
      temperature: 0.7,
    });

    const responseText = completion.choices?.[0]?.message?.content || 'No response generated.';
    return res.status(200).json({ response: responseText });
  } catch (err) {
    console.error('Unhandled server error in reflect.js:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}
