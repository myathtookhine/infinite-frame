const { createClient } = require('@supabase/supabase-js');

/**
 * Supabase client initialized with service_role key
 * Bypasses RLS policies for server-side operations
 */
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

module.exports = supabase;
