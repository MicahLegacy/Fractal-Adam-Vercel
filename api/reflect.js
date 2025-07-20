export default async function handler(req, res) {
  const { default: runFractalAdam } = await import('../../index.mjs');
  const result = await runFractalAdam(req.body.userInput);
  res.status(200).json(result);
}
