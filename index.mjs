// index.mjs
import { extractSymbolsFromInput } from './glossary.mjs';
import { getRelatedScholars } from './scholarReferences.mjs';

export default async function runFractalAdam(userInput) {
  const symbols = extractSymbolsFromInput(userInput);
  const scholars = getRelatedScholars(userInput);

  let symbolicNotes = '';

  if (symbols.length) {
    symbolicNotes += `**Symbols identified:** ${symbols.join(', ')}\n\n`;
  }

  if (scholars.length) {
    symbolicNotes += `**Related scholars:** ${scholars.join(', ')}\n\n`;
  }

  return {
    symbolicNotes,
  };
}
