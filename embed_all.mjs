import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import { generateEmbedding } from './openaiHelpers.mjs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEXT_DIR = path.join(__dirname, 'texts');
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function embedDocuments() {
  const files = fs.readdirSync(TEXT_DIR).filter(f =>
    f.endsWith('.txt') || f.endsWith('.md')
  );

  for (const filename of files) {
    try {
      const filePath = path.join(TEXT_DIR, filename);
      const content = fs.readFileSync(filePath, 'utf8');
      const embedding = await generateEmbedding(content);

      const { error } = await supabase.from('documents').insert([
        {
          content,
          embedding,
          metadata: { source: filename }
        }
      ]);

      if (error) {
        console.error(`❌ Failed to store ${filename}:`, error.message);
      } else {
        console.log(`✅ Stored ${filename}`);
      }

    } catch (err) {
      console.error(`💥 Error with ${filename}:`, err.message);
    }
  }
}

embedDocuments()
  .then(() => {
    console.log('🎉 All documents embedded and stored.');
    process.exit(0);
  })
  .catch(err => {
    console.error('🔥 Embedding script failed:', err);
    process.exit(1);
  });
