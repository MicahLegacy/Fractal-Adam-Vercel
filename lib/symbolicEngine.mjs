// symbolicEngine.mjs

import { glossary } from './glossary.mjs';

export function summarizeSymbolsRecursively(inputText) {
  const input = typeof inputText === 'string' ? inputText : String(inputText || '');
  const matches = glossary.filter(({ symbol }) =>
    input.toLowerCase().includes(symbol.toLowerCase())
  );

  if (matches.length === 0) {
    return '(No symbols detected.)';
  }

  return matches
    .map(({ symbol, meaning, shadow, function: fn }) =>
      `🜁 **${symbol}** — meaning: ${meaning}, shadow: ${shadow}. Function: ${fn}`
    )
    .join('\n\n');
}
