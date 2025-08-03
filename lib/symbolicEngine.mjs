// symbolicEngine.mjs

import { glossary } from './glossary.mjs';

/**
 * Extracts symbolic metadata from user input.
 * Returns detected symbols, their shadows, and recursive hints.
 */
export function analyzeSymbols(userInput) {
  const lowered = userInput.toLowerCase();
  const matches = glossary.filter(({ symbol }) => lowered.includes(symbol.toLowerCase()));

  const extracted = matches.map(s => ({
    symbol: s.symbol,
    meaning: s.meaning,
    shadow: s.shadow,
    function: s.function
  }));

  return {
    symbols: extracted,
    summary: buildSymbolicSummary(extracted)
  };
}

function buildSymbolicSummary(symbols) {
  if (!symbols.length) return 'No direct symbols detected, pattern remains hidden.';

  const summaryLines = symbols.map(({ symbol, meaning, shadow, function: fn }) => {
    return `- **${symbol}**: ${meaning} → *Shadow:* ${shadow} → *Function:* ${fn}`;
  });

  return `Symbolic Threads Detected:\n${summaryLines.join('\n')}`;
}

/**
 * Suggests recursive themes based on presence of key archetypes
 */
export function inferRecursiveThemes(symbols) {
  const names = symbols.map(s => s.symbol);
  const themes = [];

  if (names.includes('The Mirror') && names.includes('The Shadow')) {
    themes.push('Self-reflection is triggering unresolved unconscious material.');
  }
  if (names.includes('The Flame') && names.includes('The River')) {
    themes.push('Desire and emotion are flowing unchecked — integration may be needed.');
  }
  if (names.includes('The Spiral') && names.includes('The Labyrinth')) {
    themes.push('The recursion is deepening — are you looping or transforming?');
  }
  if (names.includes('The Gate') && names.includes('The Threshold')) {
    themes.push('You may be approaching an initiatory passage.');
  }

  return themes.length ? `\n\n🔁 *Recursive Hints:*\n- ${themes.join('\n- ')}` : '';
}
