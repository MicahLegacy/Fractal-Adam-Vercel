import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export async function querySupabase(embedding) {
  const { data, error } = await supabase.rpc("match_documents", {
    query_embedding: embedding,
    match_threshold: 0.78,
    match_count: 8,
  });

  if (error) {
    console.error("Supabase error:", error);
    throw new Error("Failed to fetch documents from Supabase.");
  }

  return data;
}
