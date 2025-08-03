// symbolicEngine.mjs

import { glossary } from './glossary.mjs';

export function summarizeSymbolsRecursively(inputText) {
  const loweredInput = inputText.toLowerCase();

  const matched = glossary.filter(({ symbol }) =>
    loweredInput.includes(symbol.toLowerCase())
  );

  if (matched.length === 0) {
    return "No symbolic matches found.";
  }

  return matched
    .map(({ symbol, meaning, shadow, function: fn }) => {
      return `🜁 ${symbol}\n• Meaning: ${meaning}\n• Shadow: ${shadow}\n• Function: ${fn}`;
    })
    .join('\n\n');
}
