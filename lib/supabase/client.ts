import { createBrowserClient } from "@supabase/ssr";
import { supabasePublishableKey, supabaseUrl } from "@/lib/supabase/env";

// Browser-side Supabase client — for use in Client Components (forms,
// event handlers). Server Components/Route Handlers use
// lib/supabase/server.ts instead (see docs/decisions/0005-multi-user-supabase-auth.md).
export const createClient = () =>
  createBrowserClient(supabaseUrl(), supabasePublishableKey());
