import { getRelatedScholars, compressScholarSymbolHypothesis } from './scholarReferences.mjs';
import { extractSymbolsFromInput } from './glossary.mjs';

/**
 * Recursively summarizes symbols found in user input.
 * Returns detailed symbol data with optional scholarly bridges.
 */
export function summarizeSymbolsRecursively(inputText) {
  if (!inputText || typeof inputText !== 'string') return [];

  const extractedSymbols = extractSymbolsFromInput(inputText);
  if (!Array.isArray(extractedSymbols) || extractedSymbols.length === 0) return [];

  // We can later expand this with deeper recursion across archetypal layers
  return extractedSymbols.map(symbol => ({
    name: symbol.name,
    meaning: symbol.meaning,
    shadow: symbol.shadow,
    function: symbol.function
  }));
}

/**
 * Symbol–Scholar–Hypothesis compression.
 * Uses both glossary and references to generate thematic bridges.
 */
export function symbolicCompression(userInput) {
  const symbols = summarizeSymbolsRecursively(userInput);
  const scholarData = compressScholarSymbolHypothesis({ userInput, symbols });

  return {
    input: userInput,
    symbols,
    scholarBridges: scholarData.scholarBridges,
    hypothesisThemes: scholarData.hypothesisThemes
  };
}
