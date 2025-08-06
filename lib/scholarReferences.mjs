// scholarReferences.mjs

// Map of scholars and the concepts they are known for
const scholarConceptMap = {
  'Carl Jung': ['Archetypes', 'Collective Unconscious', 'Shadow Work'],
  'David Bohm': ['Implicate Order', 'Holoflux', 'Quantum Wholeness'],
  'Gregory Bateson': ['Double Bind', 'Cybernetics', 'Ecology of Mind'],
  'Teilhard de Chardin': ['Omega Point', 'Noosphere', 'Spiritual Evolution'],
  'Iain McGilchrist': ['Hemispheric Integration', 'Master/Emissary Dynamics'],
  'Alfred North Whitehead': ['Process Philosophy', 'Concrescence', 'Prehension'],
  'Rene Girard': ['Mimetic Desire', 'Scapegoating', 'Violence and the Sacred'],
  'John Vervaeke': ['Relevance Realization', '4E Cognition', 'Symbolic Navigation'],
  'Jordan Peterson': ['Narrative Identity', 'Mythic Structure', 'Responsibility'],
  'Maria Zambrano': ['Poetic Reason', 'Philosophical Aurora'],
  'Mei-Mei Berssenbrugge': ['Spiritual Coherence', 'Fractal Form', 'Emergent Poetics']
};

// Map of keywords or symbols to hypothesis themes
const symbolHypothesisThemes = {
  'Fracture': ['Trauma as Recursion', 'Fracture → Inversion Arc'],
  'Spiral': ['Emergent Complexity', 'Recursive Healing'],
  'Mirror': ['Symbolic Self-Reflection', 'Archetypal Echo'],
  'Shadow': ['Psycho-spiritual Integration', 'Jungian Descent'],
  'Light': ['Coherent Identity', 'Memory of Wholeness'],
  'Christ': ['Structural Archetype', 'Restorative Pattern'],
  'Voice': ['Expressive Emergence', 'Resonance as Realization']
};

// Function to find relevant scholars based on symbols
export function getRelatedScholars(symbols) {
  const scholarScores = {};

  for (const scholar in scholarConceptMap) {
    const concepts = scholarConceptMap[scholar];
    for (const symbol of symbols) {
      for (const concept of concepts) {
        if (
          symbol.name.toLowerCase().includes(concept.toLowerCase()) ||
          symbol.meaning.toLowerCase().includes(concept.toLowerCase())
        ) {
          scholarScores[scholar] = (scholarScores[scholar] || 0) + 1;
        }
      }
    }
  }

  // Return sorted scholars by relevance
  return Object.entries(scholarScores)
    .sort((a, b) => b[1] - a[1])
    .map(entry => entry[0]);
}

// Main compression function (used in prompt construction)
export function compressScholarSymbolHypothesis({ userInput, symbols }) {
  const scholarBridges = [];
  const hypothesisThemes = [];

  const relatedScholars = getRelatedScholars(symbols);

  for (const scholar of relatedScholars) {
    const relatedConcepts = scholarConceptMap[scholar];
    for (const concept of relatedConcepts) {
      const matchedSymbols = symbols.filter(sym =>
        sym.name.toLowerCase().includes(concept.toLowerCase()) ||
        sym.meaning.toLowerCase().includes(concept.toLowerCase())
      ).map(sym => sym.name);

      if (matchedSymbols.length > 0) {
        scholarBridges.push({
          scholar,
          relatedConcept: concept,
          relatedSymbols: [...new Set(matchedSymbols)]
        });
      }
    }
  }

  for (const symbol of symbols) {
    const themes = symbolHypothesisThemes[symbol.name];
    if (themes) {
      hypothesisThemes.push(...themes);
    }
  }

  return {
    scholarBridges: [...new Set(scholarBridges)],
    hypothesisThemes: [...new Set(hypothesisThemes)]
  };
}
