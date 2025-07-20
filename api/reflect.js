export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const { default: runFractalAdam } = await import('../../index.mjs');
    const result = await runFractalAdam(req.body.userInput);
    res.status(200).json(result);
  } catch (err) {
    console.error('Fractal Adam error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
}
