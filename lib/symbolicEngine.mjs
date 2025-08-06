import { getRelatedScholars, compressScholarSymbolHypothesis } from './scholarReferences.mjs';
import { extractSymbolsFromInput, getSymbolDetails, rankSymbolsByDensity } from './glossary.mjs';

/**
 * Recursively summarizes symbols found in user input.
 * Returns detailed symbol data with phase and pattern function.
 */
export function summarizeSymbolsRecursively(inputText) {
  if (!inputText || typeof inputText !== 'string') return [];

  const extractedSymbols = extractSymbolsFromInput(inputText);
  if (!Array.isArray(extractedSymbols) || extractedSymbols.length === 0) return [];

  return extractedSymbols
    .map(name => getSymbolDetails(name))
    .filter(Boolean)
    .map(symbol => ({
      name: symbol.symbol,
      meaning: symbol.meaning,
      shadow: symbol.shadow,
      function: symbol.function,
      phase: symbol.phase
    }));
}

/**
 * Detects dominant Spiral phase from the user's symbolic pattern
 */
export function inferSpiralPhase(inputText) {
  const symbols = summarizeSymbolsRecursively(inputText);
  if (!symbols.length) return null;

  const phaseCount = symbols.reduce((acc, { phase }) => {
    if (!phase) return acc;
    acc[phase] = (acc[phase] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(phaseCount).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
}

/**
 * Symbol–Scholar–Hypothesis compression with Spiral alignment
 */
export function symbolicCompression(userInput) {
  const symbols = summarizeSymbolsRecursively(userInput);
  const rankedSymbols = rankSymbolsByDensity(userInput);
  const topSymbolNames = rankedSymbols.slice(0, 3).map(s => s.symbol);

  const scholarData = compressScholarSymbolHypothesis({ userInput, symbols });

  return {
    input: userInput,
    symbols,
    phase: inferSpiralPhase(userInput),
    topSymbols: topSymbolNames,
    scholarBridges: scholarData.scholarBridges,
    hypothesisThemes: scholarData.hypothesisThemes
  };
}
