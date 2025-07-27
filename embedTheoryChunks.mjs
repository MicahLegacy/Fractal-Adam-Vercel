import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { theoryDocumentsMeta } from './theoryDocumentsMeta.mjs';

dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Path to unzipped theory chunks folder
const CHUNKS_DIR = './theory_chunks';

async function generateEmbedding(text) {
  const res = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: text
  });
  return res.data[0].embedding;
}

// Helper to extract base title from filename
function extractBaseTitle(filename) {
  return filename
    .replace(/ pt \d+\.txt$/, '')   // Remove " pt X.txt"
    .replace(/\.txt$/, '')          // Remove ".txt"
    .trim();
}

async function embedAndInsertAll() {
  const files = fs.readdirSync(CHUNKS_DIR);
  let count = 0;

  for (const file of files) {
    const fullPath = path.join(CHUNKS_DIR, file);
    const text = fs.readFileSync(fullPath, 'utf-8').trim();

    if (!text) {
      console.warn(`[SKIP] Empty or unreadable: ${file}`);
      continue;
    }

    const baseTitle = extractBaseTitle(file);
    const entry = Object.entries(theoryDocumentsMeta).find(([, meta]) =>
      meta.title.toLowerCase().startsWith(baseTitle.toLowerCase())
    );

    if (!entry) {
      console.warn(`[SKIP] No match for: ${file}`);
      continue;
    }

    const [doc_id, { title }] = entry;
    const embedding = await generateEmbedding(text);

    const { error } = await supabase.from('documents').insert({
      doc_id,
      chunk: text,
      embedding
    });

    if (error) {
      console.error(`[FAIL] ${file}:`, error);
    } else {
      count++;
      console.log(`[OK] Inserted "${file}" into "${title}"`);
    }
  }

  console.log(`\n✅ Total inserted: ${count}`);
}

embedAndInsertAll();
