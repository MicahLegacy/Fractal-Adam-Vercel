import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// === CONFIGURATION ===
const theoryDir = './Fractal_Adam_Full_Knowledge_Base';
const mappingPath = './theory_chunk_doc_map.json';
const targetTable = 'fractal_theory_chunks';
const model = 'text-embedding-ada-002';
const CHUNK_MIN_LENGTH = 50;  // skip chunks shorter than this

// === LOAD MAPPING ===
const rawMap = fs.readFileSync(mappingPath, 'utf-8');
const filenameToUUIDMap = JSON.parse(rawMap);

// === EMBED TEXT ===
async function embedText(text) {
  const response = await openai.embeddings.create({
    model,
    input: text
  });
  return response.data[0].embedding;
}

// === MAIN FUNCTION ===
async function run() {
  const files = fs.readdirSync(theoryDir).filter(f => f.endsWith('.txt'));

  for (const file of files) {
    const fullPath = path.join(theoryDir, file);
    const content = fs.readFileSync(fullPath, 'utf-8').trim();

    if (content.length < CHUNK_MIN_LENGTH) {
      console.log(`Skipping short file: ${file}`);
      continue;
    }

    const baseName = file.replace(/_pt\d+\.txt$/, '.txt'); // normalize to map key
    const doc_id = filenameToUUIDMap[baseName];

    if (!doc_id) {
      console.warn(`No doc_id found for file: ${file}`);
      continue;
    }

    try {
      const embedding = await embedText(content);
      const { error } = await supabase.from(targetTable).insert({
        chunk: content,
        embedding,
        doc_id
      });

      if (error) {
        console.error(`[Supabase Error] ${file}`, error);
      } else {
        console.log(`[Success] Uploaded: ${file}`);
      }

    } catch (err) {
      console.error(`[OpenAI Error] ${file}`, err.message);
    }
  }

  console.log('✅ Embedding complete.');
}

run();
