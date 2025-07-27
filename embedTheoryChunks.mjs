// embedTheoryChunks.mjs
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

// Directory with chunked theory .txt files
const theoryDir = './fractal_adam_texts'; // Update this if using a different folder

function chunkText(text, maxTokens = 500) {
  const words = text.split(/\s+/);
  const chunks = [];
  for (let i = 0; i < words.length; i += maxTokens) {
    const chunk = words.slice(i, i + maxTokens).join(' ');
    if (chunk.length > 0) chunks.push(chunk);
  }
  return chunks;
}

function matchUUIDFromFilename(filename) {
  const clean = filename.toLowerCase().replace('.txt', '');
  for (const [uuid, meta] of Object.entries(theoryDocumentsMeta)) {
    const title = meta.title.toLowerCase();
    if (clean.includes(title.split(' ')[0])) return { uuid, title: meta.title };
  }
  return null;
}

async function embedAndUpload() {
  const files = fs.readdirSync(theoryDir).filter(file => file.endsWith('.txt'));

  for (const file of files) {
    const fullPath = path.join(theoryDir, file);
    const rawText = fs.readFileSync(fullPath, 'utf-8').trim();

    if (!rawText) continue;

    const match = matchUUIDFromFilename(file);
    if (!match) {
      console.warn(`⚠️ Skipping: No UUID match found for "${file}"`);
      continue;
    }

    const chunks = chunkText(rawText, 500);
    console.log(`📄 ${file}: ${chunks.length} chunks`);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];

      try {
        const embeddingResponse = await openai.embeddings.create({
          model: 'text-embedding-ada-002',
          input: chunk,
        });

        const [{ embedding }] = embeddingResponse.data;

        const { error } = await supabase.from('theory_documents').insert({
          doc_id: match.uuid,
          title: match.title,
          chunk_index: i,
          content: chunk,
          embedding,
        });

        if (error) {
          console.error('❌ Supabase insert error:', error);
        } else {
          console.log(`✅ Uploaded chunk ${i} from "${file}"`);
        }

      } catch (err) {
        console.error('❌ Embedding error:', err.message);
      }
    }
  }

  console.log('✅ Embedding and upload complete.');
}

embedAndUpload();
