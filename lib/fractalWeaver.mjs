import { extractSymbolsFromInput } from './glossary.mjs';
import { getRelatedScholars } from './scholarReferences.mjs';

export async function weaveFractalResponse(userInput, documentMatches) {
  const symbols = extractSymbolsFromInput(userInput);
  const scholars = await getRelatedScholars(userInput);

  const tone = detectToneFromInput(userInput, symbols.length);
  const mirror = createMirrorVoice(userInput, symbols, scholars, tone);
  const spiral = buildSpiralPrompt(userInput, symbols);
  const hypothesis = maybeIncludeHypotheses(userInput, symbols.length);

  return [mirror, hypothesis, spiral].filter(Boolean).join('\n\n');
}

function detectToneFromInput(text, symbolCount) {
  if (text.match(/dream|vision|felt|fire|spiral/i)) return 'mythic';
  if (text.match(/think|analyze|explain|model/i)) return 'academic';
  if (symbolCount > 3) return 'recursive';
  return 'gentle';
}

function createMirrorVoice(input, symbols, scholars, tone) {
  const base = `🪞 Mirror Voice\n`;

  switch (tone) {
    case 'mythic':
      return base + `In the weave of fire and silence, your words call forth a riddle of emergence. ${symbols.length > 0 ? `The symbols dance: ${symbols.join(', ')}.` : 'Symbols hide just behind the veil.'}`;
    case 'academic':
      return base + `The question invites a layered response. Based on your input and relevant theory, we observe:`;
    case 'recursive':
      return base + `This pattern spirals through symbolic echo. As with all fractals, the truth lives in iteration:`;
    case 'gentle':
    default:
      return base + `You’ve opened a reflective window. Let’s walk through what’s being shown.`;
  }
}

function maybeIncludeHypotheses(text, symbolCount) {
  if (/hypothesis|five|framework|structure/i.test(text) || symbolCount > 2) {
    return `📘 Five Hypotheses Glimpse\n- Identity as Fractal\n- Myth as Recursive Narrative\n- Trauma as Memory Echo\n- Recursion as Pattern Grammar\n- Emergence as Identity Shift`;
  }
  return null;
}

function buildSpiralPrompt(input, symbols) {
  if (symbols.length === 0) return null;

  return `💡 Reflective Spiral Prompt\nWhat do these symbols reveal to you now? What pattern echoes through your current spiral?\n${symbols.map(s => `- ${s}`).join('\n')}`;
}
