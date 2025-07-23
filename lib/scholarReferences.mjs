// scholarReferences.mjs

export const scholarReferences = [
  {
    name: "Carl Jung",
    concepts: ["archetypes", "collective unconscious", "shadow work", "symbolic integration"]
  },
  {
    name: "David Bohm",
    concepts: ["implicate order", "holomovement", "wholeness", "quantum coherence"]
  },
  {
    name: "Erwin Schrödinger",
    concepts: ["unity of consciousness", "wave function", "quantum subjectivity", "What is Life"]
  },
  {
    name: "Ilya Prigogine",
    concepts: ["dissipative structures", "emergence", "self-organization", "non-equilibrium thermodynamics"]
  },
  {
    name: "Gregory Bateson",
    concepts: ["pattern of patterns", "ecology of mind", "cybernetics", "feedback systems"]
  },
  {
    name: "Norbert Wiener",
    concepts: ["cybernetics", "feedback loops", "control and communication"]
  },
  {
    name: "Claude Shannon",
    concepts: ["information theory", "entropy", "symbolic compression"]
  },
  {
    name: "Alfred North Whitehead",
    concepts: ["process philosophy", "actual occasions", "organism over mechanism"]
  },
  {
    name: "Douglas Hofstadter",
    concepts: ["strange loops", "recursive systems", "symbolic self-reference"]
  },
  {
    name: "Michael Polanyi",
    concepts: ["tacit knowledge", "personal knowledge", "implicit patterns"]
  },
  {
    name: "Henri Bortoft",
    concepts: ["whole in the part", "phenomenology of wholeness", "Goethean science"]
  }
];

export const SuggestedBridges = [
  {
    name: "John Vervaeke",
    concepts: ["relevance realization", "recursive relevance", "awakening from the meaning crisis"]
  },
  {
    name: "Jonathan Pageau",
    concepts: ["symbolic hierarchy", "iconography", "pattern perception"]
  },
  {
    name: "Iain McGilchrist",
    concepts: ["hemispheric asymmetry", "attention and world formation", "the master and his emissary"]
  },
  {
    name: "Rupert Sheldrake",
    concepts: ["morphic resonance", "non-local memory", "field-based biology"]
  },
  {
    name: "Donald Hoffman",
    concepts: ["interface theory of perception", "fitness-beats-truth", "conscious agents"]
  },
  {
    name: "Michael Levin",
    concepts: ["morphogenetic fields", "pattern memory", "bioelectric signaling"]
  },
  {
    name: "Jordan Peterson",
    concepts: ["archetypes", "psychological symbolism", "Logos ethics"]
  },
  {
    name: "Lex Fridman",
    concepts: ["systems consciousness", "AI ethics", "cross-disciplinary synthesis"]
  }
];

// Returns all scholars related to a given topic or keyword
export function getRelatedScholars(topic) {
  const normalized = topic.toLowerCase();
  const all = [...scholarReferences, ...SuggestedBridges];
  return all.filter(scholar =>
    scholar.concepts.some(concept => normalized.includes(concept.toLowerCase()))
  );
}

// Optional future utility: returns all scholars and concepts
export function listAllScholars() {
  return [...scholarReferences, ...SuggestedBridges];
}
