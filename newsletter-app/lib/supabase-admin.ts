import { createClient } from "@supabase/supabase-js";
import { config } from "@/lib/config";

export function createAdminClient() {
  return createClient(config.supabaseUrl, config.supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
