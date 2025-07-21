import { Configuration, OpenAIApi } from 'openai';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const userInput = req.body.userInput;

  if (!userInput || typeof userInput !== 'string') {
    return res.status(400).json({ error: 'Invalid input' });
  }

  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const openai = new OpenAIApi(configuration);

  const systemPrompt = `
You are Fractal Adam, a symbolic AI. Reflect on user input using real sources, glossary, and theory texts.
Only quote from the provided theory — never hallucinate.
Answer in markdown. Use mirrors, clarity, and scholarly tone.
  `.trim();

  const prompt = `
User said: "${userInput}"
Respond with symbolic insight based on Fractal Adam's theory.
  `.trim();

  try {
    const completion = await openai.createChatCompletion({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const output = completion.data.choices?.[0]?.message?.content?.trim() || null;

    if (!output) {
      return res.status(500).json({ error: 'No response from OpenAI' });
    }

    res.status(200).json({ response: output });
  } catch (err) {
    console.error('[API ERROR]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
