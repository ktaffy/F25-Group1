import dotenv from "dotenv";

dotenv.config();
if (!process.env.SUPABASE_URL) {
  throw new Error('SUPABASE_URL is required in .env file');
}

if (!process.env.SUPABASE_ANON_KEY) {
  throw new Error('SUPABASE_ANON_KEY is required in .env file');
}

export const env = {
  port: process.env.PORT || 3001,
  spoonKey: process.env.SPOONACULAR_API_KEY || "",
  apiBaseUrl: process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 3001}`,
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_ANON_KEY,
};