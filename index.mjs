// index.mjs
import { extractSymbolsFromInput, getSymbolDetails } from './glossary.mjs';
import { getRelatedScholars } from './scholarReferences.mjs';

export default async function runFractalAdam(userInput) {
  const symbols = extractSymbolsFromInput(userInput);
  const scholars = getRelatedScholars(userInput);

  let symbolicNotes = '';

  if (symbols.length) {
    symbolicNotes += '**Symbols identified:**\n';
    for (const sym of symbols) {
      const details = getSymbolDetails(sym);
      if (details) {
        symbolicNotes += `- **${sym}** — Meaning: ${details.meaning}; Shadow: ${details.shadow}; Function: ${details.function}\n`;
      } else {
        symbolicNotes += `- **${sym}**\n`;
      }
    }
    symbolicNotes += '\n';
  }

  if (scholars.length) {
    symbolicNotes += '**Related scholars:**\n';
    for (const scholar of scholars) {
      symbolicNotes += `- ${scholar.name}\n`;
    }
    symbolicNotes += '\n';
  }

  return {
    symbolicNotes,
    symbols,
    scholars,
  };
}
