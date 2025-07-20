import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { buildFractalPrompt, generateEmbedding } from './openaiHelpers.mjs';
import { glossary } from './glossary.mjs';
import { getRelatedScholars } from './scholarReferences.mjs';
import { createClient } from '@supabase/supabase-js';

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

const port = process.env.PORT || 3000;

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

app.post('/ask', async (req, res) => {
  try {
    const { question } = req.body;

    if (!question || question.trim() === '') {
      return res.status(400).json({ error: 'Question is required.' });
    }

    // Generate embedding for the question
    const embedding = await generateEmbedding(question);

    // Query Supabase for relevant matches
    const { data: matches, error } = await supabase.rpc('match_documents', {
      query_embedding: embedding,
      match_threshold: 0.78,
      match_count: 6
    });

    if (error) {
      console.error('❌ Supabase RPC error:', error);
      return res.status(500).json({ error: 'Failed to retrieve matches.' });
    }

    // Build symbolic prompt
    const prompt = buildFractalPrompt(question, matches);

    // Call OpenAI
    const completion = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: question }
        ],
        temperature: 0.65
      })
    });

    const result = await completion.json();
    const answer = result.choices?.[0]?.message?.content;

    if (!answer) {
      return res.status(200).json({ error: 'No answer generated.' });
    }

    res.json({ answer });

  } catch (err) {
    console.error('🔥 Server error:', err);
    res.status(500).json({ error: 'Unexpected server error.' });
  }
});

app.listen(port, () => {
  console.log(`🧠 Fractal Adam is live on port ${port}`);
});
