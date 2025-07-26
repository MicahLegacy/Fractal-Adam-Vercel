\// File: /api/reflect.js
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateEmbedding, buildFractalPrompt } from '../../openaiHelpers.mjs';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const { userInput } = await req.json();

    if (!userInput || userInput.trim() === '') {
      return NextResponse.json({ error: 'Missing user input.' }, { status: 400 });
    }

    // Step 1: Embed the input
    const embedding = await generateEmbedding(userInput);

    // Step 2: Perform vector search on theory_chunks
    const { data: matches, error: matchError } = await supabase.rpc('match_theory_chunks', {
      query_embedding: embedding,
      match_threshold: 0.75,
      match_count: 12
    });

    if (matchError) {
      console.error('[Supabase Error]', matchError);
      return NextResponse.json({ error: 'Failed to fetch matching theory chunks.' }, { status: 500 });
    }

    // Step 3: Build the symbolic + scholarly prompt
    const fullPrompt = await buildFractalPrompt(userInput, matches);

    // Step 4: Send prompt to OpenAI
    const completion = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: fullPrompt }],
        temperature: 0.7
      })
    });

    const completionData = await completion.json();

    if (!completion.ok || !completionData.choices) {
      console.error('[OpenAI Error]', completionData);
      return NextResponse.json({ error: 'OpenAI response failed.' }, { status: 500 });
    }

    const responseText = completionData.choices[0].message.content.trim();
    return NextResponse.json({ response: responseText }, { status: 200 });
  } catch (err) {
    console.error('[Reflect.js Uncaught Error]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
