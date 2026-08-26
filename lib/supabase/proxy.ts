import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { supabasePublishableKey, supabaseUrl } from "@/lib/supabase/env";

// Refreshes the Supabase session cookie on every request. Called from
// proxy.ts (Next.js 16's renamed middleware.ts — see
// docs/decisions/0005-multi-user-supabase-auth.md). No route protection
// yet: there's nothing to protect until a real app route exists (Epic D,
// the dashboard) — that ticket adds its own redirect check on top of this
// session refresh.
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl(), supabasePublishableKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // getUser() (not getSession()) revalidates the token against Supabase's
  // Auth server, refreshing it proactively before it expires.
  await supabase.auth.getUser();

  return response;
}
