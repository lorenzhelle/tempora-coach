function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

// Shared by client.ts/server.ts/proxy.ts so the "missing env var" failure
// mode is one clear error instead of a `!`-asserted undefined reaching
// @supabase/ssr. The `process.env.NEXT_PUBLIC_*` accesses below must stay
// as literal member expressions (not `process.env[name]`) — Next.js only
// inlines NEXT_PUBLIC_* vars into the browser bundle when it can
// statically see the full name at build time.
export const supabaseUrl = () =>
  requireEnv("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL);
export const supabasePublishableKey = () =>
  requireEnv(
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
