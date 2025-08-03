// symbolicEngine.mjs

import { glossary } from './glossary.mjs';

/**
 * Extracts relevant symbols from input text by scanning for symbol keywords.
 */
export function extractSymbolMatches(inputText) {
  const lowered = inputText.toLowerCase();
  return glossary.filter(({ symbol }) =>
    lowered.includes(symbol.toLowerCase())
  );
}

/**
 * Generates a recursive summary of symbolic states from input.
 * Includes each symbol's meaning, shadow, and function.
 */
export function summarizeSymbolsRecursively(inputText) {
  const matches = extractSymbolMatches(inputText);

  if (!matches.length) return "No symbolic matches found in this pattern.";

  return matches
    .map(({ symbol, meaning, shadow, function: fn }) => {
      return `🜁 **${symbol}**  
— Meaning: ${meaning}  
— Shadow: ${shadow}  
— Function: ${fn}`;
    })
    .join('\n\n');
}

/**
 * Determines symbolic density and narrative depth based on how many symbols are present.
 */
export function calculateSymbolicDensity(inputText) {
  const totalSymbols = glossary.length;
  const matchedSymbols = extractSymbolMatches(inputText).length;
  const density = (matchedSymbols / totalSymbols).toFixed(2);

  if (density === '0.00') return 'Symbolic density: Minimal';
  if (density < 0.1) return 'Symbolic density: Low';
  if (density < 0.2) return 'Symbolic density: Moderate';
  return 'Symbolic density: High';
}

/**
 * Builds a symbolic analysis block to append to prompts or use in insight threads.
 */
export function buildSymbolicAnalysis(inputText) {
  const summary = summarizeSymbolsRecursively(inputText);
  const density = calculateSymbolicDensity(inputText);
  return `${density}\n\n${summary}`;
}
