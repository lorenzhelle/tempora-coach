import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabasePublishableKey, supabaseUrl } from "@/lib/supabase/env";

// Server-side Supabase client — for use in Server Components and Route
// Handlers, where reading/writing auth cookies goes through next/headers'
// cookies() instead of document.cookie (see lib/supabase/client.ts for the
// browser equivalent). Session refresh itself happens in proxy.ts, so
// setAll here can be a no-op when called from a Server Component (see
// docs/decisions/0005-multi-user-supabase-auth.md).
export const createClient = async () => {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl(), supabasePublishableKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component, where cookies can't be
          // written — safe to ignore because proxy.ts already refreshes
          // the session cookie on every request.
        }
      },
    },
  });
};
