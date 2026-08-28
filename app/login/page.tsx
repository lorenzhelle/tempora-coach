"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setSubmitting(false);
    if (signInError) {
      setError(signInError.message);
      return;
    }

    router.push("/");
    router.refresh();
  };

  return (
    <main className="flex min-h-dvh items-center justify-center bg-bg px-5">
      <div className="flex w-full max-w-[400px] flex-col gap-5 rounded-card border border-border bg-surface p-8">
        <h1 className="font-heading text-xl font-semibold">Sign in</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="email"
              className="font-heading text-xs tracking-[0.04em] text-text-muted uppercase"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="rounded-control border border-border bg-surface-2 px-3.5 py-2.5 text-[15px] focus:-outline-offset-1 focus:outline-[1.5px] focus:outline-accent"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="password"
              className="font-heading text-xs tracking-[0.04em] text-text-muted uppercase"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="rounded-control border border-border bg-surface-2 px-3.5 py-2.5 text-[15px] focus:-outline-offset-1 focus:outline-[1.5px] focus:outline-accent"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full cursor-pointer rounded-control bg-accent px-4 py-2.5 font-heading font-semibold text-accent-ink disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>
        {error && (
          <p role="alert" className="text-sm text-warn">
            {error}
          </p>
        )}
        <p className="text-sm text-text-muted">
          No account yet?{" "}
          <Link href="/signup" className="text-accent">
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}
