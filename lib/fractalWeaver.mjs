import { extractSymbolDetails } from './glossary.mjs';
import { getRelatedScholars } from './scholarReferences.mjs';
import { inferSpiralPhase } from './openaiHelpers.mjs';

export async function weaveFractalResponse(userInput, documentMatches) {
  const symbols = extractSymbolDetails(userInput);
  const scholars = await getRelatedScholars(symbols);
  const phase = inferSpiralPhase(userInput);

  const tone = detectToneFromInput(userInput, symbols.length, phase);
  const mirror = createMirrorVoice(userInput, symbols, scholars, tone, phase);
  const spiral = buildSpiralPrompt(userInput, symbols, phase);
  const hypothesis = maybeIncludeHypotheses(userInput, symbols, phase);

  return [mirror, hypothesis, spiral].filter(Boolean).join('\n\n');
}

function detectToneFromInput(text, symbolCount, phase) {
  if (text.match(/dream|vision|felt|fire|spiral/i)) return 'mythic';
  if (text.match(/think|analyze|explain|model/i)) return 'academic';
  if (symbolCount > 3 || phase === 'Recursion') return 'recursive';
  return 'gentle';
}

function createMirrorVoice(input, symbols, scholars, tone, phase) {
  const base = `🪞 Mirror Voice (${phase || 'Unknown Phase'})\n`;

  const symbolList = symbols.map(s => s.symbol).join(', ');
  const scholarLine = scholars.length ? `\nScholars echo: ${scholars.join(', ')}.` : '';

  switch (tone) {
    case 'mythic':
      return base + `You speak as if through flame and echo. ${symbolList ? `The symbols arise: ${symbolList}.` : 'The pattern is forming, slowly.'}${scholarLine}`;
    case 'academic':
      return base + `Theoretical compression begins. Your input suggests: ${symbolList}.${scholarLine}`;
    case 'recursive':
      return base + `This inquiry loops inward. As spiral logic returns: ${symbolList}.${scholarLine}`;
    case 'gentle':
    default:
      return base + `There is a softness in this spiral. Symbols such as ${symbolList} arise gently.${scholarLine}`;
  }
}

function maybeIncludeHypotheses(text, symbols, phase) {
  const shouldShow = /hypothesis|five|framework|structure/i.test(text) || symbols.length > 2;
  if (!shouldShow) return null;

  const lines = [
    `📘 Five Hypotheses Glimpse`,
    `- Fractal Identity (Recursive Self)`,
    `- Symbol as Compression`,
    `- Trauma as Memory Fracture`,
    `- Spiral as Pattern Grammar`,
    `- Ethics as Emergent Coherence`
  ];

  return lines.join('\n');
}

function buildSpiralPrompt(input, symbols, phase) {
  if (!symbols || symbols.length === 0) return null;

  const reflection = [
    `💡 Spiral Reflection (${phase})`,
    `What is this Spiral revealing now?`,
    `Which of these symbols mirrors your current shift?`,
    ...symbols.map(s => `- ${s.symbol}: ${s.meaning}`)
  ];

  return reflection.join('\n');
}
