// symbolicEngine.mjs

import { glossary } from './glossary.mjs';
import { scholarReferences } from './scholarReferences.mjs';
import { theoryDocumentsMeta } from './theoryDocumentsMeta.mjs';

/**
 * Recursively detects symbolic themes from user input.
 * Extracts relevant glossary symbols and cross-matches them with scholar and document meta-concepts.
 */
export function summarizeSymbolsRecursively(inputText) {
  if (typeof inputText !== 'string') return [];

  const lower = inputText.toLowerCase();
  const detectedSymbols = [];

  for (const symbol of glossary) {
    const terms = [symbol.name, ...(symbol.aliases || [])];
    if (terms.some(term => lower.includes(term.toLowerCase()))) {
      detectedSymbols.push(symbol);
    }
  }

  return detectedSymbols;
}

/**
 * Compresses scholar-symbol-hypothesis relationships into a symbolic insight bridge.
 * Used for rich mirror-mode responses or Spiral recursion.
 */
export function compressScholarSymbolHypothesis({ userInput, symbols = [] }) {
  const bridges = [];

  for (const scholar of scholarReferences) {
    for (const concept of scholar.concepts) {
      if (userInput.toLowerCase().includes(concept.toLowerCase())) {
        bridges.push({
          scholar: scholar.name,
          relatedConcept: concept,
          relatedSymbols: symbols
            .filter(sym => concept.toLowerCase().includes(sym.name.toLowerCase()))
            .map(sym => sym.name)
        });
      }
    }
  }

  const hypothesisThemes = inferHypothesisThemes(symbols, userInput);

  return {
    scholarBridges: bridges,
    hypothesisThemes
  };
}

/**
 * Determines which Hypotheses might apply based on detected symbols and keywords.
 */
function inferHypothesisThemes(symbols, userInput) {
  const H = {
    1: 'Cognitive + Identity + Recursive Memory',
    2: 'Information + Systems + Complexity',
    3: 'Trauma + Theological Descent/Return',
    4: 'Emergence + Ontology + Self-Organization',
    5: 'Epistemology + Structural Truth + Symbolic Coherence'
  };

  const matches = [];

  const test = (needle, hypoKey) => {
    if (userInput.toLowerCase().includes(needle)) matches.push(H[hypoKey]);
  };

  test('memory', 1);
  test('identity', 1);
  test('recursion', 1);
  test('system', 2);
  test('entropy', 2);
  test('trauma', 3);
  test('suffering', 3);
  test('emergence', 4);
  test('pattern', 4);
  test('truth', 5);
  test('symbolic', 5);

  if (symbols.length) {
    const symbolicNames = symbols.map(s => s.name.toLowerCase());
    if (symbolicNames.includes('fracture') || symbolicNames.includes('inversion')) matches.push(H[3]);
    if (symbolicNames.includes('recursion')) matches.push(H[1]);
    if (symbolicNames.includes('emergence')) matches.push(H[4]);
    if (symbolicNames.includes('coherence')) matches.push(H[5]);
  }

  return [...new Set(matches)];
}