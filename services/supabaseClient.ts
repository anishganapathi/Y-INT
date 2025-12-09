/**
 * Supabase Client
 * Initialize and export Supabase client
 */

import { createClient } from '@supabase/supabase-js';
import { ENV } from '@/config/env';

// Create Supabase client
export const supabase = createClient(
  ENV.SUPABASE_URL,
  ENV.SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

// Helper to get or create anonymous user
export async function ensureUser() {
  try {
    // Check if user is logged in
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      console.log('✅ User already logged in:', user.id);
      return user;
    }

    // Try to get session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
      console.log('✅ Session found:', session.user.id);
      return session.user;
    }

    // Sign in anonymously if no user
    console.log('🔐 Signing in anonymously...');
    const { data, error } = await supabase.auth.signInAnonymously();
    
    if (error) {
      console.error('❌ Anonymous sign-in error:', error);
      throw error;
    }

    console.log('✅ Anonymous user created:', data.user?.id);
    return data.user;
  } catch (error) {
    console.error('❌ Error ensuring user:', error);
    throw error;
  }
}

