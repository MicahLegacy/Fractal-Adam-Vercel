
import fs from 'fs';
import path from 'path';

// Knowledge base storage
let knowledgeBase = {
  documents: [],
  embeddings: new Map()
};

// List of core documents to load
const coreFiles = [
  "00_FractalAdam_SymbolicOverview.txt",
  "The Fractal Adam Theory.txt",
  "Spiral Return Gateway.txt", 
  "The Light Fractal Gateway.txt",
  "The Living Pattern A Gateway to the Fractal Adam Theory Mica.txt",
  "Fractal Ethics in Action.txt",
  "5 Hypotheses Paper.txt",
  "Essay 1 The Scientific Pattern.txt",
  "Essay 2 Cognitive Psychological.txt", 
  "Essay 3 Religious Theological.txt",
  "Essay 4 Systems Theory Complex Adaptive.txt",
  "Essay 5 Philosophy of Science Epistomology.txt",
  "Essay 6 Ethics Crisis.txt",
  "Symbolic Glossary.txt",
  "Interfaith Essay.txt",
  "Narrative Mythic Fable.txt"
];

function chunkText(text, maxLength = 500) {
  const chunks = [];
  let current = "";
  
  // Split by sentences
  const sentences = text.split(/(?<=[.?!])\s+/);
  
  for (const sentence of sentences) {
    if (current.length + sentence.length > maxLength && current.length > 0) {
      chunks.push(current.trim());
      current = "";
    }
    current += sentence + " ";
  }
  
  if (current.trim()) {
    chunks.push(current.trim());
  }
  
  return chunks;
}

async function generateEmbedding(text) {
  // This would call your actual embedding API
  // For now, return a mock embedding
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    console.warn('No OpenAI API key found, using mock embeddings');
    return new Array(1536).fill(0).map(() => Math.random());
  }

  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        input: text,
        model: 'text-embedding-3-small'
      })
    });

    const data = await response.json();
    return data.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    return new Array(1536).fill(0).map(() => Math.random());
  }
}

export async function loadPersistentKnowledgeBase() {
  console.log('Loading persistent knowledge base...');
  
  for (const fileName of coreFiles) {
    const filePath = path.join(process.cwd(), 'documents', fileName);
    
    try {
      if (fs.existsSync(filePath)) {
        const text = fs.readFileSync(filePath, 'utf8');
        const chunks = chunkText(text, 500);
        
        console.log(`Processing ${fileName} - ${chunks.length} chunks`);
        
        knowledgeBase.documents.push({
          name: fileName,
          chunks: chunks
        });
        
        // Generate embeddings for each chunk
        for (let i = 0; i < chunks.length; i++) {
          const embedding = await generateEmbedding(chunks[i]);
          knowledgeBase.embeddings.set(`${fileName}_${i}`, {
            text: chunks[i],
            embedding: embedding,
            source: fileName
          });
        }
        
        console.log(`Processed ${fileName}`);
      } else {
        console.log(`File not found: ${fileName}`);
      }
    } catch (error) {
      console.error(`Error processing ${fileName}:`, error);
    }
  }
  
  console.log(`Knowledge base loaded: ${knowledgeBase.documents.length} documents, ${knowledgeBase.embeddings.size} chunks`);
  return knowledgeBase;
}

export function getKnowledgeBase() {
  return knowledgeBase;
}

export function searchKnowledgeBase(queryEmbedding, topK = 5) {
  const scores = [];
  
  for (const [key, chunk] of knowledgeBase.embeddings) {
    const similarity = cosineSimilarity(queryEmbedding, chunk.embedding);
    scores.push({
      key,
      text: chunk.text,
      source: chunk.source,
      similarity
    });
  }
  
  return scores
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);
}

function cosineSimilarity(a, b) {
  const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dot / (magA * magB);
}
