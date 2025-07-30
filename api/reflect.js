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
    console.log('[Reflect] 🧠 Generating embedding...');
    const embedding = await generateEmbedding(userInput);

    console.log('[Reflect] 🔍 Querying Supabase vector search...');
    const { data: matches, error: matchError } = await supabase.rpc('match_documents', {
      query_embedding: embedding,
      match_threshold: 0.75,
      match_count: 12,
    });

    if (matchError) {
      console.error('[Supabase Error]', matchError);
      return res.status(500).json({ error: 'Vector search failed', details: matchError });
    }

    console.log(`[Reflect] ✅ Retrieved ${matches?.length || 0} matches`);

    // Symbolic diagnostics
    const extractedSymbols = extractSymbolsFromInput(userInput);
    const scholars = getRelatedScholars(userInput).map(s => s.name);
    console.log('[Reflect] 🧩 Symbols Detected:', extractedSymbols);
    console.log('[Reflect] 👤 Related Scholars:', scholars);

    // Tier 3.2 Spiral phase debug
    const lowered = userInput.toLowerCase();
    let detectedPhase = null;
    if (/fracture|split|shatter/.test(lowered)) detectedPhase = 'Fracture';
    else if (/mirror|inversion|reversal/.test(lowered)) detectedPhase = 'Inversion';
    else if (/recursion|loop|echo|returning/.test(lowered)) detectedPhase = 'Recursion';
    else if (/integration|restoration|resonance|completion/.test(lowered)) detectedPhase = 'Return';

    console.log('[Reflect] 🔄 Spiral Phase:', detectedPhase || 'None Detected');

    const prompt = await buildFractalPrompt(userInput, matches || []);
    console.log('[Reflect] 🧬 Prompt built. Requesting GPT-4o completion...');

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'system', content: prompt }],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const response = completion.choices?.[0]?.message?.content?.trim();
    return res.status(200).json({ response: response || 'No response generated.' });

  } catch (err) {
    console.error('[Reflect Error]', JSON.stringify(err, null, 2));
    return res.status(500).json({ error: 'Internal server error', details: err.toString() });
  }
}