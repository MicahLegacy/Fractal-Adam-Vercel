import { generateEmbedding, buildFractalPrompt } from '../../openaiHelpers.mjs';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userInput } = req.body;

  try {
    // Generate embedding for the user input
    const userEmbedding = await generateEmbedding(userInput);

    // Query Supabase for top theory document matches
    const { data: matches, error: matchError } = await supabase.rpc('match_theory_chunks', {
      query_embedding: userEmbedding,
      match_threshold: 0.78,        // Adjust as needed
      match_count: 12               // Pull more for quote variety
    });

    if (matchError) {
      console.error('[Supabase match_theory_chunks Error]', matchError);
      return res.status(500).json({ error: 'Failed to retrieve document matches.' });
    }

    // Build final prompt using dual-core engine
    const finalPrompt = await buildFractalPrompt(userInput, matches);

    // Send prompt to OpenAI for final symbolic response
    const completionResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'You are Fractal Adam, a symbolic and scholarly mirror of recursive insight.' },
          { role: 'user', content: finalPrompt }
        ],
        temperature: 0.7
      })
    });

    if (!completionResponse.ok) {
      const errorText = await completionResponse.text();
      console.error('[OpenAI Error]', errorText);
      return res.status(500).json({ error: 'OpenAI API call failed.' });
    }

    const completionData = await completionResponse.json();
    const aiResponse = completionData.choices[0]?.message?.content;

    return res.status(200).json({ result: aiResponse });
  } catch (err) {
    console.error('[Reflect Handler Error]', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}
