function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

// Shared by client.ts/server.ts/proxy.ts so the "missing env var" failure
// mode is one clear error instead of a `!`-asserted undefined reaching
// @supabase/ssr.
export const supabaseUrl = () => requireEnv("NEXT_PUBLIC_SUPABASE_URL");
export const supabasePublishableKey = () =>
  requireEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
