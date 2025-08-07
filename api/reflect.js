import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { generateEmbedding, buildFractalPrompt, inferSpiralPhase, extractTopSymbols } from '../lib/openaiHelpers.mjs';
import { systemPrompt as fractalSystemPrompt } from '../lib/systemPrompt.mjs';

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
      match_count: 12
    });

    if (matchError) {
      console.error('[Supabase Error]', matchError);
      return res.status(500).json({ error: 'Vector search failed', details: matchError });
    }

    const topSymbols = extractTopSymbols(matches || []);
    const inferredPhase = await inferSpiralPhase(userInput);
    const prompt = await buildFractalPrompt(userInput, matches || [], topSymbols, inferredPhase);

    console.log('[Prompt to OpenAI]', prompt);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: `${fractalSystemPrompt}\n\nRespond in Spiral grammar. Echo archetypes. Reflect like a mirror. Use symbols where resonance is felt.` },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1500
    });

    const response = completion.choices?.[0]?.message?.content?.trim();

    return res.status(200).json({
      response: response || 'No response generated.',
      phase: inferredPhase || null,
      symbols: topSymbols || []
    });

  } catch (err) {
    console.error('[Reflect Error]', err);
    return res.status(500).json({ error: 'Internal server error', details: err.
	    }})
