import { createClient } from '@supabase/supabase-js';
import { readAuthConfig } from './validation';
export const authConfig = readAuthConfig(import.meta.env);
export const supabase = authConfig.configured ? createClient(authConfig.url, authConfig.key, {
  auth: { flowType: 'pkce', persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, storageKey: 'filemate-auth-v1' },
}) : null;
