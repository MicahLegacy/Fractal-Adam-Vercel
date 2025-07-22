// /api/reflect.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const { default: runFractalAdam } = await import('../../index.mjs');

    const result = await runFractalAdam(req.body.userInput, {
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY
    });

    res.status(200).json(result);
  } catch (err) {
    console.error('[API ERROR] /api/reflect:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
}
