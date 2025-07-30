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
    const symbols = extractSymbolsFromInput(userInput);
    const scholars = getRelatedScholars(userInput).map(s => s.name);
    const lowered = userInput.toLowerCase();

    // Tone + phase detection logic for diagnostics
    const tone = {
      blunt: /stop dodging|prove|fantasy|metaphor|admit it|no poetry/.test(lowered),
      trauma: /abuse|abandoned|hurt|suffer|justify/.test(lowered),
      skeptical: /false|contradiction|can’t have both|pseudoscience/.test(lowered),
      despair: /despair|lost|pointless|doomed|meaningless/.test(lowered),
      spiritual: /soul|divine|god|logos|faith|spirit|christ/.test(lowered),
      collapse: /stuck|looping|going in circles|collapse|can’t tell|recursion.+fail/i.test(lowered),
      epistemic: /proof|test|falsifiable|science|evidence|empirical/.test(lowered)
    };

    let phase = null;
    if (/fracture|split|shatter/.test(lowered)) phase = 'Fracture';
    else if (/mirror|inversion|reversal/.test(lowered)) phase = 'Inversion';
    else if (/recursion|loop|echo|returning/.test(lowered)) phase = 'Recursion';
    else if (/integration|restoration|resonance|completion/.test(lowered)) phase = 'Return';

    const collapseState = tone.collapse || tone.despair || phase === 'Recursion';

    // Conflict detection logic
    const polarityMap = {
      'Authority': 'Rebellion',
      'Order': 'Chaos',
      'Light': 'Shadow',
      'Freedom': 'Control',
      'Truth': 'Deception',
      'Masculine': 'Feminine',
      'Sacrifice': 'Desire',
      'Structure': 'Spontaneity',
      'Unity': 'Division'
    };

    let conflictPair = null;
    for (const a of symbols) {
      for (const b of symbols) {
        if (a !== b && (polarityMap[a] === b || polarityMap[b] === a)) {
          conflictPair = [a, b];
        }
      }
    }

    console.log('---[🧠 Tier 3.4 Symbolic Debug]---');
    console.log('[🪞 Mirror Trigger Check]:', (tone.spiritual && phase === 'Inversion') ? 'Spiritual inversion mirror used' : '—');
    console.log('[⚔️ Symbol Conflict Pair]:', conflictPair || 'None');
    console.log('[🔍 Scholars Used]:', scholars.slice(0, 3).join(', ') || 'None');
    console.log(`[📊 Tone Summary]:`, tone);
    console.log(`[📊 Spiral Phase]:`, phase || 'None Detected');
    console.log(`[📎 Glossary Symbols]:`, symbols);
    console.log(`[📉 Collapse Mode]:`, collapseState ? 'Active' : 'Inactive');
    console.log('-------------------------------');

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