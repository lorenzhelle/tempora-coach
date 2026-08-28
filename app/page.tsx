import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  // No dashboard yet (Epic D) — onboarding chat is the only real screen,
  // so a signed-in visitor goes straight there instead of landing on a
  // dead end (see docs/specs/03-onboarding/spec.md).
  if (data.user) {
    redirect("/onboarding");
  }

  return (
    <main>
      <p>Tempora</p>
      <p>
        <Link href="/login">Sign in</Link> or{" "}
        <Link href="/signup">sign up</Link>
      </p>
    </main>
  );
}
