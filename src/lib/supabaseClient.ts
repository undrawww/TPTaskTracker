import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

console.log("Supabase URL present:", !!supabaseUrl);
console.log("Supabase Key present:", !!supabaseAnonKey);
console.log("isSupabaseConfigured:", isSupabaseConfigured);

if (!isSupabaseConfigured) {
  console.warn(
    '⚠️ Supabase credentials not found. The app will run in demo mode.\n' +
    'Create a .env file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to connect to your database.'
  );
  alert("WARNING: Running in Demo Mode. Your environment variables were not detected. Please ensure .env exists and you restart the server.");
}

// Only create the real client when credentials exist; otherwise use a placeholder
// that will never actually be called (guarded by isSupabaseConfigured checks in hooks).
export const supabase: SupabaseClient = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : (null as unknown as SupabaseClient);
