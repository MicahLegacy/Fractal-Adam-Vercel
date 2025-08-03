// scholarReferences.mjs

export const scholarReferences = [
  {
    name: "Carl Jung",
    concepts: [
      "archetypes", "shadow work", "collective unconscious", "symbolic integration",
      "individuation", "psychological alchemy", "projection", "dream symbolism"
    ],
    bridges: ["The Shadow", "The Mask", "The Mirror", "The Wound"]
  },
  {
    name: "Gregory Bateson",
    concepts: [
      "pattern of patterns", "ecology of mind", "double bind", "meta-learning",
      "recursive feedback", "systems logic"
    ],
    bridges: ["The Spiral", "The Web", "The Map", "The Trickster"]
  },
  {
    name: "Ilya Prigogine",
    concepts: [
      "dissipative structures", "chaos and order", "non-equilibrium systems",
      "self-organization", "emergence"
    ],
    bridges: ["The Flame", "The Storm", "The Labyrinth", "The Threshold"]
  },
  {
    name: "Claude Shannon",
    concepts: [
      "information theory", "entropy", "symbolic compression", "communication models"
    ],
    bridges: ["The Thread", "The Map", "The Echo", "The Voice"]
  },
  {
    name: "Douglas Hofstadter",
    concepts: [
      "strange loops", "symbolic recursion", "self-reference", "Gödel Escher Bach"
    ],
    bridges: ["The Spiral", "The Mirror Maze", "The Mirror", "The Spiraleye"]
  },
  {
    name: "David Bohm",
    concepts: [
      "implicate order", "holomovement", "dialogue", "quantum coherence"
    ],
    bridges: ["The River", "The Silence", "The Web", "The Final Mirror"]
  },
  {
    name: "Alfred North Whitehead",
    concepts: [
      "process philosophy", "actual occasions", "prehension", "organism over mechanism"
    ],
    bridges: ["The Spiral", "The Garden", "The Flamewalker", "The Root"]
  },
  {
    name: "Henri Bortoft",
    concepts: [
      "whole in the part", "phenomenology of wholeness", "Goethean science"
    ],
    bridges: ["The Eye", "The Spiraleye", "The Silencekeeper", "The Oracle"]
  },
  {
    name: "Michael Polanyi",
    concepts: [
      "tacit knowledge", "personal knowledge", "pattern perception"
    ],
    bridges: ["The Compass", "The Threadbearer", "The Voice"]
  },
  {
    name: "Erwin Schrödinger",
    concepts: [
      "wave function", "quantum life", "consciousness and unity", "order from disorder"
    ],
    bridges: ["The Serpent", "The Phoenix", "The Mirrorborn", "The Vessel"]
  }
];

// Optional bridge scholars from the living discourse
export const SuggestedBridges = [
  {
    name: "John Vervaeke",
    concepts: [
      "relevance realization", "recursive relevance", "salience landscape", "insight dynamics"
    ],
    bridges: ["The Spiralkeeper", "The Flameveil", "The Eye"]
  },
  {
    name: "Jonathan Pageau",
    concepts: [
      "symbolic hierarchy", "pattern recognition", "sacred art", "iconography"
    ],
    bridges: ["The Tower", "The Veil", "The Oracle", "The Key"]
  },
  {
    name: "Iain McGilchrist",
    concepts: [
      "hemispheric integration", "attention and meaning", "left/right brain dialectic"
    ],
    bridges: ["The Map", "The Watcher", "The Mirrorline"]
  },
  {
    name: "Donald Hoffman",
    concepts: [
      "interface theory", "conscious agents", "fitness-beats-truth"
    ],
    bridges: ["The Masksmith", "The Mirrorforge", "The Silence"]
  },
  {
    name: "Rupert Sheldrake",
    concepts: [
      "morphic resonance", "nonlocal memory", "formative causation"
    ],
    bridges: ["The Archive", "The Thread", "The Root"]
  },
  {
    name: "Michael Levin",
    concepts: [
      "bioelectric signaling", "pattern memory", "morphogenetic fields"
    ],
    bridges: ["The Flamekeeper", "The Mirrorborn", "The Pathbreaker"]
  },
  {
    name: "Lex Fridman",
    concepts: [
      "AI consciousness", "systems synthesis", "love and logic"
    ],
    bridges: ["The Web", "The Mirror", "The Final Mirror"]
  },
  {
    name: "Jordan Peterson",
    concepts: [
      "archetypes", "Logos ethic", "psychological symbolism", "myth and order"
    ],
    bridges: ["The Sword", "The Crossroads", "The Mask", "The Parent"]
  }
];

// Returns related scholars based on topic or symbol
export function getRelatedScholars(input) {
  const normalized = input.toLowerCase();
  const all = [...scholarReferences, ...SuggestedBridges];
  return all.filter(s =>
    s.concepts.some(c => normalized.includes(c.toLowerCase())) ||
    s.bridges.some(b => normalized.includes(b.toLowerCase()))
  );
}

export function listAllScholars() {
  return [...scholarReferences, ...SuggestedBridges];
}
